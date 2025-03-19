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
  medium: 'max-w-[32rem]',
  wide: 'max-w-[48rem]',
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
          'fixed left-1/2 top-[min(50%,500px)] z-30 max-h-[min(800px,80vh)] w-[calc(100%-2.5rem)] max-w-[32rem] -translate-x-1/2 -translate-y-1/2 rounded-lg border p-0 bg-raise border-secondary elevation-3',
          widthClass[width],
        )}
        backdrop={<div className="backdrop" />}
      >
        <div className="flex w-full items-center border-b p-4 bg-secondary border-secondary">
          <div className="text-semi-lg text-raise">{title}</div>
          <DialogDismiss className="absolute right-2 top-2.5 flex rounded p-2 hover:bg-hover">
            <Icon name="close" size={12} className="text-default" />
          </DialogDismiss>
        </div>

        <main className="px-4 py-6 text-sans-md text-default">{children}</main>
      </Dialog>
    </>
  )
}

export default Modal
