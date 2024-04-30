/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, you can obtain one at https://mozilla.org/MPL/2.0/.
 *
 * Copyright Oxide Computer Company
 */

import {
  json,
  type LinksFunction,
  type LoaderArgs,
  type SerializeFrom,
  type V2_MetaFunction,
} from '@remix-run/node'
import {
  Links,
  LiveReload,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  useCatch,
  useLoaderData,
  useMatches,
  useRouteLoaderData,
} from '@remix-run/react'
import { withSentry } from '@sentry/remix'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

import type { Author } from '~/components/rfd/RfdPreview'
import { isAuthenticated } from '~/services/authn.server'
import {
  fetchRfds,
  findAuthors,
  findLabels,
  isLocalMode,
  provideNewRfdNumber,
  type RfdListItem,
} from '~/services/rfd.server'
import styles from '~/tailwind.css'

import LoadingBar from './components/LoadingBar'
import NotFound from './components/NotFound'
import { inlineCommentsCookie, themeCookie } from './services/cookies.server'

export const meta: V2_MetaFunction = () => {
  return [{ title: 'RFD / Oxide' }]
}

export const shouldRevalidate = () => false

export const links: LinksFunction = () => [{ rel: 'stylesheet', href: styles }]

export const loader = async ({ request }: LoaderArgs) => {
  let theme = (await themeCookie.parse(request.headers.get('Cookie'))) ?? 'dark-mode'
  let inlineComments =
    (await inlineCommentsCookie.parse(request.headers.get('Cookie'))) ?? true

  const user = await isAuthenticated(request)
  const rfds: RfdListItem[] = await fetchRfds(user)

  const authors: Author[] = rfds ? findAuthors(rfds) : []
  const labels: string[] = rfds ? findLabels(rfds) : []

  return json({
    // Any data added to the ENV key of this loader will be injected into the
    // global window object (window.ENV)
    ENV: {
      SENTRY_DSN: process.env.SENTRY_DSN,
    },
    theme,
    inlineComments,
    user,
    rfds,
    authors,
    labels,
    isLocalMode,
    newRfdNumber: provideNewRfdNumber([...rfds]),
  })
}

export function useRootLoaderData() {
  return useRouteLoaderData('root') as SerializeFrom<typeof loader>
}

// 404 Catch
export function CatchBoundary() {
  const caught = useCatch()

  if (caught.status === 404) {
    return <NotFound />
  }
}

const queryClient = new QueryClient()

export const Layout = ({
  children,
  theme,
}: {
  children: React.ReactNode
  theme?: string
}) => {
  const matches = useMatches()
  const section = matches[matches.length - 1].pathname.split('/')[1]

  return (
    <html lang="en" className={theme}>
      <head>
        <meta name="charset" content="utf-8" />
        <meta name="viewport" content="width=device-width,initial-scale=1" />
        <Meta />
        <Links />
        <link rel="icon" href="/favicon.svg" />
        <link rel="icon" type="image/png" href="/favicon.png" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        {/* Use plausible analytics only on Vercel */}
        {process.env.NODE_ENV === 'production' && (
          <script defer data-domain="rfd.shared.oxide.computer" src="/js/viewscript.js" />
        )}
      </head>
      <body className={section !== 'notes' ? 'mb-32' : ''}>
        {children}
        <ScrollRestoration />
        <Scripts />
        <LiveReload />
      </body>
    </html>
  )
}

function App() {
  const { theme, isLocalMode, ENV } = useLoaderData<typeof loader>()

  return (
    <Layout theme={theme}>
      <LoadingBar />
      <QueryClientProvider client={queryClient}>
        <Outlet />
        {isLocalMode && (
          <div className="overlay-shadow fixed bottom-6 left-6 z-10 rounded p-2 text-sans-sm text-notice bg-notice-secondary">
            Local authoring mode
          </div>
        )}
      </QueryClientProvider>
      <script
        dangerouslySetInnerHTML={{
          __html: `window.ENV = ${JSON.stringify(ENV)}`,
        }}
      />
    </Layout>
  )
}

export default withSentry(App)
