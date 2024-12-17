/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, you can obtain one at https://mozilla.org/MPL/2.0/.
 *
 * Copyright Oxide Computer Company
 */
import { useDialogStore, type DialogStore } from '@ariakit/react'
import { EditorView } from '@codemirror/view'
import Asciidoc, { asciidoctor } from '@oxide/react-asciidoc'
import * as Dropdown from '@radix-ui/react-dropdown-menu'
import { useFetcher, useLoaderData } from '@remix-run/react'
import CodeMirror, { type ReactCodeMirrorRef } from '@uiw/react-codemirror'
import cn from 'classnames'
import dayjs from 'dayjs'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import { opts } from '~/components/AsciidocBlocks'
import { DropdownItem, DropdownLink, DropdownMenu } from '~/components/Dropdown'
import Icon from '~/components/Icon'
import { editorTheme } from '~/components/note/EditorTheme'
import { useDebounce } from '~/hooks/use-debounce'
import { useRootLoaderData } from '~/root'

import { MinimalDocument } from '../AsciidocBlocks/MinimalDocument'
import Modal from '../Modal'
import Spinner from '../Spinner'
import { TextInput } from '../TextInput'
import { SidebarIcon } from './Sidebar'

const ad = asciidoctor()

type EditorStatus = 'idle' | 'unsaved' | 'saving' | 'saved' | 'error'

export const NoteForm = ({
  initialTitle = '',
  initialBody = '',
  updated,
  published,
  onSave,
  fetcher,
  sidebarOpen,
  setSidebarOpen,
}: {
  initialTitle?: string
  initialBody?: string
  updated: string
  published: 1 | 0
  onSave: (title: string, body: string) => void
  fetcher: any
  sidebarOpen: boolean
  setSidebarOpen: (bool: boolean) => void
}) => {
  const [status, setStatus] = useState<EditorStatus>('idle')
  const [body, setBody] = useState(initialBody)
  const [title, setTitle] = useState(initialTitle)
  const inputRef = useRef<ReactCodeMirrorRef>(null)

  const debouncedBody = useDebounce(body, 750)
  const debouncedTitle = useDebounce(title, 750)

  const createRfdDialog = useDialogStore()

  useEffect(() => {
    const hasChanges = body !== initialBody || title !== initialTitle

    const hasError = fetcher.data?.status === 'error'

    if (hasError && status !== 'error') {
      setStatus('error')
    }

    const isSaving = fetcher.state === 'submitting'
    const isSaved = fetcher.state === 'idle' && status === 'saving'

    if (!hasChanges && (isSaving || isSaved)) {
      if (isSaving) {
        setStatus('saving')
      } else if (isSaved) {
        setStatus('saved')
      }
    }

    if (debouncedBody === body && debouncedTitle === title && status === 'unsaved') {
      onSave(title, body)
      setStatus('saving')
    }
  }, [
    body,
    title,
    initialBody,
    initialTitle,
    debouncedBody,
    debouncedTitle,
    fetcher,
    status,
    onSave,
  ])

  // Handle window resizing
  const [leftPaneWidth, setLeftPaneWidth] = useState(50) // Initial width in percentage

  const handleMouseDown = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      e.preventDefault()
      const startX = e.clientX
      const startWidth = leftPaneWidth

      const handleMouseMove = (moveEvent: MouseEvent) => {
        const dx = moveEvent.clientX - startX
        const newWidth =
          (((startWidth / 100) * window.innerWidth + dx) * 100) / window.innerWidth
        setLeftPaneWidth(Math.max(20, Math.min(80, newWidth)))
      }

      const handleMouseUp = () => {
        document.removeEventListener('mousemove', handleMouseMove)
        document.removeEventListener('mouseup', handleMouseUp)
      }

      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
    },
    [leftPaneWidth],
  )

  const doc = useMemo(() => {
    return ad.load(body, {
      standalone: true,
      sourcemap: true,
      attributes: {
        sectnums: false,
      },
    })
  }, [body])

  return (
    <>
      <fetcher.Form method="post" action="/notes/edit">
        <div className="flex h-[60px] w-full items-center justify-between border-b px-6 border-b-secondary">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="-m-2 -mr-1 rounded p-2 hover:bg-hover"
              type="button"
            >
              <SidebarIcon />
            </button>
            <div className="relative w-[min-content] min-w-[1em] rounded px-2 py-1 hover:ring-1 hover:ring-default">
              <span className="invisible whitespace-pre text-sans-xl ">
                {title ? title : 'Title...'}
              </span>
              <input
                value={title}
                onChange={(el) => {
                  setStatus('unsaved')
                  setTitle(el.target.value)
                }}
                name="title"
                placeholder="Title..."
                required
                className="absolute left-1 w-full bg-transparent p-0 text-sans-xl text-default placeholder:text-quaternary focus:outline-none"
              />
            </div>

            <MoreDropdown dialog={createRfdDialog} />

            {fetcher.data?.status === 'error' && (
              <div className="text-sans-md text-error">{fetcher.data.error}</div>
            )}
          </div>

          <SavingIndicator status={status} updated={updated} />
        </div>
        <div className="flex h-[calc(100vh-60px)] flex-grow overflow-hidden">
          <div
            id="code_mirror_wrapper"
            style={{ width: `${leftPaneWidth}%` }} // Apply dynamic width here
            className="h-full cursor-text overflow-scroll"
            onClick={(el) => {
              if ((el.target as HTMLElement).id === 'code_mirror_wrapper') {
                inputRef.current &&
                  inputRef.current.editor &&
                  inputRef.current.editor.focus()
              }
            }}
          >
            <input type="hidden" name="body" value={body} />
            <input type="hidden" name="published" value={published} />
            <CodeMirror
              ref={inputRef}
              value={body}
              onChange={(val) => {
                setStatus('unsaved')
                setBody(val)
              }}
              theme={editorTheme}
              className="!normal-case !tracking-normal text-mono-md"
              readOnly={false}
              basicSetup
              autoFocus
              extensions={[EditorView.lineWrapping]}
            />
          </div>
          <div
            onMouseDown={handleMouseDown}
            className="flex w-4 cursor-col-resize items-center bg-transparent"
          >
            <div className="h-full w-px border-r border-secondary" />
          </div>
          <div
            className="h-full overflow-scroll px-4 py-6"
            style={{
              width: `calc(${100 - leftPaneWidth}% - 2px)`,
            }}
          >
            <Asciidoc
              content={doc}
              options={{ ...opts, customDocument: MinimalDocument }}
            />
          </div>
        </div>
      </fetcher.Form>
      <CreateRfdModal
        key={title}
        initialTitle={title !== 'Untitled' ? title : ''}
        dialog={createRfdDialog}
        body={body}
      />
    </>
  )
}

