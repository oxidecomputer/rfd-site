import { WebhookHandler } from '@liveblocks/node'
import { type ActionFunctionArgs } from '@remix-run/node'

import { modifyStorage } from '~/services/notes.server'

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
