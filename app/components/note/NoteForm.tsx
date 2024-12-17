/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, you can obtain one at https://mozilla.org/MPL/2.0/.
 *
 * Copyright Oxide Computer Company
 */
import { Spinner } from '@oxide/design-system'
import { Asciidoc, prepareDocument } from '@oxide/react-asciidoc'
import * as Dropdown from '@radix-ui/react-dropdown-menu'
import { useFetcher } from '@remix-run/react'
import dayjs from 'dayjs'
import { useCallback, useEffect, useMemo, useState } from 'react'

import { opts } from '~/components/AsciidocBlocks'
import { DropdownItem, DropdownLink, DropdownMenu } from '~/components/Dropdown'
import Icon from '~/components/Icon'
import { useDebounce } from '~/hooks/use-debounce'
import { ad } from '~/utils/asciidoctor'

import EditorWrapper from './Editor'
import { SidebarIcon } from './Sidebar'

type EditorStatus = 'idle' | 'unsaved' | 'saving' | 'saved' | 'error'

export const NoteForm = ({
  id,
  initialTitle = '',
  initialBody = '',
  updated,
  published,
  onSave,
  fetcher,
  sidebarOpen,
  setSidebarOpen,
}: {
  id: string
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

  const debouncedBody = useDebounce(body, 750)
  const debouncedTitle = useDebounce(title, 750)

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
    return prepareDocument(
      ad.load(body, {
        standalone: true,
      }),
    )
  }, [body])

  return (
    <>
      <fetcher.Form method="post" action="/notes/edit">
        <div className="flex h-14 w-full items-center justify-between border-b px-6 border-b-secondary">
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
                className="absolute left-1 w-full bg-transparent p-0 text-sans-xl text-raise placeholder:text-tertiary focus:outline-none"
              />
            </div>

            <MoreDropdown id={id} published={published} />

            {fetcher.data?.status === 'error' && (
              <div className="text-sans-md text-error">{fetcher.data.error}</div>
            )}
          </div>

          <SavingIndicator status={status} updated={updated} />
        </div>
        <div className="flex h-[calc(100vh-60px)] flex-grow overflow-hidden">
          <div
            style={{ width: `${leftPaneWidth}%` }} // Apply dynamic width here
            className="h-full cursor-text overflow-scroll"
          >
            <input type="hidden" name="body" value={body} />
            <input type="hidden" name="published" value={published} />
            <EditorWrapper
              body={body}
              onChange={(val) => {
                setStatus('unsaved')
                setBody(val)
              }}
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
            <Asciidoc document={doc} options={opts} />
          </div>
        </div>
      </fetcher.Form>
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
    <div className="flex items-center gap-2 text-sans-md text-tertiary">
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
        <Icon name="success" size={12} className="text-tertiary" />
      )}
    </div>
  )
}

const MoreDropdown = ({ id, published }: { id: string; published: 1 | 0 }) => {
  const fetcher = useFetcher()

  const handleDelete = () => {
    if (window.confirm('Are you sure you want to delete this note?')) {
      fetcher.submit(
        { id: id },
        {
          method: 'post',
          action: `/notes/${id}/delete`,
          encType: 'application/x-www-form-urlencoded',
        },
      )
    }
  }

  const handlePublish = async () => {
    const isPublished = published === 1
    const confirmationMessage = isPublished
      ? 'Are you sure you want to unpublish this note?'
      : 'Are you sure you want to publish this note?'

    if (window.confirm(confirmationMessage)) {
      fetcher.submit(
        { publish: isPublished ? 0 : 1 },
        {
          method: 'post',
          action: `/notes/${id}/publish`,
          encType: 'application/json',
        },
      )
    }
  }

  return (
    <Dropdown.Root modal={false}>
      <Dropdown.Trigger className="rounded border p-2 align-[3px] border-default hover:bg-hover">
        <Icon name="more" size={12} className="text-default" />
      </Dropdown.Trigger>

      <DropdownMenu>
        <DropdownLink to={`/notes/${id}`}>View</DropdownLink>
        <DropdownItem onSelect={handlePublish}>
          {published ? 'Unpublish' : 'Publish'}
        </DropdownItem>
        <DropdownItem className="text-error" onSelect={handleDelete}>
          Delete
        </DropdownItem>
      </DropdownMenu>
    </Dropdown.Root>
  )
}
