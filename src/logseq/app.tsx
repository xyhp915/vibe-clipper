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

export const useAppState = () => useHookstate(appState)

export function setCurrentClipperData (data: any) {
  appState.currentClipperData.set(data)
  // show main ui
  if (!!data) {
    logseq.showMainUI()
  } else {
    logseq.hideMainUI()
  }
}

async function upsertBlockPropertiesFromMetadata (
    blockUUID: string, metadata: Record<string, any>,
) {
  for (const [key, value] of Object.entries(metadata)) {
    // create property
    await logseq.Editor.upsertProperty(key)
    await logseq.Editor.upsertBlockProperty(blockUUID, key, value)
  }
}

type InsertMode = 'currentBlock' | 'newPage' | 'todayJournal'

function App () {
  const appState = useAppState()
  const customPageName = useHookstate('')
  const insertMode = useHookstate<InsertMode>('currentBlock')
  const clipperDataValue = appState.currentClipperData.get()
  const editableMarkdown = useHookstate(clipperDataValue?.markdown || '')

  // Update editableMarkdown when clipperDataValue changes
  if (clipperDataValue?.markdown && editableMarkdown.get() !== clipperDataValue.markdown) {
    editableMarkdown.set(clipperDataValue.markdown)
  }

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

    const content = editableMarkdown.get()

    await logseq.Editor.insertBlock(currentBlock.uuid, content, { sibling: true })
    await upsertBlockPropertiesFromMetadata(currentBlock.uuid, clipData.metadata)

    return logseq.UI.showMsg('Inserted clipper data into current block', 'success')
  }

  const handlerInsertIntoNewPage = async () => {
    const clipData = appState.currentClipperData.get()

    if (!clipData) {
      return logseq.UI.showMsg('No clipper data to insert', 'warning')
    }

    const pageName = customPageName.get().trim() || `Clipped: ${new Date().toLocaleString()}`

    const content = editableMarkdown.get()
    const page = await logseq.Editor.createPage(pageName)
    if (page) {
      await logseq.Editor.appendBlockInPage(
          pageName, content,
      )
      await upsertBlockPropertiesFromMetadata(page.uuid, clipData.metadata)
      await logseq.UI.showMsg(`Created new page "${pageName}" with clipper data`, 'success')
      customPageName.set('') // Clear the input after successful creation
    }
  }

  const handlerInsertIntoTodayJournal = async () => {
    const clipData = appState.currentClipperData.get()

    if (!clipData) {
      return logseq.UI.showMsg('No clipper data to insert', 'warning')
    }

    const journalPage = await logseq.Editor.getTodayPage()

    if (journalPage) {
      const content = editableMarkdown.get()
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
          {clipperDataValue ? (
              <div>
                <h2 class={'is-size-5 mb-2'}>Clipped Markdown:</h2>
                <div class={'field'}>
                  <div class={'control'}>
                    <textarea
                        class={'textarea'}
                        rows={10}
                        value={editableMarkdown.get()}
                        onInput={(e) => editableMarkdown.set((e.target as HTMLTextAreaElement).value)}
                        placeholder={'Edit your markdown content here...'}
                    />
                  </div>
                </div>
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
                <div class={'field mt-3'}>
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