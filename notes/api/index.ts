/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, you can obtain one at https://mozilla.org/MPL/2.0/.
 *
 * Copyright Oxide Computer Company
 */
import { Elysia } from 'elysia'

import { API_KEYS } from './auth'
import {
  addNote,
  deleteNote,
  getNote,
  listAllNotes,
  listNotes,
  updateNote,
  updateNotePublished,
  type NoteBody,
} from './main'

const ServerError = { error: 'Something went wrong' }

const validateApiKey = (request: Request) => {
  const apiKey = request.headers.get('x-api-key')
  return API_KEYS.has(apiKey ?? '')
}

export const run = () => {
  new Elysia()
    .onRequest(({ request, set }) => {
      if (!validateApiKey(request)) {
        set.status = 401
        return { error: 'Not Authorized' }
      }
    })
    .get('/user/:userId', async ({ params: { userId }, set }) => {
      try {
        const notes = await listNotes(userId)
        set.status = 200
        return notes
      } catch (error) {
        console.error(error)
        set.status = 500
        return ServerError
      }
    })
    .get('/notes', async ({ set }) => {
      try {
        const notes = await listAllNotes()
        set.status = 200
        return notes
      } catch (error) {
        console.error(error)
        set.status = 500
        return ServerError
      }
    })
    .get('/notes/:id', async ({ params: { id }, set }) => {
      try {
        const note = await getNote(id)
        if (!note) {
          set.status = 404
          return 'Not Found'
        }
        return note
      } catch (error) {
        console.error(error)
        set.status = 500
        return ServerError
      }
    })
    .post('/notes', async ({ body, set }) => {
      try {
        const { title, user, body: noteBody } = body as NoteBody
        const id = await addNote(title, user, noteBody)
        set.status = 201
        return { id }
      } catch (error) {
        console.error(error)
        set.status = 400
        return { error: (error as Error).message }
      }
    })
    .post('/notes/:id/publish', async ({ params, request, set }) => {
      try {
        const { id } = params
        const { publish } = await request.json()
        await updateNotePublished(id, publish)
        set.status = 200
        return { message: `Note ${publish ? 'published' : 'unpublished'} successfully.` }
      } catch (error) {
        console.error(error)
        set.status = 400
        return { error: (error as Error).message }
      }
    })
    .put('/notes/:id', async ({ params: { id }, body, set }) => {
      try {
        const { title, body: noteBody } = body as NoteBody
        await updateNote(id, title, noteBody)
        set.status = 200
        return { message: 'Note updated successfully' }
      } catch (error) {
        console.error(error)
        set.status = 500
        return { error: (error as Error).message }
      }
    })
    .delete('/notes/:id', async ({ params: { id }, set }) => {
      try {
        await deleteNote(id)
        set.status = 204
      } catch (error) {
        console.error(error)
        set.status = 500
        return ServerError
      }
    })
    .listen(8000)
}
