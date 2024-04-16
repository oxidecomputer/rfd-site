import { Database } from 'bun:sqlite'
import { nanoid } from 'nanoid'
import { z } from 'zod'

const db = new Database('./db/tome.db')

export interface TomeBody {
  title: string
  user: string
  body: string
}

const tomeCreateSchema = z.object({
  title: z.string().min(1, 'Title must not be empty'),
  user: z.string().min(3, 'User must not be empty'),
})

export const addTome = async (title: string, user: string, body: string) => {
  const validationResult = tomeCreateSchema.safeParse({ title, user })
  if (!validationResult.success) {
    throw new Error(`Validation failed: ${validationResult.error.message}`)
  }

  const id = nanoid(6)
  const created = new Date().toISOString()
  const updated = created

  const statement = await db.prepare(
    'INSERT INTO tomes (id, title, created, updated, user, body) VALUES (?, ?, ?, ?, ?, ?)',
  )
  await statement.run(id, title, created, updated, user, body)

  return id
}

export const getTome = async (id: string) => {
  const query = db.query('SELECT * FROM tomes WHERE id = $id')
  return query.get({ $id: id })
}

const tomeUpdateSchema = z.object({
  title: z.string().min(1, 'Title must not be empty'),
})

export const updateTome = async (id: string, title: string, body: string) => {
  const validationResult = tomeUpdateSchema.safeParse({ title })
  if (!validationResult.success) {
    throw new Error(`Validation failed: ${validationResult.error.message}`)
  }

  const updated = new Date().toISOString()

  const statement = await db.prepare(
    'UPDATE tomes SET title = ?, updated = ?, body = ? WHERE id = ?',
  )
  await statement.run(title, updated, body, id)
}

export const deleteTome = async (id: string) => {
  const statement = await db.prepare('DELETE FROM tomes WHERE id = ?')
  await statement.run(id)
}

export const listTomes = async (userId: string) => {
  const query = db.query('SELECT * FROM tomes WHERE user = $userId')
  const tomes = await query.all({ $userId: userId })

  // We only want the first 20 lines so we're not sending a huge response
  const trimmedTomes = tomes.map((tome) => ({
    ...(tome as TomeBody),
    body: (tome as TomeBody).body.split('\n').slice(0, 20).join('\n'),
  }))

  return trimmedTomes
}

export const listAllTomes = async () => {
  const query = db.query('SELECT * FROM tomes')

  return query.all()
}
