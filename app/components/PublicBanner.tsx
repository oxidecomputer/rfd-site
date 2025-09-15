/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, you can obtain one at https://mozilla.org/MPL/2.0/.
 *
 * Copyright Oxide Computer Company
 */

import { useDialogStore } from '@ariakit/react'
import { Link } from '@remix-run/react'
import { type ReactNode } from 'react'

import Icon from '~/components/Icon'

import Modal from './Modal'

function ExternalLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <a
      href={href}
      className="text-accent-secondary hover:text-accent"
      target="_blank"
      rel="noreferrer"
    >
      {children}
    </a>
  )
}

export function PublicBanner() {
  const dialog = useDialogStore()

  return (
    <>
      {/* The [&+*]:pt-10 style is to ensure the page container isn't pushed out of screen as it uses 100vh for layout */}
      <label className="text-sans-md text-info-secondary bg-info-secondary flex h-10 w-full items-center justify-center print:hidden">
        <Icon name="info" size={16} className="mr-2" />
        Viewing public RFDs.
        <button
          className="text-sans-md hover:text-info ml-2 flex items-center gap-0.5"
          onClick={() => dialog.toggle()}
        >
          Learn more <Icon name="next-arrow" size={12} />
        </button>
      </label>

      <Modal dialogStore={dialog} title="Oxide Public RFDs">
        <div className="space-y-4">
          <p>
            These are the publicly available{' '}
            <Link
              className="text-accent-secondary hover:text-accent"
              to="/rfd/0001"
              onClick={() => dialog.setOpen(false)}
            >
              RFDs
            </Link>{' '}
            from <ExternalLink href="https://oxide.computer/">Oxide</ExternalLink>. Those
            with access should{' '}
            <Link className="text-accent-secondary hover:text-accent" to="/login">
              sign in
            </Link>{' '}
            to view the full directory of RFDs.
          </p>
          <p>
            We use RFDs both to discuss rough ideas and as a permanent repository for more
            established ones. You can read more about the{' '}
            <ExternalLink href="https://oxide.computer/blog/a-tool-for-discussion">
              tooling around discussions
            </ExternalLink>
            .
          </p>
          <p>
            If you're interested in the way we work, and would like to see the process from
            the inside, check out our{' '}
            <ExternalLink href="https://oxide.computer/careers">
              open positions
            </ExternalLink>
            .
          </p>
        </div>
      </Modal>
    </>
  )
}
