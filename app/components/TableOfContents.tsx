/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, you can obtain one at https://mozilla.org/MPL/2.0/.
 *
 * Copyright Oxide Computer Company
 */

import type { AdocTypes } from '@oxide/react-asciidoc'
import * as Accordion from '@radix-ui/react-accordion'
import { Link } from '@remix-run/react'
import cn from 'classnames'
import { useCallback, useEffect, useMemo, useState } from 'react'

import { isTruthy } from '~/utils/isTruthy'

import { stripAnchors } from './AsciidocBlocks/Section'
import Icon from './Icon'

// Create threshold steps that trigger intersection events every 0.5%. This is needed to provide
// decent measurements on very tall elements. In the future we could instead compute the needed
// thresholds on a per element basis so that we are measuring per pixel instead of per percent.
const THRESHOLD = [...Array(200).keys()].map((n) => n / 200)

// Uses the asciidoc generated classes to find the closest section wrapping parent element
function findParentSection(element: Element): Element | null {
  let sect2Wrapper = element.closest('.sect2')
  return sect2Wrapper ? sect2Wrapper : element.closest('.sect1')
}

export function useIntersectionObserver(
  elements: Element[],
  callback: IntersectionObserverCallback,
  options: IntersectionObserverInit,
) {
  let [observer, setObserver] = useState<IntersectionObserver | null>(null)

  // Create the observer in an effect so we can tear it down when this unmounts
  useEffect(() => {
    let observer = new IntersectionObserver(callback, options)
    setObserver(observer)

    return () => {
      observer.disconnect()
    }
  }, [callback, options])

  // Bind the elements that should be listened for
  useEffect(() => {
    if (observer) {
      for (let element of elements) {
        observer.observe(element)
      }
    }

    return () => {
      if (observer) {
        for (let element of elements) {
          observer.unobserve(element)
        }
      }
    }
  }, [elements, observer])

  return observer
}

// This hook will call the provided callback whenever a section that is identified by a heading is
// determined to be "active". There are three triggering rules for determining when a section
// activates:
//   1. A section header reaches an imaginary line that is 10% down the page
//   2. 90% of the top 50% of the page is covered a single section
//   3. A section is contained entirely in the top 50% of the page
//
// Two IntersectionObservers are used for tracking these conditions. One for tracking the first case,
// and a second for tracking the other two.
export function useActiveSectionTracking(
  initialSections: Element[],
  onSectionChange: (element: Element) => void,
) {
  let [sections, setSections] = useState<Element[]>([])
  let [sectionWrappers, setSectionWrappers] = useState<(Element | null)[]>(
    initialSections.map(findParentSection),
  )

  // The caller only provides the hook with section headers and so we need to map those to their
  // relevant containing sections
  useEffect(() => {
    setSectionWrappers(sections.map(findParentSection))
  }, [sections])

  // Create the heading tracker
  let headingActivator = useCallback(
    (entries: IntersectionObserverEntry[]) => {
      for (let entry of entries) {
        if (entry.isIntersecting) {
          onSectionChange(entry.target)
        }
      }
    },
    [onSectionChange],
  )

  // Imaginary 0px line at 10% from top the of the screen
  let headingSettings = useMemo(() => ({ rootMargin: `-10% 0px -90% 0px` }), [])
  useIntersectionObserver(sections, headingActivator, headingSettings)

  // Create the section tracker
  let wrapperActivator = useCallback(
    (entries: IntersectionObserverEntry[]) => {
      for (let entry of entries) {
        // Compute the screen space covered by this entry
        let covered = entry.intersectionRect.height / (entry.rootBounds?.height || 1)

        // If either this element is entirely encapsulated by the top 50% of the screen or it is
        // covering at least 90% of the top 50% of the screen then we consider the element active.
        // We specifically do not test for 100% coverage as we are not guaranteed to be given a
        // chance to measure at every percentage point. 90% seems to be a safe threshold, but could
        // likely use some tuning
        if (entry.intersectionRatio === 1 || covered >= 0.9) {
          // Map this section back to its relevant header to activate it
          let index = sectionWrappers.findIndex((wrapper) => wrapper === entry.target)
          onSectionChange(sections[index])
        }
      }
    },
    [sections, sectionWrappers, onSectionChange],
  )

  // Watch the top 50% of the screen, and measure the intersection every 0.5% (defined by THRESHOLD)
  let wrapperSettings = useMemo(
    () => ({ threshold: THRESHOLD, rootMargin: `0px 0px -50% 0px` }),
    [],
  )

  // We need to ensure that we are only sending valid sections to be observed
  let bindableWrappers = useMemo(() => sectionWrappers.filter(isTruthy), [sectionWrappers])

  useIntersectionObserver(bindableWrappers, wrapperActivator, wrapperSettings)

  return {
    setSections,
  }
}

