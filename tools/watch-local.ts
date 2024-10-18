/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, you can obtain one at https://mozilla.org/MPL/2.0/.
 *
 * Copyright Oxide Computer Company
 */
import { stat, writeFileSync } from 'node:fs'
import path from 'node:path'
import chokidar from 'chokidar'

if (!process.env.LOCAL_RFD_REPO) {
  console.error('Env var LOCAL_RFD_REPO must be set')
  process.exit(1)
}

// blow up if it doesn't exist
stat(process.env.LOCAL_RFD_REPO, (err) => {
  if (err) {
    console.log(err)
    process.exit(1)
  }
})

function bumpFile() {
  writeFileSync('app/.watch-trigger', '')
}

// watch asciidoc files and re-build them if they change
chokidar
  .watch(path.join(process.env.LOCAL_RFD_REPO, 'rfd/**'), {
    // don't fire an add event for every file up front, we'll just run() once
    ignoreInitial: true,
  })
  // ready fires after initial file scale. for some reason "all" doesn't seem to
  // include ready
  .on('ready', async () => {
    bumpFile()
  })
  .on('all', async (event, path) => {
    console.log(event, path)
    bumpFile()
    // const start = Date.now()
    // await run({ changedFile: path })
    // const elapsed = Date.now() - start
  })
