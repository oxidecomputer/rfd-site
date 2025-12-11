/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, you can obtain one at https://mozilla.org/MPL/2.0/.
 *
 * Copyright Oxide Computer Company
 */

import { useDialogStore } from '@ariakit/react'

import Icon from '~/components/Icon'
import { useRootLoaderData } from '~/root'

import Modal from './Modal'

const NewRfdButton = () => {
  const dialog = useDialogStore()
  const newRfdNumber = useRootLoaderData().newRfdNumber

  return (
    <>
      <button
        onClick={dialog.toggle}
        className="text-tertiary bg-secondary border-secondary elevation-1 hover:bg-tertiary flex h-8 w-8 items-center justify-center rounded border"
        aria-label="Create new RFD"
      >
        <Icon name="add-roundel" size={16} />
      </button>

      <Modal dialogStore={dialog} title="Create new RFD">
        <>
          <p>
            There is a prototype script in the rfd{' '}
            <a
              href="https://github.com/oxidecomputer/rfd"
              className="text-accent-tertiary hover:text-accent-secondary"
            >
              repository
            </a>
            ,{' '}
            <code className="align-[1px]; text-mono-code bg-raise border-secondary mr-px ml-px rounded border px-[4px] py-px">
              scripts/new.sh
            </code>
            , that will create a new RFD when used like the code below.
          </p>

          <p className="mt-2">
            {newRfdNumber
              ? 'The snippet below automatically updates to ensure the new RFD number is correct.'
              : 'Replace the number below with the next free number'}
          </p>
          <pre className="text-mono-code border-secondary 800:px-7 800:py-6 mt-4 overflow-x-auto rounded border px-5 py-4">
            <code className="text-mono-code text-[0.825rem]!">
              <span className="text-quaternary mr-2 inline-block select-none">$</span>
              scripts/new.sh{' '}
              {newRfdNumber ? newRfdNumber.toString().padStart(4, '0') : '0042'} "My title
              here"
            </code>
          </pre>
        </>
      </Modal>
    </>
  )
}

export default NewRfdButton
