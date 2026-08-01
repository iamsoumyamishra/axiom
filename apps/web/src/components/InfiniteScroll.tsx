'use client';

import { Children, useEffect, useRef, type ReactNode } from 'react';
import { Loader2 } from 'lucide-react';

interface InfiniteScrollProps {
  hasMore: boolean;
  loading: boolean;
  onLoadMore: () => void;
  children: ReactNode;
  className?: string;
  endMessage?: string;
}

export function InfiniteScroll({
  hasMore,
  loading,
  onLoadMore,
  children,
  className,
  endMessage = 'You have reached the end',
}: InfiniteScrollProps) {
  const sentinelRef = useRef<HTMLDivElement>(null);
  const onLoadMoreRef = useRef(onLoadMore);
  onLoadMoreRef.current = onLoadMore;
  const hasContent = Children.count(children) > 0;

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting && hasMore && !loading) {
            onLoadMoreRef.current();
          }
        }
      },
      { rootMargin: '200px' },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [hasMore, loading]);

  return (
    <div className={className}>
      {children}
      <div ref={sentinelRef} aria-hidden className="h-px" />
      {loading && hasContent && (
        <div className="flex justify-center py-6">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      )}
      {!loading && !hasMore && hasContent && endMessage && (
        <p className="text-center text-sm text-muted-foreground py-6">{endMessage}</p>
      )}
    </div>
  );
}
