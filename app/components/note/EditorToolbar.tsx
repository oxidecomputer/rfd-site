/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, you can obtain one at https://mozilla.org/MPL/2.0/.
 *
 * Copyright Oxide Computer Company
 */
import { Toolbar } from '@liveblocks/react-tiptap'
import { AddRoundel12Icon } from '@oxide/design-system/icons/react'
import * as Dropdown from '@radix-ui/react-dropdown-menu'
import { type Editor } from '@tiptap/react'
import cn from 'classnames'
import { type ReactNode } from 'react'

import Icon from '../Icon'

const buttonBaseClasses =
  'flex h-8 items-center justify-center rounded border px-2 text-secondary text-mono-sm bg-default border-secondary elevation-1'
const buttonClasses = `${buttonBaseClasses} bg-secondary hover:bg-hover`
const buttonActiveClasses = `${buttonBaseClasses} bg-hover`
const menuItemClasses =
  'menu-item relative cursor-pointer border-b p-2 text-sans-md text-default border-secondary hover:bg-hover focus:outline-0 focus:bg-hover'
const menuContentClasses =
  'menu overlay-shadow z-30 min-w-[12rem] rounded border bg-raise border-secondary [&>*:last-child]:border-b-0'

interface ToolbarButtonProps {
  children: ReactNode
  label: string
  onClick: () => void
  shortcut?: string
  disabled?: boolean
}

type BlockType =
  | 'code'
  | 'quote'
  | 'table'
  | 'note'
  | 'tip'
  | 'important'
  | 'warning'
  | 'caution'

type HeadingLevel = 2 | 3 | 4

interface EditorSelectionRange {
  from: number
  to: number
}

const withEditorAction = (
  editor: Editor,
  action: (chain: ReturnType<Editor['chain']>) => void,
) => {
  const chain = editor.chain().focus()
  action(chain)
  chain.run()
}

const withEditorSelection = (
  editor: Editor,
  range: EditorSelectionRange,
  content: string,
  newSelection?: EditorSelectionRange,
) => {
  withEditorAction(editor, (chain) => {
    chain.setTextSelection(range).insertContent(content)
    if (newSelection) {
      chain.setTextSelection(newSelection)
    }
  })
}

const toggleSyntax = (editor: Editor, prefix: string, suffix: string = prefix) => {
  // Get the current position/selection
  let from = editor.state.selection.from
  let to = editor.state.selection.to
  const doc = editor.state.doc
  const $from = doc.resolve(from)

  if (editor.state.selection.empty) {
    // If cursor is within a word, expand selection to word boundaries
    if (
      /\w/.test(doc.textBetween(Math.max(0, from - 1), from)) ||
      /\w/.test(doc.textBetween(from, Math.min(doc.content.size, from + 1)))
    ) {
      // Find word boundaries
      while (from > $from.start() && /\w/.test(doc.textBetween(from - 1, from))) {
        from--
      }
      to = from
      while (to < $from.end() && /\w/.test(doc.textBetween(to, to + 1))) {
        to++
      }
    } else {
      // If not in a word, insert placeholder
      editor
        .chain()
        .focus()
        .insertContent(`${prefix}text${suffix}`)
        .setTextSelection({ from: from + prefix.length, to: from + prefix.length + 4 })
        .run()
      return
    }
  } else {
    // If there's a selection, expand it to word boundaries
    const $to = doc.resolve(to)
    while (from > $from.start() && /\w/.test(doc.textBetween(from - 1, from))) {
      from--
    }
    while (to < $to.end() && /\w/.test(doc.textBetween(to, to + 1))) {
      to++
    }
  }

  const selectedText = editor.state.doc.textBetween(from, to, '\n', ' ')
  const beforeText = editor.state.doc.textBetween(
    Math.max(0, from - prefix.length),
    from,
    '\n',
    ' ',
  )
  const afterText = editor.state.doc.textBetween(
    to,
    Math.min(editor.state.doc.content.size, to + suffix.length),
    '\n',
    ' ',
  )

  // Check if the text is wrapped in syntax markers
  const isWrappedExact = selectedText.startsWith(prefix) && selectedText.endsWith(suffix)
  const isWrappedOutside = beforeText === prefix && afterText === suffix

  if (isWrappedExact) {
    // Remove syntax from selected text
    editor
      .chain()
      .focus()
      .setTextSelection({ from, to })
      .insertContent(selectedText.slice(prefix.length, -suffix.length))
      .setTextSelection({
        from,
        to: to - prefix.length - suffix.length,
      })
      .run()
  } else if (isWrappedOutside) {
    // Remove syntax from surrounding text
    editor
      .chain()
      .focus()
      .setTextSelection({ from: from - prefix.length, to: to + suffix.length })
      .insertContent(selectedText)
      .setTextSelection({ from: from - prefix.length, to: to - prefix.length })
      .run()
  } else {
    // Add syntax
    editor
      .chain()
      .focus()
      .setTextSelection({ from, to })
      .insertContent(`${prefix}${selectedText}${suffix}`)
      .setTextSelection({ from: from + prefix.length, to: to + prefix.length })
      .run()
  }
}

