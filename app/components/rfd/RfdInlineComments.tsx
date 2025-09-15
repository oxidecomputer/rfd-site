/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, you can obtain one at https://mozilla.org/MPL/2.0/.
 *
 * Copyright Oxide Computer Company
 */

import {
  autoUpdate,
  FloatingFocusManager,
  offset,
  useClick,
  useDismiss,
  useFloating,
  useId,
  useInteractions,
  useRole,
} from '@floating-ui/react'
import { Badge } from '@oxide/design-system/components'
import cn from 'classnames'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import uniqBy from 'lodash/uniqBy'
import { marked } from 'marked'
import { useEffect, useMemo, useState } from 'react'
import { renderToString } from 'react-dom/server'
import diff from 'simple-text-diff'

import Container from '~/components/Container'
import Icon from '~/components/Icon'
import useWindowSize from '~/hooks/use-window-size'
import type {
  ListReviewsCommentsType,
  ReviewCommentsType,
} from '~/services/github-discussion.server'

import { calcOffset } from './RfdPreview'

dayjs.extend(relativeTime)

type CommentThreadData = {
  data: ListReviewsCommentsType
  targetEl: HTMLElement | null
  offset: number | null
}

type Comment = {
  [key: string]: CommentThreadData
}

export const matchCommentToBlock = (
  line: number | null | undefined,
  lineNumbers: NodeListOf<HTMLElement>,
): HTMLElement | null => {
  let block: HTMLElement | null = null
  let prevDelta = 999999

  lineNumbers.forEach((lineNumberEl) => {
    const lineno = parseInt(lineNumberEl.dataset.lineno || '-1')

    if (!lineno || lineno === -1 || !line) {
      return
    }

    // Check if there's an exact match
    if (lineno === line) {
      block = lineNumberEl
    }

    const lineNumberDelta = line - lineno

    // If not, check find the match with the closest lowest number
    // Optimise by cancelling the loop if lineNumberDelta is greater
    // Need to check if the elements are ordered by their line numbers
    // in the order that they show up on the page
    if (lineNumberDelta < prevDelta && lineNumberDelta > 0) {
      block = lineNumberEl
      prevDelta = lineNumberDelta
    }
  })

  return block
}

const RfdInlineComments = ({ comments }: { comments: ListReviewsCommentsType }) => {
  const [isLoaded, setIsLoaded] = useState(false)
  const [inlineComments, setInlineComments] = useState<Comment>({})

  useEffect(() => {
    setIsLoaded(true)
  }, [])

  useEffect(() => {
    // Get a list of elements with data-lineno
    // This is used to attach comments to their associated rendered line
    let lineNumbers =
      typeof document !== 'undefined' ? document.querySelectorAll('[data-lineno]') : []

    const newComments: Comment = {}

    comments.forEach((comment) => {
      const block = matchCommentToBlock(
        comment.line,
        lineNumbers as NodeListOf<HTMLElement>,
      )

      // If a comment doesn't have a line it is because the line
      // has changed and the comment is outdated
      if (!comment.line) {
        return
      }

      if (block) {
        if (!newComments[comment.line]) {
          // Group by comment thread
          newComments[comment.line] = {
            data: [],
            targetEl: block,
            offset: 0,
          }
        }
        newComments[comment.line].data.push(comment)
      }
    })

    // If an element shares the same block, find them and offset the position accordingly
    Object.keys(newComments).forEach((key) => {
      const comment = newComments[key]
      const groupedCommentKeys = Object.keys(newComments).filter((altKey) => {
        const altComment = newComments[altKey]
        return altComment.targetEl === comment.targetEl
      })

      groupedCommentKeys.forEach((key, index) => {
        const groupedComment = newComments[key]
        groupedComment.offset = index * 32
      })
    })

    // Group comments by block
    // in_reply_to_id
    setInlineComments(newComments)
  }, [comments])

  if (!inlineComments || !isLoaded) return null

  return (
    <Container className="z-10 print:hidden">
      {Object.keys(inlineComments).map((key, index) => {
        const commentThread = inlineComments[parseInt(key)]
        return (
          <CommentThread
            key={key || -1}
            commentThread={commentThread}
            isLoaded={isLoaded}
            index={index}
          />
        )
      })}
    </Container>
  )
}

type CommentThreadProps = {
  commentThread: CommentThreadData
  isLoaded: boolean
  index: number
}

