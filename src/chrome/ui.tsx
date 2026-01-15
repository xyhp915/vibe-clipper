/// <reference types="chrome"/>
import 'bulma/css/bulma.css'
import { useState } from 'preact/hooks'

interface PageMeta {
  title: string
  url: string
  description?: string
  author?: string
  keywords?: string
  ogTitle?: string
  ogDescription?: string
  ogImage?: string
  publishedTime?: string
  modifiedTime?: string
}

export function PopupUI () {
  const [counter, setCounter] = useState(0)
  const [metaData, setMetaData] = useState<PageMeta | null>(null)
  const [loading, setLoading] = useState(false)

  // Check if Chrome API is available
  const isChromeExtension = typeof chrome !== 'undefined' && chrome.tabs && chrome.scripting

  // Extract page meta information from current tab
  const extractPageMeta = async () => {
    setLoading(true)
    try {
      // Check if Chrome API is available
      if (typeof chrome === 'undefined' || !chrome.tabs || !chrome.scripting) {
        throw new Error('Chrome API not available. Please load this extension in Chrome browser.')
      }

      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })

      if (!tab.id) {
        throw new Error('No active tab found')
      }

      // Inject script to extract meta information
      const results = await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: () => {
          const getMeta = (name: string) => {
            const element = document.querySelector(`meta[name="${name}"], meta[property="${name}"]`)
            return element?.getAttribute('content') || undefined
          }

          return {
            title: document.title,
            url: window.location.href,
            description: getMeta('description') || getMeta('og:description'),
            author: getMeta('author'),
            keywords: getMeta('keywords'),
            ogTitle: getMeta('og:title'),
            ogDescription: getMeta('og:description'),
            ogImage: getMeta('og:image'),
            publishedTime: getMeta('article:published_time'),
            modifiedTime: getMeta('article:modified_time')
          }
        }
      })

      if (results && results[0]?.result) {
        setMetaData(results[0].result as PageMeta)
      }
    } catch (error) {
      console.error('Error extracting meta data:', error)
      alert('Failed to extract meta data: ' + (error as Error).message)
    } finally {
      setLoading(false)
    }
  }

  // Copy JSON to clipboard
  const copyToClipboard = () => {
    if (metaData) {
      navigator.clipboard.writeText(JSON.stringify(metaData, null, 2))
        .then(() => alert('Copied to clipboard!'))
        .catch(err => alert('Failed to copy: ' + err))
    }
  }

  return (
    <div class={'container p-4'} style={{ minWidth: '380px', maxWidth: '600px', maxHeight: '600px', overflow: 'auto' }}>
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

      <div class="block">
        <button
          class="button is-primary"
          onClick={() => setCounter(counter + 1)}
        >
          Click Me ({counter})
        </button>
      </div>

      <div class="block">
        <button
          class={`button is-info ${loading ? 'is-loading' : ''}`}
          onClick={extractPageMeta}
          disabled={loading || !isChromeExtension}
        >
          Extract Page Meta Info
        </button>
      </div>

      {metaData && (
        <div class="block">
          <div class="box">
            <h2 class="subtitle is-5">Page Meta Information</h2>
            <pre style={{
              fontSize: '12px',
              maxHeight: '300px',
              overflow: 'auto',
              background: '#f5f5f5',
              padding: '10px',
              borderRadius: '4px'
            }}>
              {JSON.stringify(metaData, null, 2)}
            </pre>
            <button
              class="button is-small is-success mt-2"
              onClick={copyToClipboard}
            >
              Copy JSON
            </button>
          </div>
        </div>
      )}
    </div>
  )
}