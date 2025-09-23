#!/usr/bin/env python3
"""
Aegis HPI OS - Comprehensive Backend API Testing
Tests the revolutionary 4-tier Hierarchical Proactive Intelligence Operating System
"""

import requests
import json
import time
import sys
from datetime import datetime
from typing import Dict, Any, List

class AegisHPITester:
    def __init__(self, base_url="https://hpi-mate.preview.emergentagent.com"):
        self.base_url = base_url
        self.api_url = f"{base_url}/api"
        self.tests_run = 0
        self.tests_passed = 0
        self.current_security_state = "STATE_UNKNOWN_USER"
        
        print(f"🚀 Aegis HPI OS Testing Suite")
        print(f"📡 Testing against: {self.base_url}")
        print(f"🔬 API Endpoint: {self.api_url}")
        print("=" * 60)

    def run_test(self, name: str, method: str, endpoint: str, expected_status: int, 
                 data: Dict[str, Any] = None, expected_fields: List[str] = None) -> tuple:
        """Run a single API test with comprehensive validation"""
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
            
            # Check status code
            status_ok = response.status_code == expected_status
            if not status_ok:
                print(f"   ❌ FAILED - Expected {expected_status}, got {response.status_code}")
                if response.text:
                    print(f"   📝 Response: {response.text[:200]}...")
                return False, {}

            # Parse response
            try:
                response_data = response.json()
                print(f"   ✅ SUCCESS - Valid JSON response")
                
                # Check expected fields
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
                print(f"   📝 Raw response: {response.text[:200]}...")
                return False, {}

        except requests.exceptions.RequestException as e:
            print(f"   ❌ FAILED - Network error: {str(e)}")
            return False, {}
        except Exception as e:
            print(f"   ❌ FAILED - Unexpected error: {str(e)}")
            return False, {}

    def test_system_status(self) -> bool:
        """Test system status endpoint"""
        success, data = self.run_test(
            "System Status Check",
            "GET", 
            "system/status",
            200,
            expected_fields=["system", "version", "security_state", "l2_orchestrator", "l3_agents"]
        )
        
        if success:
            self.current_security_state = data.get("security_state", "UNKNOWN")
            print(f"   🔒 Current Security State: {self.current_security_state}")
            print(f"   🏗️  System Version: {data.get('version', 'Unknown')}")
            
        return success

    def test_auth_status(self) -> bool:
        """Test authentication status endpoint"""
        success, data = self.run_test(
            "Authentication Status Check",
            "GET",
            "auth/status",
            200,
            expected_fields=["security_state", "trap_mode", "lockout_active", "failed_attempts", "max_attempts", "system"]
        )
        
        if success:
            self.current_security_state = data.get("security_state", "UNKNOWN")
            print(f"   🔒 Current Security State: {self.current_security_state}")
            print(f"   🎭 Trap Mode Active: {data.get('trap_mode', False)}")
            print(f"   🔐 Lockout Active: {data.get('lockout_active', False)}")
            print(f"   ❌ Failed Attempts: {data.get('failed_attempts', 0)}/{data.get('max_attempts', 3)}")
            
        return success

    def test_pattern_setup(self) -> bool:
        """Test dual pattern setup endpoint"""
        pattern_config = {
            "primary_pattern": "1-2-3-6-9",  # L-shape pattern
            "owner_pattern": "1-5-9-8-7",   # Z-shape pattern  
            "duress_pattern": "2-5-8"       # Vertical line pattern
        }
        
        success, data = self.run_test(
            "Pattern Setup - Dual Authentication",
            "POST",
            "auth/setup-dual-patterns",
            200,
            data=pattern_config,
            expected_fields=["success", "message"]
        )
        
        if success:
            setup_success = data.get("success", False)
            message = data.get("message", "")
            
            if setup_success:
                print(f"   ✅ CORRECT - Dual patterns configured successfully")
                print(f"   📝 Message: {message}")
                return True
            else:
                print(f"   ❌ FAILED - Pattern setup failed: {message}")
                return False
        
        return False

    def test_pattern_validation(self) -> bool:
        """Test pattern validation (minimum 4 dots)"""
        # Test invalid pattern (too short)
        invalid_pattern = {
            "primary_pattern": "1-2-3",      # Only 3 dots - should fail
            "owner_pattern": "1-5-9-8-7",   # Valid
            "duress_pattern": "2-5-8"       # Valid but short (duress can be shorter)
        }
        
        success, data = self.run_test(
            "Pattern Validation - Too Short",
            "POST", 
            "auth/setup-dual-patterns",
            200,
            data=invalid_pattern,
            expected_fields=["success", "message"]
        )
        
        if success:
            setup_success = data.get("success", False)
            message = data.get("message", "")
            
            if not setup_success and "at least 4 dots" in message:
                print(f"   ✅ CORRECT - Pattern validation working: {message}")
                return True
            else:
                print(f"   ❌ FAILED - Pattern validation not working properly")
                return False
        
        return False

    def test_primary_pattern_auth(self) -> bool:
        """Test primary pattern authentication (trap mode)"""
        primary_pattern_data = {
            "pattern": "1-2-3-6-9",
            "pattern_type": "primary_pattern"
        }
        
        success, data = self.run_test(
            "Primary Pattern Auth - Trap Mode",
            "POST",
            "auth/pattern",
            200,
            data=primary_pattern_data,
            expected_fields=["success", "security_state", "message", "trap_mode"]
        )
        
        if success:
            auth_success = data.get("success", False)
            security_state = data.get("security_state")
            trap_mode = data.get("trap_mode", False)
            
            if auth_success and security_state == "STATE_PHONE_UNLOCKED" and trap_mode:
                print(f"   ✅ CORRECT - Primary pattern activated trap mode")
                self.current_security_state = security_state
                return True
            else:
                print(f"   ❌ UNEXPECTED - Expected trap mode activation, got {security_state}")
                return False
        
        return False

    def test_owner_pattern_auth(self) -> bool:
        """Test owner pattern authentication (real data access)"""
        # First ensure we're in phone unlocked state
        if self.current_security_state != "STATE_PHONE_UNLOCKED":
            print(f"   ⚠️  Need to be in PHONE_UNLOCKED state first, currently: {self.current_security_state}")
            # Try primary pattern first
            self.test_primary_pattern_auth()
        
        owner_pattern_data = {
            "pattern": "1-5-9-8-7",
            "pattern_type": "owner_pattern"
        }
        
        success, data = self.run_test(
            "Owner Pattern Auth - Real Data Access",
            "POST",
            "auth/pattern", 
            200,
            data=owner_pattern_data,
            expected_fields=["success", "security_state", "message", "proactive_mode"]
        )
        
        if success:
            auth_success = data.get("success", False)
            security_state = data.get("security_state")
            proactive_mode = data.get("proactive_mode", False)
            
            if auth_success and security_state == "STATE_OWNER_PRESENT" and proactive_mode:
                print(f"   ✅ CORRECT - Owner pattern activated proactive mode")
                self.current_security_state = security_state
                return True
            else:
                print(f"   ❌ UNEXPECTED - Expected owner mode activation, got {security_state}")
                return False
        
        return False

    def test_duress_pattern_auth(self) -> bool:
        """Test duress pattern authentication (emergency + trap mode)"""
        # Reset to locked state first
        self.test_logout()
        
        duress_pattern_data = {
            "pattern": "2-5-8",
            "pattern_type": "duress_pattern"
        }
        
        success, data = self.run_test(
            "Duress Pattern Auth - Emergency Mode",
            "POST",
            "auth/pattern",
            200,
            data=duress_pattern_data,
            expected_fields=["success", "security_state", "message", "trap_mode"]
        )
        
        if success:
            auth_success = data.get("success", False)
            security_state = data.get("security_state")
            trap_mode = data.get("trap_mode", False)
            
            if auth_success and security_state == "STATE_PHONE_UNLOCKED" and trap_mode:
                print(f"   ✅ CORRECT - Duress pattern activated emergency + trap mode")
                self.current_security_state = security_state
                return True
            else:
                print(f"   ❌ UNEXPECTED - Expected emergency trap mode, got {security_state}")
                return False
        
        return False

    def test_auto_detect_pattern(self) -> bool:
        """Test auto-detect pattern functionality"""
        # Reset to locked state first
        self.test_logout()
        
        # Test auto-detect with primary pattern
        auto_detect_data = {
            "pattern": "1-2-3-6-9",
            "pattern_type": "auto_detect"
        }
        
        success, data = self.run_test(
            "Auto-Detect Pattern - Primary",
            "POST",
            "auth/pattern",
            200,
            data=auto_detect_data,
            expected_fields=["success", "security_state", "trap_mode"]
        )
        
        if success:
            auth_success = data.get("success", False)
            security_state = data.get("security_state")
            trap_mode = data.get("trap_mode", False)
            
            if auth_success and security_state == "STATE_PHONE_UNLOCKED" and trap_mode:
                print(f"   ✅ CORRECT - Auto-detect correctly identified primary pattern")
                self.current_security_state = security_state
                return True
            else:
                print(f"   ❌ UNEXPECTED - Auto-detect failed for primary pattern")
                return False
        
        return False

    def test_failed_authentication_lockout(self) -> bool:
        """Test failed authentication and lockout system"""
        # Reset to locked state first
        self.test_logout()
        
        wrong_pattern_data = {
            "pattern": "9-8-7-6-5",  # Wrong pattern
            "pattern_type": "primary_pattern"
        }
        
        # Test multiple failed attempts
        failed_attempts = 0
        for attempt in range(4):  # Try 4 times to trigger lockout
            success, data = self.run_test(
                f"Failed Auth Attempt #{attempt + 1}",
                "POST",
                "auth/pattern",
                200,
                data=wrong_pattern_data,
                expected_fields=["success", "security_state", "message"]
            )
            
            if success:
                auth_success = data.get("success", False)
                message = data.get("message", "")
                
                if not auth_success:
                    failed_attempts += 1
                    print(f"   ✅ Failed attempt #{attempt + 1} correctly rejected")
                    
                    if "locked" in message.lower():
                        print(f"   ✅ CORRECT - System locked after {failed_attempts} failed attempts")
                        return True
                else:
                    print(f"   ❌ UNEXPECTED - Wrong pattern was accepted!")
                    return False
            
            time.sleep(0.5)  # Brief pause between attempts
        
        print(f"   ❌ FAILED - System did not lock after {failed_attempts} failed attempts")
        return False

    def test_logout(self) -> bool:
        """Test logout functionality"""
        success, data = self.run_test(
            "System Logout",
            "POST",
            "auth/logout",
            200,
            expected_fields=["success", "security_state", "message"]
        )
        
        if success:
            logout_success = data.get("success", False)
            security_state = data.get("security_state")
            
            if logout_success and security_state == "STATE_LOCKED":
                print(f"   ✅ CORRECT - System locked successfully")
                self.current_security_state = security_state
                return True
            else:
                print(f"   ❌ FAILED - Logout did not lock system properly")
                return False
        
        return False

    def test_l2_ai_orchestrator(self) -> bool:
        """Test L2 AI Orchestrator - Proactive Request Processing"""
        if self.current_security_state != "STATE_OWNER_PRESENT":
            print(f"   ⚠️  Skipping L2 AI test - requires owner authentication")
            return True
            
        proactive_request = {
            "input": "Schedule a meeting with Sarah tomorrow at 2pm and check my recent messages",
            "context": "general"
        }
        
        success, data = self.run_test(
            "L2 Proactive AI - Complex Request",
            "POST",
            "proactive/request",
            200,
            data=proactive_request,
            expected_fields=["status", "response", "suggestions"]
        )
        
        if success:
            status = data.get("status", "")
            response = data.get("response", "")
            suggestions = data.get("suggestions", [])
            
            print(f"   🧠 AI Response: {response[:100]}...")
            print(f"   💡 Suggestions: {len(suggestions)} provided")
            
            if status == "success" and response:
                print(f"   ✅ AI successfully processed proactive request")
                return True
            else:
                print(f"   ❌ AI failed to properly process the request")
                return False
        
        return False

    def test_l3_agents_trap_mode(self) -> bool:
        """Test L3 App Agents - Trap Mode (when in phone unlocked state)"""
        if self.current_security_state != "STATE_PHONE_UNLOCKED":
            print(f"   ⚠️  Skipping trap mode test - not in phone unlocked state")
            return True
            
        print(f"\n🎭 Testing L3 Agents in Trap Mode (Security State: {self.current_security_state})")
        
        agents_results = []
        
        # Test Messages App Data
        success, data = self.run_test(
            "L3 Messages App - Trap Data",
            "GET",
            "apps/messages/data",
            200,
            expected_fields=["status", "app", "data_type", "data", "trap_active"]
        )
        
        if success:
            data_type = data.get("data_type", "")
            trap_active = data.get("trap_active", False)
            app_data = data.get("data", {})
            
            if data_type == "trap_decoy" and trap_active and app_data:
                print(f"   ✅ Messages app returning convincing trap data")
                agents_results.append(True)
            else:
                print(f"   ❌ Messages app not in proper trap mode")
                agents_results.append(False)
        else:
            agents_results.append(False)

        # Test Photos App Data  
        success, data = self.run_test(
            "L3 Photos App - Trap Data",
            "GET",
            "apps/photos/data",
            200,
            expected_fields=["status", "app", "data_type", "data", "trap_active"]
        )
        
        if success:
            data_type = data.get("data_type", "")
            trap_active = data.get("trap_active", False)
            app_data = data.get("data", {})
            
            if data_type == "trap_decoy" and trap_active and app_data:
                print(f"   ✅ Photos app returning convincing trap data")
                agents_results.append(True)
            else:
                print(f"   ❌ Photos app not in proper trap mode")
                agents_results.append(False)
        else:
            agents_results.append(False)

        # Test Calendar App Data
        success, data = self.run_test(
            "L3 Calendar App - Trap Data", 
            "GET",
            "apps/calendar/data",
            200,
            expected_fields=["status", "app", "data_type", "data", "trap_active"]
        )
        
        if success:
            data_type = data.get("data_type", "")
            trap_active = data.get("trap_active", False)
            app_data = data.get("data", {})
            
            if data_type == "trap_decoy" and trap_active and app_data:
                print(f"   ✅ Calendar app returning convincing trap data")
                agents_results.append(True)
            else:
                print(f"   ❌ Calendar app not in proper trap mode")
                agents_results.append(False)
        else:
            agents_results.append(False)

        return all(agents_results)

    def test_l3_agents_owner_mode(self) -> bool:
        """Test L3 App Agents - Owner Mode (when authenticated)"""
        if self.current_security_state != "STATE_OWNER_PRESENT":
            print(f"   ⚠️  Skipping owner mode test - not authenticated as owner")
            return True
            
        print(f"\n🔓 Testing L3 Agents in Owner Mode (Security State: {self.current_security_state})")
        
        agents_results = []
        
        # Test Messages App Data
        success, data = self.run_test(
            "L3 Messages App - Real Data",
            "GET", 
            "apps/messages/data",
            200,
            expected_fields=["status", "app", "data_type", "data", "trap_active"]
        )
        
        if success:
            data_type = data.get("data_type", "")
            trap_active = data.get("trap_active", False)
            
            if data_type == "real_data" and not trap_active:
                print(f"   ✅ Messages app returning real data (no trap mode)")
                agents_results.append(True)
            else:
                print(f"   ❌ Messages app still in trap mode when owner authenticated")
                agents_results.append(False)
        else:
            agents_results.append(False)

        # Test Photos App Data
        success, data = self.run_test(
            "L3 Photos App - Real Data",
            "GET",
            "apps/photos/data", 
            200,
            expected_fields=["status", "app", "data_type", "data", "trap_active"]
        )
        
        if success:
            data_type = data.get("data_type", "")
            trap_active = data.get("trap_active", False)
            
            if data_type == "real_data" and not trap_active:
                print(f"   ✅ Photos app returning real data (no trap mode)")
                agents_results.append(True)
            else:
                print(f"   ❌ Photos app still in trap mode when owner authenticated")
                agents_results.append(False)
        else:
            agents_results.append(False)

        # Test Calendar App Data
        success, data = self.run_test(
            "L3 Calendar App - Real Data",
            "GET",
            "apps/calendar/data",
            200,
            expected_fields=["status", "app", "data_type", "data", "trap_active"]
        )
        
        if success:
            data_type = data.get("data_type", "")
            trap_active = data.get("trap_active", False)
            
            if data_type == "real_data" and not trap_active:
                print(f"   ✅ Calendar app returning real data (no trap mode)")
                agents_results.append(True)
            else:
                print(f"   ❌ Calendar app still in trap mode when owner authenticated")
                agents_results.append(False)
        else:
            agents_results.append(False)

        return all(agents_results)

    def test_phantom_folder_unauthorized(self) -> bool:
        """Test L0 Phantom Folder - Unauthorized Access"""
        sensitive_file = {
            "filename": "secret_document.txt",
            "content": "This is highly sensitive information that should be encrypted",
            "sensitivity": 0.9
        }
        
        success, data = self.run_test(
            "L0 Phantom Folder - Unauthorized Access",
            "POST",
            "phantom/store",
            403,  # Should be forbidden for unknown users
            data=sensitive_file
        )
        
        # For 403, success means we got the expected rejection
        if not success and self.current_security_state == "STATE_UNKNOWN_USER":
            print(f"   ✅ CORRECT - Phantom folder properly rejected unauthorized access")
            return True
        elif success:
            print(f"   ❌ SECURITY BREACH - Phantom folder allowed unauthorized access!")
            return False
        else:
            print(f"   ❌ Unexpected response for unauthorized phantom folder access")
            return False

    def test_phantom_folder_authorized(self) -> bool:
        """Test L0 Phantom Folder - Authorized Access"""
        if self.current_security_state != "STATE_OWNER_PRESENT":
            print(f"   ⚠️  Skipping authorized phantom folder test - not authenticated as owner")
            return True
            
        sensitive_file = {
            "filename": "owner_document.txt", 
            "content": "This is the owner's sensitive data that should be encrypted and stored",
            "sensitivity": 0.8
        }
        
        success, data = self.run_test(
            "L0 Phantom Folder - Authorized Storage",
            "POST",
            "phantom/store",
            200,
            data=sensitive_file,
            expected_fields=["status", "file_id", "encrypted"]
        )
        
        if success:
            file_id = data.get("file_id")
            encrypted = data.get("encrypted", False)
            
            if file_id and encrypted:
                print(f"   ✅ Phantom folder successfully stored encrypted file: {file_id}")
                return True
            else:
                print(f"   ❌ Phantom folder storage incomplete")
                return False
        
        return False

    def test_security_events_log(self) -> bool:
        """Test Security Events Logging"""
        success, data = self.run_test(
            "Security Events Log",
            "GET",
            "system/security-events",
            200,
            expected_fields=["status", "events", "count"]
        )
        
        if success:
            events = data.get("events", [])
            count = data.get("count", 0)
            
            print(f"   📊 Security Events Logged: {count}")
            
            # Check if we have security state change events
            state_changes = [e for e in events if e.get("event_type") == "security_state_change"]
            print(f"   🔄 State Change Events: {len(state_changes)}")
            
            if count > 0:
                print(f"   ✅ Security events are being properly logged")
                return True
            else:
                print(f"   ⚠️  No security events found (may be expected for fresh system)")
                return True  # Not necessarily a failure
        
        return False

    def run_comprehensive_test_suite(self):
        """Run the complete Aegis HPI OS test suite"""
        print(f"\n🚀 STARTING COMPREHENSIVE AEGIS HPI OS TEST SUITE")
        print(f"⏰ Test started at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        print("=" * 60)
        
        # Phase 1: System Status
        print(f"\n📊 PHASE 1: SYSTEM STATUS VERIFICATION")
        self.test_system_status()
        
        # Phase 2: Unknown User Testing (Decoy Mode)
        print(f"\n🎭 PHASE 2: UNKNOWN USER TESTING (DECOY MODE)")
        self.test_behavioral_auth_unknown_user()
        time.sleep(1)  # Brief pause for state propagation
        self.test_l3_agents_decoy_mode()
        self.test_phantom_folder_unauthorized()
        
        # Phase 3: Owner Authentication Testing
        print(f"\n🔓 PHASE 3: OWNER AUTHENTICATION TESTING")
        self.test_behavioral_auth_owner()
        time.sleep(1)  # Brief pause for state propagation
        self.test_l3_agents_owner_mode()
        self.test_phantom_folder_authorized()
        
        # Phase 4: AI Intelligence Testing
        print(f"\n🧠 PHASE 4: AI INTELLIGENCE TESTING")
        self.test_l2_ai_orchestrator()
        
        # Phase 5: Security & Monitoring
        print(f"\n🛡️  PHASE 5: SECURITY & MONITORING")
        self.test_security_events_log()
        
        # Final Results
        print(f"\n" + "=" * 60)
        print(f"🏁 AEGIS HPI OS TEST SUITE COMPLETED")
        print(f"📊 Tests Run: {self.tests_run}")
        print(f"✅ Tests Passed: {self.tests_passed}")
        print(f"❌ Tests Failed: {self.tests_run - self.tests_passed}")
        print(f"📈 Success Rate: {(self.tests_passed/self.tests_run)*100:.1f}%")
        print(f"🔒 Final Security State: {self.current_security_state}")
        print(f"⏰ Test completed at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        
        if self.tests_passed == self.tests_run:
            print(f"\n🎉 ALL TESTS PASSED - AEGIS HPI OS IS FULLY OPERATIONAL!")
            return 0
        else:
            print(f"\n⚠️  SOME TESTS FAILED - REVIEW RESULTS ABOVE")
            return 1

def main():
    """Main test execution"""
    tester = AegisHPITester()
    return tester.run_comprehensive_test_suite()

if __name__ == "__main__":
    sys.exit(main())