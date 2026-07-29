"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.signAccessToken = signAccessToken;
exports.signRefreshToken = signRefreshToken;
exports.generateTokens = generateTokens;
exports.verifyToken = verifyToken;
exports.decodeToken = decodeToken;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
function getSecret() {
    const secret = process.env['JWT_SECRET'];
    if (!secret) {
        throw new Error('JWT_SECRET environment variable is not set');
    }
    return secret;
}
function getExpiration() {
    return process.env['JWT_EXPIRATION'] ?? '7d';
}
function getRefreshExpiration() {
    return process.env['JWT_REFRESH_EXPIRATION'] ?? '30d';
}
function signToken(payload, expiresIn) {
    const options = { expiresIn: expiresIn };
    return jsonwebtoken_1.default.sign(payload, getSecret(), options);
}
function signAccessToken(payload) {
    return signToken(payload, getExpiration());
}
function signRefreshToken(payload) {
    return signToken(payload, getRefreshExpiration());
}
function generateTokens(payload) {
    return {
        accessToken: signAccessToken(payload),
        refreshToken: signRefreshToken(payload),
    };
}
function verifyToken(token) {
    return jsonwebtoken_1.default.verify(token, getSecret());
}
function decodeToken(token) {
    try {
        return jsonwebtoken_1.default.decode(token);
    }
    catch {
        return null;
    }
}
//# sourceMappingURL=jwt.service.js.map