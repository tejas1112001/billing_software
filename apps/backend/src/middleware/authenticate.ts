import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken } from '../utils/jwt';
import { prisma } from '../lib/prisma';

export async function authenticate(req: Request, res: Response, next: NextFunction): Promise<void> {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Authentication required' });
    return;
  }

  const token = authHeader.slice(7);
  try {
    const payload = verifyAccessToken(token);
    // Load fresh user record so permissions are always up-to-date
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: { id: true, role: true, operatorType: true, permissions: true, isActive: true },
    });

    if (!user || !user.isActive) {
      res.status(401).json({ error: 'Account not found or disabled' });
      return;
    }

    req.user = {
      id: user.id,
      role: user.role,
      operatorType: user.operatorType,
      permissions: user.permissions,
    };
    next();
  } catch {
    res.status(401).json({ error: 'Invalid or expired token' });
  }
}
