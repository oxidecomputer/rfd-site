/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, you can obtain one at https://mozilla.org/MPL/2.0/.
 *
 * Copyright Oxide Computer Company
 */

import fs from 'fs'

import { isTruthy } from '~/utils/isTruthy'
import { parseRfdNum } from '~/utils/parseRfdNum'

const localRepo = process.env.LOCAL_RFD_REPO

export type LocalRfd = {
  number: number
  title: string
  state: string
  content: string
  committedAt: Date
  visibility: 'private'
}

export function isLocalMode(): boolean {
  return process.env.NODE_ENV === 'development' && !!localRepo
}

function findLineStartingWith(content: string, prefixRegex: string): string | undefined {
  // (^|\n) is required to match either the first line (beginning of file) or
  // subsequent lines
  return content.match(RegExp('(^|\n)' + prefixRegex + ' *([^\n]+)\n'))?.[2]
}

export function fetchLocalRfd(num: number): LocalRfd {
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
      number: num,
      title: title,
      state: state,
      content,
      committedAt: new Date(0),
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

export function fetchLocalRfds(): LocalRfd[] {
  const rfdDir = `${process.env.LOCAL_RFD_REPO}/rfd`

  const rfds = fs
    .readdirSync(rfdDir)
    .map((numStr) => {
      const num = parseRfdNum(numStr)
      if (!num) return null
      try {
        return fetchLocalRfd(num) // will throw on errors, hence the try/catch
      } catch {
        return null
      }
    })
    .filter(isTruthy)
    .reverse() // sort by highest number first since we don't have dates

  return rfds
}
