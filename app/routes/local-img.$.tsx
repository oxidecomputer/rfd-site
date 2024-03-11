/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, you can obtain one at https://mozilla.org/MPL/2.0/.
 *
 * Copyright Oxide Computer Company
 */

import fs from 'fs/promises'
import type { LoaderArgs } from '@remix-run/node'
import { lookup } from 'mime-types'

// serve images (technically any file) straight from local rfd repo when we're
// in local mode

export async function loader({ params }: LoaderArgs) {
  const filename = params['*']

  // endpoint will 404 unless we're in local RFD mode
  if (!filename || process.env.NODE_ENV !== 'development' || !process.env.LOCAL_RFD_REPO) {
    throw new Response('Not Found', { status: 404 })
  }

  try {
    const buffer = await fs.readFile(`${process.env.LOCAL_RFD_REPO}/rfd/${filename}`)

    return new Response(buffer, {
      headers: {
        'Content-Type': lookup(filename) || 'text/html',
      },
    })
  } catch (e) {
    throw new Response('Not Found', { status: 404 })
  }
}
