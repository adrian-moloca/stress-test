#!/usr/bin/env bash

function checkport {
	if nc -zv -w30 $1 $2 <<< '' &> /dev/null
	then
		echo "[+] Port $1/$2 is open"
	else
		exit 1
	fi
}


if [ -z "$OR_MANAGEMENT_PORT" ]
then 
    checkport localhost "$OR_MANAGEMENT_PORT"
else 
    echo "OR_MANAGEMENT_PORT not defined, skipping probe"
fi

if [ -z "$OR_MANAGEMENT_SERVICE_PORT" ]
then 
    checkport localhost "$OR_MANAGEMENT_SERVICE_PORT"
else 
    echo "OR_MANAGEMENT_SERVICE_PORT not defined, skipping probe"
fi
