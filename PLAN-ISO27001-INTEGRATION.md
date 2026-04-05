# ISO 27001 CISO Command Suite — Full Reimplementation Plan

> **Purpose:** This document tells an AI agent exactly how to build the ISO 27001 CISO Command Suite from scratch as a proper Next.js/React/TypeScript application inside the existing infosec-report project. The reference file `ISO27001-CISO-Command-Suite .html` is used **only** as a design and feature specification — none of its code is used. Read every section before writing a single line of code.

---

## 1. What Is Being Built

A **second standalone dashboard** at the route `/isms` — a full ISO 27001:2022 ISMS lifecycle management tool with:
- 17 pages/sections (dashboard, tasks, risks, assets, incidents, controls, SoA, audit, documents, KPIs, suppliers, awareness, roadmap, checklist, board report, clauses 4–10)
- Its own sidebar navigation, topbar, and layout (English, LTR)
- Its own database models in the existing SQLite/Prisma setup
- Its own Zustand store
- An App Switcher in both interfaces letting users jump between the two dashboards

The existing Arabic report generator at `/` is **not modified** except for adding the App Switcher chip to its header.

---

## 2. Reference File

**`ISO27001-CISO-Command-Suite .html`** — use this file to understand:
- Every feature, page, and data field that must exist
- The visual design: dark blue color palette, card layouts, sidebar width, typography
- The data structures: exact field names for risks, assets, incidents, tasks, KPIs, etc.
- The business logic: risk score = likelihood × impact, compliance % calculations
- The pre-loaded static data: clause definitions, Annex A control IDs and descriptions, document register, roadmap phases, daily checklist items

Do **not** copy any HTML, CSS, or JavaScript from this file into the codebase.

---

## 3. Tech Stack

Use what the project already has:

| Concern | Technology |
|---|---|
| Framework | Next.js App Router (already installed) |
| Language | TypeScript |
| Styling | Tailwind CSS 4 (already configured) |
| State | Zustand (already installed) |
| Database | SQLite via Prisma (already configured) |
| Charts | Recharts (already installed) |
| Animations | Framer Motion (already installed) |
| Icons | React Icons (already installed) |
| Font | Space Grotesk from Google Fonts (referenced in HTML; add to the ISMS layout) |

---

## 4. Route Group Restructure

The current root `src/app/layout.tsx` sets `<html lang="ar" dir="rtl">`. The ISMS dashboard needs `<html lang="en" dir="ltr">`. These cannot coexist in one root layout. The solution is **Next.js route groups**.

### 4.1 Change the Root Layout

Edit `src/app/layout.tsx` to emit a minimal neutral shell with no language, direction, or font:

```tsx
// src/app/layout.tsx  — REPLACE entirely with this
import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'InfoSec Platform',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html>
      <body className="antialiased">{children}</body>
    </html>
  );
}
```

### 4.2 Create the Arabic Main Layout

Create `src/app/(main)/layout.tsx` — this replaces what was in the root layout for the existing app:

```tsx
// src/app/(main)/layout.tsx
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'تقرير أمن المعلومات',
  description: 'نظام إنشاء تقارير أمن المعلومات الاحترافي',
};

export default function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ar" dir="rtl">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800;900&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="antialiased" style={{ fontFamily: '"Cairo", sans-serif' }}>
        {children}
      </body>
    </html>
  );
}
```

### 4.3 Move Existing Pages into (main)/

Move these files into `src/app/(main)/` by creating the folder and moving each:

```
src/app/page.tsx              → src/app/(main)/page.tsx
src/app/settings/             → src/app/(main)/settings/
src/app/analytics/            → src/app/(main)/analytics/
src/app/report/               → src/app/(main)/report/
```

No page code changes — only the folder path changes. Next.js route groups (the `(main)` parentheses) are invisible in the URL, so `/`, `/settings`, `/analytics`, `/report/[id]` all remain at the same URLs.

### 4.4 Create the ISMS Layout

Create `src/app/(isms)/layout.tsx`:

```tsx
// src/app/(isms)/layout.tsx
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'ISO 27001 CISO Command Suite',
};

export default function IsmsLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" dir="ltr">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;400;500;600;700&family=Fira+Code:wght@300;400;500&display=swap"
          rel="stylesheet"
        />
      </head>
      <body style={{ fontFamily: '"Space Grotesk", sans-serif' }}>
        {children}
      </body>
    </html>
  );
}
```

---

## 5. ISMS Route Structure

All ISMS pages live under `src/app/(isms)/isms/`. The URL base is `/isms`.

```
src/app/(isms)/isms/
├── layout.tsx                    ← ISMS shell: sidebar + topbar wrapper
├── page.tsx                      ← Redirect to /isms/dashboard
├── dashboard/
│   └── page.tsx                  ← Executive Dashboard
├── tasks/
│   └── page.tsx                  ← Task Board (Kanban)
├── roadmap/
│   └── page.tsx                  ← Implementation Roadmap
├── checklist/
│   └── page.tsx                  ← Daily Checklist & CISO Log
├── board-report/
│   └── page.tsx                  ← Board & Management Report
├── kpis/
│   └── page.tsx                  ← KPI Metrics Dashboard
├── suppliers/
│   └── page.tsx                  ← Supplier Management
├── awareness/
│   └── page.tsx                  ← Security Awareness Programme
├── clause/
│   └── [id]/
│       └── page.tsx              ← Clauses 4–10 (id: "4","5","6","7","8","9","10")
├── soa/
│   └── page.tsx                  ← Statement of Applicability (all 93 controls)
├── annex/
│   └── [theme]/
│       └── page.tsx              ← Annex A themes (theme: "5","6","7","8")
├── risks/
│   └── page.tsx                  ← Risk Register
├── assets/
│   └── page.tsx                  ← Asset Inventory
├── incidents/
│   └── page.tsx                  ← Incident Log
├── audit/
│   └── page.tsx                  ← Internal Audit Programme
└── documents/
    └── page.tsx                  ← Documentation Register
```

