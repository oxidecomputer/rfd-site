import type { LoaderFunction } from '@remix-run/node'

import { handleAuthenticationCallback } from '~/services/auth.server'

export let loader: LoaderFunction = async ({ request }) => {
  return handleAuthenticationCallback('rfd-magic-link', request)
}
