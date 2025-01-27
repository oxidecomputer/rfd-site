/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, you can obtain one at https://mozilla.org/MPL/2.0/.
 *
 * Copyright Oxide Computer Company
 */
import { applyPatches, parsePatch } from '@sanity/diff-match-patch'
import { createClient } from '@supabase/supabase-js'
import { nanoid } from 'nanoid'
import z from 'zod'

const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_ANON_KEY!)

const noteCreateSchema = z.object({
  title: z.string().min(1, 'Title must not be empty'),
  user: z.string().min(3, 'User must not be empty'),
})

const noteUpdateSchema = z.object({
  title: z.string().min(1, 'Title must not be empty'),
})

export const addNote = async (title: string, user: string, body: string) => {
  const validationResult = noteCreateSchema.safeParse({ title, user })
  if (!validationResult.success) {
    throw new Error(`Validation failed: ${validationResult.error.message}`)
  }

  const id = nanoid(6)
  const created = new Date().toISOString()
  const updated = created

  const { error } = await supabase.from('rfd-notes').insert({
    id,
    title,
    created,
    updated,
    user,
    body,
    published: false,
  })

  if (error) throw error
  return id
}

export const getNote = async (id: string) => {
  const { data, error } = await supabase.from('rfd-notes').select().eq('id', id).single()

  if (error) throw error
  return data
}

export const updateNote = async (id: string, title: string, body: string) => {
  const validationResult = noteUpdateSchema.safeParse({ title })
  if (!validationResult.success) {
    throw new Error(`Validation failed: ${validationResult.error.message}`)
  }

  const currentNote = await getNote(id)
  if (!currentNote) {
    throw new Error('Note not found')
  }

  const [newBody] = applyPatches(parsePatch(body), currentNote.body)
  const updated = new Date().toISOString()

  const { error } = await supabase
    .from('rfd-notes')
    .update({ title, updated, body: newBody })
    .eq('id', id)

  if (error) throw error
}

export const updateNotePublished = async (id: string, publish: boolean) => {
  const { error } = await supabase
    .from('rfd-notes')
    .update({ published: publish })
    .eq('id', id)

  if (error) throw error
}

export const deleteNote = async (id: string) => {
  const { error } = await supabase.from('rfd-notes').delete().eq('id', id)

  if (error) throw error
}

export const listNotes = async (userId: string) => {
  const { data, error } = await supabase.from('rfd-notes').select().eq('user', userId)

  if (error) throw error

  return data.map((note) => ({
    ...note,
    body: note.body.split('\n').slice(0, 20).join('\n'),
  }))
}

export const listAllNotes = async () => {
  const { data, error } = await supabase.from('rfd-notes').select()

  if (error) throw error
  return data
}
