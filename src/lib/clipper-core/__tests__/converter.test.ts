/**
 * Tests for markdown converter
 */

import { describe, it, expect } from 'vitest';
import { TurndownConverter, createMarkdownConverter } from '../converters';

describe('TurndownConverter', () => {
  const converter = createMarkdownConverter();
  const baseUrl = 'https://example.com/page';

  describe('basic conversion', () => {
    it('should convert paragraphs', () => {
      const html = '<p>Hello World</p>';
      const result = converter.convert(html, { baseUrl });
      expect(result).toBe('Hello World');
    });

    it('should convert headings', () => {
      const html = '<h1>Title</h1><h2>Subtitle</h2>';
      const result = converter.convert(html, { baseUrl });
      // Note: Post-processing removes h1 title from beginning
      expect(result).toContain('## Subtitle');
    });

    it('should convert bold text', () => {
      const html = '<p><strong>bold</strong> text</p>';
      const result = converter.convert(html, { baseUrl });
      expect(result).toContain('**bold**');
    });

    it('should convert italic text', () => {
      const html = '<p><em>italic</em> text</p>';
      const result = converter.convert(html, { baseUrl });
      expect(result).toContain('*italic*');
    });

    it('should convert links', () => {
      const html = '<a href="https://example.com/page">Link</a>';
      const result = converter.convert(html, { baseUrl });
      expect(result).toContain('[Link](https://example.com/page)');
    });

    it('should convert images', () => {
      const html = '<img src="https://example.com/img.png" alt="Test">';
      const result = converter.convert(html, { baseUrl });
      expect(result).toBe('![Test](https://example.com/img.png)');
    });
  });

  describe('list conversion', () => {
    it('should convert unordered lists', () => {
      const html = '<ul><li>Item 1</li><li>Item 2</li></ul>';
      const result = converter.convert(html, { baseUrl });
      expect(result).toContain('- Item 1');
      expect(result).toContain('- Item 2');
    });

    it('should convert ordered lists', () => {
      const html = '<ol><li>First</li><li>Second</li></ol>';
      const result = converter.convert(html, { baseUrl });
      expect(result).toContain('1. First');
      expect(result).toContain('2. Second');
    });

    it('should convert nested lists', () => {
      const html = '<ul><li>Parent<ul><li>Child</li></ul></li></ul>';
      const result = converter.convert(html, { baseUrl });
      expect(result).toContain('- Parent');
      expect(result).toContain('\t- Child');
    });

    it('should convert task lists', () => {
      const html = '<ul><li class="task-list-item"><input type="checkbox" checked>Done</li><li class="task-list-item"><input type="checkbox">Todo</li></ul>';
      const result = converter.convert(html, { baseUrl });
      expect(result).toContain('[x] Done');
      expect(result).toContain('[ ] Todo');
    });
  });

  describe('code conversion', () => {
    it('should convert inline code', () => {
      const html = '<p>Use <code>npm install</code> to install</p>';
      const result = converter.convert(html, { baseUrl });
      expect(result).toContain('`npm install`');
    });

    it('should convert code blocks', () => {
      const html = '<pre><code data-lang="javascript">const x = 1;</code></pre>';
      const result = converter.convert(html, { baseUrl });
      expect(result).toContain('```javascript');
      expect(result).toContain('const x = 1;');
      expect(result).toContain('```');
    });
  });

  describe('special elements', () => {
    it('should convert blockquotes', () => {
      const html = '<blockquote>Quote text</blockquote>';
      const result = converter.convert(html, { baseUrl });
      expect(result).toContain('> Quote text');
    });

    it('should convert horizontal rules', () => {
      const html = '<hr>';
      const result = converter.convert(html, { baseUrl });
      expect(result).toBe('---');
    });

    it('should convert strikethrough', () => {
      const html = '<del>deleted</del>';
      const result = converter.convert(html, { baseUrl });
      expect(result).toBe('~~deleted~~');
    });

    it('should convert highlights', () => {
      const html = '<mark>highlighted</mark>';
      const result = converter.convert(html, { baseUrl });
      expect(result).toBe('==highlighted==');
    });
  });

  describe('table conversion', () => {
    it('should convert simple tables', () => {
      const html = `
        <table>
          <tr><th>Header 1</th><th>Header 2</th></tr>
          <tr><td>Cell 1</td><td>Cell 2</td></tr>
        </table>
      `;
      const result = converter.convert(html, { baseUrl });
      expect(result).toContain('| Header 1 | Header 2 |');
      expect(result).toContain('| --- | --- |');
      expect(result).toContain('| Cell 1 | Cell 2 |');
    });

    it('should preserve complex tables with colspan', () => {
      const html = `
        <table>
          <tr><td colspan="2">Merged</td></tr>
          <tr><td>Cell 1</td><td>Cell 2</td></tr>
        </table>
      `;
      const result = converter.convert(html, { baseUrl });
      expect(result).toContain('colspan');
    });
  });

  describe('embed conversion', () => {
    it('should convert YouTube embeds', () => {
      const html = '<iframe src="https://www.youtube.com/embed/abc123"></iframe>';
      const result = converter.convert(html, { baseUrl });
      expect(result).toContain('![](https://www.youtube.com/watch?v=abc123)');
    });
  });

  describe('cleanup', () => {
    it('should remove scripts', () => {
      const html = '<p>Text</p><script>alert("xss")</script>';
      const result = converter.convert(html, { baseUrl });
      expect(result).not.toContain('script');
      expect(result).not.toContain('alert');
    });

    it('should remove styles', () => {
      const html = '<p>Text</p><style>body { color: red; }</style>';
      const result = converter.convert(html, { baseUrl });
      expect(result).not.toContain('style');
      expect(result).not.toContain('color');
    });

    it('should handle empty links', () => {
      const html = '<p>Text <a href="http://example.com"></a> more text</p>';
      const result = converter.convert(html, { baseUrl });
      expect(result).not.toContain('[](');
    });
  });
});

describe('createMarkdownConverter', () => {
  it('should create a TurndownConverter instance', () => {
    const converter = createMarkdownConverter();
    expect(converter).toBeInstanceOf(TurndownConverter);
  });
});

