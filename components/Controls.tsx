import React, { useId } from 'react';
import { CitationStyle, FormattingTask } from '../types';
import { Icon } from './Icon';

interface ControlsProps {
  task: FormattingTask;
  setTask: (task: FormattingTask) => void;
  citationStyle: CitationStyle;
  setCitationStyle: (style: CitationStyle) => void;
  paragraphFont: string;
  setParagraphFont: (font: string) => void;
  headingFont: string;
  setHeadingFont: (font: string) => void;
  onFormat: () => void;
  isLoading: boolean;
  fontOptions: string[];
  onStopAndReset: () => void;
  chunkProgress?: {
    currentChunk: number;
    totalChunks: number;
    percent: number;
    statusText: string;
  } | null;
}

const SelectControl: React.FC<{ label: string; value: string; onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void; options: string[] }> = ({ label, value, onChange, options }) => {
    const id = useId();
    return (
        <div className="flex flex-col">
          <label htmlFor={id} className="mb-1 text-sm font-medium text-slate-400">{label}</label>
          <select
            id={id}
            value={value}
            onChange={onChange}
            className="bg-slate-700 border border-slate-600 rounded-md px-3 py-2 text-white focus:ring-2 focus:ring-sky-500 focus:outline-none transition"
          >
            {options.map(option => <option key={option} value={option}>{option}</option>)}
          </select>
        </div>
    );
};

export const Controls: React.FC<ControlsProps> = ({
  task, setTask,
  citationStyle, setCitationStyle,
  paragraphFont, setParagraphFont,
  headingFont, setHeadingFont,
  onFormat, isLoading, fontOptions,
  onStopAndReset, chunkProgress
}) => {
  return (
    <div className="bg-slate-800/50 p-4 rounded-lg mb-4 flex flex-col md:flex-row items-center justify-between gap-4 max-w-7xl w-full mx-auto border border-slate-700">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 w-full md:w-auto">
            <SelectControl label="Task" value={task} onChange={(e) => setTask(e.target.value as FormattingTask)} options={Object.values(FormattingTask)} />
            <SelectControl label="Paragraph Font" value={paragraphFont} onChange={(e) => setParagraphFont(e.target.value)} options={fontOptions} />
            <SelectControl label="Heading Font" value={headingFont} onChange={(e) => setHeadingFont(e.target.value)} options={fontOptions} />
            <SelectControl label="Citation Style" value={citationStyle} onChange={(e) => setCitationStyle(e.target.value as CitationStyle)} options={Object.values(CitationStyle)} />
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
          {chunkProgress && (
            <div className="text-xs text-sky-300 bg-sky-950/80 border border-sky-800/80 rounded-lg px-3 py-2 flex items-center gap-2 font-medium">
              <Icon name="loading" className="w-4 h-4 animate-spin text-sky-400" />
              <span>{chunkProgress.statusText}</span>
              <span className="bg-sky-800 text-sky-100 rounded px-1.5 py-0.5 text-[11px] font-mono">
                {chunkProgress.percent}%
              </span>
            </div>
          )}

          <div className="flex items-center gap-2 w-full sm:w-auto">
            {isLoading ? (
              <button
                type="button"
                onClick={onStopAndReset}
                title="Stop all ongoing operations and reset the app"
                className="w-full sm:w-auto bg-rose-600 hover:bg-rose-500 active:bg-rose-700 text-white font-bold py-2.5 px-6 rounded-lg transition-all duration-200 flex items-center justify-center gap-2 shadow-lg shadow-rose-950/40 animate-pulse"
              >
                <Icon name="stop" className="w-5 h-5" />
                <span>Stop & Reset</span>
              </button>
            ) : (
              <>
                <button
                  type="button"
                  onClick={onFormat}
                  className="w-full sm:w-auto bg-sky-600 hover:bg-sky-500 text-white font-bold py-2.5 px-6 rounded-lg transition-colors duration-200 flex items-center justify-center gap-2 shadow-md shadow-sky-900/30"
                >
                  <Icon name="sparkles" className="w-5 h-5" />
                  <span>Format</span>
                </button>
                <button
                  type="button"
                  onClick={onStopAndReset}
                  title="Reset the app and clear all content"
                  className="w-full sm:w-auto bg-slate-700 hover:bg-slate-600 text-slate-300 hover:text-white font-medium py-2.5 px-4 rounded-lg transition-colors duration-200 flex items-center justify-center gap-2 border border-slate-600"
                >
                  <Icon name="reset" className="w-4 h-4" />
                  <span>Reset</span>
                </button>
              </>
            )}
          </div>
        </div>
    </div>
  );
};
