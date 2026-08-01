'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  BookMarked,
  FolderKanban,
  Layers,
  CheckCircle2,
  Loader2,
  Tag,
  BookOpen,
} from 'lucide-react';
import { apiGet } from '../../lib/api';
import { SearchBar } from '../search/SearchBar';
import type { DashboardData, DashboardStats } from './types';

const statCards: {
  key: keyof Pick<
    DashboardStats,
    'totalResources' | 'totalProjects' | 'totalCollections' | 'completed'
  >;
  label: string;
  icon: typeof BookMarked;
  accent: string;
}[] = [
  { key: 'totalResources', label: 'Resources', icon: BookMarked, accent: 'text-primary' },
  { key: 'totalProjects', label: 'Projects', icon: FolderKanban, accent: 'text-emerald-600' },
  { key: 'totalCollections', label: 'Collections', icon: Layers, accent: 'text-violet-600' },
  { key: 'completed', label: 'Completed', icon: CheckCircle2, accent: 'text-amber-600' },
];

function timeAgo(date: string) {
  const diff = Date.now() - new Date(date).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  return `${months}mo ago`;
}

function getDomain(url: string | null) {
  if (!url) return null;
  try {
    return new URL(url).hostname.replace('www.', '');
  } catch {
    return null;
  }
}

export function Dashboard() {
  const router = useRouter();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchDashboard = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await apiGet<DashboardData>('dashboard');
      if (res.success && res.data) {
        setData(res.data);
      } else {
        setError(res.error?.message ?? 'Failed to load dashboard');
      }
    } catch {
      setError('Network error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  const handleSearch = (query: string) => {
    router.push(`/search?q=${encodeURIComponent(query)}`);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between">
        <div>
          <h2 className="text-2xl font-semibold">Dashboard</h2>
          <p className="text-sm text-muted-foreground">Your knowledge, at a glance.</p>
        </div>
      </div>

      <SearchBar onSearch={handleSearch} autoFocus={false} />

      {loading && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-24 rounded-lg border bg-secondary/50 animate-pulse" />
            ))}
          </div>
          <div className="h-40 rounded-lg border bg-secondary/50 animate-pulse" />
        </div>
      )}

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {!loading && data && (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {statCards.map((card) => (
              <div key={card.key} className="rounded-lg border p-4">
                <div className="flex items-center gap-2 mb-1">
                  <card.icon className={`h-4 w-4 ${card.accent}`} />
                  <span className="text-xs text-muted-foreground uppercase tracking-wide">
                    {card.label}
                  </span>
                </div>
                <p className="text-2xl font-bold">{data.stats[card.key]}</p>
              </div>
            ))}
          </div>

          {data.stats.processing > 0 && (
            <div className="flex items-center gap-2 text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-4 py-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              {data.stats.processing} resource{data.stats.processing === 1 ? ' is' : 's are'} still
              being analyzed
            </div>
          )}

          <div className="grid lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-2">
              <h3 className="text-sm font-medium text-muted-foreground mb-1">Recent saves</h3>
              {data.recent.length === 0 && (
                <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
                  Nothing saved yet. Click <span className="font-medium">Save resource</span> in the
                  sidebar to add your first.
                </div>
              )}
              {data.recent.map((r) => (
                <a
                  key={r.id}
                  href={`/resources/${r.id}`}
                  className="flex items-center gap-3 rounded-lg border px-4 py-3 hover:border-primary/50 hover:shadow-sm transition-all"
                >
                  {r.url && (
                    <img
                      src={`https://www.google.com/s2/favicons?domain=${getDomain(r.url)}&sz=32`}
                      alt=""
                      className="w-5 h-5 shrink-0 rounded"
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{r.title ?? 'Untitled'}</p>
                    <p className="text-xs text-muted-foreground truncate">
                      {getDomain(r.url) ?? 'No domain'} · {timeAgo(r.savedAt)}
                      {r.aiAnalysis?.category ? ` · ${r.aiAnalysis.category}` : ''}
                    </p>
                  </div>
                  {r.aiAnalysis?.importance != null && (
                    <span className="shrink-0 text-xs px-1.5 py-0.5 rounded bg-primary/10 text-primary font-medium">
                      {r.aiAnalysis.importance}/10
                    </span>
                  )}
                </a>
              ))}
            </div>

            <div className="space-y-6">
              <div>
                <h3 className="flex items-center gap-2 text-sm font-medium text-muted-foreground mb-2">
                  <BookOpen className="h-4 w-4" /> Top categories
                </h3>
                {data.topCategories.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No categories yet.</p>
                ) : (
                  <div className="flex flex-wrap gap-1.5">
                    {data.topCategories.map((c) => (
                      <span
                        key={c.category}
                        className="text-xs px-2 py-1 bg-primary/10 text-primary rounded"
                        title={`${c.count} resource${c.count === 1 ? '' : 's'}`}
                      >
                        {c.category} · {c.count}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <h3 className="flex items-center gap-2 text-sm font-medium text-muted-foreground mb-2">
                  <Tag className="h-4 w-4" /> Top tags
                </h3>
                {data.topTags.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No tags yet.</p>
                ) : (
                  <div className="flex flex-wrap gap-1.5">
                    {data.topTags.map((t) => (
                      <span
                        key={t.tag}
                        className="text-xs px-2 py-1 bg-secondary text-secondary-foreground rounded"
                        title={`${t.count} resource${t.count === 1 ? '' : 's'}`}
                      >
                        {t.tag} · {t.count}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
