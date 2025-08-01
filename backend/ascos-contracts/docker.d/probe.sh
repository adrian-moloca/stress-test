#!/usr/bin/env bash

function checkport {
	if nc -zv -w30 $1 $2 <<< '' &> /dev/null
	then
		echo "[+] Port $1/$2 is open"
	else
		exit 1
	fi
}


if [ -z "$CONTRACT_PORT" ]
then 
    checkport localhost "$CONTRACT_PORT"
else 
    echo "CONTRACT_PORT not defined, skipping probe"
fi

if [ -z "$CONTRACT_SERVICE_PORT" ]
then 
    checkport localhost "$CONTRACT_SERVICE_PORT"
else 
    echo "CONTRACT_SERVICE_PORT not defined, skipping probe"
fi
