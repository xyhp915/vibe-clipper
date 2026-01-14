/**
 * String utility functions
 * Single Responsibility Principle (SRP): Only handles string operations
 */

/**
 * Escape markdown special characters
 */
export function escapeMarkdown(str: string): string {
  return str.replace(/([[\]])/g, '\\$1')
}

/**
 * Escape special characters in a value string
 */
export function escapeValue(value: string): string {
  return value.replace(/"/g, '\\"').replace(/\n/g, '\\n')
}

/**
 * Unescape special characters in a value string
 */
export function unescapeValue(value: string): string {
  return value.replace(/\\"/g, '"').replace(/\\n/g, '\n')
}

/**
 * Escape double quotes
 */
export function escapeDoubleQuotes(str: string): string {
  return str.replace(/"/g, '\\"')
}

/**
 * Escape HTML special characters
 */
export function escapeHtml(unsafe: string): string {
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

/**
 * Strip HTML tags from a string
 */
export function stripHtml(html: string): string {
  const parser = new DOMParser()
  const doc = parser.parseFromString(html, 'text/html')
  return doc.body.textContent || ''
}

/**
 * Sanitize a filename by removing invalid characters
 */
export function sanitizeFileName(fileName: string): string {
  // Detect platform (works in browser and Node.js)
  const platform = typeof navigator !== 'undefined'
    ? ((navigator as unknown as {
      userAgentData?: { platform: string }
    }).userAgentData?.platform || navigator.platform || '')
    // @ts-ignore
    : process.platform || ''

  const isWindows = /win/i.test(platform)
  const isMac = /mac|darwin/i.test(platform)

  let sanitized = fileName.replace(/[#\^\[\]|]/g, '')

  if (isWindows) {
    sanitized = sanitized
      .replace(/[<>:"\/\\?*\x00-\x1F]/g, '')
      .replace(/^(con|prn|aux|nul|com[0-9]|lpt[0-9])(\..*)?$/i, '_$1$2')
      .replace(/[\s.]+$/, '')
  } else if (isMac) {
    sanitized = sanitized
      .replace(/[\/:\x00-\x1F]/g, '')
      .replace(/^\./, '_')
  } else {
    // Linux and other systems
    sanitized = sanitized
      .replace(/[<>:"\/\\?*\x00-\x1F]/g, '')
      .replace(/^\./, '_')
  }

  // Common operations for all platforms
  sanitized = sanitized
    .replace(/^\.+/, '') // Remove leading periods
    .trim()
    .slice(0, 245) // Trim to 245 characters, leaving room to append ' 1.md'

  // Ensure the file name is not empty
  if (sanitized.length === 0) {
    sanitized = 'Untitled'
  }

  return sanitized
}

/**
 * Format a duration in milliseconds to a human-readable string
 */
export function formatDuration(ms: number): string {
  if (ms < 1000) {
    return `${Math.round(ms)}ms`
  } else {
    return `${(ms / 1000).toFixed(2)}s`
  }
}

/**
 * Truncate text to a maximum length with ellipsis
 */
export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text
  return text.slice(0, maxLength - 3) + '...'
}

