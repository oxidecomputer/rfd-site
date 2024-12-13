import { type DocumentBlock } from '@oxide/react-asciidoc'
import { Link } from '@remix-run/react'

import Container from '../Container'
import { GotoIcon } from '../CustomIcons'

const Footnotes = ({ doc }: { doc: DocumentBlock }) => {
  if (!doc.footnotes) return null

  if (doc.footnotes.length > 0 && doc.blocks && !doc.attributes['nofootnotes']) {
    return (
      <div id="footnotes" className="mt-12 border-t pt-4 border-secondary 800:mt-16">
        <Container isGrid>
          <div className="col-span-12 col-start-2 text-mono-xs text-quaternary 1200:col-span-2 1200:col-start-1">
            Footnotes
          </div>

          <ul
            id="footnotes"
            className="col-span-12 col-start-2 800:pr-16 1100:w-[calc(100%-var(--toc-width))] 1200:col-start-3 print:!col-span-12 print:!col-start-1"
          >
            {doc.footnotes.map((footnote) => (
              <li
                key={footnote.index}
                id={`_footnotedef_${footnote.index}`}
                className="relative mb-2"
              >
                <div className="absolute -left-12 -top-[2px] flex flex-shrink-0 items-center justify-center rounded-full px-[4px] py-[2px] !tracking-normal text-mono-xs text-secondary bg-tertiary">
                  {footnote.index}
                </div>
                <div className="text-sans-md text-secondary">
                  <p
                    dangerouslySetInnerHTML={{ __html: footnote.text || '' }}
                    className="inline"
                  />{' '}
                  <Link
                    className="footnote group -m-2 whitespace-nowrap p-2 text-accent-tertiary group-hover:text-accent"
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
