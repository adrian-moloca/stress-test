#!/usr/bin/env bash
changed_files="$(git diff-tree -r --name-only --no-commit-id ORIG_HEAD HEAD)"

package_changed=0
env_changed=0

echo "$changed_files" | grep --quiet "package.json" && package_changed=1
echo "$changed_files" | grep --quiet ".env.example" && env_changed=1

if [ $package_changed -gt 0 ];
  then echo "package.json was changed"
fi

if [ $env_changed -gt 0 ];
  then echo ".env example file was changed"
fi

if [ $env_changed -eq 0 ] && [ $package_changed -eq 0 ];
then echo "no changes!"                                               
else echo "something changed!"
fi

