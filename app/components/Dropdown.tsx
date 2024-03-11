/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, you can obtain one at https://mozilla.org/MPL/2.0/.
 *
 * Copyright Oxide Computer Company
 */

import * as Dropdown from '@radix-ui/react-dropdown-menu'
import cn from 'classnames'
import type { ReactNode } from 'react'

import Icon from '~/components/Icon'

export const dropdownOuterStyles =
  'menu-item relative text-sans-md text-secondary border-b border-secondary cursor-pointer'

export const dropdownInnerStyles = `focus:outline-0 focus:bg-hover px-3 py-2 pr-6`

export const DropdownItem = ({
  children,
  classNames,
  onSelect,
}: {
  children: ReactNode | string
  classNames?: string
  onSelect?: () => void
}) => (
  <Dropdown.Item
    onSelect={onSelect}
    className={cn(
      dropdownOuterStyles,
      classNames,
      dropdownInnerStyles,
      !onSelect && 'cursor-default',
    )}
    disabled={!onSelect}
  >
    {children}
  </Dropdown.Item>
)

export const DropdownSubTrigger = ({
  children,
  classNames,
}: {
  children: JSX.Element | string
  classNames?: string
}) => (
  <Dropdown.SubTrigger className={cn(dropdownOuterStyles, classNames, dropdownInnerStyles)}>
    {children}
    <Icon
      name="carat-down"
      size={12}
      className="absolute right-3 top-1/2 -translate-y-1/2 -rotate-90 text-quaternary"
    />
  </Dropdown.SubTrigger>
)

export const DropdownLink = ({
  children,
  classNames,
  internal = false,
  to,
  disabled = false,
}: {
  children: React.ReactNode
  classNames?: string
  internal?: boolean
  to: string
  disabled?: boolean
}) => (
  <a
    {...(internal ? {} : { target: '_blank', rel: 'noreferrer' })}
    href={to}
    className={cn(
      'block ',
      dropdownOuterStyles,
      classNames,
      disabled && 'pointer-events-none',
    )}
  >
    <Dropdown.Item className={cn(dropdownInnerStyles, disabled && 'opacity-40')}>
      {children}
    </Dropdown.Item>
  </a>
)

export const DropdownMenu = ({
  children,
  classNames,
  align = 'end',
}: {
  children: React.ReactNode
  classNames?: string
  align?: 'end' | 'start' | 'center' | undefined
}) => (
  <Dropdown.Portal>
    <Dropdown.Content
      className={cn(
        'menu overlay-shadow z-30 mt-2 min-w-[12rem] rounded border bg-raise border-secondary [&>*:last-child]:border-b-0',
        classNames,
      )}
      align={align}
    >
      {children}
    </Dropdown.Content>
  </Dropdown.Portal>
)

export const DropdownSubMenu = ({
  children,
  classNames,
}: {
  children: JSX.Element[]
  classNames?: string
}) => (
  <Dropdown.Portal>
    <Dropdown.SubContent
      className={cn(
        'menu overlay-shadow z-10 ml-2 max-h-[30vh] min-w-[12rem] overflow-y-auto rounded border bg-raise border-secondary [&>*:last-child]:border-b-0',
        classNames,
      )}
    >
      {children}
    </Dropdown.SubContent>
  </Dropdown.Portal>
)
