/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, you can obtain one at https://mozilla.org/MPL/2.0/.
 *
 * Copyright Oxide Computer Company
 */
import { useMutation, useStorage, useSyncStatus } from '@liveblocks/react/suspense'
import { Spinner } from '@oxide/design-system'
import { Asciidoc, prepareDocument, type Options } from '@oxide/react-asciidoc'
import * as Dropdown from '@radix-ui/react-dropdown-menu'
import { useFetcher } from '@remix-run/react'
import { useQueryClient, type QueryClient } from '@tanstack/react-query'
import dayjs from 'dayjs'
import { useCallback, useMemo, useState, type ChangeEvent } from 'react'

import { opts } from '~/components/AsciidocBlocks'
import { DropdownItem, DropdownMenu } from '~/components/Dropdown'
import Icon from '~/components/Icon'
import { ad } from '~/utils/asciidoctor'

import { MinimalDocument } from '../AsciidocBlocks/Document'
import { Avatars } from './Avatar'
import EditorWrapper from './Editor'
import RoomErrors from './RoomErrors'
import { SidebarIcon } from './Sidebar'

const noteOpts: Options = {
  ...opts,
  customDocument: MinimalDocument,
}

function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number,
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null

  return (...args: Parameters<T>) => {
    if (timeout) {
      clearTimeout(timeout)
    }

    timeout = setTimeout(() => {
      func(...args)
    }, wait)
  }
}

// debouncing the invalidate when the title changes
export const invalidateNotes = debounce((queryClient: QueryClient) => {
  queryClient.invalidateQueries({ queryKey: ['notesList'] })
}, 500)

export const NoteForm = ({
  id,
  isOwner,
  published,
  sidebarOpen,
  setSidebarOpen,
}: {
  id: string
  isOwner: boolean
  published: 'true' | 'false'
  sidebarOpen: boolean
  setSidebarOpen: (bool: boolean) => void
}) => {
  const title = useStorage((root) => root.meta.title)
  const lastUpdated = useStorage((root) => root.meta.lastUpdated)
  const queryClient = useQueryClient()

  const handleChange = useMutation(({ storage }, e: ChangeEvent<HTMLInputElement>) => {
    storage.get('meta').set('title', e.target.value)
    invalidateNotes(queryClient)
  }, [])

  const [body, setBody] = useState('')

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
    const adoc = ad.load(body, {
      standalone: true,
      attributes: {
        sectnums: false,
      },
    })
    adoc.setTitle(title) // use note title as document title
    return prepareDocument(adoc)
  }, [title, body])

  return (
    <div>
      <div className="flex h-14 w-full items-center justify-between border-b px-4 border-b-secondary">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="-m-2 -mr-1 rounded p-2 hover:bg-hover"
            type="button"
          >
            <SidebarIcon />
          </button>
          <div className="relative w-[min-content] min-w-[1em] rounded px-2 py-1 ring-accent-secondary outline-default focus-within:outline focus-within:ring-2 hover:outline">
            <span className="invisible whitespace-pre text-sans-xl ">
              {title ? title : 'Title...'}
            </span>
            <input
              value={title}
              onChange={handleChange}
              name="title"
              placeholder="Title..."
              required
              className="absolute left-1 w-full bg-transparent p-0 text-sans-xl text-raise placeholder:text-tertiary focus:outline-none"
            />
          </div>

          {isOwner && <MoreDropdown id={id} published={published} />}

          {/* todo: Handle errors visibly not just console */}
          <RoomErrors />
        </div>

        <div className="flex items-center gap-2">
          {lastUpdated && (
            <div className="text-sans-md text-tertiary">
              {dayjs(lastUpdated).format('MMM D YYYY, h:mm A')}
            </div>
          )}
          <Avatars />
          <SavingIndicator />
        </div>
      </div>
      <div className="relative flex h-[calc(100vh-60px)] flex-grow overflow-hidden">
        <div
          style={{ width: `${leftPaneWidth}%` }} // Apply dynamic width here
          className="h-full cursor-text"
        >
          <input type="hidden" name="body" value={body} />
          <input type="hidden" name="published" value={published} />
          <EditorWrapper onUpdate={setBody} />
        </div>
        <div
          onMouseDown={handleMouseDown}
          className="flex w-4 cursor-col-resize items-center bg-transparent"
        >
          <div className="h-full w-px border-r border-secondary" />
        </div>
        <div
          className="h-full overflow-scroll px-4 py-6 bg-default"
          style={{
            width: `calc(${100 - leftPaneWidth}% - 2px)`,
          }}
        >
          <h1 className="mb-4 text-sans-3xl">{doc.title}</h1>
          <Asciidoc document={doc} options={noteOpts} />
        </div>
      </div>
    </div>
  )
}

export const TypingIndicator = () => (
  <div className="typing-indicator">
    <span></span>
    <span></span>
    <span></span>
  </div>
)

const SavingIndicator = () => {
  const syncStatus = useSyncStatus({ smooth: true })

  return (
    <div className="flex items-center gap-2 text-sans-md text-tertiary">
      <div>
        {syncStatus === 'synchronized' ? (
          <Icon name="success" size={12} className="text-accent" />
        ) : (
          <Spinner />
        )}
      </div>
    </div>
  )
}

const MoreDropdown = ({ id, published }: { id: string; published: 'true' | 'false' }) => {
  const fetcher = useFetcher()

  const handleDelete = () => {
    if (window.confirm('Are you sure you want to delete this note?')) {
      fetcher.submit(null, {
        method: 'post',
        action: `/notes/${id}/delete`,
      })
    }
  }

  const handlePublish = async () => {
    const isPublished = published === 'true'
    const confirmationMessage = isPublished
      ? 'Are you sure you want to unpublish this note?'
      : 'Are you sure you want to publish this note?'

    if (window.confirm(confirmationMessage)) {
      fetcher.submit(
        { publish: isPublished ? 'false' : 'true' },
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
        <DropdownItem onSelect={handlePublish}>
          {published === 'true' ? 'Unpublish' : 'Publish'}
        </DropdownItem>
        <DropdownItem className="text-error" onSelect={handleDelete}>
          Delete
        </DropdownItem>
      </DropdownMenu>
    </Dropdown.Root>
  )
}
