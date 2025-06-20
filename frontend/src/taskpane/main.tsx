/// <reference types="office-js" />

import { createRoot } from 'react-dom/client'
import '../index.css'
import { WordyApp } from './WordyApp'

Office.onReady((info) => {
  if (info.host === Office.HostType.Word) {
    const root = document.getElementById('root')
    if (root) {
      createRoot(root).render(<WordyApp />)
    }
  }
}) 