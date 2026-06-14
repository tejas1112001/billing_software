import { PrismaClient } from '@prisma/client';

export async function generateReceiptNumber(
  tx: Omit<PrismaClient, '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'>,
  storeId: string,
  date: Date
): Promise<string> {
  const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');

  // Use the receipt's date field (not createdAt) so timezone differences
  // and retries don't produce stale counts.
  const startOfDay = new Date(date);
  startOfDay.setUTCHours(0, 0, 0, 0);
  const endOfDay = new Date(date);
  endOfDay.setUTCHours(23, 59, 59, 999);

  const count = await tx.receipt.count({
    where: {
      storeId,
      date: {
        gte: startOfDay,
        lte: endOfDay,
      },
    },
  });

  // Keep incrementing the sequence until we find one that doesn't exist yet,
  // guarding against race conditions or retried requests on the same day.
  let sequence = count + 1;
  let receiptNumber: string;
  do {
    receiptNumber = `RCP-${dateStr}-${String(sequence).padStart(5, '0')}`;
    const existing = await tx.receipt.findUnique({ where: { receiptNumber } });
    if (!existing) break;
    sequence++;
  } while (true);

  return receiptNumber;
}
