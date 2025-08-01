#!/usr/bin/env bash

function checkport {
	if nc -zv -w30 $1 $2 <<< '' &> /dev/null
	then
		echo "[+] Port $1/$2 is open"
	else
		exit 1
	fi
}


if [ -z "$SCHEDULING_CASES_PORT" ]
then 
    checkport localhost "$SCHEDULING_CASES_PORT"
else 
    echo "SCHEDULING_CASES_PORT not defined, skipping probe"
fi

if [ -z "$SCHEDULING_CASES_SERVICE_PORT" ]
then 
    checkport localhost "$SCHEDULING_CASES_SERVICE_PORT"
else 
    echo "SCHEDULING_CASES_SERVICE_PORT not defined, skipping probe"
fi
