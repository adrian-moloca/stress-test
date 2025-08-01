#!/usr/bin/env bash

function checkport {
	if nc -zv -w30 $1 $2 <<< '' &> /dev/null
	then
		echo "[+] Port $1/$2 is open"
	else
		exit 1
	fi
}


if [ -z "$PATIENTS_ANAGRAPHICS_PORT" ]
then 
    checkport localhost "$PATIENTS_ANAGRAPHICS_PORT"
else 
    echo "PATIENTS_ANAGRAPHICS_PORT not defined, skipping probe"
fi

if [ -z "$PATIENTS_ANAGRAPHICS_SERVICE_PORT" ]
then 
    checkport localhost "$PATIENTS_ANAGRAPHICS_SERVICE_PORT"
else 
    echo "PATIENTS_ANAGRAPHICS_SERVICE_PORT not defined, skipping probe"
fi
