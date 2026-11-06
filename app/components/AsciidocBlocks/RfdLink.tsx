/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, you can obtain one at https://mozilla.org/MPL/2.0/.
 *
 * Copyright Oxide Computer Company
 */

import {
  Context,
  inlineHtml,
  parse,
  RenderInline,
  useConverterContext,
  type Inline,
} from '@oxide/react-asciidoc'
import cn from 'classnames'
import { isValidElement, type ReactNode } from 'react'
import { Link, useRouteLoaderData } from 'react-router'

import Icon from '~/components/Icon'
import { extractRfdNumber, RfdPreviewCard } from '~/components/rfd/RfdPreview'
import { useHoverCard } from '~/components/rfd/use-hover-card'
import type { RfdListItem } from '~/services/rfd.server'

type AnchorProps = {
  href?: string
  id?: string
  className?: string
  target?: string
}

/**
 * Inline override for anchors. RFDs referenced from the body — whether as a
 * link, a `[bibliography]` cross-reference resolving to an RFD URL, or a classic
 * `<<rfd-123>>` anchor — become relative react-router `<Link>`s with a hover
 * preview. Other internal links navigate client-side, bibliography xrefs to
 * external resources link straight out, and everything else (in-page xrefs,
 * refs, external links) renders exactly as the default renderer would — we
 * round-trip the node through `inlineHtml`/`parse` so there's no drift from
 * stock output.
 */
const RfdLink = ({ node, children }: { node: Inline.AnchorNode; children: ReactNode }) => {
  const parsed = parse(inlineHtml([node]).__html)
  // Bibrefs serialise to multiple nodes (`[<a/>]`); anything that isn't a
  // single anchor element just renders stock.
  const props = isValidElement(parsed) ? (parsed.props as AnchorProps) : null

  // A bibliography xref carries its resolved URL on `externalHref`; it takes
  // priority over the stock in-page (`#id`) anchor href.
  const externalHref = node.subtype === 'xref' ? node.externalHref : undefined

  // The resolved bibliography entry's content, when an xref points at one.
  // Added upstream alongside `externalHref`; until it lands this is never set,
  // so the reference-card branch below is simply a no-op.
  const referenceInlines =
    node.subtype === 'xref'
      ? (node as Inline.AnchorNode & { referenceInlines?: Inline.InlineNode[] })
          .referenceInlines
      : undefined

  // The target used to detect RFD references: a link's decoded href, a
  // bibliography xref's resolved URL, or a classic `<<rfd-123>>`'s `#` anchor.
  const navHref = externalHref ?? props?.href

  const rfdNumber = navHref ? extractRfdNumber(navHref) : null
  if (rfdNumber !== null) {
    return (
      <RfdHoverLink rfdNumber={rfdNumber} id={props?.id} className={props?.className}>
        {children}
      </RfdHoverLink>
    )
  }

  // Bibliography cross-reference: read the entry in a hover card without
  // scrolling to the references section. Clicking still follows the citation —
  // an external URL, or the stock in-page `#id` anchor.
  if (referenceInlines?.length) {
    return (
      <RfdReferenceLink
        href={externalHref ?? props?.href}
        external={!!externalHref}
        id={props?.id}
        className={props?.className}
        nodes={referenceInlines}
      >
        {children}
      </RfdReferenceLink>
    )
  }

  // Bibliography xref to a non-RFD external resource links straight out.
  if (externalHref) {
    return (
      <a
        href={externalHref}
        target="_blank"
        rel="noopener"
        id={props?.id}
        className={props?.className}
      >
        {children}
      </a>
    )
  }

  // Same-origin relative links navigate client-side. Absolute URLs (including
  // in-page `#` anchors and `target="_blank"` links) keep the stock anchor.
  if (node.subtype === 'link' && props?.href?.startsWith('/') && !props.target) {
    return (
      <Link to={props.href} id={props.id} className={props.className} prefetch="intent">
        {children}
      </Link>
    )
  }

  return <>{parsed}</>
}

/**
 * A `[bibliography]` cross-reference. Clicking follows the citation (an external
 * URL, or the stock in-page anchor); hovering shows the entry's content in a
 * card so it can be read — and its links clicked — without scrolling down.
 */
const RfdReferenceLink = ({
  href,
  external,
  id,
  className,
  nodes,
  children,
}: {
  external: boolean
  nodes: Inline.InlineNode[]
  children: ReactNode
} & AnchorProps) => {
  // The card renders outside the <Asciidoc> tree, so re-provide the converter
  // context — that keeps the entry's inner links flowing through our overrides,
  // and `.footnotes` gives it the footnotes-section styling.
  const ctx = useConverterContext()

  const { ref, onMouseEnter, onMouseLeave, onClick } = useHoverCard<HTMLAnchorElement>(
    () => ({
      key: `ref-${href ?? ''}`,
      content: (
        <Context.Provider value={ctx}>
          <div className="footnotes text-sans-md text-default">
            <p className="m-0">
              <RenderInline nodes={nodes} />
            </p>
          </div>
        </Context.Provider>
      ),
    }),
  )

  return (
    <a
      ref={ref}
      href={href}
      id={id}
      className={className}
      target={external ? '_blank' : undefined}
      rel={external ? 'noopener' : undefined}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      onClick={onClick}
    >
      {children}
    </a>
  )
}

/**
 * A link to another RFD: navigates client-side and opens a hover preview after
 * a short delay. The delay and cleanup live in this component, so there's no
 * document-wide event delegation.
 */
const RfdHoverLink = ({
  rfdNumber,
  id,
  className,
  children,
}: {
  rfdNumber: number
  children: ReactNode
} & AnchorProps) => {
  // Read the root loader directly rather than importing `useRootLoaderData`:
  // this component sits in the server-side asciidoctor import chain, and
  // importing `~/root` there would create a circular import.
  const data = useRouteLoaderData('root') as
    | { rfds: RfdListItem[]; user: unknown }
    | undefined
  const rfds = data?.rfds ?? []
  const { document } = useConverterContext()
  const currentRfd = Number(document.attributes?.rfdnumber)
  const matchedRfd = rfds.find((rfd) => rfd.number === rfdNumber)

  const { ref, onMouseEnter, onMouseLeave, onClick } = useHoverCard<HTMLAnchorElement>(
    () =>
      matchedRfd && rfdNumber !== currentRfd
        ? { key: `rfd-${rfdNumber}`, content: <RfdPreviewCard rfd={matchedRfd} /> }
        : null,
  )

  // The linked RFD isn't in the set this reader can see. We can't (and
  // shouldn't) tell "private" apart from "doesn't exist" — that mirrors the RFD
  // loader, which deliberately 404s rather than leak a private RFD's existence.
  // Surface it as a restricted reference instead of a link that dead-ends.
  if (!matchedRfd && rfdNumber !== currentRfd) {
    const formattedNumber = rfdNumber.toString().padStart(4, '0')
    const lock = (
      <Icon
        name="security"
        size={16}
        className="text-tertiary align-text-center ml-0.5 inline-block h-3 w-3"
      />
    )
    // Signed-out readers can gain access by logging in, so point them there;
    // signed-in readers simply don't have access, so it's non-interactive.
    return data?.user ? (
      <span
        className={cn(className, 'text-tertiary cursor-default')}
        title="You don't have access to this RFD"
      >
        {children}
        {lock}
      </span>
    ) : (
      <Link
        to={`/login?returnTo=/rfd/${formattedNumber}`}
        className={cn(className, 'text-tertiary')}
        title="Sign in to view this RFD"
      >
        {children}
        {lock}
      </Link>
    )
  }

  return (
    <Link
      ref={ref}
      to={`/rfd/${rfdNumber.toString().padStart(4, '0')}`}
      id={id}
      className={className}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      onClick={onClick}
      prefetch="intent"
    >
      {children}
    </Link>
  )
}

export default RfdLink
