/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, you can obtain one at https://mozilla.org/MPL/2.0/.
 *
 * Copyright Oxide Computer Company
 */
import { ActionFunctionArgs, data, redirect } from 'react-router'

import { authenticate } from '../services/auth.server'

interface CreateRfdPayload {
  title: string
  body: string
}

interface CreateRfdResponse {
  number: string
  error?: string
}

const RFD_API_BASE_URL = process.env.RFD_API
const RFD_API_KEY = process.env.RFD_API_KEY

const DEFAULT_HEADERS = {
  Authorization: `Bearer ${RFD_API_KEY || ''}`,
  'Content-Type': 'application/json; charset=utf-8',
}

const RETRY_CONFIG = {
  maxAttempts: 20,
  initialDelay: 2000,
  backoffMultiplier: 1.5,
  backoffThreshold: 10,
} as const

export async function action({ request }: ActionFunctionArgs) {
  try {
    const user = await authenticate(request)
    if (!RFD_API_KEY || !RFD_API_BASE_URL) {
      throw new Response('RFD API config missing', { status: 500 })
    }

    if (!user) {
      return data({ status: 'error', error: 'Unauthorized' }, { status: 401 })
    }

    const payload = await parseRequestPayload(request)
    const rfdNumber = await createRfd(payload)
    await waitForRfdAvailability(rfdNumber)

    return redirect(`/rfd/${rfdNumber}`)
  } catch (error) {
    return handleError(error)
  }
}

async function parseRequestPayload(request: Request): Promise<CreateRfdPayload> {
  try {
    const { title, body } = await request.json()

    if (!title || !body) {
      throw new Response('Missing required fields: title and body', { status: 400 })
    }

    return { title, body }
  } catch (error) {
    if (error instanceof Response) throw error
    throw new Response('Invalid JSON payload', { status: 400 })
  }
}

async function createRfd({ title, body }: CreateRfdPayload): Promise<string> {
  const response = await fetch(`${RFD_API_BASE_URL}/rfd`, {
    method: 'POST',
    headers: DEFAULT_HEADERS,
    body: JSON.stringify({ title, content: body }),
  })

  const result: CreateRfdResponse = await response.json()

  if (!response.ok) {
    const errorMessage = result.error || `HTTP ${response.status}: ${response.statusText}`
    throw new Response(errorMessage, { status: response.status })
  }

  if (!result.number) {
    throw new Response('Invalid response: missing RFD number', { status: 500 })
  }

  return result.number
}

async function waitForRfdAvailability(rfdNumber: string): Promise<void> {
  let attempt = 0
  let delay = RETRY_CONFIG.initialDelay

  while (attempt < RETRY_CONFIG.maxAttempts) {
    try {
      const response = await fetch(`${RFD_API_BASE_URL}/rfd/${rfdNumber}`, {
        method: 'GET',
        headers: DEFAULT_HEADERS,
      })

      if (response.ok) {
        return // Success - RFD is available
      }

      if (response.status !== 404) {
        // If it's not a 404, it's likely a different error we shouldn't retry
        throw new Response(`Failed to verify RFD availability: ${response.status}`, {
          status: response.status,
        })
      }
    } catch {
      // Network errors or other fetch failures
      if (attempt >= RETRY_CONFIG.maxAttempts - 1) {
        throw new Response('Failed to verify RFD creation', { status: 500 })
      }
    }

    // Wait before next attempt
    await sleep(delay)
    attempt++

    // Apply backoff after threshold
    if (attempt > RETRY_CONFIG.backoffThreshold) {
      delay *= RETRY_CONFIG.backoffMultiplier
    }
  }

  throw new Response('RFD creation verification timeout', { status: 504 })
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function handleError(error: unknown) {
  if (error instanceof Response) {
    return error
  }

  console.error('Unexpected error in RFD creation:', error)
  return data({ status: 'error', error: 'An unexpected error occurred' }, { status: 500 })
}
