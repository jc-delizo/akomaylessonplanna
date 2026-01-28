# UI Field Styling (Authoritative)

This document defines the **default input field design** for AKOMAYLESSONPLANNA.

## Default input style

All text-like inputs (email, password, text, date, etc.) should use the **minimal “login-style”** field:

- Bottom border only (no full outline)
- No rounded corners
- Focus indicated by bottom border changing to `primary`
- No focus ring

### Where this is enforced

The default is enforced in the shared component:

- `components/ui/input.tsx`

So any UI that uses:

```tsx
import { Input } from "@/components/ui/input"
```

…will automatically inherit the standardized style without needing per-field `className` overrides.

## How to use inputs (recommended)

### Basic text input

```tsx
<Label htmlFor="email">Email</Label>
<Input id="email" type="email" placeholder="you@example.com" />
```

### Input with a left icon (keep padding)

```tsx
<div className="relative">
  <Icon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
  <Input className="pl-9" />
</div>
```

## When it’s OK to deviate

Use local `className` overrides only when the UI context requires it:

- Dense admin tables / filters where a boxed input improves scanning
- Search bars that need a pill/rounded shape for affordance
- Inputs inside cards where an outlined style is necessary for contrast

When deviating, keep accessibility intact (labels, focus visibility, `aria-invalid` styling).

