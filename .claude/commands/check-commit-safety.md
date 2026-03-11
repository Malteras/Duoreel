# Check Commit Safety

Review all uncommitted changes for potential breakage before committing. Designed for post-refactoring commits.

## Usage

```
/check-commit-safety
```

No arguments needed — command automatically detects all uncommitted/unstaged files via `git status` and `git diff`.

---

## What This Command Does

Runs through every uncommitted file and checks it against the categories below. For each category, it reports: status (✅ Safe / ⚠️ Warning / 🔴 Broken), affected file(s), and a short explanation of what it found or what needs attention.

At the end, it produces a **summary table** and a **verdict**: safe to commit, or here's what to fix first.

---

## Checklist Categories

### 1. Broken Imports

- Check every `import` statement in changed files — does the source path actually exist?
- Check if any file that WAS imported by other files got renamed or moved — those other files now have a dangling import
- Check barrel exports (`index.ts` / `index.js`) — if a refactor moved something out of a barrel, any consumer importing from the barrel is now broken
- Watch for: case sensitivity in paths (matters on Linux CI even if it works locally on Windows)

### 2. Broken References & Exports

- If a component, function, type, or variable was renamed in the diff — find every other file in the project that references the OLD name
- If something was removed entirely (not just renamed) — confirm nothing else still tries to use it
- Check re-exports: if file A re-exports from file B, and file B changed its export names, file A is broken

### 3. TypeScript / Type Safety

- Run a mental type-check on changed files: do prop interfaces still match how components are actually called?
- If a prop was added, removed, or renamed in an interface/type — find all usages and verify they match
- Check for `any` types that might have been introduced during refactor (flag as warning, not error)
- Generics: if a generic type constraint changed, check all places that instantiate it

### 4. CxJS / React Conditional Rendering

- CRITICAL for this project: scan all changed JSX for conditional rendering patterns
- 🔴 Flag any usage of `{condition && <Component />}`
- 🔴 Flag any usage of `{condition ? <Component /> : null}`
- ✅ Only `visible` prop pattern is allowed: `<Component visible={condition} />`
- This prevents VDOM reference errors at runtime

### 5. Props & Component Contracts

- If a component's props interface changed — find every place that component is used (`<ComponentName`) and verify the call site matches the new interface
- Required props that were added: all call sites must now pass them
- Props that were removed: call sites passing them will cause TypeScript errors (but flag anyway)
- Default props: if a default was removed, call sites relying on it are now broken silently

### 6. CSS & Styling Integrity

- If class names were changed or removed in a stylesheet — check that no JSX still references the old class name via `className`
- If a CSS module was renamed or moved — imports pointing to the old path are broken
- Check for inline styles that might have been accidentally left during refactor (flag as warning)

### 7. Route & Navigation Integrity

- If any route path strings changed — find all `navigate()`, `<Link to=`, `href`, or router config references to the old path
- If a route component was renamed or moved — check the router config still points to the correct import
- Check lazy-loaded routes: if the import path in a `React.lazy(() => import(...))` changed, the route will 404 at runtime

### 8. Event Handlers & Callbacks

- If a function that was used as an event handler (`onClick`, `onChange`, `onSubmit`, etc.) was renamed — verify the JSX referencing it was updated
- If a callback prop name changed in a parent-child relationship — both sides must match
- Check for stale closures: if a refactor moved a handler out of a component, it may have lost access to the variables it needs

### 9. API Calls & Data Flow

- If any API endpoint strings, service function names, or data-fetching hooks were touched — verify the call sites still match
- Check that response data shapes haven't been assumed differently after refactor (e.g., renamed field in a response object used elsewhere)
- If a service/repository function signature changed (params added/removed) — find all call sites

### 10. Environment & Config

- Check if any `.env` variable names, config keys, or constants were renamed — these break silently at runtime
- If a config file was moved, verify all imports to it still resolve

### 11. Test Files

- If source files were renamed/moved, check if corresponding test files (`.test.ts`, `.spec.ts`) still import from the correct paths
- Flag any test files that import from a path that no longer exists

### 12. Dead Code Left Behind

- After refactor, flag any functions, components, imports, or variables in the diff that are now completely unused
- Flag commented-out code blocks that look like they were left as "just in case" (warning, not error)

---

## Output Format

First, print the raw `git diff --stat` so it's clear what files are in scope.

Then, for each category above, output in this format:

```
### [Category Name]
| File | Status | Detail |
|------|--------|--------|
| [file.tsx](path/to/file.tsx) | ✅ Safe | No issues |
| [other.tsx](path/to/other.tsx) | 🔴 Broken | Import `./OldName` does not exist — was renamed to `./NewName` |
| [third.tsx](path/to/third.tsx) | ⚠️ Warning | `any` type introduced on line 42 |
```

**IMPORTANT:** File paths in the File column MUST be clickable markdown links using `[filename](relative/path/to/file)` format. Use the file's basename as the link text and the relative path from the workspace root as the URL.

Skip categories entirely if every file in them is ✅ Safe — don't clutter the output.

At the very end, print the verdict:

```
---
## Verdict
🟢 SAFE TO COMMIT — no issues found.
```

or

```
---
## Verdict
🔴 NOT SAFE — X issues must be fixed before committing.
⚠️ Y warnings — review but not blocking.

### Must fix:
1. [brief description + file]
2. [brief description + file]

### Review before commit:
1. [brief description + file]
```

---

## Notes

- This command does NOT auto-fix anything. It is read-only analysis only.
- If the project has a build script (`npm run build` / `npx tsc --noEmit`), suggest running it after the issues are resolved as a final confirmation.
- Prioritize 🔴 Broken items in the output — those are the ones that will actually crash or fail at runtime/build.
