# Guide de dépannage

## Problème : Erreur 404 sur http://localhost:5173

### Solution 1 : Redémarrer les serveurs

1. **Arrêtez tous les serveurs** (Ctrl+C dans les terminaux)
2. **Redémarrez** :
   ```bash
   npm run dev
   ```

### Solution 2 : Vérifier la configuration Vite

Le fichier `vite.config.ts` doit avoir :
```typescript
root: './client', // Point Vite vers le dossier client
```

### Solution 3 : Vérifier la structure des fichiers

Assurez-vous que vous avez :
```
client/
  ├── index.html
  └── src/
      ├── main.tsx
      └── App.tsx
```

### Solution 4 : Nettoyer et réinstaller

Si le problème persiste :

```bash
# Arrêter tous les processus Node
# Sur Windows PowerShell :
Get-Process node | Stop-Process -Force

# Nettoyer
rm -rf node_modules
rm -rf dist
rm -rf .vite

# Réinstaller
npm install

# Relancer
npm run dev
```

### Solution 5 : Vérifier les ports

Vérifiez que les ports ne sont pas utilisés :

```bash
# Windows PowerShell
netstat -ano | findstr :5173
netstat -ano | findstr :3000
```

Si les ports sont utilisés, tuez les processus ou changez les ports dans :
- `vite.config.ts` (port 5173)
- `.env` (PORT=3000)

## Problème : Erreur de connexion à l'API

### Vérifications

1. Le backend est-il lancé ? (Vous devriez voir "🚀 Server running on http://localhost:3000")
2. Le proxy Vite est-il configuré ? (Vérifiez `vite.config.ts`)
3. Les requêtes API utilisent-elles `/api` ? (Vérifiez `client/src/utils/api.ts`)

### Test manuel

Ouvrez http://localhost:3000/api/setup/status dans votre navigateur. Vous devriez voir :
```json
{"setupComplete": false}
```

Si ça ne fonctionne pas, le backend a un problème.

## Problème : Erreur de base de données

### Vérifications

1. Le fichier `.env` existe-t-il ?
2. `DATABASE_URL` est-il correct ?
3. Les migrations ont-elles été exécutées ?

### Réinitialiser la base de données

```bash
# Supprimer la base (SQLite)
rm dev.db
rm dev.db-journal

# Régénérer et migrer
npm run db:generate
npm run db:migrate
```

## Problème : Le setup ne fonctionne pas

1. Vérifiez la console du navigateur (F12)
2. Vérifiez les logs du serveur backend
3. Vérifiez que la base de données est initialisée
4. Vérifiez que `MISTRAL_API_KEY` est configuré (même si vous ne générez pas d'articles tout de suite)

## Logs utiles

### Backend
Les logs du backend montrent :
- Les requêtes Prisma (si `NODE_ENV=development`)
- Les erreurs serveur
- Le démarrage du scheduler

### Frontend
Ouvrez la console du navigateur (F12) pour voir :
- Les erreurs JavaScript
- Les requêtes API
- Les erreurs de routing

## Commandes de diagnostic

```bash
# Vérifier la configuration
npm run db:generate

# Voir les migrations
npm run db:migrate

# Ouvrir Prisma Studio (interface DB)
npm run db:studio

# Vérifier le linting
npm run lint

# Formater le code
npm run format
```

