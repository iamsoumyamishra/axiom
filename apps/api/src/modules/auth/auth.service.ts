import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { hashPassword, verifyPassword } from '@axiom/auth';
import { getPrisma } from '@axiom/data';
import type { UserProfile, AuthTokens, JwtPayload } from '@axiom/shared';
import type { JwtSignOptions } from '@nestjs/jwt';

@Injectable()
export class AuthService {
  private readonly prisma = getPrisma();

  constructor(private readonly jwtService: JwtService) {}

  async register(
    email: string,
    password: string,
    name?: string,
  ): Promise<{ user: UserProfile; tokens: AuthTokens }> {
    const existing = await this.prisma.user.findUnique({ where: { email } });
    if (existing) {
      throw new ConflictException('A user with this email already exists');
    }

    const hashedPassword = await hashPassword(password);
    const user = await this.prisma.user.create({
      data: { email, password: hashedPassword, name: name ?? null },
    });

    const tokens = this.generateTokens(user.id, user.email);
    return { user: this.toProfile(user), tokens };
  }

  async login(
    email: string,
    password: string,
  ): Promise<{ user: UserProfile; tokens: AuthTokens }> {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const isValid = await verifyPassword(password, user.password);
    if (!isValid) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const tokens = this.generateTokens(user.id, user.email);
    return { user: this.toProfile(user), tokens };
  }

  async refreshToken(refreshToken: string): Promise<AuthTokens> {
    try {
      const payload = this.jwtService.verify<JwtPayload>(refreshToken);
      const user = await this.prisma.user.findUnique({ where: { id: payload.sub } });
      if (!user) {
        throw new UnauthorizedException('User not found');
      }
      return this.generateTokens(user.id, user.email);
    } catch {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }
  }

  async getProfile(userId: string): Promise<UserProfile> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new UnauthorizedException('User not found');
    }
    return this.toProfile(user);
  }

  private generateTokens(userId: string, email: string): AuthTokens {
    const payload = { sub: userId, email };
    const accessOptions: JwtSignOptions = {
      expiresIn: (process.env['JWT_EXPIRATION'] ?? '7d') as unknown as number,
    };
    const refreshOptions: JwtSignOptions = {
      expiresIn: (process.env['JWT_REFRESH_EXPIRATION'] ?? '30d') as unknown as number,
    };
    return {
      accessToken: this.jwtService.sign(payload, accessOptions),
      refreshToken: this.jwtService.sign(payload, refreshOptions),
    };
  }

  private toProfile(
    user: { id: string; email: string; name: string | null; createdAt: Date },
  ): UserProfile {
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      createdAt: user.createdAt.toISOString(),
    };
  }
}
