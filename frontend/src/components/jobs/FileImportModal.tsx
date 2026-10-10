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
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm select-none"
    >
      <div className="bg-[#ffffff] border border-[#dcd3c1] rounded-lg shadow-2xl max-w-lg w-full overflow-hidden text-xs text-[#161a22]">
        {/* Modal Header */}
        <div className="px-5 py-4 border-b border-[#e2dac9] flex items-center justify-between bg-[#fcfaf4]">
          <div className="flex items-center gap-2">
            <Upload className="w-4 h-4 text-[#15803d]" />
            <h3 id="import-modal-title" className="font-bold text-[#161a22] font-mono-telemetry uppercase tracking-wider">
              Import Recipients (CSV / JSON)
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close import dialog"
            className="text-[#7d8b9e] hover:text-[#161a22] p-1 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-5 space-y-4">
          <p className="text-[#556377] leading-relaxed text-[11px]">
            Parse recipient rosters directly in your browser. Supported formats: <code className="text-[#161a22] bg-[#f5efe4] px-1 py-0.5 rounded font-mono-telemetry">.csv</code> (headers: name, email) or <code className="text-[#161a22] bg-[#f5efe4] px-1 py-0.5 rounded font-mono-telemetry">.json</code> (array of objects).
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
            className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
              isDragging
                ? 'border-[#15803d] bg-[#f0fdf4]'
                : 'border-[#dcd3c1] hover:border-[#b8a892] bg-[#fcfaf4]'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,.json,text/csv,application/json"
              onChange={(e) => {
                if (e.target.files && e.target.files.length > 0) {
                  handleFileProcess(e.target.files[0]);
                }
              }}
              className="hidden"
            />
            <FileText className="w-8 h-8 text-[#7d8b9e] mx-auto mb-2" />
            <p className="font-semibold text-[#161a22]">
              {fileName || 'Drop CSV or JSON file here, or click to browse'}
            </p>
            <p className="text-[10px] text-[#7d8b9e] mt-1">
              Parsed locally in browser memory. Max 500 recipients.
            </p>
          </div>

          {/* Parse Results Preview */}
          {parsedRecipients.length > 0 && (
            <div className="p-3 rounded bg-[#f0fdf4] border border-[#bbf7d0] space-y-2">
              <div className="flex items-center gap-1.5 text-[#15803d] font-mono-telemetry font-bold">
                <CheckCircle2 className="w-4 h-4" />
                <span>Parsed {parsedRecipients.length} recipients successfully</span>
              </div>
              <div className="max-h-28 overflow-y-auto font-mono-telemetry text-[11px] text-[#556377] divide-y divide-[#dcfce7]">
                {parsedRecipients.slice(0, 5).map((r, i) => (
                  <div key={i} className="py-1 flex justify-between">
                    <span className="text-[#161a22] font-medium">{r.name}</span>
                    <span className="text-[#7d8b9e]">{r.email || '—'}</span>
                  </div>
                ))}
                {parsedRecipients.length > 5 && (
                  <div className="py-1 text-[#7d8b9e] italic">
                    ...and {parsedRecipients.length - 5} more
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Parse Warnings / Errors */}
          {parseErrors.length > 0 && (
            <div className="p-3 rounded bg-[#fffbeb] border border-[#fde68a] space-y-1 text-[#92400e] text-[11px] font-mono-telemetry max-h-24 overflow-y-auto">
              <div className="flex items-center gap-1 font-semibold text-[#b45309]">
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>Import Notices:</span>
              </div>
              {parseErrors.map((err, i) => (
                <p key={i}>• {err}</p>
              ))}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-5 py-3 border-t border-[#e2dac9] bg-[#fbf9f4] flex items-center justify-between">
          <Button variant="ghost" size="sm" onClick={onClose}>
            Cancel
          </Button>

          <div className="flex items-center gap-2">
            {currentCount > 0 && (
              <Button
                variant="secondary"
                size="sm"
                disabled={parsedRecipients.length === 0}
                onClick={() => handleApply('append')}
              >
                Append to Roster
              </Button>
            )}

            <Button
              variant="primary"
              size="sm"
              disabled={parsedRecipients.length === 0}
              onClick={() => handleApply('replace')}
            >
              Replace Roster ({parsedRecipients.length})
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
