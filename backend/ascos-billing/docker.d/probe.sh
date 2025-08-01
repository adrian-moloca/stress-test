#!/usr/bin/env bash

function checkport {
	if nc -zv -w30 $1 $2 <<< '' &> /dev/null
	then
		echo "[+] Port $1/$2 is open"
	else
		exit 1
	fi
}


if [ -z "$BILLING_PORT" ]
then 
    checkport localhost "$BILLING_PORT"
else 
    echo "BILLING_PORT not defined, skipping probe"
fi

if [ -z "$BILLING_SERVICE_PORT" ]
then 
    checkport localhost "$BILLING_SERVICE_PORT"
else 
    echo "BILLING_SERVICE_PORT not defined, skipping probe"
fi
