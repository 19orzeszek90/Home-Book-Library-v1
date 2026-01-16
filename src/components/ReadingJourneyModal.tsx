
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import type { Book } from '../App';
import BarChart from './BarChart';
import { ChartBarIcon } from './Icons';

interface ReadingJourneyModalProps {
  books: Book[];
  onClose: () => void;
  onBookSelect: (book: Book) => void;
}

const normalizeValue = (val: string) => {
  const trimmed = val.trim();
  if (!trimmed) return '';
  return trimmed.charAt(0).toUpperCase() + trimmed.slice(1).toLowerCase();
};

const StatCard: React.FC<{ title: string; value: string | number }> = ({ title, value }) => (
    <div className="bg-slate-900/50 border border-white/5 p-4 rounded-xl text-center group hover:border-brand-accent/20 transition-all">
        <p className="text-3xl font-mono font-bold text-brand-text tracking-tighter mb-1">{value}</p>
        <p className="text-[10px] font-mono font-bold text-brand-accent/90 uppercase tracking-widest">{title}</p>
    </div>
);

const TimelineBook: React.FC<{ book: Book; onSelect: () => void }> = ({ book, onSelect }) => {
    const finishedYear = book['Finished Reading Date'] ? new Date(book['Finished Reading Date']).getFullYear() : null;
    return (
        <div
            className="flex-shrink-0 w-24 sm:w-28 group cursor-pointer text-center relative"
            onClick={onSelect}
        >
            <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-0 group-hover:opacity-100 transition-opacity z-10">
                <div className="absolute top-0 left-0 w-full h-0.5 bg-brand-accent shadow-[0_0_15px_#38bdf8] animate-[scan_2s_linear_infinite]"></div>
            </div>
            <img
                src={book["Icon Path"] || '/default-cover.svg'}
                alt={book.Title}
                className="w-full h-auto aspect-[2/3] object-cover rounded-lg shadow-lg transition-all duration-300 group-hover:scale-105 border border-white/5 group-hover:border-brand-accent/40"
            />
            <p className="text-[10px] font-mono text-brand-text mt-2 truncate font-bold uppercase tracking-tighter" title={book.Title}>{book.Title}</p>
            {finishedYear && <p className="text-[9px] font-mono text-brand-accent opacity-50 uppercase">{finishedYear}</p>}
        </div>
    );
};


