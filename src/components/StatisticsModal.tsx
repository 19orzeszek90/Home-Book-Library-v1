
import React, { useEffect, useMemo } from 'react';
import type { Book } from '../App';
import BarChart from './BarChart';

interface StatisticsModalProps {
  books: Book[];
  onClose: () => void;
}

const StatCard: React.FC<{ title: string; value: string | number }> = ({ title, value }) => (
    <div className="bg-slate-800 p-4 rounded-lg text-center">
        <p className="text-3xl font-bold text-brand-text">{value}</p>
        <p className="text-sm text-brand-subtle">{title}</p>
    </div>
);

const TopListItem: React.FC<{ rank: number; name: string; count: number }> = ({ rank, name, count }) => (
    <li className="flex items-baseline justify-between py-1">
        <div className="flex items-center">
            <span className="text-sm font-bold text-brand-subtle w-6">{rank}.</span>
            <span className="text-brand-text truncate" title={name}>{name}</span>
        </div>
        <span className="text-sm font-semibold text-brand-text bg-slate-700 px-2 py-0.5 rounded-full">{count}</span>
    </li>
);

const StatisticsModal: React.FC<StatisticsModalProps> = ({ books, onClose }) => {
  useEffect(() => {
    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [onClose]);

  const stats = useMemo(() => {
    const libraryBooks = books.filter(b => !b.is_wishlist);
    const totalBooks = libraryBooks.length;
    const booksRead = libraryBooks.filter(b => b.Read).length;
    const favoriteBooks = libraryBooks.filter(b => b.Favorite).length;
    
    const getTopFive = (key: 'Author' | 'Genres') => {
        const counts = new Map<string, number>();
        libraryBooks.forEach(book => {
            const value = book[key];
            if (!value) return;
            const items = key === 'Genres' ? value.split(',').map(g => g.trim()) : [value.trim()];
            items.forEach(item => {
                if (item) {
                    counts.set(item, (counts.get(item) || 0) + 1);
                }
            });
        });
        return Array.from(counts.entries())
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5);
    };

    const topAuthors = getTopFive('Author');
    const topGenres = getTopFive('Genres');

    const ratingDistribution = libraryBooks.reduce((acc, book) => {
        if (book.Rating === null || book.Rating === undefined) {
          return acc;
        }
        // Make parsing robust: handle strings and both dot/comma decimal separators.
        const ratingString = String(book.Rating).replace(',', '.');
        const rating = parseFloat(ratingString);

        if (!isNaN(rating) && rating >= 1 && rating <= 5) {
            // Group ratings to the nearest half-star, which handles integers, halves, and decimals.
            // e.g., 3.84 -> 4.0; 2.12 -> 2.0; 4.5 -> 4.5
            const ratingKey = (Math.round(rating * 2) / 2).toFixed(1);
            acc[ratingKey] = (acc[ratingKey] || 0) + 1;
        }
        return acc;
    }, {} as Record<string, number>);

    const ratingChartData = Object.entries(ratingDistribution)
      .map(([label, value]) => ({ label: `${parseFloat(label).toString()} ★`, value }))
      .sort((a, b) => parseFloat(a.label) - parseFloat(b.label));

    return { totalBooks, booksRead, favoriteBooks, topAuthors, topGenres, ratingChartData };
  }, [books]);

  if (!stats) return null;

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex justify-center items-start p-4 overflow-y-auto" onClick={onClose}>
      <div className="bg-brand-secondary rounded-lg shadow-2xl w-full max-w-4xl my-8 relative" onClick={e => e.stopPropagation()}>
        <button onClick={onClose} className="absolute top-4 right-4 text-2xl font-bold text-brand-subtle hover:text-brand-text leading-none">&times;</button>
        <div className="p-6 md:p-8">
          <h2 className="text-2xl font-bold text-brand-text mb-6">Library Statistics</h2>
          
          <div className="space-y-6">
             {/* Overview */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <StatCard title="Total Books" value={stats.totalBooks} />
              <StatCard title="Books Read" value={stats.booksRead} />
              <StatCard title="Unread Books" value={stats.totalBooks - stats.booksRead} />
              <StatCard title="Favorites" value={stats.favoriteBooks} />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Top Authors & Genres */}
                <div className="bg-slate-800 p-4 rounded-lg">
                    <h3 className="font-semibold text-brand-text mb-2">Top 5 Authors</h3>
                    <ul>{stats.topAuthors.map(([name, count], i) => <TopListItem key={name} rank={i+1} name={name} count={count} />)}</ul>
                </div>
                <div className="bg-slate-800 p-4 rounded-lg">
                    <h3 className="font-semibold text-brand-text mb-2">Top 5 Genres</h3>
                    <ul>{stats.topGenres.map(([name, count], i) => <TopListItem key={name} rank={i+1} name={name} count={count} />)}</ul>
                </div>
            </div>

            {/* Rating Distribution */}
            {stats.ratingChartData.length > 0 && (
                <div className="bg-slate-800 p-4 rounded-lg">
                    <BarChart title="Ratings Distribution" data={stats.ratingChartData} />
                </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default StatisticsModal;
