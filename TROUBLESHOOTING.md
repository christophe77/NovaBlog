# Troubleshooting Guide

## Problem: 404 Error on http://localhost:5173

### Solution 1: Restart Servers

1. **Stop all servers** (Ctrl+C in terminals)
2. **Restart**:
   ```bash
   npm run dev
   ```

### Solution 2: Check Vite Configuration

The `vite.config.ts` file must have:
```typescript
root: './client', // Point Vite to client folder
```

### Solution 3: Check File Structure

Make sure you have:
```
client/
  ├── index.html
  └── src/
      ├── main.tsx
      └── App.tsx
```

### Solution 4: Clean and Reinstall

If the problem persists:

```bash
# Stop all Node processes
# On Windows PowerShell:
Get-Process node | Stop-Process -Force

# Clean
rm -rf node_modules
rm -rf dist
rm -rf .vite

# Reinstall
npm install

# Relaunch
npm run dev
```

### Solution 5: Check Ports

Check that ports are not in use:

```bash
# Windows PowerShell
netstat -ano | findstr :5173
netstat -ano | findstr :3000
```

If ports are in use, kill the processes or change ports in:
- `vite.config.ts` (port 5173)
- `.env` (PORT=3000)

## Problem: API Connection Error

### Checks

1. Is the backend running? (You should see "🚀 Server running on http://localhost:3000")
2. Is the Vite proxy configured? (Check `vite.config.ts`)
3. Do API requests use `/api`? (Check `client/src/utils/api.ts`)

### Manual Test

Open http://localhost:3000/api/setup/status in your browser. You should see:
```json
{"setupComplete": false}
```

If it doesn't work, the backend has a problem.

## Problem: Database Error

### Checks

1. Does the `.env` file exist?
2. Is `DATABASE_URL` correct?
3. Have migrations been run?

### Reset Database

```bash
# Delete database (SQLite)
rm dev.db
rm dev.db-journal

# Regenerate and migrate
npm run db:generate
npm run db:migrate
```

## Problem: Setup Not Working

1. Check browser console (F12)
2. Check backend server logs
3. Check that database is initialized
4. Check that `MISTRAL_API_KEY` is configured (even if you're not generating articles right away)

## Problem: Lighthouse Audit Not Working

1. **Chrome/Chromium not installed**: Install Chrome or Chromium on your system
   - Windows: Download from [google.com/chrome](https://www.google.com/chrome)
   - Linux: `sudo apt-get install chromium-browser` or `sudo apt-get install google-chrome-stable`
   - macOS: `brew install --cask google-chrome`

2. **Chrome not found**: Lighthouse tries to find Chrome automatically. If it fails:
   - Make sure Chrome is in your PATH
   - Or set `CHROME_PATH` environment variable

3. **Permission errors**: On Linux, you may need to run with appropriate permissions

## Problem: Image Upload Not Working

1. **Check uploads directory**: Make sure `server/uploads/` exists and is writable
2. **Check file permissions**: The server needs write access to the uploads directory
3. **Check file size**: Default limit is 5MB per file
4. **Check file type**: Only image files are allowed

## Problem: Scheduler Not Running

1. **Check configuration**: Make sure topics are configured in `/admin/settings` > Blog tab
2. **Check logs**: Check server logs for scheduler messages
3. **Check timezone**: Scheduler uses `TZ` environment variable (default: Europe/Paris)
4. **Manual trigger**: Use "Generate article now" button in admin dashboard to test

## Useful Logs

### Backend

Backend logs show:
- Prisma queries (if `NODE_ENV=development`)
- Server errors
- Scheduler startup
- Lighthouse audit results

### Frontend

Open browser console (F12) to see:
- JavaScript errors
- API requests
- Routing errors

## Diagnostic Commands

```bash
# Check configuration
npm run db:generate

# See migrations
npm run db:migrate

# Open Prisma Studio (DB interface)
npm run db:studio

# Check linting
npm run lint

# Format code
npm run format
```

## Common Issues

### Port Already in Use

```bash
# Find process using port (Windows)
netstat -ano | findstr :5173
netstat -ano | findstr :3000

# Kill process (replace PID with actual process ID)
taskkill /PID <PID> /F
```

### Module Not Found Errors

```bash
# Clean install
rm -rf node_modules package-lock.json
npm install
```

### Prisma Client Not Generated

```bash
npm run db:generate
```

### Build Errors

```bash
# Clean build
rm -rf dist
rm -rf node_modules/.vite
npm run build
```
