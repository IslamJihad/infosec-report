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
- Critical / Warning / Suggestion
- The problematic code snippet
- Explanation of the issue
- A concrete fix with code example