const insertLink = (editor: Editor) => {
  const from = editor.state.selection.from
  const to = editor.state.selection.to
  const text = editor.state.selection.empty
    ? 'link text'
    : editor.state.doc.textBetween(from, to, '\n', ' ')

  editor
    .chain()
    .focus()
    .deleteSelection()
    .insertContent(`link:url[${text}]`)
    .setTextSelection({ from: from + 5, to: from + 8 })
    .run()
}

const isSyntaxActive = (
  editor: Editor,
  prefix: string,
  suffix: string = prefix,
): boolean => {
  if (editor.state.selection.empty) {
    return false
  }

  const from = editor.state.selection.from
  const to = editor.state.selection.to
  const selectedText = editor.state.doc.textBetween(from, to, '\n', ' ')
  const beforeText = editor.state.doc.textBetween(
    Math.max(0, from - prefix.length),
    from,
    '\n',
    ' ',
  )
  const afterText = editor.state.doc.textBetween(
    to,
    Math.min(editor.state.doc.content.size, to + suffix.length),
    '\n',
    ' ',
  )

  return (
    (selectedText.startsWith(prefix) && selectedText.endsWith(suffix)) ||
    (beforeText === prefix && afterText === suffix)
  )
}

const BubbleButton = ({
  children,
  label,
  onClick,
  isActive,
}: ToolbarButtonProps & { isActive?: boolean }) => (
  <button
    onClick={onClick}
    className={isActive ? buttonActiveClasses : buttonClasses}
    title={label}
    type="button"
  >
    {children}
  </button>
)

const MenuItem = ({ onClick, children }: { onClick: () => void; children: ReactNode }) => (
  <Dropdown.Item onSelect={onClick} className={menuItemClasses}>
    {children}
  </Dropdown.Item>
)

export const ToolbarButton = ({ children, label, onClick }: ToolbarButtonProps) => (
  <Toolbar.Button name={label} onClick={onClick} className={buttonClasses} type="button">
    {children}
  </Toolbar.Button>
)

export const ToolbarToggle = ({
  children,
  label,
  onClick,
  isActive,
  shortcut,
  disabled,
}: ToolbarButtonProps & { isActive: boolean }) => (
  <Toolbar.Toggle
    name={label}
    onClick={onClick}
    className={buttonClasses}
    active={isActive}
    type="button"
    shortcut={shortcut}
    disabled={disabled}
  >
    {children}
  </Toolbar.Toggle>
)

