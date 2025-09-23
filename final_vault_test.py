#!/usr/bin/env python3
"""
Final Vault Test - Wait for lockout to clear and test vault endpoints
"""

import requests
import json
import time
from datetime import datetime

base_url = "https://hpi-mate.preview.emergentagent.com"
api_url = f"{base_url}/api"

def wait_for_lockout_clear():
    """Wait for lockout to clear"""
    print("⏳ Waiting for lockout to clear...")
    
    while True:
        response = requests.get(f"{api_url}/auth/status")
        if response.status_code == 200:
            data = response.json()
            lockout_active = data.get("lockout_active", False)
            
            if not lockout_active:
                print("✅ Lockout cleared!")
                return True
            else:
                print("⏳ Still locked out, waiting 10 seconds...")
                time.sleep(10)
        else:
            print(f"❌ Error checking status: {response.status_code}")
            return False

def test_complete_vault_flow():
    """Test complete vault flow"""
    print(f"🔐 Complete Vault Flow Test")
    print(f"⏰ Started at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print("=" * 50)
    
    # Wait for lockout to clear
    if not wait_for_lockout_clear():
        return False
    
    # Step 1: Primary pattern authentication
    print(f"\n1. 🔑 Primary Pattern Authentication")
    primary_data = {
        "pattern": "1-2-3-6-9",
        "pattern_type": "primary_pattern"
    }
    response = requests.post(f"{api_url}/auth/pattern", json=primary_data)
    print(f"   Status: {response.status_code}")
    
    if response.status_code == 200:
        data = response.json()
        if data.get("success") and data.get("security_state") == "STATE_PHONE_UNLOCKED":
            print(f"   ✅ Primary pattern successful - Trap mode activated")
        else:
            print(f"   ❌ Primary pattern failed: {data.get('message', 'Unknown error')}")
            return False
    else:
        print(f"   ❌ HTTP Error: {response.status_code}")
        return False
    
    # Step 2: Owner pattern authentication
    print(f"\n2. 👑 Owner Pattern Authentication")
    owner_data = {
        "pattern": "1-5-9-8-7",
        "pattern_type": "owner_pattern"
    }
    response = requests.post(f"{api_url}/auth/pattern", json=owner_data)
    print(f"   Status: {response.status_code}")
    
    if response.status_code == 200:
        data = response.json()
        if data.get("success") and data.get("security_state") == "STATE_OWNER_PRESENT":
            print(f"   ✅ Owner pattern successful - Proactive mode activated")
        else:
            print(f"   ❌ Owner pattern failed: {data.get('message', 'Unknown error')}")
            return False
    else:
        print(f"   ❌ HTTP Error: {response.status_code}")
        return False
    
    # Step 3: Test vault access attempt
    print(f"\n3. 🔍 Vault Access Attempt")
    vault_access_data = {
        "action": "secret_handshake_detected",
        "code_used": "calculator_sequence"
    }
    response = requests.post(f"{api_url}/vault/access-attempt", json=vault_access_data)
    print(f"   Status: {response.status_code}")
    
    if response.status_code == 200:
        data = response.json()
        if data.get("success") and data.get("handshake_detected"):
            print(f"   ✅ Vault access attempt logged successfully")
            print(f"   📝 Message: {data.get('message', '')}")
        else:
            print(f"   ❌ Vault access attempt failed: {data.get('message', 'Unknown error')}")
            return False
    else:
        print(f"   ❌ HTTP Error: {response.status_code}")
        return False
    
    # Step 4: Test vault authentication
    print(f"\n4. 🔐 Vault Authentication")
    vault_auth_data = {
        "method": "pattern"
    }
    response = requests.post(f"{api_url}/vault/authenticate", json=vault_auth_data)
    print(f"   Status: {response.status_code}")
    
    if response.status_code == 200:
        data = response.json()
        if data.get("success") and data.get("vault_unlocked"):
            print(f"   ✅ Vault authentication successful")
            print(f"   🔓 Auth Method: {data.get('auth_method', '')}")
            print(f"   📝 Message: {data.get('message', '')}")
        else:
            print(f"   ❌ Vault authentication failed: {data.get('message', 'Unknown error')}")
            return False
    else:
        print(f"   ❌ HTTP Error: {response.status_code}")
        return False
    
    # Step 5: Test vault data access
    print(f"\n5. 📁 Vault Data Access")
    response = requests.get(f"{api_url}/vault/data")
    print(f"   Status: {response.status_code}")
    
    if response.status_code == 200:
        data = response.json()
        secure_files = data.get("secure_files", [])
        hidden_apps = data.get("hidden_apps", [])
        ai_plans = data.get("ai_hidden_plans", [])
        vault_stats = data.get("vault_stats", {})
        
        print(f"   ✅ Vault data accessed successfully")
        print(f"   📁 Secure Files: {len(secure_files)} files")
        print(f"   📱 Hidden Apps: {len(hidden_apps)} apps")
        print(f"   🧠 AI Plans: {len(ai_plans)} plans")
        print(f"   📊 Total Size: {vault_stats.get('total_size', 'Unknown')}")
        
        if secure_files and hidden_apps and ai_plans:
            print(f"   ✅ All vault data categories populated")
        else:
            print(f"   ⚠️  Some vault data categories empty")
    else:
        print(f"   ❌ HTTP Error: {response.status_code}")
        return False
    
    # Step 6: Verify security state transitions
    print(f"\n6. 🔒 Security State Verification")
    response = requests.get(f"{api_url}/auth/status")
    print(f"   Status: {response.status_code}")
    
    if response.status_code == 200:
        data = response.json()
        security_state = data.get("security_state")
        trap_mode = data.get("trap_mode", False)
        
        print(f"   🔒 Current Security State: {security_state}")
        print(f"   🎭 Trap Mode Active: {trap_mode}")
        
        if security_state == "STATE_OWNER_PRESENT" and not trap_mode:
            print(f"   ✅ Security state correctly shows owner authenticated")
        else:
            print(f"   ❌ Unexpected security state")
            return False
    else:
        print(f"   ❌ HTTP Error: {response.status_code}")
        return False
    
    print(f"\n" + "=" * 50)
    print(f"🎉 ALL VAULT TESTS COMPLETED SUCCESSFULLY!")
    print(f"⏰ Completed at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    return True

if __name__ == "__main__":
    success = test_complete_vault_flow()
    exit(0 if success else 1)