const ReadingJourneyModal: React.FC<ReadingJourneyModalProps> = ({ books, onClose, onBookSelect }) => {
  useEffect(() => {
    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [onClose]);


  const finishedBooks = useMemo(() => {
    return books
      .filter(b => b.Read && b['Finished Reading Date'])
      .sort((a, b) => new Date(b['Finished Reading Date']!).getTime() - new Date(a['Finished Reading Date']!).getTime())
      .slice(0, 8);
  }, [books]);

  const stats = useMemo(() => {
    const totalBooks = books.length;
    const booksRead = books.filter(b => b.Read).length;
    
    // Financial stats
    const booksWithPrice = books.filter(b => b.Price != null && b.Price > 0);
    const totalValue = booksWithPrice.reduce((sum, b) => sum + (b.Price || 0), 0);
    const avgValue = booksWithPrice.length > 0 ? totalValue / booksWithPrice.length : 0;
    const estimatedTotalValue = avgValue * totalBooks;

    const getTopFive = (key: 'Author' | 'Genres' | 'Language' | 'Tags') => {
        const counts = new Map<string, number>();
        books.forEach(book => {
            const value = book[key];
            if (!value) return;
            const items = (key === 'Genres' || key === 'Tags') ? String(value).split(',').map(g => g.trim()) : [String(value).trim()];
            items.forEach(item => {
                const normalized = normalizeValue(item);
                if (normalized) counts.set(normalized, (counts.get(normalized) || 0) + 1);
            });
        });
        return Array.from(counts.entries()).sort((a, b) => b[1] - a[1]).slice(0, 5);
    };

    const ratingGroups: Record<string, number> = { '5 ★': 0, '4-5 ★': 0, '3-4 ★': 0, '2-3 ★': 0, '1-2 ★': 0, 'No Rating': 0 };
    books.forEach(book => {
        const rating = book.Rating;
        if (rating === 5) ratingGroups['5 ★']++;
        else if (rating && rating >= 4) ratingGroups['4-5 ★']++;
        else if (rating && rating >= 3) ratingGroups['3-4 ★']++;
        else if (rating && rating >= 2) ratingGroups['2-3 ★']++;
        else if (rating && rating > 0) ratingGroups['1-2 ★']++;
        else ratingGroups['No Rating']++;
    });

    return {
        totalBooks,
        booksRead,
        avgValue,
        estimatedTotalValue,
        topAuthors: getTopFive('Author'),
        topGenres: getTopFive('Genres'),
        topLanguages: getTopFive('Language'),
        topTags: getTopFive('Tags'),
        ratingChartData: Object.entries(ratingGroups).map(([label, value]) => ({ label, value }))
    };
  }, [books]);
  
  const handleBookSelect = (book: Book) => {
    onClose();
    onBookSelect(book);
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex justify-center items-start p-4 overflow-y-auto" onClick={onClose}>
      <div className="bg-slate-950 border border-brand-accent/20 rounded-2xl shadow-[0_0_50px_rgba(56,189,248,0.1)] w-full max-w-6xl my-8 relative overflow-hidden" onClick={e => e.stopPropagation()}>
        
        <header className="p-6 bg-brand-secondary/30 border-b border-white/5 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <ChartBarIcon className="h-6 w-6 text-brand-accent" />
            <h2 className="text-xl font-mono font-bold text-brand-text uppercase tracking-widest">Reading Memory Logs</h2>
          </div>
          <button onClick={onClose} className="text-2xl font-bold text-brand-subtle hover:text-white leading-none transition-colors">&times;</button>
        </header>
        
        <div className="p-6 md:p-8 max-h-[80vh] overflow-y-auto space-y-12 scrollbar-thin">
            {/* Reading Timeline */}
            {finishedBooks.length > 0 && (
                <section>
                    <h3 className="text-xs font-mono font-bold text-brand-accent uppercase tracking-[0.3em] mb-4 flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-brand-accent shadow-[0_0_8px_#38bdf8]"></div>
                        Recently Synchronized Memories
                    </h3>
                    <div className="bg-slate-900/50 border border-white/5 p-6 rounded-2xl">
                        <div className="flex gap-6 overflow-x-auto pb-4 scrollbar-thin">
                            {finishedBooks.map(book => (
                                <TimelineBook key={book.ID} book={book} onSelect={() => handleBookSelect(book)} />
                            ))}
                        </div>
                    </div>
                </section>
            )}

            {/* General Stats */}
            <section>
                <h3 className="text-xs font-mono font-bold text-brand-accent uppercase tracking-[0.3em] mb-4 flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-brand-accent shadow-[0_0_8px_#38bdf8]"></div>
                    Library Node Statistics
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <StatCard title="Storage Total" value={stats.totalBooks} />
                  <StatCard title="Processed (Read)" value={stats.booksRead} />
                  <StatCard title="Avg Book Value" value={`${stats.avgValue.toFixed(2)} PLN`} />
                  <StatCard title="Est. Total Value" value={`${stats.estimatedTotalValue.toFixed(0)} PLN`} />
                </div>
            </section>
            
            {/* Charts Section */}
            <section className="bg-slate-900/50 border border-white/5 p-6 rounded-2xl">
                <BarChart title="QUALITY RATING DISTRIBUTION" data={stats.ratingChartData} />
            </section>

            {/* Detailed Stats Lists */}
            <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                {/* Authors */}
                <div className="bg-slate-950/40 p-4 rounded-xl border border-white/5">
                    <h3 className="text-[10px] font-mono font-bold text-brand-accent uppercase tracking-widest mb-4 opacity-70 flex items-center gap-2">
                        <div className="w-1.5 h-1.5 bg-brand-accent/40 rounded-full"></div> Top Authors
                    </h3>
                    <ul className="space-y-3">
                        {stats.topAuthors.map(([name, count]) => (
                            <li key={name} className="flex justify-between items-center text-xs font-mono border-b border-white/5 pb-2">
                                <span className="truncate text-brand-text uppercase font-bold pr-2">{name}</span>
                                <span className="text-brand-accent bg-brand-accent/10 px-2 py-0.5 rounded text-[10px]">{count}</span>
                            </li>
                        ))}
                    </ul>
                </div>

                {/* Genres */}
                <div className="bg-slate-950/40 p-4 rounded-xl border border-white/5">
                    <h3 className="text-[10px] font-mono font-bold text-brand-accent uppercase tracking-widest mb-4 opacity-70 flex items-center gap-2">
                        <div className="w-1.5 h-1.5 bg-brand-accent/40 rounded-full"></div> Dominant Genres
                    </h3>
                    <ul className="space-y-3">
                        {stats.topGenres.map(([name, count]) => (
                            <li key={name} className="flex justify-between items-center text-xs font-mono border-b border-white/5 pb-2">
                                <span className="truncate text-brand-text uppercase font-bold pr-2">{name}</span>
                                <span className="text-brand-accent bg-brand-accent/10 px-2 py-0.5 rounded text-[10px]">{count}</span>
                            </li>
                        ))}
                    </ul>
                </div>

                {/* Languages */}
                <div className="bg-slate-950/40 p-4 rounded-xl border border-white/5">
                    <h3 className="text-[10px] font-mono font-bold text-brand-accent uppercase tracking-widest mb-4 opacity-70 flex items-center gap-2">
                        <div className="w-1.5 h-1.5 bg-brand-accent/40 rounded-full"></div> Linguistic Mapping
                    </h3>
                    <ul className="space-y-3">
                        {stats.topLanguages.map(([name, count]) => (
                            <li key={name} className="flex justify-between items-center text-xs font-mono border-b border-white/5 pb-2">
                                <span className="truncate text-brand-text uppercase font-bold pr-2">{name}</span>
                                <span className="text-brand-accent bg-brand-accent/10 px-2 py-0.5 rounded text-[10px]">{count}</span>
                            </li>
                        ))}
                    </ul>
                </div>

                {/* Tags */}
                <div className="bg-slate-950/40 p-4 rounded-xl border border-white/5">
                    <h3 className="text-[10px] font-mono font-bold text-brand-accent uppercase tracking-widest mb-4 opacity-70 flex items-center gap-2">
                        <div className="w-1.5 h-1.5 bg-brand-accent/40 rounded-full"></div> Knowledge Tags
                    </h3>
                    <ul className="space-y-3">
                        {stats.topTags.map(([name, count]) => (
                            <li key={name} className="flex justify-between items-center text-xs font-mono border-b border-white/5 pb-2">
                                <span className="truncate text-brand-text uppercase font-bold pr-2">#{name}</span>
                                <span className="text-brand-accent bg-brand-accent/10 px-2 py-0.5 rounded text-[10px]">{count}</span>
                            </li>
                        ))}
                    </ul>
                </div>
            </section>
        </div>
        
        <footer className="p-4 bg-slate-950 border-t border-white/5 text-[10px] font-mono text-slate-700 uppercase tracking-widest flex justify-center">
            Log Access: Verified // Node_Status: Optimal
        </footer>
      </div>
    </div>
  );
};

export default ReadingJourneyModal;
