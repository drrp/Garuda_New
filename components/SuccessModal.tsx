import React, { useEffect } from 'react';
import { Icon } from './Icon';

interface SuccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  message?: string;
}

export const SuccessModal: React.FC<SuccessModalProps> = ({ isOpen, onClose, title, message }) => {
  // Effect to handle Escape key press for closing the modal
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="success-modal-title"
      className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center z-50 transition-opacity duration-300"
      onClick={onClose} // Close the modal when clicking on the backdrop
    >
      <div
        className="bg-slate-800 rounded-lg border border-sky-500/30 shadow-2xl w-full max-w-md p-8 text-center transform transition-all duration-300 scale-95 opacity-0 animate-fade-in-scale"
        onClick={(e) => e.stopPropagation()} // Prevent modal from closing when clicking inside it
        style={{ animationFillMode: 'forwards' }} // Ensure the final state of the animation persists
      >
        <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-500/20 mb-4 border border-green-500/50">
           <Icon name="check" className="w-8 h-8 text-green-400" />
        </div>
        <h3 id="success-modal-title" className="text-2xl font-bold text-slate-100">
          {title || 'Formatting Complete!'}
        </h3>
        <p className="mt-2 text-slate-400">
          {message || 'Your document has been successfully formatted and is ready for use.'}
        </p>
        <div className="mt-6">
          <button
            type="button"
            onClick={onClose}
            className="w-full bg-sky-600 hover:bg-sky-500 text-white font-bold py-2 px-4 rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-800 focus:ring-sky-500"
            autoFocus
          >
            OK
          </button>
        </div>
      </div>
    </div>
  );
};