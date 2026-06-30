import { Request, Response, NextFunction } from 'express';

/**
 * Middleware to enforce module-level permissions for OPERATOR users.
 * ADMIN users always pass through.
 * OPERATORs must have the required permission in their permissions array.
 */
export function authorizePermission(permission: string) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    // Admins have unrestricted access to all modules
    if (req.user.role === 'ADMIN') {
      next();
      return;
    }

    // Operators must have the specific permission
    if (!req.user.permissions.includes(permission)) {
      res.status(403).json({ error: `Access denied: missing permission "${permission}"` });
      return;
    }

    next();
  };
}
