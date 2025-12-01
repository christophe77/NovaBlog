import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import session from 'express-session';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { startScheduler } from './services/scheduler.js';
import { setupRoutes } from './routes/index.js';
import { errorHandler } from './middleware/errorHandler.js';
import { isSetupComplete } from './utils/setup.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// In development with tsx, __dirname points to server/src
// In production, it points to server/dist
// We need to resolve the uploads directory relative to the project root
const projectRoot = path.join(__dirname, '../..');
const uploadsPath = path.resolve(projectRoot, 'uploads');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? process.env.FRONTEND_URL 
    : 'http://localhost:5173',
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(
  session({
    secret: process.env.SESSION_SECRET || 'change-this-secret',
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
      sameSite: 'lax',
    },
  })
);

// Serve static files
// Uploads directory (for logos, etc.)
console.log('📁 Serving uploads from:', uploadsPath);
app.use('/uploads', express.static(uploadsPath));

// Serve static files in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../../dist/client')));
}

// API routes
setupRoutes(app);

// SSR routes (after API routes)
// In development, Vite dev server handles frontend routing
// In production, serve the built React app
if (process.env.NODE_ENV === 'production') {
  // Serve static files
  app.use(express.static(path.join(__dirname, '../../dist/client')));
  
  // Fallback to index.html for client-side routing
  app.get('*', (req, res) => {
    // Don't serve HTML for API routes
    if (req.path.startsWith('/api')) {
      return res.status(404).json({ error: { message: 'Not found' } });
    }
    res.sendFile(path.join(__dirname, '../../dist/client/index.html'));
  });
}
// In development, only handle API routes - Vite handles frontend

// Error handler
app.use(errorHandler);

// Start server
app.listen(PORT, async () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  
  // Check if setup is needed
  const setupComplete = await isSetupComplete();
  if (!setupComplete) {
    console.log('⚠️  Setup not complete. Please visit /setup to configure the platform.');
  } else {
    // Start scheduler for automatic article generation
    startScheduler();
    console.log('✅ Scheduler started');
  }
});

