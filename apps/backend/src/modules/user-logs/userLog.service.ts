import { PrismaClient, LogAction } from '@prisma/client';

const prisma = new PrismaClient();

export async function createLog(
  userId: string,
  action: LogAction,
  meta?: Record<string, unknown>
): Promise<void> {
  try {
    await prisma.userLog.create({
      data: {
        userId,
        action,
        meta: meta ? JSON.parse(JSON.stringify(meta)) : undefined,
      },
    });
  } catch (error) {
    // Log errors should not break the main flow
    console.error('[UserLog] Failed to create log:', error);
  }
}
