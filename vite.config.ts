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

import { LocalRfdPlugin } from './vite/local-rfd-plugin'

const plugins = [remix({ presets: [vercelPreset()] }), tsconfigPaths()]

const localRepo = process.env.LOCAL_RFD_REPO
if (localRepo) plugins.push(LocalRfdPlugin(localRepo))

export default defineConfig({
  plugins,
  server: {
    port: 3000,
  },
  ssr: {
    noExternal: ['@uiw/react-codemirror', '@uiw/codemirror-extensions-basic-setup'],
  },
})
