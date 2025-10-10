/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, you can obtain one at https://mozilla.org/MPL/2.0/.
 *
 * Copyright Oxide Computer Company
 */

import {
  Dialog,
  DialogDismiss,
  DialogHeading,
  useDialogStore,
  type DialogStore,
} from '@ariakit/react'
import { Spinner } from '@oxide/design-system/components'
import cn from 'classnames'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import { marked } from 'marked'
import { useMemo, useRef } from 'react'

import Icon from '~/components/Icon'
import { useDiscussionQuery } from '~/hooks/use-discussion-query'
import { useIsOverflow } from '~/hooks/use-is-overflow'
import type {
  IssueCommentType,
  ListIssueCommentsType,
  ListReviewsCommentsType,
  ListReviewsType,
  ReviewType,
} from '~/services/github-discussion.server'

import { GotoIcon } from '../CustomIcons'
import { CommentThreadBlock, matchCommentToBlock } from './RfdInlineComments'
import { calcOffset } from './RfdPreview'

dayjs.extend(relativeTime)

type ReviewDiscussion = {
  review: ReviewType
  issueComment: null
  comments: CommentThread
  createdAt: Date
}

type IssueComment = {
  review: null
  issueComment: IssueCommentType
  comments: null
  createdAt: Date
}

type Discussions = (ReviewDiscussion | IssueComment)[]
type CommentThread = Record<string, ListReviewsCommentsType>

const RfdDiscussionDialog = ({
  rfdNumber,
  pullNumber,
  title,
}: {
  rfdNumber: number
  pullNumber: number
  title: string
}) => {
  const dialog = useDialogStore()
  const { data: discussion, isLoading, error } = useDiscussionQuery(pullNumber, true)

  const discussions = useMemo((): Discussions => {
    if (!discussion?.reviews || !discussion?.comments || !discussion?.prComments) {
      return []
    }

    const {
      reviews,
      comments,
      prComments,
    }: {
      reviews: ListReviewsType
      comments: ListReviewsCommentsType
      prComments: ListIssueCommentsType
    } = discussion
    const threads: CommentThread = {}
    comments.forEach((comment) => {
      // If it is check if that comment already has it's own thread
      const parentId = comment.in_reply_to_id

      // If it doesn't have a `in_reply_to_id` then it is the parent
      // Create a new thread with this comment
      if (!parentId) {
        threads[comment.id] = [comment]
        return
      }

      const thread = threads[parentId]

      // Todo: check if comments are always in chronological order
      // In case we miss a comment that comes before its parent
      // If it does add this comment to that thread
      if (thread) {
        threads[parentId].push(comment)
      }
    })

    // Now we group the threads by the review
    const discussions: Record<string, ReviewDiscussion> = {}
    Object.keys(threads).forEach((key) => {
      const thread = threads[key]
      const reviewId = thread[0].pull_request_review_id
      const review = reviews.find((review) => review.id === reviewId)

      if (!thread || !reviewId || !review) {
        return
      }

      const discussion = discussions[reviewId]

      // We group threads by review
      // Each review can contain many threads
      // Which can each contain many comments
      if (discussion && discussion.comments) {
        discussions[reviewId].comments[key] = thread
      } else {
        discussions[reviewId] = {
          review,
          issueComment: null,
          comments: { key: thread },
          createdAt: new Date(review.submitted_at || ''),
        }
      }
    })

    const discussionsArray: Discussions = Object.values(discussions)

    // Add comments that are not attached to a review
    prComments.forEach((comment) => {
      if (!comment) {
        return
      }

      const obj: IssueComment = {
        review: null,
        issueComment: comment,
        comments: null,
        createdAt: new Date(comment.created_at),
      }

      discussionsArray.push(obj)
    })

    discussionsArray.sort((a, b) => {
      return a.createdAt.getTime() - b.createdAt.getTime()
    })

    return discussionsArray
  }, [discussion])

  return (
    <>
      <CommentCount
        onClick={dialog.toggle}
        count={discussion ? discussion.comments.length + discussion.prComments.length : 0}
        isLoading={isLoading}
        error={!!error}
      />

      <DialogContent
        dialogStore={dialog}
        rfdNumber={rfdNumber}
        title={title}
        discussions={discussions}
        pullNumber={pullNumber}
      />
    </>
  )
}

