import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import BookCard from './components/BookCard';
import BookFormModal from './components/BookFormModal';
import SearchBookModal from './components/SearchBookModal';
import AboutModal from './components/AboutModal';
import BookDetailModal from './components/BookDetailModal';
import StatisticsModal from './components/StatisticsModal';
import AdvancedSettingsModal from './components/AdvancedSettingsModal';
import ViewSwitcher from './components/ViewSwitcher';
import { PlusIcon, DownloadIcon, BookOpenIcon, CogIcon, ChartBarIcon, AdjustmentsIcon } from './components/Icons';
import { ConfirmationProvider, useConfirmation } from './contexts/ConfirmationContext';

export interface Book {
  ID: number;
  Title: string;
  Author: string;
  Publisher?: string;
  "Published Date"?: string;
  Format?: string;
  Pages?: number | null;
  Series?: string;
  Volume?: number | null;
  Language?: string;
  ISBN?: string;
  "Page Read"?: number | null;
  "Item Url"?: string;
  "Icon Path"?: string;
  "Photo Path"?: string;
  "Image Url"?: string;
  Summary?: string;
  Location?: string;
  Price?: number | null;
  Genres?: string;
  Rating?: number | null;
  "Added Date"?: string;
  "Copy Index"?: number | null;
  Read?: boolean;
  "Started Reading Date"?: string;
  "Finished Reading Date"?: string;
  Favorite?: boolean;
  Comments?: string;
  Tags?: string;
  BookShelf?: string;
  Settings?: string;
  is_wishlist?: boolean;
}

export type GridSize = 'compact' | 'default' | 'cozy';

// FIX: Cast `import.meta` to `any` to bypass TypeScript error regarding missing `env` property, as Vite client types are not being loaded correctly.
const API_URL = (import.meta as any).env.VITE_API_URL || '';

