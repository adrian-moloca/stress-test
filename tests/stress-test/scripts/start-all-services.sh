#!/bin/bash

echo "🚀 Starting all SMAMBU services..."

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Start services in correct order
services=(
  "mongodb:MongoDB:mongod"
  "redis:Redis:redis-server"
  "auth:Auth Service:cd ../../backend/ascos-auth && npm run dev"
  "system-config:System Config:cd ../../backend/ascos-system-configuration && npm run dev"
  "anagraphics:Anagraphics:cd ../../backend/ascos-anagraphics && npm run dev"
  "contracts:Contracts:cd ../../backend/ascos-contracts && npm run dev"
  "patient-anagraphics:Patient Anagraphics:cd ../../backend/ascos-patient-anagraphics && npm run dev"
  "ormanagement:OR Management:cd ../../backend/ascos-ormanagement && npm run dev"
  "scheduling-cases:Scheduling Cases:cd ../../backend/ascos-scheduling-cases && npm run dev"
  "universal-reporting:Universal Reporting:cd ../../backend/universal-reporting && npm run dev"
  "billing:Billing:cd ../../backend/ascos-billing && npm run dev"
)

# Function to check if service is running
check_service() {
  local port=$1
  nc -z localhost $port 2>/dev/null
  return $?
}

# Start each service
for service in "${services[@]}"; do
  IFS=':' read -r name display cmd <<< "$service"
  
  echo -e "${YELLOW}Starting ${display}...${NC}"
  
  if [[ "$name" == "mongodb" ]]; then
    if check_service 27017; then
      echo -e "${GREEN}✓ MongoDB already running${NC}"
    else
      $cmd &
      sleep 3
    fi
  elif [[ "$name" == "redis" ]]; then
    if check_service 6379; then
      echo -e "${GREEN}✓ Redis already running${NC}"
    else
      $cmd &
      sleep 2
    fi
  else
    # For Node.js services
    eval "$cmd" &
    sleep 5
  fi
done

echo -e "\n${GREEN}All services started!${NC}"
echo "Waiting 10 seconds for services to fully initialize..."
sleep 10

# Run preflight check
echo -e "\n${YELLOW}Running preflight check...${NC}"
node scripts/preflight-check.js