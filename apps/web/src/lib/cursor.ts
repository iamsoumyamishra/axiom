export interface CursorMeta {
  total?: number;
  pageSize: number;
  nextCursor: string | null;
  hasMore: boolean;
}

export interface CursorListResponse<T> {
  data: T[];
  meta: CursorMeta;
}
