/**
 * Core type definitions for the clipper library
 * Following Interface Segregation Principle (ISP)
 */

/**
 * Metadata extracted from a web page
 */
export interface PageMetadata {
  title: string;
  author: string;
  description: string;
  site: string;
  domain: string;
  url: string;
  favicon: string;
  image: string;
  published: string;
  wordCount: number;
}

/**
 * Schema.org structured data
 */
export interface SchemaOrgData {
  [key: string]: unknown;
}

/**
 * Meta tag information
 */
export interface MetaTag {
  name?: string | null;
  property?: string | null;
  content: string | null;
}

/**
 * Options for content extraction
 */
export interface ExtractOptions {
  /** Base URL for resolving relative URLs */
  url: string;
  /** Whether to include full HTML in the result */
  includeFullHtml?: boolean;
  /** Whether to clean scripts and styles from HTML */
  cleanHtml?: boolean;
}

/**
 * Result from content extraction
 */
export interface ExtractResult {
  /** Main content HTML */
  content: string;
  /** Page metadata */
  metadata: PageMetadata;
  /** Schema.org data if available */
  schemaOrgData: SchemaOrgData | null;
  /** Full cleaned HTML (if requested) */
  fullHtml?: string;
  /** Meta tags from the page */
  metaTags: MetaTag[];
  /** Time taken to parse in milliseconds */
  parseTime: number;
}

/**
 * Options for markdown conversion
 */
export interface MarkdownOptions {
  /** Base URL for resolving relative URLs */
  baseUrl: string;
  /** Heading style: 'atx' (#) or 'setext' (underline) */
  headingStyle?: 'atx' | 'setext';
  /** Horizontal rule marker */
  hr?: string;
  /** Bullet list marker */
  bulletListMarker?: '-' | '+' | '*';
  /** Code block style */
  codeBlockStyle?: 'fenced' | 'indented';
  /** Emphasis delimiter */
  emDelimiter?: '*' | '_';
}

/**
 * Result from markdown conversion
 */
export interface MarkdownResult {
  /** Converted markdown content */
  markdown: string;
  /** Page metadata */
  metadata: PageMetadata;
}

/**
 * Complete clip result combining extraction and conversion
 */
export interface ClipResult {
  /** Markdown content */
  markdown: string;
  /** Original HTML content */
  html: string;
  /** Page metadata */
  metadata: PageMetadata;
  /** Schema.org data */
  schemaOrgData: SchemaOrgData | null;
  /** Meta tags */
  metaTags: MetaTag[];
  /** Suggested filename for saving */
  suggestedFilename: string;
}

/**
 * Options for the main clip function
 */
export interface ClipOptions extends ExtractOptions, Partial<MarkdownOptions> {
  /** Custom filename (without extension) */
  filename?: string;
}

/**
 * Interface for content extractors
 * Following Open/Closed Principle (OCP)
 */
export interface IContentExtractor {
  /**
   * Extract content from HTML
   * @param html Raw HTML string
   * @param options Extraction options
   */
  extract(html: string, options: ExtractOptions): ExtractResult;
}

/**
 * Interface for markdown converters
 * Following Dependency Inversion Principle (DIP)
 */
export interface IMarkdownConverter {
  /**
   * Convert HTML to markdown
   * @param html HTML content
   * @param options Conversion options
   */
  convert(html: string, options: MarkdownOptions): string;
}

/**
 * Interface for URL processors
 */
export interface IUrlProcessor {
  /**
   * Make relative URLs absolute
   * @param html HTML content
   * @param baseUrl Base URL for resolution
   */
  processUrls(html: string, baseUrl: URL): string;
}

