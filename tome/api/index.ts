import { Elysia } from 'elysia'

import {
  addTome,
  deleteTome,
  getTome,
  listAllTomes,
  listTomes,
  updateTome,
  type TomeBody,
} from './main'

const API_KEY = 'abcdef'

const ServerError = { error: 'Something went wrong' }

new Elysia()
  .onRequest(({ request, set }) => {
    const apiKey = request.headers.get('x-api-key')
    if (apiKey !== API_KEY) {
      set.status = 401

      return 'Not Authorized'
    }
  })
  .get('/user/:userId', async ({ params: { userId }, set }) => {
    try {
      const tomes = await listTomes(userId)
      set.status = 200
      return tomes
    } catch (error) {
      set.status = 500
      return ServerError
    }
  })
  .get('/tome', async ({ set }) => {
    try {
      const tomes = await listAllTomes()
      set.status = 200
      return tomes
    } catch (error) {
      set.status = 500
      return ServerError
    }
  })
  .get('/tome/:id', async ({ params: { id }, set }) => {
    const tome = await getTome(id)
    if (!tome) {
      set.status = 404
      return 'Not Found'
    }
    return tome
  })
  .post('/tome', async ({ body, set }) => {
    try {
      const { title, user, body: tomeBody } = body as TomeBody
      const id = await addTome(title, user, tomeBody)
      set.status = 201
      return { id }
    } catch (error) {
      set.status = 400
      return { error: (error as Error).message }
    }
  })
  .put('/tome/:id', async ({ params: { id }, body, set }) => {
    try {
      const { title, body: tomeBody } = body as TomeBody
      const result = await updateTome(id, title, tomeBody)
      set.status = 200
      return result
    } catch (error) {
      set.status = 500
      return { error: (error as Error).message }
    }
  })
  .delete('/tome/:id', async ({ params: { id }, set }) => {
    try {
      await deleteTome(id)
      set.status = 204
    } catch (error) {
      set.status = 500
      return ServerError
    }
  })
  .listen(8080)
