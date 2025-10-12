import React, { useState, useRef, useCallback, useEffect } from 'react';

interface ImageUploadProps {
  currentCover: string;
  onCoverChange: (newUrl: string) => void;
  currentTitle: string;
  currentAuthor: string;
  onOpenCoverSearch: () => void;
}

const API_URL = (import.meta as any).env.VITE_API_URL || '';

const ImageUpload: React.FC<ImageUploadProps> = ({ currentCover, onCoverChange, currentTitle, currentAuthor, onOpenCoverSearch }) => {
  const [coverPreview, setCoverPreview] = useState<string>(currentCover);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [dragActive, setDragActive] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setCoverPreview(currentCover);
  }, [currentCover]);
  
  const uploadFile = useCallback(async (file: File) => {
    setIsUploading(true);
    const formData = new FormData();
    formData.append('cover', file);

    try {
      const response = await fetch(`${API_URL}/api/upload-cover`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Upload failed');
      }

      const result = await response.json();
      onCoverChange(result.path);
      setCoverPreview(result.path);
    } catch (error) {
      console.error('Upload error:', error);
      alert('Failed to upload cover image.');
    } finally {
      setIsUploading(false);
    }
  }, [onCoverChange]);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      uploadFile(e.dataTransfer.files[0]);
    }
  };
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
        uploadFile(e.target.files[0]);
    }
  };

  const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newUrl = e.target.value;
    onCoverChange(newUrl);
    setCoverPreview(newUrl);
  };
  
  const onUploadButtonClick = () => {
      fileInputRef.current?.click();
  }

  const handleGoogleImageSearch = () => {
    const firstAuthor = (currentAuthor || '').split(/[,;]/)[0].trim();
    const query = `${currentTitle} ${firstAuthor} book cover`.trim();
    if (!query || query === 'book cover') {
        alert("Please enter a Title and Author before searching for a cover.");
        return;
    }
    const url = `https://www.google.com/search?tbm=isch&q=${encodeURIComponent(query)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };
  
  const clearCover = () => {
      onCoverChange('');
      setCoverPreview('');
  }

  return (
    <div className="flex flex-col gap-2">
      <div 
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        className={`relative aspect-[2/3] w-full bg-slate-800 rounded-lg border-2 ${
            coverPreview
              ? 'border-solid border-slate-700'
              : `border-dashed ${dragActive ? 'border-brand-accent' : 'border-slate-600'}`
          } flex items-center justify-center text-center transition-colors overflow-hidden`}
      >
        {isUploading ? (
            <div className="flex flex-col items-center gap-2 text-brand-subtle">
                <div className="w-8 h-8 border-4 border-slate-500 border-t-brand-accent rounded-full animate-spin"></div>
                <span>Uploading...</span>
            </div>
        ) : coverPreview ? (
          <img src={coverPreview} alt="Cover preview" className="w-full h-full object-cover" />
        ) : (
          <div className="flex flex-col items-center gap-1 text-brand-subtle p-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
            <span className="text-sm font-semibold">Drag & drop cover</span>
            <span className="text-xs">or click to upload</span>
          </div>
        )}
        <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" className="hidden" />
      </div>
      
      <button type="button" onClick={onUploadButtonClick} className="w-full bg-slate-600 hover:bg-slate-500 text-white font-bold py-2 px-3 rounded text-sm">Upload File</button>

      <input 
        type="text" 
        value={currentCover}
        onChange={handleUrlChange}
        placeholder="Or paste image URL" 
        className="bg-slate-700 p-2 rounded-md w-full border-transparent focus:outline-none focus:ring-2 focus:ring-brand-accent text-sm" 
      />
      
      <div className="grid grid-cols-2 gap-2">
        <button type="button" onClick={handleGoogleImageSearch} className="bg-slate-600 hover:bg-slate-500 text-white font-bold py-2 px-3 rounded text-sm">Search Google Images</button>
        <button type="button" onClick={onOpenCoverSearch} className="bg-slate-600 hover:bg-slate-500 text-white font-bold py-2 px-3 rounded text-sm">Search Google Books</button>
      </div>
      <button type="button" onClick={clearCover} className="w-full bg-red-600/80 hover:bg-red-500 text-white font-bold py-2 px-3 rounded text-sm">Clear</button>

    </div>
  );
};

export default ImageUpload;