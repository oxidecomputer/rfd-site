#!/bin/bash
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, you can obtain one at https://mozilla.org/MPL/2.0/.
#
# Copyright Oxide Computer Company


if [ -z "$1" ] || [ -z "$2" ] || [ -z "$3" ]
then
    echo "A project, backend bucket, and key name must be supplied"
    exit 1
fi

PROJECT=$1
BACKEND=$2
KEYNAME=$3

# Key generation uses the recommendation from GCP
# See: https://cloud.google.com/cdn/docs/using-signed-urls#configuring_signed_request_keys
KEY=$(head -c 16 /dev/urandom | base64 | tr +/ -_)
KEYFILE=$(head -c 16 /dev/urandom | base64 | tr +/ -_)

echo $KEY > $KEYFILE

gcloud compute backend-buckets \
    add-signed-url-key $BACKEND \
    --key-name $KEYNAME \
    --key-file $KEYFILE \
    --project $PROJECT

echo "Added signing key $KEYNAME to $BACKEND. Ensure that this key is stored securely, it can not be recovered. In the case that it is lost a new key must be created."
echo "Key: $KEY"

rm $KEYFILE