# Project Architecture

## Overview

NovaBlog is a full-stack TypeScript application with:

- **Backend**: Express.js with REST API
- **Frontend**: React with SSR (Server-Side Rendering)
- **Database**: Prisma ORM with SQLite/PostgreSQL support
- **AI**: Mistral API integration (backend only)
- **Performance**: Lighthouse integration for performance monitoring

## Folder Structure

```
NovaBlog/
├── client/                    # Frontend React
│   ├── src/
│   │   ├── components/       # Reusable components
│   │   │   ├── Layout.tsx
│   │   │   ├── Header.tsx
│   │   │   ├── Footer.tsx
│   │   │   └── RichTextEditor.tsx
│   │   ├── pages/            # Application pages
│   │   │   ├── HomePage.tsx
│   │   │   ├── BlogPage.tsx
│   │   │   ├── ArticlePage.tsx
│   │   │   ├── SetupPage.tsx
│   │   │   └── admin/         # Admin pages
│   │   │       ├── AdminDashboardPage.tsx
│   │   │       ├── AdminArticlesPage.tsx
│   │   │       ├── AdminArticleEditPage.tsx
│   │   │       ├── AdminSettingsPage.tsx
│   │   │       └── AdminHomepagePage.tsx
│   │   ├── utils/            # Utilities
│   │   │   ├── api.ts        # API client
│   │   │   └── theme.ts      # Theme management
│   │   ├── App.tsx           # React entry point
│   │   └── main.tsx          # React bootstrap
│   └── index.html
│
├── server/                    # Backend Express
│   ├── src/
│   │   ├── routes/           # API routes
│   │   │   ├── index.ts      # Route configuration
│   │   │   ├── auth.ts       # Authentication
│   │   │   ├── admin.ts      # Admin routes
│   │   │   ├── public.ts     # Public routes
│   │   │   └── setup.ts      # Setup wizard
│   │   ├── services/         # Business services
│   │   │   ├── mistral.ts    # Mistral AI service
│   │   │   ├── scheduler.ts  # Article scheduler
│   │   │   ├── lighthouse.ts # Lighthouse audit service
│   │   │   └── email.ts      # Email service
│   │   ├── middleware/       # Express middleware
│   │   │   ├── auth.ts       # Authentication
│   │   │   ├── errorHandler.ts
│   │   │   ├── rateLimit.ts
│   │   │   └── upload.ts     # File upload (multer)
│   │   ├── utils/            # Utilities
│   │   │   ├── password.ts
│   │   │   ├── slug.ts
│   │   │   ├── validation.ts
│   │   │   ├── setup.ts
│   │   │   └── defaultSettings.ts
│   │   ├── lib/              # Libraries
│   │   │   └── prisma.ts     # Prisma client
│   │   └── index.ts          # Server entry point
│   └── scripts/
│       └── setup.ts           # CLI setup script
│
└── prisma/
    └── schema.prisma          # Database schema
```

## Data Flow

### Automatic Article Generation

1. **Scheduler** (`server/src/services/scheduler.ts`)
   - Runs at configured intervals via `node-cron` (configurable: X articles every Y days)
   - Retrieves configuration (topics, keywords, company info, interval settings)
   - Generates multiple articles if configured (e.g., 2 articles every 3 days)
   - Calls `MistralService.generateArticle()` for each article
   - Creates articles in `DRAFT` status
   - Logs tasks in `ScheduledTask`

2. **Mistral Service** (`server/src/services/mistral.ts`)
   - Builds a prompt with context (company, theme, SEO)
   - Calls Mistral API
   - Parses JSON response
   - Returns structured article

### Authentication

1. **Login** (`POST /api/auth/login`)
   - Validates email/password with Zod
   - Verifies bcrypt hash
   - Creates Express session
   - Returns user info

2. **Route Protection**
   - `requireAuth` middleware checks session
   - `requireAdmin` middleware checks role

