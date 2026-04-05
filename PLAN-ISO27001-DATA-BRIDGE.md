# ISO 27001 ↔ Report App — Data Bridge Reference Plan

> **Purpose:** This document describes exactly what an AI agent needs to implement to connect the outputs and results of the **ISO 27001 CISO Command Suite** (the HTML app) with the **InfoSec Report Generator** (the Next.js app). Data flows in both directions. Read `PLAN-ISO27001-INTEGRATION.md` first — this document assumes the iframe integration is already in place.

---

## 1. Overview

### The Problem

The two apps store data in incompatible formats:

| | ISO 27001 ISMS Suite | Report Generator |
|---|---|---|
| **Storage** | Browser `localStorage` (JSON) | SQLite via Prisma |
| **Language** | JavaScript, single file | TypeScript, Next.js |
| **Schema** | `v:4` flat state object | Relational Prisma models |
| **Standard** | ISO 27001:2022 (4 themes, 93 controls) | ISO 27001:2013 (14 domains, Arabic) |
| **Risk scale** | Likelihood × Impact 1–25 | Probability × Impact 1–5 |

### The Bridge

An AI agent implements:
1. **TypeScript types** (`src/types/iso27001.ts`) matching the HTML app's v:4 state schema
2. **Mapping functions** (`src/lib/iso27001/bridge.ts`) that translate between the two schemas — pure functions, no DB access
3. **API route** (`src/app/api/iso27001/bridge/route.ts`) that calls the mapping functions and reads/writes Prisma

The user workflow is **manual JSON handoff** (not live sync):
- **Import:** User exports JSON from the HTML app → pastes/uploads it in the Report app → data populates the report
- **Export:** User triggers export from the Report app → downloads ISO27001-compatible JSON → imports it into the HTML app

---

## 2. ISO 27001 App State Schema (v:4)

The HTML app stores its entire state under one `localStorage` key. The export format is:

```json
{
  "v": 4,
  "ts": 1707123456789,
  "state": { ... }
}
```

### TypeScript Types to Create in `src/types/iso27001.ts`

```typescript
export type ISO27001ControlStatus = 'not-started' | 'in-progress' | 'implemented';
export type ISO27001RiskStatus = 'Open' | 'In Treatment' | 'Accepted' | 'Closed';
export type ISO27001IncidentStatus = 'Open' | 'Under Investigation' | 'Resolved' | 'Closed';
export type ISO27001IncidentSeverity = 'Critical' | 'High' | 'Medium' | 'Low';
export type ISO27001Treatment = 'Mitigate' | 'Accept' | 'Transfer' | 'Avoid';
export type ISO27001Trend = 'up' | 'down' | 'flat';
export type ISO27001TaskStatus = 'todo' | 'inprogress' | 'review' | 'done';

export interface ISO27001Risk {
  id: string;
  title: string;
  cat: string;                       // Risk category (e.g., "Cyber Threat", "Compliance")
  asset: string;                     // Affected asset
  l: number;                         // Likelihood 1–5
  i: number;                         // Impact 1–5
  treat: ISO27001Treatment;
  tdesc?: string;                    // Treatment description / required controls
  owner: string;
  date: string;                      // ISO date string
  st: ISO27001RiskStatus;
}

export interface ISO27001KPI {
  id: string;
  name: string;
  cat: string;                       // Category (Incident Response, Awareness, etc.)
  unit: string;                      // '%', 'hours', 'count', etc.
  target: number;
  current: number;
  freq: string;                      // 'Weekly', 'Monthly', 'Quarterly'
  trend: ISO27001Trend;
}

export interface ISO27001Incident {
  id: string;
  ttl: string;                       // Title
  date: string;                      // Detection date
  sev: ISO27001IncidentSeverity;
  cat: string;                       // Category (Data Breach, Malware, etc.)
  desc: string;
  impact: string;
  actions: string;
  lessons: string;
  st: ISO27001IncidentStatus;
}

export interface ISO27001Task {
  id: string;
  title: string;
  desc: string;
  who: string;                       // Assignee name
  prio: string;                      // 'Low', 'Medium', 'High', 'Critical'
  dom: string;                       // Domain (Clause 4–10, Annex A, Risk, Docs, Audit, General)
  due: string;
  st: ISO27001TaskStatus;
  notes: string;
}

export interface ISO27001Asset {
  id: string;
  name: string;
  type: string;                      // 'Information', 'Software', 'Hardware', 'People', 'Service'
  cls: string;                       // 'Public', 'Internal', 'Confidential', 'Restricted'
  crit: string;                      // 'Low', 'Medium', 'High', 'Critical'
  owner: string;
  loc: string;
  desc: string;
}

export interface ISO27001Supplier {
  id: string;
  name: string;
  cat: string;
  risk: string;
  data: string;
  svc: string;
  exp: string;
  rev: string;
  assess: string;
  notes: string;
}

export interface ISO27001AwarenesSession {
  id: string;
  ttl: string;
  type: string;
  date: string;
  aud: string;
  rate: number;                      // Completion percentage 0–100
  st: string;
  notes: string;
}

export interface ISO27001State {
  org?: {
    name: string;
    manager: string;
    scope: string;
    cb: string;
    certDate: string;
    industry: string;
    size: string;
  };
  clauses: Record<string, ISO27001ControlStatus>;   // reqId → status
  controls: Record<string, ISO27001ControlStatus>;  // ctrlId → status (e.g., "5.1" → "implemented")
  soa: Record<string, { applicable: boolean; justification?: string }>;
  docs: Record<string, string>;                     // docRef → status string
  risks: ISO27001Risk[];
  assets: ISO27001Asset[];
  incidents: ISO27001Incident[];
  audits: unknown[];
  ncas: unknown[];
  tasks: ISO27001Task[];
  team: Array<{ id: string; name: string; role: string; dept: string }>;
  suppliers: ISO27001Supplier[];
  awareness: ISO27001AwarenesSession[];
  kpis: ISO27001KPI[];
  daily: Record<string, boolean>;
  dailyNotes: Record<string, string>;
}

export interface ISO27001Export {
  v: 4;
  ts: number;
  state: ISO27001State;
}
```

