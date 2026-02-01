# PLAN.md - Calculateur DCA Crypto (ETH/BTC)

## 🎯 Vue d'ensemble

Application Next.js de simulation d'investissement DCA (Dollar Cost Averaging) pour Ethereum et Bitcoin avec visualisation graphique des performances.

## 📋 Stack Technique

### Core

- **Framework**: Next.js 16 (App Router)
- **Styling**: Tailwind CSS
- **Charting**: Recharts (recommandé pour Next.js/React)
- **API Prix**: CoinGecko API (gratuite, limite raisonnable)

### Librairies supplémentaires

- `date-fns` : manipulation des dates
- `lucide-react` : icônes
- `react-hook-form` : gestion des formulaires
- `shad/cn` : ui components
- `framer-motion` : animation du chart

## 🏗️ Architecture de l'application

```
app/
├── page.tsx                 # Page principale
├── layout.tsx              # Layout global
├── globals.css             # Styles Tailwind
└── api/
    └── crypto-prices/
        └── route.ts        # API route pour fetcher les prix

components/
├── Sidebar/
│   ├── CryptoSelector.tsx  # Toggle ETH/BTC
│   ├── InputField.tsx      # Composant input réutilisable
│   ├── DatePicker.tsx      # Sélecteur de dates
│   └── CalculateButton.tsx # Bouton de calcul
├── Summary/
│   ├── SummaryCard.tsx     # Carte récapitulative
│   └── MetricDisplay.tsx   # Affichage d'une métrique
└── Chart/
    └── DCAChart.tsx        # Graphique principal

lib/
├── dcaCalculator.ts        # Logique de calcul DCA
├── priceApi.ts            # Interactions avec l'API
└── utils.ts               # Fonctions utilitaires

types/
└── index.ts               # Types TypeScript
```

## 🎨 Design & UX

### Layout
```
┌─────────────────────────────────────────┐
│  Header (Logo + Titre)                  │
├──────────┬──────────────────────────────┤
│          │                              │
│ SIDEBAR  │     MAIN CONTENT             │
│  (350px) │                              │
│          │   ┌──────────────────────┐   │
│ [Inputs] │   │   Summary Cards      │   │
│          │   │   (3 métriques)      │   │
│ [Dates]  │   └──────────────────────┘   │
│          │                              │
│ [Calc]   │   ┌──────────────────────┐   │
│          │   │                      │   │
│          │   │   Chart (Recharts)   │   │
│          │   │                      │   │
│          │   └──────────────────────┘   │
│          │                              │
└──────────┴──────────────────────────────┘
```

### Palette de couleurs (suggestion)

- **Background**: `bg-slate-950` (fond sombre crypto-style)
- **Sidebar**: `bg-slate-900`
- **Cards**: `bg-slate-800/50`
- **Accents ETH**: `text-purple-400`, `border-purple-500`
- **Accents BTC**: `text-orange-400`, `border-orange-500`
- **Text**: `text-slate-100`, `text-slate-400`

## 📝 Composants détaillés

### Sidebar (composants)

#### 1. CryptoSelector

```typescript
- Toggle button ETH/BTC
- État actif visible
- Icônes crypto
```

#### 2. Inputs

```typescript
- Initial Capital (€)
  - Min: 0, Step: 100
  - Icon: Euro
  
- Monthly Addition (€)
  - Min: 0, Step: 10
  - Icon: Calendar
```

#### 3. DatePicker

```typescript
- Date de début
  - Max: aujourd'hui
  - Default: 1 an en arrière
  
- Date de fin
  - Max: aujourd'hui
  - Min: date de début
  - Default: aujourd'hui
```

#### 4. CalculateButton

```typescript
- Large, coloré
- Loading state pendant le fetch
- Disabled si données invalides
```

### Summary Cards

#### Métriques à afficher

```typescript
1. Capital Total Final
   - Valeur actuelle du portefeuille
   - Badge de variation (+/- %)
   
2. Capital Investi
   - Somme totale investie
   
3. Performance
   - Gain/Perte en € et %
   - Couleur conditionnelle (vert/rouge)
```

### Chart Component

#### Type de graphique

- **Line Chart** (Recharts)
- 2 lignes :
  1. Valeur du portefeuille (ligne principale)
  2. Capital investi cumulé (ligne de référence)

#### Features

- Tooltip au survol
- Légende
- Grid subtile
- Responsive
- Gradient fill sous la ligne principale

## 🔧 Logique de calcul

### Algorithme DCA

