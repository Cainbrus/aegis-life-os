#!/usr/bin/env python3
"""
Vault Endpoints Testing - Specific test for calculator secret handshake and vault authentication
"""

import requests
import json
import time
from datetime import datetime

class VaultTester:
    def __init__(self, base_url="https://mate-os.preview.emergentagent.com"):
        self.base_url = base_url
        self.api_url = f"{base_url}/api"
        self.tests_run = 0
        self.tests_passed = 0
        
        print(f"🔐 Vault Endpoints Testing Suite")
        print(f"📡 Testing against: {self.base_url}")
        print("=" * 50)

    def run_test(self, name: str, method: str, endpoint: str, expected_status: int, 
                 data: dict = None, expected_fields: list = None) -> tuple:
        """Run a single API test"""
        url = f"{self.api_url}/{endpoint}"
        headers = {'Content-Type': 'application/json'}
        
        self.tests_run += 1
        print(f"\n🔍 Test {self.tests_run}: {name}")
        print(f"   📍 {method} {url}")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=headers, timeout=10)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=headers, timeout=10)
            else:
                raise ValueError(f"Unsupported method: {method}")

            print(f"   📊 Status: {response.status_code}")
            
            if response.status_code == expected_status:
                try:
                    response_data = response.json()
                    print(f"   ✅ SUCCESS - Valid JSON response")
                    
                    if expected_fields:
                        missing_fields = [field for field in expected_fields if field not in response_data]
                        if missing_fields:
                            print(f"   ⚠️  Missing expected fields: {missing_fields}")
                        else:
                            print(f"   ✅ All expected fields present: {expected_fields}")
                    
                    self.tests_passed += 1
                    return True, response_data
                    
                except json.JSONDecodeError:
                    print(f"   ❌ FAILED - Invalid JSON response")
                    return False, {}
            else:
                print(f"   ❌ FAILED - Expected {expected_status}, got {response.status_code}")
                return False, {}

        except requests.exceptions.RequestException as e:
            print(f"   ❌ FAILED - Network error: {str(e)}")
            return False, {}

    def authenticate_as_owner(self):
        """Authenticate as owner to access vault endpoints"""
        print(f"\n🔑 Authenticating as owner for vault access...")
        
        # First authenticate with primary pattern
        primary_pattern_data = {
            "pattern": "1-2-3-6-9",
            "pattern_type": "primary_pattern"
        }
        
        success, data = self.run_test(
            "Primary Pattern Auth",
            "POST",
            "auth/pattern",
            200,
            data=primary_pattern_data
        )
        
        if not success:
            return False
            
        # Then authenticate with owner pattern
        owner_pattern_data = {
            "pattern": "1-5-9-8-7",
            "pattern_type": "owner_pattern"
        }
        
        success, data = self.run_test(
            "Owner Pattern Auth",
            "POST",
            "auth/pattern",
            200,
            data=owner_pattern_data
        )
        
        if success and data.get("security_state") == "STATE_OWNER_PRESENT":
            print(f"   ✅ Successfully authenticated as owner")
            return True
        else:
            print(f"   ❌ Failed to authenticate as owner")
            return False

    def test_vault_access_attempt(self):
        """Test vault access attempt logging"""
        vault_access_data = {
            "action": "secret_handshake_detected",
            "code_used": "calculator_sequence",
            "timestamp": datetime.now().isoformat()
        }
        
        success, data = self.run_test(
            "Vault Access Attempt - Secret Handshake",
            "POST",
            "vault/access-attempt",
            200,
            data=vault_access_data,
            expected_fields=["success", "message", "handshake_detected"]
        )
        
        if success:
            handshake_detected = data.get("handshake_detected", False)
            message = data.get("message", "")
            
            if handshake_detected:
                print(f"   ✅ CORRECT - Secret handshake detected and logged")
                print(f"   📝 Message: {message}")
                return True
            else:
                print(f"   ❌ FAILED - Secret handshake not properly detected")
                return False
        
        return False

    def test_vault_authenticate(self):
        """Test vault authentication"""
        vault_auth_data = {
            "method": "pattern",
            "timestamp": datetime.now().isoformat()
        }
        
        success, data = self.run_test(
            "Vault Authentication",
            "POST",
            "vault/authenticate",
            200,
            data=vault_auth_data,
            expected_fields=["success", "message", "vault_unlocked"]
        )
        
        if success:
            vault_unlocked = data.get("vault_unlocked", False)
            auth_method = data.get("auth_method", "")
            message = data.get("message", "")
            
            if vault_unlocked:
                print(f"   ✅ CORRECT - Vault authentication successful")
                print(f"   🔓 Auth Method: {auth_method}")
                print(f"   📝 Message: {message}")
                return True
            else:
                print(f"   ❌ FAILED - Vault authentication failed: {message}")
                return False
        
        return False

    def test_vault_data_access(self):
        """Test vault data access"""
        success, data = self.run_test(
            "Vault Data Access",
            "GET",
            "vault/data",
            200,
            expected_fields=["secure_files", "hidden_apps", "ai_hidden_plans", "vault_stats"]
        )
        
        if success:
            secure_files = data.get("secure_files", [])
            hidden_apps = data.get("hidden_apps", [])
            ai_plans = data.get("ai_hidden_plans", [])
            vault_stats = data.get("vault_stats", {})
            
            print(f"   📁 Secure Files: {len(secure_files)} files")
            print(f"   📱 Hidden Apps: {len(hidden_apps)} apps")
            print(f"   🧠 AI Plans: {len(ai_plans)} plans")
            print(f"   📊 Total Size: {vault_stats.get('total_size', 'Unknown')}")
            
            if secure_files and hidden_apps and ai_plans:
                print(f"   ✅ CORRECT - Vault data properly structured and accessible")
                return True
            else:
                print(f"   ❌ FAILED - Vault data incomplete or missing")
                return False
        
        return False

    def test_vault_without_owner_auth(self):
        """Test vault access without owner authentication (should fail)"""
        # First logout to clear authentication
        requests.post(f"{self.api_url}/auth/logout", headers={'Content-Type': 'application/json'})
        
        # Try to authenticate vault without owner auth
        vault_auth_data = {
            "method": "pattern",
            "timestamp": datetime.now().isoformat()
        }
        
        success, data = self.run_test(
            "Vault Auth Without Owner - Should Fail",
            "POST",
            "vault/authenticate",
            200,
            data=vault_auth_data,
            expected_fields=["success", "message"]
        )
        
        if success:
            vault_success = data.get("success", True)  # Default to True to test failure
            message = data.get("message", "")
            
            if not vault_success and "Owner authentication required" in message:
                print(f"   ✅ CORRECT - Vault properly protected, requires owner auth")
                return True
            else:
                print(f"   ❌ SECURITY ISSUE - Vault accessible without owner authentication!")
                return False
        
        return False

    def run_vault_tests(self):
        """Run comprehensive vault testing"""
        print(f"\n🚀 STARTING VAULT ENDPOINTS TEST SUITE")
        print(f"⏰ Test started at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        print("=" * 50)
        
        # Test 1: Vault access without authentication (should fail)
        print(f"\n🛡️  PHASE 1: SECURITY TESTING")
        self.test_vault_without_owner_auth()
        
        # Test 2: Authenticate as owner
        print(f"\n🔑 PHASE 2: OWNER AUTHENTICATION")
        if not self.authenticate_as_owner():
            print(f"❌ Cannot proceed with vault tests - owner authentication failed")
            return 1
        
        # Test 3: Vault endpoints testing
        print(f"\n🔐 PHASE 3: VAULT ENDPOINTS TESTING")
        self.test_vault_access_attempt()
        self.test_vault_authenticate()
        self.test_vault_data_access()
        
        # Final Results
        print(f"\n" + "=" * 50)
        print(f"🏁 VAULT ENDPOINTS TEST COMPLETED")
        print(f"📊 Tests Run: {self.tests_run}")
        print(f"✅ Tests Passed: {self.tests_passed}")
        print(f"❌ Tests Failed: {self.tests_run - self.tests_passed}")
        print(f"📈 Success Rate: {(self.tests_passed/self.tests_run)*100:.1f}%")
        print(f"⏰ Test completed at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        
        if self.tests_passed == self.tests_run:
            print(f"\n🎉 ALL VAULT TESTS PASSED!")
            return 0
        else:
            print(f"\n⚠️  SOME VAULT TESTS FAILED")
            return 1

def main():
    """Main test execution"""
    tester = VaultTester()
    return tester.run_vault_tests()

if __name__ == "__main__":
    exit(main())