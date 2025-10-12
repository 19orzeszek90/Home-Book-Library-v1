import React, { useEffect } from 'react';
import { BookOpenIcon, GitHubIcon } from './Icons';

interface AboutModalProps {
  onClose: () => void;
}

const AboutModal: React.FC<AboutModalProps> = ({ onClose }) => {

  useEffect(() => {
    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [onClose]);

  const appName = "Home Book Library";
  const appDescription = "A modern web application for personal book cataloging, featuring smart data fetching, CSV import/export, and a persistent library storage system.";

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex justify-center items-center p-4">
      <div className="bg-brand-secondary rounded-lg shadow-2xl w-full max-w-md relative">
        <button onClick={onClose} className="absolute top-3 right-3 text-2xl font-bold text-brand-subtle hover:text-brand-text leading-none">&times;</button>
        <div className="p-8 text-center">
            <div className="flex justify-center items-center mb-4">
                <BookOpenIcon className="h-12 w-12 mr-4 text-brand-accent" />
                <h2 className="text-3xl font-bold text-brand-text">{appName}</h2>
            </div>
          
            <p className="text-brand-subtle mb-6">
                {appDescription}
            </p>

            <a
              href="https://github.com/19orzeszek90/Home-Book-Library-v1"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-slate-700 hover:bg-slate-600 text-brand-text font-semibold py-2 px-4 rounded-lg transition-colors mb-6"
            >
              <GitHubIcon className="h-5 w-5" />
              View on GitHub
            </a>
        </div>
      </div>
    </div>
  );
};

export default AboutModal;