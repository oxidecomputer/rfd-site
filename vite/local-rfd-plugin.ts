/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, you can obtain one at https://mozilla.org/MPL/2.0/.
 *
 * Copyright Oxide Computer Company
 */

import fs from 'node:fs'
import path from 'node:path'
import { type Plugin } from 'vite'

export function LocalRfdPlugin(localRepo: string): Plugin {
  return {
    name: 'vite-plugin-local-rfd',
    buildStart() {
      // blow up if it doesn't exist
      fs.stat(localRepo, (err) => {
        if (err) {
          console.error(`Error: LOCAL_RFD_REPO ${localRepo} does not exist`)
          process.exit(1)
        }
      })
      this.addWatchFile(path.join(localRepo, 'rfd'))
    },
    handleHotUpdate(ctx) {
      if (ctx.file.startsWith(localRepo)) {
        ctx.server.config.logger.info(`reloading: ${ctx.file} changed`)
        // bit of a hack but I'm not sure what else to do
        ctx.server.ws.send({ type: 'full-reload', path: 'app/services/rfd.server.ts' })
      }
    },
  }
}
