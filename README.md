# VitePress Auto Navigation Generator

[English](./README.md) | [中文](./README.zh-CN.md)

`vitepress-auto-nav` is a tool that automatically generates navigation bar and sidebar configurations for VitePress based on your document directory structure, eliminating the need for manual configuration.

## Installation

```bash
npm install vitepress-auto-nav --save-dev
# or
yarn add vitepress-auto-nav --dev
# or
pnpm add vitepress-auto-nav -D
```

## Basic Usage

Import and use in your VitePress configuration file:

```js
// .vitepress/config.js or .vitepress/config.ts
const { default: generateVitepressConfig } = require('vitepress-auto-nav')
// or using ES module syntax
// import generateVitepressConfig from 'vitepress-auto-nav';

export default {
  // ...other configurations
  themeConfig: {
    // Use auto-generated navigation and sidebar
    ...generateVitepressConfig(),
  },
}
```

## Documentation Directory Detection

The tool automatically detects your documentation directory in the following order:

1. `src/docs` - Checked first
2. `docs` - Checked if src/docs doesn't exist
3. Current directory (`.`) - As a fallback

You can override this with the `docsDir` option.

## Configuration Options

You can customize the generation behavior through options:

```js
import generateVitepressConfig from 'vitepress-auto-nav'

export default {
  // ...other configurations
  themeConfig: {
    ...generateVitepressConfig({
      // Documentation root directory, auto-detected by default (src/docs, docs, or .)
      docsDir: 'docs',

      // Whether to expand sidebar groups by default, defaults to true
      defaultExpand: true,

      // Directories to ignore
      ignoreDirs: ['public', 'assets', 'node_modules', 'api'],

      // Suffix for overview files
      overviewSuffix: 'Overview',

      // Custom function for formatting display names
      formatDisplayName: name => {
        // Example: convert kebab-case to Title Case
        return name.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
      },

      // Custom sorting function for sidebar items
      sidebarItemSorter: (a, b) => {
        // Example: keep Overview at top, then sort alphabetically
        if (a.text && a.text.includes('Overview')) return -1
        if (b.text && b.text.includes('Overview')) return 1
        return a.text && b.text ? a.text.localeCompare(b.text) : 0
      },

      // Enable debug logging
      debug: false,

      // Maximum depth for directory traversal (1, 2, or 3)
      maxDepth: 3,

      // Whether to include files in the root of document directory
      includeRootFiles: false,

      // File patterns to include (only files matching these extensions)
      filePatterns: ['.md'],
    }),
  },
}
```

## Advanced Configuration Details

### Document Structure Depth Control

The `maxDepth` option controls how deep the tool traverses your directory structure:

- `maxDepth: 1` - Only process level 1 directories (e.g., `/guides/`)
- `maxDepth: 2` - Process up to level 2 directories (e.g., `/guides/basics/`)
- `maxDepth: 3` - Process up to level 3 directories (default, e.g., `/guides/basics/installation/`)

### Custom Display Name Formatting

You can completely customize how directory and file names are displayed in the navigation and sidebar:

```js
formatDisplayName: name => {
  // Remove common prefixes like "01-", "02-" etc.
  name = name.replace(/^\d+[-_]/, '')

  // Add your own formatting logic
  return name.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
}
```

### Custom Sidebar Item Sorting

Control the order of sidebar items with a custom sorting function:

```js
sidebarItemSorter: (a, b) => {
  // First, sort by custom order
  const order = ['introduction', 'getting-started', 'configuration', 'advanced']

  // Get base names without paths
  const aName = a.link ? a.link.split('/').pop() : ''
  const bName = b.link ? b.link.split('/').pop() : ''

  // Find positions in custom order array
  const aIndex = order.findIndex(item => aName && aName.includes(item))
  const bIndex = order.findIndex(item => bName && bName.includes(item))

  // If both items are in the custom order
  if (aIndex !== -1 && bIndex !== -1) {
    return aIndex - bIndex
  }

  // Put items in custom order before other items
  if (aIndex !== -1) return -1
  if (bIndex !== -1) return 1

  // Default alphabetical sort for remaining items
  return a.text && b.text ? a.text.localeCompare(b.text) : 0
}
```

## Using Navigation Bar or Sidebar Separately

You can also use the navigation bar or sidebar generation functions separately:

```js
import { generateNav, generateSidebar } from 'vitepress-auto-nav'

export default {
  // ...other configurations
  themeConfig: {
    // Use auto-generated navigation
    nav: generateNav({
      maxDepth: 2,
      includeRootFiles: true,
    }),

    // Use auto-generated sidebar, mixed with manual configuration
    sidebar: {
      ...generateSidebar({
        // Set sidebar not to expand by default
        defaultExpand: false,
        // Only include markdown files
        filePatterns: ['.md'],
      }),
      // Manually add or override sidebar for specific paths
      '/custom/path/': [
        {
          text: 'Custom Section',
          items: [{ text: 'Document 1', link: '/custom/path/doc1' }],
        },
      ],
    },
  },
}
```

## Auto-generation Rules

### Directory Structure Example

```
docs/
├── Web-Development/         # Level 1 directory → Main navigation menu item
│   ├── Frontend/            # Level 2 directory → Dropdown menu group title
│   │   ├── Vue/             # Level 3 directory → Navigation item and sidebar group
│   │   │   ├── index.md     # Generates an overview link
│   │   │   ├── basics.md    # Sidebar sub-item
│   │   │   └── advanced.md  # Sidebar sub-item
```

### Generation Rules

1. **Navigation Bar Generation Rules**:

   - Level 1 directory → Main navigation menu item
   - Level 2 directory → Dropdown menu group title
   - Level 3 directory → Navigation item (links to index.md)

2. **Sidebar Generation Rules**:

   - Level 3 directory → Collapsible group title
   - .md files under Level 3 directory → Sidebar sub-items
   - index.md is specially treated as "[Directory name] Overview"

3. **Path Format**:

   - Preserves original directory name case
   - No special processing for directory names
   - Uses original path name concatenation

4. **Smart Filtering**:
   - Ignores directories starting with `_`
   - Automatically skips Level 3 directories without index.md
   - Ignores special directories like public, assets, etc. (customizable)

## Troubleshooting

### Documentation Directory Not Found

If you see an error like "Documentation directory not found", check:

1. Your project structure - make sure you have a `docs` or `src/docs` directory
2. Explicitly set the `docsDir` option to point to your documentation directory:
   ```js
   generateVitepressConfig({ docsDir: 'your/docs/path' })
   ```
3. Enable debug mode to see more information:
   ```js
   generateVitepressConfig({ debug: true })
   ```

## License

MIT
