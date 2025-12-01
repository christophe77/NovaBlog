# Architecture du projet

## Vue d'ensemble

InnovLayer est une application full-stack TypeScript avec :
- **Backend** : Express.js avec API REST
- **Frontend** : React avec SSR (Server-Side Rendering)
- **Base de données** : Prisma ORM avec support SQLite/PostgreSQL
- **IA** : Intégration Mistral API (backend uniquement)

## Structure des dossiers

```
innovlayer/
├── client/                    # Frontend React
│   ├── src/
│   │   ├── components/       # Composants réutilisables
│   │   │   ├── Layout.tsx
│   │   │   ├── Header.tsx
│   │   │   └── Footer.tsx
│   │   ├── pages/            # Pages de l'application
│   │   │   ├── HomePage.tsx
│   │   │   ├── BlogPage.tsx
│   │   │   ├── ArticlePage.tsx
│   │   │   ├── SetupPage.tsx
│   │   │   └── admin/         # Pages admin
│   │   ├── utils/            # Utilitaires
│   │   │   ├── api.ts        # Client API
│   │   │   └── theme.ts      # Gestion du thème
│   │   ├── App.tsx           # Point d'entrée React
│   │   └── main.tsx          # Bootstrap React
│   └── index.html
│
├── server/                    # Backend Express
│   ├── src/
│   │   ├── routes/           # Routes API
│   │   │   ├── index.ts      # Configuration des routes
│   │   │   ├── auth.ts       # Authentification
│   │   │   ├── admin.ts      # Routes admin
│   │   │   ├── public.ts     # Routes publiques
│   │   │   └── setup.ts      # Setup wizard
│   │   ├── services/         # Services métier
│   │   │   ├── mistral.ts    # Service Mistral IA
│   │   │   └── scheduler.ts  # Scheduler articles
│   │   ├── middleware/       # Middleware Express
│   │   │   ├── auth.ts       # Authentification
│   │   │   ├── errorHandler.ts
│   │   │   └── rateLimit.ts
│   │   ├── utils/            # Utilitaires
│   │   │   ├── password.ts
│   │   │   ├── slug.ts
│   │   │   ├── validation.ts
│   │   │   └── setup.ts
│   │   ├── lib/              # Bibliothèques
│   │   │   └── prisma.ts     # Client Prisma
│   │   └── index.ts          # Point d'entrée serveur
│   └── scripts/
│       └── setup.ts           # Script CLI setup
│
└── prisma/
    └── schema.prisma          # Schéma de base de données
```

## Flux de données

### Génération automatique d'articles

1. **Scheduler** (`server/src/services/scheduler.ts`)
   - S'exécute tous les 3 jours via `node-cron`
   - Récupère la configuration (sujets, mots-clés, infos entreprise)
   - Appelle `MistralService.generateArticle()`
   - Crée un article en statut `DRAFT`
   - Log la tâche dans `ScheduledTask`

2. **Service Mistral** (`server/src/services/mistral.ts`)
   - Construit un prompt avec contexte (entreprise, thème, SEO)
   - Appelle l'API Mistral
   - Parse la réponse JSON
   - Retourne un article structuré

### Authentification

1. **Login** (`POST /api/auth/login`)
   - Valide email/password avec Zod
   - Vérifie le hash bcrypt
   - Crée une session Express
   - Retourne les infos utilisateur

2. **Protection des routes**
   - Middleware `requireAuth` vérifie la session
   - Middleware `requireAdmin` vérifie le rôle

### Configuration

Les paramètres sont stockés dans la table `Setting` avec :
- `key` : Clé unique (ex: `company.name`)
- `value` : Valeur JSON stringifiée
- `category` : Catégorie (company, theme, seo, etc.)

## Base de données

### Modèles principaux

- **User** : Comptes administrateurs
- **Article** : Articles du blog (générés IA ou manuels)
- **Setting** : Configuration globale (clé/valeur)
- **ScheduledTask** : Logs des tâches planifiées
- **PasswordResetToken** : Tokens de réinitialisation

### Migrations

```bash
npm run db:migrate  # Crée/applique les migrations
npm run db:generate # Génère le client Prisma
```

## Sécurité

1. **Authentification**
   - Sessions HTTPOnly
   - Hash bcrypt pour les mots de passe
   - Tokens de reset avec expiration

2. **Rate Limiting**
   - Auth : 5 tentatives / 15 minutes
   - IA : 10 requêtes / heure

3. **Validation**
   - Zod pour valider les payloads API
   - Sanitization des entrées utilisateur

4. **Clé API Mistral**
   - Jamais exposée au frontend
   - Stockée uniquement en variable d'environnement

## Thème et Design Tokens

Les design tokens sont stockés en DB et appliqués via CSS variables :

```css
:root {
  --color-primary: #2563eb;
  --color-secondary: #10b981;
  /* ... */
}
```

Modification via `/admin/settings` > Thème, appliquée immédiatement.

## Déploiement

### Développement

```bash
npm run dev  # Lance server + client (Vite dev server)
```

- Backend : `http://localhost:3000`
- Frontend : `http://localhost:5173` (proxy vers API)

### Production

```bash
npm run build  # Build client + server
npm start      # Lance le serveur Express
```

- Express sert les fichiers statiques du build client
- SSR basique (fallback vers `index.html` pour le routing client)

### Scheduler en production

Le scheduler `node-cron` fonctionne en dev. Pour la prod, utilisez :
- Cron système
- Service cloud (AWS EventBridge, etc.)
- PM2 avec cron

## Extensibilité

Le projet est conçu pour être facilement extensible :

1. **Nouveaux rôles** : Ajoutez des valeurs à l'enum `UserRole` dans Prisma
2. **Multi-langue articles** : Ajoutez une table `ArticleTranslation`
3. **Tags/Catégories** : Créez les modèles Prisma correspondants
4. **RSS** : Ajoutez une route `/api/rss.xml` qui génère le flux
5. **Autres modèles IA** : Modifiez `MistralService` ou créez un service générique

## Tests

Structure prévue pour les tests :

```
server/src/
├── __tests__/
│   ├── services/
│   │   └── mistral.test.ts
│   └── routes/
│       └── auth.test.ts
```

Utilisez Vitest pour les tests unitaires et d'intégration.

