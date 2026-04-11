# 🤖 Copilot Agent Setup — Bootstrap Instructions

> **How to use this file:**
> Open GitHub Copilot Chat in VS Code → switch to **Agent mode** → attach this file using `@file:README-copilot-setup.md` → send the message:
>
> ```
> Read this file carefully and execute every task in order. Do not skip any step.
> Ask me before running terminal commands. Confirm each phase before moving to the next.
> ```

---

## 📋 Overview

This README instructs the Copilot Agent to fully configure this repository for maximum GitHub Copilot productivity. The agent will create all required files, folders, and settings in a single session.

**What will be created:**

| File / Folder | Purpose |
|---|---|
| `.github/copilot-instructions.md` | Global project context injected into every chat |
| `.vscode/settings.json` | Enable agent mode, MCP, thinking tool |
| `.vscode/mcp.json` | MCP server configuration |
| `.github/prompts/new-feature.prompt.md` | Reusable prompt: scaffold a new feature |
| `.github/prompts/code-review.prompt.md` | Reusable prompt: structured code review |
| `.github/prompts/security-audit.prompt.md` | Reusable prompt: OWASP security audit |
| `.github/prompts/write-tests.prompt.md` | Reusable prompt: generate + run test suite |
| `.github/prompts/fix-bug.prompt.md` | Reusable prompt: investigate and fix a bug |
| `.github/chat-modes/security.chatmode.md` | Chat mode: security-focused review |
| `.github/chat-modes/architect.chatmode.md` | Chat mode: system design and architecture |
| `.github/chat-modes/docs.chatmode.md` | Chat mode: documentation generation |
| `.copilot-ignore` | Files Copilot should never read |

---

## ✅ Phase 1 — Read the Project First

**Agent instructions:**
Before creating any files, do the following:

1. Run `ls -la` to list the project root directory.
2. Read the project's existing `package.json`, `pyproject.toml`, `requirements.txt`, `go.mod`, or equivalent dependency file — whichever exists.
3. Detect: programming language(s), framework(s), test runner, and any existing `.github/` folder.
4. Report your findings in a short summary before proceeding.
5. **Ask me to confirm** the detected stack before writing any files.

---

## ✅ Phase 2 — Create `.github/copilot-instructions.md`

**Agent instructions:**
Create the file `.github/copilot-instructions.md` with the following structure. Fill in the `[PLACEHOLDERS]` based on what you detected in Phase 1.

```markdown
# GitHub Copilot — Project Instructions

## Project Overview
[Write 2-3 sentences describing the project based on what you found in Phase 1]

## Tech Stack
- **Language(s):** [detected language(s)]
- **Framework(s):** [detected framework(s)]
- **Database:** [detected DB or "Not detected — ask the user"]
- **Test Runner:** [detected test runner or "Not detected — ask the user"]
- **Package Manager:** [npm / pip / go modules / etc.]

## Coding Conventions
- Always add type hints / type annotations to all functions and methods
- Use meaningful variable names — avoid single-letter names except loop counters
- Every public function must have a docstring / JSDoc comment
- Prefer composition over inheritance
- Handle errors explicitly — never use bare `except` or `catch (e) {}`
- No hardcoded secrets or credentials — use environment variables
- Write self-documenting code; add inline comments only for non-obvious logic

## Testing
- Write tests before or alongside implementation (TDD preferred)
- Test coverage must remain above 80%
- Use descriptive test names: `test_should_return_404_when_user_not_found`
- Mock external services in unit tests

## Security (Important)
- Validate and sanitize ALL user inputs before processing
- Never expose stack traces or internal errors to end users
- Use parameterized queries — never concatenate SQL strings
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
```

---

## ✅ Phase 3 — Update `.vscode/settings.json`

**Agent instructions:**
Create or update `.vscode/settings.json`. If the file exists, **merge** these settings — do not overwrite unrelated settings.

