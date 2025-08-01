#!/bin/bash

echo "start init-script.sh"

echo "Inizio reset di tutti i database MongoDB..."

mongosh --host mongo --eval "db.getMongo().getDBNames().forEach(function (dbName) { if (dbName !== 'admin' && dbName !== 'local') db.getSiblingDB(dbName).dropDatabase() })"

echo "Reset completato."



set -e

echo "start init-mongo.sh"
DATABASES=$(ls /dump/mongodb)

for DB in $DATABASES; do
    echo "database $DB"

    COLLECTIONS=$(ls /dump/mongodb/$DB/*.bson)

    for BSON_FILE in $COLLECTIONS; do
        COLLECTION=$(basename $BSON_FILE .bson)
        
        echo "collection $COLLECTION database $DB"

        mongorestore --host mongo --port 27017 --db $DB --collection $COLLECTION --drop $BSON_FILE
    done
done

echo "end init-mongo.sh"





healtzh=$(curl -f http://ascos-auth:8010/api/auth/healthz)
echo "HEALTHZ: $healtzh"


login=$(curl -s -X POST http://ascos-auth:8010/api/auth/auth/login \
             -H 'Content-Type: application/json' \
             -d '{"email":"test.admin@bytes.black","password":"Password123?!"}')

echo "LOGIN: $login"

tokenWithoutTenant=$(echo "$login" | jq -r '.tokenWithoutTenant')

echo "TOKEN: $tokenWithoutTenant"

echo "calling create tenant"

create_tenant=$(curl -s -X POST http://ascos-tenants:8150/api/tenant/tenants \
    -H "Authorization: Bearer ${tokenWithoutTenant}" \
    -H 'Content-Type: application/json' \
    -d '{"name": "test-tenant", "defaultLanguage": "en", "currencySymbol": "EUR"}')


echo $create_tenant



