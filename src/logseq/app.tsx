import 'bulma/css/bulma.css'
import './app.css'
import { hookstate, useHookstate } from '@hookstate/core'
import { render } from 'preact'
import { useEffect } from 'preact/hooks'

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
    if (!value) continue

    // create property
    await logseq.Editor.upsertProperty(key)
    await logseq.Editor.upsertBlockProperty(blockUUID, key, value)
  }
}

type InsertMode = 'currentBlock' | 'newPage' | 'todayJournal'

type BlockType =
    | 'heading'
    | 'paragraph'
    | 'quote'
    | 'code'
    | 'table'
    | 'list'
    | 'listItem'

interface Block {
  type: BlockType
  content: string
  level?: number  // For headings (1-6)
  language?: string  // For code blocks
  children?: Block[]
}

/**
 * Parse markdown content into a hierarchical block structure
 * Headings create parent-child relationships based on their levels
 */
function parseMarkdownToBlocks (markdown: string): Block[] {
  const lines = markdown.split('\n')
  const rootBlocks: Block[] = []
  const headingStack: { block: Block; level: number }[] = []

  let i = 0
  while (i < lines.length) {
    const line = lines[i]
    const trimmedLine = line.trim()

    // Skip empty lines
    if (!trimmedLine) {
      i++
      continue
    }

    let block: Block | null = null

    // Parse heading
    const headingMatch = trimmedLine.match(/^(#{1,6})\s+(.+)$/)
    if (headingMatch) {
      const level = headingMatch[1].length
      const content = headingMatch[2]
      block = {
        type: 'heading',
        level,
        content,
        children: [],
      }

      // Pop stack until we find a parent with lower level
      while (headingStack.length > 0 && headingStack[headingStack.length - 1].level >= level) {
        headingStack.pop()
      }

      // Add to parent or root
      if (headingStack.length > 0) {
        const parent = headingStack[headingStack.length - 1].block
        parent.children = parent.children || []
        parent.children.push(block)
      } else {
        rootBlocks.push(block)
      }

      // Push to stack
      headingStack.push({ block, level })
      i++
      continue
    }

    // Parse code block (fenced)
    if (trimmedLine.startsWith('```')) {
      const language = trimmedLine.slice(3).trim() || undefined
      const codeLines: string[] = []
      i++ // Move past opening fence

      while (i < lines.length && !lines[i].trim().startsWith('```')) {
        codeLines.push(lines[i])
        i++
      }

      block = {
        type: 'code',
        content: codeLines.join('\n'),
        language,
      }
      i++ // Move past closing fence
    }
    // Parse quote block
    else if (trimmedLine.startsWith('>')) {
      const quoteLines: string[] = []
      while (i < lines.length && lines[i].trim().startsWith('>')) {
        quoteLines.push(lines[i].trim().slice(1).trim())
        i++
      }
      block = {
        type: 'quote',
        content: quoteLines.join('\n'),
      }
    }
    // Parse table
    else if (trimmedLine.includes('|')) {
      const tableLines: string[] = []
      while (i < lines.length && lines[i].trim().includes('|')) {
        tableLines.push(lines[i].trim())
        i++
      }
      block = {
        type: 'table',
        content: tableLines.join('\n'),
      }
    }
    // Parse list items
    else if (/^[-*+]\s/.test(trimmedLine) || /^\d+\.\s/.test(trimmedLine)) {
      const listItems: Block[] = []
      while (i < lines.length) {
        const listLine = lines[i].trim()
        if (/^[-*+]\s/.test(listLine) || /^\d+\.\s/.test(listLine)) {
          const content = listLine.replace(/^[-*+]\s/, '').replace(/^\d+\.\s/, '')
          listItems.push({
            type: 'listItem',
            content,
          })
          i++
        } else if (!listLine) {
          i++
          break
        } else {
          break
        }
      }
      block = {
        type: 'list',
        content: '',
        children: listItems,
      }
    }
    // Parse paragraph (default)
    else {
      const paragraphLines: string[] = []
      while (i < lines.length) {
        const paraLine = lines[i].trim()
        if (!paraLine ||
            paraLine.startsWith('#') ||
            paraLine.startsWith('>') ||
            paraLine.startsWith('```') ||
            paraLine.includes('|') ||
            /^[-*+]\s/.test(paraLine) ||
            /^\d+\.\s/.test(paraLine)) {
          break
        }
        paragraphLines.push(paraLine)
        i++
      }
      if (paragraphLines.length > 0) {
        block = {
          type: 'paragraph',
          content: paragraphLines.join(' '),
        }
      }
    }

    // Add block to appropriate parent
    if (block) {
      if (headingStack.length > 0) {
        const parent = headingStack[headingStack.length - 1].block
        parent.children = parent.children || []
        parent.children.push(block)
      } else {
        rootBlocks.push(block)
      }
    }
  }

  return rootBlocks
}

/**
 * Convert Block to Logseq markdown format
 */
function blockToMarkdown (block: Block): string {
  switch (block.type) {
    case 'heading':
      // Logseq uses ## as block prefix for headings, not markdown headings
      return block.content
    case 'code':
      return block.language
          ? `\`\`\`${block.language}\n${block.content}\n\`\`\``
          : `\`\`\`\n${block.content}\n\`\`\``
    case 'quote':
      return block.content.split('\n').map(line => `${line}`).join('\n')
    case 'table':
      return block.content
    case 'listItem':
      return block.content
    case 'paragraph':
      return block.content
    case 'list':
      return '' // List items will be handled separately
    default:
      return block.content
  }
}

/**
 * Recursively insert blocks into Logseq maintaining hierarchy
 * @param blocks - Array of blocks to insert
 * @param parentBlockUUID - UUID of the parent block (or page name for root level)
 * @param isPageLevel - Whether inserting at page level (true) or as children of a block (false)
 * @returns Array of inserted block UUIDs
 */
async function insertBlocksRecursively (
    blocks: Block[],
    parentBlockUUID: string,
    isPageLevel: boolean = true,
): Promise<string[]> {
  const insertedUUIDs: string[] = []

  for (let i = 0; i < blocks.length; i++) {
    const block = blocks[i]

    // Skip empty list containers
    if (block.type === 'list' && block.children && block.children.length > 0) {
      // For list type, directly insert its children
      const childUUIDs = await insertBlocksRecursively(
          block.children,
          parentBlockUUID,
          isPageLevel && i === 0,
      )
      insertedUUIDs.push(...childUUIDs)
      continue
    }

    const content = blockToMarkdown(block)

    if (!content.trim()) continue

    let insertedBlock

    if (isPageLevel && i === 0) {
      // First block at page level: append to page
      insertedBlock = await logseq.Editor.appendBlockInPage(parentBlockUUID, content)
    } else if (!isPageLevel && i === 0) {
      // First child of a block: insert as child
      insertedBlock = await logseq.Editor.insertBlock(
          parentBlockUUID,
          content,
          { sibling: false },
      )
    } else {
      // Subsequent blocks: insert as siblings of previous block
      const previousBlockUUID = insertedUUIDs[insertedUUIDs.length - 1]
      insertedBlock = await logseq.Editor.insertBlock(
          previousBlockUUID,
          content,
          { sibling: true },
      )
    }

    if (insertedBlock) {
      insertedUUIDs.push(insertedBlock.uuid)

      // Set built-in property
      if (block.type === 'heading' && block.level) {
        await logseq.Editor.upsertBlockProperty(insertedBlock.uuid, ':logseq.property/heading', block.level)
      } else if (block.type === 'quote') {
        await logseq.Editor.addBlockTag(insertedBlock.uuid, ':logseq.class/Quote-block')
      }

      // Recursively insert children (always as children of current block, not page level)
      if (block.children && block.children.length > 0) {
        await insertBlocksRecursively(block.children, insertedBlock.uuid, false)
      }
    }
  }

  return insertedUUIDs
}

function App () {
  const appState = useAppState()
  const insertMode = useHookstate<InsertMode>('currentBlock')
  const clipperDataValue = appState.currentClipperData.get()
  const customPageName = useHookstate('')
  const editableMarkdown = useHookstate(clipperDataValue?.markdown || '')
  const isLoading = useHookstate(false)

  useEffect(() => {
    editableMarkdown.set(clipperDataValue?.markdown || '')
  }, [clipperDataValue?.markdown])

  useEffect(() => {
    // Only prefill from metadata when the user hasn't started typing.
    // Depending on the whole metadata object can cause frequent resets because its reference may change.
    if (!customPageName.get().trim()) {
      customPageName.set(clipperDataValue?.metadata?.title || '')
    }
  }, [clipperDataValue?.metadata?.title])

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
    const blocks = parseMarkdownToBlocks(content)

    // Insert a header block with metadata
    const headerContent = `Clipped from: ${clipData.url} - ${new Date().toLocaleString()} #[[web-clipper]]`
    const headerBlock = await logseq.Editor.insertBlock(currentBlock.uuid, headerContent, { sibling: true })

    if (headerBlock && blocks.length > 0) {
      // Insert parsed blocks as children of the header block
      await insertBlocksRecursively(blocks, headerBlock.uuid, false)
      await upsertBlockPropertiesFromMetadata(headerBlock.uuid, clipData.metadata)
    }

    return logseq.UI.showMsg('Inserted clipper data into current block', 'success')
  }

  const handlerInsertIntoNewPage = async () => {
    const clipData = appState.currentClipperData.get()

    if (!clipData) {
      return logseq.UI.showMsg('No clipper data to insert', 'warning')
    }

    const pageName = customPageName.get().trim() || `Clipped: ${new Date().toLocaleString()}`
    const clipperTag = await logseq.Editor.createTag(`web-clipper`)

    const content = editableMarkdown.get()

    const blocks = parseMarkdownToBlocks(content)

    const page = await logseq.Editor.createPage(pageName)
    if (page) {
      await logseq.Editor.addBlockTag(page.uuid, clipperTag!.uuid)

      // Insert source info block
      await logseq.Editor.appendBlockInPage(
          pageName,
          `Source: ${clipData.url}`,
      )

      // Insert parsed blocks recursively with hierarchy
      if (blocks.length > 0) {
        await insertBlocksRecursively(blocks, pageName, true)
      }

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
      const blocks = parseMarkdownToBlocks(content)

      // Insert header block with source info
      const headerContent = `Clipped from: ${clipData.url} - ${new Date().toLocaleString()} #[[web-clipper]]`
      const headerBlock = await logseq.Editor.appendBlockInPage(journalPage.name, headerContent)

      // Insert parsed blocks as children of header block
      if (headerBlock && blocks.length > 0) {
        await insertBlocksRecursively(blocks, headerBlock.uuid, false)
        await upsertBlockPropertiesFromMetadata(headerBlock.uuid, clipData.metadata)
      }

      await logseq.UI.showMsg(`Inserted clipper data into today's journal`, 'success')
    } else {
      await logseq.UI.showMsg('Could not find today\'s journal page', 'error')
    }
  }

  const handleConfirm = async () => {
    const mode = insertMode.get()

    try {
      isLoading.set(true)

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
      // hide main ui after insertion
      logseq.hideMainUI()
    } catch (error) {
      console.error('Error inserting content:', error)
      await logseq.UI.showMsg('Failed to insert content', 'error')
    } finally {
      isLoading.set(false)
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
          {(<div>
                <h2 class={'is-size-5 mb-2'}>Clipped Markdown:</h2>
                <div class={'field'}>
                  <div class={'control'}>
                    <textarea
                        class={'textarea'}
                        rows={10}
                        value={editableMarkdown.get()}
                        onChange={(e) => {
                          const value = (e.target as HTMLTextAreaElement).value
                          editableMarkdown.set(value)
                        }}
                        placeholder={'Edit your markdown content here...'}
                    />
                  </div>
                </div>
              </div>
          )}

          <div class={'py-4'}>
            {/* Insert Mode Selection */}
            <div class={'field has-addons app-full-select-field'}>
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
                    class={`button is-primary ${isLoading.get() ? 'is-loading' : ''}`}
                    onClick={handleConfirm}
                    disabled={isLoading.get()}
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
                        onInput={(e) => customPageName.set((e.currentTarget as HTMLInputElement).value)}
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

function AppContainer () {
  // Sync height to main UI content
  useEffect(() => {
    const resizeObserver = new ResizeObserver(async () => {
      const height = document.body.scrollHeight
      logseq.setMainUIInlineStyle({
        height: `${height + 8}px`,
      })
    })
    resizeObserver.observe(document.body)
    return () => {
      resizeObserver.disconnect()
    }
  }, [])

  return (
      <App/>
  )
}

export function mount () {
  // mount with preact
  render(<AppContainer/>, document.getElementById('app')!)
}