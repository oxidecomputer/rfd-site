/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, you can obtain one at https://mozilla.org/MPL/2.0/.
 *
 * Copyright Oxide Computer Company
 */
import { type useDialogStore } from '@ariakit/react'
import { Badge, Spinner, type BadgeColor } from '@oxide/design-system/components'
import { type Job } from '@oxide/rfd.ts/client'
import { useQuery } from '@tanstack/react-query'
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
  <div className="border-default border-r last-of-type:border-0">
    <div className="text-mono-sm text-tertiary mb-1">{label}</div>
    <div className="flex items-center gap-1.5">{children}</div>
  </div>
)

const KeyValueRow = ({ label, value }: { label: string; value: ReactNode }) => (
  <div className="600:gap-6 border-default 600:flex-row 600:items-center flex w-full flex-col flex-nowrap justify-between border-b px-3 py-2 last-of-type:border-0">
    <div className="text-mono-sm text-secondary shrink-0">{label}</div>
    <div className="max-600:pr-6 truncate">{value}</div>
  </div>
)

const JobDetailsRow = ({ job }: { job: Job }) => {
  return (
    <div className="bg-tertiary 600:p-6 space-y-4 p-4">
      <div className="text-sans-md 600:grid-cols-3 grid grid-cols-1 gap-4">
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

      <div className="bg-raise border-default w-full rounded-lg border">
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
      <tr className="text-sans-md hover:bg-secondary cursor-pointer" onClick={onToggle}>
        <td className="text-center">
          <Icon
            name="next-arrow"
            size={12}
            className={cn(
              'text-tertiary inline-block transition-transform',
              isExpanded && 'rotate-90',
            )}
          />
        </td>
        <td>{job.id}</td>
        <td>
          <Badge color={status.color}>{status.label}</Badge>
          {status.label !== 'Completed' && <Spinner />}
        </td>
        <td className="600:table-cell hidden">
          <Badge color="neutral" className="normal-case!">
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

async function fetchRfdJobs(rfdNumber: number) {
  const response = await fetch(`/rfd/${rfdNumber}/jobs`)

  if (!response.ok) {
    throw new Error('Failed to fetch RFD jobs')
  }
  return response.json()
}

export default function RfdJobsMonitor({
  rfdNumber,
  dialogStore,
}: {
  rfdNumber: number
  dialogStore: ReturnType<typeof useDialogStore>
}) {
  const [expandedJobId, setExpandedJobId] = useState<number | null>(null)

  const {
    data: jobs = [],
    isLoading,
    error,
  } = useQuery<Job[]>({
    queryKey: ['rfdJobs', rfdNumber],
    queryFn: () => fetchRfdJobs(rfdNumber),
    refetchOnWindowFocus: false,
  })

  const toggleExpandJob = (jobId: number) => {
    setExpandedJobId(expandedJobId === jobId ? null : jobId)
  }

  return (
    <Modal dialogStore={dialogStore} title="RFD Processing Jobs" width="wide">
      {isLoading ? (
        <div className="flex items-center justify-center p-12">
          <Spinner size="lg" />
        </div>
      ) : error ? (
        <div className="text-error px-4 py-6 text-center">
          An error occurred while loading jobs.
        </div>
      ) : (
        <table className="inline-table w-full table-fixed">
          <thead>
            <tr className="text-left">
              <th className="w-8"></th>
              <th>Job ID</th>
              <th>Status</th>
              <th className="600:table-cell hidden">Commit</th>
              <th>Started</th>
            </tr>
          </thead>
          <tbody>
            {jobs.length === 0 ? (
              <tr>
                <td colSpan={5} className="text-tertiary px-4 py-6 text-center">
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
      )}
    </Modal>
  )
}
