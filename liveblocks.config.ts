/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, you can obtain one at https://mozilla.org/MPL/2.0/.
 *
 * Copyright Oxide Computer Company
 */
import { type LiveObject } from '@liveblocks/client'

declare global {
  interface Liveblocks {
    Storage: {
      meta: LiveObject<{
        title: string
        lastUpdated: string
      }>
    }

    UserMeta: {
      id: string
      info: {
        name: string
        color: string
      }
    }

    RoomData: {
      RoomMetaData: {
        user: string
        created: string
        published: string
      }
    }
  }
}

export type LiveblocksStorage = Liveblocks['Storage']
