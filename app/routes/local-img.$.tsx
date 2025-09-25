/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, you can obtain one at https://mozilla.org/MPL/2.0/.
 *
 * Copyright Oxide Computer Company
 */

import fs from 'fs/promises'
import { lookup } from 'mime-types'
import type { LoaderFunctionArgs } from 'react-router'

// serve images (technically any file) straight from local rfd repo when we're
// in local mode

export async function loader({ params }: LoaderFunctionArgs) {
  const filename = params['*']

  // endpoint will 404 unless we're in local RFD mode
  if (!filename || process.env.NODE_ENV !== 'development' || !process.env.LOCAL_RFD_REPO) {
    throw new Response('Not Found', { status: 404 })
  }

  try {
    const buffer = await fs.readFile(`${process.env.LOCAL_RFD_REPO}/rfd/${filename}`)

    return new Response(new Uint8Array(buffer), {
      headers: {
        'Content-Type': lookup(filename) || 'text/html',
      },
    })
  } catch {
    throw new Response('Not Found', { status: 404 })
  }
}
