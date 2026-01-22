/// <reference types="chrome"/>

// Create context menu when extension is installed
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: 'clipSelection',
    title: 'Clip Selection',
    contexts: ['selection']
  })

  chrome.contextMenus.create({
    id: 'sendToLogseq',
    title: 'Send to Logseq',
    contexts: ['selection']
  })
})

// Handle context menu clicks
chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === 'clipSelection' && info.selectionText && tab?.id) {
    clipSelection(info.selectionText, tab.id)
  } else if (info.menuItemId === 'sendToLogseq' && info.selectionText) {
    sendSelectionToLogseq(info.selectionText, tab?.url || '')
  }
})

// Function to clip selection and open popup
async function clipSelection(selectedText: string, _tabId: number) {
  try {
    // Store the selected text in chrome.storage so popup can access it
    await chrome.storage.local.set({
      clipSelection: {
        text: selectedText,
        timestamp: Date.now()
      }
    })

    // Open the popup by triggering the action
    // Note: We can't directly open popup programmatically in MV3,
    // but we can use chrome.action.openPopup() if available
    if (chrome.action && chrome.action.openPopup) {
      chrome.action.openPopup()
    } else {
      // Fallback: show notification to user to click the extension icon
      chrome.notifications?.create({
        type: 'basic',
        iconUrl: 'icon.png',
        title: 'Vibe Clipper',
        message: 'Selection saved! Click the extension icon to continue.'
      })
    }
  } catch (error) {
    console.error('Error clipping selection:', error)
    chrome.notifications?.create({
      type: 'basic',
      iconUrl: 'icon.png',
      title: 'Vibe Clipper Error',
      message: 'Failed to clip selection'
    })
  }
}

// Function to send selected text to Logseq
function sendSelectionToLogseq(selectedText: string, pageUrl: string) {
  try {
    // Prepare data to send to Logseq
    const payload = {
      markdown: selectedText,
      metadata: {
        url: pageUrl,
        title: '', // We don't have the page title in this context
        selectedText: true
      },
      url: pageUrl,
    }

    // Convert to base64
    const jsonString = JSON.stringify(payload)
    const base64Payload = btoa(encodeURIComponent(jsonString))

    // Construct Logseq URL
    const logseqUrl = `logseq://x-callback-url/invokeCommand?action=plugin.vibe-clipper.models.onReceiveClipperData&payload=${base64Payload}`

    // Open the URL in a new tab (which will trigger Logseq)
    chrome.tabs.create({ url: logseqUrl, active: false }, (tab) => {
      // Close the tab immediately after opening (Logseq will handle the callback)
      if (tab && tab.id) {
        setTimeout(() => {
          chrome.tabs.remove(tab.id!)
        }, 100)
      }
    })

    // Show notification to user
    chrome.notifications?.create({
      type: 'basic',
      iconUrl: 'icon.png',
      title: 'Vibe Clipper',
      message: 'Selection sent to Logseq!'
    })
  } catch (error) {
    console.error('Error sending to Logseq:', error)
    chrome.notifications?.create({
      type: 'basic',
      iconUrl: 'icon.png',
      title: 'Vibe Clipper Error',
      message: 'Failed to send selection to Logseq'
    })
  }
}
