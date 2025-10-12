import React, { useState, useEffect, useCallback, useRef } from 'react';

// Simplified type, we only care about what's displayed and the image URL
type CoverSearchResult = {
  title: string;
  authors: string[];
  imageUrl: string;
  width?: number;
  height?: number;
};

interface CoverSearchModalProps {
  onClose: () => void;
  onSelectCover: (imageUrl: string) => void;
  initialQuery?: string;
}

const API_URL = (import.meta as any).env.VITE_API_URL || '';

const CoverSearchModal: React.FC<CoverSearchModalProps> = ({ onClose, onSelectCover, initialQuery = '' }) => {
  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [searchResults, setSearchResults] = useState<CoverSearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const processedUrls = useRef(new Set<string>());

  const performSearch = useCallback(async (query: string) => {
    if (!query) return;
    setIsSearching(true);
    setSearchResults([]);
    setError(null);
    processedUrls.current.clear();
    try {
      const response = await fetch(`${API_URL}/api/search?q=${encodeURIComponent(query)}`);
      if (!response.ok) {
        throw new Error('Search request failed.');
      }
      const data = await response.json();
      const filteredData = data.filter((r: any) => r.imageUrl);
      if (!filteredData || filteredData.length === 0) {
        setError('No results found for your query.');
      }
      setSearchResults(filteredData); 
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred.');
      console.error('Search failed:', err);
    } finally {
      setIsSearching(false);
    }
  }, []);
  
  // This useEffect fetches image dimensions
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

  const handleSelectResult = (result: CoverSearchResult) => {
    onSelectCover(result.imageUrl);
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[60] flex justify-center items-start p-4 overflow-y-auto">
      <div className="bg-brand-secondary rounded-lg shadow-2xl w-full max-w-2xl my-8 relative">
        <button onClick={onClose} className="absolute top-4 right-4 text-2xl font-bold text-brand-subtle hover:text-brand-text leading-none">&times;</button>
        <div className="p-6">
          <h2 className="text-2xl font-bold text-brand-text mb-4">Search For Cover</h2>
          <p className="text-sm text-brand-subtle mb-4">Search for a high-quality cover for your book.</p>
          <form onSubmit={handleSearch} className="flex gap-2 mb-4">
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="e.g., The Hobbit J.R.R. Tolkien"
              className="flex-grow bg-slate-900 border border-slate-700 text-brand-text rounded-md px-3 py-2 focus:ring-2 focus:ring-brand-accent focus:outline-none"
              autoFocus
            />
            <button type="submit" disabled={isSearching || !searchQuery} className="bg-brand-accent text-brand-primary font-bold px-4 py-2 rounded-md hover:bg-sky-400 disabled:bg-slate-600 disabled:cursor-not-allowed transition-colors">
              {isSearching ? 'Searching...' : 'Search'}
            </button>
          </form>

          <div className="min-h-[24rem] max-h-[60vh] overflow-y-auto pr-2">
            {isSearching && <p className="text-center text-brand-subtle py-8">Searching for covers...</p>}
            {error && <p className="text-center text-red-400 py-8">{error}</p>}
            {searchResults.length > 0 && (
              <ul className="mt-3 bg-slate-900/50 rounded-md">
                {searchResults.map((r, i) => (
                  <li key={`${r.imageUrl}-${i}`} onClick={() => handleSelectResult(r)} className="p-3 flex gap-4 items-center cursor-pointer hover:bg-brand-accent/20 border-b border-slate-700 last:border-b-0 transition-colors">
                    <img src={r.imageUrl} alt={`Cover of ${r.title}`} className="w-12 h-[72px] object-cover rounded flex-shrink-0 bg-slate-700"/>
                    <div className="flex-grow">
                      <p className="font-semibold text-brand-text">{r.title}</p>
                      <p className="text-sm text-brand-subtle">{r.authors?.join(', ')}</p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      {r.width && r.height ? (
                        <p className="text-xs font-mono text-brand-subtle bg-slate-700 px-2 py-1 rounded">{`${r.width} x ${r.height}`}</p>
                      ) : (
                        <p className="text-xs font-mono text-slate-500">Loading...</p>
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

export default CoverSearchModal;
