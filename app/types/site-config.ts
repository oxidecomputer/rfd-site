/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, you can obtain one at https://mozilla.org/MPL/2.0/.
 *
 * Copyright Oxide Computer Company
 */

export interface SiteConfig {
  // Organization identity
  organization: {
    name: string
    website: string
  }

  // Site metadata
  site: {
    description?: string
  }

  // Repository - just a URL
  repository: {
    url: string
  }

  // Search configuration
  search: {
    url: string
  } | null

  // Public banner (optional - set to null to disable)
  publicBanner: {
    enabled: boolean
    text?: string
    // Custom modal content HTML - renders below the main description
    learnMoreContent?: string
  } | null

  // Custom head script (for analytics, etc) - injected into a <script> tag
  headScript?: string

  // Feature flags
  features: {
    discussions: boolean
    pdf: boolean
    search: boolean
  }
}
