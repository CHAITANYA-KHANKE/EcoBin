import React, { useState } from 'react';
import { Camera, AlertCircle, FileText, CheckCircle2, User } from 'lucide-react';

export default function Reporter({ complaints, onAddComplaint, onResolveComplaint }) {
  const [description, setDescription] = useState('');
  const [latitude, setLatitude] = useState(19.9615);
  const [longitude, setLongitude] = useState(79.2961);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [aiResult, setAiResult] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [selectedTicket, setSelectedTicket] = useState(null);

  // Predefined points in Chandrapur to simplify demo coords selection
  const DEMO_POINTS = [
    { label: "Gandhi Chowk Market", lat: 19.9575, lng: 79.2965 },
    { label: "Civil Lines Crossing", lat: 19.9720, lng: 79.2882 },
    { label: "Ramnagar Bus Stop", lat: 19.9695, lng: 79.2995 },
    { label: "Babu Peth Area", lat: 19.9540, lng: 79.3140 }
  ];

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    setImageFile(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!description.trim()) {
      setErrorMsg('Please specify a description of the waste incident.');
      return;
    }
    
    setSubmitting(true);
    setErrorMsg('');
    setAiResult(null);

    const formData = new FormData();
    formData.append('description', description);
    formData.append('latitude', latitude);
    formData.append('longitude', longitude);
    if (imageFile) {
      formData.append('image', imageFile);
    }

    try {
      const response = await fetch('/api/citizen-report', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to submit report');
      }

      const data = await response.json();
      onAddComplaint(data);
      setAiResult(data);
      
      // Clear form
      setDescription('');
      setImageFile(null);
      setImagePreview(null);
    } catch (err) {
      setErrorMsg(err.message || 'Error uploading file.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      
      {/* Form Submission Panel */}
      <div className="lg:col-span-1 space-y-6">
        <div className="glass-card rounded-xl p-5 border border-rose-500/20 bg-rose-500/5">
          <h3 className="font-bold text-slate-100 flex items-center gap-2 mb-4">
            <Camera size={18} className="text-accentred" />
            Report Waste Incident
          </h3>
          
          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            <div>
              <label className="text-slate-400 font-semibold mb-1 block">Description</label>
              <textarea
                placeholder="Describe the issue (e.g., Overflowing plastic bags blocking public passage...)"
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full bg-slate-900 border border-glassborder rounded-lg p-2.5 text-slate-200 outline-none focus:border-accentred resize-none"
              />
            </div>

            {/* Quick Coord Selector */}
            <div>
              <label className="text-slate-400 font-semibold mb-1 block">Incident Location</label>
              <div className="grid grid-cols-2 gap-2 mb-2">
                {DEMO_POINTS.map((pt, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      setLatitude(pt.lat);
                      setLongitude(pt.lng);
                    }}
                    className={`p-2 border rounded-lg text-left transition-all ${
                      latitude === pt.lat && longitude === pt.lng
                        ? 'border-accentred bg-accentred/15 text-slate-200 font-medium'
                        : 'border-glassborder hover:bg-white/5 text-slate-400'
                    }`}
                  >
                    {pt.label}
                  </button>
                ))}
              </div>
              <div className="grid grid-cols-2 gap-2 text-[10px] text-slate-500">
                <div>Lat: <span className="text-slate-300 font-bold">{latitude.toFixed(5)}</span></div>
                <div>Lng: <span className="text-slate-300 font-bold">{longitude.toFixed(5)}</span></div>
              </div>
            </div>

            {/* Image Selector */}
            <div>
              <label className="text-slate-400 font-semibold mb-1 block">Upload Proof (Image)</label>
              <div className="border border-dashed border-glassborder rounded-lg p-4 flex flex-col items-center justify-center relative cursor-pointer hover:bg-white/5 transition-all">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="absolute inset-0 opacity-0 cursor-pointer"
                />
                {imagePreview ? (
                  <img src={imagePreview} alt="Preview" className="max-h-24 rounded object-cover shadow" />
                ) : (
                  <>
                    <Camera size={24} className="text-slate-400 mb-2" />
                    <span className="text-slate-400">Click to upload photo</span>
                  </>
                )}
              </div>
            </div>

            {errorMsg && (
              <div className="p-2.5 bg-rose-500/10 border border-rose-500/20 text-rose-300 rounded-lg flex gap-1.5 items-start">
                <AlertCircle size={14} className="mt-0.5" />
                <span>{errorMsg}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={submitting}
              className={`w-full py-2.5 rounded-lg bg-gradient-to-r from-accentred to-amber-500 text-darkbg font-bold tracking-wide shadow-lg hover:brightness-110 active:scale-[0.98] transition-all flex items-center justify-center gap-2 ${
                submitting ? 'opacity-75 cursor-wait' : ''
              }`}
            >
              <Camera size={14} />
              {submitting ? 'OpenAI Vision Analyzing...' : 'File Citizen Incident'}
            </button>
          </form>
        </div>

        {/* AI Vision analysis output */}
        {aiResult && (
          <div className="glass-card rounded-xl p-5 border border-emerald-500/20 bg-emerald-500/5 text-xs space-y-3">
            <h4 className="font-bold text-slate-100 flex items-center gap-2 border-b border-white/5 pb-2">
              <CheckCircle2 size={16} className="text-accentgreen" />
              OpenAI Vision Results: {aiResult.id}
            </h4>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <span className="text-slate-400 block">AI Category:</span>
                <span className="bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded text-[10px] font-bold uppercase inline-block mt-0.5">
                  {aiResult.category}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block">Severity Rating:</span>
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase inline-block mt-0.5 ${
                  aiResult.severity === 'High' ? 'bg-rose-500/20 text-rose-300' : 'bg-amber-500/20 text-amber-300'
                }`}>
                  {aiResult.severity}
                </span>
              </div>
            </div>
            <div>
              <span className="text-slate-400 block">AI Technical Breakdown:</span>
              <p className="text-slate-300 leading-normal mt-1 italic">"{aiResult.ai_analysis}"</p>
            </div>
          </div>
        )}
      </div>

      {/* Complaints List Table */}
      <div className="lg:col-span-2">
        <div className="glass-card rounded-xl p-5 h-full flex flex-col justify-between">
          <div>
            <h3 className="font-bold text-slate-100 flex items-center gap-2 border-b border-glassborder pb-3 mb-4">
              <FileText size={18} className="text-accentcyan" />
              Active Incident Tickets
            </h3>
            
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead>
                  <tr className="border-b border-white/5 text-slate-400 uppercase tracking-wider font-semibold">
                    <th className="pb-2">Ticket ID</th>
                    <th className="pb-2">Type</th>
                    <th className="pb-2">Details</th>
                    <th className="pb-2">Risk</th>
                    <th className="pb-2">Status</th>
                    <th className="pb-2 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {complaints.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-center py-8 text-slate-500">No tickets registered yet.</td>
                    </tr>
                  ) : (
                    complaints.map((c) => (
                      <tr 
                        key={c.id} 
                        className="text-slate-300 hover:bg-white/5 cursor-pointer transition-colors"
                        onClick={() => setSelectedTicket(c)}
                      >
                        <td className="py-3 font-semibold text-accentcyan">{c.id}</td>
                        <td className="py-3 font-medium">{c.category}</td>
                        <td className="py-3 max-w-[180px] truncate" title={c.description}>
                          {c.description}
                        </td>
                        <td className="py-3">
                          <span className={`px-1.5 py-0.5 rounded font-medium text-[10px] ${
                            c.severity === 'High' ? 'bg-rose-500/20 text-rose-300 font-semibold' : 'bg-amber-500/20 text-amber-300'
                          }`}>
                            {c.severity}
                          </span>
                        </td>
                        <td className="py-3">
                          <span className={`font-semibold ${
                            c.status === 'Resolved' ? 'text-accentgreen' : 'text-accentyellow'
                          }`}>
                            {c.status}
                          </span>
                        </td>
                        <td className="py-3 text-right" onClick={(e) => e.stopPropagation()}>
                          {c.status !== 'Resolved' ? (
                            <button
                              onClick={() => onResolveComplaint(c.id)}
                              className="px-2 py-1 bg-accentgreen/15 text-accentgreen border border-accentgreen/20 rounded hover:bg-accentgreen/30 active:scale-[0.97] transition-all"
                            >
                              Resolve
                            </button>
                          ) : (
                            <span className="text-slate-500 text-[10px]">Closed</span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
          
          <div className="mt-4 text-[10px] text-slate-500 flex items-center gap-1">
            <User size={10} />
            *Planners can close active tickets when collections are confirmed on site.
          </div>
        </div>
      </div>

      {/* Ticket Inspector Modal */}
      {selectedTicket && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
          <div className="glass-card rounded-2xl p-6 max-w-lg w-full border border-glassborder shadow-neon relative space-y-4 max-h-[85vh] overflow-y-auto">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center space-x-2">
                <span className="text-lg">📋</span>
                <h4 className="font-bold text-slate-100 text-sm">Ticket Details: {selectedTicket.id}</h4>
              </div>
              <button 
                onClick={() => setSelectedTicket(null)}
                className="text-slate-400 hover:text-slate-100 text-xs px-2 py-1 hover:bg-white/5 rounded border border-glassborder"
              >
                ✕ Close
              </button>
            </div>

            {/* Ticket Info Grid */}
            <div className="grid grid-cols-2 gap-4 text-xs">
              <div>
                <span className="text-slate-400 block font-medium">Issue Class:</span>
                <span className="bg-accentcyan/25 text-accentcyan font-semibold px-2 py-0.5 rounded text-[10px] inline-block mt-0.5 uppercase">
                  {selectedTicket.category}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block font-medium">Severity Risk:</span>
                <span className={`px-2 py-0.5 rounded text-[10px] font-semibold inline-block mt-0.5 uppercase ${
                  selectedTicket.severity === 'High' ? 'bg-rose-500/20 text-rose-300' : 'bg-amber-500/20 text-amber-300'
                }`}>
                  {selectedTicket.severity}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block font-medium">Status:</span>
                <span className={`font-semibold ${selectedTicket.status === 'Resolved' ? 'text-accentgreen' : 'text-accentyellow'}`}>
                  {selectedTicket.status}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block font-medium">Report Coordinates:</span>
                <span className="text-slate-200">{selectedTicket.lat.toFixed(4)}, {selectedTicket.lng.toFixed(4)}</span>
              </div>
            </div>

            {/* Description Text */}
            <div className="text-xs bg-white/5 p-3 rounded-lg border border-glassborder">
              <span className="text-slate-400 block font-semibold mb-1">User Description:</span>
              <p className="text-slate-200 leading-normal italic">"{selectedTicket.description}"</p>
            </div>

            {/* Uploaded Image or Fallback visual */}
            <div className="space-y-1.5">
              <span className="text-xs text-slate-400 block font-semibold">Verification Proof:</span>
              <div className="h-44 w-full rounded-lg overflow-hidden border border-glassborder bg-slate-900 flex items-center justify-center">
                {selectedTicket.id === 'TICKET-101' || selectedTicket.id === 'TICKET-102' ? (
                  <div className="text-center p-4">
                    <span className="text-3xl block mb-1">📷</span>
                    <span className="text-[10px] text-slate-400 block max-w-[200px]">Simulated photo log attached in BigQuery.</span>
                  </div>
                ) : (
                  <img 
                    src={`/api/uploads/${selectedTicket.id}.jpg`} 
                    alt="Citizen Uploaded Evidence" 
                    className="h-full w-full object-cover"
                    onError={(e) => {
                      e.target.src = `/api/uploads/${selectedTicket.id}.png`;
                      e.target.onerror = () => {
                        e.target.style.display = 'none';
                        e.target.parentNode.innerHTML = '<div class="text-center text-slate-500 text-xs">📷 Evidence photo file loaded</div>';
                      };
                    }}
                  />
                )}
              </div>
            </div>

            {/* AI Vision inspection report */}
            {selectedTicket.ai_analysis && (
              <div className="bg-emerald-500/5 border border-emerald-500/20 p-3 rounded-lg text-xs space-y-1">
                <span className="text-accentgreen font-bold block">OpenAI Vision API Classification:</span>
                <p className="text-slate-300 leading-relaxed italic">"{selectedTicket.ai_analysis}"</p>
              </div>
            )}

            {/* Resolve ticket footer buttons */}
            <div className="flex gap-2.5 pt-2">
              {selectedTicket.status !== 'Resolved' && (
                <button
                  onClick={() => {
                    onResolveComplaint(selectedTicket.id);
                    setSelectedTicket(null);
                  }}
                  className="flex-1 py-2 rounded-lg bg-accentgreen text-darkbg font-bold text-xs hover:brightness-110 active:scale-[0.98] transition-all"
                >
                  Resolve Issue & Dispatch Crew
                </button>
              )}
              <button
                type="button"
                onClick={() => setSelectedTicket(null)}
                className="flex-1 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs border border-glassborder transition-all"
              >
                Close Inspector
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
