/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, you can obtain one at https://mozilla.org/MPL/2.0/.
 *
 * Copyright Oxide Computer Company
 */

import {
  type LinksFunction,
  type LoaderFunctionArgs,
  type MetaFunction,
  type SerializeFrom,
} from '@remix-run/node'
import {
  isRouteErrorResponse,
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  useLoaderData,
  useRouteError,
  useRouteLoaderData,
} from '@remix-run/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

import { auth, isAuthenticated } from '~/services/authn.server'
import styles from '~/styles/index.css?url'

import LoadingBar from './components/LoadingBar'
import { inlineCommentsCookie, themeCookie } from './services/cookies.server'
import { isLocalMode } from './services/rfd.local.server'
import {
  fetchRfds,
  getAuthors,
  getLabels,
  provideNewRfdNumber,
} from './services/rfd.server'

export const meta: MetaFunction = () => {
  return [{ title: 'RFD / Oxide' }]
}

export const links: LinksFunction = () => [{ rel: 'stylesheet', href: styles }]

export const loader = async ({ request }: LoaderFunctionArgs) => {
  let theme = (await themeCookie.parse(request.headers.get('Cookie'))) ?? 'dark-mode'
  let inlineComments =
    (await inlineCommentsCookie.parse(request.headers.get('Cookie'))) ?? true

  const user = await isAuthenticated(request)
  try {
    const rfds = (await fetchRfds(user)) || []

    const authors = rfds ? getAuthors(rfds) : []
    const labels = rfds ? getLabels(rfds) : []

    return {
      // Any data added to the ENV key of this loader will be injected into the
      // global window object (window.ENV)
      theme,
      inlineComments,
      user,
      rfds,
      authors,
      labels,
      localMode: isLocalMode(),
      newRfdNumber: provideNewRfdNumber([...rfds]),
    }
  } catch (err) {
    // The only error that should be caught here is the unauthenticated error.
    // And if that occurs we need to log the user out
    await auth.logout(request, { redirectTo: '/' })
  }

  // Convince remix that a return type will always be provided
  return {
    theme,
    inlineComments,
    user,
    rfds: [],
    authors: [],
    labels: [],
    localMode: isLocalMode(),
    newRfdNumber: undefined,
  }
}

export function useRootLoaderData() {
  return useRouteLoaderData('root') as SerializeFrom<typeof loader>
}

export function ErrorBoundary() {
  const error = useRouteError()

  let message = 'Something went wrong'

  if (isRouteErrorResponse(error)) {
    if (error.status === 404) {
      message = '404 Not Found'
    }
  }

  return (
    <Layout>
      <div className="flex h-full w-full items-center justify-center">
        <h1 className="text-2xl">{message}</h1>
      </div>
    </Layout>
  )
}
const queryClient = new QueryClient()

const Layout = ({ children, theme }: { children: React.ReactNode; theme?: string }) => (
  <html lang="en" className={theme}>
    <head>
      <meta charSet="utf-8" />
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
    <body className="mb-32">
      {children}
      <ScrollRestoration />
      <Scripts />
    </body>
  </html>
)

export default function App() {
  const { theme, localMode } = useLoaderData<typeof loader>()

  return (
    <Layout theme={theme}>
      <LoadingBar />
      <QueryClientProvider client={queryClient}>
        <Outlet />
        {localMode && (
          <div className="overlay-shadow fixed bottom-6 left-6 z-10 rounded p-2 text-sans-sm text-notice bg-notice-secondary">
            Local authoring mode
          </div>
        )}
      </QueryClientProvider>
    </Layout>
  )
}
