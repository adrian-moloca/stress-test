#!/usr/bin/env bash

function checkport {
	if nc -zv -w30 $1 $2 <<< '' &> /dev/null
	then
		echo "[+] Port $1/$2 is open"
	else
		exit 1
	fi
}


if [ -z "$SYSTEM_CONFIGURATION_PORT" ]
then 
    checkport localhost "$SYSTEM_CONFIGURATION_PORT"
else 
    echo "SYSTEM_CONFIGURATION_PORT not defined, skipping probe"
fi

if [ -z "$SYSTEM_CONFIGURATION_SERVICE_PORT" ]
then 
    checkport localhost "$SYSTEM_CONFIGURATION_SERVICE_PORT"
else 
    echo "SYSTEM_CONFIGURATION_SERVICE_PORT not defined, skipping probe"
fi
