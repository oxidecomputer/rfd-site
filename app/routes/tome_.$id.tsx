/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, you can obtain one at https://mozilla.org/MPL/2.0/.
 *
 * Copyright Oxide Computer Company
 */
import { Badge } from '@oxide/design-system'
import Asciidoc, { asciidoctor } from '@oxide/react-asciidoc'
import * as Dropdown from '@radix-ui/react-dropdown-menu'
import { type LoaderArgs } from '@remix-run/node'
import { useFetcher, useLoaderData } from '@remix-run/react'
import dayjs from 'dayjs'
import { useMemo } from 'react'
import { ClientOnly } from 'remix-utils'

import { opts } from '~/components/AsciidocBlocks'
import Container from '~/components/Container'
import { DropdownItem, DropdownLink, DropdownMenu } from '~/components/Dropdown'
import Icon from '~/components/Icon'

import { PropertyRow } from './rfd.$slug'

const ad = asciidoctor()

export async function loader({ params: { id } }: LoaderArgs) {
  const response = await fetch(`http://localhost:8080/tome/${id}`, {
    headers: {
      'x-api-key': 'abcdef',
    },
  })
  if (!response.ok) {
    throw new Response('Not Found', { status: 404 })
  }
  const data = await response.json()
  return data
}

export default function Tome() {
  const tome = useLoaderData()

  const doc = useMemo(() => {
    return ad.load(tome.body, {
      standalone: true,
      sourcemap: true,
      attributes: {
        sectnums: true,
      },
    })
  }, [tome])

  return (
    <div>
      <Container
        isGrid
        className="page-header relative mb-12 mt-12 800:mb-16 800:mt-16 print:mt-0"
      >
        <div className="col-span-12 flex items-baseline 800:col-span-11 1100:col-span-10 1100:col-start-3">
          <h1 className="w-full pr-4 text-sans-2xl 600:pr-10 800:text-sans-3xl 1100:w-[calc(100%-var(--toc-width))] 1200:pr-16 print:pr-0 print:text-center">
            {tome.title}
          </h1>

          <div className="print:hidden">
            <MoreDropdown />
          </div>
        </div>
      </Container>

      <div className="border-b border-secondary print:m-auto print:max-w-1200 print:rounded-lg print:border">
        <PropertyRow label="State">
          <Badge>Public</Badge>
        </PropertyRow>
        <PropertyRow label="Created">
          <ClientOnly fallback={<div className="h-4 w-32 rounded bg-tertiary" />}>
            {() => <>{dayjs(tome.created).format('MMM D YYYY, h:mm A')}</>}
          </ClientOnly>
        </PropertyRow>
        <PropertyRow label="Updated">
          <ClientOnly fallback={<div className="h-4 w-32 rounded bg-tertiary" />}>
            {() => <>{dayjs(tome.updated).format('MMM D YYYY, h:mm A')}</>}
          </ClientOnly>
        </PropertyRow>
      </div>

      <Asciidoc content={doc} options={opts} />
    </div>
  )
}

const MoreDropdown = () => {
  const tome = useLoaderData()
  const fetcher = useFetcher() // Initialize the fetcher

  const handleDelete = () => {
    if (window.confirm('Are you sure you want to delete this tome?')) {
      fetcher.submit(
        { id: tome.id },
        {
          method: 'post',
          action: `/tome/${tome.id}/delete`,
          encType: 'application/x-www-form-urlencoded',
        },
      )
    }
  }

  return (
    <Dropdown.Root modal={false}>
      <Dropdown.Trigger className="rounded border p-2 align-[3px] border-default hover:bg-hover">
        <Icon name="more" size={12} className="text-secondary" />
      </Dropdown.Trigger>

      <DropdownMenu>
        <DropdownLink to={`/tome/${tome.id}/edit`}>Edit</DropdownLink>
        <DropdownItem className="text-error" onSelect={handleDelete}>
          Delete
        </DropdownItem>
      </DropdownMenu>
    </Dropdown.Root>
  )
}
