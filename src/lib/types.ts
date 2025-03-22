import type { DefaultTheme } from 'vitepress'

/**
 * Configuration options interface for VitePress auto navigation generator
 */
export interface VitepressAutoNavOptions {
  /**
   * Root directory of VitePress documentation
   * Auto-detected in order: 'src/docs', 'docs', '.'
   */
  docsDir?: string

  /**
   * Whether to expand sidebar groups by default
   * @default true
   */
  defaultExpand?: boolean

  /**
   * List of directory names to ignore
   * @default ['public', 'assets', 'node_modules']
   */
  ignoreDirs?: string[]

  /**
   * Text suffix for overview files (index.md)
   * @default 'Overview'
   */
  overviewSuffix?: string

  /**
   * Custom formatting for display names
   * @param name The original directory or file name
   * @returns Formatted name for display
   */
  formatDisplayName?: (name: string) => string

  /**
   * Custom sorting for sidebar items
   * @param a First sidebar item
   * @param b Second sidebar item
   * @returns Comparison result (-1, 0, 1)
   */
  sidebarItemSorter?: (a: DefaultTheme.SidebarItem, b: DefaultTheme.SidebarItem) => number

  /**
   * Whether to show debug logs
   * @default false
   */
  debug?: boolean

  /**
   * Maximum depth for directory traversal (1-3)
   * @default 3
   */
  maxDepth?: 1 | 2 | 3

  /**
   * Whether to include files in the root of document directory
   * @default false
   */
  includeRootFiles?: boolean

  /**
   * Custom patterns for files to include in sidebar
   * @default ['.md']
   */
  filePatterns?: string[]
}

/**
 * Result interface of generateVitepressConfig function
 */
export interface VitepressConfigResult {
  /**
   * Generated navigation bar items
   */
  nav: DefaultTheme.NavItem[]

  /**
   * Generated sidebar configuration
   */
  sidebar: DefaultTheme.Sidebar
}

/**
 * Event callbacks for the generation process
 */
export interface NavigationGenerationEvents {
  /**
   * Called when the generation process starts
   * @param options The options being used
   */
  onStart?: (options: Required<VitepressAutoNavOptions>) => void

  /**
   * Called when the generation process completes
   * @param result The generated configuration
   */
  onComplete?: (result: VitepressConfigResult) => void

  /**
   * Called when an error occurs during generation
   * @param error The error that occurred
   */
  onError?: (error: Error) => void
}
