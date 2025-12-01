import { Request, Response, NextFunction } from 'express';

export interface AuthRequest extends Request {
  userId?: string;
  user?: {
    id: string;
    email: string;
    role: string;
  };
}

export function requireAuth(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void {
  if (!req.session?.userId) {
    res.status(401).json({ error: { message: 'Authentication required' } });
    return;
  }

  req.userId = req.session.userId;
  next();
}

export function requireAdmin(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void {
  if (!req.session?.userId || req.session.role !== 'ADMIN') {
    res.status(403).json({ error: { message: 'Admin access required' } });
    return;
  }

  req.userId = req.session.userId;
  next();
}

