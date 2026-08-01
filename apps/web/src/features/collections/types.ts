import type { ResourceListItem } from '../resources/types';

export interface Collection {
  id: string;
  name: string;
  description: string | null;
  isAuto: boolean;
  createdAt: string;
  updatedAt: string;
  _count: { resources: number };
}

export interface CollectionDetail extends Collection {
  resources: ResourceListItem[];
  meta: { total: number; page: number; pageSize: number; totalPages: number };
}