### Configuration

Settings are stored in the `Setting` table with:

- `key`: Unique key (e.g., `company.name`)
- `value`: JSON stringified value
- `category`: Category (company, theme, seo, ai, etc.)

### Homepage Configuration

Homepage settings are stored in a single `Setting` record with key `homepage.config`:

```json
{
  "heroCarousel": {
    "enabled": true,
    "slides": [
      {
        "id": "1",
        "image": "/uploads/homepage-image-xxx.webp",
        "alt": "Alt text"
      }
    ]
  },
  "sectionsTitle": "Our Activities",
  "sections": [
    {
      "id": "1",
      "title": "Section Title",
      "content": "<p>HTML content</p>"
    }
  ],
  "contact": {
    "enabled": true,
    "title": "Contact Us"
    // ... contact form configuration
  },
  "seo": {
    "title": "Homepage Title",
    "description": "Homepage description"
  }
}
```

### Lighthouse Integration

1. **Lighthouse Service** (`server/src/services/lighthouse.ts`)
   - Runs Lighthouse audits programmatically
   - Caches results for 1 hour
   - Launches Chrome in headless mode
   - Returns performance, accessibility, best practices, and SEO scores

2. **API Routes**
   - `POST /api/admin/lighthouse/audit`: Runs audit for a URL
   - `GET /api/admin/lighthouse/results`: Gets cached results

## Database

### Main Models

- **User**: Administrator accounts
- **Article**: Blog articles (AI-generated or manual)
- **Setting**: Global configuration (key/value)
- **ScheduledTask**: Scheduled task logs
- **PasswordResetToken**: Password reset tokens

### Migrations

```bash
npm run db:migrate  # Create/apply migrations
npm run db:generate # Generate Prisma client
```

## Security

1. **Authentication**
   - HTTPOnly sessions
   - bcrypt password hashing
   - Reset tokens with expiration

2. **Rate Limiting**
   - Auth: 5 attempts / 15 minutes
   - AI: 10 requests / hour

3. **Validation**
   - Zod for API payload validation
   - User input sanitization

4. **Mistral API Key**
   - Never exposed to frontend
   - Stored only in environment variable

## Theme and Design Tokens

Design tokens are stored in DB and applied via CSS variables:

```css
:root {
  --color-primary: #2563eb;
  --color-secondary: #10b981;
  /* ... */
}
```

Modified via `/admin/settings` > Theme, applied immediately.

## File Uploads

- Files are stored in `server/uploads/`
- Served statically via Express at `/uploads/`
- Supported types: images (logo, article images, homepage carousel)
- Automatic filename generation with timestamp and random suffix

## Deployment

### Development

```bash
npm run dev  # Run server + client (Vite dev server)
```

- Backend: `http://localhost:3000`
- Frontend: `http://localhost:5173` (proxies to API)

### Production

```bash
npm run build  # Build client + server
npm start      # Run Express server
```

- Express serves static files from client build
- Basic SSR (fallback to `index.html` for client routing)

### Scheduler in Production

The `node-cron` scheduler works in dev. For production, use:

- System cron
- Cloud service (AWS EventBridge, etc.)
- PM2 with cron

## Extensibility

The project is designed to be easily extensible:

1. **New roles**: Add values to `UserRole` enum in Prisma
2. **Multi-language articles**: Add `ArticleTranslation` table
3. **Tags/Categories**: Create corresponding Prisma models
4. **RSS**: Add `/api/rss.xml` route that generates feed
5. **Other AI models**: Modify `MistralService` or create generic service
6. **Additional homepage sections**: Extend `homepage.config` structure

## Tests

Planned test structure:

```
server/src/
├── __tests__/
│   ├── services/
│   │   ├── mistral.test.ts
│   │   └── lighthouse.test.ts
│   └── routes/
│       └── auth.test.ts
```

Use Vitest for unit and integration tests.
