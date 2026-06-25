import ExcelJS from 'exceljs';

interface LedgerEntryRow {
  date: Date | string;
  voucherType: string;
  customerName: string;
  amount: number | string;
  openingBalance?: number;
  closingBalance?: number;
  billSerialNumber?: string;
}

interface ProductRow {
  modelName: string;
  brand?: { name: string } | null;
  category?: { name: string } | null;
  mrp: number | string;
  nlc: number | string;
  availableQty: number;
}

const HEADER_FILL: ExcelJS.Fill = {
  type: 'pattern',
  pattern: 'solid',
  fgColor: { argb: 'FF1E40AF' },
};

const HEADER_FONT: Partial<ExcelJS.Font> = {
  bold: true,
  color: { argb: 'FFFFFFFF' },
  size: 11,
};

const CURRENCY_FORMAT = '#,##0.00';

export async function generateLedgerExcel(entries: LedgerEntryRow[]): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Billing Software';
  const sheet = workbook.addWorksheet('Ledger');

  sheet.columns = [
    { header: 'Date', key: 'date', width: 14 },
    { header: 'Customer Name', key: 'customerName', width: 25 },
    { header: 'Voucher Type', key: 'voucherType', width: 14 },
    { header: 'Bill/Receipt No.', key: 'billSerialNumber', width: 22 },
    { header: 'Debit (₹)', key: 'debit', width: 14 },
    { header: 'Platinum (₹)', key: 'credit', width: 14 },
    { header: 'Closing Balance (₹)', key: 'closingBalance', width: 20 },
  ];

  // Style header row
  const headerRow = sheet.getRow(1);
  headerRow.eachCell((cell) => {
    cell.fill = HEADER_FILL;
    cell.font = HEADER_FONT;
    cell.alignment = { vertical: 'middle', horizontal: 'center' };
  });
  headerRow.height = 22;

  for (const entry of entries) {
    const isDebit = entry.voucherType === 'ORDER';
    sheet.addRow({
      date: new Date(entry.date).toLocaleDateString('en-IN'),
      customerName: entry.customerName,
      voucherType: isDebit ? 'Order' : 'Receipt',
      billSerialNumber: entry.billSerialNumber || '',
      debit: isDebit ? Number(entry.amount) : '',
      credit: !isDebit ? Number(entry.amount) : '',
      closingBalance: entry.closingBalance ?? 0,
    });
  }

  // Format currency columns
  ['debit', 'credit', 'closingBalance'].forEach((key) => {
    const col = sheet.getColumn(key);
    col.numFmt = CURRENCY_FORMAT;
  });

  // Alternate row shading
  sheet.eachRow((row, rowNumber) => {
    if (rowNumber > 1 && rowNumber % 2 === 0) {
      row.eachCell((cell) => {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF0F4FF' } };
      });
    }
  });

  const arrayBuffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(arrayBuffer);
}

export async function generateStockReportExcel(rows: ProductRow[]): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Billing Software';
  const sheet = workbook.addWorksheet('Stock Report');

  sheet.columns = [
    { header: 'Model Name', key: 'modelName', width: 35 },
    { header: 'Brand', key: 'brand', width: 18 },
    { header: 'Category', key: 'category', width: 20 },
    { header: 'MRP (₹)', key: 'mrp', width: 14 },
    { header: 'NLC (₹)', key: 'nlc', width: 14 },
    { header: 'Available Qty', key: 'availableQty', width: 16 },
  ];

  const headerRow = sheet.getRow(1);
  headerRow.eachCell((cell) => {
    cell.fill = HEADER_FILL;
    cell.font = HEADER_FONT;
    cell.alignment = { vertical: 'middle', horizontal: 'center' };
  });
  headerRow.height = 22;

  for (const row of rows) {
    sheet.addRow({
      modelName: row.modelName,
      brand: row.brand?.name || '',
      category: row.category?.name || '',
      mrp: Number(row.mrp),
      nlc: Number(row.nlc),
      availableQty: row.availableQty,
    });
  }

  ['mrp', 'nlc'].forEach((key) => {
    sheet.getColumn(key).numFmt = CURRENCY_FORMAT;
  });

  sheet.eachRow((row, rowNumber) => {
    if (rowNumber > 1 && rowNumber % 2 === 0) {
      row.eachCell((cell) => {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF0F4FF' } };
      });
    }
  });

  const arrayBuffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(arrayBuffer);
}
