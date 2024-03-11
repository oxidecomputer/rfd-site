/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, you can obtain one at https://mozilla.org/MPL/2.0/.
 *
 * Copyright Oxide Computer Company
 */

/** @type {import('@remix-run/dev').AppConfig} */
module.exports = {
  ignoredRouteFiles: ['**/.*'],
  // appDirectory: "app",
  // assetsBuildDirectory: "public/build",
  // serverBuildPath: "api/index.js",
  // publicPath: "/build/",

  // if LOCAL_RFD_REPO is defined, we are doing local RFD authoring and we want
  // to reload the page whenever a source file changes
  watchPaths: process.env.LOCAL_RFD_REPO
    ? [`${process.env.LOCAL_RFD_REPO}/rfd`]
    : undefined,
  postcss: true,
  tailwind: true,
  serverDependenciesToBundle: [
    /^marked.*/,
    /^mermaid.*/,
    /^micromark.*/,
    /^d3.*/,
    'khroma',
    'internmap',
    /^mdast-util-.*/,
    'delaunator',
    /^dagre-d3-es.*/,
    /^lodash-es.*/,
    // if we include this, we get a warning about initializing opal twice
    // '@asciidoctor/core',
    '@asciidoctor/opal-runtime',
    'robust-predicates',
    'decode-named-character-reference',
    'character-entities',
    'unist-util-stringify-position',
    'unxhr',
  ],
  serverModuleFormat: 'cjs',
  future: {
    v2_dev: true,
    v2_errorBoundary: true,
    v2_headers: true,
    v2_meta: true,
    v2_normalizeFormMethod: true,
    v2_routeConvention: true,
  },
}
