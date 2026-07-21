/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, you can obtain one at https://mozilla.org/MPL/2.0/.
 *
 * Copyright Oxide Computer Company
 */

class BoundedCache<V> {
  #entries = new Map<string, V>()
  #max: number

  constructor(max: number) {
    this.#max = max
  }

  get(key: string): V | undefined {
    return this.#entries.get(key)
  }

  set(key: string, value: V) {
    this.#entries.delete(key)
    this.#entries.set(key, value)
    while (this.#entries.size > this.#max) {
      this.#entries.delete(this.#entries.keys().next().value!)
    }
  }

  clear() {
    this.#entries.clear()
  }
}

// rfd.$slug loader data keyed by slug. Logout navigates client-side, so the
// logout handler must clear() this.
export const rfdPageCache = new BoundedCache<unknown>(30)

// lets the background refresh in rfd.$slug's clientLoader tell the mounted
// route to revalidate when it finds changed content
const staleListeners = new Set<() => void>()

export function subscribeRfdStale(fn: () => void) {
  staleListeners.add(fn)
  return () => {
    staleListeners.delete(fn)
  }
}

export function notifyRfdStale() {
  for (const fn of staleListeners) fn()
}
