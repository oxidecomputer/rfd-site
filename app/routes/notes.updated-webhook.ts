import { createClient, type LiveObject } from '@liveblocks/client'
import { WebhookHandler } from '@liveblocks/node'
import { type ActionFunctionArgs } from '@remix-run/node'

import { client as liveblocks } from '~/services/notes.server'

import { initialStorage } from './notes.$id_.edit'

export const serverClient = createClient({
  authEndpoint: async (room) => {
    if (!room) {
      return null
    }
    const session = liveblocks.prepareSession('_SERVICE_ACCOUNT', {
      userInfo: { name: 'Service Account' },
    })
    session.allow(room, session.FULL_ACCESS)
    const { body } = await session.authorize()
    return JSON.parse(body)
  },
})

export const enterRoom = (roomId: string) => {
  return serverClient.enterRoom(roomId, { initialStorage: initialStorage })
}

export async function modifyStorage(
  roomId: string,
  storageChanges: (root: LiveObject<Liveblocks['Storage']>) => void,
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

export async function action({ request }: ActionFunctionArgs) {
  try {
    const webhook = new WebhookHandler(process.env.LIVEBLOCKS_WEBHOOK_KEY!)

    const event = webhook.verifyRequest({
      headers: request.headers,
      rawBody: await request.text(),
    })

    if (event.type === 'ydocUpdated') {
      await modifyStorage(event.data.roomId, (root) => {
        root.get('meta').update({
          lastUpdated: event.data.updatedAt,
        })
      })
    }

    return new Response(null, { status: 200 })
  } catch (error) {
    console.error(error)
    return new Response('Something went wrong', { status: 500 })
  }
}
