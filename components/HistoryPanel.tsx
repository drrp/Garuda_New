import React from 'react';
import { HistoryItem } from '../types';
import { Icon } from './Icon';

interface HistoryPanelProps {
  history: HistoryItem[];
  onLoad: (id: number) => void;
  onDelete: (id: number) => void;
  onClearAll: () => void;
  isOpen: boolean;
  onClose: () => void;
}

export const HistoryPanel: React.FC<HistoryPanelProps> = ({ history, onLoad, onDelete, onClearAll, isOpen, onClose }) => {
  return (
    <>
      {/* Overlay for mobile view */}
      <div 
        className={`fixed inset-0 bg-slate-900/60 z-30 lg:hidden transition-opacity ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={onClose}
        aria-hidden="true"
      ></div>

      <aside className={`
        fixed top-0 left-0 h-full w-72 bg-slate-800 rounded-r-lg border-r border-slate-700 flex flex-col z-40
        transition-transform transform lg:relative lg:w-64 lg:flex-shrink-0 lg:rounded-lg lg:border lg:h-auto lg:transform-none lg:translate-x-0
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <header className="flex justify-between items-center p-3 border-b border-slate-700 flex-shrink-0">
          <h2 className="text-lg font-semibold text-slate-300">History</h2>
          <div className="flex items-center gap-1">
            {history.length > 0 && (
                <button
                    onClick={onClearAll}
                    className="flex items-center gap-1 text-slate-400 hover:text-red-400 px-2 py-1 rounded-md text-xs transition-colors"
                    title="Clear all history"
                    aria-label="Clear all history"
                >
                    <Icon name="trash" className="w-4 h-4" />
                    Clear
                </button>
            )}
             <button
                onClick={onClose}
                className="lg:hidden text-slate-400 hover:text-slate-200 p-1"
                aria-label="Close history panel"
             >
                <Icon name="close" className="w-5 h-5" />
            </button>
          </div>
        </header>
        <div className="flex-grow overflow-y-auto p-2">
          {history.length === 0 ? (
            <div className="flex items-center justify-center h-full text-center text-slate-500 px-4">
              <p>Your formatting history will appear here.</p>
            </div>
          ) : (
            <ul>
              {history.map(item => (
                <li key={item.id} className="mb-2 group">
                  <div 
                      className="block p-2 rounded-md bg-slate-700/50 hover:bg-slate-700 cursor-pointer transition-colors w-full text-left"
                      onClick={() => {
                        onLoad(item.id);
                        onClose(); // Close panel on mobile after loading
                      }}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                              onLoad(item.id);
                              onClose();
                          }
                      }}
                      aria-label={`Load history item from ${new Date(item.timestamp).toLocaleString()}`}
                  >
                    <p className="text-sm text-slate-300 truncate font-medium">
                      {item.input.substring(0, 50) || 'Untitled'}...
                    </p>
                    <div className="flex justify-between items-end mt-1">
                      <div className="text-xs text-slate-400">
                          <span>{new Date(item.timestamp).toLocaleDateString()}</span>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation(); // Prevent loading when deleting
                          onDelete(item.id);
                        }}
                        className="opacity-0 group-hover:opacity-100 text-slate-500 hover:text-red-400 transition-opacity p-1 rounded-full"
                        aria-label="Delete this history item"
                        title="Delete Item"
                      >
                        <Icon name="close" className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </aside>
    </>
  );
};