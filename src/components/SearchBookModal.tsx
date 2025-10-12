import React, { useState, useEffect, useCallback, useRef } from 'react';
import type { Book } from '../App';
import StarRating from './StarRating';

type SearchResult = {
  title: string;
  authors: string[];
  publisher: string;
  publishedDate: string;
  summary: string;
  isbn: string;
  pages: number;
  imageUrl: string;
  width?: number;
  height?: number;
  rating?: number;
};

interface SearchBookModalProps {
  onClose: () => void;
  onSelectBook: (bookData: Partial<Book>) => void;
  initialQuery?: string;
}

const API_URL = (import.meta as any).env.VITE_API_URL || '';

const SearchBookModal: React.FC<SearchBookModalProps> = ({ onClose, onSelectBook, initialQuery = '' }) => {
  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const processedUrls = useRef(new Set<string>());

  const performSearch = useCallback(async (query: string) => {
    if (!query) return;
    setIsSearching(true);
    setSearchResults([]);
    setError(null);
    processedUrls.current.clear(); // Reset for new search
    try {
      const response = await fetch(`${API_URL}/api/search?q=${encodeURIComponent(query)}`);
      if (!response.ok) {
        throw new Error('Search request failed.');
      }
      const data = await response.json();
      if (!data || data.length === 0) {
        setError('No results found for your query.');
      }
      setSearchResults(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred.');
      console.error('Search failed:', err);
    } finally {
      setIsSearching(false);
    }
  }, []);
  
  useEffect(() => {
    const resultsToProcess = searchResults.filter(
      r => r.imageUrl && !processedUrls.current.has(r.imageUrl)
    );
  
    if (resultsToProcess.length === 0) return;
  
    resultsToProcess.forEach(result => {
      processedUrls.current.add(result.imageUrl!);
      const img = new Image();
      img.onload = () => {
        setSearchResults(currentResults =>
          currentResults.map(r =>
            r.imageUrl === result.imageUrl
              ? { ...r, width: img.naturalWidth, height: img.naturalHeight }
              : r
          )
        );
      };
      img.src = result.imageUrl!;
    });
  }, [searchResults]);

  useEffect(() => {
    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [onClose]);

  useEffect(() => {
    if (initialQuery) {
        performSearch(initialQuery);
    }
  }, [initialQuery, performSearch]);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    performSearch(searchQuery);
  };

  const handleSelectResult = (result: SearchResult) => {
    const bookData: Partial<Book> = {
      Title: result.title,
      Author: result.authors?.join(', '),
      Publisher: result.publisher,
      "Published Date": result.publishedDate,
      Summary: result.summary,
      ISBN: result.isbn,
      Pages: result.pages,
      "Image Url": result.imageUrl,
      Rating: result.rating,
    };
    onSelectBook(bookData);
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex justify-center items-start p-4 overflow-y-auto">
      <div className="bg-brand-secondary rounded-lg shadow-2xl w-full max-w-2xl my-8 relative">
        <button onClick={onClose} className="absolute top-4 right-4 text-2xl font-bold text-brand-subtle hover:text-brand-text leading-none">&times;</button>
        <div className="p-6">
          <h2 className="text-2xl font-bold text-brand-text mb-4">Search Online</h2>
          <p className="text-sm text-brand-subtle mb-4">Search by title, author, or ISBN to find a book and add it to your library.</p>
          <form onSubmit={handleSearch} className="flex gap-2 mb-4">
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="e.g., The Hobbit or 9780618640157"
              className="flex-grow bg-slate-900 border border-slate-700 text-brand-text rounded-md px-3 py-2 focus:ring-2 focus:ring-brand-accent focus:outline-none"
              autoFocus
            />
            <button type="submit" disabled={isSearching || !searchQuery} className="bg-brand-accent text-brand-primary font-bold px-4 py-2 rounded-md hover:bg-sky-400 disabled:bg-slate-600 disabled:cursor-not-allowed transition-colors">
              {isSearching ? 'Searching...' : 'Search'}
            </button>
          </form>

          <div className="min-h-[24rem] max-h-[60vh] overflow-y-auto pr-2">
            {isSearching && <p className="text-center text-brand-subtle py-8">Searching for books...</p>}
            {error && <p className="text-center text-red-400 py-8">{error}</p>}
            {searchResults.length > 0 && (
              <ul className="mt-3 bg-slate-900/50 rounded-md">
                {searchResults.map((r, i) => (
                  <li key={`${r.imageUrl}-${i}`} onClick={() => handleSelectResult(r)} className="p-3 flex gap-4 items-center cursor-pointer hover:bg-brand-accent/20 border-b border-slate-700 last:border-b-0 transition-colors">
                    <img src={r.imageUrl || '/default-cover.svg'} alt={`Cover of ${r.title}`} className="w-12 h-[72px] object-cover rounded flex-shrink-0 bg-slate-700"/>
                    <div>
                      <p className="font-semibold text-brand-text">{r.title}</p>
                      <p className="text-sm text-brand-subtle">{r.authors?.join(', ')}</p>
                      <p className="text-xs text-brand-subtle mt-1">{r.publisher}{r.publishedDate && `, ${r.publishedDate.substring(0,4)}`}</p>
                      {r.rating && r.rating > 0 && (
                        <div className="mt-1">
                            <StarRating rating={r.rating} />
                        </div>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SearchBookModal;