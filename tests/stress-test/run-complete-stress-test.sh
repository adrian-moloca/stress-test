#!/bin/bash
# run-complete-stress-test.sh

echo "🚀 Universal Reporting Comprehensive Stress Test"
echo "==============================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Load environment variables from .env if it exists
if [ -f .env ]; then
    export $(cat .env | xargs)
fi

# Check if STRESS_TEST_TOKEN is set
if [ -z "$STRESS_TEST_TOKEN" ]; then
    echo -e "${YELLOW}Warning: STRESS_TEST_TOKEN not set${NC}"
    echo "The test will use a hardcoded fallback token, but it's better to generate your own."
    echo "To generate a token, run: node scripts/generate-auth-token.js"
    echo ""
fi

# Check if running as root (not recommended)
if [ "$EUID" -eq 0 ]; then 
   echo -e "${YELLOW}Warning: Running as root is not recommended${NC}"
   read -p "Continue anyway? (y/N) " -n 1 -r
   echo
   if [[ ! $REPLY =~ ^[Yy]$ ]]; then
       exit 1
   fi
fi

# Step 1: System Normalization
echo -e "\n${YELLOW}Step 1: System Normalization${NC}"
echo "============================"
if [ -f "scripts/normalize-system.js" ]; then
    node scripts/normalize-system.js
    if [ $? -ne 0 ]; then
        echo -e "${RED}System normalization failed. Please fix issues before continuing.${NC}"
        exit 1
    fi
else
    echo -e "${YELLOW}Normalization script not found, skipping...${NC}"
fi

# Step 2: Database Cleanup
echo -e "\n${YELLOW}Step 2: Database Cleanup${NC}"
echo "======================="
read -p "Clean database before test? (y/N) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    if [ -f "scripts/utils/complete-db-cleaner.js" ]; then
        node scripts/utils/complete-db-cleaner.js --preserve-essentials
        if [ $? -ne 0 ]; then
            echo -e "${RED}Database cleanup failed.${NC}"
            exit 1
        fi
    else
        echo -e "${YELLOW}Database cleaner script not found, skipping...${NC}"
    fi
fi

# Step 3: Load Configurations
echo -e "\n${YELLOW}Step 3: Load Test Configurations${NC}"
echo "=============================="
if [ -f "config/test-billing-config.json" ] && [ -f "scripts/utils/complete-db-cleaner.js" ]; then
    node scripts/utils/complete-db-cleaner.js --load-configs config/test-billing-config.json
elif [ -f "scripts/setup-test-configs.js" ]; then
    echo "Setting up test configurations..."
    node scripts/setup-test-configs.js
else
    echo -e "${YELLOW}Configuration loader not found, skipping...${NC}"
fi

# Step 4: Pre-flight Check
echo -e "\n${YELLOW}Step 4: Pre-flight Check${NC}"
echo "======================"
if [ -f "scripts/preflight-check.js" ]; then
    node scripts/preflight-check.js
    PREFLIGHT_EXIT_CODE=$?
    if [ $PREFLIGHT_EXIT_CODE -ne 0 ]; then
        echo -e "${YELLOW}Pre-flight check reported issues.${NC}"
        echo "Checking if services are at least partially available..."
        
        # Check if at least the scheduling cases service is running
        curl -s -o /dev/null -w "%{http_code}" http://localhost:8060/api/schedulingcases/cases?limit=1 > /tmp/service_check
        SERVICE_STATUS=$(cat /tmp/service_check)
        rm -f /tmp/service_check
        
        if [ "$SERVICE_STATUS" != "200" ] && [ "$SERVICE_STATUS" != "401" ] && [ "$SERVICE_STATUS" != "403" ]; then
            echo -e "${RED}Scheduling Cases service is not responding properly (HTTP $SERVICE_STATUS).${NC}"
            echo "Please ensure the service is running on port 8060."
            exit 1
        else
            echo -e "${GREEN}Scheduling Cases service is responding.${NC}"
            echo "Continuing with test despite pre-flight warnings..."
        fi
    fi
else
    echo -e "${YELLOW}Pre-flight check script not found, skipping...${NC}"
fi

# Step 5: Run Stress Test
echo -e "\n${YELLOW}Step 5: Running Comprehensive Stress Test${NC}"
echo "======================================"
echo "This will run the following scenarios:"
echo "  - 100 cases with 2 proxies each"
echo "  - 500 cases with 3 proxies each"
echo "  - 1,000 cases with 4 proxies each"
echo "  - 2,000 cases with 5 proxies each"
echo "  - 5,000 cases with 7 proxies each"
echo "  - 10,000 cases with 10 proxies each"
echo ""
echo "API Endpoint: http://localhost:8060/api/schedulingcases"
echo ""
read -p "Continue with full test suite? (y/N) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Test cancelled by user"
    exit 0
fi

# Run the stress test with correct API URL
node scripts/run-comprehensive-stress-test.js \
    --output-dir ./results \
    --baseline ./config/baseline-metrics.json \
    --api-url "http://localhost:8060/api/schedulingcases" \
    --verbose

TEST_EXIT_CODE=$?

# Step 6: Generate Final Report
echo -e "\n${YELLOW}Step 6: Generating Final Report${NC}"
echo "============================"
RESULTS_DIR=$(ls -td results/stress-test-* 2>/dev/null | head -1)

if [ -z "$RESULTS_DIR" ]; then
    echo -e "${RED}No results directory found!${NC}"
else
    echo -e "Results saved to: ${GREEN}${RESULTS_DIR}${NC}"
    
    # Open results in browser if available
    if command -v xdg-open &> /dev/null; then
        xdg-open "${RESULTS_DIR}/metrics.html" 2>/dev/null &
    elif command -v open &> /dev/null; then
        open "${RESULTS_DIR}/metrics.html" 2>/dev/null &
    else
        echo "View results at: file://$(pwd)/${RESULTS_DIR}/metrics.html"
    fi
fi

# Exit with test status
if [ $TEST_EXIT_CODE -eq 0 ]; then
    echo -e "\n${GREEN}✅ Stress test completed successfully!${NC}"
else
    echo -e "\n${RED}❌ Stress test completed with errors.${NC}"
    echo -e "${YELLOW}Check the logs for details.${NC}"
fi

exit $TEST_EXIT_CODE