/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, you can obtain one at https://mozilla.org/MPL/2.0/.
 *
 * Copyright Oxide Computer Company
 */

import type { Config } from '@react-router/dev/config'

const buildTarget = process.env.BUILD_TARGET || 'vercel'

const config: Config = {
  ssr: true,
}

if (buildTarget === 'vercel') {
  const { vercelPreset } = await import('@vercel/react-router/vite')
  config.presets = [vercelPreset()]
} else {
  // Deno/container build - write manifest for the Deno server
  config.buildEnd = async ({ buildManifest }) => {
    const { writeFile } = await import('node:fs/promises')
    await writeFile(
      'build/server/manifest.json',
      JSON.stringify(buildManifest, null, 2),
    )
  }
}

export default config satisfies Config