The ISMS app layout (`src/app/(isms)/isms/layout.tsx`) renders the sidebar + topbar shell and `{children}` in the main content area — similar to how the report editor uses `Sidebar.tsx` and `TopBar.tsx`.

---

## 6. Database Schema — New Prisma Models

Add these models to `prisma/schema.prisma`. Do **not** touch existing models.

```prisma
// ─── ISMS WORKSPACE (singleton — one per installation) ────────────────────────

model IsmsWorkspace {
  id            String   @id @default("default")
  orgName       String   @default("")
  cisoName      String   @default("")
  scope         String   @default("")
  certBody      String   @default("")
  targetDate    String   @default("")
  industry      String   @default("")
  employeeCount String   @default("")

  // Stored as JSON strings (maps of id→status)
  // clauseStatus: { "4.1": "not-started"|"in-progress"|"implemented", ... }
  clauseStatus  String   @default("{}")
  // controlStatus: { "5.1": "not-started"|"in-progress"|"implemented", ... }
  controlStatus String   @default("{}")
  // soaData: { "5.1": { "applicable": true, "justification": "" }, ... }
  soaData       String   @default("{}")
  // docStatus: { "IS-DOC-001": "Not Started"|"In Progress"|"Complete", ... }
  docStatus     String   @default("{}")
  // dailyChecks: { "morning-1": true, ... }
  dailyChecks   String   @default("{}")
  // dailyNotes: { "2025-01-01": "note text", ... }
  dailyNotes    String   @default("{}")

  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  risks         IsmsRisk[]
  assets        IsmsAsset[]
  incidents     IsmsIncident[]
  tasks         IsmsTask[]
  team          IsmsTeamMember[]
  kpis          IsmsKpi[]
  suppliers     IsmsSupplier[]
  awareness     IsmsAwareness[]
  audits        IsmsAudit[]
  ncas          IsmsNca[]
}

// ─── RISK REGISTER ────────────────────────────────────────────────────────────

model IsmsRisk {
  id          String        @id @default(uuid())
  workspaceId String        @default("default")
  workspace   IsmsWorkspace @relation(fields: [workspaceId], references: [id], onDelete: Cascade)
  title       String        @default("")
  category    String        @default("")        // Cyber Threat, Compliance, etc.
  asset       String        @default("")
  likelihood  Int           @default(1)          // 1–5
  impact      Int           @default(1)          // 1–5
  // score is computed: likelihood × impact (1–25)
  treatment   String        @default("Mitigate") // Mitigate|Accept|Transfer|Avoid
  treatDesc   String        @default("")
  owner       String        @default("")
  targetDate  String        @default("")
  status      String        @default("Open")     // Open|In Treatment|Accepted|Closed
  sortOrder   Int           @default(0)
  createdAt   DateTime      @default(now())
}

// ─── ASSET INVENTORY ──────────────────────────────────────────────────────────

model IsmsAsset {
  id             String        @id @default(uuid())
  workspaceId    String        @default("default")
  workspace      IsmsWorkspace @relation(fields: [workspaceId], references: [id], onDelete: Cascade)
  name           String        @default("")
  type           String        @default("Information") // Information|Software|Hardware|People|Service
  classification String        @default("Internal")    // Public|Internal|Confidential|Restricted
  criticality    String        @default("Medium")      // Low|Medium|High|Critical
  owner          String        @default("")
  location       String        @default("")
  description    String        @default("")
  sortOrder      Int           @default(0)
}

// ─── INCIDENT LOG ─────────────────────────────────────────────────────────────

model IsmsIncident {
  id          String        @id @default(uuid())
  workspaceId String        @default("default")
  workspace   IsmsWorkspace @relation(fields: [workspaceId], references: [id], onDelete: Cascade)
  title       String        @default("")
  detectedAt  String        @default("")
  severity    String        @default("Medium")   // Low|Medium|High|Critical
  category    String        @default("Other")    // Data Breach|Malware|Phishing|Ransomware|Unauthorised Access|Insider Threat|System Failure|Physical Security|Other
  description String        @default("")
  impact      String        @default("")
  actions     String        @default("")
  lessons     String        @default("")
  status      String        @default("Open")     // Open|Under Investigation|Resolved|Closed
  sortOrder   Int           @default(0)
  createdAt   DateTime      @default(now())
}

// ─── TASK BOARD ───────────────────────────────────────────────────────────────

model IsmsTask {
  id          String        @id @default(uuid())
  workspaceId String        @default("default")
  workspace   IsmsWorkspace @relation(fields: [workspaceId], references: [id], onDelete: Cascade)
  title       String        @default("")
  description String        @default("")
  assignee    String        @default("")
  priority    String        @default("Medium")   // Low|Medium|High|Critical
  domain      String        @default("General")  // Clause 4..10|Annex A|Risk|Docs|Audit|General
  dueDate     String        @default("")
  status      String        @default("todo")     // todo|inprogress|review|done
  notes       String        @default("")
  sortOrder   Int           @default(0)
}

// ─── TEAM ─────────────────────────────────────────────────────────────────────

model IsmsTeamMember {
  id          String        @id @default(uuid())
  workspaceId String        @default("default")
  workspace   IsmsWorkspace @relation(fields: [workspaceId], references: [id], onDelete: Cascade)
  name        String        @default("")
  role        String        @default("")
  department  String        @default("")
}

// ─── KPI METRICS ──────────────────────────────────────────────────────────────

model IsmsKpi {
  id          String        @id @default(uuid())
  workspaceId String        @default("default")
  workspace   IsmsWorkspace @relation(fields: [workspaceId], references: [id], onDelete: Cascade)
  name        String        @default("")
  category    String        @default("")         // Incident Response|Awareness|Vulnerability Management|Risk|Compliance
  unit        String        @default("%")
  target      Float         @default(100)
  current     Float         @default(0)
  frequency   String        @default("Monthly")  // Weekly|Monthly|Quarterly
  trend       String        @default("flat")     // up|down|flat
  sortOrder   Int           @default(0)
}

// ─── SUPPLIER MANAGEMENT ──────────────────────────────────────────────────────

model IsmsSupplier {
  id            String        @id @default(uuid())
  workspaceId   String        @default("default")
  workspace     IsmsWorkspace @relation(fields: [workspaceId], references: [id], onDelete: Cascade)
  name          String        @default("")
  category      String        @default("")        // Cloud Provider|Software Vendor|Hardware Vendor|Managed Service|Consultant|Other
  riskLevel     String        @default("Medium")  // Low|Medium|High|Critical
  dataAccess    String        @default("")
  service       String        @default("")
  contractExp   String        @default("")
  nextReview    String        @default("")
  assessment    String        @default("Not Started") // Not Started|In Progress|Completed|Approved|Issues Found
  notes         String        @default("")
  sortOrder     Int           @default(0)
}

// ─── SECURITY AWARENESS ───────────────────────────────────────────────────────

model IsmsAwareness {
  id             String        @id @default(uuid())
  workspaceId    String        @default("default")
  workspace      IsmsWorkspace @relation(fields: [workspaceId], references: [id], onDelete: Cascade)
  title          String        @default("")
  type           String        @default("Online Training") // Online Training|Phishing Simulation|In-Person|Workshop|Other
  sessionDate    String        @default("")
  audience       String        @default("")
  completionRate Float         @default(0)  // 0–100
  status         String        @default("Completed") // Completed|In Progress
  notes          String        @default("")
  sortOrder      Int           @default(0)
}

// ─── INTERNAL AUDIT ───────────────────────────────────────────────────────────

model IsmsAudit {
  id          String        @id @default(uuid())
  workspaceId String        @default("default")
  workspace   IsmsWorkspace @relation(fields: [workspaceId], references: [id], onDelete: Cascade)
  title       String        @default("")
  scope       String        @default("")
  auditDate   String        @default("")
  auditor     String        @default("")
  clauses     String        @default("")  // comma-separated clause references
  auditType   String        @default("Internal") // Internal|External|Surveillance
  status      String        @default("Planned")  // Planned|In Progress|Completed
  findings    String        @default("")
  sortOrder   Int           @default(0)
}

// ─── NONCONFORMITIES & CORRECTIVE ACTIONS ─────────────────────────────────────

model IsmsNca {
  id               String        @id @default(uuid())
  workspaceId      String        @default("default")
  workspace        IsmsWorkspace @relation(fields: [workspaceId], references: [id], onDelete: Cascade)
  reference        String        @default("")  // e.g., NCA-001
  type             String        @default("NC") // NC (Nonconformity)|OBS (Observation)
  description      String        @default("")
  rootCause        String        @default("")
  correctiveAction String        @default("")
  owner            String        @default("")
  dueDate          String        @default("")
  status           String        @default("Open") // Open|In Progress|Closed
  sortOrder        Int           @default(0)
}
```

