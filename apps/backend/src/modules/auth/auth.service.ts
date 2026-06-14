import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { prisma } from '../../lib/prisma';
import { signAccessToken, signRefreshToken, verifyRefreshToken } from '../../utils/jwt';
import { createLog } from '../user-logs/userLog.service';
import { AppError } from '../../middleware/errorHandler';

export async function login(username: string, password: string) {
  const user = await prisma.user.findUnique({ where: { username } });
  if (!user) throw new AppError(401, 'Invalid username or password');
  if (!user.isActive) throw new AppError(403, 'Account is disabled');

  const isValid = await bcrypt.compare(password, user.passwordHash);
  if (!isValid) throw new AppError(401, 'Invalid username or password');

  const accessToken = signAccessToken(user.id, user.role);
  const rawRefreshToken = signRefreshToken(user.id);
  const hashedRefreshToken = crypto.createHash('sha256').update(rawRefreshToken).digest('hex');

  await prisma.user.update({
    where: { id: user.id },
    data: { refreshToken: hashedRefreshToken },
  });

  await createLog(user.id, 'LOGIN');

  return {
    accessToken,
    refreshToken: rawRefreshToken,
    user: { id: user.id, username: user.username, role: user.role, operatorType: user.operatorType },
  };
}

export async function refresh(rawRefreshToken: string) {
  let payload: { userId: string };
  try {
    payload = verifyRefreshToken(rawRefreshToken);
  } catch {
    throw new AppError(401, 'Invalid or expired refresh token');
  }

  const hashedToken = crypto.createHash('sha256').update(rawRefreshToken).digest('hex');
  const user = await prisma.user.findFirst({
    where: { id: payload.userId, refreshToken: hashedToken },
  });

  if (!user) throw new AppError(401, 'Invalid or expired refresh token');

  const newAccessToken = signAccessToken(user.id, user.role);
  return { accessToken: newAccessToken };
}

export async function logout(userId: string) {
  await prisma.user.update({
    where: { id: userId },
    data: { refreshToken: null },
  });
  await createLog(userId, 'LOGOUT');
}