---

## 3. Report App Schema — Relevant Fields

Read `prisma/schema.prisma` to confirm exact field names. The fields relevant to the bridge are:

### Report model (scalar fields)
```
kpiCompliance   Int      — overall compliance percentage (0–100)
incOpen         Int      — open incident count
incProgress     Int      — incidents under investigation
incClosed       Int      — resolved/closed incidents
incWatch        Int      — watched incidents (no ISO27001 equivalent)
```

### Relation arrays (deleteMany + createMany on update)
```
risks[]          — Risk model
efficiencyKPIs[] — EfficiencyKPI model
maturityDomains[]— MaturityDomain model (name + score)
isoControls[]    — ISOControl model (domain name + currentApplied count + total)
```

### Risk model fields
```
description       String  — risk title/description
system            String  — affected system
probability       Int     — 1–5
impact            Int     — 1–5
severity          String  — 'low'|'medium'|'high'|'critical'
status            String  — 'open'|'inprogress'|'accepted'|'closed'
requiredControls  String  — treatment description
affectedAssets    String  — asset name
worstCase         String  — worst case scenario
```

### EfficiencyKPI model fields
```
title         String
val           Float
target        Float
unit          String
description   String
lowerBetter   Boolean
```

### MaturityDomain model fields
```
name   String  — e.g., "Clause 4 – Context" or "Annex A.5 Organisational"
score  Int     — 0–100
```

### ISOControl model fields (for the maturity section)
```
domain           String  — e.g., "A5", "A9" (2013 numbering used in the report app)
currentApplied   Int     — number of controls currently applied
total            Int     — total controls in this domain
```

---

## 4. Import Direction: ISO 27001 → Report

The function signature in `src/lib/iso27001/bridge.ts`:

```typescript
export function isoToReportFields(
  isoExport: ISO27001Export
): ImportResult
```

Where `ImportResult` contains partial Prisma-ready data for `risks`, `efficiencyKPIs`, `maturityDomains`, `isoControls`, and scalar fields.

### 4.1 Risk Mapping

For each item in `isoExport.state.risks[]`, create a Risk record:

| ISO27001 Field | Report Field | Transformation |
|---|---|---|
| `risk.title` | `description` | Direct copy |
| `risk.cat + ' — ' + risk.asset` | `system` | Concatenate with em-dash separator |
| `risk.l` | `probability` | Direct (both 1–5 scale) |
| `risk.i` | `impact` | Direct (both 1–5 scale) |
| `risk.l × risk.i` → score | `severity` | ≥20 → `'critical'`, ≥10 → `'high'`, ≥5 → `'medium'`, <5 → `'low'` |
| `risk.st` | `status` | See status mapping table below |
| `risk.tdesc` | `requiredControls` | Direct (may be empty string) |
| `risk.asset` | `affectedAssets` | Direct |
| `risk.treat + ': ' + (risk.tdesc \|\| 'No treatment details')` | `worstCase` | Synthesized |
| `risk.owner` | *(no direct field — omit or store in description suffix)* | Omit |

**Status mapping:**

| ISO27001 `st` | Report `status` |
|---|---|
| `'Open'` | `'open'` |
| `'In Treatment'` | `'inprogress'` |
| `'Accepted'` | `'accepted'` |
| `'Closed'` | `'closed'` |

### 4.2 Incident Counter Mapping

Do not create individual incident records in the Report app — it stores only aggregate counts.

```typescript
const incOpen = isoExport.state.incidents.filter(
  i => i.st === 'Open' || i.st === 'Under Investigation'
).length;

const incProgress = isoExport.state.incidents.filter(
  i => i.st === 'Resolved'
).length;

const incClosed = isoExport.state.incidents.filter(
  i => i.st === 'Closed'
).length;

// incWatch has no ISO27001 equivalent — preserve the report's existing value (do not overwrite)
```

### 4.3 KPI Mapping

For each item in `isoExport.state.kpis[]`, create an EfficiencyKPI record:

| ISO27001 Field | Report Field | Transformation |
|---|---|---|
| `kpi.name` | `title` | Direct |
| `kpi.current` | `val` | Direct (Number → Float) |
| `kpi.target` | `target` | Direct (Number → Float) |
| `kpi.unit` | `unit` | Direct |
| `'Category: ' + kpi.cat` | `description` | Prefix the category name |
| Heuristic (see below) | `lowerBetter` | Derived from unit and name |

**`lowerBetter` heuristic:**

```typescript
function deriveLowerBetter(kpi: ISO27001KPI): boolean {
  const name = kpi.name.toLowerCase();
  const unit = kpi.unit.toLowerCase();
  // Lower is better for time-based, count-of-bad-things, and overdue metrics
  return (
    unit === 'hours' ||
    unit === 'days' ||
    name.includes('time') ||
    name.includes('mttd') ||
    name.includes('mttr') ||
    name.includes('overdue') ||
    name.includes('open') ||
    name.includes('critical') ||
    name.includes('failed') ||
    name.includes('breach') ||
    name.includes('incident')
  );
}
```

### 4.4 Clause Compliance → Maturity Domains

For each of the 7 ISO 27001 clauses, compute the percentage of requirements with status `'implemented'` and create one MaturityDomain record:

```typescript
function clausePct(
  clauseNum: string,
  clauses: Record<string, ISO27001ControlStatus>
): number {
  const entries = Object.entries(clauses).filter(([key]) =>
    key.startsWith(clauseNum + '.')
  );
  if (entries.length === 0) return 0;
  const implemented = entries.filter(([, v]) => v === 'implemented').length;
  return Math.round((implemented / entries.length) * 100);
}
```

**Clause domain names to create (use these exact strings as `name`):**

| Clause | MaturityDomain name |
|---|---|
| 4 | `'Clause 4 – Context of the Organisation'` |
| 5 | `'Clause 5 – Leadership'` |
| 6 | `'Clause 6 – Planning'` |
| 7 | `'Clause 7 – Support'` |
| 8 | `'Clause 8 – Operation'` |
| 9 | `'Clause 9 – Performance Evaluation'` |
| 10 | `'Clause 10 – Improvement'` |

### 4.5 Annex A Controls → Maturity Domains and IsoControls

