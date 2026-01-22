/// <reference types="chrome"/>
import 'bulma/css/bulma.css'
import { useState, useEffect } from 'preact/hooks'
import { clip, type ClipResult } from '../lib/clipper-core'
import { FileText, TextCursor, Send, Copy } from 'lucide-preact'

export function PopupUI () {
  const [clipResult, setClipResult] = useState<ClipResult | null>(null)
  const [markdown, setMarkdown] = useState<string>('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [hasSelection, setHasSelection] = useState(false)

  // Check if Chrome API is available
  const isChromeExtension = typeof chrome !== 'undefined' && chrome.tabs && chrome.scripting

  // Check if there's a selection when popup opens
  const checkSelection = async () => {
    try {
      if (!isChromeExtension) return

      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })
      if (!tab.id) return

      const results = await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: () => {
          const selection = window.getSelection()
          return selection && selection.toString().trim().length > 0
        },
      })

      if (results && results[0]?.result) {
        setHasSelection(true)
      }
    } catch (error) {
      console.error('Error checking selection:', error)
    }
  }

  // Check selection on mount
  useEffect(() => {
    checkSelection()
    checkStoredSelection()
  }, [])

  // Check if there's a stored selection from context menu
  const checkStoredSelection = async () => {
    try {
      if (!isChromeExtension) return

      const stored = await chrome.storage.local.get('clipSelection')
      if (stored.clipSelection) {
        const clipData = stored.clipSelection as { text: string; timestamp: number }
        const { text, timestamp } = clipData

        // Only use if it's recent (within last 5 seconds)
        const age = Date.now() - timestamp
        if (age < 5000) {
          // Clear the stored selection
          await chrome.storage.local.remove('clipSelection')

          // Clip the stored selection
          await clipStoredSelection(text)
        }
      }
    } catch (error) {
      console.error('Error checking stored selection:', error)
    }
  }

  // Clip the stored selection text
  const clipStoredSelection = async (selectedText: string) => {
    setLoading(true)
    setError(null)
    try {
      if (typeof chrome === 'undefined' || !chrome.tabs) {
        throw new Error('Chrome API not available.')
      }

      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })
      const url = tab?.url || ''
      const title = tab?.title || ''

      // Create minimal HTML for the selection
      const wrappedHtml = `
        <!DOCTYPE html>
        <html>
          <head><title>${title}</title></head>
          <body>
            <article><p>${selectedText}</p></article>
          </body>
        </html>
      `

      // Use clipper-core to process the selection
      const result = clip(wrappedHtml, {
        url,
        cleanHtml: true,
      })

      // Override title to indicate it's a selection
      result.metadata.title = `${title} (Selection)`

      setClipResult(result)
      setMarkdown(result.markdown)
    } catch (error) {
      console.error('Error clipping stored selection:', error)
      const errorMsg = (error as Error).message
      setError(errorMsg)
    } finally {
      setLoading(false)
    }
  }

  // Clip selected content only
  const clipSelection = async () => {
    setLoading(true)
    setError(null)
    try {
      if (typeof chrome === 'undefined' || !chrome.tabs || !chrome.scripting) {
        throw new Error('Chrome API not available. Please load this extension in Chrome browser.')
      }

      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })

      if (!tab.id) {
        throw new Error('No active tab found')
      }

      // Get the selected HTML and page URL
      const results = await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: () => {
          const selection = window.getSelection()
          if (!selection || selection.toString().trim().length === 0) {
            return null
          }

          // Get the HTML of the selection
          const range = selection.getRangeAt(0)
          const container = document.createElement('div')
          container.appendChild(range.cloneContents())

          return {
            html: container.innerHTML,
            text: selection.toString(),
            url: window.location.href,
            title: document.title,
          }
        },
      })

      if (!results || !results[0]?.result) {
        throw new Error('No text selected on the page')
      }

      const { html, text, url, title } = results[0].result

      // For selection, we can either use the HTML directly or just convert the text
      // Let's wrap it in a minimal HTML structure for better processing
      const wrappedHtml = `
        <!DOCTYPE html>
        <html>
          <head><title>${title}</title></head>
          <body>
            <article>${html || `<p>${text}</p>`}</article>
          </body>
        </html>
      `

      // Use clipper-core to process the selection
      const result = clip(wrappedHtml, {
        url,
        cleanHtml: true,
      })

      // Override title to indicate it's a selection
      result.metadata.title = `${title} (Selection)`

      setClipResult(result)
      setMarkdown(result.markdown)
    } catch (error) {
      console.error('Error clipping selection:', error)
      const errorMsg = (error as Error).message
      setError(errorMsg)
    } finally {
      setLoading(false)
    }
  }

  // Clip current page content
  const clipPage = async () => {
    setLoading(true)
    setError(null)
    try {
      // Check if Chrome API is available
      if (typeof chrome === 'undefined' || !chrome.tabs || !chrome.scripting) {
        throw new Error('Chrome API not available. Please load this extension in Chrome browser.')
      }

      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })

      if (!tab.id) {
        throw new Error('No active tab found')
      }

      // Get the page HTML and URL
      const results = await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: () => {
          return {
            html: document.documentElement.outerHTML,
            url: window.location.href,
          }
        },
      })

      if (!results || !results[0]?.result) {
        throw new Error('Failed to get page content')
      }

      const { html, url } = results[0].result

      // Use clipper-core to process the HTML
      const result = clip(html, {
        url,
        cleanHtml: true,
      })

      setClipResult(result)
      setMarkdown(result.markdown)
    } catch (error) {
      console.error('Error clipping page:', error)
      const errorMsg = (error as Error).message
      setError(errorMsg)
    } finally {
      setLoading(false)
    }
  }

  // Send data to Logseq via URL callback
  const sendToLogseq = () => {
    if (!clipResult) return

    try {
      // Prepare data to send to Logseq
      const payload = {
        markdown,
        metadata: clipResult.metadata,
        url: clipResult.metadata.url,
      }

      // Convert to base64
      const jsonString = JSON.stringify(payload)
      const base64Payload = btoa(encodeURIComponent(jsonString))

      // Construct Logseq URL
      const logseqUrl = `logseq://x-callback-url/invokeCommand?action=plugin.vibe-clipper.models.onReceiveClipperData&payload=${base64Payload}`

      // Open the URL
      window.open(logseqUrl, '_self')
    } catch (error) {
      console.error('Error sending to Logseq:', error)
      setError('Failed to send to Logseq: ' + (error as Error).message)
    }
  }

  return (
      <div class={'container p-4'}
           style={{
             width: '100%',
             height: '100%',
             overflow: 'auto',
             display: 'flex',
             flexDirection: 'column'
           }}>
        <h1 class="title is-4">
          Vibe Clipper
        </h1>

        {!isChromeExtension && (
            <div class="notification is-warning is-light">
              <p class="is-size-7">
                ⚠️ Chrome API not available. Please build and load this as an extension in Chrome browser.
              </p>
            </div>
        )}

        {error && (
            <div class="notification is-danger is-light">
              <button class="delete" onClick={() => setError(null)}></button>
              <p class="is-size-7">{error}</p>
            </div>
        )}

        <div class="block">
          <div class="buttons">
            <button
                class={`button is-primary is-fullwidth ${loading ? 'is-loading' : ''}`}
                onClick={clipPage}
                disabled={loading || !isChromeExtension}
            >
              <span class="icon">
                <FileText size={16} />
              </span>
              <span>{clipResult ? 'Re-clip Page' : 'Clip Page'}</span>
            </button>
          </div>
          <div class="buttons">
            <button
                class={`button is-info is-fullwidth ${loading ? 'is-loading' : ''}`}
                onClick={clipSelection}
                disabled={loading || !isChromeExtension || !hasSelection}
                title={!hasSelection ? 'Please select some text on the page first' : 'Clip only selected content'}
            >
              <span class="icon">
                <TextCursor size={16} />
              </span>
              <span>Clip Selection</span>
            </button>
            {!hasSelection && (
              <p class="help has-text-grey is-size-7">
                Select text on the page to enable this option
              </p>
            )}
          </div>
        </div>

        {clipResult && (
            <div class="block">
              {/* Metadata Info */}
              <div class="box mb-3">
                <h2 class="subtitle is-6 mb-2">Page Info</h2>
                <div class="content is-small">
                  <p class="mb-1"><strong>Title:</strong> {clipResult.metadata.title}</p>
                  <p class="mb-1"><strong>Author:</strong> {clipResult.metadata.author || 'N/A'}</p>
                  <p class="mb-1"><strong>Site:</strong> {clipResult.metadata.site || clipResult.metadata.domain}</p>
                  <p class="mb-1">
                    <strong>URL:</strong>{' '}
                    <a href={clipResult.metadata.url} target="_blank" rel="noopener noreferrer" class="is-size-7">
                      {clipResult.metadata.url}
                    </a>
                  </p>
                  <p class="mb-1"><strong>Word Count:</strong> {clipResult.metadata.wordCount}</p>
                </div>
              </div>

              {/* Markdown Editor */}
              <div class="box">
                <h2 class="subtitle is-6 mb-2">Markdown Content</h2>
                <textarea
                    class="textarea is-family-monospace"
                    style={{
                      fontSize: '12px',
                      minHeight: '300px',
                      maxHeight: '400px',
                    }}
                    value={markdown}
                    onInput={(e) => setMarkdown((e.target as HTMLTextAreaElement).value)}
                    placeholder="Markdown content will appear here..."
                />
                <div class="buttons mt-3">
                  <button
                      class="button is-success"
                      onClick={sendToLogseq}
                  >
                    <span class="icon">
                      <Send size={16} />
                    </span>
                    <span>Send to Logseq</span>
                  </button>
                  <button
                      class="button is-info"
                      onClick={() => {
                        navigator.clipboard.writeText(markdown)
                            .then(() => alert('Copied to clipboard!'))
                            .catch(err => setError('Failed to copy: ' + err))
                      }}
                  >
                    <span class="icon">
                      <Copy size={16} />
                    </span>
                    <span>Copy</span>
                  </button>
                </div>
              </div>
            </div>
        )}
      </div>
  )
}

