
import React, { useState, useEffect, useRef } from 'react';
import { GoogleGenAI } from '@google/genai';
import type { Book } from '../App';
import { SparklesIcon, SearchIcon } from './Icons';

interface AIAssistantModalProps {
  books: Book[];
  onClose: () => void;
  onBookSelect: (book: Book) => void;
}

const AIAssistantModal: React.FC<AIAssistantModalProps> = ({ books, onClose, onBookSelect }) => {
  const [query, setQuery] = useState('');
  const [messages, setMessages] = useState<{ role: 'user' | 'ai'; text: string }[]>([
    { role: 'ai', text: 'Cześć! Jestem Twoim inteligentnym bibliotekarzem. Pomogę Ci znaleźć coś do poczytania w Twoich zbiorach lub streszczę dowolną książkę. O co chcesz zapytać?' }
  ]);
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo(0, scrollRef.current.scrollHeight);
  }, [messages, isTyping]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim() || isTyping) return;

    if (!process.env.API_KEY) {
      setMessages(prev => [...prev, { role: 'ai', text: "Błąd konfiguracji: Nie znaleziono klucza API Gemini. Upewnij się, że zmienna GEMINI_API_KEY jest ustawiona." }]);
      return;
    }

    const userMsg = query.trim();
    setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setQuery('');
    setIsTyping(true);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      
      // Context: only send relevant data to keep prompt size manageable
      const libraryContext = books.map(b => ({
        title: b.Title,
        author: b.Author,
        rating: b.Rating,
        genres: b.Genres,
        read: b.Read ? 'Yes' : 'No'
      }));

      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `You are a professional librarian for a user's personal "Home Book Library". 
        Answer the user's question concisely in Polish.
        Context of user library: ${JSON.stringify(libraryContext.slice(0, 100))}
        User question: ${userMsg}`,
        config: {
          systemInstruction: "Odpowiadaj po polsku jako pomocny bibliotekarz. Bądź entuzjastyczny i merytoryczny. Jeśli użytkownik prosi o rekomendację, wybierz coś z jego listy."
        }
      });

      const aiText = response.text || "Przepraszam, nie mogłem przetworzyć tej prośby.";
      setMessages(prev => [...prev, { role: 'ai', text: aiText }]);
    } catch (err) {
      console.error("AI Assistant ERROR details:", err);
      setMessages(prev => [...prev, { role: 'ai', text: "Wystąpił błąd połączenia z Gemini. Sprawdź konsolę przeglądarki (F12) po więcej szczegółów." }]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[100] flex justify-center items-center p-4" onClick={onClose}>
      <div 
        className="bg-brand-primary border border-brand-accent/30 rounded-2xl shadow-[0_0_50px_rgba(56,189,248,0.15)] w-full max-w-2xl h-[80vh] flex flex-col overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        <header className="p-4 bg-brand-secondary/50 border-b border-slate-800 flex justify-between items-center">
          <div className="flex items-center gap-3 text-brand-accent">
            <SparklesIcon className="h-6 w-6 animate-pulse" />
            <h2 className="text-xl font-bold uppercase tracking-widest">AI Librarian</h2>
          </div>
          <button onClick={onClose} className="text-2xl font-bold text-brand-subtle hover:text-white">&times;</button>
        </header>

        <div ref={scrollRef} className="flex-grow p-4 overflow-y-auto space-y-4 scrollbar-thin scrollbar-thumb-slate-800">
          {messages.map((m, i) => (
            <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[85%] p-3 rounded-2xl text-sm leading-relaxed ${
                m.role === 'user' 
                  ? 'bg-brand-accent text-brand-primary font-semibold rounded-tr-none shadow-lg' 
                  : 'bg-slate-800 text-brand-text rounded-tl-none border border-slate-700 shadow-md'
              }`}>
                {m.text}
              </div>
            </div>
          ))}
          {isTyping && (
            <div className="flex justify-start">
              <div className="bg-slate-800 p-3 rounded-2xl rounded-tl-none border border-slate-700">
                <div className="flex gap-1">
                  <div className="w-1.5 h-1.5 bg-brand-accent rounded-full animate-bounce"></div>
                  <div className="w-1.5 h-1.5 bg-brand-accent rounded-full animate-bounce [animation-delay:0.2s]"></div>
                  <div className="w-1.5 h-1.5 bg-brand-accent rounded-full animate-bounce [animation-delay:0.4s]"></div>
                </div>
              </div>
            </div>
          )}
        </div>

        <form onSubmit={handleSend} className="p-4 bg-brand-secondary/30 border-t border-slate-800 flex gap-2">
          <input
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Zapytaj o książkę lub poproś o radę..."
            className="flex-grow bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-brand-text focus:ring-2 focus:ring-brand-accent outline-none"
            autoFocus
          />
          <button 
            type="submit" 
            disabled={isTyping || !query.trim()}
            className="bg-brand-accent text-brand-primary p-3 rounded-xl hover:scale-105 active:scale-95 transition-all disabled:opacity-50 disabled:scale-100"
          >
            <SearchIcon className="h-5 w-5" />
          </button>
        </form>
      </div>
    </div>
  );
};

export default AIAssistantModal;
