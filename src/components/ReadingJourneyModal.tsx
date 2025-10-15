import React, { useState, useEffect, useMemo, useCallback } from 'react';
import type { Book } from '../App';
import BarChart from './BarChart';

interface ReadingJourneyModalProps {
  books: Book[];
  onClose: () => void;
  onBookSelect: (book: Book) => void;
}

const StatCard: React.FC<{ title: string; value: string | number }> = ({ title, value }) => (
    <div className="bg-slate-800 p-4 rounded-lg text-center">
        <p className="text-3xl font-bold text-brand-text">{value}</p>
        <p className="text-sm text-brand-subtle">{title}</p>
    </div>
);

const TimelineBook: React.FC<{ book: Book; onSelect: () => void }> = ({ book, onSelect }) => {
    const finishedYear = book['Finished Reading Date'] ? new Date(book['Finished Reading Date']).getFullYear() : null;
    return (
        <div
            className="flex-shrink-0 w-24 sm:w-28 group cursor-pointer text-center"
            onClick={onSelect}
        >
            <img
                src={book["Icon Path"] || '/default-cover.svg'}
                alt={book.Title}
                className="w-full h-auto aspect-[2/3] object-cover rounded-md shadow-lg transition-transform duration-300 group-hover:scale-105"
            />
            <p className="text-xs text-brand-text mt-1.5 truncate font-semibold" title={book.Title}>{book.Title}</p>
            {finishedYear && <p className="text-xs text-brand-subtle">{finishedYear}</p>}
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
      .slice(0, 5);
  }, [books]);

  const stats = useMemo(() => {
    const totalBooks = books.length;
    const booksRead = books.filter(b => b.Read).length;
    
    const getTopFive = (key: 'Author' | 'Genres') => {
        const counts = new Map<string, number>();
        books.forEach(book => {
            const value = book[key];
            if (!value) return;
            const items = key === 'Genres' ? value.split(',').map(g => g.trim()) : [value.trim()];
            items.forEach(item => {
                if (item) counts.set(item, (counts.get(item) || 0) + 1);
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
        favoriteBooks: books.filter(b => b.Favorite).length,
        topAuthors: getTopFive('Author'),
        topGenres: getTopFive('Genres'),
        ratingChartData: Object.entries(ratingGroups).map(([label, value]) => ({ label, value }))
    };
  }, [books]);
  
  const handleBookSelect = (book: Book) => {
    onClose();
    onBookSelect(book);
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex justify-center items-start p-4 overflow-y-auto" onClick={onClose}>
      <div className="bg-brand-secondary rounded-lg shadow-2xl w-full max-w-5xl my-8 relative" onClick={e => e.stopPropagation()}>
        <header className="p-4 md:p-6 border-b border-slate-700 flex justify-between items-center">
          <h2 className="text-2xl font-bold text-brand-text">Your Reading Journey</h2>
          <button onClick={onClose} className="text-2xl font-bold text-brand-subtle hover:text-brand-text leading-none">&times;</button>
        </header>
        
        <div className="p-4 md:p-6 max-h-[80vh] overflow-y-auto space-y-8">
            {/* Reading Timeline */}
            {finishedBooks.length > 0 && (
                <section>
                    <h3 className="text-lg font-semibold text-brand-text mb-3">Reading Timeline</h3>
                    <div className="bg-slate-800 p-4 rounded-lg">
                        <div className="flex gap-4 overflow-x-auto pb-3 -mb-3">
                            {finishedBooks.map(book => (
                                <TimelineBook key={book.ID} book={book} onSelect={() => handleBookSelect(book)} />
                            ))}
                        </div>
                    </div>
                </section>
            )}

            {/* General Stats */}
            <section>
                <h3 className="text-lg font-semibold text-brand-text mb-3">Library At a Glance</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <StatCard title="Total Books" value={stats.totalBooks} />
                  <StatCard title="Books Read" value={stats.booksRead} />
                  <StatCard title="Unread Books" value={stats.totalBooks - stats.booksRead} />
                  <StatCard title="Favorites" value={stats.favoriteBooks} />
                </div>
            </section>
            
            {/* Top Lists & Charts */}
            <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 <div className="bg-slate-800 p-4 rounded-lg">
                    <BarChart title="Ratings Distribution" data={stats.ratingChartData} />
                </div>
                <div className="flex flex-col gap-6">
                    <div className="bg-slate-800 p-4 rounded-lg flex-1">
                        <h3 className="font-semibold text-brand-text mb-2">Top 5 Authors</h3>
                        <ul className="space-y-1">{stats.topAuthors.map(([name, count]) => <li key={name} className="flex justify-between text-sm"><span className="truncate pr-4">{name}</span><span className="font-semibold">{count}</span></li>)}</ul>
                    </div>
                    <div className="bg-slate-800 p-4 rounded-lg flex-1">
                        <h3 className="font-semibold text-brand-text mb-2">Top 5 Genres</h3>
                        <ul className="space-y-1">{stats.topGenres.map(([name, count]) => <li key={name} className="flex justify-between text-sm"><span className="truncate pr-4">{name}</span><span className="font-semibold">{count}</span></li>)}</ul>
                    </div>
                </div>
            </section>

        </div>
      </div>
    </div>
  );
};

export default ReadingJourneyModal;