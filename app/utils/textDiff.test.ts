/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, you can obtain one at https://mozilla.org/MPL/2.0/.
 *
 * Copyright Oxide Computer Company
 */

import { describe, expect, test } from 'vitest'

import { diffPatch, diffPatchBySeparator } from './textDiff'

describe('diffPatch', () => {
  test('identical strings produce no markup', () => {
    expect(diffPatch('hello', 'hello')).toEqual({ before: 'hello', after: 'hello' })
  })

  test('pure insertion only marks the after', () => {
    expect(diffPatch('', 'abc')).toEqual({ before: '', after: '<ins>abc</ins>' })
  })

  test('pure deletion only marks the before', () => {
    expect(diffPatch('abc', '')).toEqual({ before: '<del>abc</del>', after: '' })
  })

  test('mixed edit marks the differing runs on each side', () => {
    expect(diffPatch('cat', 'car')).toEqual({
      before: 'ca<del>t</del>',
      after: 'ca<ins>r</ins>',
    })
  })

  test('empty inputs return empty strings', () => {
    expect(diffPatch('', '')).toEqual({ before: '', after: '' })
    expect(diffPatch()).toEqual({ before: '', after: '' })
  })

  test('equal runs are shared between before and after', () => {
    const { before, after } = diffPatch('the quick fox', 'the slow fox')
    expect(before).toBe('the <del>quick</del> fox')
    expect(after).toBe('the <ins>slow</ins> fox')
  })
})

describe('diffPatchBySeparator', () => {
  test('identical inputs round-trip unchanged', () => {
    expect(diffPatchBySeparator('a,b,c', 'a,b,c')).toEqual({
      before: 'a,b,c',
      after: 'a,b,c',
    })
  })

  test('word-level diff with space separator', () => {
    expect(diffPatchBySeparator('the quick brown fox', 'the slow brown fox', ' ')).toEqual(
      {
        before: 'the <del>quick</del> brown fox',
        after: 'the <ins>slow</ins> brown fox',
      },
    )
  })

  test('defaults to comma separator', () => {
    expect(diffPatchBySeparator('a,b,c', 'a,x,c')).toEqual({
      before: 'a,<del>b</del>,c',
      after: 'a,<ins>x</ins>,c',
    })
  })

  test('pure insertion of a segment', () => {
    expect(diffPatchBySeparator('a b', 'a b c', ' ')).toEqual({
      before: 'a b',
      after: 'a b <ins>c</ins>',
    })
  })

  test('pure deletion of a segment', () => {
    expect(diffPatchBySeparator('a b c', 'a b', ' ')).toEqual({
      before: 'a b <del>c</del>',
      after: 'a b',
    })
  })

  test('empty inputs return empty strings', () => {
    expect(diffPatchBySeparator('', '', ' ')).toEqual({ before: '', after: '' })
  })

  test('segments missing from the other side are marked on their own side only', () => {
    const { before, after } = diffPatchBySeparator('a b c d', 'a x c y', ' ')
    expect(before).toBe('a <del>b</del> c <del>d</del>')
    expect(after).toBe('a <ins>x</ins> c <ins>y</ins>')
  })

  test('empty segments from repeated separators are preserved without markup', () => {
    expect(diffPatchBySeparator('a  b', 'a  b', ' ')).toEqual({
      before: 'a  b',
      after: 'a  b',
    })
  })
})
