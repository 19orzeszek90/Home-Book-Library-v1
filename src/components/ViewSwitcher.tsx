import React from 'react';
import { ViewGridCompactIcon, ViewGridDefaultIcon, ViewGridCozyIcon } from './Icons';
import type { GridSize } from '../App';

interface ViewSwitcherProps {
  currentSize: GridSize;
  onSizeChange: (size: GridSize) => void;
}

const ViewSwitcher: React.FC<ViewSwitcherProps> = ({ currentSize, onSizeChange }) => {
  const options: { size: GridSize; icon: React.FC<{ className?: string }>; title: string }[] = [
    { size: 'compact', icon: ViewGridCompactIcon, title: 'Compact View' },
    { size: 'default', icon: ViewGridDefaultIcon, title: 'Default View' },
    { size: 'cozy', icon: ViewGridCozyIcon, title: 'Cozy View' },
  ];

  return (
    <div className="flex items-center">
      {options.map(({ size, icon: Icon, title }) => (
        <button
          key={size}
          title={title}
          onClick={() => onSizeChange(size)}
          className={`p-1.5 rounded-md transition-colors ${
            currentSize === size
              ? 'text-brand-accent'
              : 'text-brand-subtle hover:text-brand-text'
          }`}
        >
          <Icon className="h-5 w-5" />
        </button>
      ))}
    </div>
  );
};

export default ViewSwitcher;