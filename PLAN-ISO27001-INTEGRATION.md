# ISO 27001 CISO Command Suite — Integration Architecture Plan

> **Purpose:** This document describes exactly what an AI agent needs to do to embed `ISO27001-CISO-Command-Suite .html` as a fully isolated second interface inside the existing Next.js InfoSec Report app. No code in either app is shared or modified except for navigation wiring. Read this entire document before touching any files.

---

## 1. Overview

### The Two-App Strategy

The product will have **two separate interfaces** reachable from the same domain:

| Interface | Route | Description | Tech |
|---|---|---|---|
| **Report Generator** | `/` | Arabic RTL CISO report builder | Next.js + React + SQLite |
| **ISO 27001 ISMS Suite** | `/iso27001` | English LTR ISMS lifecycle manager | Vanilla JS HTML, localStorage |

The ISO 27001 HTML file is served as a static asset (`public/iso27001/index.html`) and embedded inside a full-screen `<iframe>` at the `/iso27001` route. This approach requires:
- **Zero changes** to the HTML app's code
- **Zero shared state** between the two apps
- The HTML app retains full access to `localStorage` (same-origin)
- The HTML app retains full access to its Google Fonts CDN links

### Why iframe?

The HTML app is a self-contained 1-file application with its own CSS, JS, fonts, and data model. Porting it to React would require rewriting ~3000 lines of code and risks introducing regressions. The iframe creates a clean DOM boundary: the parent page's `dir="rtl"` and Arabic fonts are completely invisible inside the iframe, which has its own `<html lang="en" dir="ltr">`.

---

## 2. Directory Structure — What to Create

```
d:/infosec-report/
├── public/
│   └── iso27001/
│       └── index.html                        ← COPY of ISO27001-CISO-Command-Suite .html
│
├── src/
│   ├── app/
│   │   └── iso27001/
│   │       ├── layout.tsx                    ← NEW: LTR, full-screen, no Sidebar/TopBar
│   │       └── page.tsx                      ← NEW: full-screen iframe
│   │
│   └── components/
│       └── layout/
│           └── AppSwitcher.tsx               ← NEW: two-pill interface toggle
│
├── PLAN-ISO27001-INTEGRATION.md              ← this file
└── PLAN-ISO27001-DATA-BRIDGE.md              ← companion data bridge document
```

**Existing files to modify (minimal changes):**

```
src/components/layout/TopBar.tsx              ← add <AppSwitcher /> to button row
src/app/page.tsx                              ← add <AppSwitcher /> to dashboard header
```

---

## 3. Step 1 — Copy the HTML File

**Action:** Copy the file `ISO27001-CISO-Command-Suite .html` (note the space before `.html`) to `public/iso27001/index.html`.

```bash
# From the project root (d:/infosec-report):
cp "ISO27001-CISO-Command-Suite .html" public/iso27001/index.html
```

**Why this path?** Next.js serves everything in `public/` at the corresponding URL. `public/iso27001/index.html` becomes accessible at `http://localhost:3000/iso27001/index.html`. In standalone Docker builds, the `public/` directory is copied automatically into `.next/standalone/public/` — no `next.config.ts` changes needed.

**Verify:** After copying, open `http://localhost:3000/iso27001/index.html` directly in a browser. The full HTML app should render with all styles and functionality working. If Google Fonts fail, check the network tab — this is a CSP issue (see Section 9).

---

## 4. Step 2 — Create the ISO27001 Layout

**File to create:** `src/app/iso27001/layout.tsx`

```tsx
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'ISO 27001 CISO Command Suite',
  description: 'ISO 27001:2022 ISMS Lifecycle Manager',
};

export default function ISO27001Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        display: 'flex',
        flexDirection: 'column',
        direction: 'ltr',
        fontFamily: 'sans-serif',
      }}
    >
      {children}
    </div>
  );
}
```

**Key decisions:**
- Uses a `<div>`, not `<html>`. The root `src/app/layout.tsx` already emits `<html lang="ar" dir="rtl">`. Nested layouts cannot change `<html>` attributes — they inject into `<body>` only. The `<div>` wrapper with `direction: 'ltr'` is sufficient because this layout renders nothing visible except the full-screen iframe, which is its own isolated document.
- `position: fixed; inset: 0` makes this a viewport-filling container with no scrollbars or overflow from the parent.
- No `Sidebar`, no `TopBar`, no Cairo font link. The ISMS tool is completely chrome-free.

---

## 5. Step 3 — Create the ISO27001 Page

**File to create:** `src/app/iso27001/page.tsx`

```tsx
export default function ISO27001Page() {
  return (
    <iframe
      src="/iso27001/index.html"
      title="ISO 27001 CISO Command Suite"
      style={{
        flex: 1,
        width: '100%',
        height: '100%',
        border: 'none',
        display: 'block',
      }}
    />
  );
}
```

**Key decisions:**

