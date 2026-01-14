/**
 * DOM utility functions
 * Single Responsibility Principle (SRP): Only handles DOM operations
 */

/**
 * Get element HTML content safely
 */
export function getElementHTML(element: Element): string {
  const serializer = new XMLSerializer()
  let result = ''
  Array.from(element.childNodes).forEach(node => {
    if (node.nodeType === Node.ELEMENT_NODE) {
      result += serializer.serializeToString(node)
    } else if (node.nodeType === Node.TEXT_NODE) {
      result += node.textContent
    }
  })
  return result
}

/**
 * Get XPath of an element
 */
export function getElementXPath(element: Node): string {
  if (element.nodeType === Node.DOCUMENT_NODE) return ''
  if (element.nodeType !== Node.ELEMENT_NODE) {
    return getElementXPath(element.parentNode!)
  }

  let ix = 0
  const siblings = element.parentNode?.childNodes || []
  for (let i = 0; i < siblings.length; i++) {
    const sibling = siblings[i]
    if (sibling === element) {
      return getElementXPath(element.parentNode!) + '/' + (element as Element).tagName.toLowerCase() + '[' + (ix + 1) + ']'
    }
    if (sibling.nodeType === Node.ELEMENT_NODE && (sibling as Element).tagName === (element as Element).tagName) {
      ix++
    }
  }
  return ''
}

/**
 * Get element by XPath
 */
export function getElementByXPath(xpath: string, contextNode: Node = document): Element | null {
  return document.evaluate(xpath, contextNode, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue as Element | null
}

/**
 * Check if a color is dark
 */
export function isDarkColor(color: string): boolean {
  const rgb = color.match(/\d+/g)
  if (!rgb || rgb.length < 3) return false

  // Calculate perceived brightness
  const brightness = (parseInt(rgb[0]) * 299 + parseInt(rgb[1]) * 587 + parseInt(rgb[2]) * 114) / 1000

  return brightness < 128
}

/**
 * Wrap an element's contents with a mark tag
 */
export function wrapElementWithMark(element: Element): void {
  const mark = document.createElement('mark')

  while (element.firstChild) {
    mark.appendChild(element.firstChild)
  }

  element.appendChild(mark)
}

/**
 * Wrap text within an element with a mark tag
 */
export function wrapTextWithMark(element: Element, highlight: { startOffset: number; endOffset: number }): void {
  const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT)
  let currentOffset = 0
  let startNode: Text | null = null
  let endNode: Text | null = null
  let startOffset = 0
  let endOffset = 0

  let node
  while (node = walker.nextNode() as Text) {
    const length = node.length

    if (!startNode && currentOffset + length > highlight.startOffset) {
      startNode = node
      startOffset = highlight.startOffset - currentOffset
    }

    if (!endNode && currentOffset + length >= highlight.endOffset) {
      endNode = node
      endOffset = highlight.endOffset - currentOffset
      break
    }

    currentOffset += length
  }

  if (startNode && endNode) {
    const range = document.createRange()
    range.setStart(startNode, startOffset)
    range.setEnd(endNode, endOffset)

    const mark = document.createElement('mark')
    range.surroundContents(mark)
  }
}

/**
 * Clean HTML by removing scripts, styles, and style attributes
 */
export function cleanHtml(html: string, baseUrl?: string): string {
  const parser = new DOMParser()
  const doc = parser.parseFromString(html, 'text/html')

  // Remove all script and style elements
  doc.querySelectorAll('script, style').forEach(el => el.remove())

  // Remove style attributes from all elements
  doc.querySelectorAll('*').forEach(el => el.removeAttribute('style'))

  // Convert all relative URLs to absolute if baseUrl provided
  if (baseUrl) {
    const base = new URL(baseUrl)
    doc.querySelectorAll('[src], [href]').forEach(element => {
      ['src', 'href', 'srcset'].forEach(attr => {
        const value = element.getAttribute(attr)
        if (!value) return

        if (attr === 'srcset') {
          const newSrcset = value.split(',').map(src => {
            const [url, size] = src.trim().split(' ')
            try {
              const absoluteUrl = new URL(url, base).href
              return `${absoluteUrl}${size ? ' ' + size : ''}`
            } catch {
              return src
            }
          }).join(', ')
          element.setAttribute(attr, newSrcset)
        } else if (!value.startsWith('http') && !value.startsWith('data:') && !value.startsWith('#') && !value.startsWith('//')) {
          try {
            const absoluteUrl = new URL(value, base).href
            element.setAttribute(attr, absoluteUrl)
          } catch {
            console.warn(`Failed to process ${attr} URL:`, value)
          }
        }
      })
    })
  }

  return doc.documentElement.outerHTML
}

