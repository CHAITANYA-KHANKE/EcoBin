import sys
import os
import shutil
import base64
import json
import urllib.request
import urllib.error
from datetime import datetime, timedelta
from flask import Flask, request, jsonify, abort, send_from_directory

# Support imports when running directly from inside the backend directory
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from backend.mock_data import (
    generate_smart_bins,
    generate_historical_logs,
    generate_trucks,
    generate_complaints
)
from backend.optimizer import (
    run_rapids_benchmark,
    solve_tsp,
    predict_bin_fill_rate,
    USING_RAPIDS
)

from dotenv import load_dotenv

# Load Environment variables
load_dotenv(dotenv_path=os.path.join(os.path.dirname(__file__), ".env"))
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY", "")

# Initialize Flask App
app = Flask(__name__)

# Custom CORS Handler to avoid installing extra libraries
@app.after_request
def add_cors_headers(response):
    response.headers.add('Access-Control-Allow-Origin', '*')
    response.headers.add('Access-Control-Allow-Headers', 'Content-Type,Authorization')
    response.headers.add('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS')
    return response

# Create upload directory if not exists
UPLOAD_DIR = os.path.join(os.path.dirname(__file__), "uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)

# Endpoint to serve uploaded files statically
@app.route("/api/uploads/<path:filename>", methods=["GET"])
def serve_upload(filename):
    return send_from_directory(UPLOAD_DIR, filename)

# In-Memory State for Hackathon Session
STATE = {
    "bins": generate_smart_bins(),
    "trucks": generate_trucks(),
    "complaints": generate_complaints(),
    "historical_logs": []
}
STATE["historical_logs"] = generate_historical_logs(STATE["bins"])

# Check API Connectivity using raw urllib request
IS_API_CONNECTED = False
if OPENAI_API_KEY and not OPENAI_API_KEY.startswith("sk-proj-YOUR"):
    # Simple check to see if key format is correct
    if OPENAI_API_KEY.startswith("sk-"):
        IS_API_CONNECTED = True

def make_openai_direct_call(messages, response_format=None, max_tokens=300):
    """
    Makes a direct REST API call to OpenAI chat completions endpoint.
    Bypasses SDK wrapper monkeypatches to prevent 'proxies' keyword arguments issues.
    """
    url = "https://api.openai.com/v1/chat/completions"
    headers = {
        "Authorization": f"Bearer {OPENAI_API_KEY}",
        "Content-Type": "application/json"
    }
    payload = {
        "model": "gpt-4o-mini",
        "messages": messages,
        "max_tokens": max_tokens,
        "temperature": 0.5
    }
    if response_format:
        payload["response_format"] = response_format

    data_bytes = json.dumps(payload).encode("utf-8")
    req = urllib.request.Request(url, data=data_bytes, headers=headers, method="POST")
    
    try:
        with urllib.request.urlopen(req, timeout=15) as response:
            res_body = json.loads(response.read().decode("utf-8"))
            return res_body["choices"][0]["message"]["content"]
    except urllib.error.HTTPError as e:
        error_content = e.read().decode("utf-8")
        print(f"OpenAI HTTPError {e.code}: {error_content}")
        raise Exception(f"OpenAI API error: {error_content}")
    except Exception as e:
        print(f"OpenAI Direct API Call Failed: {e}")
        raise e

@app.route("/api/status", methods=["GET"])
def get_status():
    """
    Returns system status, active integrations, and performance mode.
    """
    return jsonify({
        "status": "healthy",
        "api_connected": IS_API_CONNECTED,
        "gpu_accelerated": USING_RAPIDS,
        "acceleration_library": "NVIDIA cuDF (RAPIDS)" if USING_RAPIDS else "Pandas (CPU-fallback Mode)"
    })

@app.route("/api/dashboard", methods=["GET"])
def get_dashboard_data():
    """
    Calculates current stats and aggregates alerts for the operations board.
    """
    bins = STATE["bins"]
    complaints = STATE["complaints"]
    
    # Aggregations
    total_bins = len(bins)
    total_capacity = sum(b["capacity"] for b in bins)
    total_current_fill = sum(b["capacity"] * (b["fill_rate"] / 100.0) for b in bins)
    avg_fill_percent = round((total_current_fill / total_capacity) * 100, 1)
    
    # Anomaly alerts
    alerts = []
    for b in bins:
        if b["fill_rate"] >= 90:
            alerts.append({
                "type": "Critical Overflow",
                "message": f"Smart Bin {b['id']} ({b['name']}) is at {b['fill_rate']}% capacity.",
                "severity": "High",
                "bin_id": b["id"]
            })
        elif b["fill_rate"] >= 75:
            alerts.append({
                "type": "High Warning",
                "message": f"Smart Bin {b['id']} ({b['name']}) is filling up fast ({b['fill_rate']}%).",
                "severity": "Medium",
                "bin_id": b["id"]
            })
            
    # Add pending complaints to alerts
    pending_complaints = [c for c in complaints if c["status"] == "Pending"]
    for comp in pending_complaints:
        alerts.append({
            "type": "Citizen Complaint",
            "message": f"New report reported: {comp['description'][:60]}...",
            "severity": "High" if comp["severity"] == "High" else "Medium",
            "ticket_id": comp["id"]
        })
        
    total_waste_collected_tons = round(sum(b["capacity"] * 0.08 for b in bins if b["fill_rate"] < 40) + 12.4, 1)
    carbon_saved_kg = round(total_waste_collected_tons * 115.5, 1)
    
    return jsonify({
        "stats": {
            "total_waste_collected_tons": total_waste_collected_tons,
            "avg_bin_fill_rate": avg_fill_percent,
            "active_complaints": len([c for c in complaints if c["status"] != "Resolved"]),
            "carbon_saved_kg": carbon_saved_kg
        },
        "bins": bins,
        "trucks": STATE["trucks"],
        "alerts": alerts
    })

@app.route("/api/route-optimize", methods=["POST", "OPTIONS"])
def optimize_route():
    if request.method == "OPTIONS":
        return jsonify({"status": "ok"})
        
    bins = STATE["bins"]
    complaints = STATE["complaints"]
    
    collection_targets = []
    for b in bins:
        if b["fill_rate"] >= 60:
            collection_targets.append({
                "id": b["id"],
                "name": b["name"],
                "lat": b["lat"],
                "lng": b["lng"]
            })
            
    for comp in complaints:
        if comp["status"] in ["Pending", "Assigned"]:
            collection_targets.append({
                "id": comp["id"],
                "name": f"Citizen Ticket: {comp['id']}",
                "lat": comp["lat"],
                "lng": comp["lng"]
            })
            
    if not collection_targets:
        return jsonify({
            "route": [],
            "total_distance_km": 0.0,
            "distance_saved_km": 0.0,
            "benchmark": {
                "record_count": 0,
                "cpu_execution_time_ms": 0.0,
                "gpu_execution_time_ms": 0.0,
                "speedup_factor": 1.0
            }
        })
        
    depot_coords = (19.9615, 79.2961)
    route, total_dist, saved_dist = solve_tsp(depot_coords, collection_targets)
    benchmark_results = run_rapids_benchmark(STATE["historical_logs"])
    
    return jsonify({
        "route": route,
        "total_distance_km": total_dist,
        "distance_saved_km": saved_dist,
        "benchmark": benchmark_results
    })

@app.route("/api/bins/<bin_id>/predictions", methods=["GET"])
def get_bin_predictions(bin_id):
    bin_obj = next((b for b in STATE["bins"] if b["id"] == bin_id), None)
    if not bin_obj:
        abort(404, description="Smart Bin not found")
        
    predictions = predict_bin_fill_rate(bin_id, STATE["historical_logs"])
    return jsonify({
        "bin_id": bin_id,
        "bin_name": bin_obj["name"],
        "predictions": predictions
    })

@app.route("/api/citizen-report", methods=["POST", "OPTIONS"])
def create_citizen_report():
    if request.method == "OPTIONS":
        return jsonify({"status": "ok"})
        
    description = request.form.get("description", "")
    try:
        latitude = float(request.form.get("latitude", 19.9615))
        longitude = float(request.form.get("longitude", 79.2961))
    except ValueError:
        abort(400, description="Invalid latitude or longitude")
        
    image_file = request.files.get("image", None)
    ticket_id = f"TICKET-{len(STATE['complaints']) + 101}"
    file_path = ""
    
    if image_file:
        file_ext = image_file.filename.split(".")[-1] if "." in image_file.filename else "jpg"
        file_name = f"{ticket_id}.{file_ext}"
        file_path = os.path.join(UPLOAD_DIR, file_name)
        image_file.save(file_path)
            
    category = "Organic"
    severity = "Medium"
    ai_analysis = "Standard incident logged by citizen."
    is_valid = True
    
    if image_file and IS_API_CONNECTED:
        try:
            with open(file_path, "rb") as img_file:
                encoded_image = base64.b64encode(img_file.read()).decode("utf-8")
                
            messages = [
                {
                    "role": "system",
                    "content": (
                        "You are a Smart City Environmental AI. Analyze this image of reported community waste. "
                        "You must respond in strict JSON format. "
                        "JSON Schema: {\"isValid\": boolean, \"wasteType\": \"Organic\"|\"Recyclable\"|\"Hazardous\"|\"Electronic\", "
                        "\"severity\": \"High\"|\"Medium\"|\"Low\", \"analysis\": string}"
                    )
                },
                {
                    "role": "user",
                    "content": [
                        {"type": "text", "text": f"Citizen description: '{description}'. Validate if this image contains waste, identify classification, and rate hazard severity."},
                        {
                            "type": "image_url",
                            "image_url": {
                                "url": f"data:image/jpeg;base64,{encoded_image}"
                            }
                        }
                    ]
                }
            ]
            
            response_text = make_openai_direct_call(
                messages=messages, 
                response_format={"type": "json_object"}, 
                max_tokens=250
            )
            
            ai_res = json.loads(response_text)
            is_valid = ai_res.get("isValid", True)
            category = ai_res.get("wasteType", "Organic")
            severity = ai_res.get("severity", "Medium")
            ai_analysis = ai_res.get("analysis", "Validated by OpenAI Vision API.")
            
        except Exception as e:
            print(f"Error during OpenAI Vision API: {e}")
            ai_analysis = f"Image saved. (API Fallback activated: {e})"
    else:
        # Local heuristic parser
        desc_lower = description.lower()
        if "plastic" in desc_lower or "bottle" in desc_lower or "paper" in desc_lower or "carton" in desc_lower:
            category = "Recyclable"
        elif "battery" in desc_lower or "wire" in desc_lower or "chemical" in desc_lower or "paint" in desc_lower:
            category = "Hazardous"
            severity = "High"
        elif "smell" in desc_lower or "food" in desc_lower or "rotten" in desc_lower or "vegetable" in desc_lower:
            category = "Organic"
            severity = "High"
            
        ai_analysis = "Incident categorized automatically by local text heuristics (Demo Mode)."
        
    if not is_valid:
        if os.path.exists(file_path):
            os.remove(file_path)
        return jsonify({"detail": "Invalid report. Image does not contain city waste."}), 400
        
    new_ticket = {
        "id": ticket_id,
        "lat": latitude,
        "lng": longitude,
        "description": description,
        "category": category,
        "severity": severity,
        "status": "Pending",
        "created_at": datetime.now().isoformat(),
        "ai_analysis": ai_analysis
    }
    
    STATE["complaints"].append(new_ticket)
    return jsonify(new_ticket)

@app.route("/api/complaints", methods=["GET"])
def get_complaints():
    return jsonify(STATE["complaints"])

@app.route("/api/complaints/resolve", methods=["POST", "OPTIONS"])
def resolve_complaint():
    if request.method == "OPTIONS":
        return jsonify({"status": "ok"})
        
    req_data = request.get_json() or {}
    ticket_id = req_data.get("ticket_id", "")
    
    ticket = next((c for c in STATE["complaints"] if c["id"] == ticket_id), None)
    if not ticket:
        abort(404, description="Complaint ticket not found")
    ticket["status"] = "Resolved"
    return jsonify(ticket)

@app.route("/api/chat", methods=["POST", "OPTIONS"])
def chat_with_data():
    if request.method == "OPTIONS":
        return jsonify({"status": "ok"})
        
    req_data = request.get_json() or {}
    query_message = req_data.get("message", "")
    
    bins_summary = [
        {"id": b["id"], "name": b["name"], "fill": f"{b['fill_rate']}%", "type": b["type"]}
        for b in STATE["bins"]
    ]
    complaints_summary = [
        {"id": c["id"], "desc": c["description"], "severity": c["severity"], "status": c["status"]}
        for c in STATE["complaints"] if c["status"] != "Resolved"
    ]
    
    system_prompt = (
        "You are the Decision Intelligence Advisor for CommunityPulse AI. "
        "Your task is to analyze smart city operations and answer queries from the City Planner. "
        "Keep your response structured, actionable, and concise. Highlight recommendations clearly. "
        f"\n\nCURRENT TELEMETRY STATUS:\n- Total Smart Bins: {len(STATE['bins'])}\n"
        f"- Active Bins Detail: {bins_summary}\n"
        f"- Pending Citizen Tickets: {complaints_summary}\n"
    )
    
    if IS_API_CONNECTED:
        try:
            messages = [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": query_message}
            ]
            answer = make_openai_direct_call(messages=messages, max_tokens=350)
        except Exception as e:
            print(f"Error during OpenAI Chat direct call: {e}")
            answer = f"RAG Endpoint Encountered an error: {e}"
    else:
        # Local Rule-based Responder
        msg_lower = query_message.lower()
        if "priority" in msg_lower or "critical" in msg_lower or "ward" in msg_lower:
            high_bins = [b for b in STATE["bins"] if b["fill_rate"] >= 75]
            high_bins_str = ", ".join([f"{b['id']} ({b['fill_rate']}%)" for b in high_bins]) if high_bins else "None"
            answer = (
                "### Operations Priority Alert\n"
                f"- **Bins Exceeding Warning Threshold (>=75%)**: {high_bins_str}.\n"
                f"- **Active Citizen Reports**: We currently have {len(complaints_summary)} unresolved reports.\n"
                "**Recommendation**: Run the *NVIDIA RAPIDS Route Optimizer* to immediately clear high-fill bins."
            )
        elif "status" in msg_lower or "summary" in msg_lower:
            avg_fill = round(sum(b["fill_rate"] for b in STATE["bins"]) / len(STATE["bins"]), 1)
            answer = (
                "### Smart City Status Summary\n"
                f"- **Average Fill Level**: {avg_fill}%\n"
                f"- **Critical Overflows**: {len([b for b in STATE['bins'] if b['fill_rate'] >= 90])} bins require collection.\n"
                "**Optimization Tip**: Grid carbon footprint can be reduced by 14.5% if collections are routed dynamically."
            )
        else:
            answer = (
                "### EcoBin Analytics Response\n"
                "Welcome to CommunityPulse AI. You can ask queries regarding waste volume, routes, or citizen complaints. \n\n"
                "**Try asking**:\n"
                "- *'Which bins need priority pickup?'*\n"
                "- *'Show me a status summary of the city'*."
            )
            
    return jsonify({"response": answer})

if __name__ == "__main__":
    # Dynamically bind port for hosting environments (like Render or GCP)
    import os
    port = int(os.environ.get("PORT", 8000))
    app.run(host="0.0.0.0", port=port, debug=False)
