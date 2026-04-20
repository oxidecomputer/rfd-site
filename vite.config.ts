/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, you can obtain one at https://mozilla.org/MPL/2.0/.
 *
 * Copyright Oxide Computer Company
 */

import { reactRouter } from '@react-router/dev/vite'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig, type PluginOption } from 'vite'

import { LocalRfdPlugin } from './vite/local-rfd-plugin'

const plugins: PluginOption[] = [tailwindcss(), reactRouter()]

const localRepo = process.env.LOCAL_RFD_REPO
if (localRepo) plugins.push(LocalRfdPlugin(localRepo))

export default defineConfig({
  plugins,
  resolve: {
    tsconfigPaths: true,
  },
  server: {
    port: 3000,
  },
})
