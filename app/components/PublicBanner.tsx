/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, you can obtain one at https://mozilla.org/MPL/2.0/.
 *
 * Copyright Oxide Computer Company
 */

import { useDialogStore } from '@ariakit/react'
import { Link } from 'react-router'

import Icon from '~/components/Icon'
import { useRootLoaderData } from '~/root'

import Modal from './Modal'

export function PublicBanner() {
  const { config } = useRootLoaderData()
  const dialog = useDialogStore()

  if (!config.publicBanner || !config.publicBanner.enabled) return null

  return (
    <>
      {/* The [&+*]:pt-10 style is to ensure the page container isn't pushed out of screen as it uses 100vh for layout */}
      <div className="text-sans-md text-info-secondary bg-info-secondary flex h-10 w-full items-center justify-center print:hidden">
        <Icon name="info" size={16} className="mr-2" />
        {config.publicBanner.text || 'Viewing public RFDs'}
        <button
          className="text-sans-md hover:text-info ml-2 flex items-center gap-0.5"
          onClick={() => dialog.toggle()}
        >
          Learn more <Icon name="next-arrow" size={12} />
        </button>
      </div>

      <Modal dialogStore={dialog} title={`${config.organization.name} Public RFDs`}>
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
            from{' '}
            <a
              href={config.organization.website}
              className="text-accent-secondary hover:text-accent"
              target="_blank"
              rel="noreferrer"
            >
              {config.organization.name}
            </a>
            . Those with access should{' '}
            <Link className="text-accent-secondary hover:text-accent" to="/login">
              sign in
            </Link>{' '}
            to view the full directory of RFDs.
          </p>
          {config.publicBanner.learnMoreContent && (
            <div
              dangerouslySetInnerHTML={{ __html: config.publicBanner.learnMoreContent }}
            />
          )}
        </div>
      </Modal>
    </>
  )
}
