/**
 * exportUtils.ts
 * Shared utilities for exporting data to Excel (.xlsx) and PDF.
 * Uses: xlsx (SheetJS) for Excel, jspdf + jspdf-autotable for PDF.
 */

import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

// ── Types ────────────────────────────────────────────────────────────────────

export interface ExportColumn {
  /** Header label shown in the exported file */
  header: string;
  /** Key or accessor function to extract the value from each row */
  accessor: string | ((row: Record<string, unknown>) => string | number | null | undefined);
  /** Optional width hint for Excel columns (in characters) */
  width?: number;
}

// ── Excel Export ─────────────────────────────────────────────────────────────

/**
 * Export an array of records to an XLSX file and trigger a browser download.
 * @param data    Array of row objects
 * @param columns Column definitions
 * @param filename Desired filename (without extension)
 */
export function exportToExcel(
  data: Record<string, unknown>[],
  columns: ExportColumn[],
  filename: string,
): void {
  // Build header row
  const headers = columns.map((c) => c.header);

  // Build data rows
  const rows = data.map((row) =>
    columns.map((col) => {
      if (typeof col.accessor === 'function') {
        return col.accessor(row) ?? '';
      }
      const keys = col.accessor.split('.');
      let val: unknown = row;
      for (const key of keys) {
        val = (val as Record<string, unknown>)?.[key];
        if (val === undefined || val === null) break;
      }
      return val ?? '';
    }),
  );

  // Create workbook
  const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);

  // Set column widths
  ws['!cols'] = columns.map((c) => ({ wch: c.width ?? 18 }));

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Data');
  XLSX.writeFile(wb, `${filename}.xlsx`);
}

// ── PDF Export ───────────────────────────────────────────────────────────────

export interface PdfExportOptions {
  /** Title printed at the top of the PDF */
  title: string;
  /** Optional subtitle / description line */
  subtitle?: string;
  /** Filename without extension */
  filename: string;
  /** Orientation: portrait or landscape */
  orientation?: 'portrait' | 'landscape';
}

/**
 * Export an array of records to a PDF file and trigger a browser download.
 */
export function exportToPdf(
  data: Record<string, unknown>[],
  columns: ExportColumn[],
  options: PdfExportOptions,
): void {
  const { title, subtitle, filename, orientation = 'portrait' } = options;

  const doc = new jsPDF({ orientation, unit: 'mm', format: 'a4' });

  // ── Header ──
  const pageWidth = doc.internal.pageSize.getWidth();

  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text(title, pageWidth / 2, 16, { align: 'center' });

  if (subtitle) {
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100);
    doc.text(subtitle, pageWidth / 2, 22, { align: 'center' });
    doc.setTextColor(0);
  }

  const generatedOn = `Generated: ${new Date().toLocaleString('en-IN')}`;
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(130);
  doc.text(generatedOn, pageWidth - 14, 12, { align: 'right' });
  doc.setTextColor(0);

  // ── Table ──
  const head = [columns.map((c) => c.header)];
  const body = data.map((row) =>
    columns.map((col) => {
      if (typeof col.accessor === 'function') {
        return String(col.accessor(row) ?? '');
      }
      const keys = col.accessor.split('.');
      let val: unknown = row;
      for (const key of keys) {
        val = (val as Record<string, unknown>)?.[key];
        if (val === undefined || val === null) break;
      }
      return String(val ?? '');
    }),
  );

  autoTable(doc, {
    head,
    body,
    startY: subtitle ? 28 : 22,
    styles: { fontSize: 8, cellPadding: 2.5 },
    headStyles: {
      fillColor: [79, 70, 229],
      textColor: 255,
      fontStyle: 'bold',
      fontSize: 8,
    },
    alternateRowStyles: { fillColor: [245, 245, 255] },
    margin: { left: 10, right: 10 },
    didDrawPage: (data) => {
      // Footer with page number
      const pageCount = (doc as unknown as { internal: { getNumberOfPages: () => number } }).internal.getNumberOfPages();
      doc.setFontSize(7);
      doc.setTextColor(150);
      doc.text(
        `Page ${data.pageNumber} of ${pageCount}`,
        pageWidth / 2,
        doc.internal.pageSize.getHeight() - 6,
        { align: 'center' },
      );
      doc.setTextColor(0);
    },
  });

  doc.save(`${filename}.pdf`);
}
