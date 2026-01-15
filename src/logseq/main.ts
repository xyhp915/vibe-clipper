import '@logseq/libs'

// This is the main entry point for your Logseq plugin
logseq.ready(() => {
  console.log('Logseq plugin is ready!')

  // Register a command that shows an alert
  return logseq.UI.showMsg('Hello from Logseq plugin!')
}).catch(console.error)