The ISO27001 app uses **2022 Annex A** (4 themes: Organisational 5.x, People 6.x, Physical 7.x, Technological 8.x). The Report app tracks **2013 Annex A** (14 domain codes: A5–A18, Arabic names).

**Step A: Create 4 Annex A theme MaturityDomain records (simple approach)**

For each of the 4 Annex A themes, compute the percentage of controls with status `'implemented'`:

```typescript
function annexPct(
  theme: '5' | '6' | '7' | '8',
  controls: Record<string, ISO27001ControlStatus>
): number {
  const entries = Object.entries(controls).filter(([key]) =>
    key.startsWith(theme + '.')
  );
  if (entries.length === 0) return 0;
  const implemented = entries.filter(([, v]) => v === 'implemented').length;
  return Math.round((implemented / entries.length) * 100);
}
```

Create these 4 MaturityDomain records:

| Theme | MaturityDomain name |
|---|---|
| 5.x | `'Annex A.5 – Organisational Controls (37)'` |
| 6.x | `'Annex A.6 – People Controls (8)'` |
| 7.x | `'Annex A.7 – Physical Controls (14)'` |
| 8.x | `'Annex A.8 – Technological Controls (34)'` |

**Step B: Populate IsoControls[] (2013 domain approximation)**

The Report app's IsoControl table maps to ISO 27001:2013 Annex A domains (A5–A18). The bridge must approximate these from the 2022 structure. Use this static mapping table:

| Report domain code | Report domain (2013) | ISO27001 2022 source controls |
|---|---|---|
| `A5` | Security Policies (2) | `5.1`, `5.2` |
| `A6` | Org of Information Security (7) | `5.3`, `5.4`, `5.5`, `5.6`, `5.7`, `5.36`, `5.37` |
| `A7` | Human Resource Security (6) | `6.1`, `6.2`, `6.3`, `6.4`, `6.5`, `6.6` |
| `A8` | Asset Management (10) | `5.9`, `5.10`, `5.11`, `5.12`, `5.13`, `5.14`, `8.1` |
| `A9` | Access Control (14) | `5.15`, `5.16`, `5.17`, `5.18`, `8.2`, `8.3`, `8.4`, `8.5`, `8.6`, `8.7`, `8.18`, `8.19`, `8.20`, `8.21` |
| `A10` | Cryptography (2) | `8.24`, `8.25` |
| `A11` | Physical Security (15) | `7.1`, `7.2`, `7.3`, `7.4`, `7.5`, `7.6`, `7.7`, `7.8`, `7.9`, `7.10`, `7.11`, `7.12`, `7.13`, `7.14` |
| `A12` | Operations Security (14) | `8.8`, `8.9`, `8.10`, `8.11`, `8.12`, `8.13`, `8.14`, `8.15`, `8.16`, `8.17` |
| `A13` | Communications Security (7) | `8.20`, `8.21`, `8.22`, `8.23` |
| `A14` | Secure Development (13) | `8.25`, `8.26`, `8.27`, `8.28`, `8.29`, `8.30`, `8.31`, `8.32`, `8.33`, `8.34` |
| `A15` | Supplier Relationships (5) | `5.19`, `5.20`, `5.21`, `5.22`, `5.23` |
| `A16` | Incident Management (7) | `5.24`, `5.25`, `5.26`, `5.27`, `5.28`, `6.8` |
| `A17` | Business Continuity (4) | `5.29`, `5.30`, `7.14`, `8.14` |
| `A18` | Compliance (8) | `5.31`, `5.32`, `5.33`, `5.34`, `5.35`, `8.34` |

For each domain, count how many of the mapped 2022 control IDs are `'implemented'` in `isoExport.state.controls`:

