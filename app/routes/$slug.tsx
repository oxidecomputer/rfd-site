/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, you can obtain one at https://mozilla.org/MPL/2.0/.
 *
 * Copyright Oxide Computer Company
 */

import { redirect, type LoaderFunctionArgs } from 'react-router'

import { parseRfdNum } from '~/utils/parseRfdNum'

export async function loader({ params: { slug } }: LoaderFunctionArgs) {
  if (parseRfdNum(slug)) {
    return redirect(`/rfd/${slug}`)
  } else {
    throw new Response('Not Found', { status: 404 })
  }
}
