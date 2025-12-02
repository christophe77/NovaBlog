# NovaBlog - AI-Powered Micro-blogging Platform

A micro-blogging platform that automatically publishes AI-generated articles (using Mistral) at configurable intervals, with a comprehensive admin interface and advanced configuration system.

## 🎯 Features

- **Automatic article generation**: Configurable automatic publication of AI-generated articles (e.g., 2 articles every 3 days)
- **Complete configuration**: Theme, content, SEO, language, company information
- **Admin interface**: Article management, settings, manual generation, homepage configuration
- **Configurable theme**: Design tokens via CSS variables, customizable from admin
- **Multi-language**: Support for multiple languages with AI generation in the configured language
- **SEO optimized**: Global and per-article keywords, configurable meta tags
- **Secure authentication**: Login/logout with password recovery
- **Setup wizard**: Guided initial configuration in multiple steps
- **Homepage customization**: Hero carousel, content sections with accordion, contact form
- **Lighthouse integration**: Performance, accessibility, best practices, and SEO scores in admin dashboard
- **Image upload**: Support for logo and article images with automatic optimization

## 🛠️ Tech Stack

- **Backend**: Node.js + Express (TypeScript)
- **Frontend**: React (TypeScript) with SSR via Express
- **Database**: SQLite (dev) or PostgreSQL (prod) via Prisma ORM
- **AI**: Mistral API (backend only)
- **Styling**: CSS with design tokens (CSS variables)
- **Build**: Vite for frontend
- **Performance**: Lighthouse integration for performance monitoring

## 📦 Installation

### Prerequisites

