#!/bin/sh
RED="\033[1;31m"
GREEN="\033[1;32m"
NC="\033[0m"
linter_exit_code=1
all_ts_tsx_files=$(git diff --cached --diff-filter=d --name-only | grep '.ts$\|.tsx$')
npx eslint $all_ts_tsx_files --quiet
linter_exit_code=$?

if [ $linter_exit_code -ne 0 ]
then
  echo "${RED} ❌ Warning: Linter errors were found ${NC}"
  exit 0
else
  echo "${GREEN} ✔ Eslint OK ${NC}"
  exit 0
fi