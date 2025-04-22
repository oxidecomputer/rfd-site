/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, you can obtain one at https://mozilla.org/MPL/2.0/.
 *
 * Copyright Oxide Computer Company
 */

import * as Dropdown from '@radix-ui/react-dropdown-menu'
import { useLoaderData } from '@remix-run/react'

import type { loader } from '~/routes/rfd.$slug'

import { DropdownLink, DropdownMenu } from '../Dropdown'
import Icon from '../Icon'

const MoreDropdown = () => {
  const { rfd } = useLoaderData<typeof loader>()

  return (
    <Dropdown.Root modal={false}>
      <Dropdown.Trigger className="rounded border p-2 align-[3px] border-default hover:bg-hover">
        <Icon name="more" size={12} className="text-default" />
      </Dropdown.Trigger>

      <DropdownMenu>
        <DropdownLink to={rfd.discussion || ''} disabled={!rfd.discussion}>
          View discussion
        </DropdownLink>

        <DropdownLink to={rfd.link || ''} disabled={!rfd.link}>
          View on GitHub
        </DropdownLink>

        {rfd.link && (
          <DropdownLink to={`${rfd.link.replace('/tree/', '/blob/')}/README.adoc?plain=1`}>
            View AsciiDoc source
          </DropdownLink>
        )}

        <DropdownLink to={`/rfd/${rfd.number}/pdf`}>View PDF</DropdownLink>
      </DropdownMenu>
    </Dropdown.Root>
  )
}

export default MoreDropdown
