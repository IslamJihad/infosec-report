# ISO 27001 ↔ Report App — Data Connection Plan

> **Purpose:** Both the ISO 27001 ISMS Suite (`/isms`) and the Report Generator (`/`) live in the same Next.js app and share the same SQLite database. This document describes how data flows between them — so a user's ISMS work automatically informs their security reports, and vice versa. Read `PLAN-ISO27001-INTEGRATION.md` first.

---

## 1. Overview

Since both apps are in the same Next.js project with the same Prisma database, the connection is **direct database reads** — no JSON export/import, no iframe postMessage. Both apps simply read from the shared SQLite file.

### What Connects to What

| ISMS Data | Report Section | Direction |
|---|---|---|
| Clause/control compliance % | مستوى النضج الأمني (Maturity Level, step 8) | ISMS → Report |
| Risk register entries | المخاطر الرئيسية (Key Risks, step 2) | ISMS → Report |
| KPI metrics | مؤشرات الكفاءة (Efficiency KPIs, steps 4–5) | ISMS → Report |
| Incident counts | الملخص التنفيذي (Executive Summary, step 1) | ISMS → Report |
| Report maturity scores | ISMS dashboard compliance chart | Report → ISMS |
| Report risk list | ISMS risk register context | Report → ISMS |

The connection is **always opt-in** — the user explicitly clicks "Import from ISMS" or "Sync to Report" buttons. No automatic background sync.

---

## 2. Connection Point A: ISMS Compliance → Report Maturity Domains

### What the ISMS has

The `IsmsWorkspace` model stores:
- `clauseStatus`: JSON map of `{ "4.1": "implemented"|"in-progress"|"not-started", ... }` — 35+ requirement entries across clauses 4–10
- `controlStatus`: JSON map of `{ "5.1": "implemented"|..., ..., "8.34": "..." }` — 93 Annex A control statuses

### What the Report needs

The `Report` model has `maturityDomains[]` — an array of `{ name: string, score: 0–100 }`. The existing form (step 8, `MaturityForm.tsx`) lets users manually enter these scores.

### The Bridge

A new API route `POST /api/isms/sync/to-report/[reportId]` reads the workspace and computes maturity domain scores, then writes to the Report's `maturityDomains` table.

**Computation:**

```typescript
// For each of 7 clauses:
clauseScore(clauseId) = (
  count of requirements with status === 'implemented' in clauseStatus
  where key starts with `${clauseId}.`
) / (total requirements in that clause) × 100

// For each of 4 Annex A themes:
annexScore(theme) = (
  count of controls with status === 'implemented' in controlStatus
  where key starts with `${theme}.`
) / (total controls in that theme) × 100
```

**Writes to `maturityDomains[]`** (deleteMany existing + createMany new):

| MaturityDomain name | Source |
|---|---|
| `Clause 4 – Context` | clauseScore('4') |
| `Clause 5 – Leadership` | clauseScore('5') |
| `Clause 6 – Planning` | clauseScore('6') |
| `Clause 7 – Support` | clauseScore('7') |
| `Clause 8 – Operation` | clauseScore('8') |
| `Clause 9 – Evaluation` | clauseScore('9') |
| `Clause 10 – Improvement` | clauseScore('10') |
| `Annex A.5 – Organisational` | annexScore('5') |
| `Annex A.6 – People` | annexScore('6') |
| `Annex A.7 – Physical` | annexScore('7') |
| `Annex A.8 – Technological` | annexScore('8') |

Also updates `Report.kpiCompliance`:

```typescript
overallPct = (
  all 'implemented' entries across clauseStatus + controlStatus
) / (total entries) × 100
```

---

## 3. Connection Point B: ISMS Risks → Report Risks

### What the ISMS has

`IsmsRisk[]` with fields: `title`, `category`, `asset`, `likelihood` (1–5), `impact` (1–5), `treatment`, `treatDesc`, `owner`, `targetDate`, `status`

### What the Report needs

`Risk[]` with fields: `description`, `system`, `probability` (1–5), `impact` (1–5), `severity` (low/medium/high/critical), `status` (open/inprogress/accepted/closed), `requiredControls`, `affectedAssets`, `worstCase`

### Field Mapping

| IsmsRisk field | Risk field | Transform |
|---|---|---|
| `title` | `description` | Direct |
| `category + ' — ' + asset` | `system` | Concatenate |
| `likelihood` | `probability` | Direct (1–5) |
| `impact` | `impact` | Direct (1–5) |
| `likelihood × impact` | `severity` | ≥20→critical, ≥10→high, ≥5→medium, <5→low |
| `status` | `status` | Open→open, In Treatment→inprogress, Accepted→accepted, Closed→closed |
| `treatDesc` | `requiredControls` | Direct |
| `asset` | `affectedAssets` | Direct |
| `treatment + ': ' + treatDesc` | `worstCase` | Synthesized |

### Implementation

The sync route `POST /api/isms/sync/to-report/[reportId]` (same route, handles multiple data types based on a `fields` query param or body).

