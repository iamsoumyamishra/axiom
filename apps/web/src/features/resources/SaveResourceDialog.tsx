'use client';

import { useState } from 'react';
import { apiPost } from '../../lib/api';
import { useAuth } from '../auth/useAuth';

interface SaveResourceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved: () => void;
}

export function SaveResourceDialog({ open, onOpenChange, onSaved }: SaveResourceDialogProps) {
  const { logout } = useAuth();
  const [url, setUrl] = useState('');
  const [title, setTitle] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  if (!open) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      const res = await apiPost('resources', { url, title: title || undefined });
      if (res.success) {
        setUrl('');
        setTitle('');
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-background rounded-lg shadow-lg w-full max-w-md mx-4 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Save Resource</h2>
          <button onClick={() => onOpenChange(false)} className="text-muted-foreground hover:text-foreground">
            ✕
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">URL *</label>
            <input
              type="url"
              required
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://example.com/article"
              className="w-full px-3 py-2 border border-input rounded-md bg-background text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Title (optional)</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="My Article"
              className="w-full px-3 py-2 border border-input rounded-md bg-background text-sm"
            />
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="px-4 py-2 text-sm border border-input rounded-md hover:bg-secondary"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 text-sm bg-primary text-primary-foreground rounded-md disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
