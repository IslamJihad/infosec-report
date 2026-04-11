# GitHub Copilot - Project Instructions

## Project Overview
This repository is a Next.js App Router application for information security reporting with two experiences: an Arabic RTL main reporting app and an English LTR ISO 27001 ISMS suite. It uses Prisma with SQLite for persistence and includes API routes, dashboard flows, and report preview/export functionality. The codebase is TypeScript-first with supporting Node.js scripts for generation and maintenance tasks.

## Tech Stack
- **Language(s):** TypeScript, JavaScript, CSS
- **Framework(s):** Next.js (App Router), React
- **Database:** SQLite via Prisma ORM
- **Test Runner:** Not detected - ask the user
- **Package Manager:** npm

## Coding Conventions
- Always add type hints / type annotations to all functions and methods
- Use meaningful variable names - avoid single-letter names except loop counters
- Every public function must have a docstring / JSDoc comment
- Prefer composition over inheritance
- Handle errors explicitly - never use bare `except` or `catch (e) {}`
- No hardcoded secrets or credentials - use environment variables
- Write self-documenting code; add inline comments only for non-obvious logic

## Testing
- Write tests before or alongside implementation (TDD preferred)
- Test coverage must remain above 80%
- Use descriptive test names: `test_should_return_404_when_user_not_found`
- Mock external services in unit tests

## Security (Important)
- Validate and sanitize ALL user inputs before processing
- Never expose stack traces or internal errors to end users
- Use parameterized queries - never concatenate SQL strings
- Secrets must be in `.env` files, never committed to git
- Check OWASP Top 10 for any new endpoint or form

## Response Style
- When proposing changes, always show a diff or the modified section only
- Explain the "why" briefly before the code, not after
- If multiple approaches exist, list them with trade-offs before implementing
- Prefer readable code over clever one-liners
- Do NOT rewrite working code that is out of scope

## Do NOT
- Modify files outside the scope of the current task
- Remove existing comments or documentation unless asked
- Change function signatures unless explicitly requested
- Install new packages without listing them and asking first
