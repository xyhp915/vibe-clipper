# Chrome Extension

This directory contains the Chrome browser extension for Vibe Clipper.

## Structure

- `manifest.json` - Chrome extension manifest file (version 3)
- `popup.html` - The popup UI HTML template
- `popup.tsx` - The popup entry point that renders the Preact UI
- `ui.tsx` - The PopupUI Preact component

## Features

### Page Meta Extraction
The extension can extract page metadata from the current tab including:
- Page title and URL
- Meta description
- Author information
- Keywords
- Open Graph metadata (og:title, og:description, og:image)
- Article timestamps (published/modified time)

The extracted data is displayed as JSON and can be copied to clipboard.

## Development

Run the development server:
```bash
npm run dev:chrome
```

## Build

Build the Chrome extension:
```bash
npm run build:chrome
```

The build output will be in `dist/chrome/` directory.

## Architecture

- Uses **Preact** for UI rendering
- Uses **Bulma CSS** for styling
- The popup renders `PopupUI` component from `ui.tsx`
- Entry point is `popup.tsx` which mounts the Preact app to `#popup-app` div
- Chrome APIs are used to:
  - Query active tabs
  - Execute scripts in page context
  - Extract meta information

## Permissions

The extension requires the following permissions:
- `tabs` - To query active tabs
- `activeTab` - To access the current tab
- `scripting` - To execute scripts for meta extraction
- `<all_urls>` - To work on all websites

## Loading the Extension

1. Build the extension: `npm run build:chrome`
2. Open Chrome and navigate to `chrome://extensions/`
3. Enable "Developer mode"
4. Click "Load unpacked" and select the `dist/chrome/` directory

