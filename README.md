# InnovLayer - Plateforme de Micro-blogging avec IA

Plateforme de micro-blogging qui publie automatiquement des articles générés par IA (Mistral) tous les 3 jours, avec une interface d'administration complète et un système de configuration avancé.

## 🎯 Fonctionnalités

- **Génération automatique d'articles** : Publication automatique d'articles générés par IA tous les 3 jours
- **Configuration complète** : Thème, contenu, SEO, langue, informations entreprise
- **Interface admin** : Gestion des articles, paramètres, génération manuelle
- **Thème configurable** : Design tokens via CSS variables, personnalisable depuis l'admin
- **Multi-langue** : Support de plusieurs langues avec génération IA dans la langue configurée
- **SEO optimisé** : Mots-clés globaux et par article, meta tags configurables
- **Authentification sécurisée** : Login/logout avec récupération de mot de passe
- **Wizard de setup** : Configuration initiale guidée en plusieurs étapes

## 🛠️ Stack Technique

- **Backend** : Node.js + Express (TypeScript)
- **Frontend** : React (TypeScript) avec SSR via Express
- **Base de données** : SQLite (dev) ou PostgreSQL (prod) via Prisma ORM
- **IA** : Mistral API (intégration backend uniquement)
- **Styling** : CSS avec design tokens (CSS variables)
- **Build** : Vite pour le frontend

## 📦 Installation

### Prérequis

