/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 *
 * Copyright Oxide Computer Company
 */

import { useQuery } from '@tanstack/react-query'

import type {
  ListIssueCommentsType,
  ListReviewsCommentsType,
  ListReviewsType,
} from '~/services/github-discussion.server'

interface DiscussionData {
  reviews: ListReviewsType
  comments: ListReviewsCommentsType
  prComments: ListIssueCommentsType
  pullNumber: number
}

export function useDiscussionQuery(pullNumber: number, enabled = true) {
  return useQuery({
    queryKey: ['discussion', pullNumber],
    queryFn: async (): Promise<DiscussionData | null> => {
      const response = await fetch(`/api/rfd/${pullNumber}/discussion`)

      if (!response.ok) {
        if (response.status === 404) {
          return null
        }
        throw new Error(`Failed to fetch discussion: ${response.statusText}`)
      }

      const data = await response.json()
      // API can return null if discussion doesn't exist or user doesn't have access
      return data
    },
    enabled,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: (failureCount, error) => {
      // Don't retry on 404 or 403 errors
      if (error.message.includes('404') || error.message.includes('403')) {
        return false
      }
      return failureCount < 2
    },
  })
}
