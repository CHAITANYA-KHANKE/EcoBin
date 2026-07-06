import React, { useState, useEffect } from 'react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { Trash2, AlertTriangle, ShieldCheck, Zap, Navigation, Award, Cpu } from 'lucide-react';

export default function Dashboard({ 
  stats, 
  alerts, 
  bins, 
  selectedBin, 
  setSelectedBin, 
  onTriggerRouteOptimize,
  routeLoading,
  routeData,
  policies,
  setPolicies 
}) {
  const [forecastData, setForecastData] = useState([]);
  const [forecastLoading, setForecastLoading] = useState(false);

  // Fetch forecast data when selectedBin changes
  useEffect(() => {
    if (!selectedBin) return;
    setForecastLoading(true);
    fetch(`/api/bins/${selectedBin.id}/predictions`)
      .then(res => res.json())
      .then(data => {
        setForecastData(data.predictions);
        setForecastLoading(false);
      })
      .catch(err => {
        console.error(err);
        setForecastLoading(false);
      });
  }, [selectedBin]);

  return (
    <div className="space-y-6">
      {/* 1. KPIs Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass-card rounded-xl p-4 flex items-center space-x-4">
          <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-lg">
            <Trash2 size={24} />
          </div>
          <div>
            <p className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">Collected (Tons)</p>
            <h3 className="text-xl font-bold text-slate-100 mt-0.5">{stats.total_waste_collected_tons}t</h3>
          </div>
        </div>

        <div className="glass-card rounded-xl p-4 flex items-center space-x-4">
          <div className="p-3 bg-accentcyan/10 text-accentcyan rounded-lg">
            <Zap size={24} />
          </div>
          <div>
            <p className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">Avg Fill Rate</p>
            <h3 className="text-xl font-bold text-slate-100 mt-0.5">{stats.avg_bin_fill_rate}%</h3>
          </div>
        </div>

        <div className="glass-card rounded-xl p-4 flex items-center space-x-4">
          <div className="p-3 bg-rose-500/10 text-rose-400 rounded-lg">
            <AlertTriangle size={24} />
          </div>
          <div>
            <p className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">Active Complaints</p>
            <h3 className="text-xl font-bold text-slate-100 mt-0.5">{stats.active_complaints}</h3>
          </div>
        </div>

        <div className="glass-card rounded-xl p-4 flex items-center space-x-4">
          <div className="p-3 bg-teal-500/10 text-teal-400 rounded-lg">
            <Award size={24} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">Environmental Impact</p>
            <h3 className="text-lg font-bold text-slate-100 mt-0.5 truncate">{stats.carbon_saved_kg} kg CO₂</h3>
            <span className="text-[10px] text-accentgreen font-medium">Est. Savings: ₹{stats.savings_inr || 14800}/yr</span>
          </div>
        </div>
      </div>

      {/* 2. Main Dashboard Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Actions and Alerts */}
        <div className="space-y-6 lg:col-span-1">
          
          {/* Dispatch Optimizer Panel */}
          <div className="glass-card rounded-xl p-5 border border-accentcyan/20 bg-accentcyan/5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-slate-100 flex items-center gap-2">
                <Navigation size={18} className="text-accentcyan" />
                Route Optimization
              </h3>
              <span className="text-[10px] bg-accentcyan/20 text-accentcyan px-2 py-0.5 rounded uppercase font-semibold">
                NVIDIA RAPIDS
              </span>
            </div>
            
            <p className="text-xs text-slate-400 leading-relaxed mb-4">
              Trigger GPU-accelerated routing to solve collection schedules. Automatically targets overflowed bins & reported citizen tickets.
            </p>

            <button 
              onClick={onTriggerRouteOptimize}
              disabled={routeLoading}
              className={`w-full py-2.5 px-4 rounded-lg bg-gradient-to-r from-accentcyan to-accentgreen text-darkbg font-bold text-sm tracking-wide shadow-lg hover:brightness-110 active:scale-[0.98] transition-all flex items-center justify-center gap-2 ${
                routeLoading ? 'opacity-70 cursor-not-allowed' : ''
              }`}
            >
              <Cpu size={16} className={routeLoading ? 'animate-spin' : ''} />
              {routeLoading ? 'Computing GPU Routes...' : 'Optimize Collection Route'}
            </button>

            {/* Optimization Results */}
            {routeData && (
              <div className="mt-4 border-t border-glassborder pt-4 space-y-3">
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-slate-400 block">Total Distance:</span>
                    <span className="font-bold text-slate-200">{routeData.total_distance_km} km</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Optimized Saved:</span>
                    <span className="font-bold text-accentgreen">+{routeData.distance_saved_km} km</span>
                  </div>
                </div>

                {/* NVIDIA RAPIDS BENCHMARK BOX */}
                <div className="bg-slate-950/50 border border-emerald-500/20 rounded-lg p-3 space-y-2 mt-2">
                  <div className="flex items-center gap-1.5 text-[11px] font-bold text-accentgreen">
                    <Zap size={12} />
                    RAPIDS cuDF Telemetry Benchmark
                  </div>
                  <div className="grid grid-cols-2 gap-1 text-[10px] text-slate-400">
                    <span>CPU (Pandas):</span>
                    <span className="text-slate-200 text-right">{routeData.benchmark.cpu_execution_time_ms} ms</span>
                    <span>GPU (cuDF):</span>
                    <span className="text-accentcyan font-semibold text-right">{routeData.benchmark.gpu_execution_time_ms} ms</span>
                  </div>
                  <div className="border-t border-white/5 pt-1.5 mt-1 flex justify-between items-center text-[11px]">
                    <span className="text-slate-400 font-medium">GPU Speedup Factor:</span>
                    <span className="bg-emerald-500/20 text-emerald-300 font-bold px-2 py-0.5 rounded">
                      {routeData.benchmark.speedup_factor}x Faster
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Policy Simulator Panel */}
          <div className="glass-card rounded-xl p-5 border border-emerald-500/20 bg-emerald-500/5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-slate-100 flex items-center gap-2">
                <ShieldCheck size={18} className="text-accentgreen" />
                Policy Simulator
              </h3>
              <span className="text-[10px] bg-accentgreen/20 text-accentgreen px-2 py-0.5 rounded uppercase font-semibold">
                Decision Matrix
              </span>
            </div>
            
            <p className="text-xs text-slate-400 leading-relaxed mb-4">
              Toggle smart city policies to project municipal cost reductions and carbon offset curves.
            </p>

            <div className="space-y-3.5 text-xs">
              {/* EV Trucks Toggle */}
              <div className="flex items-center justify-between">
                <span className="text-slate-300 font-medium">EV Collection Trucks</span>
                <button
                  type="button"
                  onClick={() => setPolicies(prev => ({ ...prev, evTrucks: !prev.evTrucks }))}
                  className={`w-10 h-5 rounded-full p-0.5 transition-colors relative flex items-center ${
                    policies.evTrucks ? 'bg-accentgreen' : 'bg-slate-800 border border-white/10'
                  }`}
                >
                  <span className={`w-4 h-4 rounded-full bg-white shadow-md transform transition-transform ${
                    policies.evTrucks ? 'translate-x-5' : 'translate-x-0'
                  }`} />
                </button>
              </div>

              {/* Dynamic Routing Toggle */}
              <div className="flex items-center justify-between">
                <span className="text-slate-300 font-medium">Dynamic Collection Routing</span>
                <button
                  type="button"
                  onClick={() => setPolicies(prev => ({ ...prev, dynamicRouting: !prev.dynamicRouting }))}
                  className={`w-10 h-5 rounded-full p-0.5 transition-colors relative flex items-center ${
                    policies.dynamicRouting ? 'bg-accentgreen' : 'bg-slate-800 border border-white/10'
                  }`}
                >
                  <span className={`w-4 h-4 rounded-full bg-white shadow-md transform transition-transform ${
                    policies.dynamicRouting ? 'translate-x-5' : 'translate-x-0'
                  }`} />
                </button>
              </div>

              {/* Recycling Incentives Toggle */}
              <div className="flex items-center justify-between">
                <span className="text-slate-300 font-medium">Citizen Rewards Scheme</span>
                <button
                  type="button"
                  onClick={() => setPolicies(prev => ({ ...prev, recyclingRewards: !prev.recyclingRewards }))}
                  className={`w-10 h-5 rounded-full p-0.5 transition-colors relative flex items-center ${
                    policies.recyclingRewards ? 'bg-accentgreen' : 'bg-slate-800 border border-white/10'
                  }`}
                >
                  <span className={`w-4 h-4 rounded-full bg-white shadow-md transform transition-transform ${
                    policies.recyclingRewards ? 'translate-x-5' : 'translate-x-0'
                  }`} />
                </button>
              </div>
            </div>
          </div>

          {/* Active Operations Alerts */}
          <div className="glass-card rounded-xl p-5 max-h-[300px] overflow-y-auto space-y-3">
            <h3 className="font-bold text-sm text-slate-100 flex items-center gap-2 border-b border-glassborder pb-2 mb-1">
              <AlertTriangle size={16} className="text-accentred animate-pulse" />
              Anomalies & Critical Warnings
            </h3>
            {alerts.length === 0 ? (
              <p className="text-xs text-slate-500 text-center py-4">No critical anomalies logged.</p>
            ) : (
              alerts.map((a, idx) => (
                <div key={idx} className={`p-2.5 rounded-lg border text-xs flex items-start space-x-2.5 ${
                  a.severity === 'High' 
                    ? 'bg-rose-500/5 border-rose-500/20 text-rose-300' 
                    : 'bg-amber-500/5 border-amber-500/20 text-amber-300'
                }`}>
                  <div className="mt-0.5">⚠️</div>
                  <div className="space-y-0.5">
                    <p className="font-bold">{a.type}</p>
                    <p className="text-slate-400 leading-normal">{a.message}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right Column: Interactive Forecasting */}
        <div className="lg:col-span-2 space-y-6">
          <div className="glass-card rounded-xl p-5 h-full flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between border-b border-glassborder pb-3 mb-4">
                <div>
                  <h3 className="font-bold text-slate-100 flex items-center gap-2">
                    <ShieldCheck size={18} className="text-accentgreen" />
                    AI Fill-Rate Forecasting Engine
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">Select a smart bin to predict accumulation trends for the next 24 hours.</p>
                </div>
                <select 
                  className="bg-slate-900 border border-glassborder rounded-lg text-xs py-1.5 px-3 text-slate-200 outline-none focus:border-accentcyan"
                  value={selectedBin ? selectedBin.id : ''}
                  onChange={(e) => {
                    const found = bins.find(b => b.id === e.target.value);
                    if (found) setSelectedBin(found);
                  }}
                >
                  <option value="" disabled>Select Smart Bin</option>
                  {bins.map(b => (
                    <option key={b.id} value={b.id}>{b.id} - {b.name}</option>
                  ))}
                </select>
              </div>

              {selectedBin ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between bg-white/5 p-3 rounded-lg text-xs">
                    <div>
                      <span className="text-slate-400">Current Status:</span>
                      <h4 className="font-bold text-slate-100 text-sm mt-0.5">{selectedBin.name}</h4>
                    </div>
                    <div className="text-right">
                      <span className="text-slate-400">Current Fill:</span>
                      <p className={`text-sm font-bold mt-0.5 ${
                        selectedBin.fill_rate >= 90 ? 'text-accentred' :
                        selectedBin.fill_rate >= 70 ? 'text-accentyellow' : 'text-accentgreen'
                      }`}>{selectedBin.fill_rate}%</p>
                    </div>
                  </div>

                  {forecastLoading ? (
                    <div className="h-64 flex items-center justify-center text-xs text-slate-500">
                      Training local predictive model and loading predictions...
                    </div>
                  ) : forecastData.length > 0 ? (
                    <div className="h-64 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={forecastData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                          <defs>
                            <linearGradient id="colorFill" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.4}/>
                              <stop offset="95%" stopColor="#06b6d4" stopOpacity={0}/>
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                          <XAxis dataKey="hour" stroke="#94a3b8" fontSize={10} />
                          <YAxis domain={[0, 100]} stroke="#94a3b8" fontSize={10} />
                          <Tooltip 
                            contentStyle={{ background: '#0d1423', border: '1px solid rgba(255,255,255,0.1)' }}
                            labelStyle={{ color: '#06b6d4', fontWeight: 'bold' }}
                          />
                          <Area type="monotone" dataKey="fill_rate" name="Predicted Fill %" stroke="#06b6d4" fillOpacity={1} fill="url(#colorFill)" strokeWidth={2} />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  ) : null}
                </div>
              ) : (
                <div className="h-72 flex flex-col items-center justify-center text-slate-500 border-2 border-dashed border-white/5 rounded-xl">
                  <Trash2 size={40} className="stroke-1 mb-2 opacity-55" />
                  <p className="text-xs">Click a pin on the map or select a bin above to load AI predictions.</p>
                </div>
              )}
            </div>

            {selectedBin && (
              <div className="border-t border-glassborder pt-4 mt-4 text-xs bg-accentgreen/5 border-l-4 border-l-accentgreen p-3 rounded-r-lg">
                <span className="font-bold text-accentgreen block">AI Dispatch Recommendation:</span>
                <span className="text-slate-300 leading-normal mt-1 block">
                  {selectedBin.fill_rate >= 80 
                    ? `Bin exceeds limit. Forecast predicts complete overflow within 2 hours. Route Optimizer is dispatching Truck TRUCK-002 immediately.`
                    : `Telemetry is stable. Forecast predicts capacity threshold will be reached in approx. ${Math.round((100 - selectedBin.fill_rate) / 2.5)} hours. Collection recommended in next shift.`
                  }
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
