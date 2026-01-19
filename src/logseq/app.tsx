import 'bulma/css/bulma.css'
import './app.css'
import { hookstate, useHookstate } from '@hookstate/core'
import { render } from 'preact'

type ClipperData = {
  markdown: string
  metadata: Record<string, any>
  url: string
}

const appState = hookstate<{ currentClipperData: ClipperData | null }>({
  currentClipperData: null,
})

export function setCurrentClipperData (data: any) {
  appState.currentClipperData.set(data)
  // show main ui
  if (!!data) {
    logseq.showMainUI()
  } else {
    logseq.hideMainUI()
  }
}

export const useAppState = () => useHookstate(appState)

type InsertMode = 'currentBlock' | 'newPage' | 'todayJournal'

function App () {
  const appState = useAppState()
  const customPageName = useHookstate('')
  const insertMode = useHookstate<InsertMode>('currentBlock')

  // if (!appState.currentClipperData.get()) {}

  const handleInsertIntoCurrentBlock = async () => {
    const currentBlock = await logseq.Editor.getCurrentBlock()

    if (!currentBlock) {
      return logseq.UI.showMsg('No current block selected', 'warning')
    }

    const clipData = appState.currentClipperData.get()

    if (!clipData) {
      return logseq.UI.showMsg('No clipper data to insert', 'warning')
    }

    await logseq.Editor.insertBlock(currentBlock.uuid,
        JSON.stringify(clipData, null, 2), {
          sibling: true,
        })

    await logseq.UI.showMsg('Inserted clipper data into current block', 'success')
  }

  const handlerInsertIntoNewPage = async () => {
    const clipData = appState.currentClipperData.get()

    if (!clipData) {
      return logseq.UI.showMsg('No clipper data to insert', 'warning')
    }

    const pageName = customPageName.get().trim() || `Clipped: ${new Date().toLocaleString()}`

    const content = JSON.stringify(clipData, null, 2)
    const page = await logseq.Editor.createPage(pageName)
    if (page) {
      await logseq.Editor.appendBlockInPage(
          pageName, content,
      )
      await logseq.UI.showMsg(`Created new page "${pageName}" with clipper data`, 'success')
      customPageName.set('') // Clear the input after successful creation
    }
  }

  const handlerInsertIntoTodayJournal = async () => {
    const clipData = appState.currentClipperData.get()

    if (!clipData) {
      return logseq.UI.showMsg('No clipper data to insert', 'warning')
    }

    // @ts-ignore
    const journalPage = await logseq.Editor.getTodayPage()

    if (journalPage) {
      const content = JSON.stringify(clipData, null, 2)
      await logseq.Editor.appendBlockInPage(
          journalPage.name, content,
      )
      await logseq.UI.showMsg(`Inserted clipper data into today's journal`, 'success')
    } else {
      await logseq.UI.showMsg('Could not find today\'s journal page', 'error')
    }
  }

  const handleConfirm = async () => {
    const mode = insertMode.get()

    switch (mode) {
      case 'currentBlock':
        await handleInsertIntoCurrentBlock()
        break
      case 'newPage':
        await handlerInsertIntoNewPage()
        break
      case 'todayJournal':
        await handlerInsertIntoTodayJournal()
        break
    }
  }

  return (
      <div class={'app-wrap is-relative p-4'}>
        {/* close main ui */}
        <button
            class={'delete'}
            onClick={() => {
              logseq.hideMainUI()
            }}
        ></button>
        <div className={'container p-4'}>
          <h1 class={'is-size-3'}>Logseq Clipper Plugin</h1>
          {appState.currentClipperData.get() ? (
              <div>
                <h2>Clipped Data:</h2>
                <pre>{JSON.stringify(appState.currentClipperData.get(), null, 2)}</pre>
              </div>
          ) : (
              <p>No clipper data received yet.</p>
          )}

          <div class={'py-4'}>
            {/* Insert Mode Selection */}
            <div class={'field has-addons'}>
              <div class={'control'}>
                <div class={'select'}>
                  <select
                      value={insertMode.get()}
                      onChange={(e) => insertMode.set((e.target as HTMLSelectElement).value as InsertMode)}
                  >
                    <option value="currentBlock">Insert into Current Block</option>
                    <option value="newPage">Insert into New Page</option>
                    <option value="todayJournal">Insert into Today's Journal</option>
                  </select>
                </div>
              </div>
              <div class={'control'}>
                <button
                    class={'button is-primary'}
                    onClick={handleConfirm}
                >
                  Confirm Insertion
                </button>
              </div>
            </div>

            {/* Custom page name input - only show when newPage mode is selected */}
            {insertMode.get() === 'newPage' && (
                <div class={'field mt-3'}>todayPageName
                  <label class={'label is-small'}>Custom Page Name (optional):</label>
                  <div class={'control'}>
                    <input
                        class={'input'}
                        type={'text'}
                        placeholder={'Leave empty for auto-generated name'}
                        value={customPageName.get()}
                        onInput={(e) => customPageName.set((e.target as HTMLInputElement).value)}
                    />
                  </div>
                  <p class={'help'}>
                    If empty, page name will be: "Clipped: {new Date().toLocaleString()}"
                  </p>
                </div>
            )}
          </div>
        </div>
      </div>
  )
}

export function mount () {
  // mount with preact
  render(<App/>, document.getElementById('app')!)
}