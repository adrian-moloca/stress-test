#!/usr/bin/env bash

function checkport {
	if nc -zv -w30 $1 $2 <<< '' &> /dev/null
	then
		echo "[+] Port $1/$2 is open"
	else
		exit 1
	fi
}


if [ -z "$NOTIFICATIONS_PORT" ]
then 
    checkport localhost "$NOTIFICATIONS_PORT"
else 
    echo "NOTIFICATIONS_PORT not defined, skipping probe"
fi

if [ -z "$NOTIFICATIONS_SERVICE_PORT" ]
then 
    checkport localhost "$NOTIFICATIONS_SERVICE_PORT"
else 
    echo "NOTIFICATIONS_SERVICE_PORT not defined, skipping probe"
fi
