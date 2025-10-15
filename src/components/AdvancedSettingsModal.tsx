import React, { useState, useEffect, useMemo } from 'react';
import type { Book } from '../App';
import { TrashIcon } from './Icons';
import Tag from './Tag';
import { useConfirmation } from '../contexts/ConfirmationContext';

interface AdvancedSettingsModalProps {
  books: Book[];
  onClose: () => void;
  onComplete: () => void;
}

type ActiveTab = 'books' | 'genres' | 'bookshelves';

const API_URL = (import.meta as any).env.VITE_API_URL || '';

const AdvancedSettingsModal: React.FC<AdvancedSettingsModalProps> = ({ books, onClose, onComplete }) => {
  const [activeTab, setActiveTab] = useState<ActiveTab>('books');
  const [isProcessing, setIsProcessing] = useState(false);
  
  // States for selections
  const [selectedBookIds, setSelectedBookIds] = useState<Set<number>>(new Set());
  const [selectedGenres, setSelectedGenres] = useState<Set<string>>(new Set());
  const [selectedBookshelves, setSelectedBookshelves] = useState<Set<string>>(new Set());
  
  const { showConfirmation } = useConfirmation();

  // Memoized calculations
  const genreCounts = useMemo(() => {
    const counts = new Map<string, number>();
    books.forEach(book => {
        book.Genres?.split(',').forEach(g => {
            const trimmed = g.trim();
            if (trimmed) counts.set(trimmed, (counts.get(trimmed) || 0) + 1);
        });
    });
    return Array.from(counts.entries()).sort((a, b) => b[1] - a[1]);
  }, [books]);

  const bookshelfCounts = useMemo(() => {
    const counts = new Map<string, number>();
    books.forEach(book => {
        if (book.BookShelf) counts.set(book.BookShelf, (counts.get(book.BookShelf) || 0) + 1);
    });
    return Array.from(counts.entries()).sort((a, b) => b[1] - a[1]);
  }, [books]);

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
    };
    actionMap[type]();
  };

  // Generic "select all" handler
  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>, type: ActiveTab) => {
    const checked = e.target.checked;
    if (type === 'books') setSelectedBookIds(checked ? new Set(books.map(b => b.ID)) : new Set());
    if (type === 'genres') setSelectedGenres(checked ? new Set(genreCounts.map(g => g[0])) : new Set());
    if (type === 'bookshelves') setSelectedBookshelves(checked ? new Set(bookshelfCounts.map(b => b[0])) : new Set());
  };

  // Deletion handlers
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
              showConfirmation({title: 'Success', message:(await response.json()).message, confirmText: 'OK'});
              onComplete();
              onClose();
            } catch (err) { 
                const message = err instanceof Error ? err.message : 'An unknown error occurred.';
                showConfirmation({title: 'Error', message, confirmText: 'OK', confirmVariant: 'danger'});
            } finally { setIsProcessing(false); }
        }
    });
  };

  const handleDeleteGenres = async () => {
    if (selectedGenres.size === 0) return;
    showConfirmation({
        title: 'Confirm Genre Removal',
        message: `This will remove the selected ${selectedGenres.size} genre(s) from all associated books. This cannot be undone.`,
        confirmText: 'Remove Genres',
        confirmVariant: 'danger',
        onConfirm: async () => {
            setIsProcessing(true);
            try {
              const updates: Promise<any>[] = [];
              const genresToDelete = Array.from(selectedGenres);
              books.forEach(book => {
                const originalGenres = book.Genres?.split(',').map(g => g.trim()).filter(Boolean) || [];
                const newGenres = originalGenres.filter(g => !genresToDelete.includes(g));
                if (newGenres.length < originalGenres.length) {
                  // Create a minimal update object to avoid sending the entire book data back
                  const updatePayload = { Genres: newGenres.join(', ') };
                  updates.push(fetch(`${API_URL}/api/books/${book.ID}`, {
                    method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(updatePayload),
                  }));
                }
              });
              await Promise.all(updates);
              showConfirmation({title: 'Success', message: 'Selected genres have been removed from all books.', confirmText: 'OK'});
              onComplete();
              setSelectedGenres(new Set());
            } catch (err) { 
                showConfirmation({title: 'Error', message: 'An error occurred while removing genres.', confirmText: 'OK', confirmVariant: 'danger'});
            } finally { setIsProcessing(false); }
        }
    });
  };
  
  const handleDeleteBookshelves = async () => {
    if (selectedBookshelves.size === 0) return;
    showConfirmation({
        title: 'Confirm Bookshelf Removal',
        message: `This will un-assign ${selectedBookshelves.size} bookshelf/shelves from all associated books. This cannot be undone.`,
        confirmText: 'Remove Bookshelves',
        confirmVariant: 'danger',
        onConfirm: async () => {
            setIsProcessing(true);
            try {
              const updates: Promise<any>[] = [];
              const shelvesToDelete = Array.from(selectedBookshelves);
              books.forEach(book => {
                if (book.BookShelf && shelvesToDelete.includes(book.BookShelf)) {
                  const updatePayload = { BookShelf: null };
                  updates.push(fetch(`${API_URL}/api/books/${book.ID}`, {
                    method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(updatePayload),
                  }));
                }
              });
              await Promise.all(updates);
              showConfirmation({title: 'Success', message: 'Selected bookshelves have been removed from all books.', confirmText: 'OK'});
              onComplete();
              setSelectedBookshelves(new Set());
            } catch (err) { 
                showConfirmation({title: 'Error', message: 'An error occurred while removing bookshelves.', confirmText: 'OK', confirmVariant: 'danger'});
            } finally { setIsProcessing(false); }
        }
    });
  };

  const TabButton: React.FC<{ tab: ActiveTab; label: string }> = ({ tab, label }) => (
    <button onClick={() => setActiveTab(tab)} className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${activeTab === tab ? 'bg-brand-secondary text-brand-text' : 'bg-transparent text-brand-subtle hover:bg-slate-700'}`}>
      {label}
    </button>
  );

  const isAllSelected = (type: ActiveTab) => {
    if (type === 'books') return selectedBookIds.size > 0 && selectedBookIds.size === books.length;
    if (type === 'genres') return selectedGenres.size > 0 && selectedGenres.size === genreCounts.length;
    if (type === 'bookshelves') return selectedBookshelves.size > 0 && selectedBookshelves.size === bookshelfCounts.length;
    return false;
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex justify-center items-center p-4">
      <div className="bg-brand-primary border border-slate-700 rounded-lg shadow-2xl w-full max-w-4xl h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
        <header className="p-4 border-b border-slate-700 flex justify-between items-center">
          <h2 className="text-xl font-bold text-brand-text">Command Center</h2>
          <button onClick={onClose} className="text-2xl font-bold text-brand-subtle hover:text-brand-text leading-none">&times;</button>
        </header>

        <div className="flex-shrink-0 px-4 pt-4 bg-brand-primary">
            <div className="flex border-b border-slate-700">
                <TabButton tab="books" label="Manage Books" />
                <TabButton tab="genres" label="Manage Genres" />
                <TabButton tab="bookshelves" label="Manage Bookshelves" />
            </div>
        </div>

        <div className="flex-grow bg-brand-secondary overflow-y-auto">
          {activeTab === 'books' && (
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-800 sticky top-0 z-10"><tr className="border-b border-slate-600">
                  <th className="p-2 w-10"><input type="checkbox" onChange={(e) => handleSelectAll(e, 'books')} checked={isAllSelected('books')} className="w-4 h-4" /></th>
                  <th className="p-2 w-16">Cover</th><th className="p-2">Title</th><th className="p-2">Author</th>
              </tr></thead>
              <tbody>{books.map(book => (
                  <tr key={book.ID} className={`border-b border-slate-700 hover:bg-slate-700/50 cursor-pointer ${selectedBookIds.has(book.ID) ? 'bg-sky-900/50' : ''}`} onClick={() => handleSelect(book.ID, 'books')}>
                    <td className="p-2"><input type="checkbox" checked={selectedBookIds.has(book.ID)} readOnly className="w-4 h-4 pointer-events-none" /></td>
                    <td className="p-2"><img src={book['Icon Path'] || '/default-cover.svg'} alt={book.Title} className="w-10 h-14 object-cover rounded" /></td>
                    <td className="p-2 text-brand-text">{book.Title}</td><td className="p-2 text-brand-subtle">{book.Author}</td>
                  </tr>))}
              </tbody>
            </table>
          )}
          {activeTab === 'genres' && (
             <table className="w-full text-left text-sm">
              <thead className="bg-slate-800 sticky top-0 z-10"><tr className="border-b border-slate-600">
                  <th className="p-2 w-10"><input type="checkbox" onChange={(e) => handleSelectAll(e, 'genres')} checked={isAllSelected('genres')} className="w-4 h-4" /></th>
                  <th className="p-2">Genre</th><th className="p-2 w-24">Book Count</th>
              </tr></thead>
              <tbody>{genreCounts.map(([genre, count]) => (
                  <tr key={genre} className={`border-b border-slate-700 hover:bg-slate-700/50 cursor-pointer ${selectedGenres.has(genre) ? 'bg-sky-900/50' : ''}`} onClick={() => handleSelect(genre, 'genres')}>
                    <td className="p-2"><input type="checkbox" checked={selectedGenres.has(genre)} readOnly className="w-4 h-4 pointer-events-none" /></td>
                    <td className="p-2"><Tag name={genre} /></td><td className="p-2 text-brand-subtle">{count}</td>
                  </tr>))}
              </tbody>
            </table>
          )}
           {activeTab === 'bookshelves' && (
             <table className="w-full text-left text-sm">
              <thead className="bg-slate-800 sticky top-0 z-10"><tr className="border-b border-slate-600">
                  <th className="p-2 w-10"><input type="checkbox" onChange={(e) => handleSelectAll(e, 'bookshelves')} checked={isAllSelected('bookshelves')} className="w-4 h-4" /></th>
                  <th className="p-2">Bookshelf</th><th className="p-2 w-24">Book Count</th>
              </tr></thead>
              <tbody>{bookshelfCounts.map(([shelf, count]) => (
                  <tr key={shelf} className={`border-b border-slate-700 hover:bg-slate-700/50 cursor-pointer ${selectedBookshelves.has(shelf) ? 'bg-sky-900/50' : ''}`} onClick={() => handleSelect(shelf, 'bookshelves')}>
                    <td className="p-2"><input type="checkbox" checked={selectedBookshelves.has(shelf)} readOnly className="w-4 h-4 pointer-events-none" /></td>
                    <td className="p-2"><Tag name={shelf} /></td><td className="p-2 text-brand-subtle">{count}</td>
                  </tr>))}
              </tbody>
            </table>
          )}
        </div>

        {activeTab === 'books' && (
          <footer className="p-4 border-t border-slate-700 flex justify-between items-center bg-brand-primary">
            <p className="text-sm text-brand-subtle">{selectedBookIds.size} book(s) selected</p>
            <button onClick={handleDeleteBooks} disabled={selectedBookIds.size === 0 || isProcessing} className="bg-red-600 hover:bg-red-500 text-white font-bold py-2 px-4 rounded disabled:bg-slate-600 disabled:cursor-not-allowed flex items-center gap-2">
              <TrashIcon className="h-4 w-4" /> {isProcessing ? 'Deleting...' : 'Delete Selected'}
            </button>
          </footer>
        )}
        {activeTab === 'genres' && (
            <footer className="p-4 border-t border-slate-700 flex justify-between items-center bg-brand-primary">
                <p className="text-sm text-brand-subtle">{selectedGenres.size} genre(s) selected</p>
                <button onClick={handleDeleteGenres} disabled={selectedGenres.size === 0 || isProcessing} className="bg-red-600 hover:bg-red-500 text-white font-bold py-2 px-4 rounded disabled:bg-slate-600 disabled:cursor-not-allowed flex items-center gap-2">
                <TrashIcon className="h-4 w-4" /> {isProcessing ? 'Removing...' : 'Remove Selected'}
                </button>
            </footer>
        )}
        {activeTab === 'bookshelves' && (
            <footer className="p-4 border-t border-slate-700 flex justify-between items-center bg-brand-primary">
                <p className="text-sm text-brand-subtle">{selectedBookshelves.size} bookshelf/shelves selected</p>
                <button onClick={handleDeleteBookshelves} disabled={selectedBookshelves.size === 0 || isProcessing} className="bg-red-600 hover:bg-red-500 text-white font-bold py-2 px-4 rounded disabled:bg-slate-600 disabled:cursor-not-allowed flex items-center gap-2">
                <TrashIcon className="h-4 w-4" /> {isProcessing ? 'Removing...' : 'Remove Selected'}
                </button>
            </footer>
        )}
      </div>
    </div>
  );
};

export default AdvancedSettingsModal;