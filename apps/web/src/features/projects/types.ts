import type { ResourceListItem } from '../resources/types';
import type { CursorListResponse, CursorMeta } from '../../lib/cursor';

export interface Project {
  id: string;
  name: string;
  description: string | null;
  color: string | null;
  createdAt: string;
  updatedAt: string;
  _count: { resources: number };
}

export interface ProjectDetail extends Project {
  resources: ResourceListItem[];
  meta: CursorMeta;
}

export type ProjectListResponse = CursorListResponse<Project>;

export interface ProjectFormValues {
  name: string;
  description: string;
  color: string | null;
}

export const PROJECT_COLORS = [
  '#0f766e',
  '#7c3aed',
  '#2563eb',
  '#db2777',
  '#d97706',
  '#16a34a',
  '#dc2626',
  '#64748b',
];
