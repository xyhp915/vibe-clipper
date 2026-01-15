import '@logseq/libs'

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
    onReceiveClipperData: async (data: any, ex: any) => {
      return logseq.UI.showMsg(`JSON Data: ${JSON.stringify(data)} \n\n Extra: ${JSON.stringify(ex)}`)
    },

    onToolbarButtonClick: async () => {
      return logseq.UI.showMsg('Toolbar button clicked!')
    }
  })

  // Register a command that shows an alert
  return logseq.UI.showMsg('Hello from Logseq plugin!')
}).catch(console.error)