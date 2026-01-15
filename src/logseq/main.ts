import '@logseq/libs'

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

  // Define the click handler for the toolbar button
  logseq.provideModel({
    onReceiveClipperData: async (data: any) => {
      try {
        // data is base64 encoded JSON string
        const decodedData = decodeURIComponent(atob(data))
        const parsedData = JSON.parse(decodedData) as ClipPayload

        const ret = await logseq.Editor.appendBlockInPage(
          (await logseq.Editor.getCurrentPage())?.uuid!,
          parsedData.markdown
        )

        console.log('Appended block:', ret)
        return logseq.UI.showMsg('Clipper data processed successfully!')
      } catch (error) {
        console.error('Error processing clipper data:', error)
        return logseq.UI.showMsg('Failed to process clipper data: ' + (error as Error).message, 'error')
      }
    },

    onToolbarButtonClick: async () => {
      return logseq.UI.showMsg('Toolbar button clicked!')
    }
  })

  // Register a command that shows an alert
  return logseq.UI.showMsg('Hello from Logseq plugin!')
}).catch(console.error)