# Check Duplicates Command

Analyze a component for potential duplicates and merge opportunities.

## Usage

```
/check-duplicates {path}
```

## Instructions

When this command is invoked:

1. **Analyze the target component** at the provided path
    - Understand its purpose, props, logic, and styling
    - Identify its key features and responsibilities

2. **Search the codebase** for similar components
    - Look for components with similar names, props, or functionality
    - Check common component directories (e.g., `/components`, `/src/components`, etc.)
    - Consider both exact matches and conceptually similar components

3. **Only create a comparison table if there are "Yes" or "Maybe" merge candidates.** Skip the table entirely if all findings are "No" — just state that no duplicates were found.

    When a table is warranted, use these columns:

    | Component Path    | Similarity      | Key Differences       | Props Overlap | Possible Merge            |
    | ----------------- | --------------- | --------------------- | ------------- | ------------------------- |
    | path/to/component | High/Medium/Low | List main differences | XX%           | 🟢 Yes / 🟡 Maybe / 🔴 No |

    **Column Guidelines:**
    - **Similarity**: High (>80% similar), Medium (50-80%), Low (<50%)
    - **Key Differences**: Bullet points of main functional/structural differences
    - **Props Overlap**: Percentage of shared props/interface
    - **Possible Merge**:
        - 🟢 **Yes** - Components are nearly identical or one is a strict subset
        - 🟡 **Maybe** - Significant overlap but notable differences exist
        - 🔴 **No** - Different enough to warrant separate existence

4. **For each "Yes" or "Maybe" merge candidate**, provide a detailed merge plan:

    ### Merge Plan: {Target} ← {Destination}

    **Merge Strategy**: [Describe overall approach - absorb into existing, create new unified component, etc.]

    **Step-by-step execution:**

    #### Step 1: [Action Name]
    - **What**: Describe what to do
    - **Why**: Explain the reasoning and benefits
    - **How**: Technical implementation details
    - **Risk**: Any potential issues to watch for

    #### Step 2: [Action Name]
    - **What**: ...
    - **Why**: ...
    - **How**: ...
    - **Risk**: ...

    [Continue for all steps]

    **Expected Benefits:**
    - Reduced code duplication
    - Improved maintainability
    - [Other specific benefits]

    **Migration Effort**: [Low/Medium/High] - [Estimated time/complexity]

5. **If no duplicates found**, state this in one or two sentences. Do not list components that were checked and rejected — only mention any noteworthy side observation (e.g. a different pair of files that are candidates for merging with each other).

## Example Output Structure

### Analysis Summary

Target component: `src/components/Button/PrimaryButton.tsx`

Found 3 similar components in the codebase.

### Comparison Table

| Component Path                           | Similarity | Key Differences                                          | Props Overlap | Possible Merge |
| ---------------------------------------- | ---------- | -------------------------------------------------------- | ------------- | -------------- |
| `src/components/Button/ActionButton.tsx` | High       | • Only styling differences<br>• Same onClick logic       | 95%           | 🟢 Yes         |
| `src/components/Common/StyledButton.tsx` | Medium     | • Has loading state<br>• Different size variants         | 70%           | 🟡 Maybe       |
| `src/components/Form/SubmitButton.tsx`   | Low        | • Form-specific validation<br>• Different event handling | 40%           | 🔴 No          |

### Merge Plans

#### Plan A: Merge PrimaryButton ← ActionButton

**Merge Strategy**: Consolidate both components into a single `Button` component with variant props.

**Step 1: Create unified Button component**

- **What**: Create new `src/components/Button/Button.tsx` with variant prop
- **Why**: Centralizes button logic and reduces duplication
- **How**: Combine prop interfaces, add `variant: 'primary' | 'action'` prop
- **Risk**: Ensure all existing usages are compatible

**Step 2: Update PrimaryButton usages**

- **What**: Replace all `<PrimaryButton>` with `<Button variant="primary">`
- **Why**: Maintains same visual appearance and behavior
- **How**: Use find-and-replace with manual verification
- **Risk**: Check for edge cases where props differ

**Step 3: Update ActionButton usages**

- **What**: Replace all `<ActionButton>` with `<Button variant="action">`
- **Why**: Maintains same visual appearance and behavior
- **How**: Use find-and-replace with manual verification
- **Risk**: Same as Step 2

**Step 4: Remove old components**

- **What**: Delete `PrimaryButton.tsx` and `ActionButton.tsx`
- **Why**: Eliminates duplicate code
- **How**: Delete files after confirming all usages updated
- **Risk**: Verify through test suite and build process

**Expected Benefits:**

- Single source of truth for button components
- Easier to maintain and extend
- Consistent styling across the app
- ~150 lines of code eliminated

**Migration Effort**: Low - Approximately 2-3 hours
