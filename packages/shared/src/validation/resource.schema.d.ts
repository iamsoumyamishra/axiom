import { z } from 'zod';
export declare const saveResourceSchema: z.ZodObject<{
    url: z.ZodString;
    title: z.ZodOptional<z.ZodString>;
    selectedText: z.ZodOptional<z.ZodString>;
    html: z.ZodOptional<z.ZodString>;
    markdown: z.ZodOptional<z.ZodString>;
    metadata: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
    screenshot: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    url: string;
    title?: string | undefined;
    selectedText?: string | undefined;
    html?: string | undefined;
    markdown?: string | undefined;
    metadata?: Record<string, unknown> | undefined;
    screenshot?: string | undefined;
}, {
    url: string;
    title?: string | undefined;
    selectedText?: string | undefined;
    html?: string | undefined;
    markdown?: string | undefined;
    metadata?: Record<string, unknown> | undefined;
    screenshot?: string | undefined;
}>;
export declare const saveTextSchema: z.ZodObject<{
    title: z.ZodString;
    text: z.ZodString;
    sourceUrl: z.ZodOptional<z.ZodString>;
    metadata: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
}, "strip", z.ZodTypeAny, {
    title: string;
    text: string;
    metadata?: Record<string, unknown> | undefined;
    sourceUrl?: string | undefined;
}, {
    title: string;
    text: string;
    metadata?: Record<string, unknown> | undefined;
    sourceUrl?: string | undefined;
}>;
export declare const resourceQuerySchema: z.ZodObject<{
    page: z.ZodDefault<z.ZodNumber>;
    pageSize: z.ZodDefault<z.ZodNumber>;
    search: z.ZodOptional<z.ZodString>;
    category: z.ZodOptional<z.ZodString>;
    tag: z.ZodOptional<z.ZodString>;
    projectId: z.ZodOptional<z.ZodString>;
    collectionId: z.ZodOptional<z.ZodString>;
    sortBy: z.ZodDefault<z.ZodEnum<["savedAt", "createdAt", "title", "importance"]>>;
    sortOrder: z.ZodDefault<z.ZodEnum<["asc", "desc"]>>;
}, "strip", z.ZodTypeAny, {
    page: number;
    pageSize: number;
    sortBy: "savedAt" | "createdAt" | "title" | "importance";
    sortOrder: "asc" | "desc";
    search?: string | undefined;
    category?: string | undefined;
    tag?: string | undefined;
    projectId?: string | undefined;
    collectionId?: string | undefined;
}, {
    page?: number | undefined;
    pageSize?: number | undefined;
    search?: string | undefined;
    category?: string | undefined;
    tag?: string | undefined;
    projectId?: string | undefined;
    collectionId?: string | undefined;
    sortBy?: "savedAt" | "createdAt" | "title" | "importance" | undefined;
    sortOrder?: "asc" | "desc" | undefined;
}>;
export declare const updateResourceSchema: z.ZodObject<{
    title: z.ZodOptional<z.ZodString>;
    description: z.ZodOptional<z.ZodString>;
    tags: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    projectId: z.ZodOptional<z.ZodString>;
    metadata: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
}, "strip", z.ZodTypeAny, {
    tags?: string[] | undefined;
    description?: string | undefined;
    title?: string | undefined;
    metadata?: Record<string, unknown> | undefined;
    projectId?: string | undefined;
}, {
    tags?: string[] | undefined;
    description?: string | undefined;
    title?: string | undefined;
    metadata?: Record<string, unknown> | undefined;
    projectId?: string | undefined;
}>;
//# sourceMappingURL=resource.schema.d.ts.map