- **No `sandbox` attribute.** The HTML app uses `localStorage` to save all its data. The `sandbox` attribute (even with `allow-same-origin allow-scripts`) can sometimes interfere with localStorage access depending on browser implementation. Since this is same-origin (both served from `localhost:3000`), there is no security benefit to sandboxing. If sandboxing is added later, use exactly: `sandbox="allow-scripts allow-same-origin allow-forms allow-downloads"`.

- **`flex: 1`** combined with the parent layout's `flexDirection: 'column'` and `position: fixed; inset: 0` makes the iframe fill the exact viewport.

- **This is a Server Component** (no `'use client'`). No React state needed — the iframe manages itself.

- **The `src` points to a static file**, not a Next.js route. It is served from `public/`. This is intentional — it bypasses React rendering entirely.

---

## 6. Step 4 — Create the App Switcher Component

**File to create:** `src/components/layout/AppSwitcher.tsx`

```tsx
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function AppSwitcher() {
  const pathname = usePathname();
  const isISO = pathname.startsWith('/iso27001');

  return (
    <div
      className="flex items-center rounded-xl overflow-hidden text-xs font-bold"
      style={{
        direction: 'ltr',
        border: '1px solid rgba(255,255,255,0.15)',
        backgroundColor: 'rgba(255,255,255,0.05)',
      }}
      title="Switch interface"
    >
      <Link
        href="/"
        className="no-underline"
        style={{
          padding: '5px 12px',
          backgroundColor: !isISO ? 'rgba(255,255,255,0.2)' : 'transparent',
          color: !isISO ? '#ffffff' : 'rgba(255,255,255,0.6)',
          transition: 'all 0.15s',
          whiteSpace: 'nowrap',
        }}
      >
        🛡️ Reports
      </Link>
      <Link
        href="/iso27001"
        className="no-underline"
        style={{
          padding: '5px 12px',
          backgroundColor: isISO ? 'rgba(255,255,255,0.2)' : 'transparent',
          color: isISO ? '#ffffff' : 'rgba(255,255,255,0.6)',
          transition: 'all 0.15s',
          whiteSpace: 'nowrap',
        }}
      >
        📋 ISMS
      </Link>
    </div>
  );
}
```

**Key decisions:**

- **`style={{ direction: 'ltr' }}`** on the wrapper div is critical. Without it, the parent `<html dir="rtl">` would reverse the pill order, showing "ISMS" on the left and "Reports" on the right — the opposite of the intended reading order.

- **Uses `usePathname()`** from `next/navigation` for active state detection. This requires `'use client'`.

- **Inline styles** (not Tailwind classes) are used for the active/inactive color states to avoid Tailwind purge issues at runtime. For the layout (flex, rounded, overflow), Tailwind classes are safe to use.

- **`'use client'`** is required for `usePathname`. The component itself has no side effects or data fetching — it renders immediately with no loading state.

---

## 7. Step 5 — Add App Switcher to TopBar

**File to modify:** `src/components/layout/TopBar.tsx`

First, read the file to understand the current structure. The TopBar renders inside the report editor (`src/app/report/[id]/page.tsx`). It has a flex row with the section title on one side and a cluster of buttons on the other.

**Change:** Add `import AppSwitcher from '@/components/layout/AppSwitcher'` at the top, then insert `<AppSwitcher />` as the **first child** of the right-side flex container (the div containing the save status and action buttons).

Example of the target location (the exact JSX will vary — read the file first):

```tsx
// BEFORE:
<div className="flex items-center gap-3">
  <span className="text-xs ...">...</span>
  {/* buttons */}
</div>

// AFTER:
<div className="flex items-center gap-3">
  <AppSwitcher />         {/* ADD THIS LINE */}
  <span className="text-xs ...">...</span>
  {/* buttons — unchanged */}
</div>
```

The `gap-3` already handles spacing. No other changes to TopBar.

---

## 8. Step 6 — Add App Switcher to the Dashboard

**File to modify:** `src/app/page.tsx`

The dashboard (`/`) does not use `TopBar.tsx` — it has its own header section. Read the file and find the `<header>` or top-bar equivalent div. Add `<AppSwitcher />` there, positioned consistently with where it appears in TopBar (the right/end side of the header).

Import path: `import AppSwitcher from '@/components/layout/AppSwitcher'`

The AppSwitcher will show "Reports" as active (highlighted) when the user is on `/`, since `pathname.startsWith('/iso27001')` will be false.

---

## 9. Security Considerations

### localStorage Namespace

The HTML app stores its state under a single key (the variable `STORAGE_KEY` defined in its JS). The Report app does not use localStorage at all — it uses SQLite via Prisma. There is **no collision risk** between the two apps' data.

However, if the `STORAGE_KEY` in the HTML app happens to use a generic name (like `"state"` or `"data"`), verify it is unique enough to not collide with any browser extension or other app running on the same origin. If needed, the key can be changed inside the HTML file to something like `isms_ciso_v4`.

### Content Security Policy (CSP)

If the deployment environment enforces a `Content-Security-Policy` header (common in production), the following directives must permit the HTML app's external dependencies:

```
style-src  'self' https://fonts.googleapis.com 'unsafe-inline';
font-src   'self' https://fonts.gstatic.com;
script-src 'self' 'unsafe-inline';
```

