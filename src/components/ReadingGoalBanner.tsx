
import React, { useState, useMemo, useEffect } from 'react';
import type { Book } from '../App';
import { BookOpenIcon } from './Icons';

interface ReadingGoalBannerProps {
  books: Book[];
}

const ReadingGoalBanner: React.FC<ReadingGoalBannerProps> = ({ books }) => {
  const [readingGoal, setReadingGoal] = useState<number>(() => {
    const savedGoal = localStorage.getItem('readingGoal2024');
    return savedGoal ? parseInt(savedGoal, 10) : 10;
  });

  useEffect(() => {
    const handleStorageChange = () => {
      const savedGoal = localStorage.getItem('readingGoal2024');
      setReadingGoal(savedGoal ? parseInt(savedGoal, 10) : 10);
    };

    window.addEventListener('storage', handleStorageChange);
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
    <div className="relative glass-panel p-4 sm:p-5 rounded-2xl mb-10 border-brand-accent/20 overflow-hidden group">
      {/* Grid pattern overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(56,189,248,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(56,189,248,0.02)_1px,transparent_1px)] bg-[size:20px_20px] pointer-events-none"></div>
      
      <div className="relative z-10">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-3">
          <div>
            <h3 className="text-xs font-mono font-bold text-brand-accent uppercase tracking-[0.3em] mb-0.5">
              Annual_Reading_Protocol // {new Date().getFullYear()}
            </h3>
            <p className="text-[10px] font-mono text-slate-200 uppercase tracking-widest opacity-90">Objective: Knowledge Accumulation</p>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="text-right">
                <div className="text-xl font-mono font-bold text-brand-text leading-none">
                  {booksReadThisYear} <span className="text-brand-subtle opacity-30">/</span> {readingGoal}
                </div>
                <div className="text-[10px] font-mono text-brand-accent/70 uppercase tracking-tighter">Units_Completed</div>
            </div>
            {goalAchieved && (
              <div className="bg-green-500/10 border border-green-500/30 text-green-400 text-[10px] font-mono font-bold py-1 px-3 rounded-full uppercase tracking-widest animate-bounce shadow-[0_0_15px_rgba(34,197,94,0.2)]">
                Target_Reached
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-wrap gap-2 sm:gap-3">
          {Array.from({ length: readingGoal }).map((_, i) => (
            <div 
              key={i} 
              className={`relative transition-all duration-500 ${i < booksReadThisYear ? 'scale-110' : 'opacity-20 grayscale'}`}
            >
              <BookOpenIcon
                className={`h-6 w-6 ${
                  i < booksReadThisYear 
                    ? 'text-brand-accent drop-shadow-[0_0_8px_rgba(56,189,248,0.8)]' 
                    : 'text-slate-400'
                }`}
                title={`Data_Block ${i + 1} of ${readingGoal}`}
              />
              {i < booksReadThisYear && (
                 <div className="absolute inset-0 bg-brand-accent/20 blur-md rounded-full -z-10"></div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ReadingGoalBanner;
