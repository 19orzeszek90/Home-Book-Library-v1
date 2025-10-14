import React, { useState, useRef, useEffect } from 'react';
import { SortAscendingIcon, SortDescendingIcon, ChevronDownIcon, SortFunnelIcon } from './Icons';

export type SortKey = 'Title' | 'Author' | 'Rating' | 'Published Date';
export type SortDirection = 'asc' | 'desc';

interface SortControlsProps {
  sortBy: SortKey;
  sortDirection: SortDirection;
  onSortChange: (key: SortKey, direction: SortDirection) => void;
}

const sortOptions: { value: SortKey; label: string }[] = [
  { value: 'Title', label: 'Title' },
  { value: 'Author', label: 'Author' },
  { value: 'Rating', label: 'Rating' },
  { value: 'Published Date', label: 'Published' },
];

const SortControls: React.FC<SortControlsProps> = ({ sortBy, sortDirection, onSortChange }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelectOption = (key: SortKey) => {
    onSortChange(key, sortDirection);
    setIsMenuOpen(false);
  };

  const toggleSortDirection = () => {
    onSortChange(sortBy, sortDirection === 'asc' ? 'desc' : 'asc');
  };

  const currentLabel = sortOptions.find(opt => opt.value === sortBy)?.label;

  return (
    <div className="flex items-center gap-1">
      <SortFunnelIcon className="h-5 w-5 text-brand-subtle" />
      <div className="relative" ref={menuRef}>
        <button
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          className="flex items-center gap-1.5 p-1.5 rounded-md text-brand-subtle hover:text-brand-text transition-colors"
          aria-haspopup="true"
          aria-expanded={isMenuOpen}
        >
          <span className="text-sm">{currentLabel}</span>
          <ChevronDownIcon className="h-4 w-4" />
        </button>
        {isMenuOpen && (
          <div className="absolute right-0 mt-2 w-36 bg-brand-secondary rounded-md shadow-lg py-1 z-30" role="menu">
            {sortOptions.map(option => (
              <a
                key={option.value}
                onClick={() => handleSelectOption(option.value)}
                className={`cursor-pointer block px-4 py-2 text-sm ${sortBy === option.value ? 'text-brand-accent font-semibold' : 'text-brand-text'} hover:bg-slate-700`}
                role="menuitem"
              >
                {option.label}
              </a>
            ))}
          </div>
        )}
      </div>
      <button
        onClick={toggleSortDirection}
        className="p-1.5 rounded-md text-brand-subtle hover:text-brand-text transition-colors"
        aria-label={`Sort in ${sortDirection === 'asc' ? 'descending' : 'ascending'} order`}
      >
        {sortDirection === 'asc' ? <SortAscendingIcon className="h-5 w-5" /> : <SortDescendingIcon className="h-5 w-5" />}
      </button>
    </div>
  );
};

export default SortControls;