/**
 * Conversational Symptom Checker — chat-based AI system.
 * User types naturally, AI asks follow-ups, delivers structured analysis.
 */
import { useState, useRef, useEffect } from 'react';
import { symptomChatApi } from '../lib/api';
import { Spinner, Disclaimer } from '../components/UIKit';

const SEVERITY_STYLE = {
  Mild:     { bg: '#f0fdf4', border: '#86efac', text: '#15803d', icon: '🟢' },
  Moderate: { bg: '#fffbeb', border: '#fcd34d', text: '#b45309', icon: '🟡' },
  Severe:   { bg: '#fef2f2', border: '#fca5a5', text: '#b91c1c', icon: '🔴' },
};

function TypingIndicator() {
  return (
    <div className="flex gap-1 px-3 py-2">
      {[0, 1, 2].map(i => (
        <span key={i} className="w-2 h-2 rounded-full bg-stone-300"
          style={{ animation: `typing 1.2s infinite ${i * 0.2}s` }} />
      ))}
      <style>{`@keyframes typing { 0%,60%,100% { opacity: 0.3; transform: translateY(0); } 30% { opacity: 1; transform: translateY(-4px); } }`}</style>
    </div>
  );
}

function MessageBubble({ msg }) {
  const isUser = msg.role === 'user';
  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} animate-fade-in`}>
      {!isUser && (
        <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs mr-2 mt-1 flex-shrink-0"
          style={{ background: 'linear-gradient(135deg,#d1fae5,#a7f3d0)', color: '#065f46' }}>
          🩺
        </div>
      )}
      <div className={`max-w-[80%] px-4 py-2.5 text-sm leading-relaxed ${
        isUser
          ? 'bg-emerald-600 text-white rounded-2xl rounded-br-md'
          : 'bg-white border border-stone-200 text-stone-800 rounded-2xl rounded-bl-md shadow-sm'
      }`}>
        {isUser ? msg.content : <FormattedText text={msg.content} />}
      </div>
    </div>
  );
}

function FormattedText({ text }) {
  // Simple markdown-like formatting
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return (
    <span>
      {parts.map((part, i) => {
        if (part.startsWith('**') && part.endsWith('**')) {
          return <strong key={i} className="font-semibold text-stone-900">{part.slice(2, -2)}</strong>;
        }
        if (part.startsWith('_') && part.endsWith('_')) {
          return <em key={i} className="text-stone-500 text-xs">{part.slice(1, -1)}</em>;
        }
        // Handle line breaks and bullet points
        return part.split('\n').map((line, j) => (
          <span key={`${i}-${j}`}>
            {j > 0 && <br />}
            {line.startsWith('•') || line.startsWith('⚠️') ? (
              <span className="block pl-1 py-0.5">{line}</span>
            ) : line}
          </span>
        ));
      })}
    </span>
  );
}

function AnalysisCard({ analysis }) {
  if (!analysis) return null;
  const sev = SEVERITY_STYLE[analysis.severity] || SEVERITY_STYLE.Moderate;
  return (
    <div className="space-y-3 mt-2 animate-fade-in">
      <div className="rounded-xl p-4" style={{ background: sev.bg, border: `1.5px solid ${sev.border}` }}>
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xl">{sev.icon}</span>
          <span className="font-bold text-lg" style={{ color: sev.text }}>{analysis.severity}</span>
        </div>
        <p className="text-sm text-stone-700">{analysis.recommended_action}</p>
      </div>
      <div className="rounded-xl border border-stone-200 bg-white p-4">
        <h4 className="font-semibold text-sm text-stone-900 mb-2">Possible causes</h4>
        {analysis.causes?.slice(0, 4).map((c, i) => (
          <div key={i} className="flex items-center justify-between py-1.5 border-b border-stone-50 last:border-0">
            <span className="text-sm text-stone-800 capitalize">{c.name}</span>
            <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${
              c.confidence === 'high' ? 'bg-emerald-100 text-emerald-800' :
              c.confidence === 'moderate' ? 'bg-amber-100 text-amber-800' : 'bg-stone-100 text-stone-600'
            }`}>{c.confidence}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function SymptomChecker() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [context, setContext] = useState(null);
  const [analysis, setAnalysis] = useState(null);
  const [suggestions, setSuggestions] = useState([]);
  const scrollRef = useRef(null);
  const inputRef = useRef(null);

  // Initial greeting
  useEffect(() => {
    setMessages([{
      role: 'assistant',
      content: "Hello! I'm your health assistant. Tell me what symptoms you're experiencing — for example, \"I have a headache and fever.\""
    }]);
    setSuggestions(["I have headache", "I have fever and cough", "My stomach hurts"]);
  }, []);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, loading]);

  const send = async (text) => {
    const msg = text || input.trim();
    if (!msg || loading) return;
    setInput('');
    setSuggestions([]);
    setAnalysis(null);

    const userMsg = { role: 'user', content: msg };
    setMessages(prev => [...prev, userMsg]);
    setLoading(true);

    try {
      const history = messages.map(m => ({ role: m.role, content: m.content }));
      const { data } = await symptomChatApi.send({
        message: msg,
        history: [...history, userMsg],
        context,
      });

      setContext(data.context);
      setSuggestions(data.suggestions || []);
      setMessages(prev => [...prev, { role: 'assistant', content: data.reply }]);

      if (data.stage === 'analysis' && data.analysis) {
        setAnalysis(data.analysis);
      }
    } catch (e) {
      const errMsg = e.message || e.raw?.message || 'Something went wrong. Please try again.';
      if (e.code === 'USAGE_LIMIT') {
        // Paywall fires globally via api interceptor
      } else {
        setMessages(prev => [...prev, { role: 'assistant', content: `Sorry, I encountered an error: ${errMsg}` }]);
      }
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  };

  const reset = () => {
    setMessages([{
      role: 'assistant',
      content: "Let's start fresh. What symptoms are you experiencing?"
    }]);
    setContext(null);
    setAnalysis(null);
    setSuggestions(["I have headache", "I have fever and cough", "My stomach hurts"]);
  };

  return (
    <div className="flex flex-col h-full max-w-3xl mx-auto">
      {/* Header */}
      <div className="px-6 py-4 border-b border-stone-200 bg-white flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold text-stone-900 flex items-center gap-2">
            <span className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: 'linear-gradient(135deg,#d1fae5,#a7f3d0)' }}>🩺</span>
            Symptom Analysis
          </h1>
          <p className="text-xs text-stone-400 mt-0.5">AI-powered health intelligence</p>
        </div>
        {messages.length > 2 && (
          <button onClick={reset} className="text-xs text-stone-400 hover:text-stone-700 px-2.5 py-1 rounded-lg hover:bg-stone-50 transition-all">
            New chat
          </button>
        )}
      </div>

      {/* Chat messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-6 py-4 space-y-3"
        style={{ background: '#fafaf8' }}>
        {messages.map((msg, i) => (
          <MessageBubble key={i} msg={msg} />
        ))}
        {loading && (
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs"
              style={{ background: 'linear-gradient(135deg,#d1fae5,#a7f3d0)', color: '#065f46' }}>🩺</div>
            <div className="bg-white border border-stone-200 rounded-2xl rounded-bl-md px-3 py-1.5 shadow-sm">
              <TypingIndicator />
            </div>
          </div>
        )}
        {analysis && <AnalysisCard analysis={analysis} />}
      </div>

      {/* Suggestions */}
      {suggestions.length > 0 && !loading && (
        <div className="px-6 py-2 flex gap-2 flex-wrap border-t border-stone-100 bg-white">
          {suggestions.map((s, i) => (
            <button key={i} onClick={() => send(s)}
              className="px-3 py-1.5 rounded-full text-xs font-medium border border-emerald-200 text-emerald-700 bg-emerald-50 hover:bg-emerald-100 transition-all">
              {s}
            </button>
          ))}
        </div>
      )}

      {/* Input */}
      <div className="px-4 py-3 bg-white border-t border-stone-200">
        <div className="flex gap-2 items-end">
          <input
            ref={inputRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && !e.shiftKey && send()}
            placeholder="Describe your symptoms…"
            className="flex-1 px-4 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-sm
                       placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
            disabled={loading}
          />
          <button onClick={() => send()} disabled={loading || !input.trim()}
            className="w-10 h-10 rounded-xl flex items-center justify-center text-white transition-all disabled:opacity-40"
            style={{ background: loading ? '#d1d5db' : '#16a34a' }}>
            <svg viewBox="0 0 20 20" fill="none" className="w-4 h-4">
              <path d="M3 10l7-7 7 7M10 3v14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                style={{ transform: 'rotate(90deg)', transformOrigin: 'center' }} />
            </svg>
          </button>
        </div>
        <div className="mt-2">
          <Disclaimer text="AI health guidance only — not a medical diagnosis." />
        </div>
      </div>
    </div>
  );
}
