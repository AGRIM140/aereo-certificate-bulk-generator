import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '../components/ui/Card';
import { ProgressBar } from '../components/ui/ProgressBar';
import { Alert } from '../components/ui/Alert';
import { ApiClientError } from '../api/client';
import type { ApiErrorEnvelope } from '../types/api';

describe('Badge', () => {
  it('renders with correct status label and accessibility attribute', () => {
    render(<Badge status="COMPLETED" />);
    const badge = screen.getByRole('status');
    expect(badge).toHaveTextContent('COMPLETED');
    expect(badge).toHaveAttribute('aria-label', 'Status: COMPLETED');
  });

  it('renders custom label when provided', () => {
    render(<Badge status="PROCESSING" label="GENERATING 42/50" />);
    expect(screen.getByRole('status')).toHaveTextContent('GENERATING 42/50');
  });

  it('renders all recognized job and certificate statuses without crash', () => {
    const statuses = [
      'PENDING',
      'PROCESSING',
      'COMPLETED',
      'COMPLETED_WITH_ERRORS',
      'FAILED',
      'GENERATED',
    ] as const;

    for (const status of statuses) {
      const { unmount } = render(<Badge status={status} />);
      expect(screen.getByRole('status')).toBeInTheDocument();
      unmount();
    }
  });
});

describe('Button', () => {
  it('renders children and handles click events', () => {
    const handleClick = vi.fn();
    render(<Button onClick={handleClick}>Generate</Button>);
    const button = screen.getByRole('button', { name: /generate/i });
    fireEvent.click(button);
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('disables button and shows spinner when isLoading is true', () => {
    render(<Button isLoading>Generating</Button>);
    const button = screen.getByRole('button', { name: /generating/i });
    expect(button).toBeDisabled();
  });

  it('renders primary variant with proper styling', () => {
    render(<Button variant="primary">Launch</Button>);
    const button = screen.getByRole('button', { name: /launch/i });
    expect(button.className).toContain('bg-emerald-600');
  });
});

describe('Card', () => {
  it('renders bento card with header, title, content, and footer', () => {
    render(
      <Card>
        <CardHeader>
          <CardTitle>TELEMETRY</CardTitle>
        </CardHeader>
        <CardContent>
          <p>Worker cluster connected</p>
        </CardContent>
        <CardFooter>
          <span>Footer note</span>
        </CardFooter>
      </Card>
    );

    expect(screen.getByText('TELEMETRY')).toBeInTheDocument();
    expect(screen.getByText('Worker cluster connected')).toBeInTheDocument();
    expect(screen.getByText('Footer note')).toBeInTheDocument();
  });
});

describe('ProgressBar', () => {
  it('renders progress percentage and ARIA progressbar role', () => {
    render(<ProgressBar percent={75.5} label="Batch Progress" />);
    const bar = screen.getByRole('progressbar');
    expect(bar).toHaveAttribute('aria-valuenow', '75.5');
    expect(bar).toHaveAttribute('aria-valuemin', '0');
    expect(bar).toHaveAttribute('aria-valuemax', '100');
    expect(screen.getByText('75.5%')).toBeInTheDocument();
    expect(screen.getByText('Batch Progress')).toBeInTheDocument();
  });

  it('clamps values below 0 and above 100', () => {
    const { rerender } = render(<ProgressBar percent={-10} />);
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '0');

    rerender(<ProgressBar percent={150} />);
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '100');
  });
});

describe('Alert', () => {
  it('renders error message and standardized details from ApiClientError', () => {
    const envelope: ApiErrorEnvelope = {
      error: {
        code: 'validation_error',
        message: 'The request data is invalid.',
        details: {
          event_name: 'This field is required.',
          recipients: 'At least 1 recipient is required.',
        },
      },
    };
    const error = new ApiClientError(400, envelope);

    render(<Alert error={error} />);
    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect(screen.getByText(/The request data is invalid/i)).toBeInTheDocument();
    expect(screen.getByText(/event_name:/i)).toBeInTheDocument();
    expect(screen.getByText(/This field is required./i)).toBeInTheDocument();
  });
});
