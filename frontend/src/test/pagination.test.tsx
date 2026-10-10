import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { Pagination } from '../components/ui/Pagination';

describe('Pagination', () => {
  it('renders nothing when totalCount is 0', () => {
    const { container } = render(
      <Pagination
        currentPage={1}
        totalCount={0}
        pageSize={50}
        onPageChange={vi.fn()}
      />
    );
    expect(container).toBeEmptyDOMElement();
  });

  it('renders correct page information and bounds', () => {
    render(
      <Pagination
        currentPage={2}
        totalCount={125}
        pageSize={50}
        onPageChange={vi.fn()}
      />
    );

    expect(screen.getByText('51')).toBeInTheDocument();
    expect(screen.getByText('100')).toBeInTheDocument();
    expect(screen.getByText('125')).toBeInTheDocument();
    expect(screen.getByText(/Page 2 of 3/i)).toBeInTheDocument();
  });

  it('disables previous button on first page and enables next', () => {
    const onPageChange = vi.fn();
    render(
      <Pagination
        currentPage={1}
        totalCount={100}
        pageSize={50}
        onPageChange={onPageChange}
      />
    );

    const prevBtn = screen.getByRole('button', { name: /previous/i });
    const nextBtn = screen.getByRole('button', { name: /next/i });

    expect(prevBtn).toBeDisabled();
    expect(nextBtn).not.toBeDisabled();

    fireEvent.click(nextBtn);
    expect(onPageChange).toHaveBeenCalledWith(2);
  });

  it('disables next button on last page and enables previous', () => {
    const onPageChange = vi.fn();
    render(
      <Pagination
        currentPage={3}
        totalCount={120}
        pageSize={50}
        onPageChange={onPageChange}
      />
    );

    const prevBtn = screen.getByRole('button', { name: /previous/i });
    const nextBtn = screen.getByRole('button', { name: /next/i });

    expect(prevBtn).not.toBeDisabled();
    expect(nextBtn).toBeDisabled();

    fireEvent.click(prevBtn);
    expect(onPageChange).toHaveBeenCalledWith(2);
  });
});
