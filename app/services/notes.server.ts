/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, you can obtain one at https://mozilla.org/MPL/2.0/.
 *
 * Copyright Oxide Computer Company
 */
import { createClient, type LiveObject } from '@liveblocks/client'
import { Liveblocks } from '@liveblocks/node'
import { type LiveblocksStorage } from 'liveblocks.config'
import { nanoid } from 'nanoid'

import { initialStorage } from '~/routes/notes.$id_'

export const client = new Liveblocks({
  secret: process.env.LIVEBLOCKS_KEY || '',
})

type RoomMetadata = {
  title: string
  user: string
  created: string
  published: 'true' | 'false'
}

declare module '@liveblocks/node' {
  interface BaseMetadata extends RoomMetadata { }
}

export const getNote = async (
  id: string,
): Promise<(RoomMetadata & { id: string }) | null> => {
  try {
    const room = await client.getRoom(id)
    return {
      id,
      ...(room.metadata as RoomMetadata),
    }
  } catch (error) {
    console.error(error)
    return null
  }
}

export const addNote = async (title: string, user: string) => {
  const id = nanoid(6)
  const created = new Date().toISOString()

  await client.createRoom(id, {
    defaultAccesses: [],
    usersAccesses: {
      [`${user}`]: ['room:write'],
    },
    groupsAccesses: {
      employee: ['room:write'],
    },
    metadata: {
      user,
      created,
      published: 'false',
    },
  })

  return id
}

export const updateNote = async (id: string, published: string) => {
  await client.updateRoom(id, {
    metadata: {
      published,
    },
  })
}

export const listNotes = async (userId: string) => {
  const { data } = await client.getRooms({
    query: {
      metadata: {
        user: userId,
      },
    },
  })

  const rooms = await Promise.all(
    data.map(async (room) => {
      const storage = await client.getStorageDocument(room.id, 'json')

      return {
        ...room,
        metadata: {
          ...room.metadata,
          title: storage.meta.title,
        },
      }
    }),
  )

  return rooms
}

export const serviceClient = createClient({
  authEndpoint: async (room) => {
    if (!room) {
      return null
    }
    const session = client.prepareSession('_SERVICE_ACCOUNT', {
      userInfo: { name: 'Service Account', color: '#000000' },
    })
    session.allow(room, session.FULL_ACCESS)
    const { body } = await session.authorize()
    return JSON.parse(body)
  },
})

export const enterRoom = (roomId: string) => {
  return serviceClient.enterRoom(roomId, { initialStorage: initialStorage })
}

export async function modifyStorage(
  roomId: string,
  storageChanges: (root: LiveObject<LiveblocksStorage>) => void,
) {
  const roomContext = enterRoom(roomId)
  const { room } = roomContext
  const { root } = await room.getStorage()

  // Make storage adjustments in a batch, so they all happen at once
  room.batch(() => {
    storageChanges(root)
  })

  // If storage changes are not synchronized, wait for them to finish
  if (room.getStorageStatus() !== 'synchronized') {
    await room.events.storageStatus.waitUntil((status) => status === 'synchronized')
  }

  roomContext.leave()
}
