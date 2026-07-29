import { PrismaClient } from '@prisma/client';
export declare function getPrisma(): PrismaClient;
export declare function connectDatabase(): Promise<void>;
export declare function disconnectDatabase(): Promise<void>;
export { PrismaClient };
export type { Prisma } from '@prisma/client';
//# sourceMappingURL=prisma.service.d.ts.map