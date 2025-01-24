/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, you can obtain one at https://mozilla.org/MPL/2.0/.
 *
 * Copyright Oxide Computer Company
 */

import { buttonStyle } from '@oxide/design-system/components/dist'
import { Link } from '@remix-run/react'
import cn from 'classnames'

import Icon from '~/components/Icon'

import { EMBody, PlaceholderWrapper } from './notes'

export default function Notes() {
  return (
    <PlaceholderWrapper>
      <div className="m-4 flex max-w-[18rem] flex-col items-center text-center">
        <div className="mb-4 rounded p-2 leading-[0] text-accent bg-accent-secondary">
          <Icon name="edit" size={16} />
        </div>

        <h3 className="text-sans-semi-lg">Live AsciiDoc Editor</h3>
        <EMBody className="max-w-lg">Create, edit, and share notes</EMBody>
        <Link
          className={cn('mt-6', buttonStyle({ variant: 'ghost', size: 'sm' }))}
          to="/notes/new"
        >
          New Note
        </Link>
      </div>
    </PlaceholderWrapper>
  )
}
