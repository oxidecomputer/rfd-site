/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, you can obtain one at https://mozilla.org/MPL/2.0/.
 *
 * Copyright Oxide Computer Company
 */
import { Liveblocks } from '@liveblocks/node'
import { nanoid } from 'nanoid'

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
  interface BaseMetadata extends RoomMetadata {}
}

export const getNote = async (id: string): Promise<RoomMetadata & { id: string }> => {
  const room = await client.getRoom(id)
  if (!room) {
    throw new Error('Note not found')
  }
  return {
    id,
    ...(room.metadata as RoomMetadata),
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
      title,
      user,
      created,
      published: 'false',
    },
  })

  return id
}

export const updateNote = async (id: string, title: string, published: string) => {
  await client.updateRoom(id, {
    metadata: {
      title,
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

  return data
}