```typescript
interface DCAResult {
  dates: Date[];
  portfolioValues: number[];
  investedCapital: number[];
  cryptoQuantity: number[];
  prices: number[];
}

function calculateDCA(
  initialCapital: number,
  monthlyAddition: number,
  startDate: Date,
  endDate: Date,
  historicalPrices: PriceData[]
): DCAResult
```

#### Étapes

1. Générer les dates mensuelles (startDate → endDate)
2. Pour chaque date :
   - Fetch prix du crypto
   - Calculer quantité achetée
   - Cumuler la quantité totale
   - Calculer valeur portfolio actuelle
   - Cumuler capital investi

3. Calculer métriques finales :
   - Total investi
   - Valeur finale
   - ROI = ((valeur finale - total investi) / total investi) × 100

## 🌐 API Integration

### CoinGecko API

#### Endpoint

```
GET /api/v3/coins/{id}/market_chart/range
```

#### Paramètres

- `id`: bitcoin | ethereum
- `vs_currency`: eur
- `from`: timestamp Unix (début)
- `to`: timestamp Unix (fin)

#### Rate Limits

- Gratuit: 10-50 calls/minute
- Stratégie: Cache côté serveur (API Route Next.js)

### Structure API Route

```typescript
// app/api/crypto-prices/route.ts
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const crypto = searchParams.get('crypto');
  const from = searchParams.get('from');
  const to = searchParams.get('to');
  
  // Fetch CoinGecko
  // Transform data
  // Return JSON
}
```

## 📊 Types TypeScript

```typescript
type CryptoType = 'bitcoin' | 'ethereum';

interface FormInputs {
  crypto: CryptoType;
  initialCapital: number;
  monthlyAddition: number;
  startDate: Date;
  endDate: Date;
}

interface PriceData {
  timestamp: number;
  price: number;
}

interface CalculationResult {
  totalInvested: number;
  finalValue: number;
  roi: number;
  roiPercentage: number;
  chartData: ChartDataPoint[];
}

interface ChartDataPoint {
  date: string;
  portfolioValue: number;
  investedCapital: number;
}
```

## ✨ Features UX/UI

### Micro-interactions

- Hover states sur tous les boutons
- Transition smooth sur le changement ETH/BTC
- Loading skeleton pendant le calcul
- Animation d'apparition des résultats
- Tooltip informatifs (icône ⓘ)

### Responsive

- Desktop: Sidebar fixe à gauche
- Tablet: Sidebar collapse possible
- Mobile: Sidebar en drawer/modal

### Validation

- Dates cohérentes (début < fin)
- Montants positifs
- Messages d'erreur clairs
- Désactivation du bouton si invalide

## 🚀 Roadmap de développement

### Phase 1: Setup ✅ COMPLÉTÉE

- [x] Init Next.js + Tailwind
- [x] Structure des dossiers
- [x] Types TypeScript

### Phase 2: UI Components ✅ COMPLÉTÉE

- [x] Sidebar + inputs (CryptoSelector, InputField, DatePicker, CalculateButton)
- [x] Summary cards (SummaryCard, MetricDisplay)
- [x] Chart component (DCAChart avec Recharts)

### Phase 3: Logique ✅ COMPLÉTÉE

- [x] API route CoinGecko (crypto-prices/route.ts)
- [x] Calcul DCA (dcaCalculator.ts)
- [x] Intégration données → chart (priceApi.ts, utils.ts)

### Phase 4: Integration ✅ COMPLÉTÉE

- [x] Intégration composants dans page.tsx
- [x] Layout global et styling Tailwind
- [x] State management et logique principale
- [x] Validation des inputs et gestion d'erreurs
- [x] Build et vérification

**Statut: PROJET TERMINÉ** ✅

## 📦 Fichiers créés/modifiés

### Types

- `types/index.ts` - Tous les types TypeScript

### Components

- `components/Sidebar/CryptoSelector.tsx`
- `components/Sidebar/InputField.tsx`
- `components/Sidebar/DatePicker.tsx`
- `components/Sidebar/CalculateButton.tsx`
- `components/Summary/SummaryCard.tsx`
- `components/Summary/MetricDisplay.tsx`
- `components/Chart/DCAChart.tsx`

### Libraries/Utilities

- `lib/dcaCalculator.ts`
- `lib/priceApi.ts`
- `lib/utils.ts`

### API & App

- `app/api/crypto-prices/route.ts`
- `app/page.tsx` (page principale avec state management)
- `app/layout.tsx` (layout global)

## 🎯 Prochaines étapes (optionnelles)

- [ ] Tests unitaires
- [ ] Optimisations de performance
- [ ] Animations avancées avec Framer Motion
- [ ] Export des résultats (PDF/CSV)
- [ ] Dark/Light mode toggle
- [ ] PWA (Progressive Web App)
