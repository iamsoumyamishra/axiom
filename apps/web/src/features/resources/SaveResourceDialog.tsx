'use client';

import { useState, useEffect } from 'react';
import { FolderKanban } from 'lucide-react';
import { apiPost, apiGet } from '../../lib/api';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '../../components/ui/dialog';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { cn } from '../../lib/utils';

interface SaveResourceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved: () => void;
}

interface ProjectOption {
  id: string;
  name: string;
  color: string | null;
}

export function SaveResourceDialog({ open, onOpenChange, onSaved }: SaveResourceDialogProps) {
  const [url, setUrl] = useState('');
  const [title, setTitle] = useState('');
  const [projects, setProjects] = useState<ProjectOption[]>([]);
  const [selectedProjects, setSelectedProjects] = useState<Set<string>>(new Set());
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!open) return;
    apiGet<ProjectOption[]>('projects').then((res) => {
      if (res.success && res.data) setProjects(res.data);
    });
  }, [open]);

  const toggleProject = (id: string) => {
    setSelectedProjects((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      const res = await apiPost('resources', {
        url,
        title: title || undefined,
        projectIds: selectedProjects.size > 0 ? [...selectedProjects] : undefined,
      });
      if (res.success) {
        setUrl('');
        setTitle('');
        setSelectedProjects(new Set());
        onOpenChange(false);
        onSaved();
      } else {
        setError(res.error?.message ?? 'Failed to save');
      }
    } catch {
      setError('Network error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Save Resource</DialogTitle>
          <DialogDescription>
            Axiom will analyze, categorize, and organize it automatically.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">URL</label>
            <Input
              type="url"
              required
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://example.com/article"
              autoFocus
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Title (optional)</label>
            <Input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="My Article"
            />
          </div>

          {projects.length > 0 && (
            <div className="space-y-2">
              <label className="text-sm font-medium">Projects</label>
              <div className="flex flex-wrap gap-1.5">
                {projects.map((p) => {
                  const active = selectedProjects.has(p.id);
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => toggleProject(p.id)}
                      className={cn(
                        'inline-flex items-center gap-1.5 text-xs px-2 py-1 rounded border transition-colors',
                        active
                          ? 'border-primary bg-primary/10 text-primary'
                          : 'border-input text-muted-foreground hover:text-foreground',
                      )}
                    >
                      <span
                        className="h-2 w-2 rounded-full"
                        style={{ backgroundColor: p.color ?? '#64748b' }}
                      />
                      <FolderKanban className="h-3 w-3" />
                      {p.name}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {error && <p className="text-sm text-destructive">{error}</p>}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? 'Saving…' : 'Save'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
