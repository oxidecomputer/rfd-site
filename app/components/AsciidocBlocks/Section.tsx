/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, you can obtain one at https://mozilla.org/MPL/2.0/.
 *
 * Copyright Oxide Computer Company
 */

import type { Section as SectionType } from '@asciidoctor/core'
import { Content, getRole, parse } from '@oxide/react-asciidoc'
import cn from 'classnames'
import { createElement } from 'react'

import Icon from '../Icon'

// We need to remove anchors from the section title (and table of contents) because having
// an anchor within an anchor causes a client/server render mismatch
export const stripAnchors = (str: string) => str.replace(/<a[^>]*>(.*?)<\/a>/gi, '$1')

const Section = ({ node }: { node: SectionType }) => {
  const docAttrs = node.getDocument().getAttributes()
  const level = node.getLevel()
  let title: JSX.Element | string = ''

  let sectNum = node.getSectionNumeral()
  sectNum = sectNum === '.' ? '' : sectNum

  const hasSectLinks = docAttrs['sectlinks'] === true || docAttrs['sectlinks'] === 'true'
  const hasSectNums = docAttrs['sectnums'] === true || docAttrs['sectnums'] === 'true'

  const sectNumLevels = docAttrs['sectnumlevels'] ? parseInt(docAttrs['sectnumlevels']) : 3

  if (node.getCaption()) {
    title = node.getCaptionedTitle()
  } else if (node.isNumbered() && level <= sectNumLevels) {
    if (level < 2 && node.getDocument().getDoctype() === 'book') {
      const sectionName = node.getSectionName()
      if (sectionName === 'chapter') {
        const signifier = docAttrs['chapter-signifier']
        title = `${signifier || ''} ${sectNum} ${node.getTitle()}`
      } else if (sectionName === 'part') {
        const signifier = docAttrs['part-signifier']
        title = `${signifier || ''} ${sectNum} ${node.getTitle()}`
      } else {
        title = node.getTitle() || ''
      }
    } else {
      title = node.getTitle() || ''
    }
  } else {
    title = node.getTitle() || ''
  }

  title = (
    <>
      {/* eslint-disable-next-line jsx-a11y/anchor-is-valid, jsx-a11y/anchor-has-content */}
      <a className="anchor" id={node.getId() || ''} aria-hidden="true" />
      {hasSectLinks ? (
        <a className="link group" href={`#${node.getId()}`}>
          {parse(stripAnchors(title))}
          <Icon
            name="link"
            size={16}
            className="ml-2 hidden text-accent-secondary group-hover:inline-block"
          />
        </a>
      ) : (
        parse(stripAnchors(title))
      )}
    </>
  )

  if (level === 0) {
    const h1Props = {
      className: cn('sect0', getRole(node)),
      ...(hasSectNums && { 'data-sectnum': sectNum }), // Conditionally add data-sectnum
    }
    return (
      <>
        <h1 {...h1Props}>{title}</h1>
        <Content blocks={node.getBlocks()} />
      </>
    )
  } else {
    const elementProps = {
      ...(hasSectNums && { 'data-sectnum': sectNum }), // Conditionally add data-sectnum
    }

    return (
      <div className={cn(`sect${level}`, getRole(node))}>
        {createElement(`h${level + 1}`, elementProps, title)}
        <div className="sectionbody">
          <Content blocks={node.getBlocks()} />
        </div>
      </div>
    )
  }
}

export default Section