function AppContent() {
  const [books, setBooks] = useState<Book[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentView, setCurrentView] = useState<'library' | 'wishlist'>('library');
  const [gridSize, setGridSize] = useState<GridSize>(() => {
    return (localStorage.getItem('gridSize') as GridSize) || 'default';
  });
  
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);
  const [isAboutModalOpen, setIsAboutModalOpen] = useState(false);
  const [isStatsModalOpen, setIsStatsModalOpen] = useState(false);
  const [isAdvancedModalOpen, setIsAdvancedModalOpen] = useState(false);
  const [isAddMenuOpen, setAddMenuOpen] = useState(false);
  const [isSettingsMenuOpen, setSettingsMenuOpen] = useState(false);

  const [editingBook, setEditingBook] = useState<Book | Partial<Book> | null>(null);
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  
  const importFileRef = useRef<HTMLInputElement>(null);
  const addMenuRef = useRef<HTMLDivElement>(null);
  const settingsMenuRef = useRef<HTMLDivElement>(null);
  
  const { showConfirmation } = useConfirmation();

  const fetchBooks = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/books`);
      if (!response.ok) {
        throw new Error('Failed to fetch books');
      }
      const data = await response.json();
      setBooks(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('gridSize', gridSize);
  }, [gridSize]);

  const filteredBooks = useMemo(() => {
    const viewFilteredBooks = books.filter(book => {
        if (currentView === 'library') return !book.is_wishlist;
        if (currentView === 'wishlist') return book.is_wishlist;
        return true;
    });

    if (!searchTerm) {
        return viewFilteredBooks;
    }
    return viewFilteredBooks.filter(book =>
        (book.Title?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
        (book.Author?.toLowerCase() || '').includes(searchTerm.toLowerCase())
    );
  }, [books, searchTerm, currentView]);
  
  const gridClasses = useMemo(() => {
    const baseClasses = 'grid grid-cols-2 gap-4 sm:gap-6';
    const sizeMap: Record<GridSize, string> = {
        compact: `${baseClasses} sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7 2xl:grid-cols-8`,
        default: `${baseClasses} sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6`,
        cozy:    `${baseClasses} sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5`,
    };
    return sizeMap[gridSize];
  }, [gridSize]);

  useEffect(() => {
    fetchBooks();
  }, [fetchBooks]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (addMenuRef.current && !addMenuRef.current.contains(event.target as Node)) {
        setAddMenuOpen(false);
      }
      if (settingsMenuRef.current && !settingsMenuRef.current.contains(event.target as Node)) {
        setSettingsMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);


  const handleOpenFormModal = (book: Book | Partial<Book> | null = null) => {
    let bookData = book || {};
    if (!book) { // This is a new book
        bookData.is_wishlist = currentView === 'wishlist';
    }
    setEditingBook(bookData);
    setIsFormModalOpen(true);
    setAddMenuOpen(false);
  };

  const handleCloseFormModal = () => {
    setIsFormModalOpen(false);
    setEditingBook(null);
  };
  
  const handleShowDetails = (book: Book) => {
    setSelectedBook(book);
  };

  const handleCloseDetails = () => {
    setSelectedBook(null);
  };

  const handleOpenSearchModal = () => {
    setIsSearchModalOpen(true);
    setAddMenuOpen(false);
  };

  const handleCloseSearchModal = () => {
    setIsSearchModalOpen(false);
  };

  const handleSelectSearchResult = (bookData: Partial<Book>) => {
    handleCloseSearchModal();
    handleOpenFormModal(bookData);
  };

  const handleSaveBook = () => {
    fetchBooks();
    handleCloseFormModal();
  };

  const handleDeleteBook = async (id: number) => {
    showConfirmation({
        title: 'Confirm Deletion',
        message: 'Are you sure you want to delete this book? This action cannot be undone.',
        confirmText: 'Delete',
        confirmVariant: 'danger',
        onConfirm: async () => {
            try {
                await fetch(`${API_URL}/api/books/${id}`, { method: 'DELETE' });
                setBooks(books.filter(b => b.ID !== id));
            } catch (err) {
                showConfirmation({ title: 'Error', message: 'Failed to delete book.', confirmText: 'OK' });
            }
        }
    });
  };
  
  const handleMoveToLibrary = async (book: Book) => {
    const updatedBook = { ...book, is_wishlist: false };
    try {
        const response = await fetch(`${API_URL}/api/books/${book.ID}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updatedBook),
        });
        if (!response.ok) {
            throw new Error('Failed to move book');
        }
        await fetchBooks();
        setSelectedBook(null); // Close the modal
    } catch (err) {
        showConfirmation({ title: 'Error', message: 'Failed to move book to library.', confirmText: 'OK' });
    }
  };

  const handleExport = () => {
    window.location.href = `${API_URL}/api/books/export`;
    setSettingsMenuOpen(false);
  };

  const handleTriggerImport = () => {
    importFileRef.current?.click();
    setAddMenuOpen(false);
  };

  const handleFileImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('csvfile', file);
    
    try {
        const response = await fetch(`${API_URL}/api/books/import`, {
            method: 'POST',
            body: formData,
        });
        
        if (!response.ok) {
            const errorResult = await response.json();
            throw new Error(errorResult.message || 'Import failed');
        }

        const result = await response.json();
        showConfirmation({ title: 'Import Successful', message: result.message, confirmText: 'OK' });
        fetchBooks(); // Refresh book list
    } catch (err) {
        const message = err instanceof Error ? err.message : 'An unknown error occurred during import.';
        showConfirmation({ title: 'Import Failed', message, confirmText: 'OK', confirmVariant: 'danger' });
    } finally {
        if(importFileRef.current) {
            importFileRef.current.value = '';
        }
    }
  };


  return (
    <div className="min-h-screen bg-brand-primary">
      <header className="bg-brand-secondary/50 backdrop-blur-sm sticky top-0 z-20">
        <nav className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center flex-shrink-0">
              <BookOpenIcon className="h-8 w-8 mr-3 text-brand-accent" />
              <h1 className="text-2xl font-bold text-brand-text hidden md:block">Home Book Library</h1>
            </div>

            <div className="flex-1 flex justify-center px-4">
              <input
                  type="text"
                  placeholder="Search by title or author..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full max-w-lg bg-brand-secondary text-brand-text placeholder-brand-subtle px-4 py-2 rounded-lg border-0 focus:outline-none focus:ring-2 focus:ring-brand-accent"
                  aria-label="Search library"
              />
            </div>

            <div className="flex items-center space-x-2 sm:space-x-4">
              <input type="file" ref={importFileRef} onChange={handleFileImport} accept=".csv" className="hidden" />
              
              {/* Add Book Dropdown */}
              <div className="relative" ref={addMenuRef}>
                <button onClick={() => setAddMenuOpen(!isAddMenuOpen)} className="bg-brand-accent hover:bg-sky-400 text-brand-primary font-bold p-3 rounded-lg shadow-md transition-all duration-300" aria-label="Add book options">
                  <PlusIcon className="h-6 w-6" />
                </button>
                {isAddMenuOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-brand-secondary rounded-md shadow-lg py-1 z-30">
                    <a onClick={() => handleOpenFormModal()} className="cursor-pointer flex items-center px-4 py-2 text-sm text-brand-text hover:bg-slate-700">Add Manually</a>
                    <a onClick={handleOpenSearchModal} className="cursor-pointer flex items-center px-4 py-2 text-sm text-brand-text hover:bg-slate-700">Search Online</a>
                    <a onClick={handleTriggerImport} className="cursor-pointer flex items-center px-4 py-2 text-sm text-brand-text hover:bg-slate-700">Import from CSV</a>
                  </div>
                )}
              </div>

              {/* Settings Dropdown */}
              <div className="relative" ref={settingsMenuRef}>
                <button onClick={() => setSettingsMenuOpen(!isSettingsMenuOpen)} className="p-3 bg-brand-secondary hover:bg-slate-700 text-brand-text rounded-lg shadow-md transition-all duration-300" aria-label="Settings">
                  <CogIcon className="h-6 w-6" />
                </button>
                {isSettingsMenuOpen && (
                   <div className="absolute right-0 mt-2 w-56 bg-brand-secondary rounded-md shadow-lg py-1 z-30">
                    <a onClick={() => { setIsStatsModalOpen(true); setSettingsMenuOpen(false); }} className="cursor-pointer flex items-center px-4 py-2 text-sm text-brand-text hover:bg-slate-700">
                      <ChartBarIcon className="h-4 w-4 mr-2" /> Statistics
                    </a>
                    <a onClick={handleExport} className="cursor-pointer flex items-center px-4 py-2 text-sm text-brand-text hover:bg-slate-700">
                      <DownloadIcon className="h-4 w-4 mr-2" /> Export Library (CSV)
                    </a>
                    <div className="border-t border-slate-700 my-1"></div>
                    <a onClick={() => { setIsAdvancedModalOpen(true); setSettingsMenuOpen(false); }} className="cursor-pointer flex items-center px-4 py-2 text-sm text-brand-text hover:bg-slate-700">
                        <AdjustmentsIcon className="h-4 w-4 mr-2" /> Advanced Management
                    </a>
                    <div className="border-t border-slate-700 my-1"></div>
                    <a onClick={() => { setIsAboutModalOpen(true); setSettingsMenuOpen(false); }} className="cursor-pointer flex items-center px-4 py-2 text-sm text-brand-text hover:bg-slate-700">
                      <BookOpenIcon className="h-4 w-4 mr-2" /> About Application
                    </a>
                  </div>
                )}
              </div>

            </div>
          </div>
        </nav>
      </header>
      
      <main className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between border-b border-slate-700">
          <div className="flex">
              <button onClick={() => setCurrentView('library')} className={`px-4 py-3 text-sm font-medium transition-colors ${currentView === 'library' ? 'text-brand-accent border-b-2 border-brand-accent' : 'text-brand-subtle hover:text-brand-text'}`}>
                My Library
              </button>
              <button onClick={() => setCurrentView('wishlist')} className={`px-4 py-3 text-sm font-medium transition-colors ${currentView === 'wishlist' ? 'text-brand-accent border-b-2 border-brand-accent' : 'text-brand-subtle hover:text-brand-text'}`}>
                Wishlist
              </button>
          </div>
          <ViewSwitcher currentSize={gridSize} onSizeChange={setGridSize} />
        </div>

        <div className="pt-6">
          {isLoading && <p className="text-center text-brand-subtle">Loading your library...</p>}
          {error && <p className="text-center text-red-500">Error: {error}</p>}
          {!isLoading && !error && books.length === 0 && (
            <div className="text-center py-16">
              <h2 className="text-2xl font-semibold text-brand-text mb-2">Your library is empty.</h2>
              <p className="text-brand-subtle mb-4">Click the <PlusIcon className="h-4 w-4 inline-block -mt-1" /> button to start building your collection.</p>
            </div>
          )}
          <div className={gridClasses}>
            {filteredBooks.map(book => (
              <BookCard 
                key={book.ID} 
                book={book} 
                size={gridSize}
                onClick={() => handleShowDetails(book)}
              />
            ))}
            {!isLoading && !error && books.length > 0 && filteredBooks.length === 0 && (
              <div className="text-center py-16 col-span-full">
                {searchTerm ? (
                     <>
                         <h2 className="text-2xl font-semibold text-brand-text mb-2">No Books Found</h2>
                         <p className="text-brand-subtle">Your search for "{searchTerm}" did not match any books in your {currentView}.</p>
                     </>
                 ) : (
                     <>
                         <h2 className="text-2xl font-semibold text-brand-text mb-2">
                             {currentView === 'library' ? 'No Books in Library' : 'Your Wishlist is Empty'}
                         </h2>
                         <p className="text-brand-subtle">
                             Click the <PlusIcon className="h-4 w-4 inline-block -mt-1" /> button to add a book to your {currentView}.
                         </p>
                     </>
                 )}
              </div>
            )}
          </div>
        </div>
      </main>

      {isFormModalOpen && (
        <BookFormModal
          book={editingBook}
          books={books}
          onClose={handleCloseFormModal}
          onSave={handleSaveBook}
        />
      )}

      {isSearchModalOpen && (
        <SearchBookModal
          onClose={handleCloseSearchModal}
          onSelectBook={handleSelectSearchResult}
        />
      )}

      {isAboutModalOpen && (
        <AboutModal onClose={() => setIsAboutModalOpen(false)} />
      )}
      
      {isStatsModalOpen && (
        <StatisticsModal books={books.filter(b => !b.is_wishlist)} onClose={() => setIsStatsModalOpen(false)} />
      )}

      {isAdvancedModalOpen && (
        <AdvancedSettingsModal
            books={books}
            onClose={() => setIsAdvancedModalOpen(false)}
            onComplete={fetchBooks}
        />
      )}
      
      {selectedBook && (
        <BookDetailModal
          book={selectedBook}
          onClose={handleCloseDetails}
          onEdit={() => {
            handleCloseDetails();
            handleOpenFormModal(selectedBook);
          }}
          onDelete={() => {
            handleCloseDetails();
            handleDeleteBook(selectedBook.ID);
          }}
          onMoveToLibrary={() => handleMoveToLibrary(selectedBook)}
        />
      )}
    </div>
  );
}


const App: React.FC = () => (
  <ConfirmationProvider>
    <AppContent />
  </ConfirmationProvider>
);

export default App;