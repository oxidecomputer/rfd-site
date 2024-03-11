/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, you can obtain one at https://mozilla.org/MPL/2.0/.
 *
 * Copyright Oxide Computer Company
 */

import * as Dropdown from '@radix-ui/react-dropdown-menu'
import { useLoaderData } from '@remix-run/react'
import { useEffect, type Dispatch, type SetStateAction } from 'react'

import type { loader } from '~/routes/rfd.$slug'

import { DropdownItem, DropdownLink, DropdownMenu } from '../Dropdown'
import Icon from '../Icon'

const MoreDropdown = ({
  setConfidential,
  confidential,
}: {
  setConfidential: Dispatch<SetStateAction<Boolean>>
  confidential: Boolean
}) => {
  const { rfd } = useLoaderData<typeof loader>()

  useEffect(() => {
    if (!confidential) return
    window.print()
    setConfidential(false)
  }, [confidential, setConfidential])

  return (
    <Dropdown.Root modal={false}>
      <Dropdown.Trigger className="rounded border p-2 align-[3px] border-default hover:bg-hover">
        <Icon name="more" size={12} className="text-secondary" />
      </Dropdown.Trigger>

      <DropdownMenu>
        <DropdownLink to={rfd.discussion_link || ''} disabled={!rfd.discussion_link}>
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

        <DropdownLink
          to={rfd.pdf_link_google_drive || ''}
          disabled={!rfd.pdf_link_google_drive}
        >
          View PDF
        </DropdownLink>

        <DropdownItem
          onSelect={() => {
            setConfidential(true)
          }}
        >
          Print confidential PDF
        </DropdownItem>
      </DropdownMenu>
    </Dropdown.Root>
  )
}

export default MoreDropdown