const CommentThread = ({ commentThread, isLoaded, index }: CommentThreadProps) => {
  const [open, setOpen] = useState(false)
  const { size, hasLargeScreen } = useWindowSize()

  const { context, x, y, reference, floating, strategy } = useFloating({
    open,
    onOpenChange: setOpen,

    placement: 'bottom-start',
    whileElementsMounted: autoUpdate,
    middleware: [offset(10)],
  })

  const click = useClick(context)
  const dismiss = useDismiss(context, {
    outsidePressEvent: 'mousedown',
  })
  const role = useRole(context)

  const { getReferenceProps, getFloatingProps } = useInteractions([click, dismiss, role])

  const headingId = useId()

  // Recalculate the tooltip position when the screen size changes
  const offsetTop = useMemo(
    () => (commentThread.targetEl ? calcOffset(commentThread.targetEl).top : 0),
    // it gets mad when you have extra deps, which is silly
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [size, commentThread.targetEl],
  )

  const users = useMemo(
    () =>
      uniqBy(
        commentThread.data.map((c) => c.user),
        (u) => u.login,
      ),
    [commentThread],
  )

  if (!commentThread.targetEl || !hasLargeScreen) {
    return null
  }

  return (
    <div
      className="absolute"
      style={{
        top: offsetTop + (commentThread.offset || 0),
      }}
    >
      <button
        className="flex items-center justify-center"
        ref={reference}
        style={{
          transitionDelay: `${Math.min(index * 150, 500)}ms`,
          opacity: isLoaded ? 1 : 0,
          transform: `translateY(${isLoaded ? '0px' : '5px'})`,
          transitionDuration: isLoaded ? '250ms' : '0ms',
        }}
        {...getReferenceProps()}
      >
        <div className="inline-flex items-center justify-center rounded-full p-[2px] bg-tertiary">
          {users.slice(0, 3).map((user, index) => {
            return (
              <div
                key={index}
                className={cn(
                  'h-[24px] w-[24px] overflow-hidden rounded-full border-2 bg-secondary',
                  index > 0 && '-ml-2',
                )}
                style={{ borderColor: 'var(--surface-tertiary)' }}
              >
                <img
                  src={user.avatar_url}
                  className="h-full w-full"
                  alt={`Avatar for ${user.login}`}
                />
              </div>
            )
          })}
        </div>
        {users.length > 2 && (
          <div className="text-mono-sm text-tertiary">+{users.length - 2}</div>
        )}
      </button>

      {open && (
        <FloatingFocusManager context={context} modal={false}>
          <div
            ref={floating}
            {...getFloatingProps}
            className="z-10"
            style={{
              position: strategy,
              top: y ?? 0,
              left: x ?? 0,
            }}
            aria-labelledby={headingId}
          >
            <CommentThreadBlock
              path={commentThread.data[0].path}
              line={commentThread.data[0].line}
              startLine={commentThread.data[0].start_line}
              diffHunk={commentThread.data[0].diff_hunk}
              htmlUrl={commentThread.data[0].html_url}
              comments={commentThread.data}
              handleDismiss={() => setOpen(false)}
              isOverlay={true}
            />
          </div>
        </FloatingFocusManager>
      )}
    </div>
  )
}

type Change = 'add' | 'remove' | null

const CodeSuggestion = ({
  original,
  suggestion,
  isOverlay,
}: {
  original: string
  suggestion: string
  isOverlay: boolean
}) => {
  const textDiff = diff.diffPatch(original, suggestion)
  return (
    <div
      className={cn(
        'overflow-hidden rounded-lg border text-raise border-secondary',
        isOverlay ? 'bg-default' : 'bg-raise',
      )}
    >
      <div className="w-full border-b px-2 py-2 text-mono-xs text-tertiary border-b-secondary">
        Suggestion
      </div>
      <CodeLine change="remove" code={textDiff.before} />
      <CodeLine change="add" code={textDiff.after} />
    </div>
  )
}

