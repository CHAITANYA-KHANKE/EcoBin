import React from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import L from 'leaflet';

// Custom Markers using DivIcon to prevent asset loading issues in React bundlers
const createBinIcon = (fillRate) => {
  let color = '#10b981'; // Green
  if (fillRate >= 90) color = '#f43f5e'; // Red
  else if (fillRate >= 70) color = '#eab308'; // Yellow

  return L.divIcon({
    className: 'custom-bin-marker',
    html: `
      <div class="relative flex items-center justify-center">
        <span class="animate-ping absolute inline-flex h-4 w-4 rounded-full opacity-45" style="background-color: ${color};"></span>
        <span class="relative inline-flex rounded-full h-3 w-3 border-2 border-white shadow-lg" style="background-color: ${color};"></span>
      </div>
    `,
    iconSize: [16, 16],
    iconAnchor: [8, 8]
  });
};

const createTruckIcon = () => {
  return L.divIcon({
    className: 'custom-truck-marker',
    html: `<div class="text-2xl filter drop-shadow-[0_0_6px_rgba(6,182,212,0.8)]">🚚</div>`,
    iconSize: [30, 30],
    iconAnchor: [15, 15]
  });
};

const createComplaintIcon = (severity) => {
  const color = severity === 'High' ? '#f43f5e' : '#eab308';
  return L.divIcon({
    className: 'custom-complaint-marker',
    html: `<div class="text-lg filter drop-shadow-[0_0_6px_${color}]">⚠️</div>`,
    iconSize: [24, 24],
    iconAnchor: [12, 12]
  });
};

export default function MapView({ bins, trucks, complaints, optimizedRoute, onSelectBin }) {
  // Chandrapur, Maharashtra Coordinates
  const position = [19.9615, 79.2961];

  // Draw optimized path lines if available
  const routeCoordinates = optimizedRoute && optimizedRoute.length > 0
    ? optimizedRoute.map(node => [node.lat, node.lng])
    : [];

  return (
    <div className="w-full h-full relative overflow-hidden rounded-xl border border-glassborder shadow-neon">
      <MapContainer 
        center={position} 
        zoom={13} 
        scrollWheelZoom={true} 
        style={{ height: '100%', width: '100%' }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* Bins Layer */}
        {bins.map((bin) => (
          <Marker 
            key={bin.id} 
            position={[bin.lat, bin.lng]} 
            icon={createBinIcon(bin.fill_rate)}
            eventHandlers={{
              click: () => onSelectBin(bin)
            }}
          >
            <Popup>
              <div className="text-slate-100 p-1">
                <div className="flex items-center justify-between border-b border-white/10 pb-1 mb-1">
                  <h4 className="font-bold text-sm text-accentcyan">{bin.id}</h4>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${
                    bin.fill_rate >= 90 ? 'bg-rose-500/20 text-rose-300' :
                    bin.fill_rate >= 70 ? 'bg-amber-500/20 text-amber-300' : 'bg-emerald-500/20 text-emerald-300'
                  }`}>
                    {bin.type}
                  </span>
                </div>
                <p className="text-xs font-semibold text-slate-300">{bin.name}</p>
                <div className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1 text-[11px] text-slate-400">
                  <span>Fill Level:</span>
                  <span className={`font-bold ${bin.fill_rate >= 75 ? 'text-accentred' : 'text-slate-200'}`}>
                    {bin.fill_rate}%
                  </span>
                  <span>Battery:</span>
                  <span className="text-slate-200">{bin.battery}%</span>
                  <span>Capacity:</span>
                  <span className="text-slate-200">{bin.capacity} L</span>
                </div>
              </div>
            </Popup>
          </Marker>
        ))}

        {/* Trucks Layer */}
        {trucks.map((truck) => (
          <Marker 
            key={truck.id} 
            position={[truck.lat, truck.lng]} 
            icon={createTruckIcon()}
          >
            <Popup>
              <div className="text-slate-100 p-1">
                <h4 className="font-bold text-sm text-accentcyan border-b border-white/10 pb-1 mb-1">{truck.id}</h4>
                <p className="text-xs font-semibold">{truck.name}</p>
                <div className="mt-2 grid grid-cols-2 gap-1 text-[11px] text-slate-400">
                  <span>Status:</span>
                  <span className="text-emerald-400 font-semibold">{truck.status}</span>
                  <span>Load:</span>
                  <span className="text-slate-200">{truck.current_load_kg} / {truck.capacity_kg} kg</span>
                </div>
              </div>
            </Popup>
          </Marker>
        ))}

        {/* Citizen Complaints Layer */}
        {complaints
          .filter(c => c.status !== 'Resolved')
          .map((complaint) => (
            <Marker
              key={complaint.id}
              position={[complaint.lat, complaint.lng]}
              icon={createComplaintIcon(complaint.severity)}
            >
              <Popup>
                <div className="text-slate-100 p-1 max-w-[200px]">
                  <div className="flex items-center justify-between border-b border-white/10 pb-1 mb-1">
                    <h4 className="font-bold text-sm text-accentred">{complaint.id}</h4>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${
                      complaint.severity === 'High' ? 'bg-rose-500/20 text-rose-300 font-bold' : 'bg-amber-500/20 text-amber-300'
                    }`}>
                      {complaint.severity} Risk
                    </span>
                  </div>
                  <p className="text-xs font-semibold text-slate-300">{complaint.category} Issue</p>
                  <p className="text-[11px] text-slate-400 mt-1 italic">"{complaint.description}"</p>
                  <div className="mt-2 text-[10px] text-slate-500">
                    Status: <span className="text-amber-400 font-medium">{complaint.status}</span>
                  </div>
                </div>
              </Popup>
            </Marker>
        ))}

        {/* Optimized Route Polyline */}
        {routeCoordinates.length > 0 && (
          <Polyline 
            positions={routeCoordinates} 
            color="#06b6d4" 
            weight={4}
            opacity={0.8}
            dashArray="10, 8"
            className="animate-pulse"
          />
        )}
      </MapContainer>
    </div>
  );
}
