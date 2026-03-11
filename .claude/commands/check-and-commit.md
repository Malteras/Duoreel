# Check and Commit

Run `/check-commit-safety` first. If the verdict is safe, automatically proceed with `/commit`. If not safe, stop and report the issues — do NOT commit.

## Usage

```
/check-and-commit
```

No arguments needed.

## Instructions

### Phase 1: Safety Check

Execute the full `/check-commit-safety` procedure:

1. Run `git status` and `git diff` to identify all uncommitted changes
2. If there are no changes, inform the user and stop — nothing to do
3. Run through all 12 checklist categories (Broken Imports, Broken References, TypeScript, CxJS Conditional Rendering, Props, CSS, Routes, Event Handlers, API Calls, Environment, Tests, Dead Code)
4. Output the results in the standard `/check-commit-safety` format with the verdict

### Phase 2: Decision Gate

- If the verdict is **SAFE TO COMMIT** — proceed to Phase 3 automatically
- If the verdict is **NOT SAFE** (any broken items) — **STOP HERE**. Do NOT commit. Report the issues and let the user fix them first
- If there are only **warnings** (no broken items) — proceed to Phase 3 automatically, but mention the warnings

### Phase 3: Commit

Execute the full `/commit` procedure:

1. Check the active branch and extract the task identifier
2. Analyze the changes
3. Stage the appropriate files
4. Create the commit with the standardized message format: `{task-id} / {description}`
5. Verify the commit succeeded

## Important Rules

- NEVER skip the safety check
- NEVER commit if there are broken items
- Warnings are non-blocking — commit can proceed with warnings
- All rules from `/check-commit-safety` and `/commit` apply
