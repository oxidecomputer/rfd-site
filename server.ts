/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, you can obtain one at https://mozilla.org/MPL/2.0/.
 *
 * Copyright Oxide Computer Company
 */

import { createRequestHandler, type ServerBuild } from 'react-router'
import { contentType } from '@std/media-types'
import { extname, fromFileUrl, dirname, join } from '@std/path'

const MODE = Deno.env.get('NODE_ENV') ?? 'production'
const PORT = parseInt(Deno.env.get('PORT') ?? '3000', 10)

// Get the directory where the server module/binary is located
// This works both in development and when compiled
const moduleDir = dirname(fromFileUrl(import.meta.url))

// Import the server build
// @ts-ignore - Build output types may not match exactly but work at runtime
const build: ServerBuild = await import('./build/server/index.js')

const handler = createRequestHandler(build, MODE)

// Static file extensions we want to serve with long cache headers
const IMMUTABLE_CACHE_CONTROL = 'public, max-age=31536000, immutable'
const DEFAULT_CACHE_CONTROL = 'public, max-age=3600'

async function serveStaticFile(
  pathname: string,
): Promise<Response | null> {
  // Resolve path relative to the module directory
  // In compiled mode, embedded files are accessible at their original paths
  const filePath = join(moduleDir, 'build', 'client', pathname)

  try {
    const stat = await Deno.stat(filePath)

    if (stat.isDirectory) {
      return null
    }

    const file = await Deno.open(filePath, { read: true })
    const ext = extname(pathname)
    const mimeType = contentType(ext) ?? 'application/octet-stream'

    // Assets in /assets/ are fingerprinted and can be cached forever
    const cacheControl = pathname.startsWith('/assets/')
      ? IMMUTABLE_CACHE_CONTROL
      : DEFAULT_CACHE_CONTROL

    return new Response(file.readable, {
      headers: {
        'Content-Type': mimeType,
        'Content-Length': stat.size.toString(),
        'Cache-Control': cacheControl,
      },
    })
  } catch (e) {
    if (e instanceof Deno.errors.NotFound) {
      return null
    }
    throw e
  }
}

async function handleRequest(request: Request): Promise<Response> {
  const url = new URL(request.url)

  // Try to serve static files first
  const staticResponse = await serveStaticFile(url.pathname)
  if (staticResponse) {
    return staticResponse
  }

  // Fall through to React Router SSR handler
  return handler(request)
}

console.log(`Server listening on http://localhost:${PORT}`)

Deno.serve({ port: PORT }, handleRequest)
