import jwt from 'jsonwebtoken';
import type { JwtPayload, AuthTokens } from '@axiom/shared';
import type { SignOptions } from 'jsonwebtoken';

function getSecret(): string {
  const secret = process.env['JWT_SECRET'];
  if (!secret) {
    throw new Error('JWT_SECRET environment variable is not set');
  }
  return secret;
}

function getExpiration(): string {
  return process.env['JWT_EXPIRATION'] ?? '7d';
}

function getRefreshExpiration(): string {
  return process.env['JWT_REFRESH_EXPIRATION'] ?? '30d';
}

function signToken(payload: { sub: string; email: string }, expiresIn: string): string {
  const options: SignOptions = { expiresIn: expiresIn as unknown as number };
  return jwt.sign(payload, getSecret(), options);
}

export function signAccessToken(payload: { sub: string; email: string }): string {
  return signToken(payload, getExpiration());
}

export function signRefreshToken(payload: { sub: string; email: string }): string {
  return signToken(payload, getRefreshExpiration());
}

export function generateTokens(payload: { sub: string; email: string }): AuthTokens {
  return {
    accessToken: signAccessToken(payload),
    refreshToken: signRefreshToken(payload),
  };
}

export function verifyToken(token: string): JwtPayload {
  return jwt.verify(token, getSecret()) as JwtPayload;
}

export function decodeToken(token: string): JwtPayload | null {
  try {
    return jwt.decode(token) as JwtPayload;
  } catch {
    return null;
  }
}
