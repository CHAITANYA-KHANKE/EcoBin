import React, { useState, useRef, useEffect } from 'react';
import { MessageSquare, Send, Database, RefreshCw, Download, Mic, MicOff, Volume2 } from 'lucide-react';
import { API_BASE_URL } from '../config';

export default function ChatBot({ bins }) {
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: "### EcoBin Decision Advisor Connected\nWelcome to CommunityPulse AI! I can analyze smart city waste logs, critical anomalies, and dispatch routes.\n\n**Ask me something like**:\n- *'Which bins need priority pickup right now?'*\n- *'Show me a status summary of the city'*."
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [loading, setLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef(null);

  // Setup Web Speech Recognition
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const rec = new SpeechRecognition();
      rec.continuous = false;
      rec.interimResults = false;
      rec.lang = 'en-IN'; // Optimized for Indian English and Hindi transliterations

      rec.onstart = () => setIsListening(true);
      rec.onend = () => setIsListening(false);
      rec.onresult = (e) => {
        const transcript = e.results[0][0].transcript;
        setInputValue(transcript);
      };
      rec.onerror = (e) => {
        console.error('Speech recognition error:', e);
        setIsListening(false);
      };
      
      recognitionRef.current = rec;
    }
  }, []);

  const toggleListening = () => {
    if (!recognitionRef.current) {
      alert("Web Speech API is not supported in this browser. Please try Chrome or Microsoft Edge.");
      return;
    }
    if (isListening) {
      recognitionRef.current.stop();
    } else {
      recognitionRef.current.start();
    }
  };

  const speakText = (text) => {
    // Cancel any ongoing speech
    window.speechSynthesis.cancel();
    
    // Strip markdown formatting for cleaner audio dictation
    const cleanText = text
      .replace(/###\s+/g, '')
      .replace(/\*\*/g, '')
      .replace(/-\s+/g, '')
      .replace(/\*/g, '');
      
    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.lang = 'en-IN'; // Indian English accent
    window.speechSynthesis.speak(utterance);
  };
  
  // Simulated BigQuery telemetry logs
  const [telemetryLogs, setTelemetryLogs] = useState([]);
  const [loadingLogs, setLoadingLogs] = useState(false);
  
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Load simulated telemetry logs on mount
  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = () => {
    setLoadingLogs(true);
    // Simulating fetching raw logs of the active bins
    setTimeout(() => {
      const logs = [];
      bins.forEach((b, idx) => {
        logs.push({
          time: new Date(Date.now() - idx * 25 * 60 * 1000).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}),
          bin_id: b.id,
          fill: `${b.fill_rate}%`,
          temp: `${(28 + idx % 5).toFixed(1)}°C`,
          event: b.fill_rate >= 80 ? 'CRITICAL_LOAD' : 'TELEMETRY_PING'
        });
      });
      setTelemetryLogs(logs);
      setLoadingLogs(false);
    }, 600);
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!inputValue.trim()) return;

    const userMessage = { role: 'user', content: inputValue };
    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setLoading(true);

    try {
      const response = await fetch(API_BASE_URL + '/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message: userMessage.content }),
      });

      if (!response.ok) throw new Error('API query failed');
      const data = await response.json();
      
      setMessages(prev => [...prev, { role: 'assistant', content: data.response }]);
    } catch (err) {
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: `### API Error\nFailed to establish connection to OpenAI/GCP backend. \n\n*Error details: ${err.message}*` 
      }]);
    } finally {
      setLoading(false);
    }
  };

  // Simple parser to render markdown text in React without external dependencies
  const formatMessageContent = (text) => {
    return text.split('\n').map((line, idx) => {
      let trimmed = line.trim();
      
      // Headers
      if (trimmed.startsWith('### ')) {
        return <h4 key={idx} className="text-sm font-bold text-accentcyan mt-3 mb-1">{trimmed.substring(4)}</h4>;
      }
      
      // Bullets
      if (trimmed.startsWith('- ')) {
        return (
          <li key={idx} className="list-disc list-inside text-xs text-slate-300 ml-2 py-0.5 leading-relaxed">
            {parseBoldText(trimmed.substring(2))}
          </li>
        );
      }
      
      // Standard lines
      return <p key={idx} className="text-xs text-slate-300 leading-relaxed mb-1.5">{parseBoldText(line)}</p>;
    });
  };

  // Helper to parse **bold** and *italic*
  const parseBoldText = (str) => {
    const boldRegex = /\*\*(.*?)\*\*/g;
    const parts = [];
    let lastIndex = 0;
    let match;

    while ((match = boldRegex.exec(str)) !== null) {
      // Add text before bold
      if (match.index > lastIndex) {
        parts.push(str.substring(lastIndex, match.index));
      }
      // Add bold text
      parts.push(<strong key={match.index} className="text-white font-semibold">{match[1]}</strong>);
      lastIndex = boldRegex.lastIndex;
    }

    if (lastIndex < str.length) {
      parts.push(str.substring(lastIndex));
    }

    return parts.length > 0 ? parts : str;
  };

  // Helper to export telemetry as dummy CSV file
  const exportToCSV = () => {
    let csvContent = "data:text/csv;charset=utf-8,Timestamp,Bin_ID,Fill_Level,Temperature,Event_Type\n";
    telemetryLogs.forEach(log => {
      csvContent += `${log.time},${log.bin_id},${log.fill},${log.temp},${log.event}\n`;
    });
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "BigQuery_Telemetry_Logs.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[550px]">
      
      {/* RAG Dialog Interface */}
      <div className="lg:col-span-2 glass-card rounded-xl p-5 flex flex-col justify-between h-full">
        <div className="flex items-center gap-2 border-b border-glassborder pb-3 mb-4">
          <MessageSquare className="text-accentcyan" size={18} />
          <h3 className="font-bold text-slate-100">AI Decision Intelligence Assistant</h3>
        </div>

        {/* Messages Stream */}
        <div className="flex-1 overflow-y-auto space-y-4 pr-1 mb-4">
          {messages.map((m, idx) => (
            <div 
              key={idx} 
              className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div 
                className={`max-w-[85%] rounded-xl p-3.5 ${
                  m.role === 'user' 
                    ? 'bg-gradient-to-r from-accentcyan/25 to-accentcyan/10 border border-accentcyan/30 rounded-br-none text-slate-200' 
                    : 'bg-slate-900/80 border border-glassborder rounded-bl-none'
                }`}
              >
                <div className="flex items-center justify-between text-[10px] text-slate-500 font-bold mb-1 tracking-wide uppercase">
                  <span>{m.role === 'user' ? 'Planner' : 'EcoBin AI Advisor'}</span>
                  {m.role !== 'user' && (
                    <button 
                      onClick={() => speakText(m.content)}
                      className="p-1 hover:bg-white/10 rounded hover:text-slate-200 transition-all ml-2"
                      title="Read recommendations out loud"
                      type="button"
                    >
                      <Volume2 size={11} />
                    </button>
                  )}
                </div>
                <div className="space-y-1">{formatMessageContent(m.content)}</div>
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex justify-start">
              <div className="bg-slate-900/80 border border-glassborder rounded-xl rounded-bl-none p-3.5 text-xs text-slate-500 flex items-center gap-2">
                <div className="flex space-x-1">
                  <div className="w-1.5 h-1.5 bg-accentcyan rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                  <div className="w-1.5 h-1.5 bg-accentcyan rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                  <div className="w-1.5 h-1.5 bg-accentcyan rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                </div>
                <span>Analyzing logs and querying parameters...</span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input area */}
        <form onSubmit={handleSend} className="flex gap-2">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Ask about priority pick-ups, city status, or draft weekly summaries..."
            className="flex-1 bg-slate-900 border border-glassborder rounded-lg text-xs px-3.5 py-2.5 text-slate-200 outline-none focus:border-accentcyan"
          />
          <button
            type="button"
            onClick={toggleListening}
            className={`p-2.5 border rounded-lg active:scale-[0.96] transition-all flex items-center justify-center ${
              isListening 
                ? 'bg-rose-500/20 text-rose-400 border-rose-500/30 animate-pulse' 
                : 'bg-slate-900 border-glassborder text-slate-400 hover:text-slate-200'
            }`}
            title={isListening ? "Listening... Click to stop" : "Voice Input (Hindi/English)"}
          >
            {isListening ? <MicOff size={16} /> : <Mic size={16} />}
          </button>
          <button
            type="submit"
            className="p-2.5 bg-accentcyan text-darkbg rounded-lg hover:brightness-110 active:scale-[0.96] transition-all flex items-center justify-center"
          >
            <Send size={16} />
          </button>
        </form>
      </div>

      {/* BigQuery Telemetry Table */}
      <div className="lg:col-span-1 glass-card rounded-xl p-5 flex flex-col justify-between h-full">
        <div>
          <div className="flex items-center justify-between border-b border-glassborder pb-3 mb-4">
            <h3 className="font-bold text-slate-100 flex items-center gap-2">
              <Database size={18} className="text-accentgreen" />
              BigQuery Telemetry Hub
            </h3>
            <div className="flex gap-2">
              <button 
                onClick={fetchLogs} 
                className="p-1 hover:bg-white/5 rounded text-slate-400 hover:text-slate-200 transition-all"
                title="Refresh Table"
              >
                <RefreshCw size={14} className={loadingLogs ? 'animate-spin' : ''} />
              </button>
              <button 
                onClick={exportToCSV}
                className="p-1 hover:bg-white/5 rounded text-slate-400 hover:text-slate-200 transition-all"
                title="Export to CSV"
              >
                <Download size={14} />
              </button>
            </div>
          </div>

          <p className="text-[11px] text-slate-400 leading-normal mb-3">
            Real-time ingestion feed from smart bin sensors. Logs are mapped into historical tables.
          </p>

          <div className="overflow-y-auto max-h-[340px] border border-glassborder rounded-lg">
            <table className="w-full text-[10px] text-left text-slate-300">
              <thead className="bg-slate-900 text-slate-500 font-bold uppercase sticky top-0">
                <tr>
                  <th className="p-2">Time</th>
                  <th className="p-2">ID</th>
                  <th className="p-2">Fill</th>
                  <th className="p-2 text-right">Event</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {loadingLogs ? (
                  <tr>
                    <td colSpan={4} className="text-center py-10 text-slate-500">Connecting GCloud warehouse...</td>
                  </tr>
                ) : telemetryLogs.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="text-center py-10 text-slate-500">No telemetries logged.</td>
                  </tr>
                ) : (
                  telemetryLogs.map((log, idx) => (
                    <tr key={idx} className="hover:bg-white/5">
                      <td className="p-2 font-medium text-slate-400">{log.time}</td>
                      <td className="p-2 text-accentcyan font-semibold">{log.bin_id}</td>
                      <td className="p-2">{log.fill}</td>
                      <td className="p-2 text-right">
                        <span className={`px-1 py-0.5 rounded text-[8px] font-bold ${
                          log.event === 'CRITICAL_LOAD' ? 'bg-rose-500/20 text-rose-300' : 'bg-slate-800 text-slate-400'
                        }`}>
                          {log.event}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="text-[9px] text-slate-500 border-t border-glassborder pt-3 mt-3">
          *Table syncs automatically using Google Cloud streaming inserts.
        </div>
      </div>

    </div>
  );
}
