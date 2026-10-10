import React, { useState, useRef } from 'react';
import { Upload, FileText, CheckCircle2, AlertTriangle, X } from 'lucide-react';
import { parseRecipientFile } from '../../lib/csv-parser';
import type { RecipientInput } from '../../types/api';
import { Button } from '../ui/Button';

export interface FileImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (recipients: RecipientInput[], mode: 'replace' | 'append') => void;
  currentCount: number;
}

export const FileImportModal: React.FC<FileImportModalProps> = ({
  isOpen,
  onClose,
  onImport,
  currentCount,
}) => {
  const [fileName, setFileName] = useState<string>('');
  const [parsedRecipients, setParsedRecipients] = useState<RecipientInput[]>([]);
  const [parseErrors, setParseErrors] = useState<string[]>([]);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileProcess = (file: File) => {
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = (e.target?.result as string) || '';
      const result = parseRecipientFile(text, file.name);
      setParsedRecipients(result.recipients);
      setParseErrors(result.errors);
    };
    reader.readAsText(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileProcess(e.dataTransfer.files[0]);
    }
  };

  const handleApply = (mode: 'replace' | 'append') => {
    onImport(parsedRecipients, mode);
    onClose();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="import-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 select-none"
    >
      <div className="bg-white border-2 border-black rounded-none shadow-[6px_6px_0px_#000000] max-w-lg w-full overflow-hidden text-xs text-black">
        {/* Modal Header */}
        <div className="px-4 py-2.5 border-b-2 border-black flex items-center justify-between bg-white">
          <div className="flex items-center gap-2">
            <Upload className="w-4 h-4 text-black" />
            <h3 id="import-modal-title" className="font-ui font-bold uppercase tracking-wider text-xs text-black">
              IMPORT RECIPIENTS (CSV / JSON)
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close import dialog"
            className="text-black hover:bg-black hover:text-white p-1 border border-black"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-4 space-y-4">
          <p className="text-neutral-800 font-serif leading-relaxed text-xs">
            Parse recipient rosters directly in your browser. Supported formats: <code className="text-black bg-neutral-200 px-1 py-0.5 border border-black font-mono">.csv</code> (headers: name, email) or <code className="text-black bg-neutral-200 px-1 py-0.5 border border-black font-mono">.json</code> (array of objects).
          </p>

          {/* Drag & Drop Area */}
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed border-black p-6 text-center cursor-pointer ${
              isDragging ? 'bg-[#c0d4a7]' : 'bg-[#dfdfdf]/40 hover:bg-[#dfdfdf]/80'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,.json,text/csv,application/json"
              className="hidden"
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                  handleFileProcess(e.target.files[0]);
                }
              }}
            />
            <FileText className="w-8 h-8 text-black mx-auto mb-2" />
            <div className="font-ui font-bold uppercase text-xs text-black">
              {fileName ? fileName : 'SELECT FILE OR DRAG & DROP'}
            </div>
            <div className="text-[11px] font-serif text-neutral-600 mt-0.5">
              Click to browse your local file system
            </div>
          </div>

          {/* Parse Errors */}
          {parseErrors.length > 0 && (
            <div className="p-3 bg-[#d77a7a] border border-black text-black space-y-1">
              <div className="flex items-center gap-1.5 font-ui font-bold uppercase text-[11px]">
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>Parse Warnings / Validation Errors ({parseErrors.length})</span>
              </div>
              <ul className="list-disc list-inside text-[11px] font-serif space-y-0.5 max-h-24 overflow-y-auto">
                {parseErrors.map((err, i) => (
                  <li key={i}>{err}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Parse Success Telemetry */}
          {parsedRecipients.length > 0 && (
            <div className="p-3 bg-[#c0d4a7] border border-black text-black flex items-center justify-between">
              <div className="flex items-center gap-2 font-ui font-bold text-xs uppercase">
                <CheckCircle2 className="w-4 h-4 text-black" />
                <span>Found {parsedRecipients.length} Valid Records</span>
              </div>
              <span className="font-mono text-[11px] bg-black text-white px-1">
                Batch Capacity: {currentCount + parsedRecipients.length}/500
              </span>
            </div>
          )}
        </div>

        {/* Modal Actions */}
        <div className="px-4 py-3 border-t-2 border-black bg-neutral-100 flex items-center justify-between gap-2">
          <Button variant="secondary" size="sm" onClick={onClose}>
            Cancel
          </Button>

          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              disabled={parsedRecipients.length === 0}
              onClick={() => handleApply('append')}
            >
              Append to Roster
            </Button>

            <Button
              variant="primary"
              size="sm"
              disabled={parsedRecipients.length === 0}
              onClick={() => handleApply('replace')}
            >
              Replace Existing ({parsedRecipients.length})
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
