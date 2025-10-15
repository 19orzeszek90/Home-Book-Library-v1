import React, { useState, useEffect, useMemo } from 'react';
import type { Book } from '../App';
import ImageUpload from './ImageUpload';
import MultiTagInput from './MultiTagInput';
import CoverSearchModal from './CoverSearchModal';
import StyledDatalistInput from './StyledDatalistInput';

interface BookFormModalProps {
  book: Book | Partial<Book> | null;
  books: Book[];
  onClose: () => void;
  onSave: () => void;
}

const API_URL = (import.meta as any).env.VITE_API_URL || '';

const BookFormModal: React.FC<BookFormModalProps> = ({ book, books, onClose, onSave }) => {
  const [formData, setFormData] = useState<Partial<Book>>(book || {});
  const [isSaving, setIsSaving] = useState(false);
  const [isCoverSearchModalOpen, setIsCoverSearchModalOpen] = useState(false);

  const uniqueValues = useMemo(() => {
    const formats = new Set<string>();
    const languages = new Set<string>();
    const bookshelves = new Set<string>();
    const genres = new Set<string>();
    const tags = new Set<string>();
    const authors = new Set<string>();
    const publishers = new Set<string>();

    books.forEach(b => {
        if (b.Format) formats.add(b.Format);
        if (b.Language) languages.add(b.Language);
        if (b.BookShelf) bookshelves.add(b.BookShelf);
        if (b.Author) authors.add(b.Author.trim());
        if (b.Publisher) publishers.add(b.Publisher.trim());
        if (b.Genres) {
          b.Genres.split(',').forEach(g => {
            const trimmed = g.trim();
            if (trimmed) genres.add(trimmed);
          });
        }
        if (b.Tags) {
          b.Tags.split(',').forEach(t => {
            const trimmed = t.trim();
            if (trimmed) tags.add(trimmed);
          });
        }
    });

    return {
        formats: Array.from(formats).sort(),
        languages: Array.from(languages).sort(),
        bookshelves: Array.from(bookshelves).sort(),
        genres: Array.from(genres).sort(),
        tags: Array.from(tags).sort(),
        authors: Array.from(authors).sort(),
        publishers: Array.from(publishers).sort(),
    };
  }, [books]);
  
  const initialSearchQuery = useMemo(() => {
    const firstAuthor = (formData.Author || '').split(/[,;]/)[0].trim();
    return `${formData.Title || ''} ${firstAuthor}`.trim();
  }, [formData.Title, formData.Author]);

  useEffect(() => {
    setFormData(book || {});
  }, [book]);

  useEffect(() => {
    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [onClose]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    setFormData(prev => {
      let finalValue: string | number | boolean | null = value;

      if (type === 'number') {
        finalValue = value === '' ? null : Number(value);
      } else if (type === 'date') {
          finalValue = value === '' ? null : value;
      } else if (type === 'checkbox') {
          finalValue = (e.target as HTMLInputElement).checked;
      }
      
      const newFormData = { ...prev, [name]: finalValue };

      // When marking as read, also set finish date to today.
      if (name === 'Read' && finalValue === true) {
          const today = new Date().toISOString().slice(0, 10);
          newFormData["Finished Reading Date"] = today;
      }
      
      return newFormData;
    });
  };
  
  const handleCoverChange = (newUrl: string) => {
    setFormData(prev => ({...prev, "Image Url": newUrl }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    const isEditing = formData.ID;
    const method = isEditing ? 'PUT' : 'POST';
    const url = isEditing ? `${API_URL}/api/books/${formData.ID}` : `${API_URL}/api/books`;
    
    const dataToSend = { ...formData };
    for (const key of ['Pages', 'Volume', 'Page Read', 'Price', 'Rating', 'Copy Index'] as const) {
        if ((dataToSend[key] as any) === '') {
            dataToSend[key] = null;
        }
    }

    try {
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dataToSend),
      });
      if (!response.ok) {
        throw new Error('Failed to save book');
      }
      onSave();
    } catch (error) {
      console.error(error);
      alert('Error saving book.');
    } finally {
      setIsSaving(false);
    }
  };
  
  const handleSelectCover = (imageUrl: string) => {
    handleCoverChange(imageUrl);
    setIsCoverSearchModalOpen(false);
  };
  
  const inputStyle = "bg-slate-700 p-2 rounded-md w-full border-transparent focus:outline-none focus:ring-2 focus:ring-brand-accent";
  const formatDateForInput = (dateString?: string | null) => dateString ? dateString.substring(0, 10) : '';

  // Use the new, unsaved "Image Url" if it's a string (meaning it was changed), otherwise fall back to the saved "Icon Path".
  const coverForPreview = typeof formData['Image Url'] === 'string' ? formData['Image Url'] : (formData['Icon Path'] || '');

  return (
    <>
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex justify-center items-start p-4 overflow-y-auto">
      <div className="bg-brand-secondary rounded-lg shadow-2xl w-full max-w-4xl my-8 relative">
        <button onClick={onClose} className="absolute top-4 right-4 text-2xl font-bold text-brand-subtle hover:text-brand-text leading-none z-10">&times;</button>
        <div className="p-6">
          <h2 className="text-2xl font-bold text-brand-text mb-6">{formData.ID ? 'Edit Book' : 'Add New Book'}</h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Left Column: Cover */}
                <div className="md:col-span-1">
                    <ImageUpload 
                        currentCover={coverForPreview}
                        onCoverChange={handleCoverChange}
                        currentTitle={formData.Title || ''}
                        currentAuthor={formData.Author || ''}
                        onOpenCoverSearch={() => setIsCoverSearchModalOpen(true)}
                    />
                </div>

                {/* Right Column: Main Info */}
                <div className="md:col-span-2 space-y-4">
                    <input name="Title" value={formData.Title || ''} onChange={handleChange} placeholder="Title *" required className={inputStyle} autoFocus />
                    <StyledDatalistInput
                      name="Author"
                      value={formData.Author || ''}
                      onChange={handleChange}
                      placeholder="Author *"
                      suggestions={uniqueValues.authors}
                      required
                    />
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <StyledDatalistInput
                          name="Publisher"
                          value={formData.Publisher || ''}
                          onChange={handleChange}
                          placeholder="Publisher"
                          suggestions={uniqueValues.publishers}
                        />
                        <input type="text" name="Published Date" value={formData['Published Date'] || ''} onChange={handleChange} placeholder="Published (YYYY-MM-DD)" className={inputStyle} />
                        <input name="ISBN" value={formData.ISBN || ''} onChange={handleChange} placeholder="ISBN" className={inputStyle} />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <input name="Series" value={formData.Series || ''} onChange={handleChange} placeholder="Series" className={inputStyle} />
                        <input type="number" name="Volume" value={formData.Volume ?? ''} onChange={handleChange} placeholder="Volume" className={inputStyle} />
                        <StyledDatalistInput
                            name="Language"
                            value={formData.Language || ''}
                            onChange={handleChange}
                            placeholder="Language"
                            suggestions={uniqueValues.languages}
                        />
                        <StyledDatalistInput
                            name="Format"
                            value={formData.Format || ''}
                            onChange={handleChange}
                            placeholder="Format (e.g., Hardcover)"
                            suggestions={uniqueValues.formats}
                        />
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <input type="number" name="Pages" value={formData.Pages ?? ''} onChange={handleChange} placeholder="Pages" className={inputStyle} />
                        <input type="number" name="Page Read" value={formData['Page Read'] ?? ''} onChange={handleChange} placeholder="Pages Read" className={inputStyle} />
                        <StyledDatalistInput
                          name="BookShelf"
                          value={formData.BookShelf || ''}
                          onChange={handleChange}
                          placeholder="Bookshelf"
                          suggestions={uniqueValues.bookshelves}
                        />
                        <input name="Location" value={formData.Location || ''} onChange={handleChange} placeholder="Location" className={inputStyle} />
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        <input type="number" step="0.01" name="Price" value={formData.Price ?? ''} onChange={handleChange} placeholder="Price" className={inputStyle} />
                        <input type="number" step="0.01" name="Rating" value={formData.Rating ?? ''} min="0" max="5" onChange={handleChange} placeholder="Rating (0-5)" className={inputStyle} />
                        <input type="number" name="Copy Index" value={formData['Copy Index'] ?? ''} onChange={handleChange} placeholder="Copy #" className={inputStyle} />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <label className="block">
                            <span className="text-xs text-brand-subtle">Started Reading</span>
                            <input type="date" name="Started Reading Date" value={formatDateForInput(formData['Started Reading Date'])} onChange={handleChange} className={inputStyle} title="Started Reading Date" />
                        </label>
                        <label className="block">
                            <span className="text-xs text-brand-subtle">Finished Reading</span>
                            <input type="date" name="Finished Reading Date" value={formatDateForInput(formData['Finished Reading Date'])} onChange={handleChange} className={inputStyle} title="Finished Reading Date" />
                        </label>
                    </div>

                    <div className="flex items-center gap-6 pt-2">
                        <label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" name="Read" checked={formData.Read || false} onChange={handleChange} className="w-4 h-4" /> Read</label>
                        <label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" name="Favorite" checked={formData.Favorite || false} onChange={handleChange} className="w-4 h-4" /> Favorite</label>
                        <label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" name="is_wishlist" checked={formData.is_wishlist || false} onChange={handleChange} className="w-4 h-4" /> Add to Wishlist</label>
                    </div>
                </div>
            </div>
            
            {/* --- Descriptions --- */}
            <textarea name="Summary" value={formData.Summary || ''} onChange={handleChange} placeholder="Summary" className={`${inputStyle} h-24`} />
            <textarea name="Comments" value={formData.Comments || ''} onChange={handleChange} placeholder="Your Comments" className={`${inputStyle} h-24`} />
            
            {/* --- Tags & Genres --- */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <MultiTagInput
                label="Genres"
                placeholder="Add genres..."
                values={formData.Genres?.split(',').map(g => g.trim()).filter(Boolean) || []}
                onChange={(newGenres) => setFormData(prev => ({ ...prev, Genres: newGenres.join(', ') }))}
                suggestions={uniqueValues.genres}
              />
              <MultiTagInput
                label="Tags"
                placeholder="Add tags..."
                values={formData.Tags?.split(',').map(t => t.trim()).filter(Boolean) || []}
                onChange={(newTags) => setFormData(prev => ({ ...prev, Tags: newTags.join(', ') }))}
                suggestions={uniqueValues.tags}
              />
            </div>

            <div className="flex justify-end pt-4">
              <button type="button" onClick={onClose} className="bg-slate-600 hover:bg-slate-500 text-white font-bold py-2 px-4 rounded mr-2">Cancel</button>
              <button type="submit" disabled={isSaving} className="bg-brand-accent hover:bg-sky-400 text-brand-primary font-bold py-2 px-4 rounded disabled:bg-slate-600">
                {isSaving ? 'Saving...' : 'Save Book'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
    
    {isCoverSearchModalOpen && (
      <CoverSearchModal
        onClose={() => setIsCoverSearchModalOpen(false)}
        onSelectCover={handleSelectCover}
        initialQuery={initialSearchQuery}
      />
    )}
    </>
  );
};

export default BookFormModal;