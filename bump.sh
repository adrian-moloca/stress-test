#!/bin/bash

start_dir=$(pwd)

is_ignored() {
  local dir="$1"
  if git check-ignore -q "$dir"; then
    return 0
  else
    return 1
  fi
}

run_patch_in_folder() {
  local folder="$1"
  local new_version="$2"
  if [ -f "$folder/package.json" ]; then
    echo "'npm run patch' in $folder"
    (cd "$folder" && npm version --no-git-tag-version -- "$new_version")
    new_version_number="${new_version#v}"
    sed -i '' -e "s|\"@smambu/lib.commons-be\": \".*\"|\"@smambu/lib.commons-be\": \"^$new_version_number\"|g" "$folder/package.json"
    sed -i '' -e "s|\"@smambu/lib.constantsjs\": \".*\"|\"@smambu/lib.constantsjs\": \"^$new_version_number\"|g" "$folder/package.json"
    sed -i '' -e "s|\"@smambu/lib.constants\": \".*\"|\"@smambu/lib.constants\": \"^$new_version_number\"|g" "$folder/package.json"
  fi
}

recursive_run_patch() {
  local dir="$1"
  local new_version="$2"
  for folder in "$dir"/*; do
    if [ -d "$folder" ]; then
      if ! is_ignored "$folder"; then
        run_patch_in_folder "$folder" "$new_version"
        recursive_run_patch "$folder" "$new_version"
      fi
    fi
  done
}

if [[ $(git -C "$start_dir" status --porcelain) ]]; then
  echo "Error: Repository is not empty. Commit or discard changes before running this script."
  exit 1
fi

echo "Repository is empty. Proceeding with version increment..."

if [ -z "$1" ]; then
  echo "Usage: $0 <patch|minor|major>"
  exit 1
fi

# patch, minor or major
increment_type="$1"
if [ "$increment_type" != "patch" ] && [ "$increment_type" != "minor" ] && [ "$increment_type" != "major" ]; then
  echo "Error: Invalid argument. Use 'patch', 'minor' or 'major'."
  exit 1
fi

echo "Calling npm version $increment_type..."
NEW_VERSION=$(npm -C "$start_dir" version --no-git-tag-version -- "$increment_type")

recursive_run_patch "$start_dir" "$NEW_VERSION"
cd "$start_dir"
npm i --legacy-peer-deps && cd constantsjs && npm run compile 

cd "$start_dir"
echo "{\"version\": \"${NEW_VERSION#v}\"}" > frontend/public/version.json

git -C "$start_dir" add "**/package.json"
git -C "$start_dir" add package.json package-lock.json frontend/public/version.json
git -C "$start_dir" commit -m "New Version $NEW_VERSION"
git -C "$start_dir" tag -a "$NEW_VERSION" -m "Version $NEW_VERSION"
