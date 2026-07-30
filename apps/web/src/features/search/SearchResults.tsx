'use client';

interface SearchResult {
  id: string;
  title: string | null;
  url: string | null;
  savedAt: string;
  distance: number | null;
}

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
              <h3 className="font-medium truncate">{r.title ?? 'Untitled'}</h3>
              <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                {getDomain(r.url) && <span className="truncate">{getDomain(r.url)}</span>}
                <span>{timeAgo(r.savedAt)}</span>
                {r.distance !== null && (
                  <span className="text-[11px] px-1.5 py-0.5 rounded bg-primary/10 text-primary">
                    {((1 - r.distance) * 100).toFixed(0)}% match
                  </span>
                )}
              </div>
            </div>
          </div>
        </a>
      ))}
    </div>
  );
}
