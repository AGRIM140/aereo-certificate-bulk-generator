import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from './Button';

export interface PaginationProps {
  currentPage: number;
  totalCount: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  isLoading?: boolean;
  itemNoun?: string;
}

export const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalCount,
  pageSize,
  onPageChange,
  isLoading = false,
  itemNoun = 'items',
}) => {
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
  const hasPrevious = currentPage > 1;
  const hasNext = currentPage < totalPages;

  if (totalCount === 0) return null;

  const startItem = (currentPage - 1) * pageSize + 1;
  const endItem = Math.min(currentPage * pageSize, totalCount);

  return (
    <div
      role="navigation"
      aria-label="Pagination Navigation"
      className="flex flex-col sm:flex-row items-center justify-between gap-4 py-3 px-4 border-t border-[#e2dac9] bg-[#fbf9f4] text-xs font-mono-telemetry select-none"
    >
      <div className="text-[#566375]">
        Showing <span className="font-semibold text-[#161a22]">{startItem}</span> to{' '}
        <span className="font-semibold text-[#161a22]">{endItem}</span> of{' '}
        <span className="font-semibold text-[#161a22]">{totalCount}</span> {itemNoun}
      </div>

      <div className="flex items-center gap-2">
        <span className="text-[#647287] mr-2">
          Page {currentPage} of {totalPages}
        </span>

        <Button
          variant="secondary"
          size="sm"
          disabled={!hasPrevious || isLoading}
          onClick={() => onPageChange(currentPage - 1)}
          leftIcon={<ChevronLeft className="w-3.5 h-3.5" />}
          aria-label="Previous page"
        >
          Previous
        </Button>

        <Button
          variant="secondary"
          size="sm"
          disabled={!hasNext || isLoading}
          onClick={() => onPageChange(currentPage + 1)}
          rightIcon={<ChevronRight className="w-3.5 h-3.5" />}
          aria-label="Next page"
        >
          Next
        </Button>
      </div>
    </div>
  );
};
