



import React, { useState, useEffect, useRef } from 'react';
import { Icon } from './Icon';
import { FormattingTask } from '../types';

interface EditorPanelProps {
  title: string;
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  placeholder?: string;
  isInput?: boolean;
  isOutput?: boolean;
  isLoading?: boolean;
  children?: React.ReactNode;
  formattedText?: string;
  paragraphFont?: string;
  headingFont?: string;
  onClear?: () => void;
  task?: FormattingTask;
}

export const EditorPanel: React.FC<EditorPanelProps> = ({
  title,
  value,
  onChange,
  placeholder,
  isInput = false,
  isOutput = false,
  isLoading = false,
  children,
  formattedText,
  paragraphFont,
  headingFont,
  onClear,
  task,
}) => {
  const [hasCopiedText, setHasCopiedText] = useState(false);
  const [hasCopiedHtml, setHasCopiedHtml] = useState(false);
  
  const [isPromptingFilename, setIsPromptingFilename] = useState(false);
  const [downloadFilename, setDownloadFilename] = useState('');
  
  const outputContentRef = useRef<HTMLDivElement>(null);

  const handleCopyText = () => {
    // Add check for formattedText to ensure we don't copy placeholder text
    if (outputContentRef.current && formattedText) {
      navigator.clipboard.writeText(outputContentRef.current.textContent || '').then(() => {
        setHasCopiedText(true);
      });
    }
  };
  
  const handleCopyHtml = () => {
    if (formattedText) {
      navigator.clipboard.writeText(formattedText).then(() => {
        setHasCopiedHtml(true);
      });
    }
  };

  const startDocDownload = () => {
    if (!formattedText) return;

    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = formattedText;
    const titleElement = tempDiv.querySelector('h1');
    const docTitle = titleElement ? titleElement.textContent : 'Formatted Document';
    const suggestedFilename = docTitle?.trim().replace(/[\s\W_]+/g, '-').substring(0, 50) || 'formatted-document';

    setDownloadFilename(suggestedFilename);
    setIsPromptingFilename(true);
  };

  const cancelDownload = () => {
    setIsPromptingFilename(false);
    setDownloadFilename('');
  };

  const handleDocDownload = () => {
    const userFilename = downloadFilename.trim();
    if (!formattedText || !userFilename || !paragraphFont || !headingFont) {
      cancelDownload();
      return;
    }

    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = formattedText;
    const titleElement = tempDiv.querySelector('h1');
    const docTitle = titleElement ? titleElement.textContent : 'Formatted Document';

    const sourceHtml = `
        <!DOCTYPE html>
        <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
            <head>
            <meta charset='utf-8'>
            <title>${docTitle}</title>
            <!--[if gte mso 9]>
            <xml>
                <w:WordDocument>
                <w:View>Print</w:View>
                <w:Zoom>90</w:Zoom>
                <w:DoNotOptimizeForBrowser/>
                </w:WordDocument>
            </xml>
            <![endif]-->
            <style>
                body { 
                font-family: '${paragraphFont}', serif; 
                font-size: 12pt;
                }
                p {
                text-align: justify;
                margin-bottom: 12pt;
                text-indent: 0.5in;
                }
                h1, h2, h3, h4, h5, h6 { 
                font-family: '${headingFont}', sans-serif;
                }
                h2 { 
                font-size: 14pt;
                }
                blockquote { 
                border-left: 4px solid #cccccc; 
                padding-left: 10px; 
                font-weight: bold; 
                }
                blockquote p {
                text-align: left;
                text-indent: 0;
                }
                table {
                border-collapse: collapse;
                width: 100%;
                }
                th, td {
                border: 1px solid #777;
                padding: 8px;
                }
            </style>
            </head>
            <body>
            ${formattedText}
            </body>
        </html>
    `;
    
    const source = 'data:application/vnd.ms-word;charset=utf-8,' + encodeURIComponent(sourceHtml);
    const link = document.createElement('a');
    link.href = source;
    link.download = `${userFilename}.doc`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    cancelDownload();
  };

  useEffect(() => {
    if (hasCopiedText) {
      const timer = setTimeout(() => setHasCopiedText(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [hasCopiedText]);

  useEffect(() => {
    if (hasCopiedHtml) {
        const timer = setTimeout(() => setHasCopiedHtml(false), 2000);
        return () => clearTimeout(timer);
    }
  }, [hasCopiedHtml]);

  return (
    <div className="bg-slate-800 rounded-lg border border-slate-700 flex flex-col h-[70vh]">
      <header className="flex justify-between items-center p-3 border-b border-slate-700 flex-wrap gap-2">
        <h2 className="text-lg font-semibold text-slate-300">{title}</h2>
        <div className="flex items-center gap-2">
           {isInput && onClear && (
              <button
                onClick={onClear}
                disabled={!value}
                className="flex items-center gap-2 bg-slate-700 hover:bg-slate-600 px-3 py-1 rounded-md text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                aria-label="Clear input text"
                title="Clear Input"
              >
                <Icon name="trash" className="w-4 h-4" />
                Clear
              </button>
           )}
          {isOutput && !isLoading && formattedText && (
            isPromptingFilename ? (
              <div className="flex items-center gap-2" role="dialog" aria-labelledby="filename-label">
                  <label id="filename-label" className="sr-only">Enter filename</label>
                  <input
                      type="text"
                      value={downloadFilename}
                      onChange={(e) => setDownloadFilename(e.target.value)}
                      onKeyDown={(e) => { if (e.key === 'Enter') handleDocDownload(); if (e.key === 'Escape') cancelDownload(); }}
                      className="bg-slate-900 border border-slate-600 rounded-md px-3 py-1 text-sm text-white focus:ring-2 focus:ring-sky-500 focus:outline-none transition"
                      placeholder="Enter filename"
                      autoFocus
                  />
                  <button onClick={handleDocDownload} className="bg-sky-600 hover:bg-sky-500 text-white font-bold py-1 px-3 rounded-md text-sm transition">
                      Save
                  </button>
                  <button onClick={cancelDownload} className="bg-slate-600 hover:bg-slate-500 text-white font-bold py-1 px-3 rounded-md text-sm transition">
                      Cancel
                  </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  onClick={handleCopyText}
                  disabled={!formattedText}
                  className="flex items-center gap-2 bg-slate-700 hover:bg-slate-600 px-3 py-1 rounded-md text-sm transition-colors disabled:bg-slate-600 disabled:cursor-not-allowed"
                  aria-label="Copy output as plain text"
                >
                  {hasCopiedText ? <Icon name="check" className="w-4 h-4 text-green-400" /> : <Icon name="copy" className="w-4 h-4" />}
                  {hasCopiedText ? 'Copied!' : 'Copy Text'}
                </button>
                <button
                  onClick={handleCopyHtml}
                  disabled={!formattedText}
                  className="flex items-center gap-2 bg-slate-700 hover:bg-slate-600 px-3 py-1 rounded-md text-sm transition-colors disabled:bg-slate-600 disabled:cursor-not-allowed"
                  aria-label="Copy output as HTML"
                >
                  {hasCopiedHtml ? <Icon name="check" className="w-4 h-4 text-green-400" /> : <Icon name="code" className="w-4 h-4" />}
                  {hasCopiedHtml ? 'Copied!' : 'Copy HTML'}
                </button>
                <button
                  onClick={startDocDownload}
                  disabled={!formattedText}
                  className="flex items-center gap-2 bg-sky-700 hover:bg-sky-600 px-3 py-1 rounded-md text-sm transition-colors disabled:bg-slate-600 disabled:cursor-not-allowed"
                  aria-label="Download output as DOC file"
                >
                  <Icon name="download" className="w-4 h-4" />
                  Download .doc
                </button>
              </div>
            )
          )}
        </div>
      </header>
      <div className="p-4 flex-grow overflow-y-auto" ref={isOutput ? outputContentRef : null}>
        {isOutput ? (
          children
        ) : (
          <textarea
            value={value}
            onChange={onChange}
            placeholder={placeholder}
            className="w-full h-full bg-transparent text-slate-300 placeholder-slate-500 resize-none focus:outline-none leading-relaxed"
          />
        )}
      </div>
    </div>
  );
};