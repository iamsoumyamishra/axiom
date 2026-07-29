export interface PaginatedResponse<T> {
    data: T[];
    meta: {
        total: number;
        page: number;
        pageSize: number;
        totalPages: number;
    };
}
export interface ApiResponse<T = unknown> {
    success: boolean;
    data?: T;
    error?: {
        code: string;
        message: string;
        details?: Record<string, string[]>;
    };
}
export type ResourceType = 'article' | 'website' | 'blog_post' | 'documentation' | 'github_repo' | 'video' | 'research_paper' | 'pdf' | 'product' | 'image' | 'design' | 'tweet' | 'reddit_post' | 'stack_overflow' | 'podcast' | 'news' | 'code_snippet' | 'selected_text' | 'link' | string;
//# sourceMappingURL=common.types.d.ts.map