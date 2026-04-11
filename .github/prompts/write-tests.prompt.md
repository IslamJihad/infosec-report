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