export const generateTableOfContents = (sections: AdocTypes.Section[]) => {
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
}

const generateSection = (toc: TocItem[], section: AdocTypes.Section) => {
  toc.push({
    id: section.getId(),
    level: section.getLevel(),
    title: section.getTitle() || '',
  })

  if (section.hasSections()) {
    const sections = section.getSections()

    for (let section of sections) {
      generateSection(toc, section)
    }
  }
}

export const DesktopOutline = ({
  toc,
  activeItem,
}: {
  toc: TocItem[]
  activeItem: string
}) => {
  if (toc && toc.length > 0) {
    return (
      <ul className="hidden 1100:block">
        {toc.map((item) => (
          <li
            key={item.id}
            data-level={item.level}
            className={cn('mb-0 list-none text-sans-sm', item.level > 2 && 'hidden')}
          >
            <Link
              to={`#${item.id}`}
              className={cn(
                'block border-l py-[4px]',
                activeItem === item.id
                  ? 'text-accent-secondary border-accent-secondary hover:text-accent'
                  : 'text-quaternary border-secondary hover:text-tertiary',
              )}
              style={{
                paddingLeft: `${0.5 + item.level * 0.5}rem`,
              }}
            >
              <span dangerouslySetInnerHTML={{ __html: stripAnchors(item.title) }} />
            </Link>
          </li>
        ))}
      </ul>
    )
  }

  return null
}

export const SmallScreenOutline = ({
  toc,
  activeItem,
  title,
}: {
  toc: TocItem[]
  activeItem: string
  title: string
}) => {
  if (toc && toc.length > 0) {
    return (
      <Accordion.Root
        type="single"
        className="fixed bottom-0 left-0 right-0 z-10 mt-4 block max-h-[calc(100vh-var(--header-height)-2rem)] w-full overflow-y-auto border-b border-t bg-default border-secondary 1100:hidden print:hidden"
        collapsible
      >
        <Accordion.Item value={`small-toc-${title}`}>
          <Accordion.Header>
            <Accordion.Trigger className="flex w-full items-center justify-between px-4 py-4 text-sans-md text-secondary 400:px-6 600:px-8 600:hover:bg-hover [&>svg]:data-[state=open]:rotate-90">
              Table of Contents{' '}
              <Icon
                name="carat-right"
                size={12}
                className="transition-all text-quaternary"
              />
            </Accordion.Trigger>
          </Accordion.Header>

          <Accordion.Content className="AccordionContent hydrated w-full border-t px-4 border-secondary 400:px-6 600:px-8">
            <div className="py-4">
              {toc.map((item) => (
                <li
                  key={item.id}
                  data-level={item.level}
                  className={cn(
                    'AccordionContent hydrated list-none text-sans-sm',
                    item.level > 2 && 'hidden',
                  )}
                >
                  <Link
                    to={`#${item.id}`}
                    className={cn(
                      'block border-l py-[4px]',
                      activeItem === item.id
                        ? 'text-accent-secondary border-accent-secondary hover:text-accent'
                        : 'text-quaternary border-secondary hover:text-tertiary',
                    )}
                    style={{
                      paddingLeft: `${0.5 + item.level * 0.5}rem`,
                    }}
                  >
                    <span dangerouslySetInnerHTML={{ __html: item.title }} />
                  </Link>
                </li>
              ))}
            </div>
          </Accordion.Content>
        </Accordion.Item>
      </Accordion.Root>
    )
  }

  return null
}
