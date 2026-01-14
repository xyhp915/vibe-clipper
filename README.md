# Vibe Clipper - Demo Application

这是一个基于 Clipper Core 库的演示应用，展示了如何使用该库从 HTML 内容中提取主内容并转换为 Markdown 格式。

## 🚀 快速开始

### 安装依赖

```bash
npm install
```

### 运行开发服务器

```bash
npm run dev
```

访问 http://localhost:5173/ 查看演示页面。

### 运行测试

```bash
npm run test           # 运行所有测试
npm run test:watch     # 监视模式
npm run test:coverage  # 生成覆盖率报告
```

### 构建生产版本

```bash
npm run build
npm run preview  # 预览构建结果
```

## 📖 使用说明

### 在线演示

1. 打开浏览器访问 http://localhost:5173/
2. 可以选择预设示例（博客、新闻、食谱、表格）
3. 或者粘贴自己的 HTML 内容
4. 点击"Extract & Convert"按钮
5. 查看转换后的 Markdown 内容和元数据
6. 可以复制或下载 Markdown 文件

### 在代码中使用 Clipper Core

```typescript
import { clip } from './lib/clipper-core';

// 基本用法
const html = `
  <!DOCTYPE html>
  <html>
    <head><title>My Article</title></head>
    <body>
      <article>
        <h1>Article Title</h1>
        <p>Content here...</p>
      </article>
    </body>
  </html>
`;

const result = clip(html, { url: 'https://example.com/article' });

console.log(result.markdown);           // Markdown 内容
console.log(result.metadata.title);     // 标题
console.log(result.metadata.author);    // 作者
console.log(result.suggestedFilename);  // 建议的文件名
```

## 🎨 技术栈

- **框架**: Preact (React 的轻量级替代)
- **构建工具**: Vite (使用 Rolldown)
- **样式**: Bulma CSS
- **测试**: Vitest
- **内容提取**: Defuddle
- **Markdown 转换**: Turndown
- **语言**: TypeScript

## 📁 项目结构

```
src/
├── lib/clipper-core/          # 核心库
│   ├── extractors/            # 内容提取器
│   ├── converters/            # Markdown 转换器
│   ├── utils/                 # 工具函数
│   ├── types/                 # 类型定义
│   └── __tests__/             # 测试文件
├── pages/
│   └── ClipperPage.tsx        # 演示页面
├── app.tsx                    # 主应用
└── main.tsx                   # 入口文件
```

## ✨ 功能特性

- ✅ 从 HTML 页面提取主要内容
- ✅ 转换为清晰的 Markdown 格式
- ✅ 支持富文本格式（粗体、斜体等）
- ✅ 表格和列表
- ✅ 代码块（带语法标识）
- ✅ 引用和脚注
- ✅ 图片和链接处理
- ✅ 元数据提取（标题、作者、描述等）
- ✅ 数学公式支持（MathML、MathJax、KaTeX）
- ✅ 嵌入内容支持（YouTube、Twitter）

## 📝 示例

### 博客文章

```html
<!DOCTYPE html>
<html>
  <head>
    <title>10 Tips for Better Code</title>
    <meta name="author" content="Jane Smith">
  </head>
  <body>
    <article>
      <h1>10 Tips for Better Code</h1>
      <p>Writing clean code is essential for maintainability.</p>
      <ol>
        <li>Use meaningful variable names</li>
        <li>Keep functions small and focused</li>
        <li>Write tests for your code</li>
      </ol>
    </article>
  </body>
</html>
```

转换后的 Markdown：

```markdown
Writing clean code is essential for maintainability.

1. Use meaningful variable names
2. Keep functions small and focused
3. Write tests for your code
```

## 🧪 测试

项目包含完整的测试套件：

- **单元测试**: 工具函数、字符串处理、URL 处理
- **集成测试**: 内容提取、Markdown 转换
- **端到端测试**: 完整的 clip 流程

运行测试覆盖率报告：

```bash
npm run test:coverage
```

## 🔧 API 参考

详细的 API 文档请查看 [src/lib/clipper-core/README.md](src/lib/clipper-core/README.md)
