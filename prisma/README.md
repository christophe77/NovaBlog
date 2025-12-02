# Database Configuration

## SQLite (Default)

The schema is configured for SQLite by default, which is ideal for development.

### Advantages

- No installation required
- Local database file (`dev.db`)
- Perfect for development and testing

### Usage

The schema uses `String` instead of enums and `@db.Text` types for SQLite compatibility.

## PostgreSQL (Production)

To use PostgreSQL in production, follow these steps:

### 1. Modify Prisma Schema

In `prisma/schema.prisma`, replace:

```prisma
datasource db {
  provider = "sqlite"
  url      = env("DATABASE_URL")
}
```

With:

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

### 2. Optional: Optimize for PostgreSQL

If you want to use PostgreSQL features (enums, Text types), you can create an optimized schema:

```prisma
model Article {
  // ...
  content     String        @db.Text  // PostgreSQL supports @db.Text
  excerpt     String?       @db.Text
  seoDescription String?    @db.Text
  aiPrompt String?       @db.Text
  // ...
}
```

And use enums:

```prisma
enum ArticleStatus {
  DRAFT
  PUBLISHED
  SCHEDULED
}

model Article {
  // ...
  status      ArticleStatus @default(DRAFT)
  // ...
}
```

### 3. Configure Environment Variable

In `.env`:

```env
DATABASE_URL="postgresql://user:password@localhost:5432/NovaBlog?schema=public"
```

### 4. Generate and Migrate

```bash
npm run db:generate
npm run db:migrate
```

## Docker Compose

A `docker-compose.yml` file is provided to quickly start PostgreSQL:

```bash
docker-compose up -d
```

This starts PostgreSQL on port 5432 with:

- User: `NovaBlog`
- Password: `NovaBlog_password`
- Database: `NovaBlog`

## Migration from SQLite to PostgreSQL

1. Export SQLite data (if you have any)
2. Configure PostgreSQL
3. Modify Prisma schema
4. Run migrations
5. Import data if necessary

## Notes

- Current schema is compatible with SQLite and PostgreSQL
- Enums are represented as `String` for SQLite compatibility
- `@db.Text` types are omitted for SQLite but can be added for PostgreSQL
- SQLite automatically handles `String` as `TEXT` for long fields
