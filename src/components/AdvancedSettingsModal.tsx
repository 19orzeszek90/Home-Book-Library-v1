
import React, { useState, useEffect, useMemo } from 'react';
import type { Book } from '../App';
import { TrashIcon, AdjustmentsIcon } from './Icons';
import Tag from './Tag';
import { useConfirmation } from '../contexts/ConfirmationContext';

interface AdvancedSettingsModalProps {
  books: Book[];
  onClose: () => void;
  onComplete: () => void;
}

type ActiveTab = 'books' | 'genres' | 'bookshelves' | 'goals';

const API_URL = (import.meta as any).env.VITE_API_URL || '';

// Helper to normalize strings for merging duplicates (e.g. "Science Fiction" == "science fiction")
const normalizeValue = (val: string) => {
  const trimmed = val.trim();
  if (!trimmed) return '';
  return trimmed.charAt(0).toUpperCase() + trimmed.slice(1).toLowerCase();
};

const AdvancedSettingsModal: React.FC<AdvancedSettingsModalProps> = ({ books, onClose, onComplete }) => {
  const [activeTab, setActiveTab] = useState<ActiveTab>('books');
  const [isProcessing, setIsProcessing] = useState(false);
  
  // States for selections
  const [selectedBookIds, setSelectedBookIds] = useState<Set<number>>(new Set());
  const [selectedGenres, setSelectedGenres] = useState<Set<string>>(new Set());
  const [selectedBookshelves, setSelectedBookshelves] = useState<Set<string>>(new Set());
  
  // State for Reading Goal
  const [readingGoal, setReadingGoal] = useState<number>(() => {
    const savedGoal = localStorage.getItem('readingGoal2024');
    return savedGoal ? parseInt(savedGoal, 10) : 10;
  });
  const [goalInput, setGoalInput] = useState<string>(String(readingGoal));

  const { showConfirmation } = useConfirmation();

  // Memoized calculations with normalization to merge duplicates
  const genreCounts = useMemo(() => {
    const counts = new Map<string, number>();
    books.forEach(book => {
        book.Genres?.split(',').forEach(g => {
            const normalized = normalizeValue(g);
            if (normalized) counts.set(normalized, (counts.get(normalized) || 0) + 1);
        });
    });
    return Array.from(counts.entries()).sort((a, b) => b[1] - a[1]);
  }, [books]);

  const bookshelfCounts = useMemo(() => {
    const counts = new Map<string, number>();
    books.forEach(book => {
        if (book.BookShelf) {
            const normalized = normalizeValue(book.BookShelf);
            if (normalized) counts.set(normalized, (counts.get(normalized) || 0) + 1);
        }
    });
    return Array.from(counts.entries()).sort((a, b) => b[1] - a[1]);
  }, [books]);
  
  const booksReadThisYear = useMemo(() => {
      const currentYear = new Date().getFullYear();
      return books.filter(b => b.Read && b['Finished Reading Date'] && new Date(b['Finished Reading Date']).getFullYear() === currentYear).length;
  }, [books]);
  
  const progressPercentage = readingGoal > 0 ? (booksReadThisYear / readingGoal) * 100 : 0;

  useEffect(() => {
    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [onClose]);

  // Generic selection handler
  const handleSelect = (item: string | number, type: ActiveTab) => {
    const actionMap = {
      books: () => setSelectedBookIds(prev => { const next = new Set(prev); next.has(item as number) ? next.delete(item as number) : next.add(item as number); return next; }),
      genres: () => setSelectedGenres(prev => { const next = new Set(prev); next.has(item as string) ? next.delete(item as string) : next.add(item as string); return next; }),
      bookshelves: () => setSelectedBookshelves(prev => { const next = new Set(prev); next.has(item as string) ? next.delete(item as string) : next.add(item as string); return next; }),
      goals: () => {}, 
    };
    actionMap[type]();
  };

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>, type: ActiveTab) => {
    const checked = e.target.checked;
    if (type === 'books') setSelectedBookIds(checked ? new Set(books.map(b => b.ID)) : new Set());
    if (type === 'genres') setSelectedGenres(checked ? new Set(genreCounts.map(g => g[0])) : new Set());
    if (type === 'bookshelves') setSelectedBookshelves(checked ? new Set(bookshelfCounts.map(b => b[0])) : new Set());
  };
  
  const handleSetGoal = (e: React.FormEvent) => {
    e.preventDefault();
    const newGoal = parseInt(goalInput, 10);
    if (!isNaN(newGoal) && newGoal > 0) {
      setReadingGoal(newGoal);
      localStorage.setItem('readingGoal2024', String(newGoal));
      showConfirmation({ title: 'Goal Updated', message: `Your new reading goal for ${new Date().getFullYear()} is ${newGoal} books.`, confirmText: 'OK' });
    }
  };

  const handleDeleteBooks = async () => {
    if (selectedBookIds.size === 0) return;
    showConfirmation({
        title: 'Confirm Bulk Deletion',
        message: `Are you sure you want to delete ${selectedBookIds.size} book(s)? This action cannot be undone.`,
        confirmText: 'Delete Permanently',
        confirmVariant: 'danger',
        onConfirm: async () => {
            setIsProcessing(true);
            try {
              const response = await fetch(`${API_URL}/api/books`, {
                method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ids: Array.from(selectedBookIds) }),
              });
              if (!response.ok) throw new Error((await response.json()).error || 'Failed to delete books.');
              onComplete();
              onClose();
            } catch (err) { 
                showConfirmation({title: 'Error', message: 'Unknown error', confirmText: 'OK', confirmVariant: 'danger'});
            } finally { setIsProcessing(false); }
        }
    });
  };

  const handleDeleteGenres = async () => {
    if (selectedGenres.size === 0) return;
    showConfirmation({
        title: 'Confirm Genre Removal',
        message: `This will remove the selected ${selectedGenres.size} genre(s) from all associated books. Casing differences will be handled automatically.`,
        confirmText: 'Remove Genres',
        confirmVariant: 'danger',
        onConfirm: async () => {
            setIsProcessing(true);
            try {
              const updates: Promise<any>[] = [];
              // FIX: Explicitly type 'g' as string to resolve 'unknown' type error when calling toLowerCase().
              const genresToDelete = Array.from(selectedGenres).map((g: string) => g.toLowerCase());
              books.forEach(book => {
                const originalGenres = book.Genres?.split(',').map(g => g.trim()).filter(Boolean) || [];
                // FIX: Explicitly type 'g' as string to resolve 'unknown' type error when calling toLowerCase().
                const newGenres = originalGenres.filter((g: string) => !genresToDelete.includes(g.toLowerCase()));
                if (newGenres.length < originalGenres.length) {
                  const updatePayload = { Genres: newGenres.join(', ') };
                  updates.push(fetch(`${API_URL}/api/books/${book.ID}`, {
                    method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(updatePayload),
                  }));
                }
              });
              await Promise.all(updates);
              onComplete();
              setSelectedGenres(new Set());
            } catch (err) { 
                showConfirmation({title: 'Error', message: 'An error occurred.', confirmText: 'OK', confirmVariant: 'danger'});
            } finally { setIsProcessing(false); }
        }
    });
  };
  
  const handleDeleteBookshelves = async () => {
    if (selectedBookshelves.size === 0) return;
    showConfirmation({
        title: 'Confirm Bookshelf Removal',
        message: `This will un-assign the selected bookshelves from all associated books. Casing differences will be handled automatically.`,
        confirmText: 'Remove Bookshelves',
        confirmVariant: 'danger',
        onConfirm: async () => {
            setIsProcessing(true);
            try {
              const updates: Promise<any>[] = [];
              // FIX: Explicitly type 's' as string to resolve 'unknown' type error when calling toLowerCase().
              const shelvesToDelete = Array.from(selectedBookshelves).map((s: string) => s.toLowerCase());
              books.forEach(book => {
                // FIX: book.BookShelf is already defined as string | undefined, but ensure it's treated as string for toLowerCase().
                if (book.BookShelf && shelvesToDelete.includes(book.BookShelf.toLowerCase())) {
                  const updatePayload = { BookShelf: null };
                  updates.push(fetch(`${API_URL}/api/books/${book.ID}`, {
                    method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(updatePayload),
                  }));
                }
              });
              await Promise.all(updates);
              onComplete();
              setSelectedBookshelves(new Set());
            } catch (err) { 
                showConfirmation({title: 'Error', message: 'An error occurred.', confirmText: 'OK', confirmVariant: 'danger'});
            } finally { setIsProcessing(false); }
        }
    });
  };

  const TabButton: React.FC<{ tab: ActiveTab; label: string }> = ({ tab, label }) => (
    <button onClick={() => setActiveTab(tab)} className={`px-6 py-4 text-[10px] font-mono font-bold uppercase tracking-widest transition-all relative ${activeTab === tab ? 'text-brand-accent' : 'text-brand-subtle hover:text-brand-text'}`}>
      {label}
      {activeTab === tab && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-brand-accent shadow-[0_0_10px_#38bdf8]"></div>}
    </button>
  );

  const isAllSelected = (type: ActiveTab) => {
    if (type === 'books') return selectedBookIds.size > 0 && selectedBookIds.size === books.length;
    if (type === 'genres') return selectedGenres.size > 0 && selectedGenres.size === genreCounts.length;
    if (type === 'bookshelves') return selectedBookshelves.size > 0 && selectedBookshelves.size === bookshelfCounts.length;
    return false;
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex justify-center items-center p-4">
      <div className="bg-slate-950 border border-brand-accent/20 rounded-2xl shadow-[0_0_50px_rgba(56,189,248,0.1)] w-full max-w-4xl h-[85vh] flex flex-col overflow-hidden" onClick={e => e.stopPropagation()}>
        
        <header className="p-6 bg-brand-secondary/30 border-b border-white/5 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <AdjustmentsIcon className="h-6 w-6 text-brand-accent" />
            <h2 className="text-xl font-mono font-bold text-brand-text uppercase tracking-widest">Central Command & Parameters</h2>
          </div>
          <button onClick={onClose} className="text-2xl font-bold text-brand-subtle hover:text-white leading-none transition-colors">&times;</button>
        </header>

        <div className="flex-shrink-0 bg-slate-900/50 border-b border-white/5 flex">
            <TabButton tab="books" label="Records_Log" />
            <TabButton tab="genres" label="Taxonomy_Genres" />
            <TabButton tab="bookshelves" label="Grid_Shelves" />
            <TabButton tab="goals" label="Reading_Vector" />
        </div>

        <div className="flex-grow overflow-y-auto scrollbar-thin">
          {activeTab === 'books' && (
            <table className="w-full text-left font-mono text-[11px]">
              <thead className="bg-slate-900/80 sticky top-0 z-10 border-b border-white/5 shadow-xl">
                <tr className="text-brand-accent uppercase tracking-widest font-bold">
                  <th className="p-4 w-12"><input type="checkbox" onChange={(e) => handleSelectAll(e, 'books')} checked={isAllSelected('books')} className="w-4 h-4 accent-brand-accent" /></th>
                  <th className="p-4 w-16">Icon</th><th className="p-4">Entity_Title</th><th className="p-4">Author_Signature</th>
                </tr>
              </thead>
              <tbody>{books.map(book => (
                  <tr key={book.ID} className={`border-b border-white/5 hover:bg-brand-accent/5 cursor-pointer transition-colors ${selectedBookIds.has(book.ID) ? 'bg-brand-accent/10' : ''}`} onClick={() => handleSelect(book.ID, 'books')}>
                    <td className="p-4"><input type="checkbox" checked={selectedBookIds.has(book.ID)} readOnly className="w-4 h-4 accent-brand-accent pointer-events-none" /></td>
                    <td className="p-4"><img src={book['Icon Path'] || '/default-cover.svg'} alt={book.Title} className="w-8 h-12 object-cover rounded border border-white/10" /></td>
                    <td className="p-4 text-brand-text font-bold uppercase">{book.Title}</td><td className="p-4 text-brand-subtle uppercase opacity-60">{book.Author}</td>
                  </tr>))}
              </tbody>
            </table>
          )}
          {activeTab === 'genres' && (
             <table className="w-full text-left font-mono text-[11px]">
              <thead className="bg-slate-900/80 sticky top-0 z-10 border-b border-white/5 shadow-xl">
                <tr className="text-brand-accent uppercase tracking-widest font-bold">
                  <th className="p-4 w-12"><input type="checkbox" onChange={(e) => handleSelectAll(e, 'genres')} checked={isAllSelected('genres')} className="w-4 h-4 accent-brand-accent" /></th>
                  <th className="p-4">Taxonomy_Class</th><th className="p-4 w-24">Density</th>
                </tr>
              </thead>
              <tbody>{genreCounts.map(([genre, count]) => (
                  <tr key={genre} className={`border-b border-white/5 hover:bg-brand-accent/5 cursor-pointer transition-colors ${selectedGenres.has(genre) ? 'bg-brand-accent/10' : ''}`} onClick={() => handleSelect(genre, 'genres')}>
                    <td className="p-4"><input type="checkbox" checked={selectedGenres.has(genre)} readOnly className="w-4 h-4 accent-brand-accent pointer-events-none" /></td>
                    <td className="p-4"><Tag name={genre} /></td><td className="p-4 text-brand-subtle font-bold">{count} UNITS</td>
                  </tr>))}
              </tbody>
            </table>
          )}
           {activeTab === 'bookshelves' && (
             <table className="w-full text-left font-mono text-[11px]">
              <thead className="bg-slate-900/80 sticky top-0 z-10 border-b border-white/5 shadow-xl">
                <tr className="text-brand-accent uppercase tracking-widest font-bold">
                  <th className="p-4 w-12"><input type="checkbox" onChange={(e) => handleSelectAll(e, 'bookshelves')} checked={isAllSelected('bookshelves')} className="w-4 h-4 accent-brand-accent" /></th>
                  <th className="p-4">Storage_Shelf</th><th className="p-4 w-24">Density</th>
                </tr>
              </thead>
              <tbody>{bookshelfCounts.map(([shelf, count]) => (
                  <tr key={shelf} className={`border-b border-white/5 hover:bg-brand-accent/5 cursor-pointer transition-colors ${selectedBookshelves.has(shelf) ? 'bg-brand-accent/10' : ''}`} onClick={() => handleSelect(shelf, 'bookshelves')}>
                    <td className="p-4"><input type="checkbox" checked={selectedBookshelves.has(shelf)} readOnly className="w-4 h-4 accent-brand-accent pointer-events-none" /></td>
                    <td className="p-4"><Tag name={shelf} /></td><td className="p-4 text-brand-subtle font-bold">{count} UNITS</td>
                  </tr>))}
              </tbody>
            </table>
          )}
          {activeTab === 'goals' && (
            <div className="p-8 max-w-2xl mx-auto space-y-12">
                <section>
                    <div className="text-center mb-8">
                        <h3 className="text-2xl font-mono font-bold text-brand-text uppercase tracking-tight">Reading Objective Core</h3>
                        <p className="text-xs font-mono text-brand-accent/60 uppercase tracking-widest mt-1">Configure annual knowledge accumulation parameters</p>
                    </div>
                    
                    <div className="bg-slate-900/50 border border-white/5 p-8 rounded-2xl flex flex-col items-center gap-8">
                        <div className="w-full">
                            <div className="flex justify-between items-baseline mb-4">
                                <span className="text-brand-text font-mono font-bold text-xl uppercase tracking-tighter">{booksReadThisYear} / {readingGoal} Books</span>
                                <span className="text-brand-accent font-mono text-sm font-bold">{Math.round(progressPercentage)}% VECTOR_PATH</span>
                            </div>
                            <div className="w-full bg-slate-950 rounded-full h-3 border border-white/5 overflow-hidden">
                                <div className="bg-brand-accent h-full shadow-[0_0_10px_#38bdf8] transition-all duration-1000" style={{ width: `${progressPercentage}%` }}></div>
                            </div>
                        </div>
                        
                        <form onSubmit={handleSetGoal} className="w-full flex flex-col sm:flex-row items-center gap-4">
                            <div className="flex-grow w-full">
                                <label className="text-[10px] font-mono font-bold text-brand-accent/40 uppercase tracking-widest ml-1 mb-1 block">New Objective Value</label>
                                <input
                                    type="number"
                                    value={goalInput}
                                    onChange={(e) => setGoalInput(e.target.value)}
                                    className="w-full bg-slate-950 border border-white/10 rounded-xl px-4 py-3 text-center text-xl font-mono focus:border-brand-accent focus:outline-none transition-all"
                                    min="1"
                                />
                            </div>
                            <button type="submit" className="w-full sm:w-auto mt-auto bg-brand-accent text-brand-primary font-mono font-bold py-4 px-8 rounded-xl uppercase text-xs tracking-widest hover:scale-105 active:scale-95 transition-all">
                                Update_Param
                            </button>
                        </form>
                    </div>
                </section>
            </div>
          )}
        </div>

        {activeTab !== 'goals' && (
        <footer className="p-6 border-t border-white/5 flex justify-between items-center bg-slate-950">
            <div className="flex flex-col">
                <span className="text-[10px] font-mono text-brand-accent/40 uppercase tracking-widest">Active Selections</span>
                <p className="text-xs font-mono font-bold text-brand-text uppercase">
                    {activeTab === 'books' ? selectedBookIds.size : 
                     activeTab === 'genres' ? selectedGenres.size : 
                     selectedBookshelves.size} Targets_Locked
                </p>
            </div>
            
            <button 
              onClick={activeTab === 'books' ? handleDeleteBooks : activeTab === 'genres' ? handleDeleteGenres : handleDeleteBookshelves} 
              disabled={(activeTab === 'books' ? selectedBookIds.size : activeTab === 'genres' ? selectedGenres.size : selectedBookshelves.size) === 0 || isProcessing} 
              className="bg-red-600/10 hover:bg-red-600 text-red-500 hover:text-white border border-red-500/30 px-6 py-3 rounded-xl font-mono text-[10px] font-bold uppercase tracking-[0.2em] transition-all disabled:opacity-20 disabled:grayscale flex items-center gap-3 shadow-lg shadow-red-950/20"
            >
                <TrashIcon className="h-4 w-4" /> {isProcessing ? 'EXECUTING...' : 'Terminate_Data'}
            </button>
        </footer>
        )}
      </div>
    </div>
  );
};

export default AdvancedSettingsModal;
