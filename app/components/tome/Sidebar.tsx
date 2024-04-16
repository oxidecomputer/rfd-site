import { Button } from '@oxide/design-system'
import { NavLink, useFetcher, useLoaderData, useMatches } from '@remix-run/react'
import cn from 'classnames'

import Icon from '~/components/Icon'
import { type TomeItem } from '~/routes/tome_'

const navLinkStyles = ({ isActive }: { isActive: boolean }) => {
  const activeStyle = isActive
    ? 'bg-accent-secondary hover:!bg-accent-secondary-hover text-accent'
    : null
  return `block text-sans-md text-secondary hover:bg-hover px-2 py-1 rounded flex items-center group justify-between ${activeStyle}`
}

const Divider = ({ className }: { className?: string }) => (
  <div className={cn('mb-3 h-[1px] border-t border-secondary 800:-mx-[2rem]', className)} />
)

export const Sidebar = () => {
  const fetcher = useFetcher()
  const matches = useMatches()

  const tomes = matches[1].data
  // const defaultClass = hideOnDesktop ? 'hidden' : 'hidden 800:flex'
  // const navOpenClass = hideOnDesktop ? 'flex' : ''

  return (
    <nav
      className={cn(
        '300:max-800:max-w-[400px] 300:w-[80vw] fixed bottom-0 top-0 z-20 flex w-full flex-shrink-0 flex-col justify-between space-y-6 border-r pl-4 pr-4 pt-6 pb-4 !bg-default border-secondary elevation-2 800:w-[15rem] 800:elevation-0 print:hidden',
        // navIsOpen ? navOpenClass : defaultClass,
      )}
    >
      {tomes && (
        <div className="relative !mt-0 space-y-6 overflow-y-auto overflow-x-hidden pb-8">
          <div
            className="sticky -top-2 left-0 right-0 z-10 -mt-8 h-8"
            style={{
              background: 'linear-gradient(180deg, #080F11 37.5%, rgba(8, 15, 17, 0) 100%)',
            }}
          />
          <div>
            <div className="mb-1 text-mono-sm text-quaternary">Published</div>
            <ul>
              {tomes.map((tome: TomeItem) => (
                <NavLink
                  key={tome.id}
                  to={`/tome/${tome.id}/edit`}
                  className={navLinkStyles}
                >
                  <div className="text-ellipsis line-clamp-2">{tome.title}</div>
                </NavLink>
              ))}
            </ul>
          </div>
          <Divider />
          <div>
            <div className="mb-1 text-mono-sm text-quaternary">Drafts</div>
          </div>
        </div>
      )}

      <fetcher.Form action="/tome/new" method="post">
        <Button variant="secondary" size="sm" type="submit" className="w-full">
          <div className="flex items-center gap-1">
            <Icon name="add-roundel" size={12} className="text-quinary" /> New
          </div>
        </Button>
      </fetcher.Form>
    </nav>
  )
}
