import jwt from 'jsonwebtoken';
import { Role } from '@prisma/client';

interface AccessTokenPayload {
  userId: string;
  role: Role;
}

interface RefreshTokenPayload {
  userId: string;
}

export function signAccessToken(userId: string, role: Role): string {
  const secret = process.env.JWT_SECRET;
  const expiresIn = process.env.JWT_EXPIRES_IN || '15m';
  if (!secret) throw new Error('JWT_SECRET not configured');
  return jwt.sign({ userId, role }, secret, { expiresIn } as jwt.SignOptions);
}

export function signRefreshToken(userId: string): string {
  const secret = process.env.REFRESH_TOKEN_SECRET;
  const expiresIn = process.env.REFRESH_TOKEN_EXPIRES_IN || '30d';
  if (!secret) throw new Error('REFRESH_TOKEN_SECRET not configured');
  return jwt.sign({ userId }, secret, { expiresIn } as jwt.SignOptions);
}

export function verifyAccessToken(token: string): AccessTokenPayload {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error('JWT_SECRET not configured');
  return jwt.verify(token, secret) as AccessTokenPayload;
}

export function verifyRefreshToken(token: string): RefreshTokenPayload {
  const secret = process.env.REFRESH_TOKEN_SECRET;
  if (!secret) throw new Error('REFRESH_TOKEN_SECRET not configured');
  return jwt.verify(token, secret) as RefreshTokenPayload;
}
