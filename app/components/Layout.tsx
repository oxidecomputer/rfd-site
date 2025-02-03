/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, you can obtain one at https://mozilla.org/MPL/2.0/.
 *
 * Copyright Oxide Computer Company
 */
import { Links, Meta, Scripts, ScrollRestoration, useLocation } from '@remix-run/react'
import cn from 'classnames'

export const Layout = ({
  children,
  theme,
}: {
  children: React.ReactNode
  theme?: string
}) => {
  const location = useLocation()
  const bodyClass = location.pathname.startsWith('/notes') ? 'note' : 'rfd'

  return (
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
      <body className={cn('mb-32', bodyClass)}>
        {children}
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  )
}
