/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, you can obtain one at https://mozilla.org/MPL/2.0/.
 *
 * Copyright Oxide Computer Company
 */

import { useEffect, useRef, useState } from 'react'
import { useLocation } from 'react-router'

/**
 * A real page load tells a screen reader where it landed: the new page gets
 * announced and the reading position goes back to the top. A client-side nav
 * does neither — React Router swaps the DOM in place and focus stays on the
 * link that was clicked, which usually isn't in the document anymore. Next.js
 * ships a route announcer for this; React Router leaves it to the app.
 *
 * So on every page change we do it ourselves: announce the new page in a
 * visually hidden live region, and move focus to the top of the content, which
 * is where the skip link points too. Gatsby's user testing with screen reader
 * users recommends this announce + move-focus combination:
 * https://www.gatsbyjs.com/blog/2019-07-11-user-testing-accessible-client-routing/
 * https://github.com/vercel/next.js/blob/08b1916/packages/next/src/client/route-announcer.tsx
 */
const RouteAnnouncer = () => {
  const { pathname, hash } = useLocation()
  const [announcement, setAnnouncement] = useState('')
  // no announcement on initial load — the real page load announces itself
  const isFirstRender = useRef(true)

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false
      return
    }

    // <Meta> has already rendered the new title by the time effects run. Commas
    // instead of pipes so a screen reader reads it as a phrase — "68 -
    // Partnership as Shared Values, RFD, Oxide" — rather than reading out the
    // punctuation.
    setAnnouncement(document.title.split(' | ').join(', '))

    // Two cases where the destination is a better judge of the reading position
    // than we are: the index page focuses its filter input on mount, and an
    // anchor nav (from a search result, say) asked for a specific section.
    //
    // Both are decided from the location rather than from document.activeElement
    // — "focus is still on the body, so the thing that had it unmounted" reads
    // like the obvious test but isn't reliable. Browsers disagree (Safari
    // doesn't focus links on click, so after a link click focus is on the link
    // in Firefox but on the body in Safari), and mid-navigation the outgoing
    // page's #content can still be in the document alongside the new one.
    if (pathname === '/' || hash) return

    // Prefer the page's h1 over <main>. VoiceOver reads a focused heading's
    // text, whereas focusing a big landmark container just gets "main" with no
    // content. The h1 also remounts on every page change, while <main> persists
    // across navs — refocusing an already-focused element is a no-op that fires
    // no event, so the VO cursor would never move after the first nav. Focusing
    // the destination page's heading is the standard recommendation for SPA
    // route changes: https://www.deque.com/blog/single-page-apps-focus-management/
    //
    // preventScroll because scroll position is <ScrollRestoration />'s job:
    // without it, focusing the top of the page clobbers the restored position
    // on back/forward nav.
    const main = document.getElementById('content')
    const heading = main?.querySelector('h1')
    if (heading) {
      heading.tabIndex = -1 // headings aren't focusable by default
      // Safari (unlike Chrome/FF) matches :focus-visible on programmatic focus
      // even when the nav came from a click. The heading isn't interactive, so
      // never show a ring.
      heading.classList.add('outline-none')
    }
    ;(heading || main)?.focus({ preventScroll: true })
  }, [pathname, hash])

  return (
    <p aria-live="assertive" role="alert" data-testid="route-announcer" className="sr-only">
      {announcement}
    </p>
  )
}

export default RouteAnnouncer
