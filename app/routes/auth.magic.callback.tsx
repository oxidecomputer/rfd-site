/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, you can obtain one at https://mozilla.org/MPL/2.0/.
 *
 * Copyright Oxide Computer Company
 */

import type { LoaderFunction } from 'react-router'

import { handleAuthenticationCallback } from '~/services/auth.server'

export let loader: LoaderFunction = async ({ request }) => {
  return handleAuthenticationCallback('rfd-magic-link', request)
}
