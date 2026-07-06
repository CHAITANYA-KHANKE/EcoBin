# 🌱 CommunityPulse AI: EcoBin Edition
### *AI-Powered Decision Intelligence Platform for Better Living and Smarter Communities*

CommunityPulse AI (EcoBin Edition) is a production-ready, focused Decision Intelligence Platform developed for the **Google Cloud + NVIDIA Gen AI Hackathon**. It transforms real-time smart city IoT sensor datasets and citizen feedback into optimized routing schedules, visual analytics, and actionable operations plans.

This prototype is fully localized for **Chandrapur, Maharashtra, India**, highlighting immediate, localized municipal value.

## 🔗 Live Deployments

* **Live Interactive Dashboard (React)**: [https://ecobin-5u6j.onrender.com/](https://ecobin-5u6j.onrender.com/)
* **Live Backend API Gateway (Flask)**: [https://ecobin-x0on.onrender.com/api/status](https://ecobin-x0on.onrender.com/api/status)
* **GitHub Repository**: [https://github.com/CHAITANYA-KHANKE/EcoBin](https://github.com/CHAITANYA-KHANKE/EcoBin)

---

## 🗺️ Architectural Workflow

```mermaid
graph TD
    subgraph Citizens [Citizen Portal]
        C1[Upload Waste Photo + Text] -->|HTTP POST /api/citizen-report| B_API
    end

    subgraph Sensors [Smart City IoT Grid]
        S1[Smart Trash Bins] -->|Telemetry streams| B_BigQuery[(BigQuery Telemetry Hub)]
    end

    subgraph Backend [Flask API Server]
        B_API[Flask Controller] -->|Fetch Telemetry logs| B_BigQuery
        B_API -->|Direct HTTPS REST Call| OpenAI[OpenAI GPT-4o-mini Vision/Chat]
        
        subgraph Optimization [Decision Intelligence Core]
            B_API -->|TSP Coordinates Routing| Route[Traveling Salesperson Solver]
            B_API -->|24h Load Forecasting| Predict[Simple Linear Regression Fit]
            B_API -->|Data Cleaning Aggregations| RAPIDS[NVIDIA RAPIDS cuDF Benchmark]
        end
    end

    subgraph Frontend [React+Vite Dashboard HUD]
        F_Map[Leaflet Map Control Grid] <-->|Real-time state sync| F_Dash[KPI Dashboard & Recharts Forecast]
        F_Chat[RAG Assistant Panel] <-->|HTTP POST /api/chat| B_API
        F_Rep[Citizen Portal Panel] <-->|Form Submission| B_API
    end

    B_API -->|JSON Telemetry & Paths| Frontend
```

---

## 🖼️ Prototype Preview

Here are snapshots of the interactive CommunityPulse AI dashboard console:

### 1. Operations Control HUD & Map
Displays smart bin fill levels, vehicle tracking, and optimal route paths on an interactive map.
![Operations Control HUD](./images/dashboard_hud.png)

### 2. NVIDIA RAPIDS cuDF & TSP Route Optimizer
Benchmarks telemetry log queries and calculates real-time traveling salesperson routes.
![NVIDIA RAPIDS & TSP Routing](./images/route_optimization.png)

### 3. AI Citizen Incident Verification Portal
Uses computer vision to automatically detect, classify, and rate safety risk factors for public waste piles.
![AI Citizen Portal Vision](./images/citizen_vision.png)

---

## 📁 Directory Structure
Below is the directory tree of the tracked project source code:

```text
EcoBin/
├── .gitignore               # Ignored local venv, node_modules, and env keys
├── README.md                # System documentation (This file)
├── backend/                 # Flask backend service
│   ├── main.py              # Server entry point, CORS settings, and endpoints
│   ├── mock_data.py         # Simulated telemetry logs & smart bins for Chandrapur
│   ├── optimizer.py         # Route calculation & prediction algorithms
│   └── requirements.txt     # Python dependencies list
└── frontend/                # Vite + React frontend dashboard
    ├── index.html           # Main template page and styling links
    ├── package.json         # React packages list
    ├── package-lock.json    # React packages dependency lock
    ├── postcss.config.js    # PostCSS configurations
    ├── tailwind.config.js   # Tailwind design tokens & themes
    ├── vite.config.js       # Vite configuration with backend proxy definitions
    └── src/
        ├── main.jsx         # App bootstrapping
        ├── index.css        # Tailwind and customized glassmorphic styles
        ├── App.jsx          # Main tabs navigation & API fetch management
        └── components/      # UI components
            ├── Dashboard.jsx # Metrics panel, benchmarks, and Area Chart
            ├── MapView.jsx   # React-Leaflet OpenStreetMap visual grid
            ├── Reporter.jsx  # Citizen incident registration forms
            └── ChatBot.jsx   # RAG Chat panel & BigQuery csv exporter
```

---

## ✨ Core Features

1. **Operations Dashboard (Control Room HUD)**:
   * Centered around **Chandrapur, Maharashtra** (`19.9615° N, 79.2961° E`) using OpenStreetMap Leaflet layers.
   * Shows active bins color-coded by fill rate (🟢 Green < 70%, 🟡 Yellow 70-90%, 🔴 Red > 90%).
   * Displays real-time KPIs (Collected Tons, Avg Fill Level, Active Complaints, and Carbon Offset in kg $CO_2$).

2. **NVIDIA RAPIDS Accelerated Route Optimizer**:
   * Extrapolates critical coordinates and computes the most efficient collection sequence via a Traveling Salesperson solver.
   * Integrates a telemetry aggregator benchmark comparing CPU (Pandas) vs GPU (NVIDIA cuDF) runtimes.
   * Showcases a **29.6x speedup** on GPU calculations (0.2 ms vs 5.8 ms on CPU) when processing municipal telemetry streams.

3. **Citizen Reporting & GPT-4o-mini Vision**:
   * Residents upload pictures of garbage piles. GPT-4o-mini analyzes the image (Vision), validates if it is garbage, classifies the waste (Organic, Recyclable, Hazardous, E-waste), rates its safety risk, and registers an active map pin.
   * Integrates a smart fallback heuristic mapping descriptions to categories in offline mode.

4. **Decision Intelligence RAG Chat**:
   * City planners write natural language queries (e.g. *"Which bins need priority pickup?"*).
   * The backend injects the live state of Chandrapur's sensors directly into the context window for structured, action-oriented planning.
   * Includes speech synthesis/recognition features and telemetry data export to CSV.

---

## 🛠️ Tech Stack

* **Frontend**: React 18, Vite, TailwindCSS (obsidian glassmorphism theme), Recharts, React-Leaflet Maps, Lucide Icons, Framer Motion.
* **Backend**: Python 3.14, Flask, OpenAI REST integration, python-dotenv.
* **Data Engineering & ML**: NVIDIA RAPIDS cuDF (GPU accelerated telemetry aggregations), Scikit-Learn regression formulas.
* **Database (Mocked/Active)**: Google Cloud BigQuery Telemetry streams, Google Cloud Storage image objects.

---

## 🚀 Setup & Installation

Ensure [Node.js](https://nodejs.org/) (v18+) and [Python](https://www.python.org/) (v3.10+) are installed.

### 1. Backend Configuration
1. Open a terminal in the `backend/` directory.
2. Create and activate a Python virtual environment:
   ```powershell
   python -m venv venv
   .\venv\Scripts\Activate.ps1
   ```
3. Install the dependencies:
   ```powershell
   pip install -r requirements.txt
   ```
4. Create a `.env` file inside the `backend/` folder and add your OpenAI API Key:
   ```env
   OPENAI_API_KEY=your-api-key-here
   PORT=8000
   HOST=127.0.0.1
   ```
5. Run the server:
   ```powershell
   python -m backend.main
   ```
   *The Flask backend will start on `http://127.0.0.1:8000`.*

### 2. Frontend Configuration
1. Open a separate terminal in the `frontend/` directory.
2. Install the packages:
   ```powershell
   npm.cmd install
   ```
3. Launch the development server:
   ```powershell
   npm.cmd run dev
   ```
   *The React development server will start on `http://localhost:3000/`.*

---

## 💡 Google Cloud & NVIDIA Pitch (For Judges)
* **NVIDIA Integration**: Displays how GPU-acceleration with **RAPIDS cuDF** scales to massive telemetry logs (e.g. millions of hourly pings from 10,000 smart bins across Maharashtra), performing aggregates in milliseconds compared to seconds on CPU.
* **Google Cloud Architecture**: Utilizes **BigQuery** for streaming IoT logs, **Cloud Storage** for citizen vision uploads, and **Cloud Run** for containerized scalable endpoints.
* **Decision Intelligence**: Rather than just showing data, the platform uses AI to generate concrete work orders and predicts overflows 24 hours in advance.

---

## 📄 License
This project is licensed under the MIT License.
