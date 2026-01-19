// render PopupUI in popup.html
import { render } from 'preact'
import { PopupUI } from './ui'
import { useEffect } from 'preact/hooks'

const STORAGE_KEY = 'vibeClipper_popupSize'
const DEFAULT_WIDTH = 300
const DEFAULT_HEIGHT = 700

function PopupApp () {
  useEffect(() => {
    // Load saved dimensions
    const savedSize = localStorage.getItem(STORAGE_KEY)
    let width = DEFAULT_WIDTH
    let height = DEFAULT_HEIGHT

    if (savedSize) {
      try {
        const { width: w, height: h } = JSON.parse(savedSize)
        width = w
        height = h
      } catch (e) {
        console.error('Failed to parse saved size:', e)
      }
    }

    // Set initial size
    document.body.style.width = `${width}px`
    document.body.style.height = `${height}px`

    // Add resize handle
    const resizeHandle = document.createElement('div')
    resizeHandle.className = 'resize-handle'
    document.body.appendChild(resizeHandle)

    let isResizing = false
    let startX = 0
    let startY = 0
    let startWidth = 0
    let startHeight = 0

    const onMouseDown = (e: MouseEvent) => {
      isResizing = true
      startX = e.clientX
      startY = e.clientY
      startWidth = document.body.offsetWidth
      startHeight = document.body.offsetHeight
      e.preventDefault()
    }

    const onMouseMove = (e: MouseEvent) => {
      if (!isResizing) return

      const deltaX = e.clientX - startX
      const deltaY = e.clientY - startY

      const newWidth = Math.max(380, startWidth + deltaX)
      const newHeight = Math.max(400, startHeight + deltaY)

      document.body.style.width = `${newWidth}px`
      document.body.style.height = `${newHeight}px`
    }

    const onMouseUp = () => {
      if (isResizing) {
        isResizing = false
        // Save the new size
        const size = {
          width: document.body.offsetWidth,
          height: document.body.offsetHeight,
        }
        localStorage.setItem(STORAGE_KEY, JSON.stringify(size))
      }
    }

    resizeHandle.addEventListener('mousedown', onMouseDown)
    document.addEventListener('mousemove', onMouseMove)
    document.addEventListener('mouseup', onMouseUp)

    return () => {
      resizeHandle.removeEventListener('mousedown', onMouseDown)
      document.removeEventListener('mousemove', onMouseMove)
      document.removeEventListener('mouseup', onMouseUp)
      if (resizeHandle.parentNode) {
        resizeHandle.parentNode.removeChild(resizeHandle)
      }
    }
  }, [])

  return <PopupUI/>
}

const rootElement = document.getElementById('popup-app')

if (rootElement) {
  render(<PopupApp/>, rootElement)
}
