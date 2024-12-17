import { createTheme } from '@uiw/codemirror-themes'

export const editorTheme = createTheme({
  theme: 'dark',
  settings: {
    background: '#080f11',
    foreground: '#c8cacb',
    caret: '#E7E7E8',
    selection: '#5B5F61',
    selectionMatch: '#5B5F61',
    gutterBackground: '#141B1D',
    gutterForeground: '#7e8385',
    gutterBorder: '#1C2225',
    lineHighlight: '#1c2225',
  },
  styles: [],
})
