import { useEffect, useState } from 'react';
import { clearTokens } from '../../shared/storage';
import { apiGet, apiPost } from '../../shared/api';

interface Props {
  onLogout: () => void;
}

interface Resource {
  id: string;
  title: string | null;
  url: string | null;
  savedAt: string;
  status: string;
}

export function MainView({ onLogout }: Props) {
  const [url, setUrl] = useState('');
  const [saving, setSaving] = useState(false);
  const [recents, setRecents] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchRecents = async () => {
    setLoading(true);
    try {
      const data = await apiGet<{ data: Resource[] }>('resources', { pageSize: '5', sortBy: 'savedAt', sortOrder: 'desc' });
      setRecents(data.data);
    } catch {
      setRecents([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecents();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim()) return;
    setSaving(true);
    setError('');
    try {
      await apiPost('resources', { url: url.trim() });
      setUrl('');
      fetchRecents();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    await clearTokens();
    onLogout();
  };

  return (
    <div style={{ width: 360, fontFamily: 'system-ui, sans-serif' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', borderBottom: '1px solid #eee' }}>
        <span style={{ fontSize: 16, fontWeight: 700 }}>Axiom</span>
        <div style={{ display: 'flex', gap: 8 }}>
          <a
            href="https://localhost:3000/resources"
            target="_blank"
            style={{ fontSize: 12, color: '#666', textDecoration: 'none' }}
          >Open app</a>
          <button onClick={handleLogout} style={{ fontSize: 12, color: '#666', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}>
            Sign out
          </button>
        </div>
      </div>

      <div style={{ padding: '12px 16px', borderBottom: '1px solid #eee' }}>
        <form onSubmit={handleSave}>
          <input
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="Save a URL..."
            style={{
              width: '100%',
              padding: '8px 10px',
              border: '1px solid #d0d0d0',
              borderRadius: 6,
              fontSize: 13,
              boxSizing: 'border-box',
              marginBottom: 6,
            }}
          />
          <button
            type="submit"
            disabled={saving || !url.trim()}
            style={{
              width: '100%',
              padding: '6px 12px',
              background: saving || !url.trim() ? '#999' : '#111',
              color: '#fff',
              border: 'none',
              borderRadius: 6,
              fontSize: 13,
              cursor: saving || !url.trim() ? 'default' : 'pointer',
            }}
          >
            {saving ? 'Saving...' : 'Save URL'}
          </button>
        </form>
        {error && <p style={{ fontSize: 12, color: '#e00', marginTop: 6 }}>{error}</p>}
      </div>

      <div style={{ padding: '12px 16px' }}>
        <p style={{ fontSize: 12, color: '#666', marginBottom: 8, fontWeight: 600 }}>Recently Saved</p>
        {loading && <p style={{ fontSize: 12, color: '#999' }}>Loading...</p>}
        {!loading && recents.length === 0 && (
          <p style={{ fontSize: 12, color: '#999' }}>No resources yet. Right-click any page to save.</p>
        )}
        {recents.map((r) => (
          <a
            key={r.id}
            href={r.url ?? '#'}
            target="_blank"
            style={{
              display: 'block',
              padding: '6px 0',
              textDecoration: 'none',
              borderBottom: '1px solid #f5f5f5',
            }}
          >
            <span style={{ fontSize: 13, color: '#111', display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {r.title ?? 'Untitled'}
            </span>
            <span style={{ fontSize: 11, color: '#999' }}>
              {r.status === 'COMPLETED' ? '✓ Analyzed' : 'Processing...'}
            </span>
          </a>
        ))}
      </div>
    </div>
  );
}
