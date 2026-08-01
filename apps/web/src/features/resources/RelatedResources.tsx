'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ExternalLink } from 'lucide-react';
import { apiGet } from '../../lib/api';
import type { RelatedResource } from './types';

function getDomain(url: string | null) {
  if (!url) return null;
  try {
    return new URL(url).hostname.replace('www.', '');
  } catch {
    return null;
  }
}

export default function RelatedResources({ resourceId }: { resourceId: string }) {
  const [related, setRelated] = useState<RelatedResource[] | null>(null);

  useEffect(() => {
    let active = true;
    apiGet<RelatedResource[]>(`resources/${resourceId}/related`).then((res) => {
      if (active && res.success && res.data) setRelated(res.data);
    });
    return () => {
      active = false;
    };
  }, [resourceId]);

  if (related === null) {
    return (
      <div className="animate-pulse">
        <div className="h-4 bg-secondary rounded w-24 mb-3" />
        <div className="space-y-2">
          <div className="h-14 bg-secondary rounded" />
          <div className="h-14 bg-secondary rounded" />
        </div>
      </div>
    );
  }

  if (related.length === 0) {
    return (
      <div>
        <h2 className="text-sm font-medium text-muted-foreground mb-2">Related</h2>
        <p className="text-sm text-muted-foreground rounded-lg border p-4">
          No related resources yet — save more content and links will appear automatically.
        </p>
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-sm font-medium text-muted-foreground mb-2">Related</h2>
      <div className="grid sm:grid-cols-2 gap-2">
        {related.map((rel) => (
          <Link
            key={rel.relationshipId}
            href={`/resources/${rel.resource.id}`}
            className="group rounded-lg border p-3 hover:border-primary/50 transition-colors"
          >
            <div className="flex items-center gap-2">
              <span className="text-[10px] uppercase tracking-wider text-violet-700 bg-violet-50 border border-violet-200 rounded px-1.5 py-0.5">
                {rel.type}
              </span>
              {rel.confidence != null && (
                <span className="text-[10px] text-muted-foreground">
                  {Math.round(rel.confidence * 100)}%
                </span>
              )}
            </div>
            <p className="text-sm font-medium mt-1.5 line-clamp-2 group-hover:text-primary">
              {rel.resource.title ?? 'Untitled'}
            </p>
            {rel.resource.url && (
              <span className="text-xs text-muted-foreground inline-flex items-center gap-1 mt-1">
                {getDomain(rel.resource.url)}
                <ExternalLink className="h-3 w-3" />
              </span>
            )}
          </Link>
        ))}
      </div>
    </div>
  );
}
