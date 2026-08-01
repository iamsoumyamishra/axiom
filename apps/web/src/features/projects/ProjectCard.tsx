'use client';

import Link from 'next/link';
import { FolderKanban } from 'lucide-react';
import type { Project } from './types';

export function ProjectCard({ project }: { project: Project }) {
  return (
    <Link
      href={`/projects/${project.id}`}
      className="block rounded-lg border p-4 hover:border-primary/50 hover:shadow-sm transition-all"
    >
      <div className="flex items-start gap-3">
        <div
          className="h-9 w-9 rounded-md flex items-center justify-center shrink-0 text-white"
          style={{ backgroundColor: project.color ?? '#64748b' }}
        >
          <FolderKanban className="h-4 w-4" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-medium truncate">{project.name}</h3>
          <p className="text-sm text-muted-foreground truncate mt-0.5">
            {project.description || 'No description'}
          </p>
          <p className="text-xs text-muted-foreground mt-2">
            {project._count.resources} resource{project._count.resources === 1 ? '' : 's'}
          </p>
        </div>
      </div>
    </Link>
  );
}