```typescript
const ANNEX_A_MAPPING: Record<string, { total: number; controlIds: string[] }> = {
  A5:  { total: 2,  controlIds: ['5.1','5.2'] },
  A6:  { total: 7,  controlIds: ['5.3','5.4','5.5','5.6','5.7','5.36','5.37'] },
  A7:  { total: 6,  controlIds: ['6.1','6.2','6.3','6.4','6.5','6.6'] },
  A8:  { total: 10, controlIds: ['5.9','5.10','5.11','5.12','5.13','5.14','8.1'] },
  A9:  { total: 14, controlIds: ['5.15','5.16','5.17','5.18','8.2','8.3','8.4','8.5','8.6','8.7','8.18','8.19','8.20','8.21'] },
  A10: { total: 2,  controlIds: ['8.24','8.25'] },
  A11: { total: 15, controlIds: ['7.1','7.2','7.3','7.4','7.5','7.6','7.7','7.8','7.9','7.10','7.11','7.12','7.13','7.14'] },
  A12: { total: 14, controlIds: ['8.8','8.9','8.10','8.11','8.12','8.13','8.14','8.15','8.16','8.17'] },
  A13: { total: 7,  controlIds: ['8.20','8.21','8.22','8.23'] },
  A14: { total: 13, controlIds: ['8.25','8.26','8.27','8.28','8.29','8.30','8.31','8.32','8.33','8.34'] },
  A15: { total: 5,  controlIds: ['5.19','5.20','5.21','5.22','5.23'] },
  A16: { total: 7,  controlIds: ['5.24','5.25','5.26','5.27','5.28','6.8'] },
  A17: { total: 4,  controlIds: ['5.29','5.30','7.14','8.14'] },
  A18: { total: 8,  controlIds: ['5.31','5.32','5.33','5.34','5.35','8.34'] },
};

// For each entry in ANNEX_A_MAPPING, create an ISOControl record:
isoControls = Object.entries(ANNEX_A_MAPPING).map(([domain, { total, controlIds }]) => ({
  domain,
  total,
  currentApplied: controlIds.filter(id => controls[id] === 'implemented').length,
}));
```

### 4.6 Overall Compliance → kpiCompliance

```typescript
const allStatuses = [
  ...Object.values(isoExport.state.clauses),
  ...Object.values(isoExport.state.controls),
];
const kpiCompliance = allStatuses.length > 0
  ? Math.round(allStatuses.filter(s => s === 'implemented').length / allStatuses.length * 100)
  : 0;
```

---

## 5. Export Direction: Report → ISO 27001

The function signature:

```typescript
export function reportToISOExport(
  report: FullReportFromPrisma
): ISO27001Export
```

This creates a full ISO27001 v:4 JSON that the HTML app can import.

### 5.1 Risk Reverse Mapping

For each `report.risks[]` item, create an `ISO27001Risk`:

| Report Field | ISO27001 Field | Transformation |
|---|---|---|
| `risk.description` | `title` | Direct |
| `risk.affectedAssets` | `asset` | Direct |
| `risk.system` | `cat` | Use as-is (or extract category from "cat — asset" format if present) |
| `risk.probability` | `l` | Direct (1–5) |
| `risk.impact` | `i` | Direct (1–5) |
| `risk.severity` | `treat` | `'critical'`/`'high'`/`'medium'` → `'Mitigate'`; `'low'` → `'Accept'` |
| `risk.requiredControls` | `tdesc` | Direct |
| `risk.status` | `st` | `'open'`→`'Open'`, `'inprogress'`→`'In Treatment'`, `'accepted'`→`'Accepted'`, `'closed'`→`'Closed'` |
| Generated | `id` | `'R-' + String(index+1).padStart(3,'0')` |
| Generated | `owner` | `''` (empty — no owner field in report app) |
| Generated | `date` | `new Date().toISOString().slice(0,10)` |

### 5.2 KPI Reverse Mapping

For each `report.efficiencyKPIs[]` item, create an `ISO27001KPI`:

| Report Field | ISO27001 Field | Transformation |
|---|---|---|
| `kpi.title` | `name` | Direct |
| `kpi.val` | `current` | Direct |
| `kpi.target` | `target` | Direct |
| `kpi.unit` | `unit` | Direct |
| `kpi.description` (strip "Category: " prefix) | `cat` | `desc.replace(/^Category:\s*/i, '')` |
| Derived from `val`, `target`, `lowerBetter` | `trend` | See heuristic below |
| Generated | `id` | `uuid()` or `'K-' + index` |
| Generated | `freq` | `'Monthly'` (default — no freq field in report app) |

**Trend derivation:**

