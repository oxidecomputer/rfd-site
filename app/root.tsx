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
} from 'react-router'

// import { auth, isAuthenticated } from '~/services/authn.server'
import styles from '~/styles/index.css?url'

import LoadingBar from './components/LoadingBar'
import { authenticate, logout } from './services/auth.server'
import { getSiteConfig } from './services/config.server'
import { inlineCommentsCookie } from './services/cookies.server'
import { isLocalMode } from './services/rfd.local.server'
import {
  fetchRfds,
  getAuthors,
  getLabels,
  provideNewRfdNumber,
} from './services/rfd.server'
import { useApplyTheme } from './stores/theme'

export const meta: MetaFunction<typeof loader> = ({ data }) => {
  if (!data?.config) {
    return [{ title: 'RFD' }]
  }

  const orgName = data.config.organization.name
  const description = data.config.site.description
  const metaTags: ReturnType<MetaFunction> = [{ title: `RFD / ${orgName}` }]
  if (description) {
    metaTags.push({ name: 'description', content: description } as {
      name: string
      content: string
    })
  }
  return metaTags
}

export const links: LinksFunction = () => [{ rel: 'stylesheet', href: styles }]

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const config = await getSiteConfig()
  const inlineComments =
    (await inlineCommentsCookie.parse(request.headers.get('Cookie'))) ?? true
  const githubRepoUrl = config.discussions
    ? `https://${config.discussions.host || 'github.com'}/${config.discussions.owner}/${config.discussions.repo}`
    : null

  const user = await authenticate(request)
  try {
    const rfds = (await fetchRfds(user)) || []

    const authors = rfds ? getAuthors(rfds) : []
    const labels = rfds ? getLabels(rfds) : []

    return {
      config,
      features: config.features,
      inlineComments,
      user,
      rfds,
      authors,
      labels,
      localMode: isLocalMode(),
      newRfdNumber: provideNewRfdNumber([...rfds]),
      githubRepoUrl,
    }
  } catch {
    // The only error that should be caught here is the unauthenticated error.
    // And if that occurs we need to log the user out
    await logout(request, '/')
  }

  // Convince remix that a return type will always be provided
  return {
    config,
    features: config.features,
    inlineComments,
    user,
    rfds: [],
    authors: [],
    labels: [],
    localMode: isLocalMode(),
    newRfdNumber: undefined,
    githubRepoUrl,
  }
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
      <div className="flex h-full w-full items-center justify-center">
        <h1 className="text-2xl">{message}</h1>
      </div>
    </Layout>
  )
}
const queryClient = new QueryClient()

// Set theme before first paint to prevent flash of wrong color scheme.
// Mirrors logic in app/stores/theme.ts — must stay in sync.
const themeInitScript = `(function(){try{var p=localStorage.getItem('theme-preference');if(p!=='dark'&&p!=='light'&&p!=='system')p='dark';var r=p==='system'?(matchMedia('(prefers-color-scheme: light)').matches?'light':'dark'):p;document.documentElement.dataset.theme=r;}catch(_){document.documentElement.dataset.theme='dark';}})();`

const Layout = ({
  children,
  headScript,
}: {
  children: React.ReactNode
  headScript?: string
}) => (
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
      {process.env.NODE_ENV === 'production' && headScript && (
        <script dangerouslySetInnerHTML={{ __html: headScript }} />
      )}
    </head>
    <body className="mb-32">
      <div className="root">{children}</div>
      <ScrollRestoration />
      <Scripts />
    </body>
  </html>
)

export default function App() {
  useApplyTheme()
  const { localMode, config } = useLoaderData<typeof loader>()

  return (
    <Layout headScript={config.headScript}>
      <LoadingBar />
      <QueryClientProvider client={queryClient}>
        <Outlet />
        {localMode && (
          <div className="shadow-border-small text-sans-sm text-notice bg-notice fixed bottom-6 left-6 z-10 rounded p-2">
            Local authoring mode
          </div>
        )}
      </QueryClientProvider>
    </Layout>
  )
}
