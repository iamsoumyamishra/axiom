'use client';

import type { ReactNode } from 'react';
import type { SearchResult } from './types';

function getDomain(url: string | null) {
  if (!url) return null;
  try {
    return new URL(url).hostname.replace('www.', '');
  } catch {
    return null;
  }
}

function timeAgo(date: string) {
  const diff = Date.now() - new Date(date).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function escapeRegex(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function highlight(text: string, query: string): ReactNode[] {
  const terms = query
    .trim()
    .toLowerCase()
    .split(/\s+/)
    .filter((t) => t.length > 2);
  if (terms.length === 0) return [text];

  const pattern = terms.map(escapeRegex).join('|');
  const parts = text.split(new RegExp(`(${pattern})`, 'ig'));
  const matcher = new RegExp(pattern, 'i');
  return parts.map((part, i) =>
    matcher.test(part) ? (
      <mark key={i} className="bg-primary/20 rounded-sm px-0.5">
        {part}
      </mark>
    ) : (
      <span key={i}>{part}</span>
    ),
  );
}

const badge =
  'text-[10px] px-1.5 py-0.5 rounded border uppercase tracking-wider';

export function SearchResults({
  results,
  query,
  tookMs,
}: {
  results: SearchResult[];
  query: string;
  tookMs: number;
}) {
  if (results.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <p className="text-lg font-medium mb-1">No results found</p>
        <p className="text-sm">Try a different search term.</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <p className="text-sm text-muted-foreground mb-4">
        {results.length} result{results.length !== 1 ? 's' : ''} for &ldquo;{query}&rdquo;
        {tookMs !== undefined && ` (${tookMs}ms)`}
      </p>
      {results.map((r) => (
        <a
          key={r.id}
          href={`/resources/${r.id}`}
          className="block rounded-lg border p-4 hover:border-primary/50 hover:shadow-sm transition-all"
        >
          <div className="flex items-start gap-3">
            {r.url && (
              <img
                src={`https://www.google.com/s2/favicons?domain=${getDomain(r.url)}&sz=32`}
                alt=""
                className="w-5 h-5 mt-1 shrink-0 rounded"
              />
            )}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                {r.category && (
                  <span className={`${badge} text-primary bg-primary/10 border-primary/20`}>
                    {r.category}
                  </span>
                )}
                {r.status === 'PROCESSING' && (
                  <span className={`${badge} text-amber-700 bg-amber-50 border-amber-200`}>
                    Processing
                  </span>
                )}
                {r.distance !== null ? (
                  <span
                    className={`${badge} text-primary bg-primary/10 border-primary/20`}
                    title="Vector similarity"
                  >
                    {((1 - r.distance) * 100).toFixed(0)}% match
                  </span>
                ) : (
                  <span className={`${badge} text-muted-foreground bg-secondary border-border`}>
                    Keyword match
                  </span>
                )}
              </div>
              <h3 className="font-medium mt-1">
                {highlight(r.title ?? 'Untitled', query)}
              </h3>
              <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                {getDomain(r.url) && <span className="truncate">{getDomain(r.url)}</span>}
                <span>{timeAgo(r.savedAt)}</span>
                {r.importance != null && <span>Importance {r.importance}/10</span>}
              </div>
              {r.summary && (
                <p className="text-sm text-muted-foreground mt-2 line-clamp-3">
                  {highlight(r.summary, query)}
                </p>
              )}
              {r.tags.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {r.tags.slice(0, 4).map((t) => (
                    <span
                      key={t}
                      className="text-[10px] px-1.5 py-0.5 rounded bg-secondary text-secondary-foreground"
                    >
                      {t}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        </a>
      ))}
    </div>
  );
}
