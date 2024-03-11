/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, you can obtain one at https://mozilla.org/MPL/2.0/.
 *
 * Copyright Oxide Computer Company
 */

import Asciidoc, { asciidoctor, type AdocTypes } from '@oxide/react-asciidoc'
import {
  defer,
  redirect,
  Response,
  type LoaderArgs,
  type V2_MetaFunction,
} from '@remix-run/node'
import { Await, useLoaderData, useLocation } from '@remix-run/react'
import cn from 'classnames'
import dayjs from 'dayjs'
import { Fragment, Suspense, useMemo, useState } from 'react'
import { renderToString } from 'react-dom/server'
import { ClientOnly } from 'remix-utils'

import { convertInlineQuoted, opts, ui } from '~/components/AsciidocBlocks'
import Image from '~/components/AsciidocBlocks/Image'
import Container from '~/components/Container'
import Header from '~/components/Header'
import AccessWarning from '~/components/rfd/AccessWarning'
import styles from '~/components/rfd/index.css'
import MoreDropdown from '~/components/rfd/MoreDropdown'
import RfdDiscussionDialog, { CommentCount } from '~/components/rfd/RfdDiscussionDialog'
import RfdInlineComments from '~/components/rfd/RfdInlineComments'
import RfdPreview from '~/components/rfd/RfdPreview'
import StatusBadge from '~/components/StatusBadge'
import { useRootLoaderData } from '~/root'
import { isAuthenticated } from '~/services/authn.server'
import { fetchDiscussion, fetchGroups, fetchRfd } from '~/services/rfd.server'
import { parseRfdNum } from '~/utils/parseRfdNum'
import { can } from '~/utils/permission'

const ad = asciidoctor()

class InlineConverter {
  baseConverter: AdocTypes.Html5Converter

  constructor() {
    this.baseConverter = new ad.Html5Converter()
  }

  convert(node: AdocTypes.Block, transform: string) {
    switch (node.getNodeName()) {
      case 'inline_image':
        return renderToString(<Image node={node} hasLightbox={false} />)
      case 'image':
        return renderToString(<Image node={node} hasLightbox={false} />)
      case 'inline_quoted':
        return convertInlineQuoted(node as unknown as AdocTypes.Inline) // We know this is always inline
      default:
        break
    }

    return this.baseConverter.convert(node, transform)
  }
}

ad.ConverterFactory.register(new InlineConverter(), ['html5'])

export const links = () => [{ rel: 'stylesheet', href: styles }]

const resp404 = () => new Response('Not Found', { status: 404 })

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
export async function loader({ request, params: { slug } }: LoaderArgs) {
  const num = parseRfdNum(slug)
  if (!num) throw resp404()

  const user = await isAuthenticated(request)

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
    .filter((group) => can(group.permissions, { k: 'ReadRfd', v: num }))
    .map((g) => g.name)

  // Currently the RFD API does not have a "public" group. Instead the "public"
  // setting of an RFD is controlled by the visibility flag. To make this consistent
  // with the previous experience, if an RFD is public we add a fake group to
  // the display list
  if (rfd.visibility === 'public') {
    groups.unshift('public')
  }

  return defer({
    rfd,
    groups,
    // this must not be awaited, it is being deferred
    discussionPromise: fetchDiscussion(rfd?.discussion_link, user),
  })
}

export const meta: V2_MetaFunction<typeof loader> = ({ data }) => {
  if (data && data.rfd) {
    return [{ title: `${data.rfd.number} - ${data.rfd.title} / RFD / Oxide` }]
  } else {
    return [{ title: 'Page not found / Oxide' }]
  }
}

