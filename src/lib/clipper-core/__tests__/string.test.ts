/**
 * Tests for string utility functions
 */

import { describe, it, expect } from 'vitest';
import {
  escapeMarkdown,
  escapeHtml,
  sanitizeFileName,
  stripHtml,
  truncate,
  formatDuration,
} from '../utils/string';

describe('String Utils', () => {
  describe('escapeMarkdown', () => {
    it('should escape square brackets', () => {
      expect(escapeMarkdown('[link]')).toBe('\\[link\\]');
    });

    it('should handle empty string', () => {
      expect(escapeMarkdown('')).toBe('');
    });

    it('should not escape other characters', () => {
      expect(escapeMarkdown('hello world')).toBe('hello world');
    });
  });

  describe('escapeHtml', () => {
    it('should escape HTML special characters', () => {
      expect(escapeHtml('<script>alert("xss")</script>')).toBe(
        '&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;'
      );
    });

    it('should escape ampersand', () => {
      expect(escapeHtml('a & b')).toBe('a &amp; b');
    });

    it('should escape single quotes', () => {
      expect(escapeHtml("it's")).toBe('it&#039;s');
    });
  });

  describe('sanitizeFileName', () => {
    it('should remove special characters', () => {
      const result = sanitizeFileName('Hello#World[Test]');
      expect(result).not.toContain('#');
      expect(result).not.toContain('[');
      expect(result).not.toContain(']');
    });

    it('should trim whitespace', () => {
      expect(sanitizeFileName('  hello  ')).toBe('hello');
    });

    it('should return Untitled for empty string', () => {
      expect(sanitizeFileName('')).toBe('Untitled');
    });

    it('should truncate long filenames', () => {
      const longName = 'a'.repeat(300);
      const result = sanitizeFileName(longName);
      expect(result.length).toBeLessThanOrEqual(245);
    });

    it('should remove leading periods after replacement', () => {
      // Note: On macOS/Linux, leading dots are replaced with underscore first
      const result = sanitizeFileName('..hidden');
      expect(result).not.toContain('..');
    });
  });

  describe('stripHtml', () => {
    it('should remove HTML tags', () => {
      expect(stripHtml('<p>Hello <strong>World</strong></p>')).toBe('Hello World');
    });

    it('should handle empty string', () => {
      expect(stripHtml('')).toBe('');
    });

    it('should handle text without tags', () => {
      expect(stripHtml('plain text')).toBe('plain text');
    });
  });

  describe('truncate', () => {
    it('should truncate long text', () => {
      expect(truncate('hello world', 8)).toBe('hello...');
    });

    it('should not truncate short text', () => {
      expect(truncate('hello', 10)).toBe('hello');
    });

    it('should handle exact length', () => {
      expect(truncate('hello', 5)).toBe('hello');
    });
  });

  describe('formatDuration', () => {
    it('should format milliseconds', () => {
      expect(formatDuration(500)).toBe('500ms');
    });

    it('should format seconds', () => {
      expect(formatDuration(1500)).toBe('1.50s');
    });

    it('should format edge case at 1000ms', () => {
      expect(formatDuration(1000)).toBe('1.00s');
    });
  });
});

