'use client';

interface PaginationProps {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export function Pagination({ page, totalPages, onPageChange }: PaginationProps) {
  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-center gap-2 pt-4">
      <button
        onClick={() => onPageChange(page - 1)}
        disabled={page <= 1}
        className="px-3 py-1.5 text-sm border border-input rounded-md disabled:opacity-40 hover:bg-secondary transition-colors"
      >
        Previous
      </button>
      {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
        const start = Math.max(1, page - 3);
        const p = start + i;
        if (p > totalPages) return null;
        return (
          <button
            key={p}
            onClick={() => onPageChange(p)}
            className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
              p === page
                ? 'bg-primary text-primary-foreground'
                : 'border border-input hover:bg-secondary'
            }`}
          >
            {p}
          </button>
        );
      })}
      <button
        onClick={() => onPageChange(page + 1)}
        disabled={page >= totalPages}
        className="px-3 py-1.5 text-sm border border-input rounded-md disabled:opacity-40 hover:bg-secondary transition-colors"
      >
        Next
      </button>
    </div>
  );
}
