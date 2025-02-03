/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, you can obtain one at https://mozilla.org/MPL/2.0/.
 *
 * Copyright Oxide Computer Company
 */
import { Error12Icon, PrevArrow12Icon } from '@oxide/design-system/icons/react'
import { Link } from '@remix-run/react'
import type { ReactNode } from 'react'

const GradientBackground = () => (
  <div
    // negative z-index avoids covering MSW warning banner
    className="fixed bottom-0 left-0 right-0 top-0 -z-10"
    style={{
      background:
        'radial-gradient(200% 100% at 50% 100%, var(--surface-default) 0%, #161B1D 100%)',
    }}
  />
)

type Props = { children: ReactNode; backLink?: string }

export function ErrorPage({ children, backLink }: Props) {
  return (
    <div className="flex w-full justify-center">
      <GradientBackground />
      <div className="relative flex w-full justify-between">
        <Link
          to={backLink ? backLink : '/'}
          className="flex items-center p-6 text-mono-sm text-default hover:text-raise"
        >
          <PrevArrow12Icon title="Select" className="mr-2 text-secondary" />
          Back
        </Link>
      </div>
      <div className="absolute left-1/2 top-1/2 flex w-96 -translate-x-1/2 -translate-y-1/2 flex-col items-center justify-center space-y-4 rounded-lg border p-8 !bg-raise border-secondary elevation-3">
        <div className="my-2 flex h-12 w-12 items-center justify-center">
          <div className="absolute h-12 w-12 rounded-full opacity-20 bg-destructive motion-safe:animate-[ping_2s_cubic-bezier(0,0,0.2,1)_infinite]" />
          <Error12Icon className="relative h-8 w-8 text-error-secondary" />
        </div>

        <div className="space-y-2 text-center">{children}</div>
      </div>
    </div>
  )
}

export function NotFound() {
  return (
    <ErrorPage>
      <h1 className="text-sans-2xl">Page not found</h1>
      <p className="text-sans-lg text-secondary">
        The page you are looking for doesn&apos;t exist or you may not have access to it.
      </p>
    </ErrorPage>
  )
}
