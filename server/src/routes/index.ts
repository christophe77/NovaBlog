import { Express } from 'express';
import { authRoutes } from './auth.js';
import { adminRoutes } from './admin.js';
import { publicRoutes } from './public.js';
import { setupRoutes as setupApiRoutes } from './setup.js';
import { requireAuth } from '../middleware/auth.js';

export function setupRoutes(app: Express): void {
  // Public routes
  app.use('/api', publicRoutes);
  
  // Setup routes (before auth check)
  app.use('/api/setup', setupApiRoutes);
  
  // Auth routes
  app.use('/api/auth', authRoutes);
  
  // Admin routes (protected)
  app.use('/api/admin', requireAuth, adminRoutes);
}

