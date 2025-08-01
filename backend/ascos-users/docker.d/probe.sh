#!/usr/bin/env bash

function checkport {
	if nc -zv -w30 $1 $2 <<< '' &> /dev/null
	then
		echo "[+] Port $1/$2 is open"
	else
		exit 1
	fi
}


if [ -z "$USER_PORT" ]
then 
    checkport localhost "$USER_PORT"
else 
    echo "USER_PORT not defined, skipping probe"
fi

if [ -z "$USER_SERVICE_PORT" ]
then 
    checkport localhost "$USER_SERVICE_PORT"
else 
    echo "USER_SERVICE_PORT not defined, skipping probe"
fi
