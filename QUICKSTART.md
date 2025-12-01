# Guide de démarrage rapide

## 🚀 Démarrage en développement

### 1. Installer les dépendances

```bash
npm install
```

### 2. Configurer l'environnement

Créez un fichier `.env` à la racine :

```env
DATABASE_URL="file:./dev.db"
PORT=3000
NODE_ENV=development
SESSION_SECRET=change-this-secret-key
MISTRAL_API_KEY=votre-cle-api-mistral
MISTRAL_MODEL=mistral-large-latest
TZ=Europe/Paris
```

### 3. Initialiser la base de données

```bash
npm run db:generate
npm run db:migrate
```

### 4. Lancer l'application

```bash
npm run dev
```

Cela lance :
- **Backend Express** sur `http://localhost:3000`
- **Frontend Vite** sur `http://localhost:5173`

### 5. Accéder à l'application

⚠️ **IMPORTANT** : En développement, accédez à l'application via :

**http://localhost:5173** (pas le port 3000 !)

Le port 3000 est uniquement pour l'API backend. Vite (port 5173) gère le frontend et proxy les requêtes `/api` vers le backend.

### 6. Configuration initiale

Au premier accès, vous serez redirigé vers `/setup` pour :
1. Choisir la langue
2. Configurer l'entreprise
3. Paramétrer le SEO
4. Personnaliser le thème
5. Configurer l'IA
6. Créer le compte admin

## 🔧 Dépannage

### Le port 5173 ne répond pas

1. Vérifiez que Vite est bien lancé (vous devriez voir "VITE v5.x.x ready")
2. Accédez à `http://localhost:5173` (pas `http://localhost:3000`)
3. Vérifiez qu'aucun autre processus n'utilise le port 5173

### Erreur de connexion à l'API

1. Vérifiez que le backend est lancé sur le port 3000
2. Vérifiez la console du navigateur pour les erreurs CORS
3. Vérifiez que le proxy Vite fonctionne (voir `vite.config.ts`)

### Erreur de base de données

1. Vérifiez que `DATABASE_URL` est correct dans `.env`
2. Exécutez `npm run db:migrate` pour créer les tables
3. Vérifiez que le fichier `dev.db` existe (pour SQLite)

### Le setup ne fonctionne pas

1. Vérifiez que la base de données est initialisée
2. Vérifiez les logs du serveur backend
3. Vérifiez la console du navigateur pour les erreurs

## 📝 Commandes utiles

```bash
# Développement
npm run dev              # Lance server + client

# Base de données
npm run db:generate      # Génère le client Prisma
npm run db:migrate       # Exécute les migrations
npm run db:studio        # Ouvre Prisma Studio

# Build production
npm run build           # Build client + server
npm start               # Lance en production

# Utilitaires
npm run lint            # Lint le code
npm run format          # Formate le code
```

## 🌐 URLs importantes

- **Frontend (dev)** : http://localhost:5173
- **Backend API** : http://localhost:3000/api
- **Admin** : http://localhost:5173/admin
- **Setup** : http://localhost:5173/setup

## ⚠️ Notes importantes

- En développement, **toujours utiliser le port 5173** pour accéder à l'application
- Le port 3000 sert uniquement l'API backend
- Vite proxy automatiquement les requêtes `/api` vers le backend
- Les sessions et cookies fonctionnent grâce à `credentials: 'include'` dans les requêtes API