```typescript
function deriveTrend(kpi: EfficiencyKPI): ISO27001Trend {
  if (kpi.lowerBetter) {
    if (kpi.val <= kpi.target) return 'up';    // at or below target = good = up
    if (kpi.val > kpi.target * 1.1) return 'down';
    return 'flat';
  } else {
    if (kpi.val >= kpi.target) return 'up';
    if (kpi.val < kpi.target * 0.9) return 'down';
    return 'flat';
  }
}
```

### 5.3 Maturity Domain Score → Clause/Control Status

For each `report.maturityDomains[]` item whose name matches `'Clause N'`:
- Extract clause number N
- Find all clause requirements in the ISO27001 clauses object whose keys start with `N.`
- Set all their statuses based on the score:
  - score ≥ 66 → `'implemented'`
  - score ≥ 33 → `'in-progress'`
  - score < 33 → `'not-started'`

For each `report.maturityDomains[]` item whose name matches `'Annex A.N'`:
- Extract theme number N (5, 6, 7, or 8)
- Set all controls starting with `N.` to the proportional status using the same threshold above

For `report.isoControls[]` items, use `currentApplied / total * 100` as a score and apply the same threshold to the corresponding 2022 control IDs from `ANNEX_A_MAPPING`.

### 5.4 Incident Counter → Synthesized Stubs

The Report app stores only counts (`incOpen`, `incProgress`, `incClosed`). Generate stub incident records for the ISO27001 app:

```typescript
function synthesizeIncidents(
  incOpen: number,
  incProgress: number,
  incClosed: number
): ISO27001Incident[] {
  const incidents: ISO27001Incident[] = [];
  for (let i = 0; i < incOpen; i++) {
    incidents.push({
      id: `INC-OPEN-${i+1}`,
      ttl: `Security Incident ${i+1} (imported from report)`,
      date: new Date().toISOString().slice(0, 10),
      sev: 'Medium',
      cat: 'Other',
      desc: 'Imported from Report Generator. Details not available.',
      impact: '',
      actions: '',
      lessons: '',
      st: 'Open',
    });
  }
  for (let i = 0; i < incProgress; i++) {
    incidents.push({
      id: `INC-PROG-${i+1}`,
      ttl: `Security Incident Under Investigation ${i+1} (imported from report)`,
      date: new Date().toISOString().slice(0, 10),
      sev: 'Medium',
      cat: 'Other',
      desc: 'Imported from Report Generator. Details not available.',
      impact: '',
      actions: '',
      lessons: '',
      st: 'Under Investigation',
    });
  }
  for (let i = 0; i < incClosed; i++) {
    incidents.push({
      id: `INC-CLOS-${i+1}`,
      ttl: `Closed Incident ${i+1} (imported from report)`,
      date: new Date().toISOString().slice(0, 10),
      sev: 'Low',
      cat: 'Other',
      desc: 'Imported from Report Generator. Details not available.',
      impact: '',
      actions: '',
      lessons: '',
      st: 'Closed',
    });
  }
  return incidents;
}
```

---

## 6. API Endpoint — `src/app/api/iso27001/bridge/route.ts`

### Request Schema

```typescript
type BridgeRequest =
  | {
      action: 'import';
      reportId: string;
      isoData: ISO27001Export;
    }
  | {
      action: 'export';
      reportId: string;
    }
  | {
      action: 'preview';
      isoData: ISO27001Export;
    };
```

### Response Schema

```typescript
// action: 'import'
type ImportResponse = {
  success: true;
  reportId: string;
  patchedFields: string[];   // e.g., ['risks', 'efficiencyKPIs', 'kpiCompliance', ...]
  warnings: string[];        // non-fatal issues (e.g., 'incWatch not updated — no ISO27001 equivalent')
};

// action: 'export'
type ExportResponse = ISO27001Export;  // The full v:4 JSON, send with Content-Type: application/json

// action: 'preview'
type PreviewResponse = {
  mappedRisks: number;
  mappedKPIs: number;
  mappedClauses: number;
  mappedControls: number;
  overallCompliance: number;
  incidentCounters: { open: number; progress: number; closed: number };
  sample: {                   // first 3 mapped risks for preview
    risks: Array<{ description: string; severity: string }>;
  };
};
```

### Implementation Structure

