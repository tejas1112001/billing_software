import { Prisma } from '@prisma/client';

type TxClient = Omit<
  Prisma.TransactionClient,
  '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'
>;

export async function generateBillNumber(tx: TxClient): Promise<string> {
  await tx.billCounter.upsert({
    where: { id: 'global' },
    create: { id: 'global', value: 0 },
    update: {},
  });

  const updated = await tx.billCounter.update({
    where: { id: 'global' },
    data: { value: { increment: 1 } },
  });

  return `BILL-${updated.value}`;
}
