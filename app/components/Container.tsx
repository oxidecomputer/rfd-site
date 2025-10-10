/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, you can obtain one at https://mozilla.org/MPL/2.0/.
 *
 * Copyright Oxide Computer Company
 */

import cn from 'classnames/dedupe'

const Container = ({
  className,
  wrapperClassName,
  children,
  isGrid,
}: {
  className?: string
  wrapperClassName?: string
  children: React.ReactNode
  isGrid?: boolean
}) => (
  <div className={cn('600:px-10 w-full px-5', wrapperClassName)}>
    <div
      className={cn(
        'm-auto max-w-1200',
        className,
        isGrid ? '600:gap-6 grid grid-cols-12 gap-4' : '',
      )}
    >
      {children}
    </div>
  </div>
)

export default Container