export const CommentCount = ({
  count,
  isLoading,
  onClick,
  error = false,
}: {
  count: number
  isLoading: boolean
  onClick: () => void
  error?: boolean
}) => {
  const disabled = isLoading || error
  return (
    <div className="bg-default sticky top-0 w-full pb-4">
      <button
        onClick={onClick}
        className={cn(
          'flex items-center space-x-2 rounded border p-2 print:hidden',
          error
            ? 'text-error bg-error-secondary border-error-secondary'
            : 'text-tertiary border-default',
          !disabled && 'hover:bg-hover',
        )}
        disabled={disabled}
      >
        <Icon name="chat" size={16} />
        {isLoading ? (
          <Spinner />
        ) : error ? (
          <div className="text-sans-md">Error</div>
        ) : (
          <div className="text-mono-xs">{count}</div>
        )}
      </button>
    </div>
  )
}

const DialogContent = ({
  dialogStore,
  rfdNumber,
  title,
  discussions,
  pullNumber,
}: {
  dialogStore: DialogStore
  rfdNumber: number
  title: string
  discussions: Discussions
  pullNumber: number
}) => {
  return (
    <Dialog
      store={dialogStore}
      className="dialog overlay-shadow bg-raise border-secondary fixed top-0 right-0 bottom-0 z-20 flex w-[670px] flex-col border-l print:hidden"
      backdrop={<div className="backdrop" />}
    >
      <DialogHeading className="mb-4 p-8">
        <div className="flex items-start justify-between">
          <div className="text-sans-2xl pr-4">
            RFD {rfdNumber} {title}
          </div>
          <DialogDismiss className="-m-2 p-2">
            <Icon name="close" size={12} className="text-secondary mt-2" />
          </DialogDismiss>
        </div>
        <a
          href={`https://github.com/oxidecomputer/rfd/pull/${pullNumber}`}
          target="_blank"
          rel="noreferrer"
        >
          <div className="text-sans-2xl text-secondary">#{pullNumber}</div>
        </a>
      </DialogHeading>
      <DiscussionReviewGroup discussions={discussions} pullNumber={pullNumber} />
    </Dialog>
  )
}

const DiscussionReviewGroup = ({
  discussions,
  pullNumber,
}: {
  discussions: Discussions
  pullNumber: number
}) => {
  const overflowRef = useRef<HTMLDivElement>(null)
  const { scrollStart } = useIsOverflow(overflowRef)

  const reviewCount = Object.keys(discussions).length

  return (
    <>
      <div
        className={cn(
          'border-t-secondary relative top-0 right-0 left-0 z-10 -mb-px h-px flex-grow-1 border-t',
          scrollStart && reviewCount > 0 ? 'opacity-0' : 'opacity-100 transition-opacity',
        )}
      />
      <main className="relative h-full overflow-y-auto p-8 pt-4" ref={overflowRef}>
        {reviewCount > 0 ? (
          <>
            {discussions.map((discussion, index) => {
              const count = discussions.length
              if (discussion.review) {
                return (
                  <DiscussionReview
                    key={discussion.review.id}
                    isLast={index === count - 1}
                    data={discussion}
                  />
                )
              } else {
                return (
                  <DiscussionIssueComment
                    key={discussion.issueComment.id}
                    isLast={index === count - 1}
                    data={discussion.issueComment}
                  />
                )
              }
            })}
          </>
        ) : (
          <div className="flex h-full items-center justify-center">
            <div className="mb-24 w-full max-w-[220px] text-center">
              <div className="text-accent bg-accent-secondary inline-block rounded p-2">
                <Icon name="chat" size={16} />
              </div>
              <h2 className="text-semi-lg mt-4">Nothing to see here</h2>
              <p className="text-md text-default mt-2">
                This discussion has no reviews or comments
              </p>
              <a
                href={`https://github.com/oxidecomputer/rfd/pull/${pullNumber}`}
                className="text-mono-xs text-secondary border-default hover:bg-secondary mt-6 inline-block rounded border px-2 py-1"
                target="_blank"
                rel="noreferrer"
              >
                Add a comment
              </a>
            </div>
          </div>
        )}
      </main>
    </>
  )
}

