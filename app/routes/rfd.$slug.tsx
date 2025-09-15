/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, you can obtain one at https://mozilla.org/MPL/2.0/.
 *
 * Copyright Oxide Computer Company
 */
import {
  DesktopOutline,
  SmallScreenOutline,
  useActiveSectionTracking,
  useDelegatedReactRouterLinks,
  useIntersectionObserver,
} from '@oxide/design-system/components'
import { Asciidoc, type DocumentBlock, type DocumentSection } from '@oxide/react-asciidoc'
import { redirect, type LoaderFunctionArgs, type MetaFunction } from '@remix-run/node'
import { Await, useLoaderData, useLocation, useNavigate } from '@remix-run/react'
import cn from 'classnames'
import dayjs from 'dayjs'
import {
  Fragment,
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import { flat } from 'remeda'

import { opts } from '~/components/AsciidocBlocks'
import Footnotes from '~/components/AsciidocBlocks/Footnotes'
import { ClientOnly } from '~/components/ClientOnly'
import Container from '~/components/Container'
import Header from '~/components/Header'
import AccessWarning from '~/components/rfd/AccessWarning'
import MoreDropdown from '~/components/rfd/MoreDropdown'
import RfdDiscussionDialog, { CommentCount } from '~/components/rfd/RfdDiscussionDialog'
import RfdInlineComments from '~/components/rfd/RfdInlineComments'
import RfdPreview from '~/components/rfd/RfdPreview'
import StatusBadge from '~/components/StatusBadge'
import { useRootLoaderData } from '~/root'
import { authenticate } from '~/services/auth.server'
import { fetchDiscussion } from '~/services/github-discussion.server'
import { fetchGroups, fetchRfd } from '~/services/rfd.server'
import { parseRfdNum } from '~/utils/parseRfdNum'
import { can } from '~/utils/permission'

function isValue<T>(item: T | null | undefined): item is T {
  return !!item
}

const flattenSections = (sections: DocumentSection[]): DocumentSection[] => {
  return flat(
    sections.map((section) => [section, ...flattenSections(section.sections || [])]),
  )
}

export const resp404 = () => new Response('Not Found', { status: 404 })

/**
 * Fetch RFD, accounting for the possibility of the RFD being public.
 *
 * |             | oxide user | other user  | no user        |
 * | ----------- | ---------- | ----------- | -------------- |
 * | private rfd | full view  | 404         | login redirect |
 * | public rfd  | full view  | public view | public view    |
 * | no rfd      | 404        | 404         | login redirect |
 *
 */
export async function loader({ request, params: { slug } }: LoaderFunctionArgs) {
  const num = parseRfdNum(slug)
  if (!num) throw resp404()

  const user = await authenticate(request)

  const rfd = await fetchRfd(num, user)

  // If someone goes to a private RFD but they're not logged in, they will
  // want to log in and see it.
  if (!rfd && !user) throw redirect(`/login?returnTo=/rfd/${num}`)

  // If you don't see an RFD but you are logged in, you can't tell whether you
  // don't have access or it doesn't exist. That's fine.
  if (!rfd) throw resp404()

  // We want to provide an indicator to the user of the groups that have access
  // to the RFD that they are reading. This list displayed though is not
  // necessarily exhaustive. The permissions assigned to this user will determine
  // which groups they are allowed to list. The list returned from the API is
  // then filtered down to include only the groups that provide access to this RFD.
  const groups = (await fetchGroups(user))
    .filter((group) => can(group.permissions, { GetRfd: num }))
    .map((g) => g.name)

  // Currently the RFD API does not have a "public" group. Instead the "public"
  // setting of an RFD is controlled by the visibility flag. To make this consistent
  // with the previous experience, if an RFD is public we add a fake group to
  // the display list
  if (rfd.visibility === 'public') {
    groups.unshift('public')
  }

  return {
    rfd,
    groups,
    // this must not be awaited, it is being deferred
    discussionPromise: fetchDiscussion(num, rfd?.discussion, user),
  }
}

export const meta: MetaFunction<typeof loader> = ({ data }) => {
  if (data && data.rfd) {
    return [{ title: `${data.rfd.number} - ${data.rfd.title} / RFD / Oxide` }]
  } else {
    return [{ title: 'Page not found / Oxide' }]
  }
}

export default function Rfd() {
  const { pathname, hash } = useLocation()

  const { rfd, groups, discussionPromise } = useLoaderData<typeof loader>()
  const { number, title, state, authors, labels, latestMajorChangeAt, content } = rfd

  const { user, inlineComments } = useRootLoaderData()

  // This check is merely cosmetic. It hides UI elements that the user does not have access to and
  // which will fail if they try to use
  const userIsInternal = user?.groups.some((group) => group === 'oxide-employee')

  const bodyRef = useRef<HTMLDivElement>(null)
  const [activeItem, setActiveItem] = useState('')

  const onActiveElementUpdate = useCallback(
    (el: Element | null) => {
      setActiveItem(el?.id || '')
    },
    [setActiveItem],
  )

  // Connect handlers for managing the active (visible section) of the page
  const { setSections } = useActiveSectionTracking([], onActiveElementUpdate)

  // Add handler for resetting back to the empty state when the top of the page is reached.
  useIntersectionObserver(
    useMemo(
      () =>
        typeof document !== 'undefined'
          ? [document.querySelector('h1')].filter(isValue)
          : [],
      [],
    ),
    useCallback(
      (entries) => entries[0].isIntersecting && onActiveElementUpdate(null),
      [onActiveElementUpdate],
    ),
    useMemo(() => ({ rootMargin: '0px 0px -80% 0px' }), []),
  )

  useEffect(() => {
    if (content?.sections) {
      let headings = flattenSections(content.sections)
        .filter((item) => item.level <= 2)
        .map((item) => document.getElementById(item.id))
        .filter(isValue)

      setSections(headings)
    }
  }, [content?.sections, setSections])

  const navigate = useNavigate()
  const containerRef = useRef<HTMLDivElement>(null)
  useDelegatedReactRouterLinks(navigate, containerRef, title || '')

  return (
    <div ref={containerRef}>
      {/* key makes the search dialog close on selection */}
      <Header currentRfd={rfd} key={pathname + hash} />
      <main className="relative mt-12 800:mt-16 print:mt-0">
        {inlineComments && (
          <Suspense fallback={null}>
            <Await resolve={discussionPromise} errorElement={<></>}>
              {(discussion) => <RfdInlineComments comments={discussion?.comments || []} />}
            </Await>
          </Suspense>
        )}
        <RfdPreview currentRfd={number} />
        <Container isGrid className="page-header mb-12 800:mb-16">
          {state && (
            <div className="flex 800:col-start-2 1200:col-start-3 print:hidden">
              <a href={rfd.discussion || ''} target="_blank" rel="noreferrer">
                <StatusBadge label={state} />
              </a>
            </div>
          )}

          <div className="col-span-12 grid grid-cols-12 items-baseline">
            <div className="hidden text-sans-lg text-accent-tertiary 800:col-span-1 800:block 1200:col-span-2 print:hidden">
              <span className="hidden 1200:inline">RFD</span> {number}
            </div>
            <div className="col-span-12 flex items-baseline 800:col-span-11 1200:col-span-10">
              <h1 className="w-full pr-4 text-sans-2xl text-balance text-raise 600:pr-10 800:text-sans-3xl 1200:w-[calc(100%-var(--toc-width))] 1200:pr-16 print:pr-0 print:text-center">
                <span className="hidden print:block">RFD {number}</span> {title}
              </h1>
              {userIsInternal && (
                <div className="print:hidden">
                  <MoreDropdown />
                </div>
              )}
            </div>
            <AccessWarning groups={groups} />
          </div>
        </Container>
        <div className="border-b border-secondary print:m-auto print:max-w-1200 print:rounded-lg print:border">
          {state && (
            <PropertyRow
              label="State"
              className="hidden capitalize print:block print:border-t-0"
            >
              {state}
            </PropertyRow>
          )}
          <PropertyRow label="RFD" className="800:hidden print:hidden">
            {number.toString()}
          </PropertyRow>
          {authors && authors.length > 0 && (
            <PropertyRow label="Authors">
              <div>
                {authors.map((author, index) => (
                  <Fragment key={author.name}>
                    <a
                      className={cn(
                        'link-with-underline inline-block',
                        !author.email && 'pointer-events-none',
                      )}
                      href={
                        author.email
                          ? `/?authorEmail=${author.email}&authorName=${author.name}`
                          : ''
                      }
                    >
                      {author.name}
                      {index < authors.length - 1 && ', '}
                    </a>{' '}
                  </Fragment>
                ))}
              </div>
            </PropertyRow>
          )}
          {labels && labels.length > 0 && (
            <PropertyRow label="Labels">
              <div>
                {labels.map((label, index) => (
                  <Fragment key={label}>
                    <a
                      className="link-with-underline inline-block"
                      href={`/?label=${label.trim()}`}
                    >
                      {label.trim()}
                      {index < labels.length - 1 && ', '}
                    </a>{' '}
                  </Fragment>
                ))}
              </div>
            </PropertyRow>
          )}
          <PropertyRow label="Updated">
            <ClientOnly fallback={<div className="h-4 w-32 rounded bg-tertiary" />}>
              {() => <>{dayjs(latestMajorChangeAt).format('MMM D YYYY, h:mm A')}</>}
            </ClientOnly>
          </PropertyRow>
        </div>

        <Container className="mt-12 800:mt-16" isGrid>
          <div
            className="col-span-12 flex 800:col-span-10 800:col-start-2 1200:col-span-10 1200:col-start-3"
            ref={bodyRef}
          >
            <Asciidoc document={content as DocumentBlock} options={opts} />
            <div className="top-[calc(2rem+(var(--header-height)))] hidden max-h-[calc(100vh-(var(--header-height)+3rem))] w-(--toc-width) shrink-0 grow overflow-auto 1200:sticky 1200:block print:hidden">
              <Suspense
                fallback={<CommentCount isLoading={true} count={0} onClick={() => {}} />}
              >
                <Await
                  resolve={discussionPromise}
                  errorElement={
                    <CommentCount
                      error={true}
                      isLoading={false}
                      count={0}
                      onClick={() => {}}
                    />
                  }
                >
                  {(discussion) => {
                    if (!discussion) {
                      return <></>
                    }

                    const { reviews, comments, pullNumber, prComments } = discussion

                    return (
                      <>
                        {title && comments && reviews && pullNumber ? (
                          <RfdDiscussionDialog
                            rfdNumber={number}
                            title={title}
                            pullNumber={pullNumber}
                            comments={comments}
                            prComments={prComments}
                            reviews={reviews}
                          />
                        ) : null}
                      </>
                    )
                  }}
                </Await>
              </Suspense>
              {content && (
                <DesktopOutline
                  toc={content.sections}
                  activeItem={activeItem}
                  className="hidden 1200:block"
                />
              )}
            </div>
          </div>
        </Container>
        <Footnotes doc={content as DocumentBlock} />
      </main>
      <div className="fixed inset-x-0 bottom-0 [&>*]:mb-0">
        {content && (
          <SmallScreenOutline
            toc={content.sections}
            activeItem={activeItem}
            className="block 1200:hidden"
            key={pathname}
          />
        )}
      </div>
    </div>
  )
}

const PropertyRow = ({
  label,
  children,
  className,
}: {
  label: string
  children: JSX.Element | string
  className?: string
}) => (
  <div
    className={cn(
      'w-full border-t py-3 border-secondary print:py-2 print:border-default',
      className,
    )}
  >
    <Container isGrid>
      <div className="relative col-span-4 text-mono-sm text-tertiary 800:col-span-1 1200:col-span-2 print:col-span-2 print:text-raise">
        <div className="hidden print:block absolute -bottom-2 -top-2 right-0 w-px border-default border-r" />
        {label}
      </div>
      <div className="col-span-8 text-sans-md text-default 800:col-span-9 1200:col-span-8 print:col-span-10">
        {children}
      </div>
    </Container>
  </div>
)
