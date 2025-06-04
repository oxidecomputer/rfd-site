/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, you can obtain one at https://mozilla.org/MPL/2.0/.
 *
 * Copyright Oxide Computer Company
 */

import { handleDocument } from '@oxide/design-system/components/dist'
import type { DocumentBlock, DocumentSection } from '@oxide/react-asciidoc'
import type {
  AccessGroup_for_RfdPermission,
  Job,
  RfdWithoutContent,
  RfdWithPdf,
  RfdWithRaw,
} from '@oxide/rfd.ts/client'

import { ad, attrs } from '~/utils/asciidoctor'

import { type User } from './authn.server'
import {
  fetchLocalRfd,
  fetchLocalRfds,
  isLocalMode,
  type LocalRfd,
} from './rfd.local.server'
import {
  fetchRemoteGroups,
  fetchRemoteRfd,
  fetchRemoteRfdJobs,
  fetchRemoteRfdPdf,
  fetchRemoteRfds,
} from './rfd.remote.server'

export type RfdItem = {
  number: number
  formattedNumber: string
  title?: string
  state?: string
  link?: string
  discussion?: string
  authors?: Author[]
  labels?: string[]
  content?: DocumentBlock
  toc?: DocumentSection[]
  sha?: string
  commit?: string
  committedAt?: Date
  visibility: 'private' | 'public'
}

export type RfdListItem = {
  number: number
  formattedNumber: string
  link?: string | null
  discussion?: string | null
  title?: string
  state?: string
  authors?: Author[]
  formattedAuthors?: string
  labels?: string[]
  sha?: string
  commit?: string
  committedAt?: Date
  visibility: 'private' | 'public'
}

export async function fetchGroups(
  user: User | null,
): Promise<AccessGroup_for_RfdPermission[]> {
  if (isLocalMode()) {
    return []
  } else {
    return await fetchRemoteGroups(user)
  }
}

export async function fetchRfd(
  num: number,
  user: User | null,
): Promise<RfdItem | undefined> {
  if (num < 1 || num > 9999) return undefined

  try {
    if (isLocalMode()) {
      return localRfdToItem(fetchLocalRfd(num))
    } else {
      const rfd = await fetchRemoteRfd(num, user)
      return rfd && apiRfdToItem(rfd)
    }
  } catch (err) {
    console.error('Failed to fetch RFD', err)
    return undefined
  }
}

export async function fetchRfdJobs(num: number, user: User | null): Promise<Job[]> {
  if (num < 1 || num > 9999) return []

  try {
    if (isLocalMode()) {
      return []
    } else {
      return await fetchRemoteRfdJobs(num, user)
    }
  } catch (err) {
    console.error('Failed to fetch RFD jobs', err)
    return []
  }
}

export async function fetchRfdPdf(
  num: number,
  user: User | null,
): Promise<RfdWithPdf | undefined> {
  if (num < 1 || num > 9999) return undefined

  try {
    if (isLocalMode()) {
      return undefined
    } else {
      const rfd = await fetchRemoteRfdPdf(num, user)
      return rfd
    }
  } catch (err) {
    console.error('Failed to fetch RFD', err)
    return undefined
  }
}

export async function fetchRfds(user: User | null): Promise<RfdListItem[] | undefined> {
  try {
    if (isLocalMode()) {
      return fetchLocalRfds().map(localRfdToListItem)
    } else {
      return (await fetchRemoteRfds(user)).map(apiRfdMetaToListItem)
    }
  } catch (err) {
    console.error('Failed to fetch RFD', err)
    return undefined
  }
}

export const getAuthors = (rfds: RfdListItem[]): Author[] => {
  let authors: Author[] = []

  for (const rfd of rfds) {
    if (rfd.authors && rfd.authors.length > 0) {
      for (const author of rfd.authors) {
        const found = authors.find(
          (el) => el.email === author.email || el.name === author.name,
        )

        if (!found) {
          authors.push(author)
        }
      }
    }
  }

  authors.sort((a, b) => a.name.localeCompare(b.name))

  return authors
}

export const getLabels = (rfds: RfdListItem[]): string[] => {
  const labels = new Set<string>()

  for (const rfd of rfds) {
    for (const label of rfd.labels || []) {
      labels.add(label)
    }
  }

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

async function apiRfdToItem(rfd: RfdWithRaw): Promise<RfdItem> {
  let content: DocumentBlock | undefined

  if (rfd.content) {
    const doc = ad.load(rfd.content, {
      ...attrs,
      attributes: {
        rfdnumber: rfd.rfdNumber,
      },
    })
    content = await handleDocument(doc)
  }

  return {
    number: rfd.rfdNumber,
    formattedNumber: rfd.rfdNumber.toString().padStart(4, '0'),
    title: rfd.title,
    state: rfd.state,
    link: rfd.link,
    discussion: rfd.discussion,
    authors: rfd.authors ? generateAuthors(rfd.authors) : [],
    labels: rfd.labels
      ? rfd.labels
          .split(',')
          .map((l) => l.trim())
          .filter((l) => !!l)
      : [],
    content: content,
    toc: content?.sections,
    sha: rfd.sha,
    commit: rfd.commit,
    committedAt: rfd.committedAt,
    visibility: rfd.visibility,
  }
}

function apiRfdMetaToListItem(rfd: RfdWithoutContent): RfdListItem {
  const authors = rfd.authors ? generateAuthors(rfd.authors) : []
  return {
    number: rfd.rfdNumber,
    formattedNumber: rfd.rfdNumber.toString().padStart(4, '0'),
    title: rfd.title,
    state: rfd.state,
    link: rfd.link,
    discussion: rfd.discussion,
    authors,
    formattedAuthors: rfd.authors || '',
    labels: rfd.labels
      ? rfd.labels
          .split(',')
          .map((l) => l.trim())
          .filter((l) => !!l)
      : [],
    sha: rfd.sha,
    commit: rfd.commit,
    committedAt: rfd.committedAt,
    visibility: rfd.visibility,
  }
}

async function localRfdToItem(rfd: LocalRfd): Promise<RfdItem> {
  let content: DocumentBlock | undefined

  if (rfd.content) {
    const doc = ad.load(rfd.content, {
      ...attrs,
      attributes: {
        rfdnumber: rfd.number,
      },
    })
    content = await handleDocument(doc)
  }

  return {
    number: rfd.number,
    formattedNumber: rfd.number.toString().padStart(4, '0'),
    title: rfd.title,
    state: rfd.state,
    content: content,
    toc: content?.sections,
    committedAt: rfd.committedAt,
    visibility: rfd.visibility,
  }
}

function localRfdToListItem(rfd: LocalRfd): RfdListItem {
  return {
    number: rfd.number,
    formattedNumber: rfd.number.toString().padStart(4, '0'),
    title: rfd.title,
    state: rfd.state,
    committedAt: rfd.committedAt,
    visibility: rfd.visibility,
  }
}

export type Author = {
  name: string
  email: string
}

export const generateAuthors = (authors: string): Author[] => {
  // Officially asciidoc uses the semicolon for multiple authors
  // we are using commas in most the documents I have seen
  // chose to parse both rather than update the RFDs since that would
  // be tedious work for little gain. This does means that a user cannot
  // mix both methods. But what kind of person would do such a thing.
  let splitChar = ','

  if (authors.includes(';')) {
    splitChar = ';'
  }

  let array = authors.split(splitChar).map((author) => {
    const regex = /<(.+)>/
    const matches = author.match(regex)
    const name = author.replace(regex, '').trim()
    const email = matches ? matches[1] : ''

    return { name, email }
  })

  // Remove extra items
  // Fixes empty item when a single author has a ; or , at the end
  return array.filter((author) => author.name !== '')
}
