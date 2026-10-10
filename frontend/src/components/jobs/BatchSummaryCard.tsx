import React from 'react';
import { Send, CheckCircle2, AlertCircle, Info, Sparkles } from 'lucide-react';
import { Button } from '../ui/Button';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '../ui/Card';

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
    <Card variant="elevated" className="sticky top-20 shadow-md">
      <CardHeader>
        <CardTitle>BATCH TELEMETRY SUMMARY</CardTitle>
        <span
          className={`inline-flex items-center gap-1 font-mono-telemetry text-[10px] font-semibold uppercase px-2 py-0.5 rounded border ${
            isValid && recipientCount > 0
              ? 'bg-[#f0fdf4] border-[#bbf7d0] text-[#15803d]'
              : 'bg-[#fffbeb] border-[#fde68a] text-[#92400e]'
          }`}
        >
          {isValid && recipientCount > 0 ? (
            <>
              <CheckCircle2 className="w-3 h-3" />
              <span>READY TO DISPATCH</span>
            </>
          ) : (
            <>
              <AlertCircle className="w-3 h-3" />
              <span>INCOMPLETE INPUT</span>
            </>
          )}
        </span>
      </CardHeader>

      <CardContent className="space-y-4 text-xs">
        {/* Event */}
        <div className="space-y-1 pb-3 border-b border-[#ece5d6]">
          <div className="text-[10px] font-mono-telemetry uppercase text-[#7d8b9e] font-semibold">
            EVENT NAME
          </div>
          <div className="font-semibold text-[#161a22] truncate">
            {eventName.trim() || <span className="text-[#9ea8b6] italic">Not specified</span>}
          </div>
        </div>

        {/* Organization */}
        <div className="space-y-1 pb-3 border-b border-[#ece5d6]">
          <div className="text-[10px] font-mono-telemetry uppercase text-[#7d8b9e] font-semibold">
            ORGANIZATION
          </div>
          <div className="font-semibold text-[#161a22] truncate">
            {orgName.trim() || <span className="text-[#9ea8b6] italic">Not specified</span>}
          </div>
        </div>

        {/* Issue Date */}
        <div className="space-y-1 pb-3 border-b border-[#ece5d6]">
          <div className="text-[10px] font-mono-telemetry uppercase text-[#7d8b9e] font-semibold">
            ISSUE DATE
          </div>
          <div className="font-mono-telemetry text-[#2d3748] font-medium">
            {issueDate || <span className="text-[#9ea8b6]">Defaults to today</span>}
          </div>
        </div>

        {/* Recipient Count Gauge */}
        <div className="space-y-1.5 pb-3 border-b border-[#ece5d6]">
          <div className="flex justify-between items-center text-[10px] font-mono-telemetry uppercase text-[#7d8b9e] font-semibold">
            <span>TOTAL RECIPIENTS</span>
            <span className="text-[#161a22] font-bold">{recipientCount} / 500</span>
          </div>
          <div className="w-full bg-[#ede5d4] rounded-full h-2 overflow-hidden border border-[#dcd3c1]">
            <div
              className={`h-full transition-all duration-300 rounded-full ${
                recipientCount > 500 ? 'bg-[#b83a34]' : 'bg-[#15803d]'
              }`}
              style={{ width: `${Math.min(100, (recipientCount / 500) * 100)}%` }}
            />
          </div>
        </div>

        {/* Operational Note */}
        <div className="p-3 rounded bg-[#f9f5ec] border border-[#e2dac9] space-y-1.5">
          <div className="flex items-center gap-1.5 text-[#1f304d] font-mono-telemetry text-[11px] font-semibold">
            <Info className="w-3.5 h-3.5 text-[#1f304d] shrink-0" />
            <span>DISPATCH PIPELINE</span>
          </div>
          <p className="text-[11px] text-[#556377] leading-relaxed">
            Dispatching stores batch records in PostgreSQL and enqueues Celery background tasks. You will be redirected immediately to the live job progress monitor.
          </p>
        </div>
      </CardContent>

      <CardFooter className="flex flex-col gap-2">
        <Button
          variant="primary"
          size="lg"
          onClick={onSubmit}
          isLoading={isSubmitting}
          disabled={isSubmitting}
          leftIcon={<Sparkles className="w-4 h-4" />}
          rightIcon={<Send className="w-4 h-4" />}
          className="w-full font-semibold shadow-sm"
        >
          {isSubmitting ? 'Generating Batch…' : 'Generate Certificates'}
        </Button>

        <p className="text-[10px] text-center font-mono-telemetry text-[#7d8b9e]">
          HTTP 202 ACCEPTED → ASYNCHRONOUS WORKER QUEUE
        </p>
      </CardFooter>
    </Card>
  );
};
