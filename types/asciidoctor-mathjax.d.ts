/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, you can obtain one at https://mozilla.org/MPL/2.0/.
 *
 * Copyright Oxide Computer Company
 */

declare module '@djencks/asciidoctor-mathjax' {
  // eslint-disable-next-line @typescript-eslint/consistent-type-imports
  type Registry = import('@asciidoctor/core').Extensions.Registry
  type Config = {}

  function register(registry: Registry, config?: Config): Registry
}
