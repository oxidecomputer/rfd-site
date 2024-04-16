 #!/bin/bash

DATABASE="tome.db"

if [ ! -f "$DATABASE" ]; then
    sqlite3 "$DATABASE" < "seed.sql" && echo "Database $DATABASE initialized."
else
    echo "Database $DATABASE already exists."
fi