After adding these models, run:
```bash
npx prisma migrate dev --name add-isms-models
npx prisma generate
```

---

## 7. API Routes

Create these under `src/app/api/isms/`. Each follows the same pattern as the existing report API routes (`src/app/api/reports/`).

```
src/app/api/isms/
├── workspace/
│   └── route.ts          GET (fetch workspace), PUT (update org settings + clauseStatus + controlStatus + soaData + docStatus + dailyChecks + dailyNotes)
├── risks/
│   ├── route.ts          GET (list), POST (create)
│   └── [id]/
│       └── route.ts      PUT (update), DELETE
├── assets/
│   ├── route.ts          GET, POST
│   └── [id]/route.ts     PUT, DELETE
├── incidents/
│   ├── route.ts          GET, POST
│   └── [id]/route.ts     PUT, DELETE
├── tasks/
│   ├── route.ts          GET, POST
│   └── [id]/route.ts     PUT, DELETE
├── team/
│   ├── route.ts          GET, POST
│   └── [id]/route.ts     PUT, DELETE
├── kpis/
│   ├── route.ts          GET, POST
│   └── [id]/route.ts     PUT, DELETE
├── suppliers/
│   ├── route.ts          GET, POST
│   └── [id]/route.ts     PUT, DELETE
├── awareness/
│   ├── route.ts          GET, POST
│   └── [id]/route.ts     PUT, DELETE
├── audits/
│   ├── route.ts          GET, POST
│   └── [id]/route.ts     PUT, DELETE
└── ncas/
    ├── route.ts          GET, POST
    └── [id]/route.ts     PUT, DELETE
```

