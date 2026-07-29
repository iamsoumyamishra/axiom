export interface JwtPayload {
    sub: string;
    email: string;
    iat?: number;
    exp?: number;
}
export interface AuthTokens {
    accessToken: string;
    refreshToken: string;
}
export interface UserProfile {
    id: string;
    email: string;
    name: string | null;
    createdAt: string;
}
//# sourceMappingURL=auth.types.d.ts.map