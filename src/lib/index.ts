import * as fs from 'fs'
import * as path from 'path'
import type { DefaultTheme } from 'vitepress'
import type { VitepressAutoNavOptions, VitepressConfigResult } from './types'

// Type definition for intermediate navigation item processing
interface NavItemTemp {
  text: string
  items?: NavItemTemp[]
  link?: string
}

/**
 * Detects the documentation directory by checking common paths
 */
function detectDocsDir(debug = false): string {
  // Try common paths for docs
  const possiblePaths = ['src/docs', 'docs', '.']
  for (const dir of possiblePaths) {
    const fullPath = path.resolve(process.cwd(), dir)
    if (fs.existsSync(fullPath) && fs.statSync(fullPath).isDirectory()) {
      if (debug) {
        console.log(`[vitepress-auto-nav] Detected documentation directory: ${dir}`)
      }
      return dir
    }
  }
  // Default to docs if nothing found
  if (debug) {
    console.warn('[vitepress-auto-nav] No documentation directory detected, using "docs" as default')
  }
  return 'docs'
}

// Default options
const defaultOptions: Required<VitepressAutoNavOptions> = {
  docsDir: detectDocsDir(),
  defaultExpand: true,
  ignoreDirs: ['public', 'assets', 'node_modules'],
  overviewSuffix: 'Overview',
  formatDisplayName: (name: string) => {
    // If it's a Chinese directory, return as-is
    if (/[\u4e00-\u9fa5]/.test(name)) {
      return name
    }
    return name.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
  },
  sidebarItemSorter: (a, b) => {
    const overviewSuffix = 'Overview'
    // Put overview items at the top
    if (a.text && a.text.includes(overviewSuffix)) return -1
    if (b.text && b.text.includes(overviewSuffix)) return 1
    // Alphabetic sorting for the rest
    return a.text && b.text ? a.text.localeCompare(b.text) : 0
  },
  debug: false,
  maxDepth: 3,
  includeRootFiles: false,
  filePatterns: ['.md'],
}

/**
 * Helper functions
 */
function isValidDir(dirPath: string): boolean {
  try {
    return fs.statSync(dirPath).isDirectory()
  } catch (error) {
    return false
  }
}

function shouldIgnoreDir(dirName: string, ignoreDirs: string[]): boolean {
  // Ignore directories starting with underscore and special directories
  return dirName.startsWith('_') || dirName.startsWith('.') || ignoreDirs.includes(dirName)
}

function logDebug(message: string, obj?: any, debug = false): void {
  if (!debug) return

  if (obj) {
    console.log(`[vitepress-auto-nav] ${message}`, obj)
  } else {
    console.log(`[vitepress-auto-nav] ${message}`)
  }
}

/**
 * Generate VitePress navigation bar configuration
 * @param options Configuration options
 * @returns Navigation bar configuration array
 */
export function generateNav(options: VitepressAutoNavOptions = {}): DefaultTheme.NavItem[] {
  const opts = { ...defaultOptions, ...options } as Required<VitepressAutoNavOptions>
  const nav: DefaultTheme.NavItem[] = []
  const docsPath = path.resolve(process.cwd(), opts.docsDir)

  logDebug(`Generating navigation from: ${docsPath}`, null, opts.debug)

  try {
    // Check if directory exists
    if (!fs.existsSync(docsPath)) {
      console.error(`[vitepress-auto-nav] Documentation directory not found: ${docsPath}`)
      console.error(`[vitepress-auto-nav] Current working directory: ${process.cwd()}`)
      console.error(`[vitepress-auto-nav] Available directories: ${fs.readdirSync(process.cwd()).join(', ')}`)
      return nav
    }

    // Loop through level 1 directories
    fs.readdirSync(docsPath).forEach(l1Dir => {
      const l1Path = path.join(docsPath, l1Dir)
      if (!isValidDir(l1Path) || shouldIgnoreDir(l1Dir, opts.ignoreDirs)) return

      const navItem: NavItemTemp = {
        text: opts.formatDisplayName(l1Dir),
        items: [],
      }

      if (opts.maxDepth >= 2) {
        // Loop through level 2 directories
        fs.readdirSync(l1Path).forEach(l2Dir => {
          const l2Path = path.join(l1Path, l2Dir)
          if (!isValidDir(l2Path) || shouldIgnoreDir(l2Dir, opts.ignoreDirs)) return

          const l2Item: NavItemTemp = {
            text: opts.formatDisplayName(l2Dir),
            items: [],
          }

          if (opts.maxDepth >= 3) {
            // Loop through level 3 directories
            fs.readdirSync(l2Path).forEach(l3Dir => {
              const l3Path = path.join(l2Path, l3Dir)
              if (!isValidDir(l3Path) || shouldIgnoreDir(l3Dir, opts.ignoreDirs)) return

              // Check if index.md exists
              const indexPath = path.join(l3Path, 'index.md')
              if (!fs.existsSync(indexPath)) return

              if (l2Item.items) {
                l2Item.items.push({
                  text: opts.formatDisplayName(l3Dir),
                  link: `/${l1Dir}/${l2Dir}/${l3Dir}/`,
                })
              }
            })
          } else {
            // If maxDepth is 2, add level 2 as direct link
            const indexPath = path.join(l2Path, 'index.md')
            if (fs.existsSync(indexPath)) {
              l2Item.link = `/${l1Dir}/${l2Dir}/`
              delete l2Item.items
            }
          }

          if ((l2Item.items && l2Item.items.length > 0) || l2Item.link) {
            if (navItem.items) {
              navItem.items.push(l2Item)
            }
          }
        })
      } else {
        // If maxDepth is 1, add level 1 as direct link
        const indexPath = path.join(l1Path, 'index.md')
        if (fs.existsSync(indexPath)) {
          navItem.link = `/${l1Dir}/`
          delete navItem.items
        }
      }

      if ((navItem.items && navItem.items.length > 0) || navItem.link) {
        nav.push(navItem as DefaultTheme.NavItem)
      }
    })

    // Include root files if configured
    if (opts.includeRootFiles) {
      const rootFiles = fs.readdirSync(docsPath).filter(file => {
        const filePath = path.join(docsPath, file)
        return !fs.statSync(filePath).isDirectory() && opts.filePatterns.some(pattern => file.endsWith(pattern))
      })

      rootFiles.forEach(file => {
        // Skip index.md at root as it's typically the homepage
        if (file === 'index.md') return

        const fileName = file.replace(/\.[^/.]+$/, '') // Remove extension
        nav.push({
          text: opts.formatDisplayName(fileName),
          link: `/${fileName}`,
        })
      })
    }

    logDebug('Generated navigation structure:', nav, opts.debug)
  } catch (error) {
    console.error('[vitepress-auto-nav] Error generating navigation bar:', error)
  }

  return nav
}

/**
 * Generate VitePress sidebar configuration
 * @param options Configuration options
 * @returns Sidebar configuration object
 */
export function generateSidebar(options: VitepressAutoNavOptions = {}): DefaultTheme.Sidebar {
  const opts = { ...defaultOptions, ...options } as Required<VitepressAutoNavOptions>
  const sidebar: DefaultTheme.Sidebar = {}
  const docsPath = path.resolve(process.cwd(), opts.docsDir)

  logDebug(`Generating sidebar from: ${docsPath}`, null, opts.debug)

  try {
    // Check if directory exists
    if (!fs.existsSync(docsPath)) {
      console.error(`[vitepress-auto-nav] Documentation directory not found: ${docsPath}`)
      console.error(`[vitepress-auto-nav] Current working directory: ${process.cwd()}`)
      console.error(`[vitepress-auto-nav] Available directories: ${fs.readdirSync(process.cwd()).join(', ')}`)
      return sidebar
    }

    // Include root files if configured
    if (opts.includeRootFiles) {
      const rootFiles = fs.readdirSync(docsPath).filter(file => {
        const filePath = path.join(docsPath, file)
        return !fs.statSync(filePath).isDirectory() && opts.filePatterns.some(pattern => file.endsWith(pattern))
      })

      if (rootFiles.length > 0) {
        sidebar['/'] = rootFiles
          .map(file => {
            const fileName = file.replace(/\.[^/.]+$/, '') // Remove extension
            return {
              text: opts.formatDisplayName(fileName),
              link: fileName === 'index' ? '/' : `/${fileName}`,
            }
          })
          .sort(opts.sidebarItemSorter)
      }
    }

    // Process directories only if maxDepth > 0
    if (opts.maxDepth > 0) {
      // Loop through level 1 directories
      fs.readdirSync(docsPath).forEach(l1Dir => {
        const l1Path = path.join(docsPath, l1Dir)
        if (!isValidDir(l1Path) || shouldIgnoreDir(l1Dir, opts.ignoreDirs)) return

        // Handle level 1 files directly if maxDepth is 1
        if (opts.maxDepth === 1) {
          const files = fs.readdirSync(l1Path).filter(file => opts.filePatterns.some(pattern => file.endsWith(pattern)))

          if (files.length > 0) {
            sidebar[`/${l1Dir}/`] = [
              {
                text: opts.formatDisplayName(l1Dir),
                collapsed: opts.defaultExpand,
                items: files
                  .map(file => {
                    const fileName = file.replace(/\.[^/.]+$/, '') // Remove extension

                    if (fileName === 'index') {
                      return {
                        text: `${opts.formatDisplayName(l1Dir)} ${opts.overviewSuffix}`,
                        link: `/${l1Dir}/`,
                      }
                    }

                    return {
                      text: opts.formatDisplayName(fileName),
                      link: `/${l1Dir}/${fileName}`,
                    }
                  })
                  .sort(opts.sidebarItemSorter),
              },
            ]
          }
          return
        }

        if (opts.maxDepth >= 2) {
          // Loop through level 2 directories
          fs.readdirSync(l1Path).forEach(l2Dir => {
            const l2Path = path.join(l1Path, l2Dir)
            if (!isValidDir(l2Path) || shouldIgnoreDir(l2Dir, opts.ignoreDirs)) return

            // Handle level 2 files directly if maxDepth is 2
            if (opts.maxDepth === 2) {
              const files = fs
                .readdirSync(l2Path)
                .filter(file => opts.filePatterns.some(pattern => file.endsWith(pattern)))

              if (files.length > 0) {
                sidebar[`/${l1Dir}/${l2Dir}/`] = [
                  {
                    text: opts.formatDisplayName(l2Dir),
                    collapsed: opts.defaultExpand,
                    items: files
                      .map(file => {
                        const fileName = file.replace(/\.[^/.]+$/, '') // Remove extension

                        if (fileName === 'index') {
                          return {
                            text: `${opts.formatDisplayName(l2Dir)} ${opts.overviewSuffix}`,
                            link: `/${l1Dir}/${l2Dir}/`,
                          }
                        }

                        return {
                          text: opts.formatDisplayName(fileName),
                          link: `/${l1Dir}/${l2Dir}/${fileName}`,
                        }
                      })
                      .sort(opts.sidebarItemSorter),
                  },
                ]
              }
              return
            }

            if (opts.maxDepth >= 3) {
              // Loop through level 3 directories
              fs.readdirSync(l2Path).forEach(l3Dir => {
                const l3Path = path.join(l2Path, l3Dir)
                if (!isValidDir(l3Path) || shouldIgnoreDir(l3Dir, opts.ignoreDirs)) return

                // Check if index.md exists
                const indexPath = path.join(l3Path, 'index.md')
                if (!fs.existsSync(indexPath)) return

                // Create sidebar entry for level 3 directory - preserve original case
                const sidebarKey = `/${l1Dir}/${l2Dir}/${l3Dir}/`

                // Get all matching files in this level 3 directory
                const files = fs
                  .readdirSync(l3Path)
                  .filter(file => opts.filePatterns.some(pattern => file.endsWith(pattern)))

                if (files.length > 0) {
                  sidebar[sidebarKey] = [
                    {
                      text: opts.formatDisplayName(l3Dir),
                      collapsed: opts.defaultExpand,
                      items: files
                        .map(file => {
                          // Remove extension from filename
                          const fileName = file.replace(/\.[^/.]+$/, '')

                          // If it's index.md, the link doesn't need to include the filename
                          if (fileName === 'index') {
                            return {
                              text: `${opts.formatDisplayName(l3Dir)} ${opts.overviewSuffix}`,
                              link: `/${l1Dir}/${l2Dir}/${l3Dir}/`,
                            }
                          }

                          return {
                            text: opts.formatDisplayName(fileName),
                            link: `/${l1Dir}/${l2Dir}/${l3Dir}/${fileName}`,
                          }
                        })
                        .sort(opts.sidebarItemSorter),
                    },
                  ]
                }
              })
            }
          })
        }
      })
    }

    logDebug('Generated sidebar structure:', sidebar, opts.debug)
  } catch (error) {
    console.error('[vitepress-auto-nav] Error generating sidebar:', error)
  }

  return sidebar
}

/**
 * Automatically generate navigation bar and sidebar configuration
 * @param options Configuration options
 * @returns Object containing navigation bar and sidebar configuration
 */
export function generateVitepressConfig(options: VitepressAutoNavOptions = {}): VitepressConfigResult {
  return {
    nav: generateNav(options),
    sidebar: generateSidebar(options),
  }
}

// Export default configuration generator
export default generateVitepressConfig