const EditorToolbar = ({ editor }: { editor: Editor | null }) => {
  if (!editor) return null

  const getTextContent = (from: number, to: number): string => {
    return editor.state.doc.textBetween(from, to, '\n', ' ')
  }

  const insertBlock = (type: BlockType) => {
    const $from = editor.state.selection.$from
    const blockStart = $from.start()
    const blockEnd = $from.end()
    const blockText = getTextContent(blockStart, blockEnd)
    const range = { from: blockStart, to: blockEnd }

    switch (type) {
      case 'code':
        withEditorSelection(editor, range, '----\n' + blockText + '\n----')
        break
      case 'quote':
        withEditorSelection(
          editor,
          range,
          blockText
            .split('\n')
            .map((line) => `> ${line}`)
            .join('\n'),
        )
        break
      case 'table':
        withEditorAction(editor, (chain) => {
          chain
            .splitBlock()
            .insertContent(
              '|===\n|Header 1 |Header 2 |Header 3\n\n|Cell 1.1 |Cell 1.2 |Cell 1.3\n|Cell 2.1 |Cell 2.2 |Cell 2.3\n|===',
            )
        })
        break
      default:
        withEditorSelection(editor, range, `${type.toUpperCase()}: ${blockText}`)
        break
    }
  }

  const insertHeading = (level: HeadingLevel) => {
    const prefix = '='.repeat(level) + ' '
    const from = editor.state.selection.from
    const to = editor.state.selection.to
    const $from = editor.state.selection.$from
    const textBlock = $from.parent

    // Get the block boundaries
    const blockStart = $from.start()
    const blockEnd = $from.end()
    const blockText = getTextContent(blockStart, blockEnd)
    const range = { from: blockStart, to: blockEnd }

    // Check if the current block is a heading
    const headingMatch = blockText.match(/^(=+)\s+(.*)$/s)
    if (headingMatch) {
      const currentLevel = headingMatch[1].length
      const headingText = headingMatch[2]

      // If same level, remove heading, if different level, change it
      if (currentLevel === level) {
        // Remove heading syntax but keep selection
        withEditorSelection(editor, range, headingText, {
          from: Math.max(blockStart, from - currentLevel - 1),
          to: Math.max(blockStart, to - currentLevel - 1),
        })
      } else {
        // Change heading level but keep selection
        withEditorSelection(editor, range, prefix + headingText, {
          from: Math.max(blockStart + level + 1, from + (level - currentLevel)),
          to: Math.max(blockStart + level + 1, to + (level - currentLevel)),
        })
      }
      return
    }

    // Not a heading, convert to one
    if (!editor.state.selection.empty) {
      const selectedText = getTextContent(from, to)
      withEditorSelection(editor, range, prefix + selectedText, {
        from: blockStart + prefix.length,
        to: blockStart + prefix.length + selectedText.length,
      })
      return
    }

    // No selection and not a heading, convert whole block or insert new heading
    if (textBlock.textContent) {
      withEditorSelection(editor, range, prefix + blockText, {
        from: from + prefix.length,
        to: from + prefix.length,
      })
      return
    }

    // Empty block, just insert prefix
    withEditorSelection(editor, { from, to: from }, prefix, {
      from: from + prefix.length,
      to: from + prefix.length,
    })
  }

  const isHeadingActive = (level: HeadingLevel): boolean => {
    if (!editor.state.selection.empty) {
      return false
    }

    const $from = editor.state.selection.$from
    const textBlock = $from.parent
    if (!textBlock.textContent) {
      return false
    }

    const nodeText = getTextContent($from.start(), $from.end())
    const headingMatch = nodeText.match(/^(=+)\s+/)
    return Boolean(headingMatch && headingMatch[1].length === level)
  }

  const admonitionTypes: BlockType[] = ['note', 'tip', 'important', 'warning', 'caution']

  return (
    <Toolbar
      editor={editor}
      className="flex h-12 items-center justify-between border-b p-2 bg-default border-secondary elevation-1"
    >
      <div className="flex gap-1">
        <ToolbarButton
          label="Undo"
          onClick={() => editor.chain().focus().undo().run()}
          disabled={!editor.can().chain().focus().undo().run()}
        >
          Undo
        </ToolbarButton>
        <ToolbarButton
          label="Redo"
          onClick={() => editor.chain().focus().redo().run()}
          disabled={!editor.can().chain().focus().redo().run()}
        >
          Redo
        </ToolbarButton>
        <Toolbar.Separator />
        {[2, 3, 4].map((level) => (
          <ToolbarToggle
            key={level}
            label={`Heading ${level}`}
            onClick={() => insertHeading(level as HeadingLevel)}
            isActive={isHeadingActive(level as HeadingLevel)}
          >
            H{level}
          </ToolbarToggle>
        ))}
        <Toolbar.Separator />
        <ToolbarToggle
          label="Bold"
          onClick={() => toggleSyntax(editor, '*')}
          isActive={isSyntaxActive(editor, '*')}
        >
          B
        </ToolbarToggle>
        <ToolbarToggle
          label="Italic"
          onClick={() => toggleSyntax(editor, '_')}
          isActive={isSyntaxActive(editor, '_')}
        >
          I
        </ToolbarToggle>
        <ToolbarButton label="Link" onClick={() => insertLink(editor)}>
          A
        </ToolbarButton>
      </div>
      <Dropdown.Root>
        <Dropdown.Trigger asChild>
          <button className={buttonClasses} title="Insert block">
            <Icon name="add-roundel" size={12} className="text-tertiary" />
          </button>
        </Dropdown.Trigger>
        <Dropdown.Portal>
          <Dropdown.Content align="end" className={`${menuContentClasses} mt-2`}>
            <MenuItem onClick={() => insertBlock('code')}>Code Block</MenuItem>
            <MenuItem onClick={() => insertBlock('quote')}>Block Quote</MenuItem>
            <MenuItem onClick={() => insertBlock('table')}>Table</MenuItem>
            <Dropdown.Sub>
              <Dropdown.SubTrigger
                className={cn(menuItemClasses, 'flex items-center justify-between')}
              >
                Admonition <Icon name="carat-right" size={12} className="text-quaternary" />
              </Dropdown.SubTrigger>
              <Dropdown.Portal>
                <Dropdown.SubContent className={`${menuContentClasses} ml-2`}>
                  {admonitionTypes.map((type) => (
                    <MenuItem key={type} onClick={() => insertBlock(type)}>
                      {type.charAt(0).toUpperCase() + type.slice(1)}
                    </MenuItem>
                  ))}
                </Dropdown.SubContent>
              </Dropdown.Portal>
            </Dropdown.Sub>
          </Dropdown.Content>
        </Dropdown.Portal>
      </Dropdown.Root>
    </Toolbar>
  )
}

export default EditorToolbar