```typescript
// src/app/api/iso27001/bridge/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { isoToReportFields, reportToISOExport } from '@/lib/iso27001/bridge';
import type { ISO27001Export } from '@/types/iso27001';

export async function POST(request: NextRequest) {
  const body = await request.json() as BridgeRequest;

  if (body.action === 'preview') {
    // Call isoToReportFields(body.isoData), return summary stats without writing to DB
  }

  if (body.action === 'import') {
    // 1. Validate reportId exists in DB
    // 2. Call isoToReportFields(body.isoData)
    // 3. Write to DB using Prisma:
    //    - deleteMany + createMany for risks[], efficiencyKPIs[], maturityDomains[], isoControls[]
    //    - update scalar fields (kpiCompliance, incOpen, incProgress, incClosed)
    //    - do NOT overwrite incWatch
    // 4. Return ImportResponse
  }

  if (body.action === 'export') {
    // 1. Fetch full report from DB including all relations
    // 2. Call reportToISOExport(report)
    // 3. Return ISO27001Export JSON
    //    res.headers.set('Content-Disposition', 'attachment; filename="iso27001-export.json"')
  }

  return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
}
```

### Error Handling

| Condition | HTTP Status | Response |
|---|---|---|
| `reportId` not found | 404 | `{ error: 'Report not found' }` |
| Invalid `isoData` (not v:4) | 422 | `{ error: 'Invalid ISO27001 export format. Expected v:4.' }` |
| `isoData` has empty `state` | 422 | `{ error: 'ISO27001 state is empty.' }` |
| DB write failure | 500 | `{ error: 'Database error', detail: err.message }` |
| Missing `action` field | 400 | `{ error: 'Invalid action' }` |

---

## 7. Usage Workflow

### 7.1 Import from ISO 27001 into a Report (User Steps)

The exact UI for triggering this bridge will be implemented as a button or panel in the report editor — this section documents the flow so the UI can be designed correctly.

1. **In the HTML app:** User clicks the "Export Data" button (top-right of the app). This downloads a file named something like `isms-export-2025-01-01.json`.

2. **In the Report app:** User navigates to the target report's editor page (`/report/[id]`).

3. **Bridge UI (to be built):** User finds an "Import from ISO27001" button (suggested location: the Maturity Level section, step 8 of the form, or a dedicated settings panel). Clicking it opens a file picker.

4. **File upload:** User selects the downloaded JSON file. The frontend reads it with `FileReader.readAsText()` and parses with `JSON.parse()`.

5. **Validation:** Before calling the API, validate that `data.v === 4` and `data.state` exists.

6. **Preview call:** `POST /api/iso27001/bridge` with `{ action: 'preview', isoData: parsedData }`. Show the user a summary modal: "Found 12 risks, 8 KPIs, 67% overall compliance. Import will overwrite existing risks and KPIs."

7. **Confirm:** User clicks "Import" in the modal.

8. **Import call:** `POST /api/iso27001/bridge` with `{ action: 'import', reportId, isoData: parsedData }`.

9. **Result:** The form reloads the report data. The Maturity, Risk, and KPI sections are now populated.

### 7.2 Export from Report into ISO 27001 (User Steps)

1. **In the Report app:** User navigates to the target report's editor or preview page.

2. **Bridge UI (to be built):** User clicks "Export to ISO27001 Format" button.

3. **Export call:** `POST /api/iso27001/bridge` with `{ action: 'export', reportId }`. The response is an ISO27001 v:4 JSON.

4. **Download:** Frontend triggers a file download of the JSON response, named `iso27001-import-{date}.json`.