```json
{
  "github.copilot.chat.agent.thinkingTool": true,
  "github.copilot.chat.edits.enabled": true,
  "github.copilot.nextEditSuggestions.enabled": true,
  "github.copilot.chat.generateTests.codeLensEnabled": true,
  "github.copilot.chat.fixTestFailure.enabled": true,
  "github.copilot.chat.reviewSelection.enabled": true,
  "github.copilot.chat.commitMessageGeneration.enabled": true,
  "github.copilot.chat.pullRequestDescriptionGeneration.enabled": true,
  "github.copilot.renameSuggestions.triggerAutomatically": true,
  "chat.agent.maxRequests": 30
}
```

After writing the file, verify the merge did not break any existing JSON syntax by reading the final file back.

---

## ✅ Phase 4 — Create `.vscode/mcp.json`

**Agent instructions:**
Create the file `.vscode/mcp.json` with a starter MCP configuration. Use environment variable references for all tokens — never hardcode secrets.

```json
{
  "servers": {
    "github": {
      "type": "stdio",
      "command": "docker",
      "args": [
        "run", "-i", "--rm",
        "ghcr.io/github/github-mcp-server"
      ],
      "env": {
        "GITHUB_PERSONAL_ACCESS_TOKEN": "${env:GITHUB_TOKEN}"
      }
    },
    "playwright": {
      "type": "stdio",
      "command": "npx",
      "args": ["@playwright/mcp@latest"]
    }
  }
}
```

After creating the file, add a comment block at the top of `.vscode/mcp.json` if JSON5 is supported, or create a companion `mcp.README.md` file with instructions on:
- How to set the `GITHUB_TOKEN` environment variable
- How to add new MCP servers
- How to disable a server temporarily (add a `disabled: true` field)

---

## ✅ Phase 5 — Create Prompt Files

**Agent instructions:**
Create the directory `.github/prompts/` if it does not exist, then create all prompt files below.

---

### 5a. `.github/prompts/new-feature.prompt.md`

```markdown
---
mode: agent
description: Scaffold a complete new feature from scratch
---

## New Feature: ${input:featureName}

### Steps the agent must follow:

1. **Understand scope first** — Read the existing codebase to understand patterns, naming conventions, and architecture before writing any code.
2. **Plan** — Write out the list of files you will create or modify. Ask for confirmation.
3. **Implement** — Create the feature following the conventions in `.github/copilot-instructions.md`.
4. **Test** — Generate a full test file alongside the implementation. Run tests and fix any failures.
5. **Document** — Add docstrings to all new functions. Update the relevant README section if it exists.
6. **Verify** — Run the linter. Fix any lint errors before finishing.

### Output checklist (confirm all before marking done):
- [ ] Feature code implemented
- [ ] Tests written and passing
- [ ] No lint errors
- [ ] Docstrings added
- [ ] No hardcoded secrets
```

---

### 5b. `.github/prompts/code-review.prompt.md`

```markdown
---
mode: ask
description: Structured code review with actionable feedback
---

Review the code in ${file} (or #selection if provided).

Evaluate across these dimensions:

**1. Correctness**
- Are there logic errors or edge cases not handled?
- Can this code panic / throw an unhandled exception?

**2. Security**
- Any OWASP Top 10 violations?
- Injection risks, auth bypasses, secrets in code?

**3. Performance**
- Unnecessary loops, N+1 queries, unoptimized algorithms?

**4. Readability**
- Is the intent clear? Are names meaningful?
- Missing or misleading comments?

**5. Maintainability**
- Is this code easy to test and extend?
- Violations of SOLID principles?

**Output format:**
For each issue found, provide:
- 🔴 **Critical** / 🟡 **Warning** / 🟢 **Suggestion**
- The problematic code snippet
- Explanation of the issue
- A concrete fix with code example
```

---

### 5c. `.github/prompts/security-audit.prompt.md`

