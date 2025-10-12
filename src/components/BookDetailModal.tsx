import React, { useEffect } from 'react';
import type { Book } from '../App';
import StarRating from './StarRating';
import { EditIcon, TrashIcon } from './Icons';
import Tag from './Tag';

interface BookDetailModalProps {
  book: Book;
  onClose: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onMoveToLibrary: () => void;
}

const BookDetailModal: React.FC<BookDetailModalProps> = ({ book, onClose, onEdit, onDelete, onMoveToLibrary }) => {
  useEffect(() => {
    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [onClose]);

  const coverImage = book["Icon Path"] ? book["Icon Path"] : '/default-cover.svg';

  const DetailItem: React.FC<{ label: string; value?: string | number | null }> = ({ label, value }) => {
    if (value === null || value === undefined || value === '') return null;
    return (
      <div>
        <dt className="text-sm font-medium text-brand-subtle truncate">{label}</dt>
        <dd className="mt-1 text-sm text-brand-text">{value}</dd>
      </div>
    );
  };
  
  const InfoBadge: React.FC<{ label: string; value: boolean | undefined }> = ({ label, value }) => (
    <div className="flex items-center gap-2">
        <span className="text-sm font-medium text-brand-subtle">{label}:</span>
        <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${value ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
            {value ? 'Yes' : 'No'}
        </span>
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex justify-center items-start p-4 overflow-y-auto">
      <div className="bg-brand-secondary rounded-lg shadow-2xl w-full max-w-4xl my-8 relative">
        <button onClick={onClose} className="absolute top-4 right-4 text-2xl font-bold text-brand-subtle hover:text-brand-text leading-none z-10">&times;</button>
        
        <div className="p-6 md:p-8 grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
          {/* Cover Image */}
          <div className="md:col-span-1">
            <img src={coverImage} alt={`Cover of ${book.Title}`} className="w-full h-auto object-cover rounded-lg shadow-lg" />
          </div>

          {/* Book Details */}
          <div className="md:col-span-2 flex flex-col">
            <h2 className="text-3xl font-bold text-brand-text">{book.Title}</h2>
            <p className="text-lg text-brand-subtle mt-1">{book.Author}</p>
            
            {book.Rating && book.Rating > 0 && (
              <div className="mt-3">
                <StarRating rating={book.Rating} />
              </div>
            )}

            {book.Summary && (
              <p className="text-brand-text/90 mt-4 text-base max-h-36 overflow-y-auto pr-2">{book.Summary}</p>
            )}
            
            {book.Tags && (
                <div className="mt-4">
                    <h4 className="text-sm font-medium text-brand-subtle">Tags</h4>
                    <div className="flex flex-wrap gap-2 mt-1">
                        {book.Tags.split(',').map(tag => {
                            const trimmedTag = tag.trim();
                            if (!trimmedTag) return null;
                            return (
                                <Tag key={trimmedTag} name={trimmedTag} />
                            );
                        })}
                    </div>
                </div>
            )}

            <dl className="grid grid-cols-2 md:grid-cols-3 gap-x-4 gap-y-5 mt-6 text-sm">
                <DetailItem label="Series" value={book.Series ? `${book.Series}${book.Volume ? `, Vol. ${book.Volume}` : ''}` : null} />
                <DetailItem label="Publisher" value={book.Publisher} />
                <DetailItem label="Published Date" value={book['Published Date']?.substring(0,10)} />
                <DetailItem label="ISBN" value={book.ISBN} />
                <DetailItem label="Pages" value={book.Pages} />
                <DetailItem label="Page Read" value={book['Page Read']} />
                {book.Genres && (
                    <div>
                        <dt className="text-sm font-medium text-brand-subtle truncate">Genres</dt>
                        <dd className="mt-1 flex flex-wrap gap-2">
                            {book.Genres.split(',').map(g => g.trim()).filter(Boolean).map(genre => <Tag key={genre} name={genre} />)}
                        </dd>
                    </div>
                )}
                {book.BookShelf && (
                    <div>
                        <dt className="text-sm font-medium text-brand-subtle truncate">Bookshelf</dt>
                        <dd className="mt-1">
                            <Tag name={book.BookShelf} />
                        </dd>
                    </div>
                )}
                <DetailItem label="Location" value={book.Location} />
                <DetailItem label="Language" value={book.Language} />
                <DetailItem label="Format" value={book.Format} />
                <DetailItem label="Price" value={book.Price != null ? `${book.Price.toFixed(2)} zł` : null} />
                <DetailItem label="Added" value={book['Added Date'] ? new Date(book['Added Date']).toLocaleDateString() : null} />
                <DetailItem label="Started Reading" value={book['Started Reading Date']?.substring(0,10)} />
                <DetailItem label="Finished Reading" value={book['Finished Reading Date']?.substring(0,10)} />
            </dl>
            
            {book.Comments && (
                <div className="mt-6">
                    <h4 className="text-sm font-medium text-brand-subtle">Comments</h4>
                    <p className="mt-1 text-brand-text/90 whitespace-pre-wrap text-sm max-h-24 overflow-y-auto pr-2">{book.Comments}</p>
                </div>
            )}
            
            <div className="flex gap-4 mt-6">
                <InfoBadge label="Read" value={book.Read} />
                <InfoBadge label="Favorite" value={book.Favorite} />
            </div>
            
            <div className="mt-auto pt-6 flex justify-end items-center gap-3">
              {book.is_wishlist && (
                  <button onClick={onMoveToLibrary} className="bg-green-600 hover:bg-green-500 text-white font-bold py-2 px-4 rounded transition-colors">
                      Move to Library
                  </button>
              )}
              <button onClick={onEdit} className="flex items-center gap-2 bg-slate-700 hover:bg-slate-600 text-brand-text font-bold py-2 px-4 rounded transition-colors">
                <EditIcon className="h-4 w-4" /> Edit
              </button>
              <button onClick={onDelete} className="flex items-center gap-2 bg-red-600 hover:bg-red-500 text-white font-bold py-2 px-4 rounded transition-colors">
                <TrashIcon className="h-4 w-4" /> Delete
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BookDetailModal;