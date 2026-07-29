"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PrismaClient = exports.disconnectDatabase = exports.connectDatabase = exports.getPrisma = void 0;
var prisma_service_1 = require("./prisma.service");
Object.defineProperty(exports, "getPrisma", { enumerable: true, get: function () { return prisma_service_1.getPrisma; } });
Object.defineProperty(exports, "connectDatabase", { enumerable: true, get: function () { return prisma_service_1.connectDatabase; } });
Object.defineProperty(exports, "disconnectDatabase", { enumerable: true, get: function () { return prisma_service_1.disconnectDatabase; } });
Object.defineProperty(exports, "PrismaClient", { enumerable: true, get: function () { return prisma_service_1.PrismaClient; } });
//# sourceMappingURL=index.js.map