The `'unsafe-inline'` entries are required because the HTML app uses inline `<style>` blocks and inline `<script>` tags. This is expected for a single-file app. The alternative would be refactoring the HTML app, which is out of scope.

Add these to `next.config.ts` under `headers()` if CSP is enforced:

```ts
// In next.config.ts headers() callback:
{
  key: 'Content-Security-Policy',
  value: "default-src 'self'; style-src 'self' https://fonts.googleapis.com 'unsafe-inline'; font-src 'self' https://fonts.gstatic.com; script-src 'self' 'unsafe-inline'; img-src 'self' data:;"
}
```

### iframe and postMessage

The current implementation has **no postMessage communication** between the parent and iframe. This is intentional — the two apps are isolated. The data bridge (see `PLAN-ISO27001-DATA-BRIDGE.md`) uses a manual export/import flow through JSON files, not live postMessage. If live sync is added in the future, it must use `window.addEventListener('message', ...)` with strict origin validation.

---

## 10. Build and Deployment

### Development

```bash
npm run dev
# Visit http://localhost:3000       → Report Generator
# Visit http://localhost:3000/iso27001 → ISO 27001 ISMS Suite
```

### Production Build

No changes to `next.config.ts` are required. The `output: 'standalone'` setting already copies `public/` into `.next/standalone/public/`. The file `public/iso27001/index.html` will be included automatically.

```bash
npm run build
npm start
```

### Docker

The `Dockerfile` copies `.next/standalone` and `.next/static`. The `public/` directory is included in the standalone output. Verify by checking `.next/standalone/public/iso27001/index.html` exists after building.

If the Dockerfile has explicit `COPY` steps for static files, add:

```dockerfile
COPY --from=builder /app/public/iso27001 /app/public/iso27001
```

---

## 11. Navigation and User Experience

### Switching Between Interfaces

The App Switcher pill appears in:
- The TopBar in the report editor (`/report/[id]`)
- The dashboard header (`/`)

When a user clicks "ISMS", the browser navigates to `/iso27001`. The ISO 27001 app loads fresh in its iframe. When the user clicks "Reports", they return to `/`. Both are full page navigations — the browser's back button works as expected.

### Bookmarking

Users can bookmark `/iso27001` directly. The Next.js page at that route will always render the iframe. The HTML app restores its state from `localStorage` on load, so bookmarking the ISO27001 interface is equivalent to bookmarking any other app.

### Deep-Linking Within the HTML App

The HTML app uses a JavaScript `nav()` function to switch between its 25 pages — it does not change the browser URL. This means you cannot deep-link to a specific page within the ISMS tool (e.g., `/iso27001/risk-register`). This is a known limitation of the iframe approach. If deep-linking is required in the future, the HTML app would need to be modified to update `window.parent.location.hash` via `postMessage`, which is a future enhancement.

---

## 12. Future Enhancements (Out of Scope for Initial Implementation)

These are not required now but document the upgrade path:

1. **Route Group Restructure:** If the Arabic/English layout split becomes complex, move all existing routes into `src/app/(arabic)/` and `src/app/(english)/iso27001/`. This gives each interface its own root-level layout with proper `<html>` attributes. Requires moving ~10 files.

2. **postMessage Live Sync:** After saving data in the HTML app, fire `window.parent.postMessage({ type: 'iso27001-saved', data: exportedState }, window.location.origin)`. The parent Next.js page listens and syncs to the Report app's database. This replaces the manual export/import workflow.

3. **Shared Auth Session:** Both apps currently have no authentication. If auth is added, the session cookie (same-origin) will be available to both the Next.js app and the iframe, enabling seamless identity sharing without any changes to the HTML app.

4. **React Migration:** The HTML app can be progressively migrated into proper Next.js components. Start by extracting the `state` object into a Zustand store, then replace one page at a time. The iframe approach remains in place during migration as a fallback.

---

## 13. Verification Checklist

After implementing all steps, verify the following:

- [ ] `http://localhost:3000/iso27001/index.html` renders the HTML app directly (confirms static file is in place)
- [ ] `http://localhost:3000/iso27001` renders the HTML app inside the iframe with no Arabic UI chrome
- [ ] App Switcher appears in both the dashboard header and the TopBar
- [ ] Clicking "Reports" from `/iso27001` navigates back to `/` without errors
- [ ] Clicking "ISMS" from `/` navigates to `/iso27001`
- [ ] The "Reports" pill is highlighted when on `/` or `/report/[id]`
- [ ] The "ISMS" pill is highlighted when on `/iso27001`
- [ ] The pill order shows "Reports | ISMS" left-to-right (not reversed by RTL)
- [ ] Data entered in the HTML app persists after a page refresh (localStorage working)
- [ ] The Export button in the HTML app downloads a JSON file
- [ ] Google Fonts load inside the iframe (Space Grotesk, Fira Code visible)
- [ ] `npm run build` completes without errors
- [ ] `.next/standalone/public/iso27001/index.html` exists after build
