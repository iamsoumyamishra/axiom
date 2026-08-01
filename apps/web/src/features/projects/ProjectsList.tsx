'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, FolderKanban } from 'lucide-react';
import { apiGet, apiDelete } from '../../lib/api';
import { ProjectCard } from './ProjectCard';
import { ProjectFormDialog } from './ProjectFormDialog';
import { Button } from '../../components/ui/button';
import type { Project } from './types';

export function ProjectsList() {
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Project | null>(null);

  const fetchProjects = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await apiGet<Project[]>('projects');
      if (res.success && res.data) {
        setProjects(res.data);
      } else {
        setError(res.error?.message ?? 'Failed to load projects');
      }
    } catch {
      setError('Network error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  const handleDelete = async (project: Project) => {
    if (!confirm(`Delete project "${project.name}"? Its resources will be kept.`)) return;
    const res = await apiDelete(`projects/${project.id}`);
    if (res.success) {
      setProjects((p) => p.filter((x) => x.id !== project.id));
    }
  };

  const openNew = () => {
    setEditing(null);
    setDialogOpen(true);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold">Projects</h2>
        <Button onClick={openNew}>
          <Plus className="h-4 w-4" /> New project
        </Button>
      </div>

      {loading && (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-28 rounded-lg border bg-secondary/50 animate-pulse" />
          ))}
        </div>
      )}

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {!loading && !error && projects.length === 0 && (
        <div className="rounded-lg border border-dashed p-10 text-center">
          <FolderKanban className="h-8 w-8 mx-auto text-muted-foreground mb-3" />
          <p className="font-medium mb-1">No projects yet</p>
          <p className="text-sm text-muted-foreground mb-4">
            Group resources around your work — a research thesis, a startup idea, a side project.
          </p>
          <Button onClick={openNew}>Create your first project</Button>
        </div>
      )}

      {!loading && projects.length > 0 && (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {projects.map((p) => (
            <div key={p.id} className="relative group">
              <ProjectCard project={p} />
              <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                <Button
                  size="sm"
                  variant="outline"
                  className="h-6 px-2 text-xs"
                  onClick={() => {
                    setEditing(p);
                    setDialogOpen(true);
                  }}
                >
                  Edit
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-6 px-2 text-xs text-destructive"
                  onClick={() => handleDelete(p)}
                >
                  Delete
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <ProjectFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSaved={() => fetchProjects()}
        project={editing}
      />
    </div>
  );
}