export default function Rfd() {
  const { pathname, hash } = useLocation()

  const [confidential, setConfidential] = useState<Boolean>(false)

  const { rfd, groups, discussionPromise } = useLoaderData<typeof loader>()
  const {
    rfd: { number, title, state, authors, labels, commit_date, content },
  } = useLoaderData<typeof loader>()

  const doc = useMemo(() => {
    return ad.load(content, {
      standalone: true,
      sourcemap: true,
      attributes: {
        sectlinks: 'true',
        icons: 'font',
        rfdnumber: number,
        stem: 'latexmath',
        xrefstyle: 'basic',
      },
    })
  }, [number, content])

  const { user, inlineComments } = useRootLoaderData()

  // This check is merely cosmetic. It hides UI elements that the user does not have access to and
  // which will fail if they try to use
  const userIsInternal = user?.groups.some((group) => group === 'oxide-employee')

  return (
    <>
      {/* key makes the search dialog close on selection */}
      <Header currentRfd={rfd} key={pathname + hash} />
      <main className="relative mt-12 800:mt-16 print:mt-0">
        <ui.In>
          <Suspense
            fallback={<CommentCount isLoading={true} count={0} onClick={() => {}} />}
          >
            <Await
              resolve={discussionPromise}
              errorElement={
                <CommentCount error={true} isLoading={false} count={0} onClick={() => {}} />
              }
            >
              {(discussion) => {
                if (!discussion) {
                  return <></>
                }

                const { reviews, comments, pullNumber, prComments } = discussion

                return (
                  <>
                    {comments && reviews && pullNumber ? (
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
        </ui.In>
        {inlineComments && (
          <Suspense fallback={null}>
            <Await resolve={discussionPromise} errorElement={<></>}>
              {(discussion) => <RfdInlineComments comments={discussion?.comments || []} />}
            </Await>
          </Suspense>
        )}
        <RfdPreview currentRfd={number} />
        <Container isGrid className="page-header mb-12 800:mb-16">
          <div className="flex 800:col-start-2 1200:col-start-3 print:hidden">
            <a href={rfd.discussion_link || ''} target="_blank" rel="noreferrer">
              <StatusBadge label={state} />
            </a>
          </div>

          <div className="col-span-12 grid grid-cols-12 items-baseline">
            <div className="hidden text-sans-lg text-accent-tertiary 800:col-span-1 800:block 1200:col-span-2">
              <span className="hidden 1200:inline">RFD</span> {number}
            </div>
            <div className="col-span-12 flex items-baseline 800:col-span-11 1100:col-span-10">
              <h1 className="w-full pr-4 text-sans-2xl 600:pr-10 800:text-sans-3xl 1100:w-[calc(100%-var(--toc-width))] 1200:pr-16">
                {title}
              </h1>
              {userIsInternal && (
                <div className="print:hidden">
                  <MoreDropdown
                    setConfidential={setConfidential}
                    confidential={confidential}
                  />
                </div>
              )}
            </div>
            <AccessWarning groups={groups} />
          </div>
        </Container>

        <div className="border-b border-secondary print:border-0">
          <PropertyRow label="State" className="hidden capitalize print:block">
            {state}
          </PropertyRow>
          <PropertyRow label="RFD" className="800:hidden">
            {number.toString()}
          </PropertyRow>
          {authors.length > 0 && (
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
          {labels.length > 0 && (
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
              {() => <>{dayjs(commit_date).format('MMM D YYYY, h:mm A')}</>}
            </ClientOnly>
          </PropertyRow>
        </div>

        <Asciidoc content={doc} options={opts} />
      </main>
      {(confidential || !userIsInternal) && (
        <div className="fixed top-1/2 left-1/2 hidden w-full -translate-x-1/2 -translate-y-1/2 rotate-45 text-[3rem] opacity-20 print:block">
          <div>Oxide Confidential Information</div>
        </div>
      )}
    </>
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
      'w-full border-t py-3 border-secondary print:border-0 print:py-2',
      className,
    )}
  >
    <Container isGrid>
      <div className="col-span-4 text-mono-sm text-quaternary 800:col-span-1 1200:col-span-2 print:col-span-2">
        {label}
      </div>
      <div className="col-span-8 text-sans-md text-secondary 800:col-span-9 1200:col-span-8 print:col-span-10">
        {children}
      </div>
    </Container>
  </div>
)
