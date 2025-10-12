import React, { useEffect } from 'react';

type ConfirmVariant = 'default' | 'danger';

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
  confirmText?: string;
  cancelText?: string;
  confirmVariant?: ConfirmVariant;
}

const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  title,
  message,
  onConfirm,
  onCancel,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  confirmVariant = 'default',
}) => {
  useEffect(() => {
    const handleEsc = (event: KeyboardEvent) => {
      if (isOpen && event.key === 'Escape') {
        onCancel();
      }
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [isOpen, onCancel]);

  if (!isOpen) {
    return null;
  }

  const hasCancelButton = !!cancelText;
  
  const confirmButtonStyles = {
    default: 'bg-brand-accent hover:bg-sky-400 text-brand-primary',
    danger: 'bg-red-600 hover:bg-red-500 text-white',
  };

  return (
    <div 
      className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[100] flex justify-center items-center p-4"
      aria-labelledby="confirmation-title"
      role="dialog"
      aria-modal="true"
    >
      <div className="bg-brand-secondary rounded-lg shadow-2xl w-full max-w-md" role="document">
        <div className="p-6">
          <div className="flex justify-between items-start">
            <h2 id="confirmation-title" className="text-xl font-bold text-brand-text">{title}</h2>
            <button onClick={onCancel} className="text-2xl font-bold text-brand-subtle hover:text-brand-text leading-none">&times;</button>
          </div>
          <p className="mt-2 text-brand-subtle">{message}</p>
        </div>
        <div className="bg-slate-800/50 px-6 py-4 flex justify-end items-center gap-3 rounded-b-lg">
          {hasCancelButton && (
            <button 
              type="button" 
              onClick={onCancel} 
              className="bg-slate-600 hover:bg-slate-500 text-white font-bold py-2 px-4 rounded transition-colors"
            >
              {cancelText}
            </button>
          )}
          <button
            type="button"
            onClick={onConfirm}
            className={`font-bold py-2 px-4 rounded transition-colors ${confirmButtonStyles[confirmVariant]}`}
            autoFocus
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmModal;