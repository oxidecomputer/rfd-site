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
