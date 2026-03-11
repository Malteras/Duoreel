# Commit Command

Create a git commit with a standardized message format based on the current branch name.

## Usage

```
/commit
```

## Instructions

When this command is invoked:

1. **Check the active branch**
   - Run `git branch --show-current` to get the current branch name
   - Extract the task identifier (e.g., `ddref-153` from `ddref-153-ui-components`)
   - The task identifier is the part before the first hyphen followed by a number, then stop after that number portion

2. **Analyze the changes**
   - Run `git status` to see all modified, added, and deleted files
   - Run `git diff --stat` to see the scope of changes
   - Run `git diff` to understand what was actually changed

3. **Stage the appropriate files**
   - Stage only the relevant files for this commit
   - Do NOT stage files that contain secrets (.env, credentials, etc.)
   - Prefer staging specific files rather than using `git add -A`

4. **Create the commit message**
   - Format: `{task-id} / {description}`
   - Example: `ddref-153 / add status badge component`
   - The description should be:
     - Lowercase (except for proper nouns/acronyms)
     - Concise (under 50 characters if possible)
     - Describe WHAT was done, not HOW
     - Use present tense verbs: add, fix, update, remove, refactor, rename

5. **Create the commit**
   - Use a HEREDOC to ensure proper formatting for multi-line messages

6. **Verify the commit**
   - Run `git status` to confirm the commit was successful
   - Show the user the commit hash and message

## Commit Message Examples

Good examples:
- `ddref-153 / add StatusBadge component`
- `ddref-153 / fix type error in Controller`
- `ddref-153 / refactor status enums for consistency`
- `ddref-153 / remove duplicate Status type`
- `ddref-153 / update imports to use StatusAction`

Bad examples:
- `ddref-153 / Updated the status badge component to use the new enum` (too long, past tense)
- `ddref-153 / changes` (too vague)
- `Fixed bug` (missing task ID)

## Important Rules

- NEVER commit without checking the branch first
- NEVER use `git add -A` or `git add .` blindly
- NEVER commit .env files or credentials
- NEVER amend previous commits unless explicitly asked
- ALWAYS verify the commit succeeded
- If there are no changes to commit, inform the user instead of creating an empty commit