const TypingIndicator = () => (
  <div className="typing-indicator">
    <span></span>
    <span></span>
    <span></span>
  </div>
)

const SavingIndicator = ({
  status,
  updated,
}: {
  status: EditorStatus
  updated: string
}) => {
  return (
    <div className="flex items-center gap-1 text-sans-md text-quaternary">
      {dayjs(updated).format('MMM D YYYY, h:mm A')}
      {status === 'unsaved' ? (
        <TypingIndicator />
      ) : status === 'error' ? (
        <Icon name="error" size={12} className="text-error" />
      ) : status === 'saved' ? (
        <Icon name="success" size={12} className="text-accent" />
      ) : status === 'saving' ? (
        <Spinner />
      ) : (
        <Icon name="success" size={12} className="text-quaternary" />
      )}
    </div>
  )
}

const MoreDropdown = ({ dialog }: { dialog: DialogStore }) => {
  const note = useLoaderData()
  const fetcher = useFetcher()

  const handleDelete = () => {
    if (window.confirm('Are you sure you want to delete this note?')) {
      fetcher.submit(
        { id: note.id },
        {
          method: 'post',
          action: `/notes/${note.id}/delete`,
          encType: 'application/x-www-form-urlencoded',
        },
      )
    }
  }

  const handlePublish = async () => {
    const isPublished = note.published === 1
    const confirmationMessage = isPublished
      ? 'Are you sure you want to unpublish this note?'
      : 'Are you sure you want to publish this note?'

    if (window.confirm(confirmationMessage)) {
      fetcher.submit(
        { publish: isPublished ? 0 : 1 },
        {
          method: 'post',
          action: `/notes/${note.id}/publish`,
          encType: 'application/json',
        },
      )
    }
  }

  return (
    <Dropdown.Root modal={false}>
      <Dropdown.Trigger className="rounded border p-2 align-[3px] border-default hover:bg-hover">
        <Icon name="more" size={12} className="text-secondary" />
      </Dropdown.Trigger>

      <DropdownMenu>
        <DropdownLink to={`/notes/${note.id}`}>View</DropdownLink>
        <DropdownItem onSelect={handlePublish}>
          {note.published ? 'Unpublish' : 'Publish'}
        </DropdownItem>
        <DropdownItem
          onSelect={() => {
            dialog.setOpen(true)
          }}
        >
          Create RFD from note
        </DropdownItem>
        <DropdownItem className="text-error" onSelect={handleDelete}>
          Delete
        </DropdownItem>
      </DropdownMenu>
    </Dropdown.Root>
  )
}

const CreateRfdModal = ({
  initialTitle = '',
  dialog,
  body,
}: {
  initialTitle?: string
  dialog: DialogStore
  body: string
}) => {
  const [title, setTitle] = useState(initialTitle)
  const newRfdNumber = useRootLoaderData().newRfdNumber
  const fetcher = useFetcher()

  const handleSubmit = () => {
    fetcher.submit(
      { title, body },
      {
        method: 'post',
        action: `/notes/create-rfd`,
        encType: 'application/json',
      },
    )
  }

  const formDisabled = fetcher.state !== 'idle'

  return (
    <Modal
      dialogStore={dialog}
      title="Create new RFD"
      onSubmit={handleSubmit}
      disabled={formDisabled}
      isLoading={fetcher.state === 'loading' || fetcher.state === 'submitting'}
    >
      <fetcher.Form className="space-y-4">
        <TextInput
          name="title"
          placeholder="RFD title"
          value={title}
          onChange={(el) => setTitle(el.target.value)}
          disabled={formDisabled}
        />

        <pre
          className={cn(
            'relative max-h-[200px] select-none overflow-hidden rounded-lg border p-4',
            formDisabled
              ? 'text-quaternary bg-disabled border-default'
              : 'bg-default border-secondary',
          )}
        >
          {`:state: prediscussion 
:discussion:
:authors:

`}
          = RFD {newRfdNumber} {title ? title : '{title}'}
          {`

`}
          {body}
          <div
            className="absolute left-0 bottom-0 h-[100px] w-full"
            style={{
              background: `linear-gradient(0, ${
                formDisabled ? 'var(--surface-disabled)' : 'var(--surface-default)'
              } 0%, rgba(8, 15, 17, 0) 100%)`,
            }}
          />
        </pre>
        {fetcher.type === 'done' && !fetcher.data.ok && fetcher.data.message && (
          <div className="my-2 text-sans-lg text-error-secondary ">
            {fetcher.data.message}
          </div>
        )}
      </fetcher.Form>
    </Modal>
  )
}
