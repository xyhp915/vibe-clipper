/**
 * URL utility functions
 * Single Responsibility Principle (SRP): Only handles URL-related operations
 */

import type { IUrlProcessor } from '../types';

/**
 * Extract domain from URL
 */
export function getDomain(url: string): string {
  try {
    const urlObj = new URL(url);
    const hostname = urlObj.hostname;

    // Handle local development URLs
    if (hostname === 'localhost' || hostname === '127.0.0.1' || hostname.match(/^(\d{1,3}\.){3}\d{1,3}$/)) {
      return hostname;
    }

    const hostParts = hostname.split('.');

    // Handle special cases like co.uk, com.au, etc.
    if (hostParts.length > 2) {
      const lastTwo = hostParts.slice(-2).join('.');
      if (lastTwo.match(/^(co|com|org|net|edu|gov|mil)\.[a-z]{2}$/)) {
        return hostParts.slice(-3).join('.');
      }
    }

    return hostParts.slice(-2).join('.');
  } catch (error) {
    console.warn('Invalid URL:', url);
    return '';
  }
}

/**
 * Make a URL attribute absolute
 */
export function makeUrlAbsolute(element: Element, attributeName: string, baseUrl: URL): void {
  const attributeValue = element.getAttribute(attributeName);
  if (!attributeValue) return;

  try {
    // Create a new URL object from the base URL
    const resolvedBaseUrl = new URL(baseUrl.href);

    // If the base URL points to a file, remove the filename to get the directory
    if (!resolvedBaseUrl.pathname.endsWith('/')) {
      resolvedBaseUrl.pathname = resolvedBaseUrl.pathname.substring(0, resolvedBaseUrl.pathname.lastIndexOf('/') + 1);
    }

    const url = new URL(attributeValue, resolvedBaseUrl);

    if (!['http:', 'https:'].includes(url.protocol)) {
      // Handle non-standard protocols (chrome-extension://, moz-extension://, brave://, etc.)
      const parts = attributeValue.split('/');
      const firstSegment = parts[2]; // The segment after the protocol

      if (firstSegment && firstSegment.includes('.')) {
        // If it looks like a domain, replace the non-standard protocol with the current page's protocol
        const newUrl = `${baseUrl.protocol}//` + attributeValue.split('://')[1];
        element.setAttribute(attributeName, newUrl);
      } else {
        // If it doesn't look like a domain it's probably the extension URL, remove the non-standard protocol part and use baseUrl
        const path = parts.slice(3).join('/');
        const newUrl = new URL(path, resolvedBaseUrl.origin + resolvedBaseUrl.pathname).href;
        element.setAttribute(attributeName, newUrl);
      }
    } else {
      // Handle other cases (relative URLs, protocol-relative URLs)
      element.setAttribute(attributeName, url.href);
    }
  } catch (error) {
    console.warn(`Failed to process URL: ${attributeValue}`, error);
  }
}

/**
 * Default URL processor implementation
 */
export class UrlProcessor implements IUrlProcessor {
  /**
   * Process all URLs in HTML content to make them absolute
   */
  processUrls(html: string, baseUrl: URL): string {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');

    // Handle relative URLs for images and links
    doc.querySelectorAll('img').forEach(img => {
      makeUrlAbsolute(img, 'srcset', baseUrl);
      makeUrlAbsolute(img, 'src', baseUrl);
    });
    doc.querySelectorAll('a').forEach(link => makeUrlAbsolute(link, 'href', baseUrl));

    // Serialize back to HTML
    const serializer = new XMLSerializer();
    let result = '';
    Array.from(doc.body.childNodes).forEach(node => {
      if (node.nodeType === Node.ELEMENT_NODE) {
        result += serializer.serializeToString(node);
      } else if (node.nodeType === Node.TEXT_NODE) {
        result += node.textContent;
      }
    });

    return result;
  }
}

/**
 * Create a default URL processor instance
 */
export function createUrlProcessor(): IUrlProcessor {
  return new UrlProcessor();
}

