# Design System Documentation

## Button Styles

### Default Slate Button (with subtle hover)
Use this style for secondary/outline buttons throughout the app:

```tsx
<Button 
  variant="outline" 
  className="bg-slate-700 border-slate-600 text-white hover:bg-slate-600 hover:border-slate-500 hover:text-white"
>
  Button Text
</Button>
```

**Properties:**
- Default background: `bg-slate-700`
- Default border: `border-slate-600`
- Default text: `text-white`
- Hover background: `hover:bg-slate-600` (subtle lighter)
- Hover border: `hover:border-slate-500` (subtle lighter)
- Hover text: `hover:text-white` (stays white)

**When to use:**
- Import buttons
- Secondary actions in dropdowns
- Any outline-style button that needs to match the app's glassmorphism/slate theme
