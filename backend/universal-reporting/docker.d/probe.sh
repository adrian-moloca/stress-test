#!/usr/bin/env bash

function checkport {
	if nc -zv -w30 $1 $2 <<< '' &> /dev/null
	then
		echo "[+] Port $1/$2 is open"
	else
		exit 1
	fi
}


if [ -z "$UR_PORT" ]
then 
    checkport localhost "$UR_PORT"
else 
    echo "UR_PORT not defined, skipping probe"
fi

if [ -z "$UR_SERVICE_PORT" ]
then 
    checkport localhost "$UR_SERVICE_PORT"
else 
    echo "UR_SERVICE_PORT not defined, skipping probe"
fi
