import React, { useRef } from 'react';
import { DownloadIcon, UploadIcon } from './Icons';

interface BackupRestoreModalProps {
  onClose: () => void;
  onExportCSV: () => void;
  onFullBackup: () => void;
  onRestore: (event: React.ChangeEvent<HTMLInputElement>) => void;
}

const BackupRestoreModal: React.FC<BackupRestoreModalProps> = ({ onClose, onExportCSV, onFullBackup, onRestore }) => {
  const restoreFileRef = useRef<HTMLInputElement>(null);

  const handleTriggerRestore = () => {
    restoreFileRef.current?.click();
  };
  
  const handleExport = () => {
    onExportCSV();
    onClose();
  };

  const handleBackup = () => {
    onFullBackup();
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex justify-center items-center p-4">
      <div className="bg-brand-secondary rounded-lg shadow-2xl w-full max-w-lg relative" onClick={e => e.stopPropagation()}>
        <header className="p-4 border-b border-slate-700 flex justify-between items-center">
          <h2 className="text-xl font-bold text-brand-text">Backup & Restore</h2>
          <button onClick={onClose} className="text-2xl font-bold text-brand-subtle hover:text-brand-text leading-none">&times;</button>
        </header>
        
        <div className="p-6 space-y-6">
          {/* Backup Section */}
          <div>
            <h3 className="text-lg font-semibold text-brand-text mb-3">Create a Backup</h3>
            <div className="space-y-3">
                <button onClick={handleExport} className="w-full text-left bg-slate-800 hover:bg-slate-700/80 p-4 rounded-lg flex items-start gap-4 transition-colors">
                    <DownloadIcon className="h-6 w-6 text-brand-accent flex-shrink-0 mt-1" />
                    <div>
                        <p className="font-semibold text-brand-text">Export Library (CSV)</p>
                        <p className="text-sm text-brand-subtle">A lightweight file with your book data. Good for spreadsheets or migrating to other apps.</p>
                    </div>
                </button>
                <button onClick={handleBackup} className="w-full text-left bg-slate-800 hover:bg-slate-700/80 p-4 rounded-lg flex items-start gap-4 transition-colors">
                    <DownloadIcon className="h-6 w-6 text-brand-accent flex-shrink-0 mt-1" />
                    <div>
                        <p className="font-semibold text-brand-text">Create Full Backup</p>
                        <p className="text-sm text-brand-subtle">A single <span className="font-mono bg-slate-700 px-1 rounded">.json</span> file with all book data and cover images. Recommended for complete restoration.</p>
                    </div>
                </button>
            </div>
          </div>
          
          <div className="border-t border-slate-700"></div>

          {/* Restore Section */}
          <div>
            <h3 className="text-lg font-semibold text-brand-text mb-3">Restore a Backup</h3>
            <div className="bg-slate-800 p-4 rounded-lg">
                <p className="text-sm text-brand-subtle mb-3">Upload a full backup (<span className="font-mono bg-slate-700 px-1 rounded">.json</span> file) to restore your library. This will add new books and covers, and skip any duplicates.</p>
                <input type="file" ref={restoreFileRef} onChange={onRestore} accept=".json" className="hidden" />
                <button onClick={handleTriggerRestore} className="w-full bg-brand-accent hover:bg-sky-400 text-brand-primary font-bold py-2 px-4 rounded flex items-center justify-center gap-2">
                    <UploadIcon className="h-5 w-5" />
                    Select Backup File
                </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BackupRestoreModal;