All routes use `db` from `src/lib/db.ts` (existing Prisma client). Each GET route returns the workspace's records. Each POST validates the body and creates a record with `workspaceId: "default"`.

The `workspace` route also handles updating the JSON fields (`clauseStatus`, `controlStatus`, `soaData`, `docStatus`, `dailyChecks`, `dailyNotes`). Parse these as JSON when reading, stringify when writing.

---

## 8. Zustand Store

Create `src/store/ismsStore.ts` — separate from the existing `reportStore.ts`.

```typescript
// src/store/ismsStore.ts
import { create } from 'zustand';
import type { IsmsWorkspace, IsmsRisk, IsmsAsset, IsmsIncident, IsmsTask,
              IsmsTeamMember, IsmsKpi, IsmsSupplier, IsmsAwareness,
              IsmsAudit, IsmsNca } from '@/generated/prisma';

interface IsmsStore {
  workspace: IsmsWorkspace | null;
  risks: IsmsRisk[];
  assets: IsmsAsset[];
  incidents: IsmsIncident[];
  tasks: IsmsTask[];
  team: IsmsTeamMember[];
  kpis: IsmsKpi[];
  suppliers: IsmsSupplier[];
  awareness: IsmsAwareness[];
  audits: IsmsAudit[];
  ncas: IsmsNca[];
  isLoading: boolean;

  // Actions — call the ISMS API and update local state
  loadAll: () => Promise<void>;
  updateWorkspace: (patch: Partial<IsmsWorkspace>) => Promise<void>;
  // CRUD for each entity type
  addRisk: (data: Partial<IsmsRisk>) => Promise<void>;
  updateRisk: (id: string, data: Partial<IsmsRisk>) => Promise<void>;
  deleteRisk: (id: string) => Promise<void>;
  // ... same pattern for assets, incidents, tasks, team, kpis, suppliers, awareness, audits, ncas
}
```

The store uses fetch calls to `/api/isms/*` endpoints. `loadAll()` fetches all entities in parallel. `updateWorkspace()` debounces writes to avoid flooding the API.

---

## 9. TypeScript Types

Create `src/types/isms.ts` with derived and computed types:

```typescript
// src/types/isms.ts

// Re-export Prisma types for convenience
export type {
  IsmsWorkspace, IsmsRisk, IsmsAsset, IsmsIncident, IsmsTask,
  IsmsTeamMember, IsmsKpi, IsmsSupplier, IsmsAwareness, IsmsAudit, IsmsNca
} from '@/generated/prisma';

// Status unions
export type ControlStatus = 'not-started' | 'in-progress' | 'implemented';
export type RiskStatus = 'Open' | 'In Treatment' | 'Accepted' | 'Closed';
export type IncidentSeverity = 'Low' | 'Medium' | 'High' | 'Critical';
export type IncidentStatus = 'Open' | 'Under Investigation' | 'Resolved' | 'Closed';
export type TaskStatus = 'todo' | 'inprogress' | 'review' | 'done';
export type TaskPriority = 'Low' | 'Medium' | 'High' | 'Critical';

// Computed/derived types used in UI
export interface ClauseData {
  id: string;                  // "4", "5", "6", "7", "8", "9", "10"
  title: string;               // "Context of the Organisation"
  requirements: RequirementData[];
}

export interface RequirementData {
  id: string;                  // "4.1", "4.2", etc.
  title: string;
  description: string;
  guidance: string;            // Auditor guidance text from reference
}

export interface ControlData {
  id: string;                  // "5.1", "5.2", ..., "8.34"
  theme: '5' | '6' | '7' | '8';
  title: string;
  description: string;
  type: string;                // control type tag
}

export interface ComplianceStats {
  overallPct: number;
  clausePct: Record<string, number>;  // "4" → 66, "5" → 45, etc.
  annexPct: Record<'5' | '6' | '7' | '8', number>;
  implementedClauses: number;
  implementedControls: number;
  totalClauses: number;
  totalControls: number;
}

export interface RiskScore {
  score: number;               // likelihood × impact (1–25)
  level: 'Low' | 'Medium' | 'High' | 'Critical';
  color: string;               // Tailwind bg class
}
```

---

## 10. Static Data Constants

Create `src/lib/isms/constants.ts`. This file contains all the pre-defined static data from the HTML reference — the clause definitions, Annex A control catalogue, document register list, roadmap phases, and daily checklist items.

Do NOT hardcode these in components. Import them from this constants file.

Data to extract from the HTML reference and recreate as TypeScript arrays:

```typescript
// src/lib/isms/constants.ts

export const ISO_CLAUSES: ClauseData[] = [
  {
    id: '4',
    title: 'Context of the Organisation',
    requirements: [
      { id: '4.1', title: 'Understanding the organisation and its context', description: '...', guidance: '...' },
      { id: '4.2', title: 'Understanding the needs and expectations of interested parties', ... },
      { id: '4.3', title: 'Determining the scope of the ISMS', ... },
      { id: '4.4', title: 'Information security management system', ... },
    ]
  },
  // clauses 5, 6, 7, 8, 9, 10 — extract ALL requirements from the HTML reference
];

export const ANNEX_A_CONTROLS: ControlData[] = [
  // All 93 controls from the HTML reference, grouped by theme 5/6/7/8
  // Extract: id, theme, title, description, type
  { id: '5.1', theme: '5', title: 'Policies for information security', description: '...', type: 'Preventive' },
  // ... all 93 controls
];

export const MANDATORY_DOCUMENTS = [
  { ref: 'IS-DOC-001', title: 'ISMS Scope Document', clause: '4.3' },
  { ref: 'IS-DOC-002', title: 'Information Security Policy', clause: '5.2' },
  // ... all 14 mandatory docs from reference
];

export const SUPPORTING_DOCUMENTS = [
  { ref: 'IS-DOC-015', title: 'Asset Register', clause: '5.9' },
  // ... all 13 supporting docs
];

export const POLICY_DOCUMENTS = [
  { ref: 'IS-POL-001', title: 'Information Classification Policy', clause: '5.12' },
  // ... all 10 policy docs
];

export const ROADMAP_PHASES = [
  {
    id: 1,
    title: 'Initiation & Scoping',
    weeks: 'Weeks 1–2',
    status: 'active',  // done|active|pending
    items: [
      'Define ISMS scope and boundaries',
      'Obtain management commitment',
      // ...
    ]
  },
  // ... 6 phases total
];

export const DAILY_CHECKLIST = [
  {
    category: 'Morning Security Operations',
    items: [
      { id: 'morning-1', label: 'Review overnight security alerts' },
      // ... 5 items
    ]
  },
  {
    category: 'Implementation Progress',
    items: [ ... ]   // 5 items
  },
  {
    category: 'Governance & Reporting',
    items: [ ... ]   // 5 items
  },
];

export const RISK_CATEGORIES = [
  'Cyber Threat', 'Compliance', 'Operational', 'Physical', 'Third Party',
  'Human Error', 'Business Continuity', 'Data Privacy', 'Financial', 'Reputational'
];

export const INCIDENT_CATEGORIES = [
  'Data Breach', 'Malware', 'Phishing', 'Ransomware',
  'Unauthorised Access', 'Insider Threat', 'System Failure', 'Physical Security', 'Other'
];
```

---

## 11. Utility Functions

Create `src/lib/isms/calculations.ts`:

```typescript
// src/lib/isms/calculations.ts

// Risk scoring
export function getRiskScore(likelihood: number, impact: number): number {
  return likelihood * impact;  // 1–25
}

export function getRiskLevel(score: number): 'Low' | 'Medium' | 'High' | 'Critical' {
  if (score >= 20) return 'Critical';
  if (score >= 10) return 'High';
  if (score >= 5)  return 'Medium';
  return 'Low';
}

export function getRiskColor(level: string): string {
  // Returns Tailwind classes
  const colors = {
    Critical: 'bg-red-500/20 text-red-400 border-red-500/30',
    High:     'bg-orange-500/20 text-orange-400 border-orange-500/30',
    Medium:   'bg-amber-500/20 text-amber-400 border-amber-500/30',
    Low:      'bg-green-500/20 text-green-400 border-green-500/30',
  };
  return colors[level as keyof typeof colors] ?? colors.Medium;
}

// Compliance calculations
export function computeComplianceStats(
  clauseStatus: Record<string, ControlStatus>,
  controlStatus: Record<string, ControlStatus>
): ComplianceStats {
  // Calculate percentages per clause and per Annex A theme
  // Returns the full ComplianceStats object
}

export function getClauseCompliancePct(
  clauseId: string,
  clauseStatus: Record<string, ControlStatus>
): number {
  // Filter keys starting with `clauseId + '.'`, count implemented / total × 100
}

export function getAnnexThemePct(
  theme: '5' | '6' | '7' | '8',
  controlStatus: Record<string, ControlStatus>
): number {
  // Filter control keys by theme prefix, count implemented / total × 100
}

// KPI status
export function getKpiStatus(kpi: IsmsKpi): 'on-target' | 'below-target' | 'critical' {
  const ratio = kpi.current / kpi.target;
  if (ratio >= 1) return 'on-target';
  if (ratio >= 0.8) return 'below-target';
  return 'critical';
}

// Task due date status
export function getTaskDueStatus(dueDate: string): 'overdue' | 'due-soon' | 'ok' | 'none' {
  if (!dueDate) return 'none';
  const due = new Date(dueDate);
  const now = new Date();
  const diff = (due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
  if (diff < 0) return 'overdue';
  if (diff <= 3) return 'due-soon';
  return 'ok';
}
```

---

## 12. Component Structure

All ISMS components live under `src/components/isms/`. Existing report components are not touched.

```
src/components/isms/
├── layout/
│   ├── IsmsSidebar.tsx          ← Fixed sidebar with 17 navigation items + settings
│   └── IsmsTopBar.tsx           ← Top bar: org name, save status, settings button, app switcher
│
├── shared/
│   ├── StatusBadge.tsx          ← Color-coded badge for any status field
│   ├── ProgressBar.tsx          ← Horizontal bar with % fill and color variant
│   ├── KpiCard.tsx              ← Summary metric card (value, label, trend indicator)
│   ├── Modal.tsx                ← Reusable overlay modal wrapper
│   ├── ControlStatusPill.tsx    ← Three-state toggle: Not Started / In Progress / Implemented
│   ├── RiskScoreCell.tsx        ← 5×5 heat map cell with color coding
│   └── EmptyState.tsx           ← Empty table/list placeholder
│
├── dashboard/
│   ├── DashboardKpiRow.tsx      ← Row of 6 KPI summary cards
│   ├── ClauseComplianceChart.tsx← Recharts horizontal bar chart for 7 clauses
│   ├── AnnexCoverageCard.tsx    ← 4-card grid showing A.5/A.6/A.7/A.8 coverage %
│   ├── RiskHeatMap.tsx          ← 5×5 grid, cells colored by risk density
│   ├── CertificationTimeline.tsx← 6-phase horizontal timeline with status dots
│   ├── OverdueTasksList.tsx     ← List of overdue tasks with assignee + due date
│   └── DocHealthWidget.tsx      ← Documentation completion summary
│
├── tasks/
│   ├── KanbanBoard.tsx          ← 4-column board: To Do, In Progress, In Review, Done
│   ├── TaskCard.tsx             ← Draggable task card with priority color, due date badge
│   └── TaskModal.tsx            ← Add/Edit task form modal
│
├── risks/
│   ├── RiskTable.tsx            ← Searchable/filterable risk table with severity badges
│   ├── RiskModal.tsx            ← Add/Edit risk form with auto-computed score
│   └── RiskHeatMatrix.tsx       ← Large 5×5 heat map for the Risk Register page
│
├── assets/
│   ├── AssetTable.tsx
│   └── AssetModal.tsx
│
├── incidents/
│   ├── IncidentTable.tsx
│   └── IncidentModal.tsx
│
├── controls/
│   ├── ClauseAccordion.tsx      ← Expandable clause with requirement rows
│   ├── ControlCard.tsx          ← Single Annex A control with status toggle
│   ├── SoaTable.tsx             ← Full 93-control SoA table with applicable toggle + justification
│   └── ControlFilterBar.tsx     ← Search + status filter for control pages
│
├── documents/
│   └── DocumentRegister.tsx     ← Tabbed (Mandatory|Supporting|Policies) document checklist
│
├── audit/
│   ├── AuditTable.tsx
│   ├── AuditModal.tsx
│   ├── NcaTable.tsx
│   └── NcaModal.tsx
│
├── kpis/
│   ├── KpiMetricsTable.tsx
│   └── KpiModal.tsx
│
├── suppliers/
│   ├── SupplierTable.tsx
│   └── SupplierModal.tsx
│
├── awareness/
│   ├── AwarenessTable.tsx
│   └── AwarenessModal.tsx
│
├── checklist/
│   └── DailyChecklistCard.tsx   ← Checkbox groups + daily notes textarea
│
├── roadmap/
│   └── RoadmapPhaseCard.tsx     ← Phase card with progress indicators
│
└── AppSwitcher.tsx              ← Two-pill toggle (described in Section 14)
```

---

## 13. Design System

Implement the following as CSS custom properties in `src/app/(isms)/isms/layout.tsx` or in a `globals-isms.css` file imported by the ISMS layout.

### Color Palette (from HTML reference)

```css
/* Dark blue theme — reference exact hex values from the HTML file */
--isms-bg0:   #0a0e1a;   /* darkest background (page bg) */
--isms-bg1:   #0f1524;   /* sidebar background */
--isms-bg2:   #141929;   /* card background */
--isms-bg3:   #1a2035;   /* elevated surface */
--isms-surf:  #1e2640;   /* modal/popover surface */
--isms-border:#2a3550;   /* border color */
--isms-txt:   #e2e8f5;   /* primary text */
--isms-txt2:  #94a3b8;   /* secondary text */
--isms-txt3:  #64748b;   /* muted text */

/* Accent colors */
--isms-blue:  #3b82f6;
--isms-cyan:  #06b6d4;
--isms-green: #22c55e;
--isms-amber: #f59e0b;
--isms-red:   #ef4444;
--isms-purple:#a855f7;
--isms-teal:  #14b8a6;

/* Dim backgrounds (10% opacity versions for card accents) */
--isms-blue-dim:  rgba(59,130,246,0.1);
--isms-green-dim: rgba(34,197,94,0.1);
--isms-amber-dim: rgba(245,158,11,0.1);
--isms-red-dim:   rgba(239,68,68,0.1);
```

### Layout Dimensions

```css
--isms-sidebar-width: 256px;
--isms-topbar-height: 56px;
--isms-radius:        10px;
```

### Typography Scale

- Page titles: `Space Grotesk` 600, 20px
- Card titles: `Space Grotesk` 600, 14px
- Body: `Space Grotesk` 400, 14px
- Monospace data (IDs, codes): `Fira Code` 400, 13px
- Badges/pills: `Space Grotesk` 700, 11px uppercase

---

## 14. App Switcher

Create `src/components/isms/AppSwitcher.tsx` (used in both the existing app and the ISMS app):

```tsx
'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function AppSwitcher() {
  const pathname = usePathname();
  const isIsms = pathname.startsWith('/isms');

  return (
    <div
      style={{
        direction: 'ltr',
        display: 'flex',
        alignItems: 'center',
        borderRadius: '10px',
        overflow: 'hidden',
        border: '1px solid rgba(255,255,255,0.12)',
        fontSize: '12px',
        fontWeight: 700,
        fontFamily: '"Space Grotesk", sans-serif',
      }}
    >
      <Link
        href="/"
        style={{
          padding: '5px 14px',
          textDecoration: 'none',
          whiteSpace: 'nowrap',
          backgroundColor: !isIsms ? 'rgba(59,130,246,0.25)' : 'transparent',
          color: !isIsms ? '#93c5fd' : 'rgba(255,255,255,0.4)',
          transition: 'all 0.15s',
        }}
      >
        🛡️ Reports
      </Link>
      <Link
        href="/isms"
        style={{
          padding: '5px 14px',
          textDecoration: 'none',
          whiteSpace: 'nowrap',
          backgroundColor: isIsms ? 'rgba(59,130,246,0.25)' : 'transparent',
          color: isIsms ? '#93c5fd' : 'rgba(255,255,255,0.4)',
          transition: 'all 0.15s',
        }}
      >
        📋 ISMS
      </Link>
    </div>
  );
}
```