- Node.js 18+ 
- npm ou yarn
- Clé API Mistral (obtenez-la sur [mistral.ai](https://mistral.ai))

### Étapes d'installation

1. **Cloner le repository**

```bash
git clone <repository-url>
cd innovlayer
```

2. **Installer les dépendances**

```bash
npm install
```

3. **Configurer les variables d'environnement**

Créez un fichier `.env` à la racine du projet :

```env
# Database
DATABASE_URL="file:./dev.db"

# Pour PostgreSQL en production:
# DATABASE_URL="postgresql://user:password@localhost:5432/innovlayer?schema=public"

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

4. **Initialiser la base de données**

```bash
npm run db:generate
npm run db:migrate
```

5. **Créer un compte admin (optionnel)**

```bash
npm run setup
```

Ou utilisez le wizard web après le premier lancement.

6. **Lancer en développement**

```bash
npm run dev
```

⚠️ **IMPORTANT** : En développement, accédez à l'application via **http://localhost:5173** (pas le port 3000).

- **Frontend Vite** : `http://localhost:5173` (point d'entrée principal)
- **Backend API** : `http://localhost:3000/api` (utilisé automatiquement via proxy)

Le frontend Vite proxy automatiquement les requêtes `/api` vers le backend Express.

## 🚀 Production

### Build

```bash
npm run build
```

### Démarrage

```bash
npm start
```

### Configuration PostgreSQL

Pour utiliser PostgreSQL en production, modifiez `DATABASE_URL` dans `.env` :

```env
DATABASE_URL="postgresql://user:password@localhost:5432/innovlayer?schema=public"
```

Et modifiez `prisma/schema.prisma` pour utiliser PostgreSQL :

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

Puis régénérez le client Prisma :

```bash
npm run db:generate
npm run db:migrate
```

## 📋 Configuration initiale

Au premier lancement, si aucun admin n'existe, vous serez redirigé vers `/setup` pour :

1. Choisir la langue par défaut
2. Configurer les informations de l'entreprise
3. Paramétrer le SEO
4. Personnaliser le thème
5. Configurer l'IA (modèle Mistral, ton, longueur)
6. Créer le compte administrateur

## 🔧 Utilisation

### Génération automatique d'articles

Le scheduler s'exécute automatiquement tous les 3 jours à 9h00 (Europe/Paris). Il :

1. Sélectionne un sujet dans la liste configurée (rotation automatique)
2. Choisit des mots-clés à intégrer
3. Génère un article via Mistral avec le contexte de l'entreprise
4. Crée l'article en statut `DRAFT` pour validation

### Génération manuelle

Depuis le dashboard admin (`/admin`), cliquez sur "Générer un article maintenant" ou utilisez le bouton "Générer avec IA" lors de l'édition d'un article.

### Configuration des sujets d'articles

Dans `/admin/settings` > onglet "Blog", ajoutez une liste de sujets (un par ligne). Le scheduler utilisera ces sujets en rotation.

### Personnalisation du thème

Dans `/admin/settings` > onglet "Thème", modifiez les couleurs via les sélecteurs de couleur. Les changements sont appliqués immédiatement via les CSS variables.

## 📁 Structure du projet

```
innovlayer/
├── client/                 # Frontend React
│   ├── src/
│   │   ├── components/     # Composants réutilisables
│   │   ├── pages/          # Pages de l'application
│   │   ├── utils/          # Utilitaires (API, theme, etc.)
│   │   └── App.tsx         # Point d'entrée React
│   └── index.html
├── server/                 # Backend Express
│   ├── src/
│   │   ├── routes/         # Routes API
│   │   ├── services/       # Services (Mistral, scheduler)
│   │   ├── middleware/    # Middleware Express
│   │   ├── utils/          # Utilitaires
│   │   └── index.ts        # Point d'entrée serveur
│   └── scripts/            # Scripts utilitaires
├── prisma/
│   └── schema.prisma       # Schéma de base de données
├── package.json
└── README.md
```

## 🔐 Sécurité

- Authentification par session HTTPOnly
- Rate limiting sur les endpoints d'auth et d'IA
- Validation stricte des payloads avec Zod
- Hash des mots de passe avec bcrypt
- Clé API Mistral jamais exposée au frontend

## 🌍 Déploiement

### Avec Docker (optionnel)

Un fichier `docker-compose.yml` est fourni pour faciliter le déploiement avec PostgreSQL :

```bash
docker-compose up -d
```

### Scheduler en production

Le scheduler utilise `node-cron` qui fonctionne bien en développement. Pour la production, considérez :

1. **Cron système** : Configurez un cron job qui appelle l'endpoint `/api/admin/scheduler/generate-now` tous les 3 jours
2. **Service cloud** : Utilisez un service comme AWS EventBridge, Google Cloud Scheduler, ou équivalent
3. **PM2 avec cron** : Utilisez PM2 avec le module `pm2-cron`

Exemple de cron système :

```bash
# Tous les 3 jours à 9h00
0 9 */3 * * curl -X POST http://localhost:3000/api/admin/scheduler/generate-now -H "Cookie: connect.sid=YOUR_SESSION_COOKIE"
```

## 🧪 Tests

```bash
npm test
```

## 📝 Scripts disponibles

- `npm run dev` : Lance le serveur et le client en mode développement
- `npm run build` : Build pour la production
- `npm start` : Lance l'application en production
- `npm run setup` : Script CLI de configuration initiale
- `npm run db:migrate` : Exécute les migrations Prisma
- `npm run db:generate` : Génère le client Prisma
- `npm run db:studio` : Ouvre Prisma Studio
- `npm run lint` : Lint le code
- `npm run format` : Formate le code avec Prettier

## 🐛 Dépannage

### Erreur de connexion à la base de données

Vérifiez que `DATABASE_URL` est correctement configuré dans `.env` et que la base de données existe.

### Erreur Mistral API

Vérifiez que `MISTRAL_API_KEY` est valide et que vous avez des crédits disponibles.

### Le scheduler ne fonctionne pas

Vérifiez les logs du serveur. Le scheduler démarre automatiquement si la configuration est complète. Vous pouvez déclencher manuellement depuis le dashboard admin.

## 📄 Licence

MIT

## 🤝 Contribution

Les contributions sont les bienvenues ! N'hésitez pas à ouvrir une issue ou une pull request.

## 📧 Support

Pour toute question, ouvrez une issue sur le repository.

