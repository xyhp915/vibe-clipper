/**
 * Markdown Converter using Turndown
 * Implements IMarkdownConverter interface
 * Single Responsibility: Convert HTML to Markdown
 */

import TurndownService from 'turndown'
import { MathMLToLaTeX } from 'mathml-to-latex'
import type { IMarkdownConverter, MarkdownOptions } from '../types'
import { getElementHTML } from '../utils'
import { createUrlProcessor } from '../utils'

/**
 * Default markdown conversion options
 */
const DEFAULT_OPTIONS: Required<Omit<MarkdownOptions, 'baseUrl'>> = {
  headingStyle: 'atx',
  hr: '---',
  bulletListMarker: '-',
  codeBlockStyle: 'fenced',
  emDelimiter: '*',
}

/**
 * Turndown-based markdown converter
 */
export class TurndownConverter implements IMarkdownConverter {
  private urlProcessor = createUrlProcessor()

  /**
   * Convert HTML to markdown
   */
  convert(html: string, options: MarkdownOptions): string {
    const opts = { ...DEFAULT_OPTIONS, ...options }
    const baseUrl = new URL(options.baseUrl)

    // Process URLs first
    const processedHtml = this.urlProcessor.processUrls(html, baseUrl)

    // Create Turndown service
    const turndownService = new TurndownService({
      headingStyle: opts.headingStyle,
      hr: opts.hr,
      bulletListMarker: opts.bulletListMarker,
      codeBlockStyle: opts.codeBlockStyle,
      emDelimiter: opts.emDelimiter,
      preformattedCode: true,
    })

    // Add custom rules
    this.addTableRule(turndownService)
    this.addListRules(turndownService)
    this.addFigureRule(turndownService)
    this.addEmbedRule(turndownService)
    this.addHighlightRule(turndownService)
    this.addStrikethroughRule(turndownService)
    this.addMathRules(turndownService)
    this.addCalloutRule(turndownService)
    this.addCodeRule(turndownService)
    this.addCitationRules(turndownService)
    this.addRemovalRules(turndownService)

    // Remove scripts and styles, keep certain elements
    turndownService.remove(['style', 'script', 'button'])
    // @ts-expect-error - Turndown types don't include keep method correctly
    turndownService.keep(['iframe', 'video', 'audio', 'sup', 'sub', 'svg', 'math'])

    try {
      let markdown = turndownService.turndown(processedHtml)

      // Post-processing
      markdown = this.postProcess(markdown)

      return markdown.trim()
    } catch (error) {
      console.error('Error converting HTML to Markdown:', error)
      return `Partial conversion completed with errors. Original HTML:\n\n${processedHtml}`
    }
  }

  /**
   * Post-process markdown output
   */
  private postProcess(markdown: string): string {
    // Remove title from the beginning if it exists
    const titleMatch = markdown.match(/^# .+\n+/)
    if (titleMatch) {
      markdown = markdown.slice(titleMatch[0].length)
    }

    // Remove empty links (but not image links)
    markdown = markdown.replace(/\n*(?<!!)\[]\([^)]+\)\n*/g, '')

    // Remove consecutive newlines more than two
    markdown = markdown.replace(/\n{3,}/g, '\n\n')

    return markdown
  }

  /**
   * Add table conversion rule
   */
  private addTableRule(turndownService: TurndownService): void {
    turndownService.addRule('table', {
      filter: 'table',
      replacement: (content, node) => {
        if (!(node instanceof HTMLTableElement)) return content

        // Check for complex structure (colspan/rowspan)
        const hasComplexStructure = Array.from(node.querySelectorAll('td, th')).some(
          cell => cell.hasAttribute('colspan') || cell.hasAttribute('rowspan')
        )

        if (hasComplexStructure) {
          return '\n\n' + this.cleanupTableHTML(node) + '\n\n'
        }

        // Process simple tables
        const rows = Array.from(node.rows).map(row => {
          const cells = Array.from(row.cells).map(cell => {
            let cellContent = turndownService.turndown(getElementHTML(cell))
              .replace(/\n/g, ' ')
              .trim()
            cellContent = cellContent.replace(/\|/g, '\\|')
            return cellContent
          })
          return `| ${cells.join(' | ')} |`
        })

        // Create separator row
        const separatorRow = `| ${Array(rows[0].split('|').length - 2).fill('---').join(' | ')} |`

        return `\n\n${[rows[0], separatorRow, ...rows.slice(1)].join('\n')}\n\n`
      },
    })
  }

  /**
   * Clean table HTML for complex tables
   */
  private cleanupTableHTML(table: HTMLTableElement): string {
    const allowedAttributes = ['src', 'href', 'style', 'align', 'width', 'height', 'rowspan', 'colspan', 'bgcolor', 'scope', 'valign', 'headers']

    const cleanElement = (element: Element) => {
      Array.from(element.attributes).forEach(attr => {
        if (!allowedAttributes.includes(attr.name)) {
          element.removeAttribute(attr.name)
        }
      })

      element.childNodes.forEach(child => {
        if (child instanceof Element) {
          cleanElement(child)
        }
      })
    }

    const tableClone = table.cloneNode(true) as HTMLTableElement
    cleanElement(tableClone)

    return tableClone.outerHTML
  }

  /**
   * Add list conversion rules
   */
  private addListRules(turndownService: TurndownService): void {
    turndownService.addRule('list', {
      filter: ['ul', 'ol'],
      replacement: (content, node) => {
        content = content.trim()
        const isTopLevel = !(node.parentNode && (node.parentNode.nodeName === 'UL' || node.parentNode.nodeName === 'OL'))
        return (isTopLevel ? '\n' : '') + content + '\n'
      },
    })

    turndownService.addRule('listItem', {
      filter: 'li',
      replacement: (content, node, options) => {
        if (!(node instanceof HTMLElement)) return content

        // Handle task list items
        const isTaskListItem = node.classList.contains('task-list-item')
        const checkbox = node.querySelector('input[type="checkbox"]') as HTMLInputElement | null
        let taskListMarker = ''

        if (isTaskListItem && checkbox) {
          content = content.replace(/<input[^>]*>/, '')
          taskListMarker = checkbox.checked ? '[x] ' : '[ ] '
        }

        content = content
          .replace(/\n+$/, '')
          .split('\n')
          .filter(line => line.length > 0)
          .join('\n\t')

        let prefix = options.bulletListMarker + ' '
        const parent = node.parentNode

        // Calculate nesting level
        let level = 0
        let currentParent = node.parentNode
        while (currentParent && (currentParent.nodeName === 'UL' || currentParent.nodeName === 'OL')) {
          level++
          currentParent = currentParent.parentNode
        }

        const indentLevel = Math.max(0, level - 1)
        prefix = '\t'.repeat(indentLevel) + prefix

        if (parent instanceof HTMLOListElement) {
          const start = parent.getAttribute('start')
          const index = Array.from(parent.children).indexOf(node as HTMLElement) + 1
          prefix = '\t'.repeat(level - 1) + (start ? Number(start) + index - 1 : index) + '. '
        }

        return prefix + taskListMarker + content.trim() + (node.nextSibling && !/\n$/.test(content) ? '\n' : '')
      },
    })
  }

  /**
   * Add figure conversion rule
   */
  private addFigureRule(turndownService: TurndownService): void {
    turndownService.addRule('figure', {
      filter: 'figure',
      replacement: (content, node) => {
        const figure = node as HTMLElement
        const img = figure.querySelector('img')
        const figcaption = figure.querySelector('figcaption')

        if (!img) return content

        const alt = img.getAttribute('alt') || ''
        let src = img.getAttribute('src') || ''
        const srcset = img.getAttribute('srcset') || ''

        if (srcset) {
          const srcsetUrls = srcset.split(',%20')
          const images = srcsetUrls.map(url => {
            const split = url.split('%20')
            return { src: split[0], width: parseInt(split[1]) }
          })
          src = images[0]?.src || src
        }

        const caption = figcaption
          ? turndownService.turndown(getElementHTML(figcaption)).trim()
          : ''

        return `![${alt}](${src})\n\n${caption}\n\n`
      },
    })
  }

  /**
   * Add embed conversion rule (YouTube, Twitter)
   */
  private addEmbedRule(turndownService: TurndownService): void {
    turndownService.addRule('embedToMarkdown', {
      filter: (node) => {
        if (node instanceof HTMLIFrameElement) {
          const src = node.getAttribute('src')
          return !!src && (
            !!src.match(/(?:youtube\.com|youtu\.be)/) ||
            !!src.match(/(?:twitter\.com|x\.com)/)
          )
        }
        return false
      },
      replacement: (content, node) => {
        if (node instanceof HTMLIFrameElement) {
          const src = node.getAttribute('src')
          if (src) {
            const youtubeMatch = src.match(/(?:https?:\/\/)?(?:www\.)?(?:youtube\.com|youtu\.be)\/(?:embed\/|watch\?v=)?([a-zA-Z0-9_-]+)/)
            if (youtubeMatch?.[1]) {
              return `![](https://www.youtube.com/watch?v=${youtubeMatch[1]})`
            }
            const tweetMatch = src.match(/(?:twitter\.com|x\.com)\/.*?(?:status|statuses)\/(\d+)/)
            if (tweetMatch?.[1]) {
              return `![](https://x.com/i/status/${tweetMatch[1]})`
            }
          }
        }
        return content
      },
    })
  }

  /**
   * Add highlight (mark) conversion rule
   */
  private addHighlightRule(turndownService: TurndownService): void {
    turndownService.addRule('highlight', {
      filter: 'mark',
      replacement: (content) => '==' + content + '==',
    })
  }

  /**
   * Add strikethrough conversion rule
   */
  private addStrikethroughRule(turndownService: TurndownService): void {
    turndownService.addRule('strikethrough', {
      filter: (node) =>
        node.nodeName === 'DEL' ||
        node.nodeName === 'S' ||
        node.nodeName === 'STRIKE',
      replacement: (content) => '~~' + content + '~~',
    })
  }

  /**
   * Add math conversion rules (MathJax, MathML, KaTeX)
   */
  private addMathRules(turndownService: TurndownService): void {
    // MathJax
    turndownService.addRule('MathJax', {
      filter: (node) => node.nodeName.toLowerCase() === 'mjx-container',
      replacement: (content, node) => {
        if (!(node instanceof HTMLElement)) return content

        const assistiveMml = node.querySelector('mjx-assistive-mml')
        if (!assistiveMml) return content

        const mathElement = assistiveMml.querySelector('math')
        if (!mathElement) return content

        let latex: string
        try {
          latex = MathMLToLaTeX.convert(mathElement.outerHTML)
        } catch (error) {
          console.error('Error converting MathML to LaTeX:', error)
          return content
        }

        const isBlock = mathElement.getAttribute('display') === 'block'
        return isBlock ? `\n$$\n${latex}\n$$\n` : `$${latex}$`
      },
    })

    // MathML
    turndownService.addRule('math', {
      filter: (node) => {
        return node.nodeName.toLowerCase() === 'math' ||
          (node instanceof Element && node.classList &&
            (node.classList.contains('mwe-math-element') ||
              node.classList.contains('mwe-math-fallback-image-inline') ||
              node.classList.contains('mwe-math-fallback-image-display')))
      },
      replacement: (content, node) => {
        if (!(node instanceof Element)) return content

        const latex = this.extractLatex(node).trim()
        const isInTable = node.closest('table') !== null

        if (!isInTable && (
          node.getAttribute('display') === 'block' ||
          node.classList.contains('mwe-math-fallback-image-display')
        )) {
          return `\n$$\n${latex}\n$$\n`
        }

        return ` $${latex}$ `
      },
    })

    // KaTeX
    turndownService.addRule('katex', {
      filter: (node) => {
        return node instanceof HTMLElement &&
          (node.classList.contains('math') || node.classList.contains('katex'))
      },
      replacement: (content, node) => {
        if (!(node instanceof HTMLElement)) return content

        let latex = node.getAttribute('data-latex')
        if (!latex) {
          const mathml = node.querySelector('.katex-mathml annotation[encoding="application/x-tex"]')
          latex = mathml?.textContent || ''
        }
        if (!latex) {
          latex = node.textContent?.trim() || ''
        }

        const mathElement = node.querySelector('.katex-mathml math')
        const isInline = node.classList.contains('math-inline') ||
          (mathElement && mathElement.getAttribute('display') !== 'block')

        return isInline ? `$${latex}$` : `\n$$\n${latex}\n$$\n`
      },
    })
  }

  /**
   * Extract LaTeX from a math element
   */
  private extractLatex(element: Element): string {
    if (element.nodeName.toLowerCase() === 'math') {
      const latex = element.getAttribute('data-latex')
      const alttext = element.getAttribute('alttext')
      if (latex) return latex.trim()
      if (alttext) return alttext.trim()
    }

    const mathElement = element.querySelector('math[alttext]')
    if (mathElement) {
      const alttext = mathElement.getAttribute('alttext')
      if (alttext) return alttext.trim()
    }

    const annotation = element.querySelector('annotation[encoding="application/x-tex"]')
    if (annotation?.textContent) {
      return annotation.textContent.trim()
    }

    const mathNode = element.nodeName.toLowerCase() === 'math' ? element : element.querySelector('math')
    if (mathNode) {
      return MathMLToLaTeX.convert(mathNode.outerHTML)
    }

    const imgNode = element.querySelector('img')
    return imgNode?.getAttribute('alt') || ''
  }

  /**
   * Add callout/alert conversion rule
   */
  private addCalloutRule(turndownService: TurndownService): void {
    turndownService.addRule('callout', {
      filter: (node) => {
        return (
          node.nodeName.toLowerCase() === 'div' &&
          node.classList.contains('markdown-alert')
        )
      },
      replacement: (content, node) => {
        const element = node as HTMLElement

        const alertClasses = Array.from(element.classList)
        const typeClass = alertClasses.find(c => c.startsWith('markdown-alert-') && c !== 'markdown-alert')
        const type = typeClass ? typeClass.replace('markdown-alert-', '').toUpperCase() : 'NOTE'

        const titleElement = element.querySelector('.markdown-alert-title')
        const contentElement = element.querySelector('p:not(.markdown-alert-title)')

        let alertContent = content
        if (titleElement && titleElement.textContent) {
          alertContent = contentElement?.textContent || content.replace(titleElement.textContent, '')
        }

        return `\n> [!${type}]\n> ${alertContent.trim().replace(/\n/g, '\n> ')}\n`
      },
    })
  }

  /**
   * Add code block conversion rule
   */
  private addCodeRule(turndownService: TurndownService): void {
    turndownService.addRule('preformattedCode', {
      filter: (node) => node.nodeName === 'PRE',
      replacement: (content, node) => {
        if (!(node instanceof HTMLElement)) return content

        const codeElement = node.querySelector('code')
        if (!codeElement) return content

        const language = codeElement.getAttribute('data-lang') || ''
        const code = codeElement.textContent || ''

        const cleanCode = code.trim().replace(/`/g, '\\`')

        return `\n\`\`\`${language}\n${cleanCode}\n\`\`\`\n`
      },
    })
  }

  /**
   * Add citation/footnote conversion rules
   */
  private addCitationRules(turndownService: TurndownService): void {
    turndownService.addRule('citations', {
      filter: (node) => {
        if (node instanceof Element) {
          return node.nodeName === 'SUP' && node.id.startsWith('fnref:')
        }
        return false
      },
      replacement: (content, node) => {
        if (node instanceof HTMLElement) {
          if (node.nodeName === 'SUP' && node.id.startsWith('fnref:')) {
            const id = node.id.replace('fnref:', '')
            const primaryNumber = id.split('-')[0]
            return `[^${primaryNumber}]`
          }
        }
        return content
      },
    })

    turndownService.addRule('footnotesList', {
      filter: (node) => {
        if (node instanceof HTMLOListElement) {
          return node.parentElement?.id === 'footnotes'
        }
        return false
      },
      replacement: (content, node) => {
        if (node instanceof HTMLElement) {
          const references = Array.from(node.children).map(li => {
            let id: string
            if (li.id.startsWith('fn:')) {
              id = li.id.replace('fn:', '')
            } else {
              const match = li.id.split('/').pop()?.match(/cite_note-(.+)/)
              id = match ? match[1] : li.id
            }

            const supElement = li.querySelector('sup')
            if (supElement && supElement.textContent?.trim() === id) {
              supElement.remove()
            }

            const referenceContent = turndownService.turndown(getElementHTML(li))
            const cleanedContent = referenceContent.replace(/\s*↩︎$/, '').trim()
            return `[^${id.toLowerCase()}]: ${cleanedContent}`
          })
          return '\n\n' + references.join('\n\n') + '\n\n'
        }
        return content
      },
    })
  }

  /**
   * Add removal rules for unwanted elements
   */
  private addRemovalRules(turndownService: TurndownService): void {
    turndownService.addRule('removals', {
      filter: (node) => {
        if (!(node instanceof HTMLElement)) return false
        if (node.getAttribute('href')?.includes('#fnref')) return true
        if (node.classList.contains('footnote-backref')) return true
        return false
      },
      replacement: () => '',
    })

    turndownService.addRule('removeHiddenElements', {
      filter: (node) => {
        return (node as HTMLElement).style?.display === 'none'
      },
      replacement: () => '',
    })
  }
}

/**
 * Create a markdown converter instance
 * Factory function following Dependency Inversion Principle
 */
export function createMarkdownConverter(): IMarkdownConverter {
  return new TurndownConverter()
}

