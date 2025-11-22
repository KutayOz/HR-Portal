#!/bin/bash

# Department API Test Script
# Usage: ./test-department-api.sh

API_URL="http://localhost:5001/api"
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "======================================"
echo "Department API Test Suite"
echo "======================================"
echo ""

# Test 1: Health Check
echo -e "${YELLOW}Test 1: Database Health Check${NC}"
HEALTH=$(curl -s -o /dev/null -w "%{http_code}" ${API_URL}/health/db)
if [ "$HEALTH" -eq 200 ]; then
    echo -e "${GREEN}✅ Database connection: OK${NC}"
else
    echo -e "${RED}❌ Database connection: FAILED (${HEALTH})${NC}"
    exit 1
fi
echo ""

# Test 2: Create Department (No Jobs)
echo -e "${YELLOW}Test 2: Create Department (No Jobs)${NC}"
RESPONSE=$(curl -s -X POST ${API_URL}/departments \
  -H "Content-Type: application/json" \
  -d '{
    "departmentName": "Test Department Solo",
    "description": "Test without jobs",
    "jobs": []
  }')

if echo "$RESPONSE" | grep -q '"id"'; then
    echo -e "${GREEN}✅ Department created successfully (no jobs)${NC}"
    echo "$RESPONSE" | jq '.'
else
    echo -e "${RED}❌ Failed to create department${NC}"
    echo "$RESPONSE" | jq '.'
fi
echo ""

# Test 3: Create Department (With Jobs)
echo -e "${YELLOW}Test 3: Create Department (With Jobs)${NC}"
RESPONSE=$(curl -s -X POST ${API_URL}/departments \
  -H "Content-Type: application/json" \
  -d '{
    "departmentName": "Engineering Test",
    "description": "Software development team",
    "jobs": [
      {
        "jobTitle": "Senior Developer",
        "minSalary": 80000,
        "maxSalary": 120000
      },
      {
        "jobTitle": "Junior Developer",
        "minSalary": 50000,
        "maxSalary": 70000
      }
    ]
  }')

if echo "$RESPONSE" | grep -q '"id"'; then
    echo -e "${GREEN}✅ Department created successfully (with jobs)${NC}"
    echo "$RESPONSE" | jq '.'
else
    echo -e "${RED}❌ Failed to create department${NC}"
    echo "$RESPONSE" | jq '.'
fi
echo ""

# Test 4: Validation Test (Empty Name)
echo -e "${YELLOW}Test 4: Validation Test (Empty Name)${NC}"
RESPONSE=$(curl -s -X POST ${API_URL}/departments \
  -H "Content-Type: application/json" \
  -d '{
    "departmentName": "",
    "description": "Should fail",
    "jobs": []
  }')

if echo "$RESPONSE" | grep -q "required"; then
    echo -e "${GREEN}✅ Validation working correctly (empty name rejected)${NC}"
else
    echo -e "${RED}❌ Validation not working${NC}"
    echo "$RESPONSE" | jq '.'
fi
echo ""

# Test 5: Validation Test (Invalid Salary)
echo -e "${YELLOW}Test 5: Validation Test (Invalid Salary)${NC}"
RESPONSE=$(curl -s -X POST ${API_URL}/departments \
  -H "Content-Type: application/json" \
  -d '{
    "departmentName": "Invalid Salary Dept",
    "description": "Should fail",
    "jobs": [
      {
        "jobTitle": "Test Job",
        "minSalary": -1000,
        "maxSalary": 50000
      }
    ]
  }')

if echo "$RESPONSE" | grep -q "greater than zero"; then
    echo -e "${GREEN}✅ Validation working correctly (negative salary rejected)${NC}"
else
    echo -e "${RED}❌ Validation not working${NC}"
    echo "$RESPONSE" | jq '.'
fi
echo ""

# Test 6: Get All Departments
echo -e "${YELLOW}Test 6: Get All Departments${NC}"
RESPONSE=$(curl -s ${API_URL}/departments)
if echo "$RESPONSE" | grep -q '\['; then
    COUNT=$(echo "$RESPONSE" | jq 'length')
    echo -e "${GREEN}✅ Retrieved ${COUNT} departments${NC}"
else
    echo -e "${RED}❌ Failed to get departments${NC}"
fi
echo ""

echo "======================================"
echo "Test Suite Complete"
echo "======================================"
