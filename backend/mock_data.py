import random
from datetime import datetime, timedelta

# Center coordinates: Chandrapur, Maharashtra, India
CENTER_LAT = 19.9615
CENTER_LNG = 79.2961

# Real landmarks and zones in Chandrapur, Maharashtra
BIN_LOCATIONS = [
    {"name": "Gandhi Chowk Bazar Area", "lat": 19.9575, "lng": 79.2965, "type": "Organic"},
    {"name": "Civil Lines - Collectorate Office", "lat": 19.9720, "lng": 79.2882, "type": "Recyclable"},
    {"name": "Urjanagar Colony Gate (CSTPS)", "lat": 20.0050, "lng": 79.2830, "type": "Hazardous"},
    {"name": "Ramnagar - Near Priyadarshini Chowk", "lat": 19.9695, "lng": 79.2995, "type": "Recyclable"},
    {"name": "Babu Peth Main Bazar Rd", "lat": 19.9540, "lng": 79.3140, "type": "Organic"},
    {"name": "Mul Road Crossing Near Stadium", "lat": 19.9630, "lng": 79.3110, "type": "Recyclable"},
    {"name": "Pathanpura Gate Heritage Site", "lat": 19.9472, "lng": 79.3005, "type": "Organic"},
    {"name": "Padoli Junction - Wardha Rd", "lat": 19.9985, "lng": 79.2642, "type": "Recyclable"},
    {"name": "Bagad Khidki Area", "lat": 19.9520, "lng": 79.2905, "type": "Hazardous"},
    {"name": "Ballarpur Road - MIDC Entrance", "lat": 19.9245, "lng": 79.3120, "type": "Hazardous"},
    {"name": "Tadoba Road - Rayatwari Colliery", "lat": 19.9782, "lng": 79.2785, "type": "Organic"},
    {"name": "Jatpura Gate Chowk", "lat": 19.9622, "lng": 79.2942, "type": "Recyclable"}
]

# Generate Smart Bins
def generate_smart_bins():
    bins = []
    for idx, loc in enumerate(BIN_LOCATIONS):
        # High fill rates to demonstrate collection urgency and route optimizer
        fill_rate = random.randint(30, 96)
        capacity = random.choice([100, 120, 150])
        battery = random.randint(60, 99)
        bins.append({
            "id": f"BIN-{idx+1:03d}",
            "name": loc["name"],
            "lat": loc["lat"],
            "lng": loc["lng"],
            "type": loc["type"],
            "capacity": capacity,
            "fill_rate": fill_rate,
            "battery": battery,
            "last_pickup": (datetime.now() - timedelta(hours=random.randint(4, 28))).isoformat()
        })
    return bins

# Generate historical logs for 7 days (hourly) for forecasting
def generate_historical_logs(bins):
    logs = []
    end_time = datetime.now()
    start_time = end_time - timedelta(days=7)
    
    current_time = start_time
    while current_time <= end_time:
        for idx, b in enumerate(bins):
            hour = current_time.hour
            # Diurnal trash accumulation (peak in Indian markets: 9am-1pm & 5pm-9pm)
            if 9 <= hour <= 13 or 17 <= hour <= 21:
                base_generation = random.uniform(2.0, 5.0)
            else:
                base_generation = random.uniform(0.2, 1.2)
                
            last_reading = next((l for l in reversed(logs) if l["bin_id"] == b["id"]), None)
            if last_reading:
                prev_fill = last_reading["fill_rate"]
                if prev_fill > 85 and random.random() < 0.18: # Simulated empty cycle
                    fill_rate = random.randint(5, 12)
                else:
                    fill_rate = min(100, prev_fill + base_generation)
            else:
                fill_rate = random.randint(15, 60)
                
            logs.append({
                "timestamp": current_time.isoformat(),
                "bin_id": b["id"],
                "fill_rate": round(fill_rate, 2),
                "type": b["type"],
                "temp": round(random.uniform(26.0, 43.0), 1) # Chandrapur gets very hot!
            })
        current_time += timedelta(hours=1)
    return logs

# Generate trucks in Chandrapur municipal zones
def generate_trucks():
    return [
        {
            "id": "TRUCK-001",
            "name": "CMC Zone A Collector (Jatpura)",
            "lat": 19.9650,
            "lng": 79.2900,
            "status": "Collecting",
            "capacity_kg": 2500,
            "current_load_kg": 1400
        },
        {
            "id": "TRUCK-002",
            "name": "CMC Zone B Collector (Babu Peth)",
            "lat": 19.9490,
            "lng": 79.3100,
            "status": "Idle",
            "capacity_kg": 3000,
            "current_load_kg": 600
        }
    ]

# Generate initial citizen complaints in Chandrapur
def generate_complaints():
    return [
        {
            "id": "TICKET-101",
            "lat": 19.9590,
            "lng": 79.2980,
            "description": "Garbage dumping near Gandhi Chowk market area. Heavy smell.",
            "category": "Organic",
            "severity": "High",
            "status": "Assigned",
            "created_at": (datetime.now() - timedelta(hours=3)).isoformat()
        },
        {
            "id": "TICKET-102",
            "lat": 19.9750,
            "lng": 79.2910,
            "description": "Overflowing public waste bin near Ramnagar bus station road.",
            "category": "Recyclable",
            "severity": "Medium",
            "status": "Pending",
            "created_at": (datetime.now() - timedelta(hours=1)).isoformat()
        }
    ]
