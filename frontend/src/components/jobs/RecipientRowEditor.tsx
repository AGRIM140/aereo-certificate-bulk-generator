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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 py-2 px-3 bg-white border border-black shadow-[2px_2px_0px_#000000]">
        <div className="flex items-center gap-2">
          <Users className="w-4 h-4 text-black" />
          <span className="font-ui text-xs font-bold uppercase tracking-wider text-black">
            RECIPIENT ROSTER
          </span>
          <span
            className={`font-ui text-[11px] font-bold px-2 py-0.5 border border-black ${
              isMaxReached
                ? 'bg-[#d77a7a] text-black'
                : 'bg-[#a5b8c0] text-black'
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
              className="text-xs text-neutral-700 hover:text-[#e91d2a]"
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
      <div className="border border-black bg-white shadow-[2px_2px_0px_#000000]">
        <div className="max-h-[480px] overflow-y-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead className="sticky top-0 bg-[#a5b8c0] border-b border-black z-10 select-none">
              <tr className="font-ui uppercase font-bold text-xs text-black">
                <th scope="col" className="py-2 px-2.5 w-12 text-center border-r border-black">
                  #
                </th>
                <th scope="col" className="py-2 px-3 border-r border-black">
                  Recipient Name <span className="text-[#e91d2a]">*</span>
                </th>
                <th scope="col" className="py-2 px-3 border-r border-black">
                  Email Address <span className="text-neutral-700 font-normal font-serif">(Optional)</span>
                </th>
                <th scope="col" className="py-2 px-3 w-16 text-right">
                  Action
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black bg-white">
              {recipients.map((r, index) => {
                const rowNum = String(index + 1).padStart(2, '0');
                const nameErr = errors[`recipient-${r.id}-name`];
                const emailErr = errors[`recipient-${r.id}-email`];

                return (
                  <tr
                    key={r.id}
                    className="hover:bg-[#b3bd95]/20 transition-none"
                  >
                    {/* Index */}
                    <td className="py-2 px-2.5 text-center font-mono text-[11px] font-bold text-neutral-800 border-r border-black bg-neutral-50">
                      {rowNum}
                    </td>

                    {/* Name Input */}
                    <td className="py-1.5 px-3 border-r border-black">
                      <input
                        type="text"
                        value={r.name}
                        disabled={disabled}
                        placeholder="e.g. Jane Doe"
                        onChange={(e) => onUpdateRecipient(r.id, 'name', e.target.value)}
                        className={`w-full bg-white border border-black rounded-none px-2.5 py-1 text-black font-serif text-sm focus:outline-none focus:ring-1 focus:ring-black placeholder:text-neutral-400 ${
                          nameErr ? 'border-[#e91d2a] bg-[#d77a7a]/20' : ''
                        }`}
                        aria-label={`Recipient ${rowNum} Name`}
                      />
                      {nameErr && (
                        <p className="text-[10px] text-[#e91d2a] font-ui font-bold mt-0.5">
                          {nameErr}
                        </p>
                      )}
                    </td>

                    {/* Email Input */}
                    <td className="py-1.5 px-3 border-r border-black">
                      <input
                        type="email"
                        value={r.email}
                        disabled={disabled}
                        placeholder="jane.doe@example.com"
                        onChange={(e) => onUpdateRecipient(r.id, 'email', e.target.value)}
                        className={`w-full bg-white border border-black rounded-none px-2.5 py-1 text-black font-serif text-sm focus:outline-none focus:ring-1 focus:ring-black placeholder:text-neutral-400 ${
                          emailErr ? 'border-[#e91d2a] bg-[#d77a7a]/20' : ''
                        }`}
                        aria-label={`Recipient ${rowNum} Email`}
                      />
                      {emailErr && (
                        <p className="text-[10px] text-[#e91d2a] font-ui font-bold mt-0.5">
                          {emailErr}
                        </p>
                      )}
                    </td>

                    {/* Delete Action */}
                    <td className="py-1.5 px-3 text-right">
                      <button
                        type="button"
                        onClick={() => onRemoveRecipient(r.id)}
                        disabled={disabled || recipients.length <= 1}
                        className="p-1 text-neutral-600 hover:text-white hover:bg-[#e91d2a] border border-black transition-none disabled:opacity-30 disabled:pointer-events-none"
                        title="Delete Recipient"
                        aria-label={`Remove recipient ${rowNum}`}
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
    </div>
  );
};
