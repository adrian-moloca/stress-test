#!/bin/bash

echo "🔄 Complete System Reset for Stress Testing"
echo "=========================================="
echo ""

# Stop all services (optional)
echo "📌 Stopping services..."
# docker-compose stop ur-service billing-service

# Clear Redis
echo "📌 Clearing Redis..."
redis-cli FLUSHDB

# Run cleanup
echo "📌 Running complete cleanup..."
node scripts/clean-everything.js --force

# Restart services (optional)
echo "📌 Restarting services..."
# docker-compose start ur-service billing-service

# Wait for services
echo "📌 Waiting for services to be ready..."
sleep 10

# Verify health
echo "📌 Verifying service health..."
curl -s http://localhost:3002/health | jq .
curl -s http://localhost:8060/health | jq .

echo ""
echo "✅ System reset complete! Ready for stress testing."