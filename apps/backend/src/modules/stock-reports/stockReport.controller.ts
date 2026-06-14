import { Request, Response, NextFunction } from 'express';
import * as stockReportService from './stockReport.service';
import { generateStockReportPdf } from '../../utils/pdfGenerator';
import { generateStockReportExcel } from '../../utils/excelGenerator';

export async function getReport(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await stockReportService.getReport(req.query);
    res.json(result);
  } catch (e) { next(e); }
}

export async function exportPdf(req: Request, res: Response, next: NextFunction) {
  try {
    const rows = await stockReportService.getAllForExport(req.query);
    const doc = generateStockReportPdf(
      rows as unknown as Parameters<typeof generateStockReportPdf>[0],
      String(req.query.groupBy || 'brand'),
      req.query
    );
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename="stock-report.pdf"');
    doc.pipe(res);
    doc.end();
  } catch (e) { next(e); }
}

export async function exportExcel(req: Request, res: Response, next: NextFunction) {
  try {
    const rows = await stockReportService.getAllForExport(req.query);
    const buffer = await generateStockReportExcel(rows as unknown as Parameters<typeof generateStockReportExcel>[0]);
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename="stock-report.xlsx"');
    res.send(buffer);
  } catch (e) { next(e); }
}
