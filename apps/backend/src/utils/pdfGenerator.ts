import PDFDocument from 'pdfkit';

interface OrderItem {
  quantity: number;
  unitPrice: number | string;
  lineTotal: number | string;
  product?: { modelName: string } | null;
}

interface Order {
  billNumber: string;
  customerName: string;
  createdAt: Date | string;
  totalAmount: number | string;
  orderItems?: OrderItem[];
}

interface Store {
  name: string;
  address: string;
  city: string;
  mobile: string;
  email: string;
}

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

function formatCurrency(amount: number | string): string {
  return `${Number(amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;
}

function formatDate(date: Date | string): string {
  return new Date(date).toLocaleDateString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
  });
}

// ─── Colour palette (matches screenshot) ───────────────────────────────────
const BRAND        = '#4F46E5';   // indigo header / Grand-Total box / TAX INVOICE text
const BRAND_LIGHT  = '#E0E7FF';   // header sub-text
const HEADER_ROW   = '#F3F4F6';   // table header background
const ROW_ALT      = '#FAFAFA';   // even-row tint
const TEXT_DARK    = '#1F2937';   // body text
const TEXT_GREY    = '#6B7280';   // label / footer text
const BORDER_GREY  = '#E5E7EB';   // rule / box borders
const WHITE        = '#FFFFFF';

export function generateBillPdf(order: Order, store: Store): PDFKit.PDFDocument {
  const doc = new PDFDocument({
    margin: 50,
    size: 'A4',
    autoFirstPage: true,
    bufferPages: true,
    compress: true,
  });

  // ── Header banner ──────────────────────────────────────────────────────────
  const PAGE_W   = doc.page.width;          // 595.28
  const MARGIN   = 50;
  const CONTENT_W = PAGE_W - MARGIN * 2;   // 495.28

  doc.rect(0, 0, PAGE_W, 140).fill(BRAND);

  doc.fontSize(26)
     .font('Helvetica-Bold')
     .fillColor(WHITE)
     .text(store.name, 0, 38, { align: 'center', width: PAGE_W });

  doc.fontSize(11)
     .font('Helvetica')
     .fillColor(BRAND_LIGHT)
     .text(`${store.address}, ${store.city}`, 0, 78, { align: 'center', width: PAGE_W })
     .text(`Mobile: ${store.mobile}  |  Email: ${store.email}`, 0, 96, { align: 'center', width: PAGE_W });

  // ── Items table (move up to replace removed sections) ────────────────────
  const TABLE_TOP = 155;
  const TABLE_W   = CONTENT_W;          // 495.28

  // Column widths – must sum to TABLE_W
  const COL = {
    sno:     40,
    product: 185,
    qty:     50,
    mrp:     80,
    price:   80,
    total:   60.28,                     // remainder
  };

  // Left edge of each column
  const X = {
    sno:     MARGIN,
    product: MARGIN + COL.sno,
    qty:     MARGIN + COL.sno + COL.product,
    mrp:     MARGIN + COL.sno + COL.product + COL.qty,
    price:   MARGIN + COL.sno + COL.product + COL.qty + COL.mrp,
    total:   MARGIN + COL.sno + COL.product + COL.qty + COL.mrp + COL.price,
  };

  const HDR_H = 32;

  // Header row background
  doc.rect(MARGIN, TABLE_TOP, TABLE_W, HDR_H).fill(HEADER_ROW);

  doc.fontSize(10).font('Helvetica-Bold').fillColor('#374151');
  doc.text('S.No',    X.sno,     TABLE_TOP + 11, { width: COL.sno,     align: 'center' });
  doc.text('Product', X.product + 5, TABLE_TOP + 11, { width: COL.product - 10 });
  doc.text('Qty',     X.qty,     TABLE_TOP + 11, { width: COL.qty,     align: 'center' });
  doc.text('MRP',     X.mrp,     TABLE_TOP + 11, { width: COL.mrp,     align: 'right' });
  doc.text('Price',   X.price,   TABLE_TOP + 11, { width: COL.price,   align: 'right' });
  doc.text('Total',   X.total,   TABLE_TOP + 11, { width: COL.total,   align: 'right' });

  // ── Data rows ──────────────────────────────────────────────────────────────
  doc.font('Helvetica').fontSize(10);
  let curY = TABLE_TOP + HDR_H;
  let idx  = 1;

  for (const item of order.orderItems ?? []) {
    const ROW_H = 36;

    if (idx % 2 === 0) {
      doc.rect(MARGIN, curY, TABLE_W, ROW_H).fill(ROW_ALT);
    }

    const textY = curY + 11;
    doc.fillColor(TEXT_DARK);

    doc.text(String(idx),                          X.sno,     textY, { width: COL.sno,     align: 'center' });
    doc.text(item.product?.modelName ?? 'N/A',     X.product + 5, textY, { width: COL.product - 10, ellipsis: true });
    doc.text(String(item.quantity),                X.qty,     textY, { width: COL.qty,     align: 'center' });
    doc.text(formatCurrency(item.unitPrice),        X.mrp,     textY, { width: COL.mrp,     align: 'right' });
    doc.text(formatCurrency(item.unitPrice),        X.price,   textY, { width: COL.price,   align: 'right' });
    doc.text(formatCurrency(item.lineTotal),        X.total,   textY, { width: COL.total,   align: 'right' });

    curY += ROW_H;
    idx++;
  }

  // Bottom rule
  doc.strokeColor(BORDER_GREY).lineWidth(1)
     .moveTo(MARGIN, curY).lineTo(MARGIN + TABLE_W, curY).stroke();

  // ── Grand Total box - Right aligned with table ────────────────────────────
  const GT_W = 250;
  const GT_H = 58;
  const GT_X = MARGIN + TABLE_W - GT_W;  // Right-align with table
  const GT_Y = curY + 22;

  doc.roundedRect(GT_X, GT_Y, GT_W, GT_H, 6).fill(BRAND);

  doc.fontSize(13)
     .font('Helvetica-Bold')
     .fillColor(WHITE)
     .text('Grand Total:', GT_X + 16, GT_Y + 14, { width: GT_W - 32 });

  doc.fontSize(22)
     .text(formatCurrency(order.totalAmount), GT_X + 16, GT_Y + 32, { width: GT_W - 32, align: 'right' });

  // ── Footer ─────────────────────────────────────────────────────────────────
  const FOOTER_Y = doc.page.height - 90;

  doc.fontSize(10)
     .font('Helvetica-Oblique')
     .fillColor(TEXT_GREY)
     .text('Thank you for your purchase!', MARGIN, FOOTER_Y, { align: 'center', width: CONTENT_W });

  doc.fontSize(8)
     .font('Helvetica')
     .text(
       'This is a computer-generated invoice and does not require a signature.',
       MARGIN, FOOTER_Y + 18, { align: 'center', width: CONTENT_W }
     );

  return doc;
}

export function generateLedgerPdf(
  storeId: string,
  entries: LedgerEntryRow[],
  openingBalance: number,
  dateRange: { from: string; to: string }
): PDFKit.PDFDocument {
  const doc = new PDFDocument({ margin: 40, size: 'A4', layout: 'landscape', bufferPages: true });

  const PAGE_W    = doc.page.width;
  const PAGE_H    = doc.page.height;
  const MARGIN    = 40;
  const CONTENT_W = PAGE_W - MARGIN * 2;

  // Header banner
  doc.rect(0, 0, PAGE_W, 100).fill(BRAND);

  doc.fontSize(20).font('Helvetica-Bold').fillColor(WHITE)
     .text('Ledger Report', 0, 30, { align: 'center', width: PAGE_W });

  doc.fontSize(11).font('Helvetica').fillColor(BRAND_LIGHT)
     .text(
       dateRange.from && dateRange.to
         ? `Period: ${dateRange.from} to ${dateRange.to}`
         : 'All Entries',
       0, 60, { align: 'center', width: PAGE_W }
     );

  doc.fillColor('#000000');
  doc.y = 120;

  // Opening balance summary box
  const OB_Y = doc.y;
  doc.rect(MARGIN, OB_Y, 200, 36).fill(HEADER_ROW);
  doc.fontSize(9).font('Helvetica').fillColor(TEXT_GREY)
     .text('Opening Balance', MARGIN + 10, OB_Y + 8);
  doc.fontSize(13).font('Helvetica-Bold').fillColor('#111827')
     .text(formatCurrency(openingBalance), MARGIN + 10, OB_Y + 20);

  const TABLE_TOP = OB_Y + 50;
  const HDR_H     = 28;

  doc.rect(MARGIN, TABLE_TOP, CONTENT_W, HDR_H).fill(HEADER_ROW);
  doc.font('Helvetica-Bold').fontSize(9).fillColor('#374151');

  const colY = TABLE_TOP + 9;
  doc.text('Date',            MARGIN + 10,  colY, { width: 80 });
  doc.text('Customer',        MARGIN + 95,  colY, { width: 150 });
  doc.text('Voucher',         MARGIN + 250, colY, { width: 70 });
  doc.text('Bill/Receipt No.',MARGIN + 325, colY, { width: 100 });
  doc.text('Debit',           MARGIN + 430, colY, { width: 90,  align: 'right' });
  doc.text('Credit',          MARGIN + 525, colY, { width: 90,  align: 'right' });
  doc.text('Balance',         MARGIN + 620, colY, { width: 110, align: 'right' });

  doc.fillColor('#000000');
  let curY = TABLE_TOP + HDR_H;
  let rowIdx = 1;
  doc.font('Helvetica').fontSize(8);

  for (const entry of entries) {
    const ROW_H  = 28;
    const isDebit = entry.voucherType === 'ORDER';

    if (rowIdx % 2 === 0) {
      doc.rect(MARGIN, curY, CONTENT_W, ROW_H).fill(ROW_ALT);
    }

    const ty = curY + 10;
    doc.fillColor(TEXT_DARK);
    doc.text(formatDate(entry.date),     MARGIN + 10,  ty, { width: 80 });
    doc.text(entry.customerName,         MARGIN + 95,  ty, { width: 150 });

    doc.fillColor(isDebit ? '#DC2626' : '#059669');
    doc.text(isDebit ? 'Order' : 'Receipt', MARGIN + 250, ty, { width: 70 });

    doc.fillColor(TEXT_DARK);
    doc.text(entry.billSerialNumber ?? '-', MARGIN + 325, ty, { width: 100 });

    doc.fillColor(isDebit ? '#DC2626' : TEXT_GREY);
    doc.text(isDebit ? formatCurrency(entry.amount) : '-', MARGIN + 430, ty, { width: 90, align: 'right' });

    doc.fillColor(!isDebit ? '#059669' : TEXT_GREY);
    doc.text(!isDebit ? formatCurrency(entry.amount) : '-', MARGIN + 525, ty, { width: 90, align: 'right' });

    doc.fillColor('#111827').font('Helvetica-Bold');
    doc.text(formatCurrency(entry.closingBalance ?? 0), MARGIN + 620, ty, { width: 110, align: 'right' });
    doc.font('Helvetica');

    curY += ROW_H;
    rowIdx++;
  }

  doc.fontSize(8).fillColor(TEXT_GREY)
     .text(
       `Generated on ${new Date().toLocaleDateString('en-IN')}`,
       MARGIN, PAGE_H - 50,
       { align: 'center', width: CONTENT_W }
     );

  return doc;
}

export function generateStockReportPdf(
  rows: ProductRow[],
  groupBy: string,
  _filters: Record<string, unknown>
): PDFKit.PDFDocument {
  const doc = new PDFDocument({ margin: 40, size: 'A4', layout: 'landscape', bufferPages: true });

  const PAGE_W    = doc.page.width;
  const PAGE_H    = doc.page.height;
  const MARGIN    = 40;
  const CONTENT_W = PAGE_W - MARGIN * 2;

  // Header banner
  doc.rect(0, 0, PAGE_W, 100).fill(BRAND);

  doc.fontSize(20).font('Helvetica-Bold').fillColor(WHITE)
     .text('Stock Report', 0, 30, { align: 'center', width: PAGE_W });

  doc.fontSize(11).font('Helvetica').fillColor(BRAND_LIGHT)
     .text(`Grouped by: ${groupBy.charAt(0).toUpperCase() + groupBy.slice(1)}`, 0, 60, { align: 'center', width: PAGE_W });

  doc.fillColor('#000000');
  doc.y = 120;

  // Summary box
  const SB_Y = doc.y;
  doc.rect(MARGIN, SB_Y, 200, 36).fill(HEADER_ROW);
  doc.fontSize(9).font('Helvetica').fillColor(TEXT_GREY)
     .text('Total Products', MARGIN + 10, SB_Y + 8);
  doc.fontSize(13).font('Helvetica-Bold').fillColor('#111827')
     .text(String(rows.length), MARGIN + 10, SB_Y + 20);

  const TABLE_TOP = SB_Y + 50;
  const HDR_H     = 28;

  doc.rect(MARGIN, TABLE_TOP, CONTENT_W, HDR_H).fill(HEADER_ROW);
  doc.font('Helvetica-Bold').fontSize(9).fillColor('#374151');

  const colY = TABLE_TOP + 9;
  doc.text('Model Name',    MARGIN + 10,  colY, { width: 220 });
  doc.text('Brand',         MARGIN + 235, colY, { width: 100 });
  doc.text('Category',      MARGIN + 340, colY, { width: 120 });
  doc.text('MRP',           MARGIN + 465, colY, { width: 80,  align: 'right' });
  doc.text('Selling Price', MARGIN + 550, colY, { width: 90,  align: 'right' });
  doc.text('Qty',           MARGIN + 645, colY, { width: 85,  align: 'right' });

  doc.fillColor('#000000');
  let curY = TABLE_TOP + HDR_H;
  let rowIdx = 1;
  doc.font('Helvetica').fontSize(8);

  for (const row of rows) {
    const ROW_H = 28;

    if (rowIdx % 2 === 0) {
      doc.rect(MARGIN, curY, CONTENT_W, ROW_H).fill(ROW_ALT);
    }

    const ty = curY + 10;
    doc.fillColor(TEXT_DARK);
    doc.text(row.modelName,            MARGIN + 10,  ty, { width: 220 });
    doc.text(row.brand?.name    ?? '-', MARGIN + 235, ty, { width: 100 });
    doc.text(row.category?.name ?? '-', MARGIN + 340, ty, { width: 120 });
    doc.text(formatCurrency(row.mrp),   MARGIN + 465, ty, { width: 80,  align: 'right' });
    doc.text(formatCurrency(row.nlc),   MARGIN + 550, ty, { width: 90,  align: 'right' });

    const qty = row.availableQty;
    doc.fillColor(qty < 5 ? '#DC2626' : qty < 10 ? '#F59E0B' : '#059669')
       .font('Helvetica-Bold')
       .text(String(qty), MARGIN + 645, ty, { width: 85, align: 'right' });
    doc.font('Helvetica');

    curY += ROW_H;
    rowIdx++;
  }

  doc.fontSize(8).fillColor(TEXT_GREY)
     .text(
       `Generated on ${new Date().toLocaleDateString('en-IN')}`,
       MARGIN, PAGE_H - 50,
       { align: 'center', width: CONTENT_W }
     );

  return doc;
} 