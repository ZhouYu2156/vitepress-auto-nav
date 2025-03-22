# VitePress 自动导航与侧边栏生成器

`vitepress-auto-nav` 是一个用于自动生成 VitePress 导航栏和侧边栏配置的工具，可以根据文档目录结构自动创建导航和侧边栏，无需手动配置。

## 安装

```bash
npm install vitepress-auto-nav --save-dev
# 或
yarn add vitepress-auto-nav --dev
# 或
pnpm add vitepress-auto-nav -D
```

## 基本使用

在 VitePress 配置文件中导入并使用：

```js
// .vitepress/config.js 或 .vitepress/config.ts
const { default: generateVitepressConfig } = require('vitepress-auto-nav')
// 或使用 ES 模块语法
// import generateVitepressConfig from 'vitepress-auto-nav';

export default {
  // ...其他配置
  themeConfig: {
    // 使用自动生成的导航和侧边栏
    ...generateVitepressConfig(),
  },
}
```

## 文档目录自动检测

工具会按以下顺序自动检测您的文档目录：

1. `src/docs` - 首先检查
2. `docs` - 如果 src/docs 不存在则检查此目录
3. 当前目录 (`.`) - 作为后备选项

您可以通过 `docsDir` 选项来覆盖自动检测结果。

## 配置选项

可以通过选项自定义生成行为：

```js
import generateVitepressConfig from 'vitepress-auto-nav'

export default {
  // ...其他配置
  themeConfig: {
    ...generateVitepressConfig({
      // 文档根目录，默认自动检测 (src/docs, docs, 或当前目录)
      docsDir: 'docs',

      // 是否默认展开侧边栏，默认为 true
      defaultExpand: true,

      // 要忽略的目录
      ignoreDirs: ['public', 'assets', 'node_modules', 'api'],

      // 概述文件的后缀名称
      overviewSuffix: '概述',

      // 自定义显示名称格式化函数
      formatDisplayName: name => {
        // 示例：将 kebab-case 转换为标题式大小写
        return name.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
      },

      // 自定义侧边栏项目排序函数
      sidebarItemSorter: (a, b) => {
        // 示例：保持概述在顶部，然后按字母顺序排序
        if (a.text && a.text.includes('概述')) return -1
        if (b.text && b.text.includes('概述')) return 1
        return a.text && b.text ? a.text.localeCompare(b.text) : 0
      },

      // 启用调试日志
      debug: false,

      // 目录遍历的最大深度 (1, 2, 或 3)
      maxDepth: 3,

      // 是否包含文档根目录中的文件
      includeRootFiles: false,

      // 要包含的文件模式（仅匹配这些扩展名的文件）
      filePatterns: ['.md'],
    }),
  },
}
```

## 高级配置详解

### 文档结构深度控制

`maxDepth` 选项控制工具遍历目录结构的深度：

- `maxDepth: 1` - 仅处理一级目录（例如，`/guides/`）
- `maxDepth: 2` - 处理到二级目录（例如，`/guides/basics/`）
- `maxDepth: 3` - 处理到三级目录（默认值，例如，`/guides/basics/installation/`）

### 自定义显示名称格式化

您可以完全自定义目录和文件名在导航和侧边栏中的显示方式：

```js
formatDisplayName: name => {
  // 移除常见前缀如 "01-", "02-" 等
  name = name.replace(/^\d+[-_]/, '')

  // 添加您自己的格式化逻辑
  return name.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
}
```

### 自定义侧边栏项目排序

使用自定义排序函数控制侧边栏项目的顺序：

```js
sidebarItemSorter: (a, b) => {
  // 首先，按自定义顺序排序
  const order = ['介绍', '入门', '配置', '高级']

  // 获取不带路径的基本名称
  const aName = a.link ? a.link.split('/').pop() : ''
  const bName = b.link ? b.link.split('/').pop() : ''

  // 在自定义顺序数组中查找位置
  const aIndex = order.findIndex(item => aName && aName.includes(item))
  const bIndex = order.findIndex(item => bName && bName.includes(item))

  // 如果两个项目都在自定义顺序中
  if (aIndex !== -1 && bIndex !== -1) {
    return aIndex - bIndex
  }

  // 将自定义顺序中的项目放在其他项目之前
  if (aIndex !== -1) return -1
  if (bIndex !== -1) return 1

  // 对其余项目进行默认的字母顺序排序
  return a.text && b.text ? a.text.localeCompare(b.text) : 0
}
```

## 单独使用导航栏或侧边栏

也可以单独使用导航栏或侧边栏生成功能：

```js
import { generateNav, generateSidebar } from 'vitepress-auto-nav'

export default {
  // ...其他配置
  themeConfig: {
    // 使用自动生成的导航
    nav: generateNav({
      maxDepth: 2,
      includeRootFiles: true,
    }),

    // 使用自动生成的侧边栏，并与手动配置混合
    sidebar: {
      ...generateSidebar({
        // 如果要设置侧边栏不默认展开，需要在这里传入参数
        defaultExpand: false,
        // 只包含 markdown 文件
        filePatterns: ['.md'],
      }),
      // 手动添加或覆盖特定路径的侧边栏
      '/custom/path/': [
        {
          text: '自定义部分',
          items: [{ text: '文档1', link: '/custom/path/doc1' }],
        },
      ],
    },
  },
}
```

## 自动生成规则

### 目录结构示例

```
docs/
├── Web开发/                 # 一级目录 → 导航栏主菜单项
│   ├── 前端/                # 二级目录 → 下拉菜单分组标题
│   │   ├── Vue/             # 三级目录 → 导航项和侧边栏分组
│   │   │   ├── index.md     # 生成概述链接
│   │   │   ├── 基础语法.md   # 侧边栏子项
│   │   │   └── 高级特性.md   # 侧边栏子项
```

### 生成规则

1. **导航栏生成规则**：

   - 一级目录 → 导航栏主菜单项
   - 二级目录 → 下拉菜单分组标题
   - 三级目录 → 导航项（导航至 index.md）

2. **侧边栏生成规则**：

   - 三级目录 → 可折叠分组标题
   - 三级目录下的 .md 文件 → 侧边栏子项
   - index.md 会被特殊处理为"[目录名]概述"

3. **路径格式**：

   - 保留原始目录名的大小写格式
   - 不对目录名做特殊处理
   - 使用原始路径名拼接

4. **智能过滤**：
   - 忽略以 `_` 开头的目录
   - 自动跳过没有 index.md 的三级目录
   - 忽略 public、assets 等特殊目录（可自定义）

## 故障排除

### 找不到文档目录问题

如果您看到"找不到文档目录"的错误，请检查：

1. 您的项目结构 - 确保您有 `docs` 或 `src/docs` 目录
2. 明确设置 `docsDir` 选项指向您的文档目录：
   ```js
   generateVitepressConfig({ docsDir: '您的文档路径' })
   ```
3. 启用调试模式以查看更多信息：
   ```js
   generateVitepressConfig({ debug: true })
   ```

### 侧边栏展开/折叠问题

如果设置 `defaultExpand: false` 没有效果，请确认：

1. 您是否在正确的位置传入了该选项：
   - 如果使用 `generateVitepressConfig`，请确保选项直接传给它
   - 如果单独使用 `generateSidebar`，请确保选项传给它
2. 检查是否有其他配置覆盖了这个设置
3. 重新构建并清除缓存后查看效果

## 许可证

MIT
