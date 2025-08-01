#!/bin/bash

if [ -z "$1" ]; then
  echo "Uso: $0 <env_file>"
  echo "Esempio: $0 .env.docker"
  exit 1
fi

FILE=$1
EXAMPLE_FILE=".env.example"

if [ ! -f "$FILE" ]; then
  echo "Errore: Il file '$FILE' non esiste."
  exit 1
fi

DEDUPLICATED_FILE="deduplicated_file.tmp"
FINAL_FILE="final_file.tmp"
SORTED_FILE="sorted_file.tmp"
SORTED_EXAMPLE="sorted_example.tmp"

sort -u -t '=' -k 1,1 "$FILE" > "$DEDUPLICATED_FILE"
mv "$DEDUPLICATED_FILE" "$FILE"

grep -v '^$\|^\s*#' "$FILE" | sort -t '=' -k 1,1 > "$SORTED_FILE"
grep -v '^$\|^\s*#' "$EXAMPLE_FILE" | sort -t '=' -k 1,1 > "$SORTED_EXAMPLE"

awk -F '=' '
  NR==FNR { env_example[$1]=$0; next } 
  { if ($1 in env_example) print $0; delete env_example[$1] }
  END { for (key in env_example) print env_example[key] }
' "$SORTED_EXAMPLE" "$SORTED_FILE" > "$FINAL_FILE"

cat "$FINAL_FILE" > "$FILE"

rm "$FINAL_FILE" "$SORTED_FILE" "$SORTED_EXAMPLE"

echo "Update env file $FILE completed"