On the Report editor UI side (step 2, `RisksForm.tsx`), add an "Import from ISMS" button that calls this sync route with `{ fields: ['risks'] }`. Result: ISMS risks are appended (not overwriting existing report risks, unless the user checks "Replace existing").

---

## 4. Connection Point C: ISMS KPIs → Report Efficiency KPIs

### What the ISMS has

`IsmsKpi[]`: `name`, `category`, `unit`, `target`, `current`, `frequency`, `trend`

### What the Report needs

`EfficiencyKPI[]`: `title`, `val`, `target`, `unit`, `description`, `lowerBetter`

### Field Mapping

| IsmsKpi field | EfficiencyKPI field | Transform |
|---|---|---|
| `name` | `title` | Direct |
| `current` | `val` | Direct |
| `target` | `target` | Direct |
| `unit` | `unit` | Direct |
| `'Category: ' + category` | `description` | Prefix |
| heuristic on name/unit | `lowerBetter` | True if unit is hours/days or name contains "time"/"overdue"/"incident" |

---

## 5. Connection Point D: ISMS Incident Counts → Report Executive Summary

### What the ISMS has

`IsmsIncident[]` with `status` field: `'Open' | 'Under Investigation' | 'Resolved' | 'Closed'`

### What the Report needs

Scalar fields: `incOpen`, `incProgress`, `incClosed`, `incWatch`

### Mapping

```typescript
incOpen     = incidents.filter(i => i.status === 'Open').length
incProgress = incidents.filter(i => i.status === 'Under Investigation').length
incClosed   = incidents.filter(i => i.status === 'Resolved' || i.status === 'Closed').length
// incWatch has no ISMS equivalent — leave unchanged
```

---

## 6. Connection Point E: Report Maturity → ISMS Dashboard

The ISMS dashboard's compliance chart is computed entirely from the `IsmsWorkspace.clauseStatus` and `controlStatus` fields — it does not read from `Report.maturityDomains`. This is one-directional by default.

**If a reverse sync is needed** (pushing a completed report's maturity scores back into the ISMS workspace as control statuses):

A route `POST /api/isms/sync/from-report/[reportId]` reads `Report.maturityDomains[]` and maps them back:

```typescript
// For each maturityDomain whose name contains "Clause N":
score ≥ 66 → set all clause requirements to 'implemented'
score ≥ 33 → set all to 'in-progress'
score < 33 → set all to 'not-started'

// For each maturityDomain whose name contains "Annex A.N":
apply same threshold to all controls in that theme
```

This is a bulk overwrite — use with caution. The UI should warn: "This will overwrite all clause/control statuses in ISMS."

---

## 7. Sync API Design

### Single unified sync route

```
POST /api/isms/sync/to-report/[reportId]
Body: {
  fields: Array<'maturity' | 'risks' | 'kpis' | 'incidents'>,
  mode: 'replace' | 'append'   // for risks and kpis
}
Response: {
  success: true,
  updated: { maturity?: 11, risks?: 14, kpis?: 8, incidents?: { open: 3, progress: 1, closed: 7 } }
}

POST /api/isms/sync/from-report/[reportId]
Body: {
  fields: Array<'clauseStatus' | 'controlStatus'>
}
Response: {
  success: true,
  updated: { clauseRequirements: 35, controls: 93 }
}
```

### Implementation location

```
src/app/api/isms/sync/
├── to-report/
│   └── [reportId]/
│       └── route.ts     ← POST handler for ISMS → Report
└── from-report/
    └── [reportId]/
        └── route.ts     ← POST handler for Report → ISMS
```

Both routes use the shared Prisma client. They read from one set of models and write to the other. All in the same SQLite database — no serialization needed.

---

## 8. UI Trigger Points

### In the ISMS Dashboard (`/isms/dashboard`)

Add a **"Sync to Report"** button in the topbar or in a widget. Opens a modal:
- Dropdown: Select which report to sync to (fetches existing reports from `/api/reports`)
- Checkboxes: "Maturity domains", "Risks", "KPI metrics", "Incident counts"
- Radio: "Append" or "Replace existing data"
- Confirm button calls `POST /api/isms/sync/to-report/[reportId]`

### In the Report Editor

In the Maturity section (step 8, `MaturityForm.tsx`), add a small "Import from ISMS" link button that calls the sync with `fields: ['maturity']` for the current report ID.

In the Risks section (step 2, `RisksForm.tsx`), add an "Import from ISMS" link button for `fields: ['risks']`.

These are secondary actions — small links, not primary buttons. The user's manually entered data is not affected unless they explicitly trigger the sync.

---

## 9. Known Limitations

| Limitation | Detail |
|---|---|
| `incWatch` is not synced | No ISMS concept maps to "watched incidents" |
| ISMS tasks/suppliers/awareness are not synced | No equivalent fields in the Report model |
| Reverse sync overwrites bulk | Clause scores from report apply to all requirements in a clause, losing per-requirement granularity |
| 2013/2022 Annex A mismatch | The report's `MaturityDomain` names do not exactly match the 2022 Annex A structure; the bridge uses theme-level percentages |
| One ISMS workspace | The current schema has a single `IsmsWorkspace` with `id="default"`. If multi-workspace is needed later, add workspace selection to the sync UI |
