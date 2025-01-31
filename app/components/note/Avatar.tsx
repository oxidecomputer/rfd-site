import { useOthers, useSelf } from '@liveblocks/react/suspense'
import cn from 'classnames'
import { Tooltip } from 'radix-ui'

import { getPresenceColor } from './Presence'

export const Avatars = () => {
  const users = useOthers()
  const currentUser = useSelf()
  const hasMoreUsers = users.length > 3

  return (
    <Tooltip.Provider>
      <div className="flex items-center gap-1 pl-2">
        {currentUser && <Avatar name="You" />}

        {users.slice(0, 3).map(({ connectionId, info }) => {
          return (
            <Avatar
              key={connectionId}
              name={info && info.name ? info.name : 'Unknown'}
              className="-ml-3"
            />
          )
        })}

        {hasMoreUsers && (
          <div className="text-mono-sm text-quaternary">+{users.length - 3}</div>
        )}
      </div>
    </Tooltip.Provider>
  )
}

export const Avatar = ({ name, className }: { name: string; className?: string }) => {
  const { fg, bg } = getPresenceColor(name)

  return (
    <Tooltip.Root delayDuration={150}>
      <Tooltip.Trigger>
        <div
          className={cn(
            'flex h-9 w-9 items-center justify-center rounded-full border-[3px] border-[--surface-default] object-cover text-mono-sm',
            className,
          )}
          style={{
            color: fg,
            backgroundColor: bg,
          }}
        >
          {getInitials(name)}
        </div>
      </Tooltip.Trigger>
      <Tooltip.Content
        side="bottom"
        className="z-50 mt-2 text-nowrap rounded border px-1 py-1 text-sans-md text-default bg-raise border-secondary elevation-2"
      >
        {name}
      </Tooltip.Content>
    </Tooltip.Root>
  )
}

export const getInitials = (text: string) => {
  const names = text.split(' ')
  let initials = names[0].substring(0, 1).toUpperCase()

  if (names.length > 1) {
    initials += names[names.length - 1].substring(0, 1).toUpperCase()
  }
  return initials
}
