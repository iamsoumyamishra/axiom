"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PrismaClient = void 0;
exports.getPrisma = getPrisma;
exports.connectDatabase = connectDatabase;
exports.disconnectDatabase = disconnectDatabase;
const client_1 = require("@prisma/client");
Object.defineProperty(exports, "PrismaClient", { enumerable: true, get: function () { return client_1.PrismaClient; } });
let prisma = null;
function getPrisma() {
    if (!prisma) {
        prisma = new client_1.PrismaClient({
            log: process.env['NODE_ENV'] === 'development'
                ? ['query', 'warn', 'error']
                : ['warn', 'error'],
        });
    }
    return prisma;
}
async function connectDatabase() {
    const db = getPrisma();
    await db.$connect();
}
async function disconnectDatabase() {
    if (prisma) {
        await prisma.$disconnect();
        prisma = null;
    }
}
//# sourceMappingURL=prisma.service.js.map