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
 * Configuration can be loaded from:
 * 1. External .ts file via SITE_CONFIG_PATH env var (for Deno runtime)
 * 2. Bundled site.config.ts (default, for development and Node.js)
 *
 * Throws if no configuration is found.
 */
export async function getSiteConfig(): Promise<SiteConfig> {
  if (cachedConfig) return cachedConfig

  // Check for external config path (works with Deno runtime)
  const configPath = process.env.SITE_CONFIG_PATH
  if (configPath) {
    try {
      // Convert to file:// URL for dynamic import
      const fileUrl = configPath.startsWith('file://') ? configPath : `file://${configPath}`
      const module = await import(fileUrl)
      cachedConfig = module.default

      if (!cachedConfig) {
        throw new Error(`${configPath} must export a default config object`)
      }

      return cachedConfig
    } catch (error) {
      throw new Error(
        `Failed to load config from SITE_CONFIG_PATH (${configPath}): ${error}`,
      )
    }
  }

  // Fall back to bundled config
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
      'No site config found. Either set SITE_CONFIG_PATH env var to a .ts config file, ' +
        'or ensure site.config.ts is bundled with the application.',
    )
  }
}
