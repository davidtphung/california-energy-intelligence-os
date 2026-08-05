# California Energy Intelligence OS

A modern interactive web app for **California electricity research, planning, and developer workflows**. Built as a 1000×-quality dashboard with realistic sample data and an API-ready data model.

## Features

1. **Overview dashboard** - capacity, generation mix, load, storage, imports/exports, emissions KPIs  
2. **Scenario planner** - demand, solar/wind/storage buildout, retirements, hydro variability, imports, policy targets → 2030 / 2035 / 2045 outputs  
3. **Research workspace** - CEC, CAISO, EIA, utility, and policy source library; notes; assumptions tracker; citations  
4. **Data engineering** - entity model, pipeline status, quality checks, error log, last refresh  
5. **Developer panel** - editable JSON config, metric definitions, API tables, CSV/JSON export  

### UX

- Dark / light mode (persisted)
- Analyst · Planner · Engineer · Developer modes
- Filters: year, month, technology, region, scenario
- Chart drilldowns, scenario presets, export
- Responsive layout (desktop + mobile), accessible focus states, skip link

## Stack

- **React 19** + **TypeScript**
- **Vite 8**
- **Tailwind CSS 4**
- **Recharts**
- **Lucide** icons

## Quick start

```bash
npm install
npm run dev
```

Open the URL printed by Vite (typically `http://localhost:5173`).

```bash
npm run build    # production build
npm run preview  # preview production build
```

### Live data

The Overview panel pulls **today’s CAISO grid data** (no API key) via a same-origin proxy:

| Feed | Path |
|------|------|
| System status | `/api/live/caiso/systemstatus.csv` → CAISO Outlook |
| Demand | `demand.csv` |
| Fuel mix | `fuelsource.csv` |
| Storage | `storage.csv` |
| Renewables | `renewables.csv` |
| Net demand | `netdemand.csv` |
| CO₂ | `co2.csv` |
| Weather | Open-Meteo (Central Valley proxy) |
| EIA CISO hourly | Optional - set `VITE_EIA_API_KEY` |

Dev: Vite proxies `/api/live/caiso/*`. Prod: `vercel.json` rewrites to `www.caiso.com/outlook/current/*`.

Refresh interval: 60s.

## Project structure

```
src/
  types/           # Domain entities (plants, scenarios, pipelines, …)
  data/mockData.ts # Realistic CA sample data + generators
  context/         # Theme, filters, scenarios, notes
  components/
    layout/        # Shell, sidebar, header
    ui/            # Cards, KPIs, tabs, sliders, …
    charts/        # Capacity, mix, load, flows, map, compare table
    panels/        # Overview, Scenarios, Research, Data Eng, Developer
  lib/utils.ts     # Formatting, export helpers, tech colors
```

## Data model

| Entity | Purpose |
|--------|---------|
| `plants` | Generator / storage registry |
| `generation_hourly` | Energy by tech × region |
| `load_hourly` | Demand series |
| `storage_hourly` | Charge / discharge / SoC |
| `transmission_flows` | Imports, exports, internal paths |
| `policy_targets` | SB 100 and related milestones |
| `scenarios` / `assumptions` | Planner cases |
| `sources` / `notes` | Research workspace |
| `pipeline_runs` | Data engineering status |

Replace mock generators in `src/data/mockData.ts` with fetch calls to CEC, CAISO OASIS, EIA, etc. Types in `src/types/index.ts` are the integration contract.

## License

Private / internal use unless otherwise specified.