export const CommentThreadBlock = ({
  path,
  line,
  startLine,
  diffHunk,
  comments,
  htmlUrl,
  handleDismiss,
  isOverlay,
  isOutdated = false,
}: {
  path: string
  line: number | undefined
  startLine: number | null | undefined
  diffHunk: string
  comments: ReviewCommentsType[]
  htmlUrl: string
  handleDismiss: () => void
  isOverlay: boolean
  isOutdated?: boolean
}) => {
  let lineCount = 4
  let _startLine = 1
  if (startLine && line) {
    _startLine = startLine
    lineCount = line - startLine + 1
  } else if (line) {
    _startLine = line - lineCount + 1
  }

  // Turn `diff_hunk` into an array of lines
  let lines = diffHunk.split('\n')

  // Don't try to render more lines than there are in the `diff_hunk`
  // -1 because the first line is metadata
  lineCount = Math.min(lineCount, lines.length - 1)
  _startLine = Math.max(1, _startLine)

  // Get the number of lines we want, starting from the end and working backwards
  // The API delivers the diff with the last line being the selected line, and the
  // context of that line before it. GitHub shows 4 lines by default
  // todo: handle first line in a file
  lines = lines.slice(lineCount * -1)

  return (
    <div
      className={cn(
        'overflow-hidden rounded-lg border border-secondary',
        isOverlay ? 'overlay-shadow w-[560px] bg-raise' : 'w-full bg-default',
      )}
    >
      {/* Meta */}
      <div className="flex items-center justify-between p-3 bg-secondary">
        <a href={htmlUrl} target="_blank" rel="noreferrer" className="hover:opacity-80">
          <div className="flex items-center normal-case! text-mono-sm">
            {isOverlay && (
              <span className="mr-1 text-sans-sm text-secondary">Comment on </span>
            )}
            {path}

            {isOutdated && (
              <Badge className="ml-1" color="notice">
                Outdated
              </Badge>
            )}
          </div>
        </a>

        {isOverlay && (
          <button onClick={handleDismiss}>
            <Icon name="close" size={12} className="text-default" />
          </button>
        )}
      </div>
      {/* )} */}

      {/* Code */}
      <div className={cn('border-b border-t border-secondary', isOverlay && 'border-t')}>
        {lines.map((line, index) => {
          let change: Change = null

          if (line[0] === '+') {
            change = 'add'
          } else if (line[0] === '-') {
            change = 'remove'
          }

          let code = change ? line.slice(1) : line

          return (
            <CodeLine
              key={index}
              change={change}
              code={code}
              lineNumber={_startLine + index}
            />
          )
        })}
      </div>

      {/* Comments */}
      <div className={cn(isOverlay && 'max-h-[50vh] overflow-y-scroll')}>
        {comments.map((comment) => {
          let original = lines[lines.length - 1]

          if (original[0] === '+' || original[0] === '-') {
            original = original.slice(1)
          }

          const renderer = {
            code(code: string, infostring: string) {
              const match = (infostring || '').match(/\S*/)
              const lang = match ? match[0] : ''
              let _code = code.replace(/\n$/, '') + '\n'

              if (lang === 'suggestion') {
                return renderToString(
                  <CodeSuggestion
                    original={original}
                    suggestion={_code}
                    isOverlay={isOverlay}
                  />,
                )
              }

              const cls = lang ? `class="lang-${lang}"` : ''

              return `<pre><code ${cls}>${_code}</code></pre>\n`
            },
          }

          marked.use({ renderer })

          return (
            <div
              key={comment.id}
              className="flex border-b p-3 border-b-secondary last:border-b-0"
            >
              <img
                src={comment.user.avatar_url}
                className="h-[24px] w-[24px] rounded-full"
                alt={`Avatar for ${comment.user.login}`}
              />

              <div className="ml-3 w-full">
                <div className="mt-1 flex justify-between">
                  <div className="flex">
                    <div className="text-sans-semi-md">
                      <a
                        href={comment.user.html_url}
                        className="text-default hover:text-raise"
                        target="_blank"
                        rel="noreferrer"
                      >
                        {comment.user.login}
                      </a>
                    </div>
                    <div className="ml-1 text-sans-md text-secondary">
                      <time dateTime={comment.created_at}>
                        {dayjs(comment.created_at).fromNow()}
                      </time>
                    </div>
                  </div>
                </div>
                <div
                  className="github-markdown asciidoc-body mt-2 w-full pr-4 text-left text-sans-md text-default"
                  dangerouslySetInnerHTML={{ __html: marked.parse(comment.body) }}
                />

                {comment.reactions && <CommentReactions reactions={comment.reactions} />}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

type Reactions = NonNullable<ReviewCommentsType['reactions']>

/** Filter out the keys in `Reactions` that aren't emoji counts */
function getEmojiCounts(reactions: Reactions) {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { url, total_count, ...emojis } = reactions
  return emojis
}

type EmojiKey = keyof ReturnType<typeof getEmojiCounts>

const reactionEmoji: Record<EmojiKey, string> = {
  '+1': '👍',
  '-1': '👎',
  laugh: '😄',
  hooray: '🎉',
  rocket: '🚀',
  confused: '😕',
  heart: '❤',
  eyes: '👀',
}

const CommentReactions = ({ reactions }: { reactions: Reactions }) => {
  if (reactions.total_count === 0) return null

  return (
    <div className="mt-2 flex items-center space-x-2">
      {Object.entries(getEmojiCounts(reactions)).map(([key, count]) => {
        if (count === 0) return null

        const emoji = reactionEmoji[key as EmojiKey]

        return (
          <div
            key={key}
            className="flex items-center rounded-lg border p-1 text-mono-sm text-default border-secondary"
          >
            {emoji}
            <span className="ml-1 inline-block text-mono-sm text-default">{count}</span>
          </div>
        )
      })}
    </div>
  )
}

const CodeLine = ({
  change,
  code,
  lineNumber,
}: {
  change: Change
  code: string
  lineNumber?: number | null
}) => {
  return (
    <div className="flex text-mono-code">
      {lineNumber && (
        <div
          className={cn(
            'flex w-16 shrink-0 justify-end py-1 pl-4 pr-2',
            change === 'add' && 'bg-accent-secondary-hover',
            change === 'remove' && 'bg-destructive-secondary-hover',
          )}
        >
          {lineNumber}
        </div>
      )}
      <div
        className={cn(
          'flex grow whitespace-pre-wrap py-1 pl-2 pr-6',
          change === 'add' && 'bg-accent-secondary',
          change === 'remove' && 'bg-destructive-secondary',
        )}
      >
        <div className="w-2 shrink-0">
          {change === 'add' && '+'}
          {change === 'remove' && '-'}
        </div>
        <div className="ml-2" dangerouslySetInnerHTML={{ __html: code }} />
      </div>
    </div>
  )
}

export default RfdInlineComments
