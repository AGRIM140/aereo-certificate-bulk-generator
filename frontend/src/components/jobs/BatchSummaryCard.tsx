import React from 'react';
import { Send, CheckCircle2, AlertCircle, Info } from 'lucide-react';
import { Button } from '../ui/Button';

export interface BatchSummaryCardProps {
  eventName: string;
  orgName: string;
  issueDate: string;
  recipientCount: number;
  isValid: boolean;
  isSubmitting: boolean;
  onSubmit: () => void;
}

export const BatchSummaryCard: React.FC<BatchSummaryCardProps> = ({
  eventName,
  orgName,
  issueDate,
  recipientCount,
  isValid,
  isSubmitting,
  onSubmit,
}) => {
  return (
    <div className="border-2 border-black bg-white shadow-[3px_3px_0px_#000000] sticky top-20">
      {/* Header with Ribbon Title */}
      <div className="bg-white border-b-2 border-black px-4 py-2.5 flex items-center justify-between gap-2">
        <h3 className="font-ui font-bold uppercase text-xs text-black">
          BATCH CONFIGURATION SUMMARY
        </h3>
        <span
          className={`font-ui text-[10px] font-bold uppercase px-2 py-0.5 border border-black flex items-center gap-1 ${
            isValid && recipientCount > 0
              ? 'bg-[#c0d4a7] text-black'
              : 'bg-[#fcc20f] text-black'
          }`}
        >
          {isValid && recipientCount > 0 ? (
            <>
              <CheckCircle2 className="w-3 h-3 text-black" />
              <span>READY</span>
            </>
          ) : (
            <>
              <AlertCircle className="w-3 h-3 text-black" />
              <span>INCOMPLETE</span>
            </>
          )}
        </span>
      </div>

      <div className="p-4 space-y-3.5 text-xs font-serif text-black">
        {/* Event */}
        <div className="pb-2.5 border-b border-black">
          <div className="text-[10px] font-ui uppercase font-bold text-neutral-600">
            EVENT NAME
          </div>
          <div className="font-bold text-sm text-black truncate mt-0.5">
            {eventName.trim() || <span className="text-neutral-400 italic">Not specified</span>}
          </div>
        </div>

        {/* Organization */}
        <div className="pb-2.5 border-b border-black">
          <div className="text-[10px] font-ui uppercase font-bold text-neutral-600">
            ORGANIZATION
          </div>
          <div className="font-bold text-sm text-black truncate mt-0.5">
            {orgName.trim() || <span className="text-neutral-400 italic">Not specified</span>}
          </div>
        </div>

        {/* Issue Date */}
        <div className="pb-2.5 border-b border-black">
          <div className="text-[10px] font-ui uppercase font-bold text-neutral-600">
            ISSUE DATE
          </div>
          <div className="font-mono text-xs text-black font-bold mt-0.5">
            {issueDate || <span className="text-neutral-400">Defaults to today</span>}
          </div>
        </div>

        {/* Recipient Count Gauge */}
        <div className="space-y-1 pb-2.5 border-b border-black">
          <div className="flex justify-between items-center text-[10px] font-ui uppercase font-bold text-neutral-600">
            <span>TOTAL RECIPIENTS</span>
            <span className="text-black font-black">{recipientCount} / 500</span>
          </div>
          <div className="w-full bg-[#dfdfdf] h-3 border border-black overflow-hidden">
            <div
              className={`h-full transition-none ${
                recipientCount > 500 ? 'bg-[#e91d2a]' : 'bg-black'
              }`}
              style={{ width: `${Math.min(100, (recipientCount / 500) * 100)}%` }}
            />
          </div>
        </div>

        {/* Operational Note (Tint Sky) */}
        <div className="p-2.5 bg-[#9ab6c8] border border-black space-y-1">
          <div className="flex items-center gap-1.5 text-black font-ui text-[11px] font-bold uppercase">
            <Info className="w-3.5 h-3.5 text-black shrink-0" />
            <span>ATELIER DISPATCH NOTE</span>
          </div>
          <p className="text-[11px] font-serif text-black leading-relaxed">
            Upon submission, the batch is durably enqueued in PostgreSQL. Celery workers immediately begin ReportLab PDF rasterization with zero recipient leakage.
          </p>
        </div>
      </div>

      {/* Footer Dispatch Action in Dell Red Panel Style */}
      <div className="p-4 border-t-2 border-black bg-neutral-100 flex flex-col gap-2">
        <Button
          variant="danger"
          size="lg"
          disabled={isSubmitting}
          isLoading={isSubmitting}
          onClick={onSubmit}
          leftIcon={<Send className="w-4 h-4" />}
          className="w-full justify-center shadow-[2px_2px_0px_#000000]"
        >
          {isSubmitting ? 'Generating Batch…' : 'Generate Certificates'}
        </Button>

        <p className="text-[10px] font-serif text-center text-neutral-600">
          HTTP 202 Accepted • Instant Transition to Job Ledger
        </p>
      </div>
    </div>
  );
};
