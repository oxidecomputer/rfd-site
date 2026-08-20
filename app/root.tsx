/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, you can obtain one at https://mozilla.org/MPL/2.0/.
 *
 * Copyright Oxide Computer Company
 */

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
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
  type LinksFunction,
  type LoaderFunctionArgs,
  type MetaFunction,
  type ShouldRevalidateFunctionArgs,
} from 'react-router'

// import { auth, isAuthenticated } from '~/services/authn.server'
import styles from '~/styles/index.css?url'

import LoadingBar from './components/LoadingBar'
import RouteAnnouncer from './components/RouteAnnouncer'
import { authenticate, logoutOnAuthError } from './services/auth.server'
import { inlineCommentsCookie } from './services/cookies.server'
import { isLocalMode } from './services/rfd.local.server'
import {
  fetchRfds,
  getAuthors,
  getLabels,
  provideNewRfdNumber,
} from './services/rfd.server'
import { useApplyTheme } from './stores/theme'
import { buildMeta } from './utils/meta'

export const meta: MetaFunction = () =>
  buildMeta({
    title: 'RFD | Oxide',
    description: 'Browse and search Oxide Computer Company Requests for Discussion (RFDs).',
    path: '/',
  })

export const links: LinksFunction = () => [{ rel: 'stylesheet', href: styles }]

export const loader = async ({ request, url }: LoaderFunctionArgs) => {
  const inlineComments =
    (await inlineCommentsCookie.parse(request.headers.get('Cookie'))) ?? true

  const user = await authenticate(request)

  // If the API rejects the session's token (e.g. it predates an API upgrade),
  // clear the session and reload this URL logged out. Without this, a user
  // with a dead token sees 404s everywhere — including on public RFDs — and
  // /login bounces them away because a session cookie still exists.
  const rfds = (await logoutOnAuthError(request, url, () => fetchRfds(user))) || []

  return {
    inlineComments,
    user,
    rfds,
    authors: getAuthors(rfds),
    labels: getLabels(rfds),
    localMode: isLocalMode(),
    newRfdNumber: provideNewRfdNumber([...rfds]),
  }
}

export function shouldRevalidate({
  currentUrl,
  nextUrl,
  formMethod,
  defaultShouldRevalidate,
}: ShouldRevalidateFunctionArgs) {
  // Skip revalidation when only search params change on the same path
  // (e.g. filter changes). Form submissions still revalidate.
  if (!formMethod && currentUrl.pathname === nextUrl.pathname) {
    return false
  }
  return defaultShouldRevalidate
}

export function useRootLoaderData() {
  return useRouteLoaderData('root') as ReturnType<typeof useLoaderData<typeof loader>>
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
      {/* id and tabIndex make this the skip link and route announcer target */}
      <main
        id="content"
        tabIndex={-1}
        className="flex h-full w-full items-center justify-center outline-none"
      >
        <h1 className="text-2xl">{message}</h1>
      </main>
    </Layout>
  )
}
const queryClient = new QueryClient()

// Set theme before first paint to prevent flash of wrong color scheme.
// Mirrors logic in app/stores/theme.ts — must stay in sync.
const themeInitScript = `(function(){try{var p=localStorage.getItem('theme-preference');if(p!=='dark'&&p!=='light'&&p!=='system')p='dark';var r=p==='system'?(matchMedia('(prefers-color-scheme: light)').matches?'light':'dark'):p;document.documentElement.dataset.theme=r;}catch(_){document.documentElement.dataset.theme='dark';}})();`

const Layout = ({ children }: { children: React.ReactNode }) => (
  <html lang="en" suppressHydrationWarning>
    <head>
      <meta charSet="utf-8" />
      <meta name="viewport" content="width=device-width,initial-scale=1" />
      <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      <Meta />
      <Links />
      <link rel="icon" href="/favicon.svg" />
      <link rel="icon" type="image/png" href="/favicon.png" />
      <meta name="viewport" content="width=device-width, initial-scale=1" />
      <meta name="color-scheme" content="dark light" />
      {/* Use plausible analytics only on Vercel */}
      {process.env.NODE_ENV === 'production' && (
        <script defer data-domain="rfd.shared.oxide.computer" src="/js/viewscript.js" />
      )}
    </head>
    <body className="mb-32">
      <a
        href="#content"
        className="text-sans-md text-raise bg-tertiary sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 focus:rounded focus:p-3"
      >
        Skip to content
      </a>
      <div className="root">{children}</div>
      <ScrollRestoration />
      <Scripts />
    </body>
  </html>
)

export default function App() {
  useApplyTheme()
  const { localMode } = useLoaderData<typeof loader>()

  return (
    <Layout>
      <LoadingBar />
      <QueryClientProvider client={queryClient}>
        <Outlet />
        {localMode && (
          <div className="shadow-border-small text-sans-sm text-notice bg-notice fixed bottom-6 left-6 z-10 rounded p-2">
            Local authoring mode
          </div>
        )}
      </QueryClientProvider>
      <RouteAnnouncer />
    </Layout>
  )
}
