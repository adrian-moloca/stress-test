#!/usr/bin/env bash

function checkport {
	if nc -zv -w30 $1 $2 <<< '' &> /dev/null
	then
		echo "[+] Port $1/$2 is open"
	else
		exit 1
	fi
}


if [ -z "$BUCKET_PORT" ]
then 
    checkport localhost "$BUCKET_PORT"
else 
    echo "BUCKET_PORT not defined, skipping probe"
fi

if [ -z "$BUCKET_SERVICE_PORT" ]
then 
    checkport localhost "$BUCKET_SERVICE_PORT"
else 
    echo "BUCKET_SERVICE_PORT not defined, skipping probe"
fi
