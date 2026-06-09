# vimigo TCVR Revenue OS

**See where your money leaks. Forecast your growth. Reward the right actions.**
**看清哪里漏钱，预测哪里增长，奖励真正带来业绩的动作。**

A "money X-ray" diagnostic tool that decomposes a business into
**Traffic × Conversion × Value × Recurring/Referral (TCVR)** so an owner can see
where revenue leaks, simulate which lever grows GP fastest, and connect every
metric to a team reward.

```
Revenue = Traffic × Conversion Rate × Average Basket Value × Repeat Factor × Referral Multiplier
Gross Profit = Revenue × GP Margin     CAC = Marketing ÷ New Customers
LTV = ABV × GP Margin × Purchase Frequency × Lifespan
```

---

## What's inside

**7 input modules** — Company Profile · Traffic · Conversion · Value (products) ·
Recurring & Referral · Costs · Reward & Accountability.

**5 dashboards** — Revenue X-Ray · TCVR Funnel Map · Product & GP Map ·
Scenario Simulator · 90-Day Action Plan.

**Two brains:**
- A deterministic, offline **rule-based engine** (`frontend/src/engine/`) computes every
  metric, health score, scenario, leak, reward suggestion, and vimiGoal draft — no API key needed.
- Optional **Claude AI** features (website scan, product auto-categorization,
  boss-friendly forecast narration, vimiGoal drafting) via a small backend that holds the
  API key server-side. If no key is set, the AI panels degrade gracefully to the rule-based results.

Bilingual 中文 / English throughout, with a runtime toggle. Autosaves to the browser;
named profiles + JSON import/export; PDF report via the browser print dialog.

---

## Run it

Requirements: Node ≥ 20, pnpm.

```bash
pnpm install          # installs frontend + backend
cp .env.example .env  # optional — add ANTHROPIC_API_KEY to enable AI features
pnpm dev              # web on http://localhost:5173, API on http://localhost:3001
```

- The app is fully usable **without** a key (AI panels show "AI unavailable — rule-based results").
- To enable AI, put `ANTHROPIC_API_KEY=sk-ant-…` in `.env`. Models are configurable
  (`MODEL_SMART=claude-opus-4-8`, `MODEL_FAST=claude-sonnet-4-6`).

Other scripts: `pnpm build` (static frontend → `frontend/dist`), `pnpm start`
(production: backend serves the built frontend + `/api`), `pnpm typecheck`.

---

## Architecture

```
vimigo-tcvr-os/
├─ frontend/                     React 18 + Vite + Tailwind + TS
│  └─ src/
│     ├─ engine/                 PURE TS — the calc + diagnostics engine (no React)
│     │   types · util · benchmarks · revenue · channels · funnel ·
│     │   products · retention · scenarios · insights · index(analyze)
│     ├─ store/                  Zustand store (raw inputs only) + memoized engine selectors
│     ├─ i18n/                   bilingual dictionary + useT()
│     ├─ components/             shared UI + viz (FunnelRing, ProductLadder, ScenarioBars…)
│     ├─ modules/                the 7 input screens
│     ├─ dashboards/             the 5 dashboard screens
│     ├─ ai/                     AI client + hooks (graceful degradation)
│     └─ pdf/                    print-to-PDF report
└─ backend/                      Express + @anthropic-ai/sdk (AI proxy; serves dist in prod)
   └─ src/  server · anthropic · extract · prompts · schema · guard · routes/*
```

**Design rule:** the store holds *only raw inputs*; every number on every dashboard is a
pure function of those inputs (`analyze(input)`), so dashboards can never drift out of sync.
The engine never throws — empty inputs yield a fully-populated result flagged "insufficient".

### The engine
- `analyze(input)` runs a linear, cycle-free pipeline:
  `revenue → {channels, funnel, products, retention} → scenarios → insights`.
- All math goes through `safeDiv` (no NaN/Infinity). Rates entered as `40` or `0.4` are
  normalized. Benchmarks are per-sales-model and overridable.
- Scenarios use a ratio-against-source-of-truth formulation, so the simulator works even
  when only stated revenue was entered, and "Current" always equals today exactly.

---

## Deploy (later — the public "lead magnet" version)

- **Static only** (no AI): `pnpm build` → host `frontend/dist` on any static host
  (Hostinger static, Netlify, Vercel). AI panels degrade.
- **Full** (with AI): deploy the Node backend (it serves `frontend/dist` and `/api`) with
  `ANTHROPIC_API_KEY` set.

---

## Roadmap

- Live vimigo platform integration (pull real vimiSales/vimiGoal data via MCP; push generated
  vimiGoal/vimiReward setups) — designed for, not yet wired.
- Embeddable "Free TCVR Score" capture flow for lead generation.
