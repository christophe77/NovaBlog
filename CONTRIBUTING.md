# Guide de contribution

Merci de votre intérêt pour contribuer à InnovLayer !

## Structure du projet

- `/server` : Backend Express (TypeScript)
- `/client` : Frontend React (TypeScript)
- `/prisma` : Schéma de base de données

## Développement

1. Fork le projet
2. Créez une branche pour votre fonctionnalité (`git checkout -b feature/ma-fonctionnalite`)
3. Committez vos changements (`git commit -m 'Ajout de ma fonctionnalité'`)
4. Push vers la branche (`git push origin feature/ma-fonctionnalite`)
5. Ouvrez une Pull Request

## Standards de code

- Utilisez TypeScript partout
- Suivez les règles ESLint et Prettier configurées
- Écrivez des tests pour les nouvelles fonctionnalités
- Documentez votre code

## Tests

Avant de soumettre une PR, assurez-vous que :

- Les tests passent : `npm test`
- Le linting est OK : `npm run lint`
- Le code est formaté : `npm run format`

## Questions

Pour toute question, ouvrez une issue sur le repository.

