/**
 * Integration tests for the Clipper class
 */

import { describe, it, expect } from 'vitest';
import { Clipper, createClipper, clip, extract, convertToMarkdown } from '../index';

describe('Clipper', () => {
  const testHtml = `
    <!DOCTYPE html>
    <html>
      <head>
        <title>Test Article</title>
        <meta name="author" content="Test Author">
        <meta name="description" content="This is a test article">
      </head>
      <body>
        <article>
          <h1>Test Article</h1>
          <p>This is the main content of the article.</p>
          <p>It has <strong>bold</strong> and <em>italic</em> text.</p>
          <ul>
            <li>Item 1</li>
            <li>Item 2</li>
          </ul>
        </article>
      </body>
    </html>
  `;

  describe('createClipper', () => {
    it('should create a Clipper instance', () => {
      const clipper = createClipper();
      expect(clipper).toBeInstanceOf(Clipper);
    });
  });

  describe('Clipper.clip', () => {
    const clipper = createClipper();

    it('should extract and convert content', () => {
      const result = clipper.clip(testHtml, { url: 'https://example.com/article' });

      expect(result.markdown).toBeDefined();
      expect(result.html).toBeDefined();
      expect(result.metadata).toBeDefined();
      expect(result.suggestedFilename).toBeDefined();
    });

    it('should extract metadata correctly', () => {
      const result = clipper.clip(testHtml, { url: 'https://example.com/article' });

      expect(result.metadata.title).toBe('Test Article');
      expect(result.metadata.author).toBe('Test Author');
      expect(result.metadata.description).toBe('This is a test article');
      expect(result.metadata.domain).toBe('example.com');
    });

    it('should convert content to markdown', () => {
      const result = clipper.clip(testHtml, { url: 'https://example.com/article' });

      expect(result.markdown).toContain('main content');
      expect(result.markdown).toContain('**bold**');
      // Note: em/em markup and list items may be rendered differently by Defuddle
      expect(result.markdown).toMatch(/italic/);
    });

    it('should generate sanitized filename', () => {
      const result = clipper.clip(testHtml, { url: 'https://example.com/article' });
      expect(result.suggestedFilename).toBe('Test Article');
    });

    it('should use custom filename when provided', () => {
      const result = clipper.clip(testHtml, {
        url: 'https://example.com/article',
        filename: 'My Custom Name',
      });
      expect(result.suggestedFilename).toBe('My Custom Name');
    });
  });

  describe('Clipper.extract', () => {
    const clipper = createClipper();

    it('should extract content without converting', () => {
      const result = clipper.extract(testHtml, { url: 'https://example.com' });

      expect(result.content).toBeDefined();
      expect(result.metadata).toBeDefined();
      expect(result.parseTime).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Clipper.convert', () => {
    const clipper = createClipper();

    it('should convert HTML to markdown', () => {
      const html = '<p>Hello <strong>World</strong></p>';
      const result = clipper.convert(html, { baseUrl: 'https://example.com' });

      expect(result).toContain('Hello **World**');
    });
  });
});

describe('Quick functions', () => {
  const testHtml = `
    <!DOCTYPE html>
    <html>
      <head><title>Quick Test</title></head>
      <body><article><p>Quick test content</p></article></body>
    </html>
  `;

  describe('clip', () => {
    it('should clip content using default clipper', () => {
      const result = clip(testHtml, { url: 'https://example.com' });

      expect(result.markdown).toContain('Quick test content');
      expect(result.metadata.title).toBe('Quick Test');
    });
  });

  describe('extract', () => {
    it('should extract content using default clipper', () => {
      const result = extract(testHtml, { url: 'https://example.com' });

      expect(result.content).toBeDefined();
      expect(result.metadata.title).toBe('Quick Test');
    });
  });

  describe('convertToMarkdown', () => {
    it('should convert HTML to markdown using default clipper', () => {
      const result = convertToMarkdown('<p>Test</p>', { baseUrl: 'https://example.com' });

      expect(result).toBe('Test');
    });
  });
});

describe('Real-world scenarios', () => {
  it('should handle article with images', () => {
    const html = `
      <!DOCTYPE html>
      <html>
        <head><title>Article with Images</title></head>
        <body>
          <article>
            <h1>Article with Images</h1>
            <p>Here is an image:</p>
            <img src="/images/test.png" alt="Test Image">
            <p>And some more text.</p>
          </article>
        </body>
      </html>
    `;

    const result = clip(html, { url: 'https://example.com/article' });

    expect(result.markdown).toContain('![Test Image]');
    expect(result.markdown).toContain('https://example.com/images/test.png');
  });

  it('should handle article with code blocks', () => {
    const html = `
      <!DOCTYPE html>
      <html>
        <head><title>Code Article</title></head>
        <body>
          <article>
            <h1>Code Example</h1>
            <pre><code data-lang="javascript">const x = 1;</code></pre>
          </article>
        </body>
      </html>
    `;

    const result = clip(html, { url: 'https://example.com/article' });

    expect(result.markdown).toContain('```javascript');
    expect(result.markdown).toContain('const x = 1;');
  });

  it('should handle article with links', () => {
    const html = `
      <!DOCTYPE html>
      <html>
        <head><title>Links Article</title></head>
        <body>
          <article>
            <p>Check out <a href="https://github.com">GitHub</a> for more info.</p>
          </article>
        </body>
      </html>
    `;

    const result = clip(html, { url: 'https://example.com/article' });

    expect(result.markdown).toContain('[GitHub](https://github.com');
  });

  it('should handle complex nested content', () => {
    const html = `
      <!DOCTYPE html>
      <html>
        <head><title>Complex Article</title></head>
        <body>
          <article>
            <h1>Complex Content</h1>
            <blockquote>
              <p>This is a quote with <strong>bold</strong> text.</p>
            </blockquote>
            <ul>
              <li>Item with <code>code</code></li>
              <li>Item with <a href="/link">link</a></li>
            </ul>
          </article>
        </body>
      </html>
    `;

    const result = clip(html, { url: 'https://example.com/article' });

    expect(result.markdown).toContain('> ');
    expect(result.markdown).toContain('**bold**');
    expect(result.markdown).toContain('`code`');
    expect(result.markdown).toContain('[link]');
  });
});

