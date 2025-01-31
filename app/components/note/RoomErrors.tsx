/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, you can obtain one at https://mozilla.org/MPL/2.0/.
 *
 * Copyright Oxide Computer Company
 */
import { useErrorListener, useLostConnectionListener } from '@liveblocks/react/suspense'

export default function RoomErrors() {
  useErrorListener((error) => {
    console.log(error)
    switch (error.code) {
      case -1:
        // Authentication error
        console.error("You don't have access to this room")
        break

      case 4001:
        // Could not connect because you don't have access to this room
        console.error("You don't have access to this room")
        break

      case 4005:
        // Could not connect because room was full
        console.error('Could not connect because the room is full')
        break

      default:
        // Unexpected error
        console.error('An unexpected error happenned')
        break
    }
  })

  useLostConnectionListener((event) => {
    switch (event) {
      case 'lost':
        console.info('Still trying to reconnect…')
        break

      case 'restored':
        console.log('Successfully reconnected again!')
        break

      case 'failed':
        console.error('Could not restore the connection')
        break
    }
  })

  return null
}
