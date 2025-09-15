/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, you can obtain one at https://mozilla.org/MPL/2.0/.
 *
 * Copyright Oxide Computer Company
 */

import { Dialog, DialogDismiss, type DialogStore } from '@ariakit/react'
import cn from 'classnames'

import Icon from '~/components/Icon'

type Width = 'medium' | 'wide'

const widthClass: Record<Width, string> = {
  medium: 'max-w-lg',
  wide: 'max-w-3xl',
}

const Modal = ({
  dialogStore,
  title,
  children,
  width = 'medium',
}: {
  dialogStore: DialogStore
  title: string
  children: React.ReactElement
  width?: Width
}) => {
  return (
    <>
      <Dialog
        store={dialogStore}
        className={cn(
          'bg-raise border-secondary elevation-3 fixed top-[min(50%,500px)] left-1/2 z-30 flex max-h-[min(800px,80vh)] w-[calc(100%-2.5rem)] max-w-xl -translate-x-1/2 -translate-y-1/2 flex-col rounded-lg border p-0',
          widthClass[width],
        )}
        backdrop={<div className="backdrop" />}
      >
        <div className="bg-secondary border-secondary flex w-full items-center border-b px-4 py-3">
          <div className="text-sans-semi-lg text-raise">{title}</div>
          <DialogDismiss className="hover:bg-hover absolute top-2.5 right-2 flex rounded p-2">
            <Icon name="close" size={12} className="text-default" />
          </DialogDismiss>
        </div>

        <main className="text-sans-md text-default overflow-y-auto px-4 py-6">
          {children}
        </main>
      </Dialog>
    </>
  )
}

export default Modal
