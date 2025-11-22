#!/bin/bash

# Debug 400 Error Script
API_URL="http://localhost:5001/api"

echo "======================================"
echo "Debugging 400 Bad Request Error"
echo "======================================"
echo ""

# Test 1: Test DTO Binding
echo "Test 1: Testing DTO binding with /test endpoint..."
echo ""
RESPONSE=$(curl -s -w "\nHTTP_CODE:%{http_code}" -X POST ${API_URL}/departments/test \
  -H "Content-Type: application/json" \
  -d '{
    "departmentName": "Test Department",
    "description": "Test description",
    "jobs": []
  }')

HTTP_CODE=$(echo "$RESPONSE" | grep "HTTP_CODE" | cut -d':' -f2)
BODY=$(echo "$RESPONSE" | sed '/HTTP_CODE/d')

echo "HTTP Status: $HTTP_CODE"
echo "Response:"
echo "$BODY" | jq '.' 2>/dev/null || echo "$BODY"
echo ""

if [ "$HTTP_CODE" != "200" ]; then
    echo "❌ DTO binding failed!"
    echo "This means the JSON format doesn't match the DTO structure"
    echo ""
else
    echo "✅ DTO binding successful!"
    echo ""
fi

# Test 2: Test with Jobs
echo "Test 2: Testing DTO binding with jobs..."
echo ""
RESPONSE=$(curl -s -w "\nHTTP_CODE:%{http_code}" -X POST ${API_URL}/departments/test \
  -H "Content-Type: application/json" \
  -d '{
    "departmentName": "Engineering",
    "description": "Tech team",
    "jobs": [
      {
        "jobTitle": "Developer",
        "minSalary": 60000,
        "maxSalary": 90000
      }
    ]
  }')

HTTP_CODE=$(echo "$RESPONSE" | grep "HTTP_CODE" | cut -d':' -f2)
BODY=$(echo "$RESPONSE" | sed '/HTTP_CODE/d')

echo "HTTP Status: $HTTP_CODE"
echo "Response:"
echo "$BODY" | jq '.' 2>/dev/null || echo "$BODY"
echo ""

if [ "$HTTP_CODE" != "200" ]; then
    echo "❌ DTO binding with jobs failed!"
else
    echo "✅ DTO binding with jobs successful!"
fi

echo ""
echo "======================================"
echo "Test 3: Actual POST to /departments"
echo "======================================"
echo ""

RESPONSE=$(curl -s -w "\nHTTP_CODE:%{http_code}" -X POST ${API_URL}/departments \
  -H "Content-Type: application/json" \
  -d '{
    "departmentName": "Debug Test Dept",
    "description": "Testing",
    "jobs": []
  }')

HTTP_CODE=$(echo "$RESPONSE" | grep "HTTP_CODE" | cut -d':' -f2)
BODY=$(echo "$RESPONSE" | sed '/HTTP_CODE/d')

echo "HTTP Status: $HTTP_CODE"
echo "Response:"
echo "$BODY" | jq '.' 2>/dev/null || echo "$BODY"
echo ""

if [ "$HTTP_CODE" = "201" ] || [ "$HTTP_CODE" = "200" ]; then
    echo "✅ Department created successfully!"
elif [ "$HTTP_CODE" = "400" ]; then
    echo "❌ 400 Bad Request"
    echo ""
    echo "Check the error message above to see which validation failed:"
    echo "  - 'Department name is required' → Name is empty or null"
    echo "  - 'Department name already exists' → Duplicate name"
    echo "  - 'Job position X: ...' → Job validation failed"
    echo "  - 'Request body is required' → DTO binding failed"
elif [ "$HTTP_CODE" = "500" ]; then
    echo "❌ 500 Internal Server Error"
    echo "Check backend terminal logs for details"
else
    echo "❌ Unexpected status code: $HTTP_CODE"
fi

echo ""
echo "======================================"
echo "Check backend terminal for detailed logs"
echo "======================================"
