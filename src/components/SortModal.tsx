import React, { useState, useEffect } from 'react';
import type { SortKey, SortDirection } from './SortControls';
import { SortAscendingIcon, SortDescendingIcon } from './Icons';

interface SortModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentSortBy: SortKey;
  currentSortDirection: SortDirection;
  onApplySort: (key: SortKey, direction: SortDirection) => void;
}

const sortOptions: { value: SortKey; label: string }[] = [
  { value: 'Title', label: 'Title' },
  { value: 'Author', label: 'Author' },
  { value: 'Rating', label: 'Rating' },
  { value: 'Published Date', label: 'Published Date' },
];

const SortModal: React.FC<SortModalProps> = ({ isOpen, onClose, currentSortBy, currentSortDirection, onApplySort }) => {
  const [tempSortBy, setTempSortBy] = useState(currentSortBy);
  const [tempSortDirection, setTempSortDirection] = useState(currentSortDirection);

  useEffect(() => {
    if (isOpen) {
      setTempSortBy(currentSortBy);
      setTempSortDirection(currentSortDirection);
    }
  }, [isOpen, currentSortBy, currentSortDirection]);

  useEffect(() => {
    const handleEsc = (event: KeyboardEvent) => {
      if (isOpen && event.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [isOpen, onClose]);
  
  if (!isOpen) return null;

  const handleApply = () => {
    onApplySort(tempSortBy, tempSortDirection);
  };

  return (
    <div 
      className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex flex-col justify-end"
      onClick={onClose}
    >
      <div 
        className="bg-brand-secondary rounded-t-2xl shadow-2xl w-full"
        onClick={e => e.stopPropagation()}
      >
        <div className="p-4 border-b border-slate-700 flex justify-between items-center">
          <h2 className="text-xl font-bold text-brand-text">Sort Books</h2>
          <button onClick={onClose} className="text-2xl font-bold text-brand-subtle hover:text-brand-text leading-none">&times;</button>
        </div>
        
        <div className="p-4 space-y-4">
          <div>
            <h3 className="text-sm font-semibold text-brand-subtle mb-2">SORT BY</h3>
            <div className="space-y-2">
              {sortOptions.map(option => (
                <label key={option.value} className="flex items-center gap-3 p-3 bg-slate-800 rounded-lg cursor-pointer">
                  <input
                    type="radio"
                    name="sortBy"
                    value={option.value}
                    checked={tempSortBy === option.value}
                    onChange={() => setTempSortBy(option.value)}
                    className="h-4 w-4"
                  />
                  <span className="text-brand-text">{option.label}</span>
                </label>
              ))}
            </div>
          </div>
          
          <div>
            <h3 className="text-sm font-semibold text-brand-subtle mb-2">DIRECTION</h3>
            <div className="grid grid-cols-2 gap-2">
              <button 
                onClick={() => setTempSortDirection('asc')} 
                className={`flex items-center justify-center gap-2 p-3 rounded-lg text-sm font-semibold transition-colors ${tempSortDirection === 'asc' ? 'bg-brand-accent text-brand-primary' : 'bg-slate-800 text-brand-text'}`}
              >
                <SortAscendingIcon className="h-5 w-5" />
                Ascending
              </button>
              <button 
                onClick={() => setTempSortDirection('desc')} 
                className={`flex items-center justify-center gap-2 p-3 rounded-lg text-sm font-semibold transition-colors ${tempSortDirection === 'desc' ? 'bg-brand-accent text-brand-primary' : 'bg-slate-800 text-brand-text'}`}
              >
                <SortDescendingIcon className="h-5 w-5" />
                Descending
              </button>
            </div>
          </div>
        </div>

        <div className="p-4 bg-slate-800/50">
          <button 
            onClick={handleApply} 
            className="w-full bg-brand-accent text-brand-primary font-bold py-3 px-4 rounded-lg"
          >
            Apply Sort
          </button>
        </div>
      </div>
    </div>
  );
};

export default SortModal;