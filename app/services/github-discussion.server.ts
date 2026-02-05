/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, you can obtain one at https://mozilla.org/MPL/2.0/.
 *
 * Copyright Oxide Computer Company
 */

import { createAppAuth } from '@octokit/auth-app'
import type { GetResponseTypeFromEndpointMethod } from '@octokit/types'
import { Octokit } from 'octokit'

import { any } from '~/utils/permission'

import { getUserPermissions, type User } from './auth.server'
import { getSiteConfig } from './config.server'

const githubUrl = new URL(
  `https://${process.env.GITHUB_HOST || 'github.com/oxidecomputer/rfd'}`,
)
const baseUrl = githubUrl.host.startsWith('github.com')
  ? 'https://api.github.com'
  : `https://${githubUrl.host}/api/v3`
const [, owner, repo] = githubUrl.pathname.split('/')

function getOctokitClient() {
  if (process.env.GITHUB_API_KEY) {
    return new Octokit({
      auth: process.env.GITHUB_API_KEY,
      baseUrl,
    })
  } else if (
    process.env.GITHUB_APP_ID &&
    process.env.GITHUB_INSTALLATION_ID &&
    process.env.GITHUB_PRIVATE_KEY
  ) {
    return new Octokit({
      authStrategy: createAppAuth,
      auth: {
        appId: process.env.GITHUB_APP_ID,
        privateKey: process.env.GITHUB_PRIVATE_KEY,
        installationId: process.env.GITHUB_INSTALLATION_ID,
      },
      baseUrl,
    })
  } else {
    return null
  }
}

export type ListReviewsResponseType = GetResponseTypeFromEndpointMethod<
  Octokit['rest']['pulls']['listReviews']
>

export type ListReviewsCommentsResponseType = GetResponseTypeFromEndpointMethod<
  Octokit['rest']['pulls']['listReviewComments']
>

export type ListIssueCommentsResponseType = GetResponseTypeFromEndpointMethod<
  Octokit['rest']['issues']['listComments']
>

export type ListReviewsType = ListReviewsResponseType['data']

export type ReviewType = ListReviewsType[number]

export type ListReviewsCommentsType = ListReviewsCommentsResponseType['data']

export type ReviewCommentsType = ListReviewsCommentsType[number]

export type ListIssueCommentsType = ListIssueCommentsResponseType['data']

export type IssueCommentType = ListIssueCommentsType[number]

/** Includes auth check: non-internal users can't see discussion */
export async function fetchDiscussion(
  rfd: number,
  pullNumber: number,
  user: User | null,
): Promise<{
  reviews: ListReviewsType
  comments: ListReviewsCommentsType
  prComments: ListIssueCommentsType
  pullNumber: number
} | null> {
  const config = await getSiteConfig()

  if (!config.features.discussions) {
    console.error('GitHub discussions feature is disabled')
    return null
  }

  // Parse owner/repo from URL
  const repoUrl = config.repository.url
  const match = repoUrl.match(/github\.com\/([^/]+)\/([^/]+)/)
  if (!match) {
    throw new Error('Invalid repository URL - must be a GitHub URL')
  }

  const [, owner, repo] = match

  const octokit = getOctokitClient()

  if (!octokit) return null
  if (!user) return null
  const userPermissions = await getUserPermissions(user)
  if (!any(userPermissions, [{ GetDiscussion: rfd }, 'GetDiscussionsAll'])) return null

  const reviews: ListReviewsResponseType = await octokit.rest.pulls.listReviews({
    owner,
    repo,
    pull_number: pullNumber,
    per_page: 100,
  })

  if (reviews.status !== 200) {
    console.error('Error fetching reviews from GitHub')
    return null
  }

  // Paginate review comments
  // This is _sloooowwww_
  // To be resolved by moving to our own mirror / CIO
  let comments: ListReviewsCommentsType = []
  await octokit
    .paginate(octokit.rest.pulls.listReviewComments, {
      owner,
      repo,
      pull_number: pullNumber,
      per_page: 100,
    })
    .then((data) => {
      comments = data
    })
    .catch(() => {
      console.error('Error fetching comments from GitHub')
      return null
    })

  const prComments = await octokit.paginate(octokit.rest.issues.listComments, {
    owner,
    repo,
    issue_number: pullNumber,
    per_page: 100,
  })

  return { reviews: reviews.data, comments: comments, prComments, pullNumber }
}