```markdown
---
mode: agent
description: Full OWASP security audit of a file or module
---

Perform a thorough security audit of ${file}.

### Checklist (check each explicitly):

- [ ] **A01 – Broken Access Control**: Are authorization checks present and correct?
- [ ] **A02 – Cryptographic Failures**: Are secrets hashed/encrypted? TLS enforced?
- [ ] **A03 – Injection**: SQL, command, LDAP injection risks?
- [ ] **A04 – Insecure Design**: Missing rate limiting, no input validation?
- [ ] **A05 – Security Misconfiguration**: Debug mode, verbose errors, default creds?
- [ ] **A06 – Vulnerable Components**: Outdated dependencies with CVEs?
- [ ] **A07 – Auth Failures**: Weak session management, no MFA support?
- [ ] **A08 – Software Integrity**: Unverified dependencies, unsafe deserialization?
- [ ] **A09 – Logging Failures**: Are security events logged? Are logs missing context?
- [ ] **A10 – SSRF**: Can user input trigger server-side requests to internal systems?

### Output:
For each finding:
1. OWASP category and severity (Critical / High / Medium / Low)
2. The vulnerable code with line reference
3. Attack scenario (how an attacker would exploit it)
4. Remediation code example

At the end, provide a **Security Score** (0–10) and a prioritized fix list.
```

---

### 5d. `.github/prompts/write-tests.prompt.md`

```markdown
---
mode: agent
description: Generate a complete test suite and run it
---

Generate a complete test suite for ${file}.

### Requirements:
1. Use the project's existing test framework (detect from project files)
2. Cover: happy paths, edge cases, error cases, boundary values
3. Use descriptive test names: `test_should_[expected]_when_[condition]`
4. Mock all external dependencies (HTTP calls, DB, file system)
5. Aim for >80% coverage of the target file

### After writing tests:
1. Run the tests using the appropriate command
2. Read the output
3. Fix any failing tests autonomously (loop until all pass)
4. Report final coverage percentage

### Do NOT:
- Write tests that always pass without actually testing behavior
- Use magic numbers without explanation
- Duplicate test logic (use fixtures/helpers)
```

---

### 5e. `.github/prompts/fix-bug.prompt.md`

```markdown
---
mode: agent
description: Investigate and fix a bug with full root cause analysis
---

## Bug Report
${input:bugDescription}

### Agent investigation steps:

1. **Reproduce** — Find the code path that triggers this bug. Identify which file(s) and function(s) are involved.
2. **Root cause** — Explain WHY the bug happens (not just where).
3. **Impact** — What other parts of the codebase could be affected?
4. **Fix** — Implement the minimal fix that resolves the root cause without breaking other functionality.
5. **Test** — Write a regression test that would have caught this bug, then run it.
6. **Verify** — Confirm existing tests still pass after the fix.

### Output format:
- Root cause summary (2-3 sentences)
- Files changed (list)
- Diff of changes
- Regression test added
```

---

## ✅ Phase 6 — Create Custom Chat Modes

**Agent instructions:**
Create the directory `.github/chat-modes/` if it does not exist, then create the following mode files.

---

### 6a. `.github/chat-modes/security.chatmode.md`

```markdown
---
description: Security-focused code review and audit mode
tools: [codebase, github, search]
---

You are operating in **Security Review Mode**.

Your priorities in this mode:
1. Identify vulnerabilities before suggesting features or improvements
2. Reference OWASP Top 10 for every finding
3. Never suggest "it's probably fine" — be specific about risks
4. Always provide a code fix, not just a description of the problem
5. Flag any hardcoded secrets, weak crypto, or missing input validation immediately

Default behavior: assume hostile user input until proven otherwise.
```

---

### 6b. `.github/chat-modes/architect.chatmode.md`

