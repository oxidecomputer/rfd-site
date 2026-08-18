/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, you can obtain one at https://mozilla.org/MPL/2.0/.
 *
 * Copyright Oxide Computer Company
 */

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useEffect, useRef, useState } from 'react'
import {
  isRouteErrorResponse,
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  useLoaderData,
  useLocation,
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

/**
 * A real page load tells a screen reader where it landed: the new page gets
 * announced and the reading position goes back to the top. A client-side nav
 * does neither — React Router swaps the DOM in place and focus stays on the
 * link that was clicked, which usually isn't in the document anymore. Next.js
 * ships a route announcer for this; React Router leaves it to the app.
 *
 * So on every page change we do it ourselves: announce the new page in a
 * visually hidden live region, and move focus to the top of the content, which
 * is where the skip link points too. Gatsby's user testing with screen reader
 * users recommends this announce + move-focus combination:
 * https://www.gatsbyjs.com/blog/2019-07-11-user-testing-accessible-client-routing/
 * https://github.com/vercel/next.js/blob/08b1916/packages/next/src/client/route-announcer.tsx
 */
const RouteAnnouncer = () => {
  const { pathname, hash } = useLocation()
  const [announcement, setAnnouncement] = useState('')
  // no announcement on initial load — the real page load announces itself
  const isFirstRender = useRef(true)

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false
      return
    }

    // <Meta> has already rendered the new title by the time effects run. Commas
    // instead of pipes so a screen reader reads it as a phrase — "68 -
    // Partnership as Shared Values, RFD, Oxide" — rather than reading out the
    // punctuation.
    setAnnouncement(document.title.split(' | ').join(', '))

    // Two cases where the destination is a better judge of the reading position
    // than we are: the index page focuses its filter input on mount, and an
    // anchor nav (from a search result, say) asked for a specific section.
    //
    // Both are decided from the location rather than from document.activeElement
    // — "focus is still on the body, so the thing that had it unmounted" reads
    // like the obvious test but isn't reliable. Browsers disagree (Safari
    // doesn't focus links on click, so after a link click focus is on the link
    // in Firefox but on the body in Safari), and mid-navigation the outgoing
    // page's #content can still be in the document alongside the new one.
    if (pathname === '/' || hash) return

    // Prefer the page's h1 over <main>. VoiceOver reads a focused heading's
    // text, whereas focusing a big landmark container just gets "main" with no
    // content. The h1 also remounts on every page change, while <main> persists
    // across navs — refocusing an already-focused element is a no-op that fires
    // no event, so the VO cursor would never move after the first nav. Focusing
    // the destination page's heading is the standard recommendation for SPA
    // route changes: https://www.deque.com/blog/single-page-apps-focus-management/
    //
    // preventScroll because scroll position is <ScrollRestoration />'s job:
    // without it, focusing the top of the page clobbers the restored position
    // on back/forward nav.
    const main = document.getElementById('content')
    const heading = main?.querySelector('h1')
    if (heading) {
      heading.tabIndex = -1 // headings aren't focusable by default
      // Safari (unlike Chrome/FF) matches :focus-visible on programmatic focus
      // even when the nav came from a click. The heading isn't interactive, so
      // never show a ring.
      heading.classList.add('outline-none')
    }
    ;(heading || main)?.focus({ preventScroll: true })
  }, [pathname, hash])

  return (
    <p aria-live="assertive" role="alert" data-testid="route-announcer" className="sr-only">
      {announcement}
    </p>
  )
}

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
