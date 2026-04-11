# VS Code 1.115 Workflow Guide | دليل سير العمل في VS Code 1.115

This guide explains how to use this repository with modern VS Code agent-native workflows.

يوضح هذا الدليل أفضل طريقة لاستخدام هذا المستودع مع ميزات VS Code الحديثة الخاصة بالوكلاء.

## 1. What Was Added | ما الذي تمت إضافته

- Workspace config files in `.vscode`:
  - `settings.json`
  - `tasks.json`
  - `extensions.json`
  - `launch.json`
- Repo-level Copilot guidance:
  - `.github/copilot-instructions.md`
  - `.github/prompts/agent-maintenance.prompt.md`
- New npm scripts in `package.json` for Prisma, ISMS generation, and verification.

## 2. Quick Start | البدء السريع

```bash
npm install
npm run dev:setup
npm run dev
```

Or run the combined bootstrap command:

```bash
npm run dev:bootstrap
```

أو استخدم الأمر الموحّد:

```bash
npm run dev:bootstrap
```

## 3. Validation Loop | دورة التحقق

```bash
npm run verify:prisma
npm run verify:typecheck
npm run verify:lint
npm run build
```

هذه الدورة هي المسار الموصى به قبل الدمج أو النشر.

## 4. Prisma Safety | أمان Prisma

- After `prisma/schema.prisma` changes, always run:

```bash
npm run prisma:generate
```

- Normal schema sync:

```bash
npm run prisma:push
```

- Force sync only when data loss is acceptable:

```bash
npm run prisma:push:force
```

If you see unknown Prisma fields during save/update, regenerate the client and restart dev server.

## 5. ISMS Generator Workflow | سير عمل مولد ISMS

When `ISO27001-CISO-Command-Suite .html` changes, regenerate derived constants/routes:

```bash
npm run isms:generate
```

لا تعدّل الملفات المولدة مباشرة إذا كان المصدر الأساسي هو ملف HTML المرجعي.

## 6. VS Code Tasks | مهام VS Code

Open Command Palette and run: `Tasks: Run Task`.

Recommended tasks:
- `Dev: Bootstrap (setup + dev)`
- `Prisma: Generate client`
- `ISMS: Generate constants/routes`
- `Verify: Full`

## 7. Optional VS Code 1.115 Features | ميزات اختيارية في 1.115

These are intentionally optional for hybrid compatibility (stable + insiders).

- Browser chat tools:
  - `workbench.browser.enableChatTools`
- Background terminal notifications (experimental):
  - `chat.tools.terminal.backgroundNotifications`

You can uncomment these keys in `.vscode/settings.json` if your environment supports them.

## 8. Integrated Browser Suggestions | اقتراحات المتصفح المدمج

Use the integrated browser to quickly validate:
- Main report experience on `/`
- ISMS experience on `/isms`
- Preview/print related pages under `/report/.../preview`

## 9. Deprecation Notice | ملاحظة الإيقاف

VS Code Edit Mode is deprecated and is scheduled for full removal in later versions.
Prefer Agent workflows and normal file editing instead of relying on Edit Mode fallback settings.

## 10. Troubleshooting | استكشاف الأخطاء

1. Prisma unknown fields:
- Run `npm run prisma:generate`.
- Restart `npm run dev`.

2. SQLite target mismatch (`dev.db` vs `prisma/dev.db`):
- Verify `DATABASE_URL` in `.env` / `.env.local`.

3. ESLint flat config path usage:
- Use positional paths (example: `npm run lint src/app/page.tsx`).
- Avoid legacy `--file` flag patterns.
