import type { JwtPayload, AuthTokens } from "@axiom/shared";
export declare function signAccessToken(payload: {
    sub: string;
    email: string;
}): string;
export declare function signRefreshToken(payload: {
    sub: string;
    email: string;
}): string;
export declare function generateTokens(payload: {
    sub: string;
    email: string;
}): AuthTokens;
export declare function verifyToken(token: string): JwtPayload;
export declare function decodeToken(token: string): JwtPayload | null;
//# sourceMappingURL=jwt.service.d.ts.map