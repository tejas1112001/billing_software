import PDFDocument from 'pdfkit';
import { loadImageBuffer } from './imageOptimizer';

interface OrderItem {
  quantity: number;
  unitPrice: number | string;
  lineTotal: number | string;
  product?: { modelName: string; imageUrl?: string | null; mrp?: number | string } | null;
}

interface Order {
  billNumber: string;
  customerName?: string | null;
  createdAt: Date | string;
  totalAmount: number | string;
  orderItems?: OrderItem[];
  user?: { username: string } | null;
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
  cashPrice?: number | string;
  creditPrice?: number | string;
  nlc?: number | string;
  availableQty: number;
}

function formatCurrency(amount: number | string): string {
  return `${Number(amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;
}

function formatDate(date: Date | string): string {
  return new Date(date).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

function formatDateTime(date: Date | string): string {
  return new Date(date).toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

const BRAND = '#4F46E5';
const BRAND_LIGHT = '#E0E7FF';
const HEADER_ROW = '#F3F4F6';
const ROW_ALT = '#FAFAFA';
const TEXT_DARK = '#1F2937';
const TEXT_GREY = '#6B7280';
const BORDER_GREY = '#E5E7EB';
const WHITE = '#FFFFFF';

export async function generateBillPdf(order: Order, store: Store): Promise<Buffer> {
  return new Promise(async (resolve, reject) => {
    try {
      const doc = new PDFDocument({
        margin: 50,
        size: 'A4',
        autoFirstPage: true,
        bufferPages: true,
        compress: true,
      });

      const chunks: Buffer[] = [];
      doc.on('data', (chunk: Buffer) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      const PAGE_W = doc.page.width;
      const PAGE_H = doc.page.height;
      const MARGIN = 50;
      const CONTENT_W = PAGE_W - MARGIN * 2;
      const PAGE_BOTTOM = PAGE_H - MARGIN;
      const FOOTER_BLOCK_H = 32;

      // ── Fixed Company Header ──
      const HEADER_H = 108;
      doc.rect(0, 0, PAGE_W, HEADER_H).fill(BRAND);

      doc.fontSize(24)
        .font('Helvetica-Bold')
        .fillColor(WHITE)
        .text('GUNAV ENTERPRISES', MARGIN, 20, { align: 'center', width: CONTENT_W });

      doc.fontSize(11)
        .font('Helvetica')
        .fillColor(BRAND_LIGHT)
        .text('Latur, Maharashtra – 413512', MARGIN, 50, { align: 'center', width: CONTENT_W });

      doc.fontSize(10)
        .fillColor(BRAND_LIGHT)
        .text('Mobile: 7773931630', MARGIN, 68, { align: 'center', width: CONTENT_W });

      doc.fontSize(9.5)
        .fillColor(BRAND_LIGHT)
        .text('GSTIN: __________________', MARGIN, 84, { align: 'center', width: CONTENT_W });

      // ── Two Column Section: Bill Details & Bill To ──
      const TWO_COL_Y = HEADER_H + 14;
      const TWO_COL_H = 78;
      const COL_GAP = 12;
      const COL_W = (CONTENT_W - COL_GAP) / 2;

      // Left Column: Bill Details
      doc.roundedRect(MARGIN, TWO_COL_Y, COL_W, TWO_COL_H, 4).fill('#F9FAFB');
      doc.roundedRect(MARGIN, TWO_COL_Y, COL_W, TWO_COL_H, 4).stroke(BORDER_GREY);

      doc.fontSize(9)
        .font('Helvetica-Bold')
        .fillColor(TEXT_DARK)
        .text('Bill Details', MARGIN + 12, TWO_COL_Y + 10);

      const billFields = [
        { label: 'Bill No.', value: order.billNumber },
        { label: 'Date & Time', value: formatDateTime(order.createdAt) },
        { label: 'Salesperson', value: order.user?.username ?? '—' },
      ];

      billFields.forEach((field, i) => {
        const y = TWO_COL_Y + 30 + i * 16;
        doc.fontSize(7.5).font('Helvetica').fillColor(TEXT_GREY).text(field.label, MARGIN + 12, y);
        doc.fontSize(9).font('Helvetica-Bold').fillColor(TEXT_DARK).text(field.value, MARGIN + 12, y + 8, {
          width: COL_W - 24,
          ellipsis: true,
        });
      });

      // Right Column: Bill To (Store Information)
      const RIGHT_COL_X = MARGIN + COL_W + COL_GAP;
      doc.roundedRect(RIGHT_COL_X, TWO_COL_Y, COL_W, TWO_COL_H, 4).fill('#F9FAFB');
      doc.roundedRect(RIGHT_COL_X, TWO_COL_Y, COL_W, TWO_COL_H, 4).stroke(BORDER_GREY);

      doc.fontSize(9)
        .font('Helvetica-Bold')
        .fillColor(TEXT_DARK)
        .text('Bill To', RIGHT_COL_X + 12, TWO_COL_Y + 10);

      doc.fontSize(7.5).font('Helvetica').fillColor(TEXT_GREY).text('Store Name', RIGHT_COL_X + 12, TWO_COL_Y + 30);
      doc.fontSize(9).font('Helvetica-Bold').fillColor(TEXT_DARK).text(store.name, RIGHT_COL_X + 12, TWO_COL_Y + 38, {
        width: COL_W - 24,
        ellipsis: true,
      });

      doc.fontSize(7.5).font('Helvetica').fillColor(TEXT_GREY).text('Mobile Number', RIGHT_COL_X + 12, TWO_COL_Y + 54);
      doc.fontSize(9).font('Helvetica-Bold').fillColor(TEXT_DARK).text(store.mobile, RIGHT_COL_X + 12, TWO_COL_Y + 62);

      // ── Items table ──
      const TABLE_TOP = TWO_COL_Y + TWO_COL_H + 16;
      const TABLE_W = CONTENT_W;
      const IMG_SIZE = 34;

      const COL = {
        sno: 30,
        image: 48,
        product: 190,
        qty: 42,
        rate: 88,
        amount: TABLE_W - 30 - 48 - 190 - 42 - 88,
      };

      const X = {
        sno: MARGIN,
        image: MARGIN + COL.sno,
        product: MARGIN + COL.sno + COL.image,
        qty: MARGIN + COL.sno + COL.image + COL.product,
        rate: MARGIN + COL.sno + COL.image + COL.product + COL.qty,
        amount: MARGIN + COL.sno + COL.image + COL.product + COL.qty + COL.rate,
      };

      const HDR_H = 26;
      doc.roundedRect(MARGIN, TABLE_TOP, TABLE_W, HDR_H, 3).fill(HEADER_ROW);
      doc.fontSize(8.5).font('Helvetica-Bold').fillColor('#374151');
      doc.text('No.', X.sno, TABLE_TOP + 9, { width: COL.sno, align: 'center' });
      doc.text('Image', X.image, TABLE_TOP + 9, { width: COL.image, align: 'center' });
      doc.text('Item Name', X.product + 4, TABLE_TOP + 9, { width: COL.product - 8 });
      doc.text('Qty', X.qty, TABLE_TOP + 9, { width: COL.qty, align: 'center' });
      doc.text('Rate', X.rate, TABLE_TOP + 9, { width: COL.rate - 4, align: 'right' });
      doc.text('Amount', X.amount, TABLE_TOP + 9, { width: COL.amount - 4, align: 'right' });

      doc.font('Helvetica').fontSize(9);
      let curY = TABLE_TOP + HDR_H;
      let idx = 1;
      let subtotal = 0;
      const ROW_H = 46;
      const TOTALS_BLOCK_H = 52;

      const needsNewPage = (nextY: number, blockH: number) => nextY + blockH > PAGE_BOTTOM;

      for (const item of order.orderItems ?? []) {
        if (needsNewPage(curY, ROW_H)) {
          doc.addPage();
          curY = MARGIN;
        }

        if (idx % 2 === 0) {
          doc.rect(MARGIN, curY, TABLE_W, ROW_H).fill(ROW_ALT);
        }

        doc.strokeColor(BORDER_GREY).lineWidth(0.5)
          .moveTo(MARGIN, curY + ROW_H).lineTo(MARGIN + TABLE_W, curY + ROW_H).stroke();

        const textY = curY + 17;
        doc.fillColor(TEXT_DARK);
        doc.text(String(idx), X.sno, textY, { width: COL.sno, align: 'center' });

        const imgX = X.image + (COL.image - IMG_SIZE) / 2;
        const imgY = curY + (ROW_H - IMG_SIZE) / 2;
        const imageBuffer = await loadImageBuffer(item.product?.imageUrl, IMG_SIZE, 5);

        if (imageBuffer) {
          try {
            doc.image(imageBuffer, imgX, imgY, { width: IMG_SIZE, height: IMG_SIZE });
          } catch {
            doc.roundedRect(imgX, imgY, IMG_SIZE, IMG_SIZE, 5).stroke(BORDER_GREY);
          }
        } else {
          doc.roundedRect(imgX, imgY, IMG_SIZE, IMG_SIZE, 5).fill('#F3F4F6').stroke(BORDER_GREY);
        }

        doc.text(item.product?.modelName ?? 'N/A', X.product + 4, textY, {
          width: COL.product - 8,
          ellipsis: true,
        });
        doc.text(String(item.quantity), X.qty, textY, { width: COL.qty, align: 'center' });
        doc.text(formatCurrency(item.unitPrice), X.rate, textY, { width: COL.rate - 4, align: 'right' });
        doc.font('Helvetica-Bold')
          .text(formatCurrency(item.lineTotal), X.amount, textY, { width: COL.amount - 4, align: 'right' });
        doc.font('Helvetica');

        subtotal += Number(item.lineTotal);
        curY += ROW_H;
        idx++;
      }

      const totalsAndFooterH = TOTALS_BLOCK_H + FOOTER_BLOCK_H + 12;
      if (needsNewPage(curY, totalsAndFooterH)) {
        doc.addPage();
        curY = MARGIN;
      }

      const grandTotal = Number(order.totalAmount) > 0 ? Number(order.totalAmount) : subtotal;
      const showSubtotal = Math.abs(grandTotal - subtotal) > 0.01;

      const TOTALS_W = 240;
      const TOTALS_X = MARGIN + TABLE_W - TOTALS_W;
      let totalsY = curY + 14;

      if (showSubtotal) {
        doc.fontSize(9.5).font('Helvetica').fillColor(TEXT_GREY);
        doc.text('Subtotal', TOTALS_X, totalsY, { width: 110, lineBreak: false });
        doc.fillColor(TEXT_DARK)
          .text(formatCurrency(subtotal), TOTALS_X, totalsY, { width: TOTALS_W, align: 'right', lineBreak: false });
        totalsY += 20;
      }

      // Single prominent Grand Total row
      const GT_H = 38;
      doc.roundedRect(TOTALS_X, totalsY, TOTALS_W, GT_H, 5).fill(BRAND);
      doc.fontSize(12).font('Helvetica-Bold').fillColor(WHITE);
      doc.text('Grand Total', TOTALS_X + 14, totalsY + 12, { width: 110, lineBreak: false });
      doc.fontSize(14).text(formatCurrency(grandTotal), TOTALS_X + 14, totalsY + 11, {
        width: TOTALS_W - 28,
        align: 'right',
        lineBreak: false,
      });

      // Footer flows directly after totals — never forced to page bottom (avoids blank 2nd page)
      const footerY = totalsY + GT_H + 18;
      doc.fontSize(10)
        .font('Helvetica-Oblique')
        .fillColor(TEXT_GREY)
        .text('Thank you for your purchase!', MARGIN, footerY, {
          align: 'center',
          width: CONTENT_W,
          lineBreak: false,
        });

      doc.fontSize(7.5)
        .font('Helvetica')
        .text(
          'This is a computer-generated invoice and does not require a signature.',
          MARGIN,
          footerY + 14,
          { align: 'center', width: CONTENT_W, lineBreak: false }
        );

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
}

export function generateLedgerPdf(
  storeId: string,
  entries: LedgerEntryRow[],
  openingBalance: number,
  dateRange: { from: string; to: string }
): PDFKit.PDFDocument {
  const doc = new PDFDocument({ margin: 40, size: 'A4', layout: 'landscape', bufferPages: true });

  const PAGE_W = doc.page.width;
  const PAGE_H = doc.page.height;
  const MARGIN = 40;
  const CONTENT_W = PAGE_W - MARGIN * 2;

  doc.rect(0, 0, PAGE_W, 100).fill(BRAND);

  doc.fontSize(20).font('Helvetica-Bold').fillColor(WHITE)
    .text('Ledger Report', 0, 30, { align: 'center', width: PAGE_W });

  doc.fontSize(11).font('Helvetica').fillColor(BRAND_LIGHT)
    .text(
      dateRange.from && dateRange.to
        ? `Period: ${dateRange.from} to ${dateRange.to}`
        : 'All Entries',
      0,
      60,
      { align: 'center', width: PAGE_W }
    );

  doc.fillColor('#000000');
  doc.y = 120;

  const OB_Y = doc.y;
  doc.rect(MARGIN, OB_Y, 200, 36).fill(HEADER_ROW);
  doc.fontSize(9).font('Helvetica').fillColor(TEXT_GREY)
    .text('Opening Balance', MARGIN + 10, OB_Y + 8);
  doc.fontSize(13).font('Helvetica-Bold').fillColor('#111827')
    .text(formatCurrency(openingBalance), MARGIN + 10, OB_Y + 20);

  const TABLE_TOP = OB_Y + 50;
  const HDR_H = 28;

  doc.rect(MARGIN, TABLE_TOP, CONTENT_W, HDR_H).fill(HEADER_ROW);
  doc.font('Helvetica-Bold').fontSize(9).fillColor('#374151');

  const colY = TABLE_TOP + 9;
  doc.text('Date', MARGIN + 10, colY, { width: 80 });
  doc.text('Customer', MARGIN + 95, colY, { width: 150 });
  doc.text('Voucher', MARGIN + 250, colY, { width: 70 });
  doc.text('Bill/Receipt No.', MARGIN + 325, colY, { width: 100 });
  doc.text('Debit', MARGIN + 430, colY, { width: 90, align: 'right' });
  doc.text('Platinum', MARGIN + 525, colY, { width: 90, align: 'right' });
  doc.text('Balance', MARGIN + 620, colY, { width: 110, align: 'right' });

  doc.fillColor('#000000');
  let curY = TABLE_TOP + HDR_H;
  let rowIdx = 1;
  doc.font('Helvetica').fontSize(8);

  for (const entry of entries) {
    const ROW_H = 28;
    const isDebit = entry.voucherType === 'ORDER';

    if (rowIdx % 2 === 0) {
      doc.rect(MARGIN, curY, CONTENT_W, ROW_H).fill(ROW_ALT);
    }

    const ty = curY + 10;
    doc.fillColor(TEXT_DARK);
    doc.text(formatDate(entry.date), MARGIN + 10, ty, { width: 80 });
    doc.text(entry.customerName, MARGIN + 95, ty, { width: 150 });

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
      MARGIN,
      PAGE_H - 50,
      { align: 'center', width: CONTENT_W }
    );

  return doc;
}

interface ReceiptData {
  receiptNumber: string;
  amount: number | string;
  date: Date | string;
  createdAt?: Date | string;
  paymentMode?: string;
  store: {
    name: string;
    address: string;
    city: string;
    mobile: string;
    email: string;
  };
  user?: { username: string } | null;
  paymentMethod?: { name: string } | null;
}

export async function generateReceiptPdf(receipt: ReceiptData): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        margin: 50,
        size: [400, 560],
        autoFirstPage: true,
        bufferPages: true,
        compress: true,
      });

      const chunks: Buffer[] = [];
      doc.on('data', (chunk: Buffer) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      const PAGE_W = doc.page.width;
      const MARGIN = 40;
      const CONTENT_W = PAGE_W - MARGIN * 2;

      // ── Header ──
      const HEADER_H = 100;
      doc.rect(0, 0, PAGE_W, HEADER_H).fill(BRAND);

      doc.fontSize(18)
        .font('Helvetica-Bold')
        .fillColor(WHITE)
        .text(receipt.store.name, MARGIN, 20, { align: 'center', width: CONTENT_W });

      doc.fontSize(8.5)
        .font('Helvetica')
        .fillColor(BRAND_LIGHT)
        .text(`${receipt.store.address}, ${receipt.store.city}`, MARGIN, 46, { align: 'center', width: CONTENT_W })
        .text(`Mobile: ${receipt.store.mobile}  ·  ${receipt.store.email}`, MARGIN, 59, { align: 'center', width: CONTENT_W });

      // "PAYMENT RECEIPT" badge
      doc.fontSize(9).font('Helvetica-Bold').fillColor(WHITE)
        .text('PAYMENT RECEIPT', MARGIN, 76, { align: 'center', width: CONTENT_W });

      // ── Receipt Meta Box ──
      const META_Y = HEADER_H + 16;
      doc.roundedRect(MARGIN, META_Y, CONTENT_W, 54, 4).fill('#F9FAFB').stroke(BORDER_GREY);

      const metaLeft = [
        { label: 'Receipt No.', value: receipt.receiptNumber },
        { label: 'Operator', value: receipt.user?.username ?? '—' },
      ];
      const metaRight = [
        { label: 'Date', value: formatDate(receipt.date) },
        { label: 'Payment Method', value: receipt.paymentMethod?.name ?? receipt.paymentMode ?? '—' },
      ];

      const halfW = CONTENT_W / 2 - 10;
      metaLeft.forEach((f, i) => {
        const y = META_Y + 8 + i * 22;
        doc.fontSize(7.5).font('Helvetica').fillColor(TEXT_GREY).text(f.label, MARGIN + 10, y);
        doc.fontSize(9).font('Helvetica-Bold').fillColor(TEXT_DARK).text(f.value, MARGIN + 10, y + 10, { width: halfW });
      });
      metaRight.forEach((f, i) => {
        const y = META_Y + 8 + i * 22;
        const x = MARGIN + CONTENT_W / 2 + 4;
        doc.fontSize(7.5).font('Helvetica').fillColor(TEXT_GREY).text(f.label, x, y);
        doc.fontSize(9).font('Helvetica-Bold').fillColor(TEXT_DARK).text(f.value, x, y + 10, { width: halfW });
      });

      // ── Divider ──
      const DIV_Y = META_Y + 66;
      doc.strokeColor(BORDER_GREY).lineWidth(1)
        .moveTo(MARGIN, DIV_Y).lineTo(MARGIN + CONTENT_W, DIV_Y).stroke();

      // ── Amount Received Block ──
      const AMT_Y = DIV_Y + 16;
      doc.fontSize(9).font('Helvetica').fillColor(TEXT_GREY)
        .text('Amount Received', MARGIN, AMT_Y, { align: 'center', width: CONTENT_W });

      const amtBoxY = AMT_Y + 16;
      doc.roundedRect(MARGIN, amtBoxY, CONTENT_W, 56, 6).fill(BRAND);
      doc.fontSize(26).font('Helvetica-Bold').fillColor(WHITE)
        .text(`Rs. ${formatCurrency(receipt.amount)}`, MARGIN, amtBoxY + 14, { align: 'center', width: CONTENT_W });

      // ── Confirmation stamp ──
      const STAMP_Y = amtBoxY + 72;
      doc.roundedRect(MARGIN, STAMP_Y, CONTENT_W, 32, 4).fill('#ECFDF5');
      doc.fontSize(9.5).font('Helvetica-Bold').fillColor('#059669')
        .text('Payment Received Successfully', MARGIN, STAMP_Y + 10, { align: 'center', width: CONTENT_W });

      // ── Footer ──
      const FOOT_Y = STAMP_Y + 48;
      doc.strokeColor(BORDER_GREY).lineWidth(0.5)
        .moveTo(MARGIN, FOOT_Y).lineTo(MARGIN + CONTENT_W, FOOT_Y).stroke();

      doc.fontSize(8).font('Helvetica-Oblique').fillColor(TEXT_GREY)
        .text('Thank you for your payment!', MARGIN, FOOT_Y + 10, { align: 'center', width: CONTENT_W });

      doc.fontSize(7).font('Helvetica').fillColor(TEXT_GREY)
        .text('This is a computer-generated receipt and does not require a signature.', MARGIN, FOOT_Y + 24, {
          align: 'center',
          width: CONTENT_W,
        });

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
}

export function generateStockReportPdf(
  rows: ProductRow[],
  groupBy: string,
  _filters: Record<string, unknown>
): PDFKit.PDFDocument {
  const doc = new PDFDocument({ margin: 40, size: 'A4', layout: 'landscape', bufferPages: true });

  const PAGE_W = doc.page.width;
  const PAGE_H = doc.page.height;
  const MARGIN = 40;
  const CONTENT_W = PAGE_W - MARGIN * 2;

  doc.rect(0, 0, PAGE_W, 100).fill(BRAND);

  doc.fontSize(20).font('Helvetica-Bold').fillColor(WHITE)
    .text('Stock Report', 0, 30, { align: 'center', width: PAGE_W });

  doc.fontSize(11).font('Helvetica').fillColor(BRAND_LIGHT)
    .text(`Grouped by: ${groupBy.charAt(0).toUpperCase() + groupBy.slice(1)}`, 0, 60, { align: 'center', width: PAGE_W });

  doc.fillColor('#000000');
  doc.y = 120;

  const SB_Y = doc.y;
  doc.rect(MARGIN, SB_Y, 200, 36).fill(HEADER_ROW);
  doc.fontSize(9).font('Helvetica').fillColor(TEXT_GREY)
    .text('Total Products', MARGIN + 10, SB_Y + 8);
  doc.fontSize(13).font('Helvetica-Bold').fillColor('#111827')
    .text(String(rows.length), MARGIN + 10, SB_Y + 20);

  const TABLE_TOP = SB_Y + 50;
  const HDR_H = 28;

  doc.rect(MARGIN, TABLE_TOP, CONTENT_W, HDR_H).fill(HEADER_ROW);
  doc.font('Helvetica-Bold').fontSize(9).fillColor('#374151');

  const colY = TABLE_TOP + 9;
  doc.text('Model Name', MARGIN + 10, colY, { width: 220 });
  doc.text('Brand', MARGIN + 235, colY, { width: 100 });
  doc.text('Category', MARGIN + 340, colY, { width: 120 });
  doc.text('MRP', MARGIN + 465, colY, { width: 70, align: 'right' });
  doc.text('Gold Price', MARGIN + 540, colY, { width: 75, align: 'right' });
  doc.text('Platinum Price', MARGIN + 620, colY, { width: 75, align: 'right' });
  doc.text('Qty', MARGIN + 700, colY, { width: 30, align: 'right' });

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
    doc.text(row.modelName, MARGIN + 10, ty, { width: 220 });
    doc.text(row.brand?.name ?? '-', MARGIN + 235, ty, { width: 100 });
    doc.text(row.category?.name ?? '-', MARGIN + 340, ty, { width: 120 });
    doc.text(formatCurrency(row.mrp), MARGIN + 465, ty, { width: 70, align: 'right' });

    const cashPrice = row.cashPrice ?? row.nlc ?? 0;
    const creditPrice = row.creditPrice ?? row.nlc ?? 0;
    doc.text(formatCurrency(cashPrice), MARGIN + 540, ty, { width: 75, align: 'right' });
    doc.text(formatCurrency(creditPrice), MARGIN + 620, ty, { width: 75, align: 'right' });

    const qty = row.availableQty;
    doc.fillColor(qty < 5 ? '#DC2626' : qty < 10 ? '#F59E0B' : '#059669')
      .font('Helvetica-Bold')
      .text(String(qty), MARGIN + 700, ty, { width: 30, align: 'right' });
    doc.font('Helvetica');

    curY += ROW_H;
    rowIdx++;
  }

  doc.fontSize(8).fillColor(TEXT_GREY)
    .text(
      `Generated on ${new Date().toLocaleDateString('en-IN')}`,
      MARGIN,
      PAGE_H - 50,
      { align: 'center', width: CONTENT_W }
    );

  return doc;
}
