/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, you can obtain one at https://mozilla.org/MPL/2.0/.
 *
 * Copyright Oxide Computer Company
 */
import { useDialogStore } from '@ariakit/react'
import * as Dropdown from '@radix-ui/react-dropdown-menu'
import { useState } from 'react'
import { useLoaderData } from 'react-router'

import type { loader } from '~/routes/rfd.$slug'

import { DropdownItem, DropdownLink, DropdownMenu } from '../Dropdown'
import Icon from '../Icon'
import RfdJobsMonitor from './RfdJobsMonitor'

const MoreDropdown = () => {
  const { rfd } = useLoaderData<typeof loader>()
  const [dialogOpen, setDialogOpen] = useState(false)
  const jobsDialogStore = useDialogStore({ open: dialogOpen, setOpen: setDialogOpen })

  return (
    <>
      <Dropdown.Root modal={false}>
        <Dropdown.Trigger className="border-default hover:bg-hover rounded border p-2 align-[3px]">
          <Icon name="more" size={12} className="text-default" />
        </Dropdown.Trigger>

        <DropdownMenu>
          <DropdownItem onSelect={jobsDialogStore.toggle}>Processing jobs</DropdownItem>

          <DropdownLink to={rfd.discussion || ''} disabled={!rfd.discussion}>
            GitHub discussion
          </DropdownLink>

          <DropdownLink to={rfd.link || ''} disabled={!rfd.link}>
            GitHub source
          </DropdownLink>

          {rfd.link && (
            <DropdownLink
              to={`${rfd.link.replace('/tree/', '/blob/')}/README.adoc?plain=1`}
            >
              Raw AsciiDoc
            </DropdownLink>
          )}

          <DropdownLink to={`/rfd/${rfd.number}/pdf`}>View PDF</DropdownLink>
        </DropdownMenu>
      </Dropdown.Root>

      {dialogOpen && (
        <RfdJobsMonitor rfdNumber={rfd.number} dialogStore={jobsDialogStore} />
      )}
    </>
  )
}
export default MoreDropdown
