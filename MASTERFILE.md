# EIS · Energy Intelligence System · Master file

Single map of the **whole project**: what it is, where it lives locally, where it lives on GitHub, how it is deployed, and how the product is structured.

Educational sample path. Not an IRP, not SCADA, not legal GIS.

---

## Identity

| | |
|---|---|
| **Name** | Energy Intelligence System (EIS) |
| **Live** | https://eis.davidtphung.com |
| **Author** | [David T Phung](https://x.com/davidtphung) |
| **Built with** | [Grok Build 4.6](https://x.ai/build) (`grok-4.6`) |
| **License** | Private / internal unless otherwise specified |
| **Package** | `energy-intelligence-system` `1.0.0` |

---

## Where it lives

### Local (this machine)

| | |
|---|---|
| **Workspace / worktree** | `/Users/davidtphung/.grok/worktrees/davidtphung/moreenergycapacity-v1` |
| **Git branch** | `cei-os-main` |
| **Tracks** | `energy/main` |

Run from that directory:

```bash
npm install
npm run dev      # Vite, typically http://localhost:5173
npm run build    # tsc -b && vite build
npm run preview
npm run lint     # oxlint
```

### GitHub

| | |
|---|---|
| **Canonical repo** | https://github.com/davidtphung/california-energy-intelligence-os |
| **Git remote** | `energy` → `https://github.com/davidtphung/california-energy-intelligence-os.git` |
| **Published branch** | `main` on `energy` |
| **Do not push EIS here** | `origin` is `https://github.com/davidtphung/dotfiles.git` (dotfiles, not this app) |

```bash
git push energy HEAD:main
```

### Production (Vercel)

| | |
|---|---|
| **Project** | `california-energy-intelligence-os` (david-t-phungs-projects) |
| **Alias** | https://eis.davidtphung.com |
| **Typical preview host** | `california-energy-intelligence-*.vercel.app` |
| **Config** | `vercel.json` (CAISO rewrite + live cache headers) |
| **API** | `api/views.js` (view counter via Abacus) |

```bash
npx vercel --prod --yes
```

---

## What the product is

Browser workspace for **US energy intelligence**, map-first:

1. Live electrical map (simulated national graph + real CAISO pull)
2. Demand drivers: AI / data centers, population, industrial manufacturing, private vs public capital
3. All-source supply / demand / deficit (gas, coal, nuclear, oil, solar, wind, hydro, battery, geothermal, biomass)
4. Grid division: Eastern / Western / Texas interconnects, ISO/RTO coverage outlines, utilities, interties
5. How much each **state** and **utility** buys, dependence, isolation risk
6. Construction pipeline and future firm-capacity deficits
7. USA catalog, plant portfolios, fossil history, thesis library (Got Gas and related), About / donate

Figures are educational samples scaled to EIA / ISO / operator public ranges.

---

## Primary navigation

Rail (hash in the URL):

| Label | Hash | View |
|-------|------|------|
| Map | `#map` | `GridMapApp` |
| Demand | `#demand` | `DemandForecastMap` |
| Balance | `#balance` | `AllSourcesBalanceMap` (`#sources` alias) |
| USA | `#states` | `StatesCatalogPanel` |
| Assets | `#portfolios` | `PortfoliosPanel` |
| Fuels | `#fossil` | `FossilFuelsPanel` (`#gas` alias) |
| Thesis | `#thesis` | `ThesisLibraryPanel` (`#research` alias) |
| About | `#about` | About / How / Sources / Donate |

Hash-only (not on the rail):

| Hash | View |
|------|------|
| `#policy` | Policy timeline |
| `#scenario` / `#scenarios` | Scenario planner |
| `#consistency` | Source consistency |
| `#data` | Data engineering |
| `#dev` | Developer panel |
| `#state/XX` | State detail |

### Map lenses (inside Map)

1. Live grid  
2. Demand  
3. All sources  
4. Grid / risk (interconnects, zone outlines, utilities, buys, dependence, risk)  
5. Construction  
6. Future deficits  

---

## Stack

- React 19 + TypeScript
- Vite 8
- Tailwind CSS 4 (`src/index.css`)
- Recharts
- Lucide
- Vercel (SPA + `/api/views` + `/api/live/caiso` rewrite)

---

## Refresh rates

Source of truth: `src/data/refreshRates.ts`

| Feed | Rate |
|------|------|
| Map stream (simulated national graph) | 0.8 s |
| CAISO Today's Outlook + weather | 15 s when tab open, 90 s when hidden |
| Edge cache `/api/live/*` | `s-maxage=10`, SWR 20 s |
| Scrub playback | 400 ms |
| Demand / Balance / USA / Assets / Fuels / Thesis | On deploy only |

CAISO via same-origin `/api/live/caiso/*` (Vite proxy in dev, Vercel rewrite in prod). Optional EIA: `VITE_EIA_API_KEY`.

---

## Repository layout

```
moreenergycapacity-v1/
  MASTERFILE.md          ← this file
  README.md              ← short start guide
  package.json
  vite.config.ts         ← /api/live/caiso proxy
  vercel.json            ← CAISO rewrite + cache
  index.html
  api/views.js           ← session view counter
  public/                ← favicons, OG, manifest
  src/
    App.tsx              ← view router
    main.tsx
    index.css
    types/index.ts
    context/             ← App + view counter
    hooks/               ← useLiveGrid, useViewCounter
    lib/                 ← csv, export, utils
    grid/                ← live stream topology + metrics
    data/                ← catalogs and forecast models
    components/
      layout/AppShell.tsx
      grid/              ← map-first views
      panels/            ← catalogs, about, thesis
      charts/
      ui/
```

### Map components (`src/components/grid/`)

| File | Role |
|------|------|
| `GridMapApp.tsx` | Lens shell + live stream map |
| `DemandForecastMap.tsx` | AI / pop / industrial + private-public $ |
| `AllSourcesBalanceMap.tsx` | Ten-source production, demand, deficit |
| `GridInterconnectMap.tsx` | Coverage, utilities, buys, risk |
| `RegionCoverageLayer.tsx` | State polygons for interconnect / ISO fill |
| `ConstructionProjectsMap.tsx` | Build pipeline |
| `FutureBalanceMap.tsx` | Peak vs firm, first-deficit year |
| `UtilityGridMap.tsx` | Earlier zone/utility map (superseded as lens by interconnect map) |

### Data models (`src/data/`)

| File | Role |
|------|------|
| `usStates.ts` | 50 states + DC + territories, fleet, `projectUS` |
| `usStateOutlines.ts` | Simplified lon/lat rings for coverage |
| `gridUtilities.ts` | Interconnects, zones, utilities, interties |
| `energyTrade.ts` | State import / export TWh |
| `stateDependency.ts` | State + utility buy / dependence / risk |
| `demandForecast.ts` | AI, population, industrial, capital |
| `allSourceBalance.ts` | Multi-fuel production vs demand |
| `energyBalanceFuture.ts` | Firm vs peak deficit scenarios |
| `energyConstruction.ts` | Projects under build |
| `liveSources.ts` | CAISO / weather / EIA fetch |
| `refreshRates.ts` | Poll intervals |
| `fossilFuels.ts` / `naturalGas.ts` | Hydrocarbon history |
| `usEnergyPlants.ts` / `usHydroPlants.ts` | Plant catalogs |
| `portfolios.ts` | LSEs / generators |
| `energyPolicies.ts` / `jurisdictionPolicies.ts` | Policy stack |
| `gasThesisPapers.ts` | Got Gas + related library |
| `mockData.ts` | Legacy CA sample + KPIs |

---

## Risk and buys (Grid / risk)

**State risk** (0–100): import share of use, net-buyer size, partner concentration, island / ERCOT / peninsula, thin reserve, AI 2030, fuel concentration, cross-border hydro.

**Utility risk**: state book allocated by customer share, plus role:

| Role | Meaning |
|------|---------|
| LSE | Retail / utility share of state imports |
| Wires | T&D purchaser (Oncor, CenterPoint, AEP Texas) |
| Genco | Merchant seller |
| Federal | BPA, TVA, NYPA |

Bands: resilient · watch · exposed · critical.

---

## Coverage outlines

`RegionCoverageLayer` fills simplified state polygons:

- Interconnects: Eastern, Western, Texas, islanded
- Zones: CAISO, ERCOT, PJM, MISO, SPP, NYISO, ISO-NE, Southeast, WECC NW / SW / Rockies

Schematic, not FERC service-territory GIS. Seam states use one home market (e.g. TX → ERCOT, IL → PJM).

---

## Recent product history (Git)

Newest first on `energy/main`:

- Region outlines (interconnect / ISO coverage)
- Utility-company buy and risk breakdown
- State interconnect map with buys and risk
- Grok Build 4.6 credit
- All-source balance
- Faster live refresh (CAISO 15 s, map 0.8 s)
- Demand forecast (AI, population, industrial, capital)
- Thesis / Got Gas library
- Future deficits
- View counter, About / Donate

---

## How to ship a change

```bash
cd /Users/davidtphung/.grok/worktrees/davidtphung/moreenergycapacity-v1
npm run build
git add -A
git commit -m "feat: …"
git push energy HEAD:main
npx vercel --prod --yes
```

Confirm:

1. GitHub `main` on `california-energy-intelligence-os` has the commit  
2. https://eis.davidtphung.com shows the new UI  

---

## Limits (say this in About / Sources)

- Not real-time EMS / SCADA except the CAISO CSV pull
- Intertie “live use” is a clocked sample, boosted when CAISO load is high
- Catalogs and forecasts update on deploy
- Zone polygons and utility dots are approximate
- Deficit / demand / capital paths are samples, not official AEO / IRP cases
