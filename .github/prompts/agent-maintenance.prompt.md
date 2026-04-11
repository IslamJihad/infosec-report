---
description: Bootstrap and validate this repository with the VS Code 1.115 workflow
---

You are working on the infosec-report repository.

Goal:
- Prepare the repo for development and run a safe verification loop.

Process:
1. Run `npm run dev:setup`.
2. Run `npm run verify:prisma`.
3. Run `npm run verify:typecheck`.
4. Run `npm run verify:lint`.
5. If all pass, summarize status and suggest the next action (`npm run dev` or `npm run dev:bootstrap`).

Rules:
- If Prisma schema/client mismatch appears, run `npm run prisma:generate` and retry the failed step.
- If lint fails, report the first actionable errors with file paths.
- Do not run destructive database commands unless explicitly requested.
