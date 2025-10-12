import React from 'react';
import type { Book, GridSize } from '../App';
import Tag from './Tag';

interface BookCardProps {
  book: Book;
  size: GridSize;
  onClick: () => void;
}

const BookCard: React.FC<BookCardProps> = ({ book, size, onClick }) => {
  const coverImage = book["Icon Path"] ? book["Icon Path"] : '/default-cover.svg';

  const titleSizeClass = size === 'compact' ? 'text-base' : 'text-lg';
  const authorSizeClass = size === 'compact' ? 'text-xs' : 'text-sm';

  return (
    <div 
      onClick={onClick} 
      className="group cursor-pointer flex flex-col bg-brand-secondary rounded-lg shadow-lg overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl hover:shadow-brand-accent/20"
    >
      {/* Image container with a fixed aspect ratio to constrain height */}
      <div className="relative w-full aspect-[2/3] bg-slate-800 flex items-center justify-center overflow-hidden">
        <img 
          src={coverImage} 
          alt={`Cover of ${book.Title}`} 
          className="max-w-full max-h-full object-contain"
        />
      </div>
      
      {/* Text content container */}
      <div className="p-3 md:p-4 flex flex-col flex-grow">
        <h3 className={`${titleSizeClass} font-bold text-brand-text truncate`} title={book.Title}>{book.Title}</h3>
        <p className={`${authorSizeClass} text-brand-subtle truncate mt-1`} title={book.Author}>{book.Author}</p>
        
        <div className="mt-auto pt-2">
            {book.BookShelf && (
              <Tag name={book.BookShelf} />
            )}
        </div>
      </div>
    </div>
  );
};

export default BookCard;