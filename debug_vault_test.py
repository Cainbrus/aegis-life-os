#!/usr/bin/env python3
"""
Debug Vault Authentication - Check what's happening with owner auth
"""

import requests
import json

base_url = "https://life-os-aegis.preview.emergentagent.com"
api_url = f"{base_url}/api"

print("🔍 Debugging Vault Authentication Issue")
print("=" * 50)

# Step 1: Check current auth status
print("\n1. Checking current auth status...")
response = requests.get(f"{api_url}/auth/status")
print(f"Status: {response.status_code}")
print(f"Response: {json.dumps(response.json(), indent=2)}")

# Step 2: Logout to reset state
print("\n2. Logging out to reset state...")
response = requests.post(f"{api_url}/auth/logout")
print(f"Status: {response.status_code}")
print(f"Response: {json.dumps(response.json(), indent=2)}")

# Step 3: Try primary pattern authentication
print("\n3. Authenticating with primary pattern...")
primary_data = {
    "pattern": "1-2-3-6-9",
    "pattern_type": "primary_pattern"
}
response = requests.post(f"{api_url}/auth/pattern", json=primary_data)
print(f"Status: {response.status_code}")
print(f"Response: {json.dumps(response.json(), indent=2)}")

# Step 4: Check auth status after primary
print("\n4. Checking auth status after primary pattern...")
response = requests.get(f"{api_url}/auth/status")
print(f"Status: {response.status_code}")
print(f"Response: {json.dumps(response.json(), indent=2)}")

# Step 5: Try owner pattern authentication
print("\n5. Authenticating with owner pattern...")
owner_data = {
    "pattern": "1-5-9-8-7",
    "pattern_type": "owner_pattern"
}
response = requests.post(f"{api_url}/auth/pattern", json=owner_data)
print(f"Status: {response.status_code}")
print(f"Response: {json.dumps(response.json(), indent=2)}")

# Step 6: Check final auth status
print("\n6. Checking final auth status...")
response = requests.get(f"{api_url}/auth/status")
print(f"Status: {response.status_code}")
print(f"Response: {json.dumps(response.json(), indent=2)}")

# Step 7: Try vault authentication
print("\n7. Testing vault authentication...")
vault_auth_data = {
    "method": "pattern",
    "timestamp": "2025-09-23T15:36:00"
}
response = requests.post(f"{api_url}/vault/authenticate", json=vault_auth_data)
print(f"Status: {response.status_code}")
print(f"Response: {json.dumps(response.json(), indent=2)}")