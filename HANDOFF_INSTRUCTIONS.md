# How to hand this to Codex

## Option A — simplest

1. Create a new empty GitHub repository.
2. Extract this build pack into the repository root.
3. Commit and push.
4. Open the repository in Codex.
5. Paste the entire contents of `CODEX_MASTER_PROMPT.md`.
6. Let Codex create its implementation plan and **Milestone 0 only**.
7. Review the verification/test results.
8. Then give Codex one milestone at a time.

## Exact follow-up prompt template

```text
Implement Milestone N from docs/BUILD_PLAN.md.

Read AGENTS.md and all relevant repository documentation first.
Inspect the existing code and update docs/IMPLEMENTATION_PLAN.md if the implementation approach changes.
Complete every listed build item and exit criterion for this milestone.
Add/update automated tests.
Run npm run verify.
Do not begin Milestone N+1.

At the end, report:
- files changed,
- tests run and results,
- manual checks,
- any deviations from the spec,
- remaining risks,
- the next milestone.
```

## Bug-fix prompt

```text
Reproduce this bug with an automated test first.
Fix the root cause, not just the symptom.
Run the targeted tests and npm run verify.
Update repository documentation if the behavior contract changed.
```

## What you should not tell Codex

Do not simply say:
"Build the whole SCORE app."

That invites a giant unverified code dump.

The repository is deliberately structured so Codex can work autonomously in bounded milestones and leave behind tests and documented decisions.
