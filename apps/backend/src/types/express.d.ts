import { Role, OperatorType } from '@prisma/client';

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        role: Role;
        operatorType?: OperatorType | null;
      };
    }
  }
}

export {};
