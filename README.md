# Vibe Clipper - Demo Application

A demo application based on the Clipper Core library, showcasing HTML content extraction and Markdown conversion.

## Table of Contents

- [Quick Start](#quick-start)
- [Usage](#usage)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Features](#features)
- [Examples](#examples)
- [Testing](#testing)
- [API Reference](#api-reference)

### Quick Start

#### Install Dependencies

```bash
npm install
```

#### Run Development Server

```bash
npm run dev
```

Visit http://localhost:5173/ to view the demo.

#### Run Tests

```bash
npm run test           # Run all tests
npm run test:watch     # Watch mode
npm run test:coverage  # Coverage report
```

#### Build for Production

```bash
npm run build
npm run preview  # Preview build
```

### Usage

#### Online Demo

1. Open http://localhost:5173/
2. Select a preset example (blog, news, recipe, table)
3. Or paste your own HTML
4. Click "Extract & Convert"
5. View Markdown output and metadata
6. Copy or download the Markdown file

#### Using Clipper Core in Code

```typescript
import { clip } from './lib/clipper-core';

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

console.log(result.markdown);           // Markdown content
console.log(result.metadata.title);     // Title
console.log(result.metadata.author);    // Author
console.log(result.suggestedFilename);  // Suggested filename
```

### Tech Stack

- **Framework**: Preact (lightweight React alternative)
- **Build Tool**: Vite (with Rolldown)
- **Styling**: Bulma CSS
- **Testing**: Vitest
- **Content Extraction**: Defuddle
- **Markdown Conversion**: Turndown
- **Language**: TypeScript

### Project Structure

```
src/
├── lib/clipper-core/          # Core library
│   ├── extractors/            # Content extractors
│   ├── converters/            # Markdown converters
│   ├── utils/                 # Utilities
│   ├── types/                 # Type definitions
│   └── __tests__/             # Tests
├── pages/
│   └── ClipperPage.tsx        # Demo page
├── app.tsx                    # Main app
└── main.tsx                   # Entry point
```

### Features

- ✅ Extract main content from HTML
- ✅ Convert to clean Markdown
- ✅ Rich formatting (bold, italic, etc.)
- ✅ Tables and lists
- ✅ Code blocks with syntax highlighting
- ✅ Blockquotes and citations
- ✅ Image and link handling
- ✅ Metadata extraction (title, author, etc.)
- ✅ Math formula support (MathML, MathJax, KaTeX)
- ✅ Embedded content (YouTube, Twitter)

### Examples

#### Blog Post

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

Output Markdown:

```markdown
Writing clean code is essential for maintainability.

1. Use meaningful variable names
2. Keep functions small and focused
3. Write tests for your code
```

### Testing

Comprehensive test suite:

- Unit tests: utilities, string/URL processing
- Integration tests: content extraction, Markdown conversion
- E2E tests: full clip process

Run coverage:

```bash
npm run test:coverage
```

### API Reference

See [src/lib/clipper-core/README.md](src/lib/clipper-core/README.md) for detailed API docs.
