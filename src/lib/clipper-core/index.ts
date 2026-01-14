/**
 * Clipper Core - Main Entry Point
 *
 * @example
 * ```typescript
 * import { clip, createClipper } from 'clipper-core';
 *
 * // Simple usage
 * const result = clip(htmlContent, { url: 'https://example.com' });
 * console.log(result.markdown);
 *
 * // Advanced usage with custom options
 * const clipper = createClipper();
 * const extracted = clipper.extract(htmlContent, { url: 'https://example.com' });
 * const markdown = clipper.convert(extracted.content, { baseUrl: 'https://example.com' });
 * ```
 */

import type {
  ClipOptions,
  ClipResult,
  ExtractOptions,
  ExtractResult,
  MarkdownOptions,
  IContentExtractor,
  IMarkdownConverter,
} from './types'
import { createContentExtractor } from './extractors'
import { createMarkdownConverter } from './converters'
import { sanitizeFileName } from './utils'

// Re-export types
export * from './types'

// Re-export utils
export * from './utils'

// Re-export extractors and converters
export { DefuddleExtractor, createContentExtractor } from './extractors'
export { TurndownConverter, createMarkdownConverter } from './converters'

/**
 * Clipper class - Facade for content extraction and markdown conversion
 * Follows Facade Pattern for simplified API
 */
export class Clipper {
  private extractor: IContentExtractor
  private converter: IMarkdownConverter

  constructor(
    extractor?: IContentExtractor,
    converter?: IMarkdownConverter
  ) {
    this.extractor = extractor || createContentExtractor()
    this.converter = converter || createMarkdownConverter()
  }

  /**
   * Extract content from HTML
   */
  extract(html: string, options: ExtractOptions): ExtractResult {
    return this.extractor.extract(html, options)
  }

  /**
   * Convert HTML to markdown
   */
  convert(html: string, options: MarkdownOptions): string {
    return this.converter.convert(html, options)
  }

  /**
   * Complete clip operation: extract + convert
   */
  clip(html: string, options: ClipOptions): ClipResult {
    // Extract content
    const extracted = this.extract(html, {
      url: options.url,
      includeFullHtml: options.includeFullHtml,
      cleanHtml: options.cleanHtml,
    })

    // Convert to markdown
    const markdown = this.convert(extracted.content, {
      baseUrl: options.url,
      headingStyle: options.headingStyle,
      hr: options.hr,
      bulletListMarker: options.bulletListMarker,
      codeBlockStyle: options.codeBlockStyle,
      emDelimiter: options.emDelimiter,
    })

    // Generate filename
    const suggestedFilename = options.filename
      ? sanitizeFileName(options.filename)
      : sanitizeFileName(extracted.metadata.title)

    return {
      markdown,
      html: extracted.content,
      metadata: extracted.metadata,
      schemaOrgData: extracted.schemaOrgData,
      metaTags: extracted.metaTags,
      suggestedFilename,
    }
  }
}

/**
 * Create a new Clipper instance
 */
export function createClipper(
  extractor?: IContentExtractor,
  converter?: IMarkdownConverter
): Clipper {
  return new Clipper(extractor, converter)
}

// Default clipper instance
let defaultClipper: Clipper | null = null

/**
 * Get or create the default clipper instance
 */
function getDefaultClipper(): Clipper {
  if (!defaultClipper) {
    defaultClipper = createClipper()
  }
  return defaultClipper
}

/**
 * Quick clip function using default clipper
 *
 * @param html - HTML content to clip
 * @param options - Clip options
 * @returns ClipResult containing markdown, metadata, etc.
 *
 * @example
 * ```typescript
 * const result = clip('<html>...</html>', { url: 'https://example.com' });
 * console.log(result.markdown);
 * console.log(result.metadata.title);
 * ```
 */
export function clip(html: string, options: ClipOptions): ClipResult {
  return getDefaultClipper().clip(html, options)
}

/**
 * Quick extract function using default clipper
 *
 * @param html - HTML content to extract
 * @param options - Extract options
 * @returns ExtractResult containing content, metadata, etc.
 */
export function extract(html: string, options: ExtractOptions): ExtractResult {
  return getDefaultClipper().extract(html, options)
}

/**
 * Quick convert function using default clipper
 *
 * @param html - HTML content to convert
 * @param options - Markdown options
 * @returns Markdown string
 */
export function convertToMarkdown(html: string, options: MarkdownOptions): string {
  return getDefaultClipper().convert(html, options)
}

