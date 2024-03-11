#!/bin/bash
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, you can obtain one at https://mozilla.org/MPL/2.0/.
#
# Copyright Oxide Computer Company


if [ -z "$1" ] || [ -z "$2" ]
then
    echo "A project and storage bucket name must be supplied"
    exit 1
fi

PROJECT=$1
BUCKET=$2

PROJECTNUMBER=$(gcloud projects list \
  --filter="$(gcloud config get-value project --project $PROJECT)" \
  --format="value(PROJECT_NUMBER)" \
  --project $PROJECT
)

gsutil iam ch \
  serviceAccount:service-$PROJECTNUMBER@cloud-cdn-fill.iam.gserviceaccount.com:objectViewer \
  gs://$BUCKET
