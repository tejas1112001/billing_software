import { Request, Response, NextFunction } from 'express';
import * as adminService from './admin.service';

export async function resetData(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    await adminService.resetAllData();
    res.json({ 
      success: true, 
      message: 'All data reset successfully (User table preserved)' 
    });
  } catch (error) {
    next(error);
  }
}
