/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, you can obtain one at https://mozilla.org/MPL/2.0/.
 *
 * Copyright Oxide Computer Company
 */

import throttle from 'lodash/throttle'
import { useLayoutEffect, useState, type MutableRefObject } from 'react'

export const useIsOverflow = (
  ref: MutableRefObject<HTMLDivElement | null>,
  callback?: (hasOverflow: boolean) => void,
) => {
  const [isOverflow, setIsOverflow] = useState<boolean | undefined>()
  const [scrollStart, setScrollStart] = useState<boolean>(true)
  const [scrollEnd, setScrollEnd] = useState<boolean>(false)

  useLayoutEffect(() => {
    if (!ref?.current) return

    const trigger = () => {
      if (!ref?.current) return
      const { current } = ref

      const hasOverflow = current.scrollHeight > current.clientHeight
      setIsOverflow(hasOverflow)

      if (callback) callback(hasOverflow)
    }

    const handleScroll = throttle(
      () => {
        if (!ref?.current) return
        const { current } = ref

        if (current.scrollTop === 0) {
          setScrollStart(true)
        } else {
          setScrollStart(false)
        }

        const offsetBottom = current.scrollHeight - current.clientHeight
        if (current.scrollTop >= offsetBottom && scrollEnd === false) {
          setScrollEnd(true)
        } else {
          setScrollEnd(false)
        }
      },
      125,
      { leading: true, trailing: true },
    )

    trigger()

    const { current } = ref
    current.addEventListener('scroll', handleScroll)
    window.addEventListener('resize', handleScroll)
    return () => {
      current.removeEventListener('scroll', handleScroll)
      window.removeEventListener('resize', handleScroll)
    }
  }, [callback, ref, scrollStart, scrollEnd])

  return {
    isOverflow,
    scrollStart,
    scrollEnd,
  }
}
