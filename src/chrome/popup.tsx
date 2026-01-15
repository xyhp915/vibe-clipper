// render PopupUI in popup.html
import { render } from 'preact'
import { PopupUI } from './ui'

const rootElement = document.getElementById('popup-app')

if (rootElement) {
  render(<PopupUI/>, rootElement)
}
