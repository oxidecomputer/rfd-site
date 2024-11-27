/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, you can obtain one at https://mozilla.org/MPL/2.0/.
 *
 * Copyright Oxide Computer Company
 */
import { json, redirect, type ActionArgs } from '@remix-run/node'

import { isAuthenticated } from '~/services/authn.server'

export async function action({ request }: ActionArgs) {
  try {
    const { title, body } = await request.json()

    const user = await isAuthenticated(request)
    if (!user) throw new Response('User not found', { status: 401 })

    const createResponse = await fetch(`http://localhost:8080/rfd`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.TEST_RFD_API_KEY || ''}`,
        'Content-Type': 'application/json; charset=utf-8',
      },
      body: JSON.stringify({ title, content: body }),
    })

    const result = await createResponse.json()

    if (!createResponse.ok) {
      throw new Response(result.error, { status: createResponse.status })
    }

    const rfdNumber = result.number

    await fetchWithRetry(rfdNumber)

    return redirect(`/rfd/${rfdNumber}`)
  } catch (error) {
    if (error instanceof Response) {
      return json({ status: 'error', error: await error.text() }, { status: error.status })
    }
    return json({ status: 'error', error: 'An unexpected error occurred' }, { status: 500 })
  }
}

async function fetchWithRetry(rfdNumber: string, maxAttempts: number = 20) {
  let attempt = 0
  let delay = 2000

  const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

  while (attempt < maxAttempts) {
    try {
      const response = await fetch(`http://localhost:8080/rfd/${rfdNumber}`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${process.env.TEST_RFD_API_KEY || ''}`,
          'Content-Type': 'application/json; charset=utf-8',
        },
      })

      if (response.ok) {
        return response
      } else if (response.status === 401) {
        attempt++
        await sleep(delay)
        if (attempt > 10) {
          delay *= 1.5
        }
      } else {
        throw new Response('Failed with status: ' + response.status, {
          status: response.status,
        })
      }
    } catch (error) {
      if (attempt >= maxAttempts - 1) throw error
      attempt++
      await sleep(delay)
      if (attempt > 10) {
        delay *= 1.5
      }
    }
  }

  throw new Error('Max retry attempts reached')
}