5. **In the HTML app:** User clicks the "Import Data" button (in the app's settings modal or top-right area). Selects the downloaded JSON file.

6. **Result:** The ISO27001 app loads the report data. Risks, KPIs, and maturity domains appear in their respective sections.

---

## 8. Known Limitations

| Limitation | Reason | Impact |
|---|---|---|
| Incident detail is lost on import | Report app stores only counts, not individual incident records | ISO27001 app receives stub incidents with no real data |
| ISO 27001:2022 → 2013 domain mapping is approximate | Standards restructured significantly between versions | IsoControls percentages are estimates, not exact |
| Tasks, suppliers, awareness, audit records are not bridged | No equivalent in the Report app | These are silently ignored on import |
| Import overwrites, does not merge | Prisma `deleteMany + createMany` pattern | A second import replaces all risks/KPIs — not cumulative |
| `incWatch` is never updated | No ISO27001 equivalent | Must be managed manually in the Report app |
| KPI `lowerBetter` is heuristic | ISO27001 KPI metadata does not include this field | May incorrectly classify directional KPIs |
| Export produces stub incidents | Report app stores counts not records | ISO27001 app will show generic incident placeholders |
| Clause/control status from export is bulk-applied | Score thresholds (66/33) applied to all requirements in a clause | Finer-grained individual requirement status is not preserved |

---

## 9. Testing

### Unit Tests for `src/lib/iso27001/bridge.ts`

The bridge functions are pure (no side effects, no DB calls) — they are straightforward to unit test.

**Fixture: minimal valid ISO27001Export**

```typescript
const minimalExport: ISO27001Export = {
  v: 4,
  ts: Date.now(),
  state: {
    clauses: {
      '4.1': 'implemented',
      '4.2': 'in-progress',
      '4.3': 'not-started',
    },
    controls: {
      '5.1': 'implemented',
      '5.2': 'not-started',
      '8.1': 'in-progress',
    },
    soa: {},
    docs: {},
    risks: [{
      id: 'R-001',
      title: 'Phishing Attack',
      cat: 'Cyber Threat',
      asset: 'Email System',
      l: 4,
      i: 5,
      treat: 'Mitigate',
      tdesc: 'Deploy email filtering',
      owner: 'CISO',
      date: '2025-01-01',
      st: 'Open',
    }],
    assets: [],
    incidents: [
      { id: 'I-001', ttl: 'Login breach', date: '2025-01-01', sev: 'High', cat: 'Unauthorised Access', desc: '', impact: '', actions: '', lessons: '', st: 'Open' },
      { id: 'I-002', ttl: 'Malware', date: '2025-01-01', sev: 'Critical', cat: 'Malware', desc: '', impact: '', actions: '', lessons: '', st: 'Resolved' },
    ],
    audits: [],
    ncas: [],
    tasks: [],
    team: [],
    suppliers: [],
    awareness: [],
    kpis: [{
      id: 'K-001',
      name: 'Patching Coverage',
      cat: 'Vulnerability Management',
      unit: '%',
      target: 95,
      current: 88,
      freq: 'Monthly',
      trend: 'up',
    }],
    daily: {},
    dailyNotes: {},
  },
};
```

**Test cases:**

```
isoToReportFields(minimalExport)
  ✓ risks[0].description === 'Phishing Attack'
  ✓ risks[0].system === 'Cyber Threat — Email System'
  ✓ risks[0].probability === 4
  ✓ risks[0].impact === 5
  ✓ risks[0].severity === 'critical'   (4×5=20, ≥20 threshold)
  ✓ risks[0].status === 'open'
  ✓ efficiencyKPIs[0].title === 'Patching Coverage'
  ✓ efficiencyKPIs[0].val === 88
  ✓ efficiencyKPIs[0].lowerBetter === false  (unit='%', not in lowerBetter list)
  ✓ incOpen === 1                      (1 Open incident)
  ✓ incProgress === 1                  (1 Resolved → incProgress)
  ✓ incClosed === 0
  ✓ maturityDomains includes { name: 'Clause 4 – Context...', score: 33 }  (1/3 implemented)
  ✓ kpiCompliance === 33               (2/6 total = 33%)

reportToISOExport(reportBuiltFromAbove)
  ✓ v === 4
  ✓ state.risks[0].title === 'Phishing Attack'
  ✓ state.risks[0].treat === 'Mitigate'  (severity was critical)
  ✓ state.kpis[0].current === 88

Edge cases:
  ✓ empty risks array → risks: []
  ✓ all controls 'not-started' → kpiCompliance = 0
  ✓ missing controls object → kpiCompliance = 0 (guard with `|| {}`)
  ✓ risk with l=1, i=1 → severity = 'low'
  ✓ risk with l=3, i=2 → score=6 → severity = 'medium'
```
