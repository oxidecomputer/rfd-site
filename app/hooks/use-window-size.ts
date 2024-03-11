/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, you can obtain one at https://mozilla.org/MPL/2.0/.
 *
 * Copyright Oxide Computer Company
 */

import { useEffect, useState } from 'react'

function useWindowSize() {
  const [size, setSize] = useState<{
    width: number
    height: number
  }>({
    width: 0,
    height: 0,
  })

  const [hasLargeScreen, setHasLargeScreen] = useState<boolean>(false)

  useEffect(() => {
    // Only execute all the code below in client side
    if (typeof window !== 'undefined') {
      // Handler to call on window resize
      function handleResize() {
        // Set window width/height to state
        setSize({
          width: window.innerWidth,
          height: window.innerHeight,
        })

        setHasLargeScreen(window.innerWidth >= 800)
      }

      window.addEventListener('resize', handleResize)

      handleResize()

      return () => window.removeEventListener('resize', handleResize)
    }
  }, [])

  return {
    size,
    hasLargeScreen,
  }
}

export default useWindowSize
