/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, you can obtain one at https://mozilla.org/MPL/2.0/.
 *
 * Copyright Oxide Computer Company
 */

import { Fragment } from 'react'

import Icon from '~/components/Icon'

const AccessWarning = ({ groups }: { groups: string[] }) => {
  if (groups.length === 0) return null

  const formatAllowList = (message: string, index: number) => {
    if (index < groups.length - 1) {
      return (
        <>
          {message}
          <span className="text-notice-tertiary mr-1 inline-block">,</span>
        </>
      )
    } else {
      return message
    }
  }

  return (
    <div className="800:col-span-10 800:col-start-2 800:pr-10 1000:col-span-10 1000:col-start-2 1200:col-start-3 1200:pr-16 col-span-12 mt-4 flex">
      <div className="items-top text-sans-md text-notice bg-notice-secondary 1200:w-[calc(100%-var(--toc-width))] flex w-full rounded px-3 py-2 pr-6 print:hidden">
        <Icon name="access" size={16} className="text-notice-tertiary mr-2 shrink-0" />
        <div>
          This RFD can be accessed by the following groups:
          <span className="text-notice-tertiary ml-1 inline-block">[</span>
          {groups.map((message, index) => (
            <Fragment key={message}>{formatAllowList(message, index)}</Fragment>
          ))}
          <span className="text-notice-tertiary">]</span>
        </div>
      </div>
    </div>
  )
}

export default AccessWarning
