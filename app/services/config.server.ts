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

  let module: { default?: SiteConfig }
  try {
    // @ts-expect-error - Dynamic import is supported at runtime by Vite
    module = await import('../../site.config')
  } catch (error) {
    if (isModuleNotFoundError(error)) {
      throw new Error(
        'site.config.ts is required but not found. ' +
          'Copy the existing site.config.ts and customize for your organization.',
      )
    }
    throw error
  }

  const config = module.default ?? null
  if (!config) {
    throw new Error('site.config.ts must export a default config object')
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
}

function isModuleNotFoundError(error: unknown): boolean {
  if (!(error instanceof Error)) return false
  // Node: MODULE_NOT_FOUND; Vite dev/SSR: ERR_MODULE_NOT_FOUND / ERR_LOAD_URL
  const code = (error as NodeJS.ErrnoException).code
  if (code === 'MODULE_NOT_FOUND' || code === 'ERR_MODULE_NOT_FOUND') return true
  return /Cannot find module|Failed to load url.*site\.config/.test(error.message)
}
