# Local shadcn/ui Component Registry

## Overview

This is a **local-only** shadcn/ui component registry that lives entirely within this repository. It provides a complete set of production-quality React components following the shadcn/ui design system and is optimized for use with Cursor MCP (Model Context Protocol) for AI-assisted component discovery and installation.

## What is This Registry?

This registry contains all ~90 official shadcn/ui components, organized and structured to be:
- **Fully local**: No external hosting or URLs required
- **Schema-compliant**: Follows the official shadcn registry schema
- **MCP-optimized**: Metadata designed for AI discovery and reasoning
- **Production-ready**: All components are fully implemented, not stubs
- **Style-consistent**: Matches the project's "base-mira" design system

## How to Use Locally

### Referencing the Registry

To use this registry in your project, update your `components.json` file:

```json
{
  "$schema": "https://ui.shadcn.com/schema.json",
  "style": "base-mira",
  "rsc": true,
  "tsx": true,
  "registries": {
    "local": "./registry/registry.json"
  },
  "aliases": {
    "components": "@/components",
    "utils": "@/lib/utils",
    "ui": "@/components/ui"
  }
}
```

### Installing Components

Once the registry is referenced, you can install components using the shadcn CLI:

```bash
npx shadcn@latest add <component-name> --registry ./registry/registry.json
```

Or use Cursor MCP to discover and install components automatically.

## Registry Structure

The registry is organized as follows:

```
/registry/
  ├── registry.json          # Main registry index with all component metadata
  ├── README.md             # This file
  └── default/              # Style directory (using "default" per shadcn conventions)
      ├── accordion/
      │   └── accordion.tsx
      ├── alert/
      │   └── alert.tsx
      └── ... (all other components)
```

Each component lives in its own directory under `/registry/default/<component-name>/` with a single TypeScript file.

## Component Types

Components in this registry are categorized into three types:

### Base UI Components
Simple, single-purpose components that form the foundation of the UI:
- Examples: Button, Input, Badge, Avatar, Separator
- Typically have minimal dependencies
- Can be used standalone or composed into larger components

### Compound Components
Multi-part components with several sub-components:
- Examples: Data Table, Form, Navigation Menu
- Often depend on base UI components
- Provide complex functionality through composition

### Blocks
Complete UI sections that solve specific use cases:
- Examples: Auth Login Block, Dashboard sections
- Full-featured components ready to use
- May depend on multiple other components

## Adding New Components

To add a new component to the registry:

### 1. Create Component Directory

Create a new directory under `/registry/default/`:

```bash
mkdir registry/default/my-component
```

### 2. Create Component File

Create the component TypeScript file following these conventions:

- Use React 19 + TypeScript
- Import `cn` utility from `@/lib/utils`
- Use `@base-ui/react` primitives where available
- Include `data-slot` attributes matching project conventions
- Use Tailwind CSS with CSS variables from `app/globals.css`
- Match "base-mira" style (small sizes, specific spacing)
- Support dark mode via CSS variables
- Export all component parts

Example structure:

```tsx
"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

function MyComponent({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="my-component"
      className={cn("base-styles-here", className)}
      {...props}
    />
  )
}

export { MyComponent }
```

### 3. Add Registry Entry

Add an entry to `registry/registry.json` in the `items` array:

```json
{
  "name": "my-component",
  "type": "registry:component",
  "title": "My Component",
  "description": "Clear description of what this component does, when to use it, and its classification (base UI, compound UI, or block). This description is optimized for AI discovery.",
  "category": "layout",
  "tags": ["free"],
  "files": [
    {
      "path": "registry/default/my-component/my-component.tsx",
      "type": "registry:component"
    }
  ],
  "dependencies": [],
  "registryDependencies": []
}
```

### 4. Update Documentation

If adding a new category or significant feature, update this README.

## Dependencies

Components may depend on:

- **npm packages**: Listed in `dependencies` array
- **Other registry components**: Listed in `registryDependencies` array

Common dependencies:
- `@base-ui/react` - Base UI primitives
- `class-variance-authority` - Variant management
- `clsx` and `tailwind-merge` - Class utilities
- `lucide-react` - Icons

When adding dependencies, ensure they're compatible with the project's existing setup.

## Monetization Structure

The registry is structured to support future monetization without refactoring:

- **Tags**: Each component has a `tags` array
  - `["free"]` - Available to all users
  - `["premium"]` - Future premium components (not yet implemented)
- **Selective Exposure**: The structure allows filtering components by tags
- **No Paywalls**: Currently, no authentication or paywall logic is implemented

## MCP Integration

This registry is optimized for Cursor MCP discovery:

### Discovery
- Clear, descriptive titles and descriptions
- Explicit component types (`registry:component` or `registry:block`)
- Category tags for organization

### Installation
- Accurate file paths relative to registry root
- Complete dependency lists
- Proper file type declarations

### Reasoning
- Descriptions explain purpose, use cases, and classification
- Dependencies are explicitly listed
- Component relationships are clear

## Style Guide

All components follow these conventions:

### Code Style
- TypeScript with strict typing
- React 19 patterns
- Functional components with hooks
- Proper prop spreading and composition

### Styling
- Tailwind CSS with CSS variables
- Use `cn()` utility for class merging
- Match "base-mira" design system:
  - Small sizes (h-7 for inputs, text-xs/relaxed)
  - Specific spacing and padding
  - Consistent border radius
  - Dark mode support via CSS variables

### Attributes
- Include `data-slot` attributes for component identification
- Use semantic HTML where appropriate
- Support accessibility attributes (aria-*, role, etc.)

### Exports
- Export all component parts
- Export types and variants when applicable
- Use named exports

## Contributing

When contributing components:

1. **Follow existing patterns**: Match the style of existing components
2. **Test thoroughly**: Ensure components work in isolation and composition
3. **Document clearly**: Write clear descriptions for AI discovery
4. **Check dependencies**: Verify all dependencies are listed
5. **Match style**: Follow "base-mira" design conventions

## Questions?

For questions about:
- **Component usage**: Check the component's description in `registry.json`
- **Registry structure**: See the shadcn/ui registry documentation
- **MCP integration**: Refer to Cursor MCP documentation
- **Style conventions**: Review existing components in `/registry/default/`
