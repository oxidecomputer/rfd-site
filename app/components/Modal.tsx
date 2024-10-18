/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, you can obtain one at https://mozilla.org/MPL/2.0/.
 *
 * Copyright Oxide Computer Company
 */

import { Dialog, DialogDismiss, type DialogStore } from '@ariakit/react'

import Icon from '~/components/Icon'

const Modal = ({
  dialogStore,
  title,
  children,
}: {
  dialogStore: DialogStore
  title: string
  children: React.ReactElement
}) => {
  return (
    <>
      <Dialog
        store={dialogStore}
        className="overlay-shadow fixed left-1/2 top-1/2 z-30 w-[calc(100%-2.5rem)] max-w-[32rem] -translate-x-1/2 -translate-y-1/2 rounded-lg border p-0 bg-raise border-secondary"
        backdrop={<div className="backdrop" />}
      >
        <div className="flex w-full items-center border-b p-4 bg-secondary border-secondary">
          <div className="text-semi-lg text-default">{title}</div>
          <DialogDismiss className="absolute right-2 top-2.5 flex rounded p-2 hover:bg-hover">
            <Icon name="close" size={12} className="text-secondary" />
          </DialogDismiss>
        </div>

        <main className="px-4 py-6 text-sans-md text-secondary">{children}</main>
      </Dialog>
    </>
  )
}

export default Modal
