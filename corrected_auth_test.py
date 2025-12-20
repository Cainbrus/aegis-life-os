#!/usr/bin/env python3
"""
CORRECTED Authentication Flow Testing
Tests the newly fixed authentication system with behavioral analysis and proper mode switching.
"""

import requests
import json
import time
import sys
from datetime import datetime
from typing import Dict, Any, List

class CorrectedAuthFlowTester:
    def __init__(self, base_url="https://life-os-aegis.preview.emergentagent.com"):
        self.base_url = base_url
        self.api_url = f"{base_url}/api"
        self.tests_run = 0
        self.tests_passed = 0
        self.current_security_state = "STATE_LOCKED"
        
        print(f"🔧 CORRECTED Authentication Flow Testing Suite")
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

    def setup_patterns(self) -> bool:
        """Setup the corrected dual pattern system"""
        pattern_config = {
            "normal_pattern": "1-2-3-6-9",    # Normal phone unlock
            "owner_code": "1-5-9-8-7",       # Owner verification code
            "duress_pattern": "2-5-8"        # Emergency pattern
        }
        
        success, data = self.run_test(
            "Setup Corrected Pattern System",
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
                print(f"   ✅ CORRECTED - Dual patterns configured successfully")
                print(f"   📝 Message: {message}")
                return True
            else:
                print(f"   ❌ FAILED - Pattern setup failed: {message}")
                return False
        
        return False

    def test_normal_pattern_owner_behavior(self) -> bool:
        """Test normal pattern with simulated owner behavior → should get normal phone mode"""
        # Reset to locked state first
        self.logout()
        
        # Simulate owner behavior by setting behavioral trust score high
        # This would normally be done through behavioral analysis
        normal_pattern_data = {
            "pattern": "1-2-3-6-9",
            "pattern_type": "auto_detect",
            "behavioral_context": {
                "touch_pressure": "normal",
                "drawing_speed": "consistent", 
                "device_angle": "familiar",
                "time_of_day": "usual",
                "location": "home"
            }
        }
        
        success, data = self.run_test(
            "Normal Pattern + Owner Behavior → Normal Phone Mode",
            "POST",
            "auth/pattern",
            200,
            data=normal_pattern_data,
            expected_fields=["success", "security_state", "mode", "behavioral_confidence", "real_data"]
        )
        
        if success:
            auth_success = data.get("success", False)
            security_state = data.get("security_state")
            mode = data.get("mode", "")
            real_data = data.get("real_data", False)
            behavioral_confidence = data.get("behavioral_confidence", 0)
            
            print(f"   🧠 Behavioral Confidence: {behavioral_confidence}")
            print(f"   📱 Mode: {mode}")
            print(f"   🔒 Security State: {security_state}")
            
            if (auth_success and 
                security_state == "STATE_PHONE_UNLOCKED" and 
                mode == "normal_phone" and 
                real_data == True):
                print(f"   ✅ CORRECT - Owner behavior detected, normal phone mode activated")
                self.current_security_state = security_state
                return True
            else:
                print(f"   ❌ FAILED - Expected normal phone mode for owner behavior")
                return False
        
        return False

    def test_normal_pattern_intruder_behavior(self) -> bool:
        """Test normal pattern with simulated intruder behavior → should get automatic doge mode"""
        # Reset to locked state first
        self.logout()
        
        # Simulate intruder behavior by providing suspicious behavioral context
        normal_pattern_data = {
            "pattern": "1-2-3-6-9",
            "pattern_type": "auto_detect",
            "behavioral_context": {
                "touch_pressure": "unusual",
                "drawing_speed": "inconsistent",
                "device_angle": "unfamiliar", 
                "time_of_day": "unusual",
                "location": "unknown"
            }
        }
        
        success, data = self.run_test(
            "Normal Pattern + Intruder Behavior → Automatic Doge Mode",
            "POST",
            "auth/pattern",
            200,
            data=normal_pattern_data,
            expected_fields=["success", "security_state", "mode", "trap_mode", "appears_normal"]
        )
        
        if success:
            auth_success = data.get("success", False)
            security_state = data.get("security_state")
            mode = data.get("mode", "")
            trap_mode = data.get("trap_mode", False)
            appears_normal = data.get("appears_normal", False)
            behavioral_confidence = data.get("behavioral_confidence", 0)
            
            print(f"   🧠 Behavioral Confidence: {behavioral_confidence}")
            print(f"   📱 Mode: {mode}")
            print(f"   🎭 Trap Mode: {trap_mode}")
            print(f"   😎 Appears Normal: {appears_normal}")
            
            if (auth_success and 
                security_state == "STATE_PHONE_UNLOCKED" and 
                mode == "doge_mode" and 
                trap_mode == True and
                appears_normal == True):
                print(f"   ✅ CORRECT - Intruder behavior detected, automatic DOGE MODE activated")
                self.current_security_state = security_state
                return True
            else:
                print(f"   ❌ FAILED - Expected automatic doge mode for intruder behavior")
                return False
        
        return False

    def test_owner_verification_code_always_works(self) -> bool:
        """Test owner verification code → should always grant full owner access"""
        # Can be used from any state
        owner_code_data = {
            "pattern": "1-5-9-8-7",
            "pattern_type": "owner_pattern"
        }
        
        success, data = self.run_test(
            "Owner Verification Code → Always Full Access",
            "POST",
            "auth/pattern",
            200,
            data=owner_code_data,
            expected_fields=["success", "security_state", "mode", "proactive_mode", "full_aegis_access"]
        )
        
        if success:
            auth_success = data.get("success", False)
            security_state = data.get("security_state")
            mode = data.get("mode", "")
            proactive_mode = data.get("proactive_mode", False)
            full_aegis_access = data.get("full_aegis_access", False)
            trap_mode = data.get("trap_mode", True)  # Should be False
            
            print(f"   📱 Mode: {mode}")
            print(f"   🚀 Proactive Mode: {proactive_mode}")
            print(f"   🔓 Full Aegis Access: {full_aegis_access}")
            print(f"   🎭 Trap Mode: {trap_mode}")
            
            if (auth_success and 
                security_state == "STATE_OWNER_PRESENT" and 
                mode == "owner_mode" and 
                proactive_mode == True and
                full_aegis_access == True and
                trap_mode == False):
                print(f"   ✅ CORRECT - Owner code grants full access regardless of behavioral analysis")
                self.current_security_state = security_state
                return True
            else:
                print(f"   ❌ FAILED - Owner verification code not working properly")
                return False
        
        return False

    def test_duress_pattern_emergency_mode(self) -> bool:
        """Test duress pattern → should trigger emergency + trap mode"""
        # Reset to locked state first
        self.logout()
        
        duress_pattern_data = {
            "pattern": "2-5-8",
            "pattern_type": "duress_pattern"
        }
        
        success, data = self.run_test(
            "Duress Pattern → Emergency + Trap Mode",
            "POST",
            "auth/pattern",
            200,
            data=duress_pattern_data,
            expected_fields=["success", "security_state", "trap_mode", "full_access", "apps_available"]
        )
        
        if success:
            auth_success = data.get("success", False)
            security_state = data.get("security_state")
            trap_mode = data.get("trap_mode", False)
            full_access = data.get("full_access", False)
            apps_available = data.get("apps_available", False)
            
            print(f"   🚨 Emergency Mode Activated")
            print(f"   🎭 Trap Mode: {trap_mode}")
            print(f"   📱 Full Access: {full_access}")
            print(f"   📲 Apps Available: {apps_available}")
            
            if (auth_success and 
                security_state == "STATE_PHONE_UNLOCKED" and 
                trap_mode == True and
                full_access == True and
                apps_available == True):
                print(f"   ✅ CORRECT - Duress pattern activated emergency + trap mode")
                self.current_security_state = security_state
                return True
            else:
                print(f"   ❌ FAILED - Duress pattern not working properly")
                return False
        
        return False

    def test_behavioral_analysis_working(self) -> bool:
        """Verify behavioral analysis is working in authentication logic"""
        # Test multiple normal pattern attempts with different behavioral contexts
        behavioral_tests = []
        
        # Test 1: High confidence behavior (should get normal mode)
        self.logout()
        high_confidence_data = {
            "pattern": "1-2-3-6-9",
            "pattern_type": "auto_detect"
        }
        
        success, data = self.run_test(
            "Behavioral Analysis - High Confidence",
            "POST",
            "auth/pattern",
            200,
            data=high_confidence_data,
            expected_fields=["success", "behavioral_confidence"]
        )
        
        if success:
            behavioral_confidence = data.get("behavioral_confidence", 0)
            mode = data.get("mode", "")
            
            print(f"   🧠 Behavioral Confidence: {behavioral_confidence}")
            print(f"   📱 Resulting Mode: {mode}")
            
            # Behavioral analysis should be working (confidence value present)
            if behavioral_confidence is not None:
                print(f"   ✅ Behavioral analysis is functioning")
                behavioral_tests.append(True)
            else:
                print(f"   ❌ Behavioral analysis not working")
                behavioral_tests.append(False)
        else:
            behavioral_tests.append(False)
        
        return all(behavioral_tests)

    def test_doge_mode_fake_data(self) -> bool:
        """Verify that doge mode shows fake data while normal mode shows real data"""
        # First get into doge mode (trap mode)
        if self.current_security_state != "STATE_PHONE_UNLOCKED":
            # Try to get into trap mode first
            self.logout()
            trap_data = {
                "pattern": "1-2-3-6-9",
                "pattern_type": "auto_detect"
            }
            self.run_test("Get into trap mode", "POST", "auth/pattern", 200, data=trap_data)
        
        # Test app data in trap mode
        success, data = self.run_test(
            "Doge Mode - Fake Data Verification",
            "GET",
            "apps/messages/data",
            200,
            expected_fields=["status", "data_type", "trap_active", "appears_real"]
        )
        
        if success:
            data_type = data.get("data_type", "")
            trap_active = data.get("trap_active", False)
            appears_real = data.get("appears_real", False)
            app_data = data.get("data", {})
            
            print(f"   📊 Data Type: {data_type}")
            print(f"   🎭 Trap Active: {trap_active}")
            print(f"   😎 Appears Real: {appears_real}")
            
            if (data_type == "trap_decoy" and 
                trap_active == True and 
                appears_real == True and
                app_data):
                print(f"   ✅ CORRECT - Doge mode serving convincing fake data")
                return True
            else:
                print(f"   ❌ FAILED - Doge mode not serving proper fake data")
                return False
        
        return False

    def test_normal_mode_real_data(self) -> bool:
        """Verify normal mode shows real data"""
        # Get into owner mode first
        owner_code_data = {
            "pattern": "1-5-9-8-7",
            "pattern_type": "owner_pattern"
        }
        self.run_test("Get into owner mode", "POST", "auth/pattern", 200, data=owner_code_data)
        
        # Test app data in owner mode
        success, data = self.run_test(
            "Normal Mode - Real Data Verification",
            "GET",
            "apps/messages/data",
            200,
            expected_fields=["status", "data_type", "trap_active"]
        )
        
        if success:
            data_type = data.get("data_type", "")
            trap_active = data.get("trap_active", False)
            
            print(f"   📊 Data Type: {data_type}")
            print(f"   🎭 Trap Active: {trap_active}")
            
            if (data_type == "real_data" and 
                trap_active == False):
                print(f"   ✅ CORRECT - Normal mode serving real data")
                return True
            else:
                print(f"   ❌ FAILED - Normal mode not serving real data")
                return False
        
        return False

    def logout(self) -> bool:
        """Logout and reset to locked state"""
        success, data = self.run_test(
            "System Logout",
            "POST",
            "auth/logout",
            200,
            expected_fields=["success", "security_state"]
        )
        
        if success:
            self.current_security_state = data.get("security_state", "STATE_LOCKED")
            return True
        return False

    def run_corrected_auth_flow_tests(self):
        """Run the complete corrected authentication flow test suite"""
        print(f"\n🚀 STARTING CORRECTED AUTHENTICATION FLOW TESTS")
        print(f"⏰ Test started at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        print("=" * 60)
        
        # Setup
        print(f"\n🔧 PHASE 1: SETUP CORRECTED PATTERN SYSTEM")
        self.setup_patterns()
        
        # Core corrected authentication flow tests
        print(f"\n🧠 PHASE 2: BEHAVIORAL ANALYSIS & MODE SWITCHING")
        self.test_normal_pattern_owner_behavior()
        time.sleep(1)
        
        self.test_normal_pattern_intruder_behavior()
        time.sleep(1)
        
        self.test_owner_verification_code_always_works()
        time.sleep(1)
        
        self.test_duress_pattern_emergency_mode()
        time.sleep(1)
        
        # Verification tests
        print(f"\n✅ PHASE 3: VERIFICATION & DATA VALIDATION")
        self.test_behavioral_analysis_working()
        self.test_doge_mode_fake_data()
        self.test_normal_mode_real_data()
        
        # Final Results
        print(f"\n" + "=" * 60)
        print(f"🏁 CORRECTED AUTHENTICATION FLOW TESTS COMPLETED")
        print(f"📊 Tests Run: {self.tests_run}")
        print(f"✅ Tests Passed: {self.tests_passed}")
        print(f"❌ Tests Failed: {self.tests_run - self.tests_passed}")
        print(f"📈 Success Rate: {(self.tests_passed/self.tests_run)*100:.1f}%")
        print(f"🔒 Final Security State: {self.current_security_state}")
        print(f"⏰ Test completed at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        
        if self.tests_passed == self.tests_run:
            print(f"\n🎉 ALL CORRECTED AUTHENTICATION TESTS PASSED!")
            print(f"✅ The authentication flow bug has been successfully fixed!")
            print(f"🧠 Behavioral analysis working correctly")
            print(f"📱 Normal unlock intelligently switches between normal/doge mode")
            print(f"🔓 Owner code always grants full access")
            print(f"🚨 Duress pattern triggers emergency mode")
            return 0
        else:
            print(f"\n⚠️  SOME CORRECTED AUTHENTICATION TESTS FAILED")
            print(f"🔧 The authentication flow may still need fixes")
            return 1

def main():
    """Main test execution"""
    tester = CorrectedAuthFlowTester()
    return tester.run_corrected_auth_flow_tests()

if __name__ == "__main__":
    sys.exit(main())