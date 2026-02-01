# CLAUDE.md - Guide pour les modifications futures

## 🎯 Vue d'ensemble du projet

Application Next.js complète pour simuler une stratégie DCA (Dollar Cost Averaging) sur Bitcoin et Ethereum. Le projet est **terminé et fonctionnel**.

## 🏗️ Architecture

### Stack utilisée

- **Framework**: Next.js 16 (App Router)
- **Styling**: Tailwind CSS
- **Charting**: Recharts
- **UI**: Lucide React (icônes)
- **API**: CoinGecko (gratuite)

### Structure des fichiers

```text
app/
├── api/crypto-prices/route.ts    # API endpoint pour CoinGecko
├── page.tsx                        # Page principale (state + logique)
├── layout.tsx                      # Layout global
└── globals.css                     # Styles Tailwind

components/
├── Sidebar/                        # Contrôles d'entrée
│   ├── CryptoSelector.tsx
│   ├── InputField.tsx
│   ├── DatePicker.tsx
│   └── CalculateButton.tsx
├── Summary/                        # Affichage des résultats
│   ├── SummaryCard.tsx
│   └── MetricDisplay.tsx
└── Chart/                          # Visualisation
    └── DCAChart.tsx

lib/
├── dcaCalculator.ts               # Logique DCA + métriques
├── priceApi.ts                    # Appels API CoinGecko
└── utils.ts                       # Utilitaires (validation, formatage)

types/
└── index.ts                       # Types TypeScript
```

## 🔑 Points clés du code

### Composant principal (`app/page.tsx`)

- Gère tout le state (crypto, montants, dates, résultats)
- Orchestre le flux: validation → fetch API → calcul → affichage
- État loading et erreurs bien gérés

### Calcul DCA (`lib/dcaCalculator.ts`)

- Investissement initial + ajouts mensuels
- Accumulation mensuelle des crypto
- Calcul du ROI et des métriques
- **Note**: Utilise la date la plus proche si pas d'exactitude

### API Route (`app/api/crypto-prices/route.ts`)

- Proxie vers CoinGecko API
- Caching 1h pour éviter les rate limits
- Validation des paramètres

## 🎨 Design & Styling

- **Theme**: Dark mode (slate-950) avec accents crypto
- **BTC**: Orange (#f97316)
- **ETH**: Purple (#a855f7)
- **Responsive**: Sidebar sticky sur desktop, flex sur mobile/tablet
- **Classes Tailwind**: Tous les styles utilisent Tailwind (pas de CSS personnalisé)

## 📝 Conventions du projet

### Types & Interfaces

```typescript
// Toujours utiliser les types définis dans types/index.ts
import { CryptoType, FormInputs, CalculationResult } from '@/types';

// Types locaux aux composants avec le suffixe Props
interface InputFieldProps { ... }
```

### Composants

- **Client components**: Ajouter `'use client'` en haut
- **Props bien typées**: Toujours créer une interface Props
- **Noms**: PascalCase pour composants, camelCase pour variables

### Imports

```typescript
// Alias d'import
import { Component } from '@/components/Folder/Component';
import { someFunction } from '@/lib/file';
import { Type } from '@/types';
```

## 🚀 Démarrage local

```bash
# Installation (déjà faite)
npm install

# Dev server
npm run dev

# Build
npm run build

# Production
npm start
```

## 🧪 Domaines à améliorer (optionnel)

### Performance

- [ ] Memoization des composants coûteux
- [ ] Lazy loading du Chart
- [ ] Optimisation des re-renders

### UX/UI

- [ ] Animations Framer Motion
- [ ] Loading skeletons plus sophistiqués
- [ ] Tooltips avec explications

### Fonctionnalités

- [ ] Export PDF/CSV
- [ ] Comparaison multi-crypto
- [ ] Sauvegarde des scénarios
- [ ] Mode sombre/clair toggle

### Testing

- [ ] Tests unitaires (Jest)
- [ ] Tests E2E (Cypress/Playwright)
- [ ] Tests des calculs DCA

## 🐛 Erreurs courantes à éviter

### ❌ À ne pas faire

1. Modifier les types sans update partout
2. Ajouter du CSS personnalisé (utiliser Tailwind)
3. Ajouter des dépendances sans nécessité
4. Oublier `'use client'` sur les composants interactifs
5. Ignorer les validations d'input

### ✅ À faire

1. Maintenir la cohérence TypeScript stricte
2. Réutiliser les types et interfaces
3. Tester avec différentes plages de dates
4. Gérer les states d'erreur et loading
5. Documenter les changes complexes

## 📚 Ressources utiles

- [Next.js Documentation](https://nextjs.org/docs)
- [Tailwind CSS](https://tailwindcss.com)
- [Recharts Documentation](https://recharts.org)
- [CoinGecko API](https://www.coingecko.com/api/documentations/v3)
- [Lucide Icons](https://lucide.dev)

## 🤝 Notes pour les modifications futures

Quand tu modifier le code:

1. **Garde la structure existante** - Ne refactor pas sans raison
2. **Types first** - Update types/index.ts si tu ajoutes nouvelles données
3. **Test les calculs** - Vérifiez que le DCA donne des résultats logiques
4. **Responsive checking** - Teste desktop, tablet, mobile
5. **API caching** - Respecte les rate limits de CoinGecko
6. **Error handling** - Toujours prévoir les cas d'erreur

## ✅ Checklist avant commit

- [ ] TypeScript strict (no `any`)
- [ ] Pas de console.log de debug
- [ ] Components responsifs testés
- [ ] Types à jour
- [ ] Build successful (`npm run build`)
- [ ] Pas de warnings non intentionnels
