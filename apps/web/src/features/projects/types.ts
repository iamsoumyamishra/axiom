import type { ResourceListItem } from '../resources/types';

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
  meta: { total: number; page: number; pageSize: number; totalPages: number };
}

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
