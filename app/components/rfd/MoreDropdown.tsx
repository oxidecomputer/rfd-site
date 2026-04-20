/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, you can obtain one at https://mozilla.org/MPL/2.0/.
 *
 * Copyright Oxide Computer Company
 */
import { useDialogStore } from '@ariakit/react'
import { useState } from 'react'
import { useLoaderData } from 'react-router'

import type { loader } from '~/routes/rfd.$slug'

import * as DropdownMenu from '../Dropdown'
import Icon from '../Icon'
import RfdJobsMonitor from './RfdJobsMonitor'

const MoreDropdown = () => {
  const { rfd } = useLoaderData<typeof loader>()
  const [dialogOpen, setDialogOpen] = useState(false)
  const jobsDialogStore = useDialogStore({ open: dialogOpen, setOpen: setDialogOpen })

  return (
    <>
      <DropdownMenu.Root>
        <DropdownMenu.Trigger className="border-default hover:bg-hover rounded border p-2 align-[3px]">
          <Icon name="more" size={12} className="text-default" />
        </DropdownMenu.Trigger>

        <DropdownMenu.Content>
          <DropdownMenu.Item onSelect={jobsDialogStore.toggle}>
            Processing jobs
          </DropdownMenu.Item>

          <DropdownMenu.LinkItem to={rfd.discussion || ''} disabled={!rfd.discussion}>
            GitHub discussion
          </DropdownMenu.LinkItem>

          <DropdownMenu.LinkItem to={rfd.link || ''} disabled={!rfd.link}>
            GitHub source
          </DropdownMenu.LinkItem>

          {rfd.link && (
            <DropdownMenu.LinkItem
              to={`${rfd.link.replace('/tree/', '/blob/')}/README.adoc?plain=1`}
            >
              Raw AsciiDoc
            </DropdownMenu.LinkItem>
          )}

          <DropdownMenu.LinkItem to={`/rfd/${rfd.formattedNumber}/pdf`} internal>
            View PDF
          </DropdownMenu.LinkItem>
        </DropdownMenu.Content>
      </DropdownMenu.Root>

      {dialogOpen && (
        <RfdJobsMonitor rfdNumber={rfd.number} dialogStore={jobsDialogStore} />
      )}
    </>
  )
}
export default MoreDropdown
