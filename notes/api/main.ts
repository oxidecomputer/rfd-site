import { applyPatches, parsePatch, type Patch } from '@sanity/diff-match-patch'
import { Database } from 'bun:sqlite'
import { nanoid } from 'nanoid'
import { z } from 'zod'

const db = new Database('./db/notes.db')

export interface NoteBody {
  title: string
  user: string
  body: string
  published: boolean
}

const noteCreateSchema = z.object({
  title: z.string().min(1, 'Title must not be empty'),
  user: z.string().min(3, 'User must not be empty'),
})

export const addNote = async (title: string, user: string, body: string) => {
  const validationResult = noteCreateSchema.safeParse({ title, user })
  if (!validationResult.success) {
    throw new Error(`Validation failed: ${validationResult.error.message}`)
  }

  const id = nanoid(6)
  const created = new Date().toISOString()
  const updated = created

  const statement = await db.prepare(
    'INSERT INTO notes (id, title, created, updated, user, body, published) VALUES (?, ?, ?, ?, ?, ?, ?)',
  )
  await statement.run(id, title, created, updated, user, body, 0)

  return id
}

export const getNote = async (id: string) => {
  const query = db.query('SELECT * FROM notes WHERE id = $id')
  return await query.get({ $id: id })
}

const noteUpdateSchema = z.object({
  title: z.string().min(1, 'Title must not be empty'),
})

export const updateNote = async (id: string, title: string, body: Patch[]) => {
  const validationResult = noteUpdateSchema.safeParse({ title })
  if (!validationResult.success) {
    throw new Error(`Validation failed: ${validationResult.error.message}`)
  }

  const currentNote = await getNote(id)
  if (!currentNote) {
    throw new Error('Note not found')
  }
  const [newBody] = applyPatches(parsePatch(body), (currentNote as NoteBody).body)

  const updated = new Date().toISOString()

  const statement = await db.prepare(
    'UPDATE notes SET title = ?, updated = ?, body = ? WHERE id = ?',
  )
  await statement.run(title, updated, newBody, id)
}

export const updateNotePublished = async (id: string, publish: boolean) => {
  const published = publish ? 1 : 0 // Convert boolean to integer for SQL
  const statement = await db.prepare('UPDATE notes SET published = ? WHERE id = ?')
  await statement.run(published, id)
}

export const deleteNote = async (id: string) => {
  const statement = await db.prepare('DELETE FROM notes WHERE id = ?')
  await statement.run(id)
}

export const listNotes = async (userId: string) => {
  const query = db.query('SELECT * FROM notes WHERE user = $userId')
  const notes = await query.all({ $userId: userId })

  // We only want the first 20 lines so we're not sending a huge response
  const trimmedNotes = notes.map((note) => ({
    ...(note as NoteBody),
    body: (note as NoteBody).body.split('\n').slice(0, 20).join('\n'),
  }))

  return trimmedNotes
}

export const listAllNotes = async () => {
  const query = db.query('SELECT * FROM notes')

  return query.all()
}
