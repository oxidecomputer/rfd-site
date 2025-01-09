import { createAppAuth } from '@octokit/auth-app'
import type { GetResponseTypeFromEndpointMethod } from '@octokit/types'
import { Octokit } from 'octokit'

import { any } from '~/utils/permission'

import { getUserPermissions, type User } from './authn.server'

function getOctokitClient() {
  if (process.env.GITHUB_API_KEY) {
    return new Octokit({
      auth: process.env.GITHUB_API_KEY,
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
  discussionLink: string | undefined,
  user: User | null,
): Promise<{
  reviews: ListReviewsType
  comments: ListReviewsCommentsType
  prComments: ListIssueCommentsType
  pullNumber: number
} | null> {
  const octokit = getOctokitClient()

  if (!octokit) return null
  if (!discussionLink) return null
  if (!user) return null
  const userPermissions = await getUserPermissions(user)
  if (!(await any(userPermissions, [{ GetDiscussion: rfd }, 'GetDiscussionsAll'])))
    return null

  const match = discussionLink.match(/\/pull\/(\d+)$/)
  if (!match) return null

  const pullNumber = parseInt(match[1], 10)

  const reviews: ListReviewsResponseType = await octokit.rest.pulls.listReviews({
    owner: 'oxidecomputer',
    repo: 'rfd',
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
      owner: 'oxidecomputer',
      repo: 'rfd',
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

  let prComments = await octokit.paginate(octokit.rest.issues.listComments, {
    owner: 'oxidecomputer',
    repo: 'rfd',
    issue_number: pullNumber,
    per_page: 100,
  })

  return { reviews: reviews.data, comments: comments, prComments, pullNumber }
}
