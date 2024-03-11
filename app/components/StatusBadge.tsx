/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, you can obtain one at https://mozilla.org/MPL/2.0/.
 *
 * Copyright Oxide Computer Company
 */

import { Badge, type BadgeColor } from '@oxide/design-system'

const StatusBadge = ({ label }: { label: string }) => {
  let color: BadgeColor | undefined

  switch (label) {
    case 'prediscussion':
      color = 'purple'
      break
    case 'ideation':
      color = 'notice'
      break
    case 'abandoned':
      color = 'neutral'
      break
    case 'discussion':
      color = 'blue'
      break
    default:
      color = 'default'
  }

  return <Badge color={color}>{label}</Badge>
}

export default StatusBadge
