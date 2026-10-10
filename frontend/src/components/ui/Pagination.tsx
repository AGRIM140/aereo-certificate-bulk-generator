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
      className="flex flex-col sm:flex-row items-center justify-between gap-4 py-2.5 px-4 border-t border-black bg-[#a5b8c0]/20 text-xs font-serif select-none"
    >
      <div className="text-black">
        Showing <strong className="font-ui font-bold text-black">{startItem}</strong> to{' '}
        <strong className="font-ui font-bold text-black">{endItem}</strong> of{' '}
        <strong className="font-ui font-bold text-black">{totalCount}</strong> {itemNoun}
      </div>

      <div className="flex items-center gap-2">
        <span className="text-black font-ui uppercase font-bold text-[11px] mr-2">
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
