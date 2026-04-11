---
mode: agent
description: Scaffold a complete new feature from scratch
---

## New Feature: ${input:featureName}

### Steps the agent must follow:

1. **Understand scope first** - Read the existing codebase to understand patterns, naming conventions, and architecture before writing any code.
2. **Plan** - Write out the list of files you will create or modify. Ask for confirmation.
3. **Implement** - Create the feature following the conventions in `.github/copilot-instructions.md`.
4. **Test** - Generate a full test file alongside the implementation. Run tests and fix any failures.
5. **Document** - Add docstrings to all new functions. Update the relevant README section if it exists.
6. **Verify** - Run the linter. Fix any lint errors before finishing.

### Output checklist (confirm all before marking done):
- [ ] Feature code implemented
- [ ] Tests written and passing
- [ ] No lint errors
- [ ] Docstrings added
- [ ] No hardcoded secrets
