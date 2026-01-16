
import React from 'react';
import type { Book, GridSize } from '../App';
import Tag from './Tag';
import StarRating from './StarRating';

interface BookCardProps {
  book: Book;
  size: GridSize;
  onClick: () => void;
}

const BookCard: React.FC<BookCardProps> = ({ book, size, onClick }) => {
  const coverImage = book["Icon Path"] ? book["Icon Path"] : '/default-cover.svg';

  const titleSizeClass = size === 'compact' ? 'text-sm' : 'text-base';
  const authorSizeClass = 'text-[10px] font-mono tracking-wider';

  return (
    <div 
      onClick={onClick} 
      className="group cursor-pointer flex flex-col bg-slate-950 border border-white/5 rounded-xl overflow-hidden transition-all duration-500 hover:border-brand-accent/40 hover:-translate-y-2 hover:shadow-[0_10px_40px_-10px_rgba(56,189,248,0.3)] relative"
    >
      {/* Visual scanning effect on hover */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-0 group-hover:opacity-100 transition-opacity">
        <div className="absolute top-0 left-0 w-full h-0.5 bg-brand-accent shadow-[0_0_15px_#38bdf8] animate-[scan_2s_linear_infinite]"></div>
      </div>

      {/* Image container */}
      <div className="relative w-full aspect-[2/3] bg-slate-900 flex items-center justify-center overflow-hidden border-b border-white/5">
        <img 
          src={coverImage} 
          alt={`Cover of ${book.Title}`} 
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
        />
        {/* Progress bar overlay for read books */}
        {book.Read && (
          <div className="absolute top-3 right-3 bg-brand-accent text-brand-primary px-2 py-0.5 rounded text-[8px] font-mono font-bold uppercase tracking-widest shadow-lg">
            Read
          </div>
        )}
      </div>
      
      {/* Text content container */}
      <div className="p-4 flex flex-col flex-grow bg-gradient-to-b from-slate-950 to-black">
        <div className="mb-1 flex justify-between items-start gap-2">
           <h3 className={`${titleSizeClass} font-bold text-brand-text truncate leading-tight uppercase tracking-tight`} title={book.Title}>{book.Title}</h3>
        </div>
        <p className={`${authorSizeClass} text-brand-accent/90 truncate uppercase mb-3`} title={book.Author}>{book.Author}</p>
        
        <div className="mt-auto space-y-3">
            {book.Rating != null && book.Rating > 0 && (
                <div className="flex items-center justify-between">
                    <StarRating rating={book.Rating} />
                    <span className="text-[10px] font-mono text-slate-700">LVL_{Math.round(book.Rating * 20)}</span>
                </div>
            )}

            <div className="flex flex-wrap gap-1.5 opacity-80">
                {book.BookShelf && (
                  <span className="text-[10px] font-mono font-bold text-brand-accent border border-brand-accent/30 px-2 py-0.5 rounded uppercase tracking-tighter">
                    {book.BookShelf}
                  </span>
                )}
                {book.Series && (
                   <span className="text-[10px] font-mono text-slate-500 border border-white/5 px-2 py-0.5 rounded uppercase tracking-tighter">
                    SEQ_{book.Series.substring(0,3)}
                  </span>
                )}
            </div>
        </div>
      </div>
    </div>
  );
};

export default BookCard;
