/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, you can obtain one at https://mozilla.org/MPL/2.0/.
 *
 * Copyright Oxide Computer Company
 */
import { EditorView } from '@codemirror/view'
import Asciidoc, { asciidoctor } from '@oxide/react-asciidoc'
import * as Dropdown from '@radix-ui/react-dropdown-menu'
import { useActionData, useFetcher, useLoaderData } from '@remix-run/react'
import CodeMirror, { type ReactCodeMirrorRef } from '@uiw/react-codemirror'
import dayjs from 'dayjs'
import { useEffect, useMemo, useRef, useState } from 'react'

import { MinimalDocument, opts } from '~/components/AsciidocBlocks'
import { DropdownItem, DropdownLink, DropdownMenu } from '~/components/Dropdown'
import Icon from '~/components/Icon'
import { editorTheme } from '~/components/tome/EditorTheme'
import { useDebounce } from '~/hooks/use-debounce'

import Spinner from '../Spinner'

const ad = asciidoctor()

opts.customDocument = MinimalDocument

type EditorStatus = 'idle' | 'unsaved' | 'saving' | 'saved'

export const TomeForm = ({
  initialTitle = '',
  initialBody = '',
  updated,
  onSave,
}: {
  initialTitle?: string
  initialBody?: string
  updated: string
  onSave: (title: string, body: string) => void
}) => {
  const fetcher = useFetcher()
  const [status, setStatus] = useState<EditorStatus>('idle')
  const actionData = useActionData()
  const [body, setBody] = useState(initialBody)
  const [title, setTitle] = useState(initialTitle)
  const inputRef = useRef<ReactCodeMirrorRef>(null)

  const debouncedBody = useDebounce(body, 750)
  const debouncedTitle = useDebounce(title, 750)

  useEffect(() => {
    const hasChanges = body !== initialBody || title !== initialTitle
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
    fetcher.state,
    status,
    onSave,
  ])

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
    <fetcher.Form method="post">
      <div className="flex h-[60px] w-full items-center justify-between border-b px-6 border-b-secondary">
        <div className="flex items-center gap-2">
          <Icon name="prev-arrow" size={12} className="text-quaternary" />

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

          <MoreDropdown />
        </div>

        <SavingIndicator status={status} updated={updated} />
      </div>
      <div className="flex h-[calc(100dvh-60px)] flex-grow overflow-hidden">
        <div
          id="code_mirror_wrapper"
          className="h-full w-1/2 cursor-text overflow-scroll"
          onClick={(el) => {
            if ((el.target as HTMLElement).id === 'code_mirror_wrapper') {
              inputRef.current && inputRef.current.editor && inputRef.current.editor.focus()
            }
          }}
        >
          <input type="hidden" name="body" value={body} />
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
        <div className="h-full w-1/2 overflow-scroll border-l px-4 py-6 border-secondary">
          <Asciidoc content={doc} options={opts} />
        </div>
        {actionData?.error && <div className="text-red-500">{actionData.error}</div>}
      </div>
    </fetcher.Form>
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

const MoreDropdown = () => {
  const tome = useLoaderData()
  const fetcher = useFetcher() // Initialize the fetcher

  const handleDelete = () => {
    if (window.confirm('Are you sure you want to delete this tome?')) {
      fetcher.submit(
        { id: tome.id },
        {
          method: 'post',
          action: `/tome/${tome.id}/delete`,
          encType: 'application/x-www-form-urlencoded',
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
        <DropdownLink to={`/tome/${tome.id}`}>View</DropdownLink>
        <DropdownItem className="text-error" onSelect={handleDelete}>
          Delete
        </DropdownItem>
      </DropdownMenu>
    </Dropdown.Root>
  )
}
