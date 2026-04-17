/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, you can obtain one at https://mozilla.org/MPL/2.0/.
 *
 * Copyright Oxide Computer Company
 */

import { resolve } from 'node:path'
import { pathToFileURL } from 'node:url'

import type { SiteConfig } from '../types/site-config'

let cachedConfig: SiteConfig | null = null

/**
 * Get the site configuration.
 *
 * Loads from SITE_CONFIG_PATH if set (external file for container deployments
 * — must be JS/JSON since Node can't load .ts at runtime), otherwise from the
 * bundled site.config.ts.
 */
export async function getSiteConfig(): Promise<SiteConfig> {
  if (cachedConfig) return cachedConfig

  const configPath = process.env.SITE_CONFIG_PATH
  const source = configPath
    ? // @ts-expect-error - Dynamic import with runtime-resolved path
      ((await import(pathToFileURL(resolve(configPath)).href)) as {
        default?: SiteConfig
      })
    : // @ts-expect-error - Dynamic import is supported at runtime by Vite
      ((await import('../../site.config')) as { default?: SiteConfig })

  const config = source.default
  if (!config) {
    throw new Error(`${configPath ?? 'site.config.ts'} must export a default config object`)
  }

  validateSiteConfig(config)
  cachedConfig = config
  return cachedConfig
}

function validateSiteConfig(config: SiteConfig): void {
  if (config.features.discussions) {
    const d = config.discussions
    if (!d || !d.owner || !d.repo) {
      throw new Error(
        'site.config.ts: features.discussions is enabled but discussions config ' +
          'is missing required fields `owner` and `repo`.',
      )
    }
  }

  if (config.features.search && !config.search?.url) {
    throw new Error(
      'site.config.ts: features.search is enabled but search.url is not set. ' +
        'Either disable features.search or provide a search.url.',
    )
  }
}
