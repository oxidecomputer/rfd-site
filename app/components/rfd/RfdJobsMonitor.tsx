/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, you can obtain one at https://mozilla.org/MPL/2.0/.
 *
 * Copyright Oxide Computer Company
 */
import { type useDialogStore } from '@ariakit/react'
import { Badge, Spinner, type BadgeColor } from '@oxide/design-system/components/dist'
import { type Job } from '@oxide/rfd.ts/client'
import cn from 'classnames'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import { useState, type ReactNode } from 'react'

import Icon from '~/components/Icon'
import Modal from '~/components/Modal'

dayjs.extend(relativeTime)

type JobStatus = {
  label: string
  color: BadgeColor
}

const InfoField = ({ label, children }: { label: string; children: ReactNode }) => (
  <div className="border-r border-default last-of-type:border-0">
    <div className="mb-1 text-mono-sm text-tertiary">{label}</div>
    <div className="flex items-center gap-1.5">{children}</div>
  </div>
)

const KeyValueRow = ({ label, value }: { label: string; value: ReactNode }) => (
  <div className="flex flex-col justify-between border-b px-3 py-2 border-default last-of-type:border-0 600:flex-row 600:items-center">
    <div className="text-mono-sm text-secondary">{label}</div>
    <div className="max-w-[200px] truncate 600:max-w-[initial]">{value}</div>
  </div>
)

const JobDetailsRow = ({ job }: { job: Job }) => {
  return (
    <div className="space-y-4 p-4 bg-tertiary 600:p-6">
      <div className="grid grid-cols-1 gap-4 text-sans-md 600:grid-cols-3">
        <InfoField label="Committed">
          {dayjs(job.committedAt).format('MMM D, h:mma')}
        </InfoField>
        <InfoField label="Created">{dayjs(job.createdAt).format('MMM D, h:mma')}</InfoField>
        <InfoField label="Processed">
          {job.processed ? (
            <>
              <Icon name="success" size={12} className="text-accent" /> True
            </>
          ) : (
            <>
              <Icon name="unauthorized" size={12} className="text-tertiary" /> False
            </>
          )}
        </InfoField>
      </div>

      <div className="w-full rounded-lg border bg-raise border-default">
        <KeyValueRow label="Branch" value={job.branch} />
        <KeyValueRow label="Commit SHA" value={job.sha} />
        <KeyValueRow
          label="Webhook ID"
          value={
            job.webhookDeliveryId ? (
              job.webhookDeliveryId
            ) : (
              <span className="text-tertiary">-</span>
            )
          }
        />
      </div>
    </div>
  )
}

const JobRow = ({
  job,
  isExpanded,
  onToggle,
}: {
  job: Job
  isExpanded: boolean
  onToggle: () => void
}) => {
  const status = getJobStatus(job)

  return (
    <>
      <tr className="cursor-pointer text-sans-md hover:bg-secondary" onClick={onToggle}>
        <td className="flex items-center justify-center">
          <Icon
            name="next-arrow"
            size={12}
            className={cn('transition-transform text-tertiary', isExpanded && 'rotate-90')}
          />
        </td>
        <td>{job.id}</td>
        <td className="flex items-center gap-2">
          <Badge color={status.color}>{status.label}</Badge>
          {status.label !== 'Completed' && <Spinner />}
        </td>
        <td className="hidden 600:table-cell">
          <Badge color="neutral" className="!normal-case">
            {job.sha.substring(0, 8)}
          </Badge>
        </td>
        <td>{formatTime(job.startedAt)}</td>
      </tr>
      {isExpanded && (
        <tr key={`details-${job.id}`}>
          <td colSpan={5}>
            <JobDetailsRow job={job} />
          </td>
        </tr>
      )}
    </>
  )
}

const getJobStatus = (job: Job): JobStatus => {
  if (job.processed) {
    return {
      label: 'Completed',
      color: 'default',
    }
  } else if (job.startedAt) {
    return {
      label: 'In Progress',
      color: 'blue',
    }
  }

  return {
    label: 'Queued',
    color: 'purple',
  }
}

const formatTime = (dateString?: Date) => {
  if (!dateString) return 'N/A'
  return dayjs(dateString).fromNow()
}

export default function RfdJobsMonitor({
  jobs,
  dialogStore,
}: {
  jobs: Job[]
  dialogStore: ReturnType<typeof useDialogStore>
}) {
  const [expandedJobId, setExpandedJobId] = useState<number | null>(null)

  const toggleExpandJob = (jobId: number) => {
    setExpandedJobId(expandedJobId === jobId ? null : jobId)
  }

  return (
    <Modal dialogStore={dialogStore} title="RFD Processing Jobs" width="wide">
      <div className="overflow-auto">
        <table className="inline-table w-full">
          <thead>
            <tr className="text-left">
              <th className="w-8"></th>
              <th>Job ID</th>
              <th>Status</th>
              <th className="hidden 600:table-cell">Commit</th>
              <th>Started</th>
            </tr>
          </thead>
          <tbody>
            {jobs.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-tertiary">
                  No jobs found
                </td>
              </tr>
            ) : (
              jobs.map((job) => (
                <JobRow
                  key={job.id}
                  job={job}
                  isExpanded={expandedJobId === job.id}
                  onToggle={() => toggleExpandJob(job.id)}
                />
              ))
            )}
          </tbody>
        </table>
      </div>
    </Modal>
  )
}
