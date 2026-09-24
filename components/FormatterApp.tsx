import React, { useState, useCallback, useEffect, useRef } from 'react';
import { Header } from './Header';
import { Controls } from './Controls';
import { EditorPanel } from './EditorPanel';
import { HistoryPanel } from './HistoryPanel';
import { CitationStyle, FormattingTask, HistoryItem } from '../types';
import { TELUGU_FONTS, PLACEHOLDER_TEXT } from '../constants';
import { formatTextStream } from '../services/geminiService';
import { Icon } from './Icon';
import { SuccessModal } from './SuccessModal';


const LOADING_MESSAGES = [
  'Initializing formatting engine...',
  'Analyzing document structure...',
  'Applying citation rules...',
  'Formatting headings and paragraphs...',
  'Polishing references list...',
  'Finalizing the output...',
  'Almost there, just a few more seconds...',
];

/**
 * Plays a pleasant, two-tone chime sound using the Web Audio API.
 * This avoids the need for external audio files and is more reliable.
 */
const playSuccessSound = () => {
  try {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    if (!audioContext) return;

    const playNote = (frequency: number, startTime: number, duration: number) => {
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);

        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(frequency, startTime);
        
        gainNode.gain.setValueAtTime(0, startTime);
        gainNode.gain.linearRampToValueAtTime(0.2, startTime + 0.01);
        gainNode.gain.exponentialRampToValueAtTime(0.00001, startTime + duration);

        oscillator.start(startTime);
        oscillator.stop(startTime + duration);
    };
    
    const now = audioContext.currentTime;
    playNote(880, now, 0.2);
    playNote(1046.50, now + 0.1, 0.2);
    
    setTimeout(() => {
      if (audioContext.state !== 'closed') {
          audioContext.close();
      }
    }, 500);

  } catch (e) {
    console.error("Error playing notification sound:", e);
  }
};


