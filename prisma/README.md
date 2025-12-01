# Configuration de la base de données

## SQLite (par défaut)

Le schéma est configuré pour SQLite par défaut, ce qui est idéal pour le développement.

### Avantages
- Aucune installation requise
- Fichier de base de données local (`dev.db`)
- Parfait pour le développement et les tests

### Utilisation

Le schéma utilise des `String` au lieu d'enums et de types `@db.Text` pour la compatibilité SQLite.

## PostgreSQL (production)

Pour utiliser PostgreSQL en production, suivez ces étapes :

### 1. Modifier le schéma Prisma

Dans `prisma/schema.prisma`, remplacez :

```prisma
datasource db {
  provider = "sqlite"
  url      = env("DATABASE_URL")
}
```

Par :

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

### 2. Optionnel : Optimiser pour PostgreSQL

Si vous voulez utiliser les fonctionnalités PostgreSQL (enums, types Text), vous pouvez créer un schéma optimisé :

```prisma
model Article {
  // ...
  content     String        @db.Text  // PostgreSQL supporte @db.Text
  excerpt     String?       @db.Text
  seoDescription String?    @db.Text
  aiPrompt String?       @db.Text
  // ...
}
```

Et utiliser des enums :

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

### 3. Configurer la variable d'environnement

Dans `.env` :

```env
DATABASE_URL="postgresql://user:password@localhost:5432/innovlayer?schema=public"
```

### 4. Générer et migrer

```bash
npm run db:generate
npm run db:migrate
```

## Docker Compose

Un fichier `docker-compose.yml` est fourni pour démarrer PostgreSQL rapidement :

```bash
docker-compose up -d
```

Cela démarre PostgreSQL sur le port 5432 avec :
- User: `innovlayer`
- Password: `innovlayer_password`
- Database: `innovlayer`

## Migration de SQLite vers PostgreSQL

1. Exportez les données de SQLite (si vous en avez)
2. Configurez PostgreSQL
3. Modifiez le schéma Prisma
4. Exécutez les migrations
5. Importez les données si nécessaire

## Notes

- Le schéma actuel est compatible avec SQLite et PostgreSQL
- Les enums sont représentés comme des `String` pour la compatibilité SQLite
- Les types `@db.Text` sont omis pour SQLite mais peuvent être ajoutés pour PostgreSQL
- SQLite gère automatiquement les `String` comme `TEXT` pour les champs longs

