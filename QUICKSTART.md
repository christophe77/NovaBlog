# Quick Start Guide

## 🚀 Development Startup

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment

Create a `.env` file at the root:

```env
DATABASE_URL="file:./dev.db"
PORT=3000
NODE_ENV=development
SESSION_SECRET=change-this-secret-key
MISTRAL_API_KEY=your-mistral-api-key
MISTRAL_MODEL=mistral-large-latest
TZ=Europe/Paris
```

### 3. Initialize Database

```bash
npm run db:generate
npm run db:migrate
```

### 4. Launch Application

```bash
npm run dev
```

This launches:
- **Express Backend** on `http://localhost:3000`
- **Vite Frontend** on `http://localhost:5173`

### 5. Access the Application

⚠️ **IMPORTANT**: In development, access the application via:

**http://localhost:5173** (not port 3000!)

Port 3000 is only for the backend API. Vite (port 5173) handles the frontend and proxies `/api` requests to the backend.

### 6. Initial Configuration

On first access, you will be redirected to `/setup` to:
1. Choose language
2. Configure company information
3. Set up SEO
4. Customize theme
5. Configure AI
6. Create admin account

## 🔧 Troubleshooting

### Port 5173 Not Responding

1. Check that Vite is running (you should see "VITE v5.x.x ready")
2. Access `http://localhost:5173` (not `http://localhost:3000`)
3. Check that no other process is using port 5173

### API Connection Error

1. Check that the backend is running on port 3000
2. Check browser console for CORS errors
3. Check that Vite proxy is working (see `vite.config.ts`)

### Database Error

1. Check that `DATABASE_URL` is correct in `.env`
2. Run `npm run db:migrate` to create tables
3. Check that `dev.db` file exists (for SQLite)

### Setup Not Working

1. Check that the database is initialized
2. Check backend server logs
3. Check browser console for errors

## 📝 Useful Commands

```bash
# Development
npm run dev              # Run server + client

# Database
npm run db:generate      # Generate Prisma client
npm run db:migrate       # Run migrations
npm run db:studio        # Open Prisma Studio

# Production Build
npm run build           # Build client + server
npm start               # Run in production

# Utilities
npm run lint            # Lint code
npm run format          # Format code
```

## 🌐 Important URLs

- **Frontend (dev)**: http://localhost:5173
- **Backend API**: http://localhost:3000/api
- **Admin**: http://localhost:5173/admin
- **Setup**: http://localhost:5173/setup

## ⚠️ Important Notes

- In development, **always use port 5173** to access the application
- Port 3000 only serves the backend API
- Vite automatically proxies `/api` requests to the backend
- Sessions and cookies work thanks to `credentials: 'include'` in API requests
