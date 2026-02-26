
import React, { useState, useRef, useEffect } from 'react';
import { getGeminiAdvice } from '../services/geminiService';
import { MessageSquare, Send, X, Sparkles, Loader2, Dog, Fish, Cat } from 'lucide-react';

const quickSuggestions = [
  { label: 'Cibo per cani', icon: <Dog size={14} />, query: 'Che cibo consigli per il mio cane?' },
  { label: 'Acquario', icon: <Fish size={14} />, query: 'Come allestire un acquario per principianti?' },
  { label: 'Cura del gatto', icon: <Cat size={14} />, query: 'Consigli per la cura quotidiana del gatto?' },
];

export const AiAdvisor: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [messages, setMessages] = useState<{ role: 'user' | 'ai', text: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(true);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isOpen]);

  const sendMessage = async (text: string) => {
    if (!text.trim()) return;
    setShowSuggestions(false);
    setMessages(prev => [...prev, { role: 'user', text }]);
    setQuery('');
    setLoading(true);

    const response = await getGeminiAdvice(text, "L'utente sta navigando nel negozio.");

    setMessages(prev => [...prev, { role: 'ai', text: response }]);
    setLoading(false);
  };

  const handleSend = () => sendMessage(query);

  return (
    <>
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 bg-nature-600 text-white p-4 rounded-full shadow-2xl hover:bg-nature-700 hover:scale-110 transition-all z-40 group min-w-[56px] min-h-[56px] flex items-center justify-center"
          aria-label="Apri chat assistente"
        >
          <MessageSquare size={24} />
          <span className="absolute right-full mr-3 top-1/2 -translate-y-1/2 bg-white text-nature-800 text-sm px-3 py-1.5 rounded-lg shadow-md opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none font-bold">
            Chiedi all'Esperto
          </span>
        </button>
      )}

      {isOpen && (
        <div className="fixed bottom-4 right-4 md:bottom-6 md:right-6 w-[calc(100vw-2rem)] md:w-96 h-[500px] max-h-[80vh] bg-white rounded-2xl shadow-2xl flex flex-col z-50 border border-nature-100 overflow-hidden animate-fade-in-up">
          {/* Header */}
          <div className="bg-nature-600 p-4 flex justify-between items-center text-white flex-shrink-0">
            <div className="flex items-center gap-2">
              <Sparkles size={18} />
              <h3 className="font-bold">Esperto Birillo AI</h3>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="hover:bg-white/20 p-2 rounded-lg transition-colors min-w-[36px] min-h-[36px] flex items-center justify-center"
              aria-label="Chiudi chat"
            >
              <X size={18} />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-stone-50 custom-scrollbar">
            {/* Welcome message (always shown) */}
            <div className="flex justify-start">
              <div className="max-w-[85%] p-3 rounded-2xl rounded-bl-none text-sm bg-white border border-stone-200 text-stone-700 shadow-sm">
                Ciao! Sono l'esperto Birillo. Chiedimi consigli su cani, gatti, pesci, acquari e tutto il mondo animale!
              </div>
            </div>

            {/* Quick Suggestions */}
            {showSuggestions && messages.length === 0 && (
              <div className="flex flex-wrap gap-2 py-2">
                {quickSuggestions.map((sg, idx) => (
                  <button
                    key={idx}
                    onClick={() => sendMessage(sg.query)}
                    className="flex items-center gap-1.5 bg-white border border-nature-200 text-nature-700 px-3 py-2 rounded-full text-xs font-bold hover:bg-nature-50 hover:border-nature-300 transition-all shadow-sm"
                  >
                    {sg.icon} {sg.label}
                  </button>
                ))}
              </div>
            )}

            {/* Chat messages */}
            {messages.map((msg, idx) => (
              <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] p-3 rounded-2xl text-sm leading-relaxed ${msg.role === 'user'
                    ? 'bg-nature-600 text-white rounded-br-none'
                    : 'bg-white border border-stone-200 text-stone-700 rounded-bl-none shadow-sm'
                  }`}>
                  {msg.text}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-white border border-stone-200 p-3 rounded-2xl rounded-bl-none shadow-sm flex items-center gap-2">
                  <Loader2 size={16} className="animate-spin text-nature-500" />
                  <span className="text-xs text-stone-500">Consultando il manuale...</span>
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div className="p-3 bg-white border-t border-stone-100 flex gap-2 flex-shrink-0">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Chiedi sugli animali..."
              className="flex-1 bg-stone-100 rounded-full px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-nature-400 min-h-[44px]"
            />
            <button
              onClick={handleSend}
              disabled={loading || !query.trim()}
              className="bg-nature-600 text-white p-2.5 rounded-full hover:bg-nature-700 disabled:opacity-50 transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
              aria-label="Invia messaggio"
            >
              <Send size={18} />
            </button>
          </div>
        </div>
      )}
    </>
  );
};
