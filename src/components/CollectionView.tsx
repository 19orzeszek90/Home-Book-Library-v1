
import React, { useState, useMemo } from 'react';
import type { Book, GridSize } from '../App';
import BookCard from './BookCard';
import { ChevronDownIcon, TerminalIcon } from './Icons';

interface CollectionViewProps {
  books: Book[];
  gridSize: GridSize;
  onBookClick: (book: Book) => void;
  searchTerm: string;
}

const CollectionView: React.FC<CollectionViewProps> = ({ books, gridSize, onBookClick, searchTerm }) => {
  // Initialized as empty Set so all series are collapsed by default
  const [expandedSeries, setExpandedSeries] = useState<Set<string>>(new Set());

  const groupedBooks = useMemo(() => {
    const groups: Record<string, Book[]> = {};
    
    const filtered = searchTerm 
      ? books.filter(b => 
          b.Title.toLowerCase().includes(searchTerm.toLowerCase()) || 
          b.Author.toLowerCase().includes(searchTerm.toLowerCase()) ||
          b.Series?.toLowerCase().includes(searchTerm.toLowerCase())
        )
      : books;

    filtered.forEach(book => {
      const seriesName = book.Series?.trim() || 'Standalone Records';
      if (!groups[seriesName]) {
        groups[seriesName] = [];
      }
      groups[seriesName].push(book);
    });

    // Sort series names alphabetically, but keep "Standalone Records" at the end
    const sortedSeriesNames = Object.keys(groups).sort((a, b) => {
      if (a === 'Standalone Records') return 1;
      if (b === 'Standalone Records') return -1;
      return a.localeCompare(b, 'pl', { sensitivity: 'base' });
    });

    // Sort books within each series by Volume number
    sortedSeriesNames.forEach(name => {
      groups[name].sort((a, b) => (a.Volume ?? 999) - (b.Volume ?? 999));
    });

    return { sortedSeriesNames, groups };
  }, [books, searchTerm]);

  const toggleSeries = (name: string) => {
    setExpandedSeries(prev => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  };

  const gridClasses = useMemo(() => {
    const baseClasses = 'grid grid-cols-2 gap-4 sm:gap-8';
    const sizeMap: Record<GridSize, string> = {
        compact: `${baseClasses} sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7 2xl:grid-cols-8`,
        default: `${baseClasses} sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6`,
        cozy:    `${baseClasses} sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5`,
    };
    return sizeMap[gridSize];
  }, [gridSize]);

  if (groupedBooks.sortedSeriesNames.length === 0) {
    return (
        <div className="text-center py-32 bg-slate-900/20 border border-white/5 rounded-3xl">
            <TerminalIcon className="h-16 w-16 text-slate-800 mx-auto mb-6" />
            <h2 className="text-xl font-mono font-bold text-brand-text uppercase tracking-widest mb-2">No Collections Found</h2>
        </div>
    );
  }

  return (
    <div className="space-y-12">
      {groupedBooks.sortedSeriesNames.map(seriesName => {
        const isExpanded = expandedSeries.has(seriesName);
        const seriesCount = groupedBooks.groups[seriesName].length;
        
        return (
          <section key={seriesName} className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <button 
              onClick={() => toggleSeries(seriesName)}
              className="w-full flex items-center justify-between group border-b border-white/5 pb-4 mb-6 hover:border-brand-accent/40 transition-all"
            >
              <div className="flex items-center gap-4">
                <div className={`p-2 rounded-lg bg-slate-900 border border-white/5 transition-transform duration-300 ${!isExpanded ? '-rotate-90' : ''}`}>
                    <ChevronDownIcon className="h-4 w-4 text-brand-accent" />
                </div>
                <div className="text-left">
                    <h3 className="text-xl font-mono font-bold text-brand-text uppercase tracking-wider group-hover:text-brand-accent transition-colors">
                        {seriesName}
                    </h3>
                    <p className="text-[10px] font-mono text-brand-subtle uppercase tracking-widest opacity-60">
                        {seriesCount} UNITS_IN_SEQUENCE
                    </p>
                </div>
              </div>
              <div className="hidden sm:block text-[10px] font-mono text-slate-700 uppercase tracking-widest">
                Protocol: {seriesName === 'Standalone Records' ? 'SINGLE_ENTITY' : 'ARRAY_SORTED'}
              </div>
            </button>
            
            {isExpanded && (
              <div className={gridClasses}>
                {groupedBooks.groups[seriesName].map(book => (
                  <BookCard 
                    key={book.ID} 
                    book={book} 
                    size={gridSize} 
                    onClick={() => onBookClick(book)} 
                  />
                ))}
              </div>
            )}
          </section>
        );
      })}
    </div>
  );
};

export default CollectionView;
