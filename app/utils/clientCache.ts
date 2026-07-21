/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, you can obtain one at https://mozilla.org/MPL/2.0/.
 *
 * Copyright Oxide Computer Company
 */

/**
 * A small TTL cache for client loader data, so revisiting a page during a
 * session doesn't wait on the server. Module state is per-tab and is wiped by
 * any full document load. Logout happens via SPA navigation, so the logout
 * handler must clear() this explicitly to avoid serving pages the user could
 * see before but not after.
 */
class TtlCache<V> {
  #entries = new Map<string, { value: V; storedAt: number }>()
  #ttl: number
  #max: number

  constructor(ttl: number, max: number) {
    this.#ttl = ttl
    this.#max = max
  }

  get(key: string): V | undefined {
    const entry = this.#entries.get(key)
    if (!entry) return undefined
    if (Date.now() - entry.storedAt > this.#ttl) {
      this.#entries.delete(key)
      return undefined
    }
    return entry.value
  }

  set(key: string, value: V) {
    this.#entries.delete(key)
    this.#entries.set(key, { value, storedAt: Date.now() })
    while (this.#entries.size > this.#max) {
      this.#entries.delete(this.#entries.keys().next().value!)
    }
  }

  clear() {
    this.#entries.clear()
  }
}

/** Cache of rfd.$slug loader data, keyed by slug */
export const rfdPageCache = new TtlCache<unknown>(5 * 60 * 1000, 30)
