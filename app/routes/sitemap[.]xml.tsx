/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, you can obtain one at https://mozilla.org/MPL/2.0/.
 *
 * Copyright Oxide Computer Company
 */

import * as R from 'remeda'

import { fetchRfds } from '~/services/rfd.server'

function url(path: string, lastmod?: Date) {
  const lines = ['  <url>']
  lines.push(`    <loc>https://rfd.shared.oxide.computer${path}</loc>`)
  if (lastmod) lines.push(`    <lastmod>${lastmod.toISOString().slice(0, 10)}</lastmod>`)
  lines.push(`  </url>`)
  return lines.join('\n')
}

export async function loader() {
  // null user means we only get public RFDs
  const rfds = (await fetchRfds(null)) || []

  const rfdUrls = R.pipe(
    rfds,
    R.sortBy((rfd) => rfd.formattedNumber),
    R.map((rfd) => url(`/rfd/${rfd.formattedNumber}`, rfd.committedAt)),
    R.join('\n'),
  )

  const content = `
<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${url('/')}
${rfdUrls}
</urlset>`.trim()

  return new Response(content, {
    headers: { 'Content-Type': 'application/xml' },
  })
}
