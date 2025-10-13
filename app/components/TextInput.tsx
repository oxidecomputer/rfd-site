/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 *
 * Copyright Oxide Computer Company
 */
import cn from 'classnames'
import { forwardRef } from 'react'

export type TextInputBaseProps = React.ComponentPropsWithRef<'input'> & {
  disabled?: boolean
  className?: string
}

export const TextInput = forwardRef<HTMLInputElement, TextInputBaseProps>(
  ({ type = 'text', className, disabled, ...fieldProps }, ref) => {
    return (
      <div
        className={cn(
          'border-default hover:border-hover flex rounded border',
          disabled && '!border-default',
          className,
        )}
      >
        <input
          ref={ref}
          type={type}
          className={cn(
            `text-sans-md text-default bg-default placeholder:text-quaternary disabled:text-tertiary disabled:bg-disabled focus:outline-accent-secondary w-full rounded border-none px-3 py-[0.6875rem] !outline-offset-1 disabled:cursor-not-allowed`,
            disabled && 'text-disabled bg-disabled',
          )}
          disabled={disabled}
          {...fieldProps}
        />
      </div>
    )
  },
)