const cleanFormattedOutput = (text: string): string => {
  let cleaned = text.trim();
  if (cleaned.startsWith("```html")) {
    cleaned = cleaned.replace(/^```html\s*/i, "");
  } else if (cleaned.startsWith("```")) {
    cleaned = cleaned.replace(/^```\s*/, "");
  }
  if (cleaned.endsWith("```")) {
    cleaned = cleaned.replace(/\s*```$/, "");
  }
  return cleaned;
};

const FormatterApp: React.FC = () => {
  const historyKey = 'formatter-history';
  const historyVisibilityKey = 'history-panel-visible-desktop';

  const [rawText, setRawText] = useState<string>('');
  const [formattedText, setFormattedText] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const [citationStyle, setCitationStyle] = useState<CitationStyle>(CitationStyle.MLA);
  const [paragraphFont, setParagraphFont] = useState<string>('Mallanna');
  const [headingFont, setHeadingFont] = useState<string>('Mandali');
  const [task, setTask] = useState<FormattingTask>(FormattingTask.General);
  
  const [elapsedTime, setElapsedTime] = useState<number>(0);
  const [loadingMessage, setLoadingMessage] = useState<string>(LOADING_MESSAGES[0]);
  const [chunkProgress, setChunkProgress] = useState<{
    currentChunk: number;
    totalChunks: number;
    percent: number;
    statusText: string;
  } | null>(null);

  const abortControllerRef = useRef<AbortController | null>(null);

  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [isHistoryPanelOpen, setIsHistoryPanelOpen] = useState<boolean>(false);

  const [isSuccessModalVisible, setIsSuccessModalVisible] = useState(false);
  const [successInfo, setSuccessInfo] = useState<{title: string, message: string} | null>(null);

  // Load history from localStorage on initial render
  useEffect(() => {
    try {
      const savedHistory = localStorage.getItem(historyKey);
      if (savedHistory) {
        setHistory(JSON.parse(savedHistory));
      }
    } catch (e) {
      console.error("Failed to load history from localStorage", e);
    }
  }, [historyKey]);

  // Set initial history panel visibility for desktop
  useEffect(() => {
    try {
      const isDesktop = window.innerWidth >= 1024;
      const savedVisibility = localStorage.getItem(historyVisibilityKey);
      if (isDesktop) {
        setIsHistoryPanelOpen(savedVisibility !== null ? JSON.parse(savedVisibility) : true);
      } else {
        setIsHistoryPanelOpen(false);
      }
    } catch (e) {
      console.error("Failed to load panel visibility from localStorage", e);
    }
  }, []);

  // Save history to localStorage whenever it changes
  useEffect(() => {
    try {
      localStorage.setItem(historyKey, JSON.stringify(history));
    } catch (e) {
      console.error("Failed to save history to localStorage", e);
    }
  }, [history, historyKey]);

  // Save history panel visibility to localStorage for desktop view
  useEffect(() => {
    try {
      const isDesktop = window.innerWidth >= 1024;
      if(isDesktop) {
        localStorage.setItem(historyVisibilityKey, JSON.stringify(isHistoryPanelOpen));
      }
    } catch (e) {
      console.error("Failed to save panel visibility to localStorage", e);
    }
  }, [isHistoryPanelOpen]);

  useEffect(() => {
    let timerInterval: ReturnType<typeof setInterval> | undefined;
    let messageInterval: ReturnType<typeof setInterval> | undefined;

    if (isLoading) {
      setElapsedTime(0);
      setLoadingMessage(LOADING_MESSAGES[0]);

      timerInterval = setInterval(() => {
        setElapsedTime(prevTime => prevTime + 1);
      }, 1000);

      let messageIndex = 0;
      messageInterval = setInterval(() => {
        messageIndex = (messageIndex + 1) % LOADING_MESSAGES.length;
        setLoadingMessage(LOADING_MESSAGES[messageIndex]);
      }, 3500);
    } else {
      if (timerInterval) clearInterval(timerInterval);
      if (messageInterval) clearInterval(messageInterval);
    }

    return () => {
      if (timerInterval) clearInterval(timerInterval);
      if (messageInterval) clearInterval(messageInterval);
    };
  }, [isLoading]);
  
  // Effect to play sound when success modal is shown
  useEffect(() => {
    if (isSuccessModalVisible) {
      playSuccessSound();
    }
  }, [isSuccessModalVisible]);

  // Cleanup active request on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  const handleStopAndReset = useCallback(() => {
    // 1. Immediately abort active stream / ongoing operations
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }

    // 2. Reset app state completely
    setIsLoading(false);
    setRawText('');
    setFormattedText('');
    setError(null);
    setChunkProgress(null);
    setElapsedTime(0);
    setIsSuccessModalVisible(false);
    setSuccessInfo(null);
  }, []);

  const startStreamingFormatting = useCallback(async () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const controller = new AbortController();
    abortControllerRef.current = controller;

    setIsLoading(true);
    setError(null);
    setFormattedText('');
    setChunkProgress(null);

    let accumulatedText = "";
    let streamDidStart = false;

    try {
      const stream = formatTextStream(rawText, citationStyle, task, {
        signal: controller.signal,
        onProgress: (info) => {
          setChunkProgress(info);
        },
      });

      for await (const chunk of stream) {
        if (controller.signal.aborted) return;
        if (!streamDidStart) {
          streamDidStart = true;
          setIsLoading(false);
        }
        accumulatedText += chunk;
        setFormattedText(cleanFormattedOutput(accumulatedText));
      }
      
      if (controller.signal.aborted) return;

      const finalCleanText = cleanFormattedOutput(accumulatedText);
      if (finalCleanText) {
        setFormattedText(finalCleanText);
        const newHistoryItem: HistoryItem = {
          id: Date.now(),
          input: rawText,
          output: finalCleanText,
          task: task,
          timestamp: new Date().toISOString(),
        };
        setHistory(prevHistory => [newHistoryItem, ...prevHistory]);
        setSuccessInfo(null);
        setIsSuccessModalVisible(true);
      }

    } catch (err: any) {
      if (controller.signal.aborted || err?.name === 'AbortError' || err?.message?.includes('aborted')) {
        return;
      }
      console.error(err);
      setError(err instanceof Error ? err.message : 'An unknown error occurred.');
    } finally {
      setIsLoading(false);
      setChunkProgress(null);
      if (abortControllerRef.current === controller) {
        abortControllerRef.current = null;
      }
    }
  }, [rawText, citationStyle, task]);

  const handleFormat = useCallback(async () => {
    if (!rawText.trim()) {
      setError("Input text cannot be empty.");
      return;
    }
    
    startStreamingFormatting();
  }, [rawText, startStreamingFormatting]);

  const handleClear = useCallback(() => {
    setRawText('');
    setFormattedText('');
    setError(null);
  }, []);

  const handleLoadHistory = useCallback((id: number) => {
    const item = history.find(h => h.id === id);
    if (item) {
      setRawText(item.input);
      setFormattedText(item.output);
      setTask(item.task);
      setError(null);
    }
  }, [history]);

  const handleDeleteHistory = useCallback((id: number) => {
    setHistory(prevHistory => prevHistory.filter(h => h.id !== id));
  }, []);
  
  const handleClearHistory = useCallback(() => {
      if (window.confirm("Are you sure you want to clear your entire history? This action cannot be undone.")) {
        setHistory([]);
      }
  }, []);

  const outputProseStyles = `
    w-full h-full text-justify
    [&>h1]:text-3xl [&>h1]:font-bold [&>h1]:mb-6 [&>h1]:text-center [&>h1]:text-sky-300
    [&>h2]:text-2xl [&>h2]:font-bold [&>h2]:mb-4 [&>h2]:mt-8 [&>h2]:text-sky-400
    [&>h3]:text-xl [&>h3]:font-semibold [&>h3]:mb-3 [&>h3]:mt-6 [&>h3]:text-sky-500
    [&>h4]:text-lg [&>h4]:font-semibold [&>h4]:italic [&>h4]:mb-2 [&>h4]:mt-4 [&>h4]:text-slate-300
    [&>p]:mb-4 [&>p]:indent-8
    [&_blockquote]:border-l-4 [&_blockquote]:border-sky-500 [&_blockquote]:pl-4 [&_blockquote]:pr-2 [&_blockquote]:py-2 [&_blockquote]:my-4 [&_blockquote]:text-slate-300 [&_blockquote]:bg-slate-800/60 [&_blockquote]:rounded-r-md [&_blockquote]:text-left
    [&_blockquote>p]:indent-0 [&_blockquote>p]:mb-0 [&_blockquote_p]:indent-0
    [&>ul]:list-disc [&>ul]:pl-6
    [&>ol]:list-decimal [&>ol]:pl-6
    [&>li]:mb-2 [&>li]:pl-2
    [&_em]:italic
    [&>table]:w-full [&>table]:border-collapse [&>table]:my-4
    [&_th]:border [&_th]:border-slate-600 [&_th]:p-2 [&_th]:bg-slate-700 [&_th]:text-sky-300 [&_th]:text-left
    [&_td]:border [&_td]:border-slate-600 [&_td]:p-2
  `;

  const dynamicFontStyles = `
    .formatted-content {
      font-family: '${paragraphFont}', serif;
    }
    .formatted-content h1,
    .formatted-content h2,
    .formatted-content h3,
    .formatted-content h4 {
      font-family: '${headingFont}', sans-serif;
    }
  `;

  return (
    <>
      <style>{dynamicFontStyles}</style>
      <div className="min-h-screen bg-slate-900 flex flex-col p-2 sm:p-4">
        <Header 
            isHistoryVisible={isHistoryPanelOpen}
            onToggleHistory={() => setIsHistoryPanelOpen(!isHistoryPanelOpen)}
        />
        <div className="flex-grow flex gap-4 max-w-[96rem] w-full mx-auto">
            <HistoryPanel
                isOpen={isHistoryPanelOpen}
                onClose={() => setIsHistoryPanelOpen(false)}
                history={history}
                onLoad={handleLoadHistory}
                onDelete={handleDeleteHistory}
                onClearAll={handleClearHistory}
            />
            <div className="flex-grow flex flex-col gap-4 min-w-0">
              <Controls
                task={task}
                setTask={setTask}
                citationStyle={citationStyle}
                setCitationStyle={setCitationStyle}
                paragraphFont={paragraphFont}
                setParagraphFont={setParagraphFont}
                headingFont={headingFont}
                setHeadingFont={setHeadingFont}
                onFormat={handleFormat}
                isLoading={isLoading}
                fontOptions={TELUGU_FONTS}
                onStopAndReset={handleStopAndReset}
                chunkProgress={chunkProgress}
              />
              {error && (
                <div className="bg-red-900/50 border border-red-700 text-red-300 px-4 py-3 rounded-lg w-full max-w-7xl mx-auto" role="alert">
                  <strong className="font-bold">Error: </strong>
                  <span className="block sm:inline">{error}</span>
                </div>
              )}
              <main className="flex-grow grid grid-cols-1 lg:grid-cols-2 gap-4 w-full max-w-7xl mx-auto">
                <EditorPanel
                  title="Input Text"
                  value={rawText}
                  onChange={(e) => setRawText(e.target.value)}
                  placeholder={PLACEHOLDER_TEXT}
                  isInput={true}
                  onClear={handleClear}
                />
                <EditorPanel
                  title="Formatted Output"
                  isOutput={true}
                  isLoading={isLoading}
                  formattedText={formattedText}
                  paragraphFont={paragraphFont}
                  headingFont={headingFont}
                  task={task}
                >
                  {isLoading ? (
                     <div className="flex flex-col items-center justify-center h-full text-slate-400 text-center px-4">
                        <Icon name="loading" className="w-10 h-10 animate-spin mb-4 text-sky-400"/>
                        <p className="text-lg font-medium mb-2 transition-opacity duration-500">
                          {chunkProgress ? chunkProgress.statusText : loadingMessage}
                        </p>
                        <div className="flex flex-wrap items-center justify-center gap-2 mb-4">
                          <p className="text-sm font-mono bg-slate-700/50 px-3 py-1 rounded">
                            Elapsed Time: {elapsedTime}s
                          </p>
                          {chunkProgress && (
                            <p className="text-sm font-mono bg-sky-900/60 text-sky-200 px-3 py-1 rounded border border-sky-800">
                              Part {chunkProgress.currentChunk} / {chunkProgress.totalChunks} ({chunkProgress.percent}%)
                            </p>
                          )}
                        </div>
                        <button
                          type="button"
                          onClick={handleStopAndReset}
                          className="bg-rose-600/90 hover:bg-rose-600 active:bg-rose-700 text-white font-semibold py-2 px-5 rounded-lg flex items-center gap-2 transition text-sm shadow-md"
                        >
                          <Icon name="stop" className="w-4 h-4" />
                          <span>Stop Operation</span>
                        </button>
                     </div>
                  ) : formattedText ? (
                    task === FormattingTask.Abstract ? (
                        <p
                            className={`formatted-content ${outputProseStyles}`}
                            style={{
                                fontSize: '1.1rem',
                                lineHeight: '1.7',
                                whiteSpace: 'pre-wrap',
                            }}
                        >
                            {formattedText}
                        </p>
                    ) : (
                        <div
                        className={`formatted-content ${outputProseStyles}`}
                        style={{
                            fontSize: '1.1rem',
                            lineHeight: '1.7',
                        }}
                        dangerouslySetInnerHTML={{ __html: formattedText }}
                        />
                    )
                  ) : (
                    <div className="flex items-center justify-center h-full text-slate-500">
                      <p>Your formatted text will appear here.</p>
                    </div>
                  )}
                </EditorPanel>
              </main>
            </div>
        </div>
        <footer className="text-center py-3 text-slate-500 text-sm">
          <div className="max-w-[96rem] mx-auto border-t border-slate-700/50 pt-3">
            <p>GARUDA &copy; {new Date().getFullYear()} AUCHITHYAM Paper Formatter. Built for Academic Excellence.</p>
          </div>
        </footer>
        <SuccessModal 
            isOpen={isSuccessModalVisible}
            onClose={() => setIsSuccessModalVisible(false)}
            title={successInfo?.title}
            message={successInfo?.message}
        />
      </div>
    </>
  );
};

export default FormatterApp;