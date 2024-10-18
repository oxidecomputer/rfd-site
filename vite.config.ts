/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, you can obtain one at https://mozilla.org/MPL/2.0/.
 *
 * Copyright Oxide Computer Company
 */

import { vitePlugin as remix } from '@remix-run/dev'
import { vercelPreset } from '@vercel/remix/vite'
import { defineConfig } from 'vite'
import tsconfigPaths from 'vite-tsconfig-paths'

export default defineConfig({
  plugins: [remix({ presets: [vercelPreset()] }), tsconfigPaths()],
  server: {
    watch: {
      ignored: process.env.LOCAL_RFD_REPO
        ? ['!**/node_modules/**', `!${process.env.LOCAL_RFD_REPO}/rfd/**`]
        : ['!**/node_modules/**'],
    },
    port: 3000,
  },
})
