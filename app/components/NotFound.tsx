/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, you can obtain one at https://mozilla.org/MPL/2.0/.
 *
 * Copyright Oxide Computer Company
 */

import Icon from '~/components/Icon'
import { Layout } from '~/root'

export default function NotFound() {
  return (
    <Layout>
      <div className="flex w-full justify-center">
        <div
          className="fixed top-0 left-0 right-0 bottom-0"
          style={{
            background:
              'radial-gradient(200% 100% at 50% 100%, var(--surface-default) 0%, #161B1D 100%)',
          }}
        />
        <div className="relative w-full">
          <a
            href="/"
            className="flex inline-flex items-center p-6 text-mono-sm text-secondary hover:text-default"
          >
            <Icon name="carat-left" size={12} className="mr-2 w-2 text-tertiary" />
            Back to directory
          </a>
        </div>
        <div className="absolute top-1/2 left-1/2 w-full max-w-[26rem] -translate-x-1/2 -translate-y-1/2 px-4">
          <div className="flex flex-col items-center justify-center space-y-4 rounded-lg border p-8 !bg-raise border-secondary elevation-3">
            <div className="my-2 flex inline-flex h-12 w-12 items-center justify-center">
              <div className="absolute h-12 w-12 rounded-full opacity-20 bg-destructive motion-safe:animate-[ping_2s_cubic-bezier(0,0,0.2,1)_infinite]" />
              <Icon name="info" size={16} className="relative h-8 w-8 text-error" />
            </div>

            <div className="space-y-2">
              <h1 className="text-center text-sans-2xl">Page not found</h1>
              <p className="text-center text-tertiary">
                The page you are looking for doesn’t exist or you may not have access to it.
              </p>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  )
}