const DiscussionReview = ({
  data,
  isLast,
}: {
  data: ReviewDiscussion
  isLast: boolean
}) => {
  if (!data.review || !data.review.user) {
    return null
  }

  const gotoBlock = (line: number) => {
    const lineNumbers = document.querySelectorAll('[data-lineno]')
    const block = matchCommentToBlock(line, lineNumbers as NodeListOf<HTMLElement>)
    if (block) {
      window.scroll(0, calcOffset(block).top)
    }
  }

  return (
    <section className={cn('relative', !isLast && 'pb-8')}>
      {/* Timeline line */}
      {!isLast && (
        <div className="border-l-secondary absolute top-0 bottom-0 left-4 w-px border-l" />
      )}

      {/* Review header */}
      <div className="relative flex items-center">
        <img
          src={data.review.user.avatar_url}
          className="h-[32px] w-[32px] rounded-full"
          alt={`Avatar for ${data.review.user.login}`}
        />
        <div className="ml-3 flex">
          <div className="text-sans-semi-md">
            <a
              href={data.review.user.html_url}
              className="text-sans-semi-md text-default hover:text-raise"
              target="_blank"
              rel="noreferrer"
            >
              {data.review.user.login}
            </a>
          </div>
          <div className="text-sans-md text-secondary ml-1">
            reviewed on
            <time dateTime={data.review.submitted_at}>
              {' '}
              {dayjs(data.review.submitted_at).format('MMM D, YYYY')}
            </time>
          </div>
        </div>
      </div>

      {/* Review body (if it exists) */}
      {data.review.body && (
        <div className="bg-default border-secondary relative mt-4 overflow-hidden rounded-lg border">
          <div className="text-sans-md bg-secondary border-b-secondary flex items-center border-b p-3">
            <a
              href={data.review.user.html_url}
              className="text-sans-semi-md text-default hover:text-raise"
              target="_blank"
              rel="noreferrer"
            >
              {data.review.user.login}
            </a>
            <span className="text-secondary ml-1">left a comment</span>
          </div>

          <div
            className="github-markdown asciidoc-body text-sans-md text-default w-full p-3 pr-4 text-left"
            dangerouslySetInnerHTML={{ __html: marked.parse(data.review.body) }}
          />
        </div>
      )}

      {/* Review comments */}
      {Object.keys(data.comments).map((key) => {
        const thread = data.comments[key]
        return (
          <div key={thread[0].id} className="relative">
            {thread[0].line && (
              <div className="absolute top-3 right-1 bottom-3 left-1">
                <DialogDismiss
                  onClick={() => gotoBlock(thread[0].line!)}
                  className="group sticky top-0"
                >
                  <div className="bg-raise border-secondary group-hover:bg-secondary flex h-6 w-6 items-center justify-center rounded-full border">
                    <GotoIcon className="text-secondary" />
                  </div>
                </DialogDismiss>
              </div>
            )}
            <div className="relative mt-4 ml-10 flex justify-end">
              <CommentThreadBlock
                path={thread[0].path}
                line={thread[0].line || thread[0].original_line}
                startLine={thread[0].start_line || thread[0].original_start_line}
                diffHunk={thread[0].diff_hunk}
                htmlUrl={thread[0].html_url}
                comments={thread}
                handleDismiss={() => {}}
                isOverlay={false}
                isOutdated={thread[0].line === null}
              />
            </div>
          </div>
        )
      })}
    </section>
  )
}

const DiscussionIssueComment = ({
  data,
  isLast,
}: {
  data: IssueCommentType
  isLast: boolean
}) => {
  if (!data || !data.user) {
    return null
  }

  return (
    <section className={cn('relative', !isLast && 'pb-8')}>
      {/* Timeline line */}
      {!isLast && (
        <div className="border-l-secondary absolute top-0 bottom-0 left-4 w-px border-l" />
      )}

      {/* Review header */}
      <div className="relative flex items-start">
        <img
          src={data.user.avatar_url}
          className="h-[32px] w-[32px] rounded-full"
          alt={`Avatar for ${data.user.login}`}
        />

        <div className="bg-default border-secondary relative ml-2 w-full overflow-hidden rounded-lg border">
          <div className="text-sans-md bg-secondary border-b-secondary flex items-center border-b p-3">
            <a
              href={data.user.html_url}
              className="text-sans-semi-md text-default hover:text-raise"
              target="_blank"
              rel="noreferrer"
            >
              {data.user.login}
            </a>
            <span className="text-secondary ml-1">
              commented on
              <time dateTime={data.created_at}>
                {' '}
                {dayjs(data.created_at).format('MMM D, YYYY')}
              </time>
            </span>
          </div>

          <div
            className="github-markdown asciidoc-body text-sans-md text-default w-full p-3 pr-4 text-left"
            dangerouslySetInnerHTML={{ __html: marked.parse(data.body || '') }}
          />
        </div>
      </div>
    </section>
  )
}

export default RfdDiscussionDialog
