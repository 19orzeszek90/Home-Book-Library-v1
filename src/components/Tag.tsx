import React from 'react';

const colors = [
  { bg: 'bg-rose-500/20', text: 'text-rose-300' },
  { bg: 'bg-amber-500/20', text: 'text-amber-300' },
  { bg: 'bg-emerald-500/20', text: 'text-emerald-300' },
  { bg: 'bg-sky-500/20', text: 'text-sky-300' },
  { bg: 'bg-indigo-500/20', text: 'text-indigo-300' },
  { bg: 'bg-purple-500/20', text: 'text-purple-300' },
  { bg: 'bg-pink-500/20', text: 'text-pink-300' },
];

const stringToHash = (str: string): number => {
  let hash = 0;
  if (str.length === 0) return hash;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0; // Convert to 32bit integer
  }
  return Math.abs(hash);
};

const getColorForString = (str: string) => {
  if (!str) {
    return { bg: 'bg-slate-700', text: 'text-slate-300' };
  }
  const hash = stringToHash(str);
  return colors[hash % colors.length];
};

interface TagProps {
  name: string;
}

const Tag: React.FC<TagProps> = ({ name }) => {
  if (!name) return null;
  const colorClasses = getColorForString(name);
  
  return (
    <span className={`px-2.5 py-1 text-xs font-medium rounded-full ${colorClasses.bg} ${colorClasses.text} inline-block whitespace-nowrap`}>
      {name}
    </span>
  );
};

export default Tag;
