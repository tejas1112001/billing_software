import { PrismaClient } from '@prisma/client';

export async function generateBillNumber(
  prismaOrTx: any,
  storeId: string,
  date: Date
): Promise<string> {
  const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');
  
  // Use timestamp in milliseconds for uniqueness
  const timestamp = Date.now().toString().slice(-6); // Last 6 digits of timestamp
  
  // Generate a random 3-digit suffix for additional uniqueness
  const randomSuffix = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  
  // Format: BILL-YYYYMMDD-TTTTTTRRR (T=timestamp, R=random)
  return `BILL-${dateStr}-${timestamp}${randomSuffix}`;
}
