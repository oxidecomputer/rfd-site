/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, you can obtain one at https://mozilla.org/MPL/2.0/.
 *
 * Copyright Oxide Computer Company
 */

const isProd = process.env.NODE_ENV === 'production'

module.exports = {
  plugins: [
    require('postcss-import'),
    require('tailwindcss/nesting')(require('postcss-nesting')),
    require('tailwindcss'),
    // use `npx autoprefixer --info` to see autoprefixer debug inf
    require('autoprefixer'),
    ...(isProd ? [require('cssnano')] : []),
  ],
}