- Node.js 18+
- npm or yarn
- Mistral API key (get it at [mistral.ai](https://mistral.ai))
- Chrome/Chromium (for Lighthouse audits)

### Installation Steps

1. **Clone the repository**

```bash
git clone <repository-url>
cd NovaBlog
```

2. **Install dependencies**

```bash
npm install
```

3. **Configure environment variables**

Create a `.env` file at the root of the project:

```env
# Database
DATABASE_URL="file:./dev.db"

# For PostgreSQL in production:
# DATABASE_URL="postgresql://user:password@localhost:5432/NovaBlog?schema=public"

# Server
PORT=3000
NODE_ENV=development

# Session
SESSION_SECRET=change-this-to-a-random-secret-key-in-production

# Mistral AI
MISTRAL_API_KEY=your-mistral-api-key-here
MISTRAL_MODEL=mistral-large-latest
MISTRAL_BASE_URL=https://api.mistral.ai

# Timezone
TZ=Europe/Paris
```

4. **Initialize the database**

```bash
npm run db:generate
npm run db:migrate
```

5. **Create an admin account (optional)**

```bash
npm run setup
```

Or use the web wizard after the first launch.

6. **Run in development**

```bash
npm run dev
```

⚠️ **IMPORTANT**: In development, access the application via **http://localhost:5173** (not port 3000).

- **Frontend Vite**: `http://localhost:5173` (main entry point)
- **Backend API**: `http://localhost:3000/api` (automatically used via proxy)

The Vite frontend automatically proxies `/api` requests to the Express backend.

## 🚀 Production

### Build

```bash
npm run build
```

### Start

```bash
npm start
```

### PostgreSQL Configuration

To use PostgreSQL in production, modify `DATABASE_URL` in `.env`:

```env
DATABASE_URL="postgresql://user:password@localhost:5432/NovaBlog?schema=public"
```

And modify `prisma/schema.prisma` to use PostgreSQL:

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

Then regenerate the Prisma client:

```bash
npm run db:generate
npm run db:migrate
```

## 📋 Initial Configuration

On first launch, if no admin exists, you will be redirected to `/setup` to:

1. Choose the default language
2. Configure company information
3. Set up SEO
4. Customize the theme
5. Configure AI (Mistral model, tone, length)
6. Create the administrator account

## 🔧 Usage

### Automatic Article Generation

The scheduler runs automatically at configured intervals (default: 1 article every 3 days at 9:00 AM Europe/Paris). It:

1. Selects a topic from the configured list (automatic rotation)
2. Chooses keywords to include
3. Generates an article via Mistral with company context
4. Creates the article in `DRAFT` status for validation
5. Can generate multiple articles per interval (configurable in admin settings)

### Manual Generation

From the admin dashboard (`/admin`), click "Generate article now" or use the "Generate with AI" button when editing an article.

### Article Topic Configuration

In `/admin/settings` > "Blog" tab, add a list of topics (one per line). The scheduler will use these topics in rotation.

### Publication Interval Configuration

In `/admin/settings` > "AI" tab, configure:
- **Articles per interval**: Number of articles to generate (1-10)
- **Interval (days)**: Time period in days (1-30)

Example: 2 articles every 3 days, 5 articles every 2 days, etc.

### Theme Customization

In `/admin/settings` > "Theme" tab, modify colors via color pickers. Changes are applied immediately via CSS variables.

### Homepage Configuration

In `/admin/homepage`, configure:
- **Hero carousel**: Add slides with images and alt text
- **Content sections**: Add sections with title and content (displayed as accordion if content is long)
- **Sections title**: Optional title displayed before the sections list
- **Contact form**: Enable and configure contact form
- **SEO**: Configure homepage-specific SEO

## 📁 Project Structure

```
NovaBlog/
├── client/                 # Frontend React
│   ├── src/
│   │   ├── components/     # Reusable components
│   │   ├── pages/          # Application pages
│   │   ├── utils/          # Utilities (API, theme, etc.)
│   │   └── App.tsx         # React entry point
│   └── index.html
├── server/                 # Backend Express
│   ├── src/
│   │   ├── routes/         # API routes
│   │   ├── services/       # Services (Mistral, scheduler, lighthouse)
│   │   ├── middleware/    # Express middleware
│   │   ├── utils/          # Utilities
│   │   └── index.ts        # Server entry point
│   └── scripts/            # Utility scripts
├── prisma/
│   └── schema.prisma       # Database schema
├── package.json
└── README.md
```

## 🔐 Security

- HTTPOnly session authentication
- Rate limiting on auth and AI endpoints
- Strict payload validation with Zod
- Password hashing with bcrypt
- Mistral API key never exposed to frontend

## 🌍 Deployment

### With Docker (optional)

A `docker-compose.yml` file is provided to facilitate deployment with PostgreSQL:

```bash
docker-compose up -d
```

### Scheduler in Production

The scheduler uses `node-cron` which works well in development. For production, consider:

1. **System cron**: Configure a cron job that calls the `/api/admin/scheduler/generate-now` endpoint at configured intervals
2. **Cloud service**: Use a service like AWS EventBridge, Google Cloud Scheduler, or equivalent
3. **PM2 with cron**: Use PM2 with the `pm2-cron` module

Example system cron:

```bash
# Every 3 days at 9:00 AM
0 9 */3 * * curl -X POST http://localhost:3000/api/admin/scheduler/generate-now -H "Cookie: connect.sid=YOUR_SESSION_COOKIE"
```

## 🧪 Tests

```bash
npm test
```

## 📝 Available Scripts

- `npm run dev`: Run server and client in development mode
- `npm run build`: Build for production
- `npm start`: Run the application in production
- `npm run setup`: CLI initial configuration script
- `npm run db:migrate`: Run Prisma migrations
- `npm run db:generate`: Generate Prisma client
- `npm run db:studio`: Open Prisma Studio
- `npm run lint`: Lint the code
- `npm run format`: Format code with Prettier

## 🐛 Troubleshooting

### Database Connection Error

Check that `DATABASE_URL` is correctly configured in `.env` and that the database exists.

### Mistral API Error

Check that `MISTRAL_API_KEY` is valid and that you have available credits.

### Scheduler Not Working

Check server logs. The scheduler starts automatically if configuration is complete. You can trigger it manually from the admin dashboard.

### Lighthouse Audit Not Working

Make sure Chrome/Chromium is installed on the server. On some systems, you may need to install `google-chrome` or `chromium-browser`.

## 📄 License

MIT

## 🤝 Contributing

Contributions are welcome! Feel free to open an issue or pull request.

## 📧 Support

For any questions, open an issue on the repository.
