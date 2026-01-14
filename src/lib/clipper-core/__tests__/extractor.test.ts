/**
 * Tests for content extractor
 */

import { describe, it, expect } from 'vitest';
import { DefuddleExtractor, createContentExtractor } from '../extractors';

describe('DefuddleExtractor', () => {
  const extractor = createContentExtractor();

  const createTestHtml = (options: {
    title?: string;
    content?: string;
    author?: string;
    description?: string;
  }) => {
    const { title = 'Test Page', content = '<p>Test content</p>', author = '', description = '' } = options;
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <title>${title}</title>
          ${author ? `<meta name="author" content="${author}">` : ''}
          ${description ? `<meta name="description" content="${description}">` : ''}
        </head>
        <body>
          <article>
            <h1>${title}</h1>
            ${content}
          </article>
        </body>
      </html>
    `;
  };

  describe('basic extraction', () => {
    it('should extract title', () => {
      const html = createTestHtml({ title: 'My Article' });
      const result = extractor.extract(html, { url: 'https://example.com' });
      expect(result.metadata.title).toBe('My Article');
    });

    it('should extract content', () => {
      const html = createTestHtml({ content: '<p>Hello World</p>' });
      const result = extractor.extract(html, { url: 'https://example.com' });
      expect(result.content).toContain('Hello World');
    });

    it('should extract author from meta tag', () => {
      const html = createTestHtml({ author: 'John Doe' });
      const result = extractor.extract(html, { url: 'https://example.com' });
      expect(result.metadata.author).toBe('John Doe');
    });

    it('should extract description', () => {
      const html = createTestHtml({ description: 'A test description' });
      const result = extractor.extract(html, { url: 'https://example.com' });
      expect(result.metadata.description).toBe('A test description');
    });
  });

  describe('metadata extraction', () => {
    it('should extract domain from URL', () => {
      const html = createTestHtml({});
      const result = extractor.extract(html, { url: 'https://blog.example.com/post' });
      expect(result.metadata.domain).toBe('example.com');
    });

    it('should preserve the URL', () => {
      const url = 'https://example.com/path/to/page';
      const html = createTestHtml({});
      const result = extractor.extract(html, { url });
      expect(result.metadata.url).toBe(url);
    });

    it('should report parse time', () => {
      const html = createTestHtml({});
      const result = extractor.extract(html, { url: 'https://example.com' });
      expect(result.parseTime).toBeGreaterThanOrEqual(0);
    });
  });

  describe('meta tags extraction', () => {
    it('should extract meta tags', () => {
      const html = `
        <!DOCTYPE html>
        <html>
          <head>
            <meta name="keywords" content="test, example">
            <meta property="og:title" content="OG Title">
          </head>
          <body><p>Content</p></body>
        </html>
      `;
      const result = extractor.extract(html, { url: 'https://example.com' });
      expect(result.metaTags).toBeDefined();
      expect(Array.isArray(result.metaTags)).toBe(true);
    });
  });

  describe('options handling', () => {
    it('should include fullHtml when requested', () => {
      const html = createTestHtml({});
      const result = extractor.extract(html, {
        url: 'https://example.com',
        includeFullHtml: true,
      });
      expect(result.fullHtml).toBeDefined();
    });

    it('should not include fullHtml by default', () => {
      const html = createTestHtml({});
      const result = extractor.extract(html, { url: 'https://example.com' });
      expect(result.fullHtml).toBeUndefined();
    });

    it('should clean HTML when includeFullHtml is true', () => {
      const html = `
        <html>
          <head><script>alert('xss')</script></head>
          <body><p>Content</p></body>
        </html>
      `;
      const result = extractor.extract(html, {
        url: 'https://example.com',
        includeFullHtml: true,
        cleanHtml: true,
      });
      expect(result.fullHtml).not.toContain('script');
    });
  });
});

describe('createContentExtractor', () => {
  it('should create a DefuddleExtractor instance', () => {
    const extractor = createContentExtractor();
    expect(extractor).toBeInstanceOf(DefuddleExtractor);
  });
});

