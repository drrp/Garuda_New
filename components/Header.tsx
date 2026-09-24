import React from 'react';
import { Icon } from './Icon';

interface HeaderProps {
  isHistoryVisible: boolean;
  onToggleHistory: () => void;
}

export const Header: React.FC<HeaderProps> = ({ 
  isHistoryVisible, 
  onToggleHistory, 
}) => {
  return (
    <header className="flex flex-wrap items-center justify-between gap-4 mb-4 max-w-[96rem] w-full mx-auto p-2">
      <div className="flex items-center gap-2">
        <button 
          onClick={onToggleHistory}
          className="flex items-center gap-2 bg-slate-700 hover:bg-slate-600 px-3 py-2 rounded-md text-sm transition-colors text-slate-200"
          aria-label={isHistoryVisible ? "Hide history panel" : "Show history panel"}
          title={isHistoryVisible ? "Hide History" : "Show History"}
        >
          <Icon name="history" className="w-5 h-5" />
          <span className="hidden sm:inline">History</span>
        </button>
      </div>

      <div className="text-center flex-grow order-first w-full md:order-none md:w-auto">
        <h1 className="text-4xl md:text-5xl font-bold text-sky-400">
          GARUDA
        </h1>
        <p className="text-sm md:text-base text-slate-400 mt-1 md:mt-2 truncate font-['Mandali']">
          AUCHITHYAM Paper Formatter
        </p>
      </div>

      <div className="flex items-center gap-2 sm:gap-4">
        <span className="text-xs font-mono text-slate-400 bg-slate-800 border border-slate-700 px-2.5 py-1.5 rounded-md hidden sm:inline-block">
          MLA &bull; APA Academic
        </span>
      </div>
    </header>
  );
};