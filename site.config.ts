/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, you can obtain one at https://mozilla.org/MPL/2.0/.
 *
 * Copyright Oxide Computer Company
 */

import type { SiteConfig } from './app/types/site-config'

const config: SiteConfig = {
  organization: {
    name: 'Oxide',
    website: 'https://oxide.computer',
  },

  site: {
    description: 'Requests for Discussion from Oxide Computer Company',
  },

  repository: {
    url: 'https://github.com/oxidecomputer/rfd',
  },

  search: {
    url: 'https://search.rfd.shared.oxide.computer',
  },

  publicBanner: {
    enabled: true,
    learnMoreContent: `
      <p>
        We use RFDs both to discuss rough ideas and as a permanent repository for more
        established ones. You can read more about the
        <a href="https://oxide.computer/blog/a-tool-for-discussion" class="text-accent-secondary hover:text-accent" target="_blank" rel="noreferrer">
          tooling around discussions
        </a>.
      </p>
      <p>
        If you're interested in the way we work, and would like to see the process from the
        inside, check out our
        <a href="https://oxide.computer/careers" class="text-accent-secondary hover:text-accent" target="_blank" rel="noreferrer">
          open positions
        </a>.
      </p>
    `,
  },

  headContent: `
    var script = document.createElement('script');
    script.defer = true;
    script.setAttribute('data-domain', 'rfd.shared.oxide.computer');
    script.src = 'https://trck.oxide.computer/js/plausible.js';
    document.head.appendChild(script);
  `,

  features: {
    discussions: true,
    pdf: true,
    search: true,
  },
}

export default config
