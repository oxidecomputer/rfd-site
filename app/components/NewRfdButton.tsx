/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, you can obtain one at https://mozilla.org/MPL/2.0/.
 *
 * Copyright Oxide Computer Company
 */

import { useDialogStore, type DialogStore } from '@ariakit/react'
import cn from 'classnames'
import { useState } from 'react'
import { useFetcher } from 'react-router'

import Icon from '~/components/Icon'
import { useRootLoaderData } from '~/root'

import Modal from './Modal'
import { TextInput } from './TextInput'

const NewRfdButton = () => {
  const dialog = useDialogStore()
  const { user } = useRootLoaderData()

  return (
    <>
      <button
        onClick={dialog.toggle}
        className="text-tertiary bg-secondary border-secondary elevation-1 hover:bg-tertiary flex h-8 w-8 items-center justify-center rounded border"
      >
        <Icon name="add-roundel" size={16} />
      </button>

      <CreateRfdModal
        data={{
          title: 'Untitled',
          name: user?.displayName || '',
          email: user?.email || '',
        }}
        dialog={dialog}
      />
    </>
  )
}

const CreateRfdModal = ({
  data,
  dialog,
}: {
  data: { title: string; name: string; email: string }
  dialog: DialogStore
}) => {
  const [title, setTitle] = useState('')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')

  const { newRfdNumber } = useRootLoaderData()
  const fetcher = useFetcher()

  const body = `:state: prediscussion
:discussion:
:authors: ${name || data.name} <${email || data.email}>

= RFD ${newRfdNumber} ${title || '{title}'}

== Determinations
`

  const handleSubmit = () => {
    fetcher.submit(
      { title, body },
      {
        method: 'post',
        action: `/api/new-rfd`,
        encType: 'application/json',
      },
    )
  }

  const formDisabled = fetcher.state !== 'idle'
  const isFormInvalid =
    !title.trim() || !(name || data.name).trim() || !(email || data.email).trim()
  const submitDisabled = formDisabled || isFormInvalid

  return (
    <Modal
      dialogStore={dialog}
      title="Create new RFD"
      onSubmit={handleSubmit}
      disabled={submitDisabled}
      isLoading={fetcher.state === 'loading' || fetcher.state === 'submitting'}
    >
      <fetcher.Form className="space-y-4">
        <div className="space-y-2">
          <TextInput
            name="title"
            placeholder="Title"
            value={title}
            onChange={(el) => setTitle(el.target.value)}
            disabled={formDisabled}
            required
          />
          <div className="flex w-full gap-2">
            <TextInput
              name="name"
              placeholder={data.name !== '' ? data.name : 'Author name'}
              value={name}
              onChange={(el) => setName(el.target.value)}
              disabled={formDisabled}
              className="w-1/3"
            />
            <TextInput
              name="email"
              placeholder={data.email !== '' ? data.email : 'Author email'}
              value={email}
              onChange={(el) => setEmail(el.target.value)}
              disabled={formDisabled}
              className="w-2/3"
            />
          </div>
        </div>

        <pre
          className={cn(
            'relative h-[160px] overflow-hidden rounded-lg border p-4 select-none',
            formDisabled
              ? 'text-quaternary bg-disabled border-default'
              : 'bg-default border-secondary',
          )}
        >
          {body}
          <div
            className="absolute bottom-0 left-0 h-[100px] w-full"
            style={{
              background: `linear-gradient(0, ${
                formDisabled ? 'var(--surface-disabled)' : 'var(--surface-default)'
              } 0%, rgba(8, 15, 17, 0) 100%)`,
            }}
          />
        </pre>
        {fetcher.state === 'idle' &&
          fetcher.data &&
          !fetcher.data.ok &&
          fetcher.data.message && (
            <div className="text-sans-lg text-error-secondary my-2">
              {fetcher.data.message}
            </div>
          )}
      </fetcher.Form>
    </Modal>
  )
}

export default NewRfdButton
