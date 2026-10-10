import React from 'react';
import { Plus, Trash2, Users } from 'lucide-react';
import { Button } from '../ui/Button';

export interface EditableRecipient {
  id: string;
  name: string;
  email: string;
}

export interface RecipientRowEditorProps {
  recipients: EditableRecipient[];
  onAddRecipient: () => void;
  onUpdateRecipient: (id: string, field: 'name' | 'email', value: string) => void;
  onRemoveRecipient: (id: string) => void;
  onClearAll: () => void;
  disabled?: boolean;
  errors?: Record<string, string>;
}

export const RecipientRowEditor: React.FC<RecipientRowEditorProps> = ({
  recipients,
  onAddRecipient,
  onUpdateRecipient,
  onRemoveRecipient,
  onClearAll,
  disabled = false,
  errors = {},
}) => {
  const count = recipients.length;
  const isMaxReached = count >= 500;

  return (
    <div className="space-y-3">
      {/* Recipient Header Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 py-2 px-3 rounded bg-[#ffffff] border border-[#e2dac9] shadow-sm">
        <div className="flex items-center gap-2">
          <Users className="w-4 h-4 text-[#15803d]" />
          <span className="font-mono-telemetry text-xs font-bold uppercase tracking-wider text-[#161a22]">
            RECIPIENT ROSTER
          </span>
          <span
            className={`font-mono-telemetry text-xs px-2 py-0.5 rounded border ${
              isMaxReached
                ? 'bg-[#fef2f2] border-[#fecaca] text-[#b83a34] font-semibold'
                : 'bg-[#f5efe4] border-[#dcd3c1] text-[#334155]'
            }`}
          >
            {count} / 500 RECIPIENTS
          </span>
        </div>

        <div className="flex items-center gap-2">
          {count > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onClearAll}
              disabled={disabled}
              className="text-[11px] text-[#647287] hover:text-[#b83a34]"
            >
              Clear All
            </Button>
          )}

          <Button
            variant="secondary"
            size="sm"
            onClick={onAddRecipient}
            disabled={disabled || isMaxReached}
            leftIcon={<Plus className="w-3.5 h-3.5" />}
          >
            Add Recipient
          </Button>
        </div>
      </div>

      {/* Recipient Table: Data Preparation Ledger */}
      <div className="border border-[#e2dac9] rounded-md overflow-hidden bg-[#ffffff] shadow-sm">
        <div className="max-h-[480px] overflow-y-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead className="sticky top-0 bg-[#fbf9f4] border-b border-[#e2dac9] z-10 select-none">
              <tr className="font-mono-telemetry uppercase text-[11px] text-[#556377]">
                <th scope="col" className="py-2.5 px-3 w-14 text-center">
                  #
                </th>
                <th scope="col" className="py-2.5 px-3">
                  Recipient Name <span className="text-[#b83a34]">*</span>
                </th>
                <th scope="col" className="py-2.5 px-3">
                  Email Address <span className="text-[#7d8b9e] font-normal">(Optional)</span>
                </th>
                <th scope="col" className="py-2.5 px-3 w-16 text-right">
                  Action
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#ece5d6]">
              {recipients.map((r, index) => {
                const rowNum = String(index + 1).padStart(2, '0');
                const nameError = errors[`recipient-${r.id}-name`];
                const emailError = errors[`recipient-${r.id}-email`];

                return (
                  <tr
                    key={r.id}
                    className="hover:bg-[#fbf7ee] transition-colors focus-within:bg-[#f8f4ea]"
                  >
                    {/* Row Index */}
                    <td className="py-2 px-3 text-center font-mono-telemetry text-[#7d8b9e] text-[11px] font-medium">
                      {rowNum}
                    </td>

                    {/* Recipient Name */}
                    <td className="py-2 px-3">
                      <input
                        type="text"
                        value={r.name}
                        onChange={(e) => onUpdateRecipient(r.id, 'name', e.target.value)}
                        placeholder="e.g. Ada Lovelace"
                        disabled={disabled}
                        maxLength={100}
                        aria-label={`Recipient ${rowNum} Name`}
                        className={`w-full bg-[#ffffff] border rounded px-2.5 py-1.5 text-xs text-[#161a22] placeholder:text-[#9aa5b6] focus:outline-none focus:ring-1 transition-colors ${
                          nameError
                            ? 'border-[#b83a34] focus:border-[#b83a34] focus:ring-[#b83a34]/30'
                            : 'border-[#dcd3c1] focus:border-[#1f304d] focus:ring-[#1f304d]/30 hover:border-[#b8a892]'
                        }`}
                      />
                      {nameError && (
                        <p className="text-[10px] text-[#b83a34] font-mono-telemetry mt-0.5 font-medium">
                          {nameError}
                        </p>
                      )}
                    </td>

                    {/* Recipient Email */}
                    <td className="py-2 px-3">
                      <input
                        type="email"
                        value={r.email}
                        onChange={(e) => onUpdateRecipient(r.id, 'email', e.target.value)}
                        placeholder="e.g. ada@example.com"
                        disabled={disabled}
                        maxLength={254}
                        aria-label={`Recipient ${rowNum} Email`}
                        className={`w-full bg-[#ffffff] border rounded px-2.5 py-1.5 text-xs text-[#161a22] placeholder:text-[#9aa5b6] focus:outline-none focus:ring-1 transition-colors ${
                          emailError
                            ? 'border-[#b83a34] focus:border-[#b83a34] focus:ring-[#b83a34]/30'
                            : 'border-[#dcd3c1] focus:border-[#1f304d] focus:ring-[#1f304d]/30 hover:border-[#b8a892]'
                        }`}
                      />
                      {emailError && (
                        <p className="text-[10px] text-[#b83a34] font-mono-telemetry mt-0.5 font-medium">
                          {emailError}
                        </p>
                      )}
                    </td>

                    {/* Remove Action */}
                    <td className="py-2 px-3 text-right">
                      <button
                        type="button"
                        onClick={() => onRemoveRecipient(r.id)}
                        disabled={disabled || count <= 1}
                        title={count <= 1 ? 'Batch must contain at least 1 recipient' : 'Remove recipient'}
                        aria-label={`Remove recipient ${rowNum}`}
                        className="p-1 rounded text-[#7d8b9e] hover:text-[#b83a34] hover:bg-[#fef2f2] transition-colors disabled:opacity-30 disabled:hover:text-[#7d8b9e] disabled:hover:bg-transparent"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {isMaxReached && (
        <p className="text-[11px] text-[#b45309] font-mono-telemetry font-medium">
          ⚠ Maximum limit of 500 recipients per batch reached. Split larger cohorts into multiple batches.
        </p>
      )}
    </div>
  );
};
