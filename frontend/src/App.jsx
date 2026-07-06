import React, { useState, useEffect, useMemo } from 'react';
import { LayoutDashboard, Camera, MessageSquare, ShieldCheck, Cpu, HardDrive, RefreshCw } from 'lucide-react';
import MapView from './components/MapView';
import Dashboard from './components/Dashboard';
import Reporter from './components/Reporter';
import ChatBot from './components/ChatBot';

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [bins, setBins] = useState([]);
  const [trucks, setTrucks] = useState([]);
  const [complaints, setComplaints] = useState([]);
  const [stats, setStats] = useState({
    total_waste_collected_tons: 0,
    avg_bin_fill_rate: 0,
    active_complaints: 0,
    carbon_saved_kg: 0
  });
  const [policies, setPolicies] = useState({
    evTrucks: false,
    dynamicRouting: false,
    recyclingRewards: false
  });
  const [alerts, setAlerts] = useState([]);
  const [selectedBin, setSelectedBin] = useState(null);
  const [optimizedRoute, setOptimizedRoute] = useState([]);
  const [routeData, setRouteData] = useState(null);
  const [routeLoading, setRouteLoading] = useState(false);
  const [systemStatus, setSystemStatus] = useState({
    status: 'checking',
    api_connected: false,
    gpu_accelerated: false,
    acceleration_library: 'Detecting...'
  });
  const [refreshing, setRefreshing] = useState(false);

  // Compute stats dynamically based on active simulated policies
  const simulatedStats = useMemo(() => {
    let waste = stats.total_waste_collected_tons;
    let avgFill = stats.avg_bin_fill_rate;
    let complaintsCount = stats.active_complaints;
    let carbon = stats.carbon_saved_kg;
    let savings = 14800; // Base baseline CMC savings in INR

    if (policies.evTrucks) {
      carbon = Math.round(carbon * 1.65 + 3520);
    }
    if (policies.dynamicRouting) {
      savings += 84200;
      carbon = Math.round(carbon * 1.15 + 840);
    }
    if (policies.recyclingRewards) {
      avgFill = Math.max(10, avgFill - 12.5);
      savings += 24500;
    }

    return {
      ...stats,
      avg_bin_fill_rate: parseFloat(avgFill.toFixed(1)),
      carbon_saved_kg: Math.round(carbon),
      savings_inr: savings
    };
  }, [stats, policies]);

  // Initial Data Fetch
  useEffect(() => {
    fetchDashboardData();
    fetchSystemStatus();
    
    // Auto-polling simulated sensor streams every 15 seconds
    const interval = setInterval(() => {
      fetchDashboardData(true);
    }, 15000);
    
    return () => clearInterval(interval);
  }, []);

  const fetchSystemStatus = () => {
    fetch(API_BASE_URL + '/api/status')
      .then(res => res.json())
      .then(data => setSystemStatus(data))
      .catch(err => {
        console.error('System status query failed:', err);
        setSystemStatus({
          status: 'error',
          api_connected: false,
          gpu_accelerated: false,
          acceleration_library: 'Offline Mode'
        });
      });
  };

  const fetchDashboardData = (isSilent = false) => {
    if (!isSilent) setRefreshing(true);
    fetch(API_BASE_URL + '/api/dashboard')
      .then(res => res.json())
      .then(data => {
        setBins(data.bins);
        setTrucks(data.trucks);
        setComplaints(data.alerts.filter(a => a.ticket_id).map(a => {
          // Sync alerts with complaints list
          return complaints.find(c => c.id === a.ticket_id) || null;
        }).filter(Boolean));
        
        // Load direct tickets
        fetch(API_BASE_URL + '/api/complaints')
          .then(r => r.json())
          .then(tickets => {
            setComplaints(tickets);
            // If the selected bin is updated in the list, sync its state
            if (selectedBin) {
              const updated = data.bins.find(b => b.id === selectedBin.id);
              if (updated) setSelectedBin(updated);
            }
          });

        setStats(data.stats);
        setAlerts(data.alerts);
        
        // Auto-select first bin if none selected
        if (!selectedBin && data.bins.length > 0) {
          setSelectedBin(data.bins[0]);
        }
      })
      .catch(err => console.error('Failed to load dashboard data:', err))
      .finally(() => {
        if (!isSilent) setRefreshing(false);
      });
  };

  const handleTriggerRouteOptimize = () => {
    setRouteLoading(true);
    fetch(API_BASE_URL + '/api/route-optimize', { method: 'POST' })
      .then(res => res.json())
      .then(data => {
        setOptimizedRoute(data.route);
        setRouteData(data);
      })
      .catch(err => console.error('Routing optimization failed:', err))
      .finally(() => setRouteLoading(false));
  };

  const handleAddComplaint = (newTicket) => {
    setComplaints(prev => [newTicket, ...prev]);
    // Refresh dashboard to display the new alert immediately
    fetchDashboardData(true);
  };

  const handleResolveComplaint = (ticketId) => {
    fetch(API_BASE_URL + '/api/complaints/resolve', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ticket_id: ticketId })
    })
      .then(res => res.json())
      .then(() => {
        // Update ticket in local state
        setComplaints(prev => prev.map(c => c.id === ticketId ? { ...c, status: 'Resolved' } : c));
        // Clear optimized route as ticket coordinates have changed
        setOptimizedRoute([]);
        setRouteData(null);
        fetchDashboardData(true);
      })
      .catch(err => console.error(err));
  };

  return (
    <div className="min-h-screen bg-darkbg text-slate-100 flex flex-col font-sans">
      
      {/* 1. Main Navigation Header */}
      <header className="border-b border-glassborder bg-panelbg backdrop-blur-md px-6 py-4 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center space-x-3">
          <div className="h-9 w-9 rounded-lg bg-gradient-to-tr from-accentcyan to-accentgreen flex items-center justify-center text-darkbg font-extrabold text-xl shadow-lg">
            🌱
          </div>
          <div>
            <h1 className="font-display font-bold text-lg leading-tight tracking-wide text-transparent bg-clip-text bg-gradient-to-r from-slate-100 to-slate-300">
              CommunityPulse AI
            </h1>
            <p className="text-[10px] font-medium text-accentcyan tracking-widest uppercase">
              EcoBin Intelligence Portal
            </p>
          </div>
        </div>

        {/* System telemetry bar */}
        <div className="hidden md:flex items-center space-x-6 text-xs">
          <div className="flex items-center space-x-2 border-r border-glassborder pr-6">
            <HardDrive size={14} className="text-slate-400" />
            <span className="text-slate-400">Database:</span>
            <span className="font-semibold text-slate-200">GCP BigQuery</span>
          </div>

          <div className="flex items-center space-x-2 border-r border-glassborder pr-6">
            <Cpu size={14} className="text-slate-400" />
            <span className="text-slate-400">Compute:</span>
            <span className={`font-semibold ${systemStatus.gpu_accelerated ? 'text-accentgreen' : 'text-accentcyan'}`}>
              {systemStatus.acceleration_library}
            </span>
          </div>

          <div className="flex items-center space-x-2">
            <ShieldCheck size={14} className="text-slate-400" />
            <span className="text-slate-400">OpenAI API:</span>
            <span className={`font-semibold px-2 py-0.5 rounded text-[10px] ${
              systemStatus.api_connected ? 'bg-emerald-500/20 text-emerald-300' : 'bg-amber-500/20 text-amber-300'
            }`}>
              {systemStatus.api_connected ? 'Connected' : 'Simulation Mode'}
            </span>
          </div>
        </div>

        {/* Manual sync button */}
        <button 
          onClick={() => fetchDashboardData()} 
          disabled={refreshing}
          className="p-2 hover:bg-white/5 rounded-lg border border-glassborder text-slate-400 hover:text-slate-200 transition-all flex items-center gap-1.5 text-xs"
        >
          <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} />
          <span className="hidden sm:inline">Sync Sensors</span>
        </button>
      </header>

      {/* 2. Control Room HUD Split Layout */}
      <main className="flex-1 p-6 grid grid-cols-1 xl:grid-cols-2 gap-6 h-[calc(100vh-80px)] overflow-hidden">
        
        {/* Left Side: Map Console (Always Visible) */}
        <div className="h-full flex flex-col space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-display font-semibold text-sm uppercase tracking-wider text-slate-400 flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-accentcyan animate-ping"></span>
              Live Smart City Operations Grid
            </h2>
            {optimizedRoute.length > 0 && (
              <span className="text-[10px] text-accentcyan font-bold bg-accentcyan/10 border border-accentcyan/20 px-2.5 py-0.5 rounded-full">
                Route Active
              </span>
            )}
          </div>
          <div className="flex-1 min-h-[350px]">
            <MapView 
              bins={bins}
              trucks={trucks}
              complaints={complaints}
              optimizedRoute={optimizedRoute}
              onSelectBin={setSelectedBin}
            />
          </div>
        </div>

        {/* Right Side: Tabbed Interface for Control Panels */}
        <div className="h-full flex flex-col space-y-4 overflow-hidden">
          
          {/* Tabs Menu */}
          <div className="flex items-center space-x-1.5 border-b border-glassborder pb-1">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`flex items-center space-x-2 px-4 py-2 text-xs font-semibold rounded-t-lg transition-all border-b-2 ${
                activeTab === 'dashboard'
                  ? 'border-accentcyan text-accentcyan bg-white/5'
                  : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-white/5'
              }`}
            >
              <LayoutDashboard size={14} />
              <span>Operations Board</span>
            </button>

            <button
              onClick={() => setActiveTab('reporter')}
              className={`flex items-center space-x-2 px-4 py-2 text-xs font-semibold rounded-t-lg transition-all border-b-2 ${
                activeTab === 'reporter'
                  ? 'border-accentred text-accentred bg-white/5'
                  : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-white/5'
              }`}
            >
              <Camera size={14} />
              <span>Citizen Portal</span>
            </button>

            <button
              onClick={() => setActiveTab('chat')}
              className={`flex items-center space-x-2 px-4 py-2 text-xs font-semibold rounded-t-lg transition-all border-b-2 ${
                activeTab === 'chat'
                  ? 'border-accentgreen text-accentgreen bg-white/5'
                  : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-white/5'
              }`}
            >
              <MessageSquare size={14} />
              <span>Decision Chat</span>
            </button>
          </div>

          {/* Active Tab Component Container */}
          <div className="flex-1 overflow-y-auto pr-1 pb-4">
            {activeTab === 'dashboard' && (
              <Dashboard 
                stats={simulatedStats}
                alerts={alerts}
                bins={bins}
                selectedBin={selectedBin}
                setSelectedBin={setSelectedBin}
                onTriggerRouteOptimize={handleTriggerRouteOptimize}
                routeLoading={routeLoading}
                routeData={routeData}
                policies={policies}
                setPolicies={setPolicies}
              />
            )}

            {activeTab === 'reporter' && (
              <Reporter 
                complaints={complaints}
                onAddComplaint={handleAddComplaint}
                onResolveComplaint={handleResolveComplaint}
              />
            )}

            {activeTab === 'chat' && (
              <ChatBot 
                bins={bins}
              />
            )}
          </div>
        </div>

      </main>

    </div>
  );
}
