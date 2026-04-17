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

  // GitHub API coordinates for the discussions feature.
  // Required when features.discussions is true. `host` is the GitHub Enterprise
  // hostname (e.g. 'github.example.com'); omit for github.com.
  discussions: {
    owner: string
    repo: string
    host?: string
  } | null

  // Search configuration
  search: {
    url: string
  } | null

  // Public banner (optional - set to null to disable)
  publicBanner: {
    enabled: boolean
    text?: string
    // Raw HTML rendered with dangerouslySetInnerHTML below the main description.
    // SECURITY: this is injected into the page verbatim, so the value must come
    // from the deployer-controlled site config and never from user input.
    // Tailwind class names hard-coded here will silently break if the design
    // system renames them — keep markup minimal.
    learnMoreContent?: string
  } | null

  // Raw JS injected into a <script dangerouslySetInnerHTML> tag in <head>
  // (typically used for analytics). Only rendered when NODE_ENV=production.
  // SECURITY: this runs as page-trusted JavaScript, so the value must come
  // from the deployer-controlled site config and never from user input.
  headScript?: string

  // Feature flags
  features: {
    discussions: boolean
    pdf: boolean
    search: boolean
  }
}
