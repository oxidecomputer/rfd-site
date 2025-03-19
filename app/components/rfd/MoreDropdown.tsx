/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, you can obtain one at https://mozilla.org/MPL/2.0/.
 *
 * Copyright Oxide Computer Company
 */
import { useDialogStore } from '@ariakit/react'
import * as Dropdown from '@radix-ui/react-dropdown-menu'
import { useLoaderData } from '@remix-run/react'

import type { loader } from '~/routes/rfd.$slug'

import { DropdownItem, DropdownLink, DropdownMenu } from '../Dropdown'
import Icon from '../Icon'
import RfdJobsMonitor from './RfdJobsMonitor'

const MoreDropdown = () => {
  const { rfd, jobs } = useLoaderData<typeof loader>()
  const jobsDialogStore = useDialogStore()

  return (
    <>
      <Dropdown.Root modal={false}>
        <Dropdown.Trigger className="rounded border p-2 align-[3px] border-default hover:bg-hover">
          <Icon name="more" size={12} className="text-default" />
        </Dropdown.Trigger>

        <DropdownMenu>
          {jobs && jobs.length > 0 && (
            <DropdownItem onSelect={jobsDialogStore.toggle}>
              View processing jobs
            </DropdownItem>
          )}

          <DropdownLink to={rfd.discussion || ''} disabled={!rfd.discussion}>
            View discussion
          </DropdownLink>

          <DropdownLink to={rfd.link || ''} disabled={!rfd.link}>
            View on GitHub
          </DropdownLink>

          {rfd.link && (
            <DropdownLink
              to={`${rfd.link.replace('/tree/', '/blob/')}/README.adoc?plain=1`}
            >
              View AsciiDoc source
            </DropdownLink>
          )}

          {/* <DropdownLink
             to={rfd.pdf_link_google_drive || ''}
             disabled={!rfd.pdf_link_google_drive}
           >
             View PDF
           </DropdownLink> */}
        </DropdownMenu>
      </Dropdown.Root>

      {jobs && <RfdJobsMonitor jobs={jobs} dialogStore={jobsDialogStore} />}
    </>
  )
}
export default MoreDropdown
