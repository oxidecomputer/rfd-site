/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, you can obtain one at https://mozilla.org/MPL/2.0/.
 *
 * Copyright Oxide Computer Company
 */

import { type Icon as IconType } from '@oxide/design-system/icons'

import sprite from '../../node_modules/@oxide/design-system/icons/sprite.svg'

type IconProps = IconType & {
  className?: string
  height?: number
}

const Icon = ({ name, size, ...props }: IconProps) => {
  const id = `${name}-${size}`

  return (
    <svg width={size} height={size} {...props}>
      <use href={`${sprite}#${id}`} />
    </svg>
  )
}

export default Icon
