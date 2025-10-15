import React, { useState, useMemo, useEffect } from 'react';
import type { Book } from '../App';
import { BookOpenIcon } from './Icons';

interface ReadingGoalBannerProps {
  books: Book[];
}

const ReadingGoalBanner: React.FC<ReadingGoalBannerProps> = ({ books }) => {
  // Reading goal is managed in the ReadingJourneyModal, but we can read it here for display.
  const [readingGoal, setReadingGoal] = useState<number>(() => {
    const savedGoal = localStorage.getItem('readingGoal2024');
    return savedGoal ? parseInt(savedGoal, 10) : 10;
  });

  // This effect will listen for changes to the goal in other components (like the modal)
  useEffect(() => {
    const handleStorageChange = () => {
      const savedGoal = localStorage.getItem('readingGoal2024');
      setReadingGoal(savedGoal ? parseInt(savedGoal, 10) : 10);
    };

    window.addEventListener('storage', handleStorageChange);
    // Also check when the component mounts in case the modal was just closed
    handleStorageChange(); 

    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  const booksReadThisYear = useMemo(() => {
    const currentYear = new Date().getFullYear();
    return books.filter(b => b.Read && b['Finished Reading Date'] && new Date(b['Finished Reading Date']).getFullYear() === currentYear).length;
  }, [books]);

  const goalAchieved = booksReadThisYear >= readingGoal;

  return (
    <div className="bg-slate-800/50 p-3 sm:p-4 rounded-lg mb-6 border border-slate-700/50">
      <div className="flex justify-between items-center mb-3">
        <h3 className="text-sm font-semibold text-brand-text">
          Your {new Date().getFullYear()} Reading Goal
        </h3>
        <div className="flex items-center gap-2">
            {goalAchieved && <span className="text-sm font-bold text-amber-400">Goal Complete! 🎉</span>}
            <span className="text-sm font-semibold text-brand-subtle bg-slate-700 px-2 py-0.5 rounded">
                {booksReadThisYear} / {readingGoal}
            </span>
        </div>
      </div>
      <div className="flex flex-wrap gap-1.5 sm:gap-2">
        {Array.from({ length: readingGoal }).map((_, i) => (
          <BookOpenIcon
            key={i}
            className={`h-5 w-5 transition-colors ${
              // FIX: Corrected typo from `booksReadThis-year` to `booksReadThisYear`.
              i < booksReadThisYear ? 'text-brand-accent' : 'text-slate-600'
            }`}
            title={`Book ${i + 1} of ${readingGoal}`}
          />
        ))}
      </div>
    </div>
  );
};

export default ReadingGoalBanner;