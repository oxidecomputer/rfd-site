/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, you can obtain one at https://mozilla.org/MPL/2.0/.
 *
 * Copyright Oxide Computer Company
 */

// @ts-check

/** @type {import('tailwindcss/lib/util/createPlugin').default} */
// @ts-ignore
const plugin = require('tailwindcss/plugin')
const {
  textUtilities,
  colorUtilities,
  borderRadiusTokens,
  elevationUtilities,
} = require('@oxide/design-system/styles/dist/tailwind-tokens')

/** @type {import('tailwindcss/tailwind-config').TailwindConfig} */
module.exports = {
  corePlugins: {
    fontFamily: false,
    fontSize: true,
  },
  content: [
    './libs/**/*.{ts,tsx,mdx}',
    './app/**/*.{ts,tsx}',
    'node_modules/@oxide/design-system/components/**/*.{ts,tsx,jsx,js}',
  ],
  safelist: ['bg-scrim'],
  theme: {
    extend: {
      screens: {
        400: '400px',
        500: '500px',
        '-600': { max: '600px' },
        600: '600px',
        800: '800px',
        900: '900px',
        1000: '1000px',
        1100: '1100px',
        1200: '1200px',
        1400: '1400px',
        1600: '1600px',
        print: { raw: 'print' },
      },
      maxWidth: {
        500: '500px',
        600: '600px',
        620: '620px',
        720: '720px',
        800: '800px',
        900: '900px',
        1000: '1000px',
        1060: '1060px',
        1200: '1200px',
        1400: '1400px',
        1600: '1600px',
        1800: '1800px',
      },
    },
    borderRadius: {
      ...borderRadiusTokens,
    },
    colors: {
      transparent: 'transparent',
      current: 'currentColor',
    },
    backgroundImage: {
      'header-grid-mask': 'radial-gradient(rgba(8,15,17,0) 0%, rgba(8,15,17,1) 100%)',
    },
  },
  plugins: [
    plugin(({ addUtilities, addVariant }) => {
      addUtilities(textUtilities)
      addUtilities(colorUtilities)
      addUtilities(elevationUtilities)
      addVariant('children', '& > *')
    }),
    require('@tailwindcss/line-clamp'),
  ],
  variants: {
    extend: {
      translate: ['group-hover'],
    },
  },
}
