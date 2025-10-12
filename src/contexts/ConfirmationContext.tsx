import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import ConfirmModal from '../components/ConfirmModal';

type ConfirmVariant = 'default' | 'danger';

interface ConfirmationOptions {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm?: () => void;
  onCancel?: () => void;
  confirmVariant?: ConfirmVariant;
}

interface ConfirmationState extends ConfirmationOptions {
  isOpen: boolean;
}

interface ConfirmationContextType {
  showConfirmation: (options: ConfirmationOptions) => void;
}

const ConfirmationContext = createContext<ConfirmationContextType | undefined>(undefined);

export const useConfirmation = (): ConfirmationContextType => {
  const context = useContext(ConfirmationContext);
  if (!context) {
    throw new Error('useConfirmation must be used within a ConfirmationProvider');
  }
  return context;
};

interface ConfirmationProviderProps {
    children: ReactNode;
}

export const ConfirmationProvider: React.FC<ConfirmationProviderProps> = ({ children }) => {
  const [confirmationState, setConfirmationState] = useState<ConfirmationState>({
    isOpen: false,
    title: '',
    message: '',
  });

  const showConfirmation = useCallback((options: ConfirmationOptions) => {
    setConfirmationState({ ...options, isOpen: true });
  }, []);

  const hideConfirmation = useCallback(() => {
    setConfirmationState(prevState => ({ ...prevState, isOpen: false }));
  }, []);

  const handleConfirm = () => {
    if (confirmationState.onConfirm) {
      confirmationState.onConfirm();
    }
    hideConfirmation();
  };

  const handleCancel = () => {
    if (confirmationState.onCancel) {
      confirmationState.onCancel();
    }
    hideConfirmation();
  };

  return (
    <ConfirmationContext.Provider value={{ showConfirmation }}>
      {children}
      <ConfirmModal
        isOpen={confirmationState.isOpen}
        title={confirmationState.title}
        message={confirmationState.message}
        onConfirm={handleConfirm}
        onCancel={handleCancel}
        confirmText={confirmationState.confirmText}
        cancelText={confirmationState.cancelText}
        confirmVariant={confirmationState.confirmVariant}
      />
    </ConfirmationContext.Provider>
  );
};