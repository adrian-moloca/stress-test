#!/bin/bash

session_name="devall"

echo "Compiling constants and commons-be"
npm run compile:all

if [ $? -ne 0 ]; then
  echo "Error: compile:all failed!"
  exit 1
fi

tmux new-session -d -s $session_name -n "dev:auth" "npm run dev:auth"
tmux new-window -t $session_name -n "watch:commons-be" "npm run watch:commons-be"
tmux new-window -t $session_name -n "dev:roles" "npm run dev:roles"
tmux new-window -t $session_name -n "dev:users" "npm run dev:users"
tmux new-window -t $session_name -n "dev:anagraphics" "npm run dev:anagraphics"
tmux new-window -t $session_name -n "dev:system-configuration" "npm run dev:system-configuration"
tmux new-window -t $session_name -n "dev:contracts" "npm run dev:contracts"
tmux new-window -t $session_name -n "dev:frontend" "npm run dev:frontend"
tmux new-window -t $session_name -n "dev:bucket" "npm run dev:bucket"
tmux new-window -t $session_name -n "dev:schedulingCases" "npm run dev:schedulingCases"
tmux new-window -t $session_name -n "dev:log" "npm run dev:log"
tmux new-window -t $session_name -n "dev:patients" "npm run dev:patients"
tmux new-window -t $session_name -n "dev:ormanagement" "npm run dev:ormanagement"
tmux new-window -t $session_name -n "dev:notifications" "npm run dev:notifications"
tmux new-window -t $session_name -n "dev:billing" "npm run dev:billing"
tmux new-window -t $session_name -n "dev:tenants" "npm run dev:tenants"
tmux new-window -t $session_name -n "dev:ur" "npm run dev:ur"

tmux attach -t $session_name