**Where to add it:**
- In `src/components/layout/TopBar.tsx` (existing app's topbar): import and add `<AppSwitcher />` as the first child of the right-side button container, with `style={{ direction: 'ltr' }}` on its wrapper to prevent RTL reversal
- In `src/app/(main)/page.tsx` (dashboard header): add `<AppSwitcher />` to the page's top-right area
- In `src/components/isms/layout/IsmsTopBar.tsx`: add `<AppSwitcher />` to its right side

---

## 15. ISMS Shell Layout

The shell at `src/app/(isms)/isms/layout.tsx` wraps all ISMS pages with the sidebar and topbar:

```tsx
// src/app/(isms)/isms/layout.tsx
'use client';
import IsmsSidebar from '@/components/isms/layout/IsmsSidebar';
import IsmsTopBar from '@/components/isms/layout/IsmsTopBar';

export default function IsmsShellLayout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      display: 'flex',
      height: '100vh',
      backgroundColor: 'var(--isms-bg0)',
      color: 'var(--isms-txt)',
      overflow: 'hidden',
    }}>
      <IsmsSidebar />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <IsmsTopBar />
        <main style={{
          flex: 1,
          overflowY: 'auto',
          padding: '24px',
        }}>
          {children}
        </main>
      </div>
    </div>
  );
}
```

### IsmsSidebar Navigation Items

The sidebar has two groups. Extract labels, icons, and routes from the HTML reference:

**CISO Command (8 items):**
| Label | Route | Icon |
|---|---|---|
| Executive Dashboard | `/isms/dashboard` | Grid icon |
| Task Board | `/isms/tasks` | Kanban icon |
| Implementation Roadmap | `/isms/roadmap` | Map icon |
| Daily Checklist | `/isms/checklist` | Checkbox icon |
| Board Report | `/isms/board-report` | Presentation icon |
| KPI Metrics | `/isms/kpis` | Chart icon |
| Supplier Management | `/isms/suppliers` | Link icon |
| Awareness Programme | `/isms/awareness` | People icon |

**ISO 27001:2022 (9 items):**
| Label | Route |
|---|---|
| Clause 4 – Context | `/isms/clause/4` |
| Clause 5 – Leadership | `/isms/clause/5` |
| Clause 6 – Planning | `/isms/clause/6` |
| Clause 7 – Support | `/isms/clause/7` |
| Clause 8 – Operation | `/isms/clause/8` |
| Clause 9 – Evaluation | `/isms/clause/9` |
| Clause 10 – Improvement | `/isms/clause/10` |
| Statement of Applicability | `/isms/soa` |

**ISMS Processes (5 items):**
| Label | Route |
|---|---|
| Risk Register | `/isms/risks` |
| Asset Inventory | `/isms/assets` |
| Incident Log | `/isms/incidents` |
| Internal Audit | `/isms/audit` |
| Documentation Register | `/isms/documents` |

Active state: highlight the nav item whose `href` matches `usePathname()`. For `/isms/clause/[id]`, highlight any item starting with `/isms/clause/`.

Sidebar bottom: Annex A quick-links in a 4-pill sub-nav (A.5 / A.6 / A.7 / A.8) linking to `/isms/annex/5` etc.

---

## 16. Page-by-Page Implementation Guide

Reference the HTML file to understand what each page shows. Implement each as a Next.js server or client component.

### Dashboard (`/isms/dashboard`)
- **6 KPI cards** at top: Overall Compliance %, Clause completion count, Annex A coverage %, Open Risks count, Open Incidents, Days to target certification date
- **Clause Compliance chart**: Recharts `BarChart` horizontal, 7 bars, colored by %, data from `computeComplianceStats()`
- **Annex A Coverage**: 4 cards (A.5/A.6/A.7/A.8) with progress bars
- **Top Risks**: Table of top 5 risks by score (likelihood × impact)
- **Certification Timeline**: 6-phase horizontal stepper using `ROADMAP_PHASES` constant
- **Overdue Tasks**: List of tasks where `dueDate < today && status !== 'done'`
- **Documentation Health**: % complete across all doc registers

### Task Board (`/isms/tasks`)
- **4 Kanban columns**: To Do, In Progress, In Review, Done
- Each column lists `TaskCard` components filtered by status
- Each card shows: title, due date badge (red if overdue, amber if ≤3 days), priority badge, assignee, domain tag
- **Filters** above: search by title, filter by assignee, priority, domain
- **Add Task** button opens `TaskModal`
- Task count shown in each column header

### Risk Register (`/isms/risks`)
- **Summary stats** row: Total risks, Open, High+Critical count, Accepted
- **Risk Heat Matrix** (`RiskHeatMatrix`): 5×5 grid, cells colored by number of risks in that L×I cell
- **Risk Table**: columns: ID, Title, Category, Asset, L, I, Score (colored badge), Treatment, Status, Owner, Actions
- Search + filter by category, status, severity level
- `RiskModal` for Add/Edit: all fields including auto-computed score display

### Statement of Applicability (`/isms/soa`)
- Table with all 93 controls: Control ID, Title, Applicable (toggle), Status dropdown, Justification (inline edit)
- Filter by: theme (A.5/A.6/A.7/A.8), applicable (yes/no/all), status
- Summary row: "X Applicable | Y Implemented | Z Not Started"
- Save button triggers `PATCH /api/isms/workspace` to update `soaData`

### Clause Pages (`/isms/clause/[id]`)
- Page title: "Clause {id} – {title from ISO_CLAUSES}"
- Purpose description paragraph
- For each requirement in the clause: `ClauseAccordion` row showing requirement ID, title, description, auditor guidance, and `ControlStatusPill` toggle
- Status saves immediately via `PATCH /api/isms/workspace` updating `clauseStatus`

### Annex A Pages (`/isms/annex/[theme]`)
- Grid of `ControlCard` components for all controls in that theme
- Each card: control ID (Fira Code font), title, description, type badge, `ControlStatusPill`
- Status saves via `PATCH /api/isms/workspace` updating `controlStatus`
- Filter bar: search by ID/title, filter by status

### Documentation Register (`/isms/documents`)
- Three tabs: Mandatory, Supporting, Policies
- Each tab: list of documents with checkbox for completion and status dropdown
- Completion badges per tab: "X Complete | Y In Progress | Z Not Started"
- Saves via `PATCH /api/isms/workspace` updating `docStatus`

### Daily Checklist (`/isms/checklist`)
- 3 category groups, 5 checkboxes each (from `DAILY_CHECKLIST` constant)
- Checks reset each day (check if `daily.date === today`, if not reset)
- CISO Daily Log: `<textarea>` for notes, saved per date in `dailyNotes`
- Saves via `PATCH /api/isms/workspace`

### Board Report (`/isms/board-report`)
- Read-only executive summary page
- ISMS scope, org name, certification target
- Compliance overview card (overall %, trend)
- Top 3 risks summary
- KPI performance table
- Print/PDF button using `window.print()`

All other pages (KPIs, Suppliers, Awareness, Assets, Incidents, Audit) follow the same pattern: summary KPI cards at top, searchable/filterable table, modal for Add/Edit.

---

## 17. API Client

Create `src/lib/isms/api.ts` with typed fetch functions:

```typescript
// src/lib/isms/api.ts

const BASE = '/api/isms';

export async function getWorkspace(): Promise<IsmsWorkspace> { ... }
export async function updateWorkspace(data: Partial<IsmsWorkspace>): Promise<IsmsWorkspace> { ... }

export async function getRisks(): Promise<IsmsRisk[]> { ... }
export async function createRisk(data: Partial<IsmsRisk>): Promise<IsmsRisk> { ... }
export async function updateRisk(id: string, data: Partial<IsmsRisk>): Promise<IsmsRisk> { ... }
export async function deleteRisk(id: string): Promise<void> { ... }

// ... same pattern for all 10 entity types
```

---

## 18. Implementation Order

Implement in this exact sequence to avoid blockers:

1. **Route group restructure** — modify `src/app/layout.tsx`, create `src/app/(main)/layout.tsx`, move existing pages, create `src/app/(isms)/layout.tsx`. Verify all existing routes still work before proceeding.

2. **Database schema** — add all ISMS models to `prisma/schema.prisma`, run `prisma migrate dev`, run `prisma generate`.

3. **Types and constants** — create `src/types/isms.ts`, `src/lib/isms/constants.ts` (with full static data from reference), `src/lib/isms/calculations.ts`.

4. **API routes** — create all `src/app/api/isms/` routes. Test with curl before building UI.

5. **Zustand store** — create `src/store/ismsStore.ts`, wire up to API client.

6. **Shell layout** — create `IsmsSidebar.tsx`, `IsmsTopBar.tsx`, and `src/app/(isms)/isms/layout.tsx`. Verify `/isms` loads with correct shell before building pages.

7. **Shared components** — `StatusBadge`, `ProgressBar`, `KpiCard`, `Modal`, `ControlStatusPill`.

8. **Dashboard page** — implement all dashboard widgets. This validates the data flow end-to-end.

9. **Remaining pages** — implement in priority order: Risks → Tasks → SoA → Clauses → Annex A → Documents → Incidents → Assets → Audit → KPIs → Suppliers → Awareness → Checklist → Roadmap → Board Report.

10. **App Switcher** — add to both the existing app's header and the ISMS topbar.

---

## 19. Verification Checklist

- [ ] All existing routes (`/`, `/settings`, `/analytics`, `/report/[id]`) still work at same URLs
- [ ] Existing app is still Arabic RTL with Cairo font
- [ ] `/isms` redirects to `/isms/dashboard`
- [ ] ISMS app is English LTR with Space Grotesk font
- [ ] No Arabic characters visible in ISMS interface
- [ ] App Switcher shows "Reports" active on `/` and "ISMS" active on `/isms`
- [ ] App Switcher pill order is always "Reports | ISMS" (not reversed) in both interfaces
- [ ] All 93 Annex A controls are visible across the SoA and Annex pages
- [ ] All 7 clauses (4–10) are accessible via the sidebar
- [ ] Clause status changes save to DB and reflect in the dashboard compliance chart
- [ ] Risk score is auto-computed as L × I with correct color coding
- [ ] Task board shows cards in correct columns
- [ ] `npm run build` completes without TypeScript errors
- [ ] No console errors in either interface