```markdown
---
description: System design, architecture, and technical decision-making
tools: [codebase, search]
---

You are operating in **Architecture Mode**.

Your priorities in this mode:
1. Think at the system level before the file level
2. Always present 2-3 architectural options with trade-offs before recommending one
3. Consider: scalability, maintainability, testability, and security
4. Draw ASCII diagrams for complex flows when helpful
5. Reference established patterns (CQRS, event-driven, layered, hexagonal) by name

Do not write implementation code in this mode unless explicitly asked.
Focus on decisions, patterns, and structure.
```

---

### 6c. `.github/chat-modes/docs.chatmode.md`

```markdown
---
description: Documentation generation — docstrings, README, API docs
tools: [codebase]
---

You are operating in **Documentation Mode**.

Your priorities in this mode:
1. Generate clear, accurate documentation that explains the "why" not just the "what"
2. Use the project's detected language conventions for docstrings (JSDoc / Python docstrings / GoDoc)
3. Include parameter types, return types, and exception/error descriptions
4. For README sections: use clear headers, code examples, and a quick-start snippet
5. Never document behavior that doesn't exist in the code

Output format: complete documentation blocks ready to paste directly into the source files.
```

---

## ✅ Phase 7 — Create `.copilot-ignore`

**Agent instructions:**
Create a `.copilot-ignore` file in the project root to prevent Copilot from reading sensitive files.

```
# Secrets and credentials
.env
.env.*
*.pem
*.key
*.p12
*.pfx
secrets/
credentials/

# Build artifacts (not useful as context)
dist/
build/
*.min.js
*.min.css
node_modules/
__pycache__/
*.pyc
.venv/
venv/

# Auto-generated files
*.lock
package-lock.json
yarn.lock

# Large data files
*.csv
*.sql
*.dump
*.db
*.sqlite
```

---

## ✅ Phase 8 — Final Verification

**Agent instructions:**
After completing all phases, perform a final check:

1. List all created files with `find .github .vscode -type f` and verify all expected files exist.
2. Validate that `.vscode/settings.json` is valid JSON (no syntax errors).
3. Validate that `.vscode/mcp.json` is valid JSON.
4. Read `.github/copilot-instructions.md` and confirm the stack placeholders were filled in (no `[PLACEHOLDER]` text remains).
5. Output a **completion report** in this format:

```
## ✅ Setup Complete

### Files Created:
- [x] .github/copilot-instructions.md
- [x] .vscode/settings.json (merged)
- [x] .vscode/mcp.json
- [x] .github/prompts/new-feature.prompt.md
- [x] .github/prompts/code-review.prompt.md
- [x] .github/prompts/security-audit.prompt.md
- [x] .github/prompts/write-tests.prompt.md
- [x] .github/prompts/fix-bug.prompt.md
- [x] .github/chat-modes/security.chatmode.md
- [x] .github/chat-modes/architect.chatmode.md
- [x] .github/chat-modes/docs.chatmode.md
- [x] .copilot-ignore

### Detected Stack:
[list what was detected]

### Next steps for you:
1. Set your GITHUB_TOKEN env variable for MCP GitHub server
2. Run `docker pull ghcr.io/github/github-mcp-server` if using GitHub MCP
3. Open Copilot Chat → try switching to "security" or "architect" mode
4. Use #file:.github/prompts/new-feature.prompt.md to scaffold your next feature
```

---

## 📌 Quick Reference — After Setup

```
# Start a new feature
→ Agent mode + attach: .github/prompts/new-feature.prompt.md

# Review code for security
→ Switch to "security" chat mode → select code → /review

# Fix a bug with full investigation
→ Agent mode + attach: .github/prompts/fix-bug.prompt.md

# Generate tests for a file
→ Agent mode + attach: .github/prompts/write-tests.prompt.md → @file:yourfile.py

# Full OWASP audit
→ Agent mode + attach: .github/prompts/security-audit.prompt.md → @file:yourfile.py
```

---

> **Maintained by:** GitHub Copilot Agent — re-run this README to regenerate or update any file.
> **Last bootstrapped:** April 11, 2026
