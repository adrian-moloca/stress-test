#!/usr/bin/env bash

function checkport {
	if nc -zv -w30 $1 $2 <<< '' &> /dev/null
	then
		echo "[+] Port $1/$2 is open"
	else
		exit 1
	fi
}


if [ -z "$TENANTS_PORT" ]
then 
    checkport localhost "$TENANTS_PORT"
else 
    echo "TENANTS_PORT not defined, skipping probe"
fi

if [ -z "$TENANTS_SERVICE_PORT" ]
then 
    checkport localhost "$TENANTS_SERVICE_PORT"
else 
    echo "TENANTS_SERVICE_PORT not defined, skipping probe"
fi
