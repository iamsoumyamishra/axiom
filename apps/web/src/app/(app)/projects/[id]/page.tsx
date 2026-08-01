'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, FolderKanban, Plus } from 'lucide-react';
import { apiGet, apiDelete } from '../../../../lib/api';
import { LinkResourcesDialog } from '../../../../features/resources/LinkResourcesDialog';
import { Button } from '../../../../components/ui/button';
import type { ProjectDetail } from '../../../../features/projects/types';

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

export default function ProjectDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [project, setProject] = useState<ProjectDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [addOpen, setAddOpen] = useState(false);

  const fetchProject = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await apiGet<ProjectDetail>(`projects/${params.id}`);
      if (res.success && res.data) {
        setProject(res.data);
      } else {
        setError(res.error?.message ?? 'Project not found');
      }
    } catch {
      setError('Failed to load project');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProject();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.id]);

  const handleRemove = async (resourceId: string) => {
    const res = await apiDelete(`projects/${params.id}/resources/${resourceId}`);
    if (res.success) {
      setProject((p) =>
        p
          ? {
              ...p,
              resources: p.resources.filter((r) => r.id !== resourceId),
              _count: { resources: Math.max(0, p._count.resources - 1) },
            }
          : p,
      );
    }
  };

  const handleDelete = async () => {
    if (!confirm(`Delete project "${project?.name}"? Its resources will be kept.`)) return;
    const res = await apiDelete(`projects/${params.id}`);
    if (res.success) router.push('/projects');
  };

  if (loading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-6 bg-secondary rounded w-1/3" />
        <div className="h-8 bg-secondary rounded w-2/3" />
        <div className="h-32 bg-secondary rounded" />
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="text-center py-12">
        <p className="text-lg text-destructive">{error ?? 'Project not found'}</p>
        <button onClick={() => router.push('/projects')} className="text-sm text-primary underline mt-2">
          Back to projects
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <button
        onClick={() => router.push('/projects')}
        className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> Projects
      </button>

      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3 min-w-0">
          <div
            className="h-10 w-10 rounded-md flex items-center justify-center text-white shrink-0"
            style={{ backgroundColor: project.color ?? '#64748b' }}
          >
            <FolderKanban className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <h1 className="text-2xl font-bold truncate">{project.name}</h1>
            {project.description && (
              <p className="text-sm text-muted-foreground mt-1">{project.description}</p>
            )}
            <p className="text-xs text-muted-foreground mt-1">
              {project._count.resources} resource{project._count.resources === 1 ? '' : 's'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Button onClick={() => setAddOpen(true)}>
            <Plus className="h-4 w-4" /> Add resources
          </Button>
          <Button variant="outline" onClick={handleDelete} className="text-destructive">
            Delete
          </Button>
        </div>
      </div>

      {project.resources.length === 0 ? (
        <div className="rounded-lg border border-dashed p-10 text-center text-sm text-muted-foreground">
          No resources in this project yet.
        </div>
      ) : (
        <div className="space-y-2">
          {project.resources.map((r) => (
            <div key={r.id} className="flex items-center gap-3 rounded-lg border px-4 py-3">
              {r.url && (
                <img
                  src={`https://www.google.com/s2/favicons?domain=${getDomain(r.url)}&sz=32`}
                  alt=""
                  className="w-5 h-5 shrink-0 rounded"
                />
              )}
              <a href={`/resources/${r.id}`} className="flex-1 min-w-0">
                <p className="font-medium truncate hover:underline">{r.title ?? 'Untitled'}</p>
                <p className="text-xs text-muted-foreground truncate">
                  {getDomain(r.url) ?? 'No domain'} · {timeAgo(r.savedAt)}
                </p>
              </a>
              <button
                onClick={() => handleRemove(r.id)}
                className="shrink-0 text-xs text-muted-foreground hover:text-destructive"
              >
                Remove
              </button>
            </div>
          ))}
        </div>
      )}

      <LinkResourcesDialog
        open={addOpen}
        onOpenChange={setAddOpen}
        linkPath={`projects/${project.id}`}
        onAdded={fetchProject}
      />
    </div>
  );
}
