
import React, { useState, useEffect, useRef } from 'react';
import { GoogleGenAI, Type } from '@google/genai';
import type { Book } from '../App';
import { TerminalIcon, PlusIcon, TrashIcon, SearchIcon, EditIcon, SparklesIcon } from './Icons';
import { useConfirmation } from '../contexts/ConfirmationContext';

interface QueueItem {
  isbn: string;
  note: string;
  date: string;
}

interface DevToolsModalProps {
  books: Book[];
  onClose: () => void;
  onAddSuccess: () => void;
  onManualEdit: (bookData: Partial<Book>) => void;
}

const API_URL = (import.meta as any).env.VITE_API_URL || '';

type DevTab = 'scanner' | 'queue';

const DevToolsModal: React.FC<DevToolsModalProps> = ({ books, onClose, onAddSuccess, onManualEdit }) => {
  const [activeTab, setActiveTab] = useState<DevTab>('scanner');
  const [isbnInput, setIsbnInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [lastScannedBook, setLastScannedBook] = useState<Book | null>(null);
  const [isDuplicateDetected, setIsDuplicateDetected] = useState(false);
  
  // State for AI Deep Scan
  const [aiDiscoveredBook, setAiDiscoveredBook] = useState<Partial<Book> | null>(null);
  const [isAiScanning, setIsAiScanning] = useState(false);

  // State for handling failed scan notes
  const [pendingUnresolved, setPendingUnresolved] = useState<string | null>(null);
  const [unresolvedNote, setUnresolvedNote] = useState('');

  const [logs, setLogs] = useState<{ msg: string; type: 'info' | 'success' | 'error' | 'ai' }[]>([]);
  const [checkLaterQueue, setCheckLaterQueue] = useState<QueueItem[]>(() => {
    const saved = localStorage.getItem('dev_check_later_queue_v2');
    if (saved) return JSON.parse(saved);
    
    const oldSaved = localStorage.getItem('dev_check_later_queue');
    if (oldSaved) {
        const oldData: string[] = JSON.parse(oldSaved);
        return oldData.map(isbn => ({ isbn, note: 'Legacy record', date: new Date().toISOString() }));
    }
    return [];
  });

  const inputRef = useRef<HTMLInputElement>(null);
  const noteInputRef = useRef<HTMLInputElement>(null);
  const { showConfirmation } = useConfirmation();

  useEffect(() => {
    localStorage.setItem('dev_check_later_queue_v2', JSON.stringify(checkLaterQueue));
  }, [checkLaterQueue]);

  useEffect(() => {
    if (activeTab === 'scanner') {
        if (pendingUnresolved && !isAiScanning && !aiDiscoveredBook) {
            noteInputRef.current?.focus();
        } else {
            inputRef.current?.focus();
        }
    }
  }, [activeTab, pendingUnresolved, isAiScanning, aiDiscoveredBook]);

  const addLog = (msg: string, type: 'info' | 'success' | 'error' | 'ai' = 'info') => {
    setLogs(prev => [{ msg, type }, ...prev].slice(0, 50));
  };

  const handleScan = async (e: React.FormEvent) => {
    e.preventDefault();
    const isbn = isbnInput.trim();
    if (!isbn) return;

    setIsProcessing(true);
    setIsDuplicateDetected(false);
    setAiDiscoveredBook(null);
    addLog(`Scanning ISBN: ${isbn}...`, 'info');
    setIsbnInput('');

    const cleanIsbn = isbn.replace(/[-\s]/g, '');
    const localDuplicate = books.find(b => b.ISBN?.replace(/[-\s]/g, '') === cleanIsbn);
    
    if (localDuplicate) {
        addLog(`Duplicate detected: ISBN ${isbn} is already in library.`, 'info');
        setLastScannedBook(localDuplicate);
        setIsDuplicateDetected(true);
        setIsProcessing(false);
        return;
    }

    try {
      const searchResponse = await fetch(`${API_URL}/api/search?q=${encodeURIComponent(isbn)}`);
      if (!searchResponse.ok) throw new Error('Search failed');
      const results = await searchResponse.json();

      if (!results || results.length === 0) {
        addLog(`ISBN ${isbn} not found in Standard DB. Deep Scan required.`, 'error');
        setPendingUnresolved(isbn);
        return;
      }

      const bestMatch = results[0];
      const foundIsbn = bestMatch.isbn?.replace(/[-\s]/g, '');
      if (foundIsbn) {
          const matchedDuplicate = books.find(b => b.ISBN?.replace(/[-\s]/g, '') === foundIsbn);
          if (matchedDuplicate) {
              addLog(`Found "${bestMatch.title}", but it's already in library.`, 'info');
              setLastScannedBook(matchedDuplicate);
              setIsDuplicateDetected(true);
              return;
          }
      }

      addLog(`Found: "${bestMatch.title}"`, 'success');

      const bookData: Partial<Book> = {
        Title: bestMatch.title,
        Author: bestMatch.authors?.join(', '),
        Publisher: bestMatch.publisher,
        "Published Date": bestMatch.publishedDate,
        Summary: bestMatch.summary,
        ISBN: bestMatch.isbn || isbn,
        Pages: bestMatch.pages,
        "Image Url": bestMatch.imageUrl,
        Rating: bestMatch.rating,
        is_wishlist: false,
        "Added Date": new Date().toISOString()
      };

      const saveResponse = await fetch(`${API_URL}/api/books`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bookData),
      });

      if (!saveResponse.ok) throw new Error('Failed to save book');
      
      const savedBook = await saveResponse.json();
      setLastScannedBook(savedBook);
      addLog(`Added "${bestMatch.title}" to library.`, 'success');
      onAddSuccess();

    } catch (err) {
      addLog(`Error processing ${isbn}: ${err instanceof Error ? err.message : 'Unknown error'}`, 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleAiDeepScan = async () => {
    if (!pendingUnresolved || !process.env.API_KEY) return;
    
    setIsAiScanning(true);
    addLog(`Initiating Deep Scan for ISBN ${pendingUnresolved}${unresolvedNote ? ' with user context' : ''}...`, 'ai');
    
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Identify and provide precise metadata for the book with ISBN: ${pendingUnresolved}. 
        ${unresolvedNote ? `IMPORTANT CONTEXT FROM USER: "${unresolvedNote}". Use this to narrow down the search if multiple editions exist.` : ""}
        Check lubimyczytac.pl, Google Books, and Polish book stores for accurate data. 
        YOU MUST RETURN JSON. Title, Author, Summary must be in Polish. 
        Ensure 'imageUrl' points to a valid cover image if possible.`,
        config: {
          tools: [{ googleSearch: {} }],
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              author: { type: Type.STRING },
              publisher: { type: Type.STRING },
              publishedDate: { type: Type.STRING },
              summary: { type: Type.STRING },
              pages: { type: Type.INTEGER },
              imageUrl: { type: Type.STRING, description: "Direct URL to high quality cover image" }
            },
            required: ["title", "author"]
          }
        }
      });

      const text = response.text;
      if (!text) throw new Error("AI returned empty result");
      
      const data = JSON.parse(text);
      addLog(`Identity Discovered: "${data.title}"`, 'success');
      
      setAiDiscoveredBook({
        Title: data.title,
        Author: data.author,
        Publisher: data.publisher,
        "Published Date": data.publishedDate,
        Summary: data.summary,
        Pages: data.pages,
        "Image Url": data.imageUrl,
        ISBN: pendingUnresolved,
        "Added Date": new Date().toISOString()
      });
    } catch (err) {
      addLog(`Deep Scan failed to identify ISBN ${pendingUnresolved}.`, 'error');
      alert("AI was unable to find this book even with deep search. Adding to Manual Queue is recommended.");
    } finally {
      setIsAiScanning(false);
    }
  };

  const confirmAiDiscovery = async () => {
    if (!aiDiscoveredBook) return;
    
    setIsProcessing(true);
    try {
        const response = await fetch(`${API_URL}/api/books`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(aiDiscoveredBook),
        });
        if (!response.ok) throw new Error('Failed to save AI discovery');
        
        const savedBook = await response.json();
        setLastScannedBook(savedBook);
        addLog(`AI Discovery "${savedBook.Title}" added to library.`, 'success');
        setAiDiscoveredBook(null);
        setPendingUnresolved(null);
        setUnresolvedNote(''); // Clear note on success
        onAddSuccess();
    } catch (err) {
        addLog('Error saving AI discovery.', 'error');
    } finally {
        setIsProcessing(false);
    }
  };

  const handleAddToQueue = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pendingUnresolved) return;

    const newItem: QueueItem = {
        isbn: pendingUnresolved,
        note: unresolvedNote || 'No description provided',
        date: new Date().toISOString()
    };

    setCheckLaterQueue(prev => [...prev, newItem]);
    addLog(`Added ${pendingUnresolved} to Review Queue.`, 'info');
    setPendingUnresolved(null);
    setUnresolvedNote('');
    setAiDiscoveredBook(null);
  };

  const handleDeleteLast = async (silent = false) => {
    if (!lastScannedBook || isDuplicateDetected) return;
    
    const executeDelete = async () => {
        try {
          await fetch(`${API_URL}/api/books/${lastScannedBook.ID}`, { method: 'DELETE' });
          if (!silent) addLog(`Removed "${lastScannedBook.Title}" from library.`, 'info');
          setLastScannedBook(null);
          onAddSuccess();
        } catch (err) {
          addLog('Failed to delete book.', 'error');
        }
    };

    if (silent) {
        await executeDelete();
    } else {
        showConfirmation({
          title: 'Delete Last Scanned?',
          message: `Do you want to remove "${lastScannedBook.Title}" from the library?`,
          confirmText: 'Yes, Delete',
          confirmVariant: 'danger',
          onConfirm: executeDelete
        });
    }
  };

  const handleEditLast = () => {
    if (!lastScannedBook) return;
    // We don't delete the book anymore. We just open it for editing.
    // BookFormModal will see the ID and perform a PUT (update) instead of POST.
    onManualEdit(lastScannedBook);
  };

  const handleRemoveFromQueue = (isbn: string) => {
    setCheckLaterQueue(prev => prev.filter(item => item.isbn !== isbn));
  };

  const handleManualAddFromQueue = (item: QueueItem) => {
    onManualEdit({ ISBN: item.isbn, Title: item.note !== 'No description provided' ? item.note : '' });
    handleRemoveFromQueue(item.isbn);
  };

  const clearLogs = () => setLogs([]);

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[100] flex justify-center items-center p-4">
      <div className="bg-brand-primary border-2 border-orange-500/50 rounded-xl shadow-[0_0_30px_rgba(249,115,22,0.2)] w-full max-w-5xl h-[85vh] flex flex-col overflow-hidden">
        
        <header className="p-4 bg-orange-500/10 border-b border-orange-500/30 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <TerminalIcon className="h-6 w-6 text-orange-500" />
            <h2 className="text-xl font-mono font-bold text-orange-500 uppercase tracking-widest">DEV Laboratory v1.5</h2>
          </div>
          <button onClick={onClose} className="text-2xl font-bold text-brand-subtle hover:text-white leading-none">&times;</button>
        </header>

        <div className="flex bg-slate-900 border-b border-slate-700">
          <button onClick={() => { setActiveTab('scanner'); setPendingUnresolved(null); setAiDiscoveredBook(null); }} className={`px-6 py-3 text-sm font-mono uppercase tracking-wider transition-colors ${activeTab === 'scanner' ? 'bg-orange-500/20 text-orange-400 border-b-2 border-orange-500' : 'text-brand-subtle hover:bg-slate-800'}`}>
            [01] Scanner Engine
          </button>
          <button onClick={() => setActiveTab('queue')} className={`px-6 py-3 text-sm font-mono uppercase tracking-wider transition-colors ${activeTab === 'queue' ? 'bg-orange-500/20 text-orange-400 border-b-2 border-orange-500' : 'text-brand-subtle hover:bg-slate-800'}`}>
            [02] Review Queue ({checkLaterQueue.length})
          </button>
        </div>

        <div className="flex-grow overflow-hidden flex flex-col md:flex-row">
          {activeTab === 'scanner' ? (
            <>
              <div className="w-full md:w-1/2 p-6 flex flex-col border-r border-slate-800 overflow-y-auto bg-slate-900/30">
                <div className="flex flex-col space-y-6">
                  
                  {!pendingUnresolved ? (
                    <>
                      <div className="text-center space-y-2">
                        <p className="text-orange-500/80 font-mono text-[10px] uppercase tracking-[0.2em]">Awaiting Serial Data</p>
                        <h3 className="text-2xl font-bold text-brand-text">Scan ISBN</h3>
                      </div>

                      <form onSubmit={handleScan} className="w-full max-w-sm mx-auto relative">
                        <input
                          ref={inputRef}
                          type="text"
                          value={isbnInput}
                          onChange={(e) => setIsbnInput(e.target.value)}
                          disabled={isProcessing}
                          placeholder="SCAN NOW..."
                          className="w-full bg-black border-2 border-slate-700 focus:border-orange-500 text-center text-2xl font-mono p-4 rounded-lg focus:outline-none transition-all placeholder:text-slate-900 shadow-[inset_0_0_20px_rgba(0,0,0,0.8)]"
                          autoFocus
                        />
                        {isProcessing && (
                          <div className="absolute inset-0 bg-black/50 flex justify-center items-center rounded-lg">
                            <div className="w-6 h-6 border-2 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
                          </div>
                        )}
                      </form>
                    </>
                  ) : (
                    <div className="animate-in zoom-in-95 duration-200">
                      {!aiDiscoveredBook ? (
                        <div className="bg-red-500/10 border-2 border-red-500/50 rounded-xl p-5 space-y-5">
                            <div className="text-center">
                                <span className="text-[10px] font-mono text-red-500 uppercase font-bold tracking-widest">Identity Not Verified</span>
                                <h3 className="text-xl font-mono text-brand-text mt-1">{pendingUnresolved}</h3>
                            </div>
                            
                            <div className="flex flex-col gap-3">
                                <div className="space-y-1">
                                    <label className="text-[10px] font-mono text-slate-500 uppercase ml-1">Context / Clues for AI</label>
                                    <input
                                        ref={noteInputRef}
                                        type="text"
                                        value={unresolvedNote}
                                        onChange={(e) => setUnresolvedNote(e.target.value)}
                                        placeholder="Add Title or Author clues..."
                                        className="w-full bg-black border border-slate-700 focus:border-orange-500 p-2 text-sm rounded focus:outline-none transition-colors"
                                    />
                                </div>

                                <button 
                                    onClick={handleAiDeepScan}
                                    disabled={isAiScanning}
                                    className="w-full bg-brand-accent text-brand-primary font-bold py-3 rounded-lg flex items-center justify-center gap-2 hover:bg-sky-400 disabled:opacity-50 transition-all"
                                >
                                    {isAiScanning ? (
                                        <div className="w-4 h-4 border-2 border-brand-primary border-t-transparent rounded-full animate-spin"></div>
                                    ) : (
                                        <SparklesIcon className="h-4 w-4" />
                                    )}
                                    {isAiScanning ? 'DEEP SCANNING...' : 'AI DEEP SCAN'}
                                </button>
                                
                                <div className="relative">
                                    <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-700"></div></div>
                                    <div className="relative flex justify-center text-[10px] font-mono"><span className="px-2 bg-slate-900 text-slate-500 uppercase">OR ADD TO QUEUE</span></div>
                                </div>

                                <div className="flex gap-2">
                                    <button onClick={handleAddToQueue} className="flex-grow bg-slate-800 hover:bg-slate-700 text-brand-text py-2 rounded text-xs font-bold uppercase transition-colors">
                                        Add to Queue
                                    </button>
                                    <button type="button" onClick={() => { setPendingUnresolved(null); setAiDiscoveredBook(null); }} className="px-4 text-slate-500 text-xs hover:text-white underline">
                                        Discard
                                    </button>
                                </div>
                            </div>
                        </div>
                      ) : (
                        <div className="bg-green-500/10 border-2 border-green-500/50 rounded-xl p-5 space-y-4 animate-in fade-in duration-300">
                             <div className="text-center">
                                <span className="text-[10px] font-mono text-green-500 uppercase font-bold tracking-widest">Identity Discovered</span>
                                <h3 className="text-xl font-bold text-brand-text mt-1">{aiDiscoveredBook.Title}</h3>
                            </div>

                            <div className="flex gap-4">
                                <div className="w-20 h-28 flex-shrink-0 bg-black rounded shadow-lg overflow-hidden border border-green-500/30">
                                    <img 
                                        src={aiDiscoveredBook["Image Url"] || '/default-cover.svg'} 
                                        alt="Cover" 
                                        className="w-full h-full object-cover"
                                    />
                                </div>
                                <div className="flex-grow space-y-1">
                                    <p className="text-sm font-semibold text-brand-text">{aiDiscoveredBook.Author}</p>
                                    <p className="text-xs text-brand-subtle">{aiDiscoveredBook.Publisher}</p>
                                    <p className="text-[10px] text-slate-500 line-clamp-4 italic">{aiDiscoveredBook.Summary || "No summary found."}</p>
                                </div>
                            </div>

                            <div className="flex gap-2 pt-2">
                                <button 
                                    onClick={confirmAiDiscovery}
                                    className="flex-grow bg-green-600 hover:bg-green-500 text-white font-bold py-3 rounded-lg text-sm transition-all shadow-lg shadow-green-900/20"
                                >
                                    CONFIRM & ADD TO LIBRARY
                                </button>
                                <button 
                                    onClick={() => setAiDiscoveredBook(null)}
                                    className="px-4 bg-slate-800 text-slate-400 rounded-lg hover:bg-slate-700 transition-colors"
                                >
                                    RETRY
                                </button>
                            </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Visual Preview for Normal Scans */}
                  {lastScannedBook && !pendingUnresolved && !aiDiscoveredBook ? (
                    <div className={`animate-in fade-in slide-in-from-bottom-4 duration-500 border rounded-xl p-4 flex gap-4 relative group ${isDuplicateDetected ? 'bg-amber-500/5 border-amber-500/30' : 'bg-slate-900 border-orange-500/30'}`}>
                        <div className="w-24 h-36 flex-shrink-0 bg-black rounded shadow-lg overflow-hidden border border-slate-700">
                           <img 
                            src={lastScannedBook["Icon Path"] || '/default-cover.svg'} 
                            alt="Cover" 
                            className="w-full h-full object-cover"
                           />
                        </div>
                        <div className="flex-grow flex flex-col justify-between overflow-hidden">
                          <div>
                            <span className={`text-[10px] font-mono uppercase tracking-widest mb-1 block ${isDuplicateDetected ? 'text-amber-500' : 'text-green-500'}`}>
                                {isDuplicateDetected ? 'ALREADY IN LIBRARY' : 'SUCCESSFULLY LOGGED'}
                            </span>
                            <h4 className="text-lg font-bold text-brand-text truncate leading-tight">{lastScannedBook.Title}</h4>
                            <p className="text-xs text-brand-subtle truncate">{lastScannedBook.Author}</p>
                            <p className="text-[10px] text-slate-500 mt-2 line-clamp-3 italic">
                              {lastScannedBook.Summary || "No summary found."}
                            </p>
                          </div>
                          <div className="flex gap-4 mt-3">
                             <button onClick={handleEditLast} className="text-[10px] font-mono text-brand-accent hover:text-sky-300 flex items-center gap-1 transition-colors">
                                <EditIcon className="h-3 w-3" /> {isDuplicateDetected ? 'VIEW/EDIT' : 'CORRECT'}
                             </button>
                             {!isDuplicateDetected && (
                                <button onClick={() => handleDeleteLast()} className="text-[10px] font-mono text-red-500 hover:text-red-400 flex items-center gap-1 transition-colors">
                                    <TrashIcon className="h-3 w-3" /> UNDO
                                </button>
                             )}
                          </div>
                        </div>
                    </div>
                  ) : !pendingUnresolved && !aiDiscoveredBook && (
                    <div className="h-36 border-2 border-dashed border-slate-800 rounded-xl flex items-center justify-center">
                        <p className="text-slate-800 font-mono text-[10px] uppercase tracking-widest">Preview Terminal</p>
                    </div>
                  )}

                  <div className="bg-black/60 p-4 rounded-lg border border-slate-800 text-[10px] text-brand-subtle font-mono space-y-1 w-full">
                    <p className="text-slate-600 italic">// Diagnostics</p>
                    <p>&gt; ENGINE: {isProcessing || isAiScanning ? 'BUSY' : 'STANDBY'}</p>
                    <p>&gt; AI_PROTO: ENABLED (SEARCH_GROUNDING)</p>
                  </div>
                </div>
              </div>

              <div className="w-full md:w-1/2 bg-black/60 p-4 flex flex-col">
                <div className="flex justify-between items-center mb-2">
                    <span className="text-[10px] font-mono text-brand-subtle uppercase tracking-widest">Process Log</span>
                    <button onClick={clearLogs} className="text-[10px] font-mono text-slate-700 hover:text-brand-subtle underline uppercase">Clear</button>
                </div>
                <div className="flex-grow overflow-y-auto font-mono text-[11px] space-y-1 pr-2 scrollbar-thin scrollbar-thumb-slate-800">
                  {logs.length === 0 ? (
                    <p className="text-slate-900 font-bold uppercase py-2">System initialized. Awaiting scan...</p>
                  ) : (
                    logs.map((log, i) => (
                      <p key={i} className={`${
                        log.type === 'success' ? 'text-green-500' :
                        log.type === 'error' ? 'text-red-500' : 
                        log.type === 'ai' ? 'text-brand-accent italic' :
                        'text-slate-500'
                      }`}>
                        <span className="text-slate-800 mr-2">{new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit', second:'2-digit'})}</span>
                        <span className="mr-2">::</span>
                        {log.msg}
                      </p>
                    ))
                  )}
                </div>
              </div>
            </>
          ) : (
            <div className="w-full p-6 overflow-y-auto bg-slate-900/20">
              <div className="flex justify-between items-end mb-6">
                <div>
                  <h3 className="text-2xl font-bold text-brand-text">Review Queue</h3>
                  <p className="text-sm text-brand-subtle">Unresolved scans requiring manual identification.</p>
                </div>
                <span className="bg-orange-500/20 text-orange-500 px-3 py-1 rounded-full text-xs font-mono border border-orange-500/30">
                  {checkLaterQueue.length} ITEMS
                </span>
              </div>
              
              {checkLaterQueue.length === 0 ? (
                <div className="bg-slate-900/50 border border-slate-800 p-20 rounded-2xl text-center">
                    <SearchIcon className="h-16 w-16 text-slate-800 mx-auto mb-4" />
                    <p className="text-slate-600 font-mono uppercase tracking-widest">Queue Clear</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {checkLaterQueue.map((item) => (
                    <div key={item.isbn} className="bg-slate-800 border-l-4 border-l-orange-500 border border-slate-700 p-5 rounded-lg flex flex-col justify-between hover:border-slate-500 transition-all shadow-xl">
                      <div>
                        <div className="flex justify-between items-start mb-2">
                           <span className="text-[10px] font-mono text-orange-500 uppercase font-bold tracking-tighter">Unresolved ISBN</span>
                           <span className="text-[9px] font-mono text-slate-600">{new Date(item.date).toLocaleDateString()}</span>
                        </div>
                        <p className="text-xl font-mono font-bold text-brand-text mb-3">{item.isbn}</p>
                        
                        <div className="bg-black/40 p-3 rounded border border-slate-700/50 mb-5">
                            <span className="text-[9px] font-mono text-slate-500 uppercase block mb-1">User Note:</span>
                            <p className="text-sm text-brand-subtle italic">"{item.note}"</p>
                        </div>
                      </div>
                      
                      <div className="flex gap-2">
                        <button onClick={() => handleManualAddFromQueue(item)} className="flex-grow flex items-center justify-center gap-2 bg-brand-accent hover:bg-sky-400 text-brand-primary font-bold py-2.5 rounded text-xs transition-colors">
                            <PlusIcon className="h-3 w-3" /> IDENTIFY & ADD
                        </button>
                        <button onClick={() => handleRemoveFromQueue(item.isbn)} className="bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white p-2.5 rounded transition-colors" title="Discard">
                            <TrashIcon className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        <footer className="p-3 bg-black/80 border-t border-slate-800 flex justify-between items-center text-[10px] font-mono text-slate-700">
           <div className="flex gap-4">
              <span>CORE_STABLE: <span className="text-green-900">LINKED</span></span>
              <span>BUFFER_READY: {checkLaterQueue.length}</span>
           </div>
           <span>LABS_VERSION_1.5.0_DEEP_SCAN</span>
        </footer>
      </div>
    </div>
  );
};

export default DevToolsModal;
