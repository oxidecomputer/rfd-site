/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, you can obtain one at https://mozilla.org/MPL/2.0/.
 *
 * Copyright Oxide Computer Company
 */
import { type DocumentBlock } from '@oxide/react-asciidoc'
import { Link } from 'react-router'

import Container from '../Container'
import { GotoIcon } from '../CustomIcons'

const Footnotes = ({ doc }: { doc: DocumentBlock }) => {
  if (!doc.footnotes) return null

  if (doc.footnotes.length > 0 && doc.blocks && !doc.attributes['nofootnotes']) {
    return (
      <div id="footnotes" className="border-secondary 800:mt-16 mt-12 border-t pt-4">
        <Container isGrid>
          <div className="text-mono-xs text-tertiary 1200:col-span-2 1200:col-start-1 col-span-12 col-start-2">
            Footnotes
          </div>

          <ul
            id="footnotes"
            className="800:pr-16 1200:col-start-3 1200:w-[calc(100%-var(--toc-width))] col-span-12 col-start-2 print:col-span-12! print:col-start-1!"
          >
            {doc.footnotes.map((footnote) => (
              <li
                key={footnote.index}
                id={`_footnotedef_${footnote.index}`}
                className="relative mb-2"
              >
                <div className="text-mono-xs text-default bg-tertiary absolute -top-[2px] -left-12 flex shrink-0 items-center justify-center rounded-full px-[4px] py-[2px] tracking-normal!">
                  {footnote.index}
                </div>
                <div className="text-sans-md text-default max-w-800">
                  <p
                    dangerouslySetInnerHTML={{ __html: footnote.text || '' }}
                    className="inline"
                  />{' '}
                  <Link
                    className="footnote group text-accent-tertiary group-hover:text-accent -m-2 p-2 whitespace-nowrap"
                    to={`#_footnoteref_${footnote.index}`}
                  >
                    <GotoIcon className="inline-block rotate-180" />
                    <span className="inline-block translate-x-0 opacity-0 transition-all group-hover:translate-x-1 group-hover:opacity-100">
                      View
                    </span>
                  </Link>
                </div>
              </li>
            ))}
          </ul>
        </Container>
      </div>
    )
  } else {
    return null
  }
}

export default Footnotes
