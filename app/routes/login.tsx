/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, you can obtain one at https://mozilla.org/MPL/2.0/.
 *
 * Copyright Oxide Computer Company
 */

import { Button } from '@oxide/design-system'
import { useState } from 'react'
import {
  data,
  Form,
  redirect,
  useActionData,
  useLoaderData,
  type ActionFunctionArgs,
  type LoaderFunctionArgs,
} from 'react-router'

import { auth, getUserFromSession } from '~/services/auth.server'
import { returnToCookie } from '~/services/cookies.server'

export let loader = async ({ request }: LoaderFunctionArgs) => {
  const url = new URL(request.url)
  const returnTo = url.searchParams.get('returnTo')
  const emailResponse = url.searchParams.get('email')

  // If we're already logged in, just return to the home page. This may occur
  // while navigating back and forward or from their history
  if (await getUserFromSession(request)) {
    throw redirect('/')
  }

  const headers = new Headers()
  headers.append('Cache-Control', 'no-cache')

  if (returnTo) {
    headers.append('Set-Cookie', await returnToCookie.serialize(returnTo))
  }

  return data({ emailResponse }, { headers })
}

export async function action({ request }: ActionFunctionArgs) {
  try {
    await auth.authenticate('rfd-magic-link', request)
  } catch (err) {
    if (err instanceof Error) {
      console.error(err)
      return { errorMessage: err.message }
    } else {
      console.log('Redirect', err)
      throw err
    }
  }
}

export default function Login() {
  const loaderData = useLoaderData<typeof loader>()
  const actionData = useActionData<typeof action>()
  const [showEmailForm, setShowEmailForm] = useState(!!loaderData.emailResponse)
  const emailSuccess = loaderData.emailResponse === 'sent'

  return (
    <>
      <div
        className="fixed h-screen w-screen opacity-80"
        style={{
          background:
            'radial-gradient(200% 100% at 50% 100%, #161B1D 0%, var(--surface-default) 100%)',
        }}
      >
        <div className="border-b-secondary flex h-(--header-height) w-full items-center justify-between border-b px-3">
          <div className="space-y-1">
            <div className="bg-secondary h-3 w-16 rounded" />
            <div className="bg-secondary h-3 w-24 rounded" />
          </div>

          <div className="bg-secondary h-6 w-24 rounded" />
        </div>

        <div className="border-b-secondary mt-20 w-full border-b pb-16">
          <div className="mx-auto w-2/3 max-w-[1080px]">
            <div className="bg-secondary h-10 w-full rounded" />
            <div className="bg-secondary mt-4 h-10 w-2/3 rounded" />
          </div>
        </div>

        <div className="border-t-secondary absolute bottom-0 h-(--header-height) w-full border-t"></div>
      </div>
      <div className="overlay-shadow bg-raise border-secondary 600:w-[24rem] fixed top-1/2 left-1/2 w-[calc(100%-2.5rem)] -translate-x-1/2 -translate-y-1/2 space-y-4 rounded-lg border p-8 text-center transition-all">
        {!showEmailForm && (
          <>
            <h1 className="text-sans-2xl text-accent mb-8">Sign in</h1>
            <Form action="/auth/google" method="post">
              <Button className="w-full" type="submit">
                Continue with Google
              </Button>
            </Form>
            <Form action="/auth/github" method="post">
              <Button className="w-full" variant="secondary" type="submit">
                Continue with GitHub
              </Button>
            </Form>
            <div>
              <Button
                className="w-full"
                variant="secondary"
                onClick={() => setShowEmailForm(true)}
              >
                Continue with Email
              </Button>
            </div>
          </>
        )}
        {showEmailForm && emailSuccess && (
          <>
            <h1 className="text-sans-2xl text-accent mb-4">Email sent</h1>
            <div>Check your email for a login link.</div>
          </>
        )}
        {showEmailForm && !emailSuccess && (
          <>
            <h1 className="text-sans-2xl text-accent mb-8">Sign in</h1>
            <Form action="/login" method="post" className="space-y-4">
              <input
                placeholder="Email address"
                name="email"
                className="mousetrap overlay-shadow text-sans-md bg-raise border-secondary focus:ring-accent-secondary h-full w-full rounded border p-3 focus:ring-2 focus:outline-offset-0 focus:outline-none"
              />
              {actionData?.errorMessage && (
                <div className="text-destructive">{actionData?.errorMessage}</div>
              )}
              <Button className="w-full" type="submit">
                Send login link
              </Button>
            </Form>
            <div>
              <Button
                className="w-full"
                type="submit"
                variant="secondary"
                onClick={() => setShowEmailForm(false)}
              >
                Cancel
              </Button>
            </div>
          </>
        )}
      </div>
    </>
  )
}
