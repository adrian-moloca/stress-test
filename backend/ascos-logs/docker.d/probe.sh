#!/usr/bin/env bash

function checkport {
	if nc -zv -w30 $1 $2 <<< '' &> /dev/null
	then
		echo "[+] Port $1/$2 is open"
	else
		exit 1
	fi
}


if [ -z "$LOGS_PORT" ]
then 
    checkport localhost "$LOGS_PORT"
else 
    echo "LOGS_PORT not defined, skipping probe"
fi

if [ -z "$LOGS_SERVICE_PORT" ]
then 
    checkport localhost "$LOGS_SERVICE_PORT"
else 
    echo "LOGS_SERVICE_PORT not defined, skipping probe"
fi
