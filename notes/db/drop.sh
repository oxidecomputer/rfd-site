#!/bin/bash

DATABASE="notes.db"

if [ -f "$DATABASE" ]; then
    rm "$DATABASE"
    echo "Database $DATABASE destroyed."
else
    echo "Database $DATABASE does not exist."
fi