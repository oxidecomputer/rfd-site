/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, you can obtain one at https://mozilla.org/MPL/2.0/.
 *
 * Copyright Oxide Computer Company
 */

import type { EntryContext } from 'react-router'
import { ServerRouter } from 'react-router'
import { renderToReadableStream } from 'react-dom/server'
import { isbot } from 'isbot'

export default async function handleRequest(
  request: Request,
  responseStatusCode: number,
  responseHeaders: Headers,
  routerContext: EntryContext,
) {
  const userAgent = request.headers.get('user-agent')
  const isBot = userAgent ? isbot(userAgent) : false

  const stream = await renderToReadableStream(
    <ServerRouter context={routerContext} url={request.url} />,
    {
      onError(error: unknown) {
        console.error(error)
        responseStatusCode = 500
      },
    },
  )

  // For bots, wait for all content to be ready
  if (isBot) {
    await stream.allReady
  }

  responseHeaders.set('Content-Type', 'text/html')

  return new Response(stream, {
    status: responseStatusCode,
    headers: responseHeaders,
  })
}
