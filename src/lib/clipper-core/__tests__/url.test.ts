/**
 * Tests for URL utility functions
 */

import { describe, it, expect } from 'vitest';
import { getDomain, UrlProcessor } from '../utils/url';

describe('URL Utils', () => {
  describe('getDomain', () => {
    it('should extract domain from full URL', () => {
      expect(getDomain('https://www.example.com/path/to/page')).toBe('example.com');
    });

    it('should handle subdomain', () => {
      expect(getDomain('https://blog.example.com')).toBe('example.com');
    });

    it('should handle co.uk style domains', () => {
      expect(getDomain('https://www.example.co.uk')).toBe('example.co.uk');
    });

    it('should handle localhost', () => {
      expect(getDomain('http://localhost:3000')).toBe('localhost');
    });

    it('should handle IP addresses', () => {
      expect(getDomain('http://192.168.1.1:8080')).toBe('192.168.1.1');
    });

    it('should return empty string for invalid URL', () => {
      expect(getDomain('not a url')).toBe('');
    });

    it('should handle URLs without subdomain', () => {
      expect(getDomain('https://example.com')).toBe('example.com');
    });
  });

  describe('UrlProcessor', () => {
    const processor = new UrlProcessor();

    it('should make relative image URLs absolute', () => {
      const html = '<img src="/images/test.png">';
      const baseUrl = new URL('https://example.com/page/');
      const result = processor.processUrls(html, baseUrl);
      expect(result).toContain('https://example.com/images/test.png');
    });

    it('should make relative link URLs absolute', () => {
      const html = '<a href="/about">About</a>';
      const baseUrl = new URL('https://example.com/');
      const result = processor.processUrls(html, baseUrl);
      expect(result).toContain('https://example.com/about');
    });

    it('should preserve absolute URLs', () => {
      const html = '<img src="https://other.com/image.png">';
      const baseUrl = new URL('https://example.com/');
      const result = processor.processUrls(html, baseUrl);
      expect(result).toContain('https://other.com/image.png');
    });

    it('should handle srcset attributes', () => {
      const html = '<img srcset="/img/small.png 1x, /img/large.png 2x">';
      const baseUrl = new URL('https://example.com/');
      const result = processor.processUrls(html, baseUrl);
      // Note: srcset processing may vary based on format
      expect(result).toContain('https://example.com/img/small.png');
    });
  });
});

