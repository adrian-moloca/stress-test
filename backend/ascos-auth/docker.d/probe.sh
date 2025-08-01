#!/usr/bin/env bash

function checkport {
	if nc -zv -w30 $1 $2 <<< '' &> /dev/null
	then
		echo "[+] Port $1/$2 is open"
	else
		exit 1
	fi
}


if [ -z "$AUTH_PORT" ]
then 
    checkport localhost "$AUTH_PORT"
else 
    echo "AUTH_PORT not defined, skipping probe"
fi

if [ -z "$AUTH_SERVICE_PORT" ]
then 
    checkport localhost "$AUTH_SERVICE_PORT"
else 
    echo "AUTH_SERVICE_PORT not defined, skipping probe"
fi
