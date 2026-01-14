/**
 * Content Extractor using Defuddle
 * Implements IContentExtractor interface
 * Single Responsibility: Extract main content and metadata from HTML
 */

import Defuddle from 'defuddle'
import type {
  IContentExtractor,
  ExtractOptions,
  ExtractResult,
  PageMetadata,
  MetaTag,
  SchemaOrgData,
} from '../types'
import { getDomain } from '../utils'
import { cleanHtml } from '../utils'

/**
 * Defuddle-based content extractor
 * Uses the Defuddle library (same as Obsidian Clipper) for content extraction
 */
export class DefuddleExtractor implements IContentExtractor {
  /**
   * Extract content from HTML string
   */
  extract(html: string, options: ExtractOptions): ExtractResult {
    const startTime = performance.now()

    // Parse HTML
    const parser = new DOMParser()
    const doc = parser.parseFromString(html, 'text/html')

    // Use Defuddle to extract content
    const defuddled = new Defuddle(doc, { url: options.url }).parse()

    // Build metadata
    const metadata: PageMetadata = {
      title: defuddled.title || '',
      author: defuddled.author || '',
      description: defuddled.description || '',
      site: defuddled.site || '',
      domain: getDomain(options.url),
      url: options.url,
      favicon: defuddled.favicon || '',
      image: defuddled.image || '',
      published: defuddled.published || '',
      wordCount: defuddled.wordCount || 0,
    }

    // Get meta tags
    const metaTags: MetaTag[] = defuddled.metaTags || []

    // Get schema.org data
    const schemaOrgData: SchemaOrgData | null = defuddled.schemaOrgData || null

    // Clean and get full HTML if requested
    let fullHtml: string | undefined
    if (options.includeFullHtml) {
      fullHtml = options.cleanHtml !== false
        ? cleanHtml(html, options.url)
        : html
    }

    const parseTime = performance.now() - startTime

    return {
      content: defuddled.content || '',
      metadata,
      schemaOrgData,
      fullHtml,
      metaTags,
      parseTime,
    }
  }
}

/**
 * Create a content extractor instance
 * Factory function following Dependency Inversion Principle
 */
export function createContentExtractor(): IContentExtractor {
  return new DefuddleExtractor()
}

