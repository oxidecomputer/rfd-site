/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, you can obtain one at https://mozilla.org/MPL/2.0/.
 *
 * Copyright Oxide Computer Company
 */
import { json, type LoaderFunctionArgs } from '@remix-run/node'

import { authenticate } from '~/services/auth.server'
import { fetchRfdJobs } from '~/services/rfd.server'

export async function loader({ request, params }: LoaderFunctionArgs) {
  const rfdNumber = parseInt(params.slug || '')

  if (isNaN(rfdNumber)) {
    return json({ error: 'Invalid RFD number' }, { status: 400 })
  }

  const user = await authenticate(request)
  const jobs = await fetchRfdJobs(rfdNumber, user)

  return json(jobs)
}
