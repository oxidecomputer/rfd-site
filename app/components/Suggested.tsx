/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, you can obtain one at https://mozilla.org/MPL/2.0/.
 *
 * Copyright Oxide Computer Company
 */

import cn from 'classnames'
import { cloneElement, type ReactElement, type ReactNode } from 'react'
import { Link } from 'react-router'

import Icon from '~/components/Icon'
import type { RfdListItem } from '~/services/rfd.server'

import type { Author } from './rfd/RfdPreview'

const Comma = () => <span className="text-notice-tertiary mr-1 inline-block">,</span>

export const SuggestedAuthors = ({ authors }: { authors: Author[] }) => {
  if (authors.length === 0) return null

  return (
    <SuggestedTemplate icon={<Icon name="person" size={16} />} color="purple">
      <div>
        <span className="mr-1">Filter RFDs from:</span>
        {authors
          .filter((a) => a.email)
          .map((author, index) => (
            <Link
              key={author.name}
              to={`/?authorEmail=${author.email}&authorName=${author.name}`}
              state={{ shouldClearInput: true }}
              className="text-semi-sm underline"
            >
              {author.name}
              {index < authors.length - 1 && <Comma />}
            </Link>
          ))}
      </div>
    </SuggestedTemplate>
  )
}

export const SuggestedLabels = ({ labels }: { labels: string[] }) => {
  if (labels.length === 0) return null

  return (
    <SuggestedTemplate icon={<Icon name="tags" size={16} />} color="blue">
      <div>
        <span className="mr-1">Filter RFDs labeled:</span>
        {labels.map((label, index) => (
          <Link
            key={label}
            to={`/?label=${label}`}
            state={{ shouldClearInput: true }}
            className="text-semi-sm underline"
          >
            {label}
            {index < labels.length - 1 && <Comma />}
          </Link>
        ))}
      </div>
    </SuggestedTemplate>
  )
}

export const ExactMatch = ({ rfd }: { rfd: RfdListItem }) => (
  <SuggestedTemplate icon={<Icon name="document" size={16} />} color="green">
    <div>
      RFD {rfd.number}:{' '}
      <Link
        key={rfd.number}
        to={`/rfd/${rfd.formattedNumber}`}
        state={{ shouldClearInput: true }}
        className="text-semi-sm underline"
      >
        {rfd.title}
      </Link>
    </div>
  </SuggestedTemplate>
)

export const SuggestedTemplate = ({
  children,
  icon,
  color,
}: {
  children: ReactNode
  icon: ReactElement<React.HTMLAttributes<HTMLElement>>
  color: string
}) => (
  <div className={cn('w-full', `${color}-theme`)}>
    <div className="items-top text-sans-sm text-accent bg-accent-secondary flex w-full rounded px-3 py-2 pr-6">
      {cloneElement(icon, {
        className: `mr-2 shrink-0 text-accent-tertiary`,
      })}
      {children}
    </div>
  </div>
)
