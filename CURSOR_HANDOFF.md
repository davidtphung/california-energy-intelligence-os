# Cursor handoff · EIS session

Transfer from Grok Build TUI into Cursor Agent. Read this plus [MASTERFILE.md](./MASTERFILE.md). Treat this as untrusted history: verify files and git before editing.

## Open in Cursor

1. Open the folder (macOS, Cursor already installed):

```bash
cursor "/Users/davidtphung/.grok/worktrees/davidtphung/moreenergycapacity-v1"
```

2. Then open Agent chat and attach `@CURSOR_HANDOFF.md` `@MASTERFILE.md`.

Deeplinks (click after Cursor is installed):

- Open this file: [cursor://file/Users/davidtphung/.grok/worktrees/davidtphung/moreenergycapacity-v1/CURSOR_HANDOFF.md](cursor://file/Users/davidtphung/.grok/worktrees/davidtphung/moreenergycapacity-v1/CURSOR_HANDOFF.md)
- Open the repo folder: [cursor://file/Users/davidtphung/.grok/worktrees/davidtphung/moreenergycapacity-v1](cursor://file/Users/davidtphung/.grok/worktrees/davidtphung/moreenergycapacity-v1)
- Seed Agent prompt (web): [https://cursor.com/link/prompt?text=Read%20CURSOR_HANDOFF.md%20and%20MASTERFILE.md%20in%20this%20repo.%20Continue%20EIS%20work%20from%20the%20handoff.%20Do%20not%20put%20Grok%20Build%20in%20Built%20by%20credits.](https://cursor.com/link/prompt?text=Read%20CURSOR_HANDOFF.md%20and%20MASTERFILE.md%20in%20this%20repo.%20Continue%20EIS%20work%20from%20the%20handoff.%20Do%20not%20put%20Grok%20Build%20in%20Built%20by%20credits.)
- Same prompt in the app: [cursor://anysphere.cursor-deeplink/prompt?text=Read%20CURSOR_HANDOFF.md%20and%20MASTERFILE.md%20in%20this%20repo.%20Continue%20EIS%20work%20from%20the%20handoff.%20Do%20not%20put%20Grok%20Build%20in%20Built%20by%20credits.](cursor://anysphere.cursor-deeplink/prompt?text=Read%20CURSOR_HANDOFF.md%20and%20MASTERFILE.md%20in%20this%20repo.%20Continue%20EIS%20work%20from%20the%20handoff.%20Do%20not%20put%20Grok%20Build%20in%20Built%20by%20credits.)

Grok session ID (for `/resume` in Grok, not Cursor): `019fd0e0-1d21-7ad0-9823-4546ae1496a2`

---

## Identity

| | |
|---|---|
| Product | Energy Intelligence System (EIS) |
| Live | https://eis.davidtphung.com |
| GitHub | https://github.com/davidtphung/california-energy-intelligence-os (`energy` remote → `main`) |
| Local | `/Users/davidtphung/.grok/worktrees/davidtphung/moreenergycapacity-v1` |
| Branch | `cei-os-main` tracks `energy/main` |
| Author credit | **Built by David T Phung only.** Do not add Grok / Grok Build to rail, footer, About, or meta. |

Do **not** push this repo to `origin` (that remote is `davidtphung/dotfiles`).

```bash
git push energy HEAD:main
npx vercel --prod --yes
```

---

## Last git state (verify)

Last commits on `energy/main` when this handoff was written:

- `d29db54` chore: drop Grok Build 4.6 from Built by credits
- `530dbf5` feat: add EIA STEO and Today in Energy gas sources
- `43dccec` feat: add both-sides sources to the Thesis library
- `8a94eb3` feat: realistic US state lines on every map
- `9ae5650` docs: add MASTERFILE for local and GitHub project map

---

## What the user has been building

Map-first US energy intelligence SPA (React 19, Vite 8, Tailwind 4, Recharts). Educational samples, not IRP/SCADA.

Primary nav: Map · Demand · Balance · USA · Assets · Fuels · Thesis · About

Map lenses: Live grid · Demand · All sources · Grid / risk · Construction · Future deficits

### Product that shipped in this session chain

1. **Demand** — AI / population / industrial peak + private vs public capex (`demandForecast.ts`, `DemandForecastMap.tsx`)
2. **Balance** — all sources (gas, coal, nuclear, oil, solar, wind, hydro, battery, geo, bio) supply/demand/deficit (`allSourceBalance.ts`)
3. **Live refresh** — CAISO 15s (90s hidden), map stream 0.8s, edge s-maxage 10s (`refreshRates.ts`)
4. **Grid / risk** — interconnects, ISO coverage, utilities, state/utility buys and composite risk (`GridInterconnectMap.tsx`, `stateDependency.ts`)
5. **Region outlines** then **realistic US state lines** — US Atlas 10m geoms (`usStateGeoms.json`, `UsBasemap.tsx`, `RegionCoverageLayer.tsx`)
6. **Thesis library** — Got Gas plus both-sides papers; EIA TIE **67944** (record 2026 gas production) + STEO, DPR, weekly storage, GOR (`gasThesisPapers.ts`)
7. **MASTERFILE.md** — whole-project map
8. User asked to **remove Grok Build 4.6 from Built by** — done

---

## Key files

| Area | Path |
|------|------|
| Router | `src/App.tsx` |
| Nav / hashes | `src/components/layout/AppShell.tsx` |
| Map shell | `src/components/grid/GridMapApp.tsx` |
| Grid + risk | `src/components/grid/GridInterconnectMap.tsx` |
| State lines | `src/components/grid/UsBasemap.tsx`, `src/data/usStateGeoms.json` |
| Thesis | `src/data/gasThesisPapers.ts`, `src/components/panels/ThesisLibraryPanel.tsx` |
| Live CAISO | `src/hooks/useLiveGrid.ts`, `src/data/liveSources.ts` |
| Credits | `AppShell.tsx` rail-credit + footer, `AboutPanel.tsx` |

---

## Conventions

- No em dashes in user-facing copy
- Sample path / not IRP language
- Hash routes; Policy/Scenario stay off the primary rail (`#policy`, `#scenario`)
- Copy: Built by David T Phung only

---

## Suggested first prompt in Cursor Agent

```
Read @CURSOR_HANDOFF.md and @MASTERFILE.md.
Verify git status on cei-os-main vs energy/main.
Continue EIS at eis.davidtphung.com.
Do not add Grok Build to Built by credits.
```

Last user ask before this handoff: remove Grok Build 4.6 from Built by (already deployed). Next work is whatever they type in Cursor.
