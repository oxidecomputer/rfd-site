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
import { inlineCommentsCookie, themeCookie } from './services/cookies.server'
import { isLocalMode } from './services/rfd.local.server'
import {
  fetchRfds,
  getAuthors,
  getLabels,
  provideNewRfdNumber,
} from './services/rfd.server'

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
  const theme = (await themeCookie.parse(request.headers.get('Cookie'))) ?? 'dark-mode'
  const inlineComments =
    (await inlineCommentsCookie.parse(request.headers.get('Cookie'))) ?? true
  const githubRepoUrl = `https://${process.env.GITHUB_HOST || 'github.com/oxidecomputer/rfd'}`

  const user = await authenticate(request)
  try {
    const rfds = (await fetchRfds(user)) || []

    const authors = rfds ? getAuthors(rfds) : []
    const labels = rfds ? getLabels(rfds) : []

    return {
      // Any data added to the ENV key of this loader will be injected into the
      // global window object (window.ENV)
      config,
      features: config.features, // Make features available separately for client-side checks
      theme,
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
    theme,
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

const Layout = ({
  children,
  theme,
  headScript,
}: {
  children: React.ReactNode
  theme?: string
  headScript?: string
}) => (
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
      {process.env.NODE_ENV === 'production' && !process.env.TELEMETRY_DISABLE && (
        <script defer data-domain="rfd.shared.oxide.computer" src="/js/viewscript.js" />
      )}
      <meta name="color-scheme" content="dark" />
      {process.env.NODE_ENV === 'production' && headScript && (
        <script dangerouslySetInnerHTML={{ __html: headScript }} />
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
  const { theme, localMode, config } = useLoaderData<typeof loader>()

  return (
    <Layout theme={theme} headScript={config.headScript}>
      <LoadingBar />
      <QueryClientProvider client={queryClient}>
        <Outlet />
        {localMode && (
          <div className="overlay-shadow text-sans-sm text-notice bg-notice-secondary fixed bottom-6 left-6 z-10 rounded p-2">
            Local authoring mode
          </div>
        )}
      </QueryClientProvider>
    </Layout>
  )
}
