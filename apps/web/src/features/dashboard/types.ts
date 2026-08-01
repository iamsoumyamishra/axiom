import type { ResourceStatus } from '../resources/types';

export interface DashboardStats {
  totalResources: number;
  completed: number;
  processing: number;
  totalProjects: number;
  totalCollections: number;
  totalTags: number;
}

export interface DashboardRecentResource {
  id: string;
  url: string | null;
  title: string | null;
  resourceType: string;
  status: ResourceStatus;
  savedAt: string;
  aiAnalysis: { category: string | null; importance: number | null } | null;
}

export interface DashboardData {
  stats: DashboardStats;
  recent: DashboardRecentResource[];
  topCategories: { category: string; count: number }[];
  topTags: { tag: string; count: number }[];
}
