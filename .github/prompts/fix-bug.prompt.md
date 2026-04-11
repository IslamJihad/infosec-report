---
mode: agent
description: Investigate and fix a bug with full root cause analysis
---

## Bug Report
${input:bugDescription}

### Agent investigation steps:

1. **Reproduce** - Find the code path that triggers this bug. Identify which file(s) and function(s) are involved.
2. **Root cause** - Explain WHY the bug happens (not just where).
3. **Impact** - What other parts of the codebase could be affected?
4. **Fix** - Implement the minimal fix that resolves the root cause without breaking other functionality.
5. **Test** - Write a regression test that would have caught this bug, then run it.
6. **Verify** - Confirm existing tests still pass after the fix.

### Output format:
- Root cause summary (2-3 sentences)
- Files changed (list)
- Diff of changes
- Regression test added
