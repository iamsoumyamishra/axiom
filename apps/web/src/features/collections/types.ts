import type { ResourceListItem } from '../resources/types';
import type { CursorListResponse, CursorMeta } from '../../lib/cursor';

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
  meta: CursorMeta;
}

export type CollectionListResponse = CursorListResponse<Collection>;
