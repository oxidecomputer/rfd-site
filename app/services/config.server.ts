/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, you can obtain one at https://mozilla.org/MPL/2.0/.
 *
 * Copyright Oxide Computer Company
 */

import type { SiteConfig } from '../types/site-config'

let cachedConfig: SiteConfig | null = null

/**
 * Get the site configuration.
 *
 * Throws if site.config.ts is not found - configuration is required.
 */
export async function getSiteConfig(): Promise<SiteConfig> {
  if (cachedConfig) return cachedConfig

  try {
    // @ts-expect-error - Dynamic import is supported at runtime by Vite
    const module = await import('../../site.config')
    cachedConfig = module.default

    if (!cachedConfig) {
      throw new Error('site.config.ts must export a default config object')
    }

    return cachedConfig
  } catch (_error) {
    throw new Error(
      'site.config.ts is required but not found. ' +
        'Copy the existing site.config.ts and customize for your organization.',
    )
  }
}
