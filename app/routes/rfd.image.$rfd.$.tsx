/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, you can obtain one at https://mozilla.org/MPL/2.0/.
 *
 * Copyright Oxide Computer Company
 */

import { redirect, Response, type LoaderArgs } from '@remix-run/node'

import { isAuthenticated } from '~/services/authn.server'
import { fetchLocalImage, fetchRfd, isLocalMode } from '~/services/rfd.server'
import { getExpiringUrl } from '~/services/storage.server'

export async function loader({ request, params }: LoaderArgs) {
  const rfd = params['rfd']
  const filename = params['*']

  if (!rfd || !filename) throw new Response('Not Found', { status: 404 })

  const rfdNumber = parseInt(rfd, 10)

  if (isLocalMode) {
    const localImage = fetchLocalImage(rfdNumber, decodeURI(filename))
    if (!localImage) {
      throw new Response('Unable to retrieve image', { status: 500 })
    }

    const fileExt = filename.split('.').pop()

    let type = fileExt
    if (fileExt === 'svg') {
      type = 'svg+xml'
    }

    return new Response(localImage, {
      headers: {
        'Content-Type': `image/${type}`,
      },
    })
  } else {
    const user = await isAuthenticated(request)
    const remoteRfd = await fetchRfd(rfdNumber, user)

    // If the user can read the RFD than they can access the images in the RFD
    if (remoteRfd) {
      const path = `rfd/${rfd}/latest/${filename}`

      // Default expiration of one day. The intention here is to provide a window of time that allows
      // for daily usage of the site, but does not allow for indefinite access
      const defaultExpiration = 24 * 60 * 60

      return redirect(getExpiringUrl(path, defaultExpiration))
    } else {
      throw new Response('Forbidden', {
        status: 403,
      })
    }
  }
}
