# Clipper Core

## Features

- 📄 Extract main content from HTML pages using [Defuddle](https://github.com/kepano/defuddle)
- 📝 Convert HTML to Markdown using [Turndown](https://github.com/mixmark-io/turndown)
- 🧮 Math support (MathML, MathJax, KaTeX)
- 📊 Table conversion (simple and complex)
- 🎥 Embed support (YouTube, Twitter/X)
- ✅ Task list support
- 📌 Footnote and citation support
- 🎨 Code block syntax highlighting
- 💡 Callout/alert conversion

## Installation

```bash
npm install defuddle turndown turndown-plugin-gfm mathml-to-latex dayjs dompurify
```

## Quick Start

```typescript
import { clip } from './lib/clipper-core';

const html = `
  <!DOCTYPE html>
  <html>
    <head><title>Example Article</title></head>
    <body>
      <article>
        <h1>Example Article</h1>
        <p>This is the main content with <strong>bold</strong> text.</p>
      </article>
    </body>
  </html>
`;

const result = clip(html, { url: 'https://example.com/article' });

console.log(result.markdown);
// Output: "This is the main content with **bold** text."

console.log(result.metadata);
// Output: { title: 'Example Article', author: '', ... }

console.log(result.suggestedFilename);
// Output: "Example Article"
```

## API Reference

### Main Functions

#### `clip(html: string, options: ClipOptions): ClipResult`

Complete clip operation: extracts content and converts to markdown.

```typescript
interface ClipOptions {
  url: string;                    // Required: URL for resolving relative links
  includeFullHtml?: boolean;      // Include cleaned full HTML
  cleanHtml?: boolean;            // Clean scripts/styles from HTML
  filename?: string;              // Custom filename suggestion
  headingStyle?: 'atx' | 'setext';
  bulletListMarker?: '-' | '+' | '*';
  codeBlockStyle?: 'fenced' | 'indented';
}

interface ClipResult {
  markdown: string;               // Converted markdown
  html: string;                   // Extracted HTML content
  metadata: PageMetadata;         // Page metadata
  schemaOrgData: object | null;   // Schema.org data
  metaTags: MetaTag[];            // Meta tags
  suggestedFilename: string;      // Sanitized filename
}
```

#### `extract(html: string, options: ExtractOptions): ExtractResult`

Extract content without markdown conversion.

```typescript
const result = extract(html, { url: 'https://example.com' });
console.log(result.content);      // HTML content
console.log(result.metadata);     // Page metadata
```

#### `convertToMarkdown(html: string, options: MarkdownOptions): string`

Convert HTML to markdown without extraction.

```typescript
const markdown = convertToMarkdown('<p>Hello <strong>World</strong></p>', {
  baseUrl: 'https://example.com'
});
// Output: "Hello **World**"
```

### Advanced Usage

#### Using the Clipper Class

```typescript
import { createClipper } from './lib/clipper-core';

const clipper = createClipper();

// Extract only
const extracted = clipper.extract(html, { url: 'https://example.com' });

// Convert only
const markdown = clipper.convert(html, { baseUrl: 'https://example.com' });

// Full clip
const result = clipper.clip(html, { url: 'https://example.com' });
```

#### Custom Extractor/Converter

```typescript
import { Clipper, IContentExtractor, IMarkdownConverter } from './lib/clipper-core';

// Implement custom extractor
class CustomExtractor implements IContentExtractor {
  extract(html: string, options: ExtractOptions): ExtractResult {
    // Your custom extraction logic
  }
}

// Use with Clipper
const clipper = new Clipper(new CustomExtractor());
```

## Architecture

This library follows SOLID principles:

- **Single Responsibility**: Each module handles one concern
  - `extractors/`: Content extraction
  - `converters/`: Markdown conversion
  - `utils/`: Utility functions

- **Open/Closed**: Extendable via interfaces
  - `IContentExtractor`: Custom extraction strategies
  - `IMarkdownConverter`: Custom conversion rules

- **Interface Segregation**: Fine-grained interfaces
  - `IUrlProcessor`: URL processing
  - Type definitions separated in `types/`

- **Dependency Inversion**: Factory functions for DI
  - `createClipper()`: Create with default implementations
  - `new Clipper(extractor, converter)`: Custom implementations

## Directory Structure

```
src/lib/clipper-core/
├── index.ts                 # Public API
├── types/
│   └── index.ts             # Type definitions
├── extractors/
│   ├── index.ts
│   └── defuddle-extractor.ts
├── converters/
│   ├── index.ts
│   └── turndown-converter.ts
├── utils/
│   ├── index.ts
│   ├── url.ts               # URL utilities
│   ├── string.ts            # String utilities
│   └── dom.ts               # DOM utilities
└── __tests__/
    ├── clipper.test.ts
    ├── converter.test.ts
    ├── extractor.test.ts
    ├── string.test.ts
    └── url.test.ts
```

## Testing

```bash
npm run test          # Run tests
npm run test:watch    # Watch mode
npm run test:coverage # Coverage report
```

## Credits

- [obsidian-clipper](https://github.com/obsidianmd/obsidian-clipper)

