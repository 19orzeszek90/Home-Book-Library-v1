
import React from 'react';

const colors = [
  { bg: 'bg-brand-accent/10', text: 'text-sky-300', border: 'border-brand-accent/30' },
  { bg: 'bg-purple-500/10', text: 'text-purple-300', border: 'border-purple-500/30' },
  { bg: 'bg-emerald-500/10', text: 'text-emerald-300', border: 'border-emerald-500/30' },
  { bg: 'bg-amber-500/10', text: 'text-amber-300', border: 'border-amber-500/30' },
  { bg: 'bg-rose-500/10', text: 'text-rose-300', border: 'border-rose-500/30' },
];

const stringToHash = (str: string): number => {
  let hash = 0;
  if (str.length === 0) return hash;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  return Math.abs(hash);
};

const getColorForString = (str: string) => {
  if (!str) return colors[0];
  const hash = stringToHash(str);
  return colors[hash % colors.length];
};

interface TagProps {
  name: string;
}

const Tag: React.FC<TagProps> = ({ name }) => {
  if (!name) return null;
  const c = getColorForString(name);
  
  return (
    <span className={`px-2 py-0.5 text-[10px] font-mono font-bold rounded uppercase tracking-tighter border ${c.bg} ${c.text} ${c.border} inline-block whitespace-nowrap`}>
      {name}
    </span>
  );
};

export default Tag;
