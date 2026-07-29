"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ERRORS = exports.QUEUES = exports.IMPORTANCE = exports.PAGINATION = exports.API_VERSION = void 0;
exports.API_VERSION = 'v1';
exports.PAGINATION = {
    DEFAULT_PAGE_SIZE: 20,
    MAX_PAGE_SIZE: 100,
};
exports.IMPORTANCE = {
    MIN: 1,
    MAX: 10,
};
exports.QUEUES = {
    INGESTION: 'ingestion',
    ANALYSIS: 'analysis',
    EMBEDDING: 'embedding',
    RELATIONSHIP: 'relationship',
};
exports.ERRORS = {
    UNAUTHORIZED: 'UNAUTHORIZED',
    FORBIDDEN: 'FORBIDDEN',
    NOT_FOUND: 'NOT_FOUND',
    VALIDATION_ERROR: 'VALIDATION_ERROR',
    CONFLICT: 'CONFLICT',
    INTERNAL_ERROR: 'INTERNAL_ERROR',
    RATE_LIMITED: 'RATE_LIMITED',
};
//# sourceMappingURL=index.js.map