import '@logseq/libs'
import { setCurrentClipperData } from './app.tsx'

type ClipPayload = {
  markdown: string
  metadata: Record<string, any>
  url: string
}

// This is the main entry point for your Logseq plugin
logseq.ready(() => {
  console.log('Logseq plugin is ready!')

  // register a toolbar button
  logseq.App.registerUIItem('toolbar', {
    key: 'my-toolbar-button',
    template: `
    <a class="button" data-on-click="onToolbarButtonClick">
      <i class="ti ti-star"></i>
    </a>`
  })

  // inject CSS
  logseq.setMainUIInlineStyle({
    width: '40vw',
    minHeight: '300px',
    maxWidth: '800px',
    maxHeight: '80vh',
    borderRadius: '8px',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
    overflow: 'hidden',
    border: '1px solid #e0e0e0',
    position: 'absolute',
    // right side of the screen
    top: '50px',
    right: '16px',
    left: 'unset',
    backgroundColor: '#fff',
    zIndex: '10',
  })

  // Define the click handler for the toolbar button
  logseq.provideModel({
    onReceiveClipperData: async (data: any) => {
      try {
        // data is base64 encoded JSON string
        const decodedData = decodeURIComponent(atob(data))
        const parsedData = JSON.parse(decodedData) as ClipPayload
        setCurrentClipperData(parsedData)
      } catch (error) {
        console.error('Error processing clipper data:', error)
        return logseq.UI.showMsg('Failed to process clipper data: ' + (error as Error).message, 'error')
      }
    },

    onToolbarButtonClick: async () => {
      logseq.toggleMainUI()
    }
  })

  // Esc close main UI
  document.addEventListener('keydown', async (e) => {
    if (e.key === 'Escape' &&
      document.activeElement?.tagName !== 'INPUT' &&
      document.activeElement?.tagName !== 'TEXTAREA'
    ) {
      logseq.hideMainUI()
    }
  })

  // mount main UI
  import('./app.tsx').then(({ mount }) => {
    mount()
  })

  // Register a command that shows an alert
  return logseq.UI.showMsg('Hello from Logseq plugin!')
}).catch(console.error)