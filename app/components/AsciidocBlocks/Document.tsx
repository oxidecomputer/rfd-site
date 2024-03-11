/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, you can obtain one at https://mozilla.org/MPL/2.0/.
 *
 * Copyright Oxide Computer Company
 */

import { Content, type AdocTypes } from '@oxide/react-asciidoc'
import { Link, useLocation } from '@remix-run/react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import tunnel from 'tunnel-rat'

import { isTruthy } from '~/utils/isTruthy'

import Container from '../Container'
import { GotoIcon } from '../CustomIcons'
import {
  DesktopOutline,
  generateTableOfContents,
  SmallScreenOutline,
  useActiveSectionTracking,
  useIntersectionObserver,
} from '../TableOfContents'

export const ui = tunnel()

const CustomDocument = ({ document }: { document: AdocTypes.Document }) => {
  const [titleEl, setTitleEl] = useState<HTMLHeadingElement | null>(null)
  const bodyRef = useRef<HTMLDivElement>(null)
  const [activeItem, setActiveItem] = useState('')

  const toc = useMemo(() => generateTableOfContents(document.getSections()), [document])

  const { pathname, hash } = useLocation()

  const onActiveElementUpdate = useCallback(
    (el: Element | null) => {
      setActiveItem(el?.id || '')
      // history.replaceState({}, '', el ? `#${el.id}` : window.location.pathname)
    },
    [setActiveItem],
  )

  // Connect handlers for managing the active (visible section) of the page
  const { setSections } = useActiveSectionTracking([], onActiveElementUpdate)

  // Add handler for resetting back to the empty state when the top of the page is reached.
  useIntersectionObserver(
    useMemo(() => [titleEl].filter(isTruthy), [titleEl]),
    useCallback(
      (entries) => entries[0].isIntersecting && onActiveElementUpdate(null),
      [onActiveElementUpdate],
    ),
    useMemo(() => ({ rootMargin: '0px 0px -80% 0px' }), []),
  )

  useEffect(() => {
    let headings = toc
      .filter((item) => item.level <= 2)
      .map((item) => {
        // wrap in try catch because sometimes heading IDs don't make valid
        // selectors, so rather than blowing up, we just ignore them
        try {
          return bodyRef.current?.querySelector(`#${item.id}`)
        } catch (e) {
          return null
        }
      })
      .filter(isTruthy)

    setSections(headings)
  }, [toc, setSections])

  const blocks = document.getBlocks()
  const title = (document.getDocumentTitle() || '').toString()

  const [footnotes, setFootnotes] = useState<AdocTypes.Document.Footnote[]>()

  useMemo(() => {
    if (blocks || blocks[0]) {
      setFootnotes(document.getFootnotes())
    }
  }, [document, blocks])

  const Footnotes = () => {
    if (!footnotes) return null

    if (
      footnotes.length > 0 &&
      blocks &&
      !blocks[0].getDocument().hasAttribute('nofootnotes')
    ) {
      return (
        <div id="footnotes" className="mt-12 border-t pt-4 border-secondary 800:mt-16">
          <Container isGrid>
            <div className="col-span-12 col-start-2 text-mono-xs text-quaternary 1200:col-span-2 1200:col-start-1">
              Footnotes
            </div>

            <ul
              id="footnotes"
              className="col-span-12 col-start-2 800:pr-16 1100:w-[calc(100%-var(--toc-width))] 1200:col-start-3"
            >
              {footnotes.map((footnote) => (
                <li
                  key={footnote.getIndex()}
                  id={`_footnotedef_${footnote.getIndex()}`}
                  className="relative mb-2"
                >
                  <div className="absolute -left-12 -top-[2px] flex flex-shrink-0 items-center justify-center rounded-full px-[4px] py-[2px] !tracking-normal text-mono-xs text-secondary bg-tertiary">
                    {footnote.getIndex()}
                  </div>
                  <div className="text-sans-md text-secondary">
                    <p
                      dangerouslySetInnerHTML={{ __html: footnote.getText() || '' }}
                      className="inline"
                    />{' '}
                    <Link
                      className="footnote group -m-2 whitespace-nowrap p-2 text-accent-tertiary group-hover:text-accent"
                      to={`#_footnoteref_${footnote.getIndex()}`}
                    >
                      <GotoIcon className="inline-block rotate-180" />
                      <span className="inline-block translate-x-0 opacity-0 transition-all group-hover:translate-x-1 group-hover:opacity-100">
                        View
                      </span>
                    </Link>
                  </div>
                </li>
              ))}
            </ul>
          </Container>
        </div>
      )
    } else {
      return null
    }
  }

  return (
    <>
      <Container className="mt-12 800:mt-16" isGrid>
        {/* 
          Blank element at the top of the page to use to reset 
          the selected section in the table of contents 
        */}
        <div
          ref={setTitleEl}
          className="absolute top-[calc(2rem+(var(--header-height)))]"
          aria-hidden
        />
        <div className="col-span-12 flex 800:col-span-10 800:col-start-2 1200:col-span-10 1200:col-start-3">
          <div
            id="content"
            ref={bodyRef}
            className="asciidoc-body max-w-full flex-shrink overflow-hidden 800:overflow-visible 800:pr-10 1100:w-[calc(100%-var(--toc-width))] 1200:pr-16"
          >
            <Content blocks={blocks} />
          </div>
          <div className="top-[calc(2rem+(var(--header-height)))] hidden max-h-[calc(100vh-(var(--header-height)+3rem))] w-[var(--toc-width)] flex-shrink-0 flex-grow overflow-auto 1100:sticky 1100:block">
            <ui.Out />
            <DesktopOutline toc={toc} activeItem={activeItem} />
          </div>
        </div>
      </Container>
      <Footnotes />
      <SmallScreenOutline
        key={pathname + hash}
        toc={toc}
        activeItem={activeItem}
        title={title}
      />
    </>
  )
}

export default CustomDocument
