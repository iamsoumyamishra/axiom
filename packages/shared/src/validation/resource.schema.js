"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateResourceSchema = exports.resourceQuerySchema = exports.saveTextSchema = exports.saveResourceSchema = void 0;
const zod_1 = require("zod");
exports.saveResourceSchema = zod_1.z.object({
    url: zod_1.z.string().url('Invalid URL').max(2048),
    title: zod_1.z.string().max(500).optional(),
    selectedText: zod_1.z.string().max(50000).optional(),
    html: zod_1.z.string().max(5_000_000).optional(),
    markdown: zod_1.z.string().max(5_000_000).optional(),
    metadata: zod_1.z.record(zod_1.z.unknown()).optional(),
    screenshot: zod_1.z.string().max(10_000_000).optional(),
});
exports.saveTextSchema = zod_1.z.object({
    title: zod_1.z.string().min(1).max(500),
    text: zod_1.z.string().min(1).max(100000),
    sourceUrl: zod_1.z.string().url().max(2048).optional(),
    metadata: zod_1.z.record(zod_1.z.unknown()).optional(),
});
exports.resourceQuerySchema = zod_1.z.object({
    page: zod_1.z.coerce.number().int().min(1).default(1),
    pageSize: zod_1.z.coerce.number().int().min(1).max(100).default(20),
    search: zod_1.z.string().max(200).optional(),
    category: zod_1.z.string().max(100).optional(),
    tag: zod_1.z.string().max(100).optional(),
    projectId: zod_1.z.string().optional(),
    collectionId: zod_1.z.string().optional(),
    sortBy: zod_1.z.enum(['savedAt', 'createdAt', 'title', 'importance']).default('savedAt'),
    sortOrder: zod_1.z.enum(['asc', 'desc']).default('desc'),
});
exports.updateResourceSchema = zod_1.z.object({
    title: zod_1.z.string().max(500).optional(),
    description: zod_1.z.string().max(5000).optional(),
    tags: zod_1.z.array(zod_1.z.string().max(50)).max(50).optional(),
    projectId: zod_1.z.string().optional(),
    metadata: zod_1.z.record(zod_1.z.unknown()).optional(),
});
//# sourceMappingURL=resource.schema.js.map