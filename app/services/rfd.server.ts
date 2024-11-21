/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, you can obtain one at https://mozilla.org/MPL/2.0/.
 *
 * Copyright Oxide Computer Company
 */

import fs from 'fs'
import { createAppAuth } from '@octokit/auth-app'
import type { GetResponseTypeFromEndpointMethod } from '@octokit/types'
import { asciidoctor, type AdocTypes } from '@oxide/react-asciidoc'
import { Octokit } from 'octokit'

import { generateAuthors, type Author } from '~/components/rfd/RfdPreview'
import { isTruthy } from '~/utils/isTruthy'
import { parseRfdNum } from '~/utils/parseRfdNum'
import { can, type Permission } from '~/utils/permission'
import type { GroupResponse, RfdListResponseItem, RfdResponse } from '~/utils/rfdApi'

import type { Group, User } from './authn.server'
import { apiRequest } from './rfdApi.server'

export type RfdItem = {
  number: number
  number_string: string
  title: string
  state: string
  link: string | null
  discussion_link: string | null
  authors: Author[]
  labels: string[]
  content: string
  toc: TocItem[]
  commit_date: string
  pdf_link_google_drive: string
  visibility: 'private' | 'public'
}

export type RfdListItem = {
  number: number
  number_string: string
  link: string | null
  discussion: string | null
  title: string
  state: string
  authors: string
  labels: string
  sha: string
  commit: string
  commit_date: string
  visibility: 'private' | 'public'
}

const localRepo = process.env.LOCAL_RFD_REPO
export const isLocalMode = process.env.NODE_ENV === 'development' && localRepo

async function canUser(user: User, permission: Permission): Promise<boolean> {
  const groups = (await fetchGroups(user)).filter((group) =>
    user.groups.includes(group.name),
  )
  const allPermissions = user.permissions.concat(
    groups.flatMap((group) => group.permissions),
  )
  return can(allPermissions, permission)
}

function findLineStartingWith(content: string, prefixRegex: string): string | undefined {
  // (^|\n) is required to match either the first line (beginning of file) or
  // subsequent lines
  return content.match(RegExp('(^|\n)' + prefixRegex + ' *([^\n]+)\n'))?.[2]
}

function fetchRfdLocally(num: number): RfdResponse {
  try {
    const numStr = num.toString().padStart(4, '0')
    const buffer = fs.readFileSync(`${localRepo}/rfd/${numStr}/README.adoc`)
    const content = buffer.toString()

    // we used to parse the whole document for state and title, but this is
    // dramatically faster for live reload and seems to work fine
    const state = findLineStartingWith(content, ':state: ') || 'unknown'

    let title = findLineStartingWith(content, '= ') || 'Title Not Found'
    title = title.replace(`RFD ${parseInt(numStr)}`, '')

    return {
      id: '',
      authors: '',
      labels: '',
      content,
      rfd_number: num,
      title: title,
      state: state,
      link: '',
      discussion: '',
      sha: '',
      commit: '',
      committed_at: new Date(0).toISOString(),
      pdfs: [],
      visibility: 'private',
    }
  } catch (e) {
    throw new Response('Not found', { status: 404 })
  }
}

export function fetchLocalImage(num: number, src: string): Buffer | null {
  const numStr = num.toString().padStart(4, '0')
  const imagePath = `${localRepo}/rfd/${numStr}/${src}`
  try {
    return fs.readFileSync(imagePath)
  } catch (e) {
    console.error('Image not found', imagePath)
    return null
  }
}

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

export class UnauthenticatedError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'UnauthenticatedError'
  }
}

/** Includes auth check: non-internal users can't see discussion */
export async function fetchDiscussion(
  discussionLink: string | null,
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
  if (!(await canUser(user, { k: 'ReadDiscussions' }))) return null

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

export async function fetchGroups(user: User | null): Promise<Group[]> {
  try {
    const data = isLocalMode ? [] : await apiRequest<GroupResponse[]>('/group', user?.token)
    return data
  } catch (err) {
    console.error(err)
    return []
  }
}

export async function fetchRfd(num: number, user: User | null): Promise<RfdItem | null> {
  if (num < 1 || num > 9999) return null

  try {
    const resp = isLocalMode
      ? fetchRfdLocally(num)
      : await apiRequest<RfdResponse>(`rfd/${num}`, user?.token)

    const ad = asciidoctor()
    const doc = ad.load(resp.content, {
      standalone: true,
      attributes: {
        rfdnumber: num,
      },
    })

    return {
      number: resp.rfd_number,
      number_string: resp.rfd_number.toString().padStart(4, '0'),
      title: resp.title,
      state: resp.state,
      link: resp.link,
      discussion_link: resp.discussion,
      authors: resp.authors ? generateAuthors(resp.authors) : [],
      labels: resp.labels ? resp.labels.split(',') : [],
      content: resp.content,
      toc: generateTableOfContents(doc.getSections()),
      commit_date: resp.committed_at,
      pdf_link_google_drive:
        resp.pdfs.filter((pdf) => pdf.source === 'google')[0]?.link || '',
      visibility: resp.visibility,
    }
  } catch (err) {
    return null
  }
}

function fetchRfdsLocally() {
  const rfdDir = `${process.env.LOCAL_RFD_REPO}/rfd`

  const rfds = fs
    .readdirSync(rfdDir)
    .map((numStr) => {
      const num = parseRfdNum(numStr)
      if (!num) return null
      try {
        return fetchRfdLocally(num) // will throw on errors, hence the try/catch
      } catch {
        return null
      }
    })
    .filter(isTruthy)
    .reverse() // sort by highest number first since we don't have dates

  return rfds
}

export async function fetchRfds(user: User | null): Promise<RfdListItem[]> {
  try {
    const data = isLocalMode
      ? fetchRfdsLocally()
      : await apiRequest<RfdListResponseItem[]>('/rfd', user?.token)
    return data
      .map((rfd) => {
        return {
          number: rfd.rfd_number,
          number_string: rfd.rfd_number.toString().padStart(4, '0'),
          commit_date: rfd.committed_at,
          ...rfd,
        }
      })
      .sort((a, b) => Date.parse(b.committed_at) - Date.parse(a.committed_at))
  } catch (err) {
    console.error(err)

    // If this was an unauthenticated error then rethrow the error, it means the user
    // presented invalid credentials and the session needs to be reset
    if ((err as Response).status === 401) {
      throw new UnauthenticatedError('Invalid authentication credential')
    }

    return []
  }
}

export const findAuthors = (rfds: RfdListItem[]): Author[] => {
  let authors: Author[] = []

  rfds.forEach((rfd) => {
    if (!rfd.authors) {
      return
    }
    const parsedAuthors = generateAuthors(rfd.authors)

    parsedAuthors.forEach((author) => {
      const found = authors.find(
        (el) => el.email === author.email || el.name === author.name,
      )

      if (!found) {
        authors.push(author)
      }
    })
  })

  authors.sort((a, b) => a.name.localeCompare(b.name))

  return authors
}

export const findLabels = (rfds: RfdListItem[]): string[] => {
  const labels = new Set<string>()

  rfds.forEach((rfd) => {
    rfd.labels?.split(',').forEach((label) => labels.add(label.trim()))
  })

  return Array.from(labels).sort()
}

export const provideNewRfdNumber = (rfds: RfdListItem[]): number | null => {
  if (rfds.length === 0) {
    return null
  }

  rfds.sort((a, b) => a.number - b.number)

  const latestRfd = rfds[rfds.length - 1]

  return latestRfd.number + 1
}

const generateTableOfContents = (sections: AdocTypes.Section[]) => {
  let toc: TocItem[] = []

  if (sections.length < 1) return toc

  for (let section of sections) {
    generateSection(toc, section)
  }

  return toc
}

export type TocItem = {
  id: string
  level: number
  title: string
  sectNum: string
}

const generateSection = (toc: TocItem[], section: AdocTypes.Section) => {
  toc.push({
    id: section.getId(),
    level: section.getLevel(),
    title: section.getTitle() || '',
    // @ts-ignore
    sectNum: section.$sectnum().slice(0, -1),
  })

  if (section.hasSections()) {
    const sections = section.getSections()

    for (let section of sections) {
      generateSection(toc, section)
    }
  }
}
