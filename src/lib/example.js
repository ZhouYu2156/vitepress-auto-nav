/**
 * Example: How to use vitepress-auto-nav in VitePress configuration
 */

// Method 1: Using the default configuration generator
const { default: generateVitepressConfig } = require('vitepress-auto-nav')

// Method 2: Using separate navigation bar and sidebar generators
const { generateNav, generateSidebar } = require('vitepress-auto-nav')

// Configuration options example
const options = {
  // Documentation root directory
  docsDir: 'docs',
  // Expand sidebar by default
  defaultExpand: true,
  // Custom directories to ignore
  ignoreDirs: ['public', 'assets', 'node_modules', 'api'],
  // Custom overview suffix
  overviewSuffix: 'Overview',
}

// Usage in VitePress configuration file (Method 1 - recommended)
// .vitepress/config.js or .vitepress/config.ts
module.exports = {
  themeConfig: {
    ...generateVitepressConfig(options), // Includes both nav and sidebar
  },
}

// Usage in VitePress configuration file (Method 2 - separate use)
// .vitepress/config.js or .vitepress/config.ts
module.exports = {
  themeConfig: {
    nav: generateNav(options),
    sidebar: {
      ...generateSidebar(options),
      // Manually add some custom sidebar configurations
      '/custom/path/': [
        {
          text: 'Custom Section',
          items: [{ text: 'Document 1', link: '/custom/path/doc1' }],
        },
      ],
    },
  },
}
