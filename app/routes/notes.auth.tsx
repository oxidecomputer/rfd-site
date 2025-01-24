/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, you can obtain one at https://mozilla.org/MPL/2.0/.
 *
 * Copyright Oxide Computer Company
 */
import { redirect, type LoaderFunction } from '@remix-run/node'

import Icon from '~/components/Icon'
import { handleNotesAccess, isAuthenticated } from '~/services/authn.server'

import { EMBody, PlaceholderWrapper } from './notes'

export const loader: LoaderFunction = async ({ request }) => {
  const user = await isAuthenticated(request)
  const redirectResponse = handleNotesAccess(user)
  if (!redirectResponse) {
    return redirect('/notes')
  } else {
    return null
  }
}

export default function NotesIndex() {
  return (
    <PlaceholderWrapper>
      <div className="m-4 flex max-w-[18rem] flex-col items-center text-center">
        <div className="mb-4 rounded p-2 leading-[0] text-accent bg-accent-secondary">
          <Icon name="person" size={16} />
        </div>

        <h3 className="text-sans-semi-lg">Cannot be authorized</h3>
        <EMBody className="max-w-lg">Must be logged in through Google</EMBody>
      </div>
    </PlaceholderWrapper>
  )
}
