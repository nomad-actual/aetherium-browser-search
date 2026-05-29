---
name: code-review
description: Evaluate code quality focusing on readability, bugs, brittleness, and maintenance burden. Use when asked to review, audit, or evaluate code quality — review PRs, critique functions, or check a file/module before merging.
---

# Code Review Skill

Perform structured code reviews that prioritize **readability**, **bug detection**, **brittleness**, and **maintainability**.

## Process

1. **Understand scope** — identify the file(s) or module being reviewed and the broader context (related files, calling code, dependencies).
2. **Read the full file** — do not cherry-pick lines. Understand control flow, data flow, and intent.
3. **Evaluate across four axes** (see criteria below).
4. **Return structured results** — use the output format.

## Evaluation Criteria

### 1. Readability

- Are names descriptive and consistent? (variables, functions, classes, modules)
- Is there a clear separation of concerns?
- Does the code explain *why*, not just *what*? (meaningful comments vs. noise)
- Is the complexity manageable? (single responsibility, no god functions, max ~80-100 lines per function)
- Are error messages and logging informative?

### 2. Bugs

- Off-by-one errors in loops, slices, or array indexing
- Null/undefined/None paths — is every possible value handled?
- Race conditions, especially around shared mutable state
- Resource leaks (unclosed connections, files, streams, listeners)
- Incorrect type usage or coercion
- Missing `await` on async calls
- Error paths that silently swallow failures
- XSS/SQLi/injection vectors in user input
- Security issues: hardcoded secrets, missing auth checks, unsafe deserialization

### 3. Brittleness

- Tight coupling between modules — can this change without ripple effects?
- Magic numbers, strings, or config scattered throughout code
- Fragile error handling (e.g., catching all errors generically without recovery)
- Coupling to specific implementation details of dependencies (rather than interfaces)
- No guard rails — missing validation on public APIs or external inputs
- Test coverage gaps, especially around edge cases
- Over-reliance on a single library, service, or external dependency without fallback

### 4. Maintainability

- Is the code DRY without being clever? (avoid meta-programming or obscurity for brevity)
- Are configuration values extracted to constants or config objects?
- Is there a clear upgrade path? (deprecated APIs, version pins, TODOs)
- Does following common patterns make sense, or is this a justified deviation?
- Is the file structure logical? (related code together, clear module boundaries)
- Are there circular dependencies?
- Is error handling consistent across the codebase?

## Review Process

When reviewing, follow these steps:

1. **Scope identification** — read all referenced files, not just the one mentioned
2. **Static analysis** — mentally trace through the code for logical flow
3. **Context check** — verify imports/exports match usage, check type consistency
4. **Risk assessment** — flag anything that could cause production issues
5. **Suggestions** — provide concrete, minimal improvements. Prefer small, focused changes over rewrites.

## Output Format

Return your review in this structure:

```markdown
## Code Review: [File/Module Name]

### Summary
[2-3 sentence overview of the code's quality and main concerns]

### Issues Found

#### Bugs (Severity: Critical/High/Medium/Low)
- **`file.ext:line`** — Description of the bug and suggested fix
- ...

#### Readability
- **`file.ext:line`** — Description and suggested improvement
- ...

#### Brittleness
- **`file.ext:line`** — Description and why it's fragile
- ...

#### Maintainability
- **`file.ext:line`** — Description and improvement suggestion
- ...

### Positive Notes
- Things done well

### Actionable Recommendations
1. [ ] [Critical/high priority fix — description]
2. [ ] [Improvement — description]
3. [ ] [Nice to have — description]
```

## Rules

- Be specific. Reference exact lines or code snippets.
- Distinguish between bugs (will cause failures) and style suggestions.
- Do not nitpick personal style preferences — focus on things that affect correctness or long-term health.
- If code is already good, say so explicitly. Don't fabricate issues.
- When suggesting changes, provide the actual code diff or rewrite, not just descriptions.
- Consider the project's maturity level — a prototype deserves different scrutiny than production code.
