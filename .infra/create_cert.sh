#!/bin/bash
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, you can obtain one at https://mozilla.org/MPL/2.0/.
#
# Copyright Oxide Computer Company


if [ -z "$1" ]
then
    echo "A project must be supplied"
    exit 1
fi

PROJECT=$1

gcloud compute ssl-certificates create rfd-static-cert \
    --description="Static asset serving for RFD frontend" \
    --domains="static.rfd.shared.oxide.computer" \
    --global \
    --project $PROJECT