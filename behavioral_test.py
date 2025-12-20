#!/usr/bin/env python3
"""
Behavioral Analysis Testing - Force different behavioral scenarios
"""

import requests
import json
import time
import sys
from datetime import datetime

class BehavioralAnalysisTester:
    def __init__(self, base_url="https://life-os-aegis.preview.emergentagent.com"):
        self.base_url = base_url
        self.api_url = f"{base_url}/api"
        self.tests_run = 0
        self.tests_passed = 0
        
        print(f"🧠 Behavioral Analysis Testing Suite")
        print(f"📡 Testing against: {self.base_url}")
        print("=" * 60)

    def run_test(self, name: str, method: str, endpoint: str, expected_status: int, data=None):
        """Run a single API test"""
        url = f"{self.api_url}/{endpoint}"
        headers = {'Content-Type': 'application/json'}
        
        self.tests_run += 1
        print(f"\n🔍 Test {self.tests_run}: {name}")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=headers, timeout=10)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=headers, timeout=10)
            
            print(f"   📊 Status: {response.status_code}")
            
            if response.status_code == expected_status:
                response_data = response.json()
                print(f"   ✅ SUCCESS")
                self.tests_passed += 1
                return True, response_data
            else:
                print(f"   ❌ FAILED - Expected {expected_status}, got {response.status_code}")
                return False, {}
                
        except Exception as e:
            print(f"   ❌ FAILED - Error: {str(e)}")
            return False, {}

    def test_multiple_normal_unlocks(self):
        """Test multiple normal pattern unlocks to see behavioral variation"""
        print(f"\n🧠 Testing Multiple Normal Pattern Unlocks for Behavioral Variation")
        
        results = []
        
        for i in range(10):
            # Logout first
            self.run_test(f"Logout #{i+1}", "POST", "auth/logout", 200)
            
            # Try normal pattern
            pattern_data = {
                "pattern": "1-2-3-6-9",
                "pattern_type": "auto_detect"
            }
            
            success, data = self.run_test(
                f"Normal Pattern Unlock #{i+1}",
                "POST",
                "auth/pattern",
                200,
                data=pattern_data
            )
            
            if success:
                mode = data.get("mode", "unknown")
                confidence = data.get("behavioral_confidence", 0)
                trap_mode = data.get("trap_mode", False)
                
                print(f"   🧠 Confidence: {confidence:.3f}")
                print(f"   📱 Mode: {mode}")
                print(f"   🎭 Trap Mode: {trap_mode}")
                
                results.append({
                    "attempt": i+1,
                    "confidence": confidence,
                    "mode": mode,
                    "trap_mode": trap_mode
                })
            
            time.sleep(0.5)
        
        # Analyze results
        print(f"\n📊 BEHAVIORAL ANALYSIS RESULTS:")
        normal_modes = sum(1 for r in results if r["mode"] == "normal_phone")
        doge_modes = sum(1 for r in results if r["mode"] == "doge_mode")
        avg_confidence = sum(r["confidence"] for r in results) / len(results) if results else 0
        
        print(f"   📱 Normal Phone Mode: {normal_modes}/10")
        print(f"   😎 Doge Mode: {doge_modes}/10")
        print(f"   🧠 Average Confidence: {avg_confidence:.3f}")
        
        # Check if we got any variation
        if doge_modes > 0:
            print(f"   ✅ GOOD - Behavioral analysis shows variation (some doge mode activations)")
            return True
        elif normal_modes == 10 and avg_confidence > 0.7:
            print(f"   ⚠️  NOTICE - All unlocks resulted in normal mode (high confidence)")
            print(f"   💡 This suggests behavioral trust score is consistently high")
            return True
        else:
            print(f"   ❌ UNEXPECTED - Inconsistent behavioral analysis results")
            return False

    def test_owner_code_override(self):
        """Test that owner code always works regardless of behavioral state"""
        print(f"\n🔓 Testing Owner Code Override")
        
        # Try owner code multiple times
        for i in range(3):
            owner_data = {
                "pattern": "1-5-9-8-7",
                "pattern_type": "owner_pattern"
            }
            
            success, data = self.run_test(
                f"Owner Code Test #{i+1}",
                "POST",
                "auth/pattern",
                200,
                data=owner_data
            )
            
            if success:
                mode = data.get("mode", "unknown")
                security_state = data.get("security_state", "unknown")
                proactive_mode = data.get("proactive_mode", False)
                
                print(f"   📱 Mode: {mode}")
                print(f"   🔒 Security State: {security_state}")
                print(f"   🚀 Proactive Mode: {proactive_mode}")
                
                if (mode == "owner_mode" and 
                    security_state == "STATE_OWNER_PRESENT" and 
                    proactive_mode == True):
                    print(f"   ✅ Owner code working correctly")
                else:
                    print(f"   ❌ Owner code not working properly")
                    return False
            else:
                return False
            
            time.sleep(0.5)
        
        return True

    def test_duress_pattern_consistency(self):
        """Test duress pattern consistency"""
        print(f"\n🚨 Testing Duress Pattern Consistency")
        
        for i in range(3):
            # Logout first
            self.run_test(f"Logout for Duress #{i+1}", "POST", "auth/logout", 200)
            
            duress_data = {
                "pattern": "2-5-8",
                "pattern_type": "duress_pattern"
            }
            
            success, data = self.run_test(
                f"Duress Pattern Test #{i+1}",
                "POST",
                "auth/pattern",
                200,
                data=duress_data
            )
            
            if success:
                trap_mode = data.get("trap_mode", False)
                security_state = data.get("security_state", "unknown")
                full_access = data.get("full_access", False)
                
                print(f"   🎭 Trap Mode: {trap_mode}")
                print(f"   🔒 Security State: {security_state}")
                print(f"   📱 Full Access: {full_access}")
                
                if (trap_mode == True and 
                    security_state == "STATE_PHONE_UNLOCKED" and 
                    full_access == True):
                    print(f"   ✅ Duress pattern working correctly")
                else:
                    print(f"   ❌ Duress pattern not working properly")
                    return False
            else:
                return False
            
            time.sleep(0.5)
        
        return True

    def test_data_mode_switching(self):
        """Test that data mode switches correctly between trap and real data"""
        print(f"\n📊 Testing Data Mode Switching")
        
        # Test 1: Get into trap mode (via duress or normal unlock)
        self.run_test("Logout", "POST", "auth/logout", 200)
        
        duress_data = {
            "pattern": "2-5-8",
            "pattern_type": "duress_pattern"
        }
        
        success, data = self.run_test(
            "Enter Trap Mode (Duress)",
            "POST",
            "auth/pattern",
            200,
            data=duress_data
        )
        
        if success:
            # Test app data in trap mode
            success, app_data = self.run_test(
                "Get App Data in Trap Mode",
                "GET",
                "apps/messages/data",
                200
            )
            
            if success:
                data_type = app_data.get("data_type", "")
                trap_active = app_data.get("trap_active", False)
                
                print(f"   📊 Data Type: {data_type}")
                print(f"   🎭 Trap Active: {trap_active}")
                
                if data_type == "trap_decoy" and trap_active:
                    print(f"   ✅ Trap mode serving fake data correctly")
                else:
                    print(f"   ❌ Trap mode not serving fake data")
                    return False
        
        # Test 2: Switch to owner mode
        owner_data = {
            "pattern": "1-5-9-8-7",
            "pattern_type": "owner_pattern"
        }
        
        success, data = self.run_test(
            "Switch to Owner Mode",
            "POST",
            "auth/pattern",
            200,
            data=owner_data
        )
        
        if success:
            # Test app data in owner mode
            success, app_data = self.run_test(
                "Get App Data in Owner Mode",
                "GET",
                "apps/messages/data",
                200
            )
            
            if success:
                data_type = app_data.get("data_type", "")
                trap_active = app_data.get("trap_active", False)
                
                print(f"   📊 Data Type: {data_type}")
                print(f"   🎭 Trap Active: {trap_active}")
                
                if data_type == "real_data" and not trap_active:
                    print(f"   ✅ Owner mode serving real data correctly")
                    return True
                else:
                    print(f"   ❌ Owner mode not serving real data")
                    return False
        
        return False

    def run_behavioral_tests(self):
        """Run all behavioral analysis tests"""
        print(f"\n🚀 STARTING BEHAVIORAL ANALYSIS TESTS")
        print(f"⏰ Test started at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        print("=" * 60)
        
        # Setup patterns first
        pattern_config = {
            "normal_pattern": "1-2-3-6-9",
            "owner_code": "1-5-9-8-7",
            "duress_pattern": "2-5-8"
        }
        
        self.run_test("Setup Patterns", "POST", "auth/setup-dual-patterns", 200, data=pattern_config)
        
        # Run tests
        test_results = []
        test_results.append(self.test_multiple_normal_unlocks())
        test_results.append(self.test_owner_code_override())
        test_results.append(self.test_duress_pattern_consistency())
        test_results.append(self.test_data_mode_switching())
        
        # Final Results
        print(f"\n" + "=" * 60)
        print(f"🏁 BEHAVIORAL ANALYSIS TESTS COMPLETED")
        print(f"📊 Tests Run: {self.tests_run}")
        print(f"✅ Tests Passed: {self.tests_passed}")
        print(f"❌ Tests Failed: {self.tests_run - self.tests_passed}")
        print(f"📈 Success Rate: {(self.tests_passed/self.tests_run)*100:.1f}%")
        
        passed_major_tests = sum(test_results)
        total_major_tests = len(test_results)
        
        print(f"🎯 Major Test Categories Passed: {passed_major_tests}/{total_major_tests}")
        
        if passed_major_tests == total_major_tests:
            print(f"\n🎉 ALL BEHAVIORAL TESTS PASSED!")
            print(f"✅ Authentication system working correctly")
            return 0
        else:
            print(f"\n⚠️  SOME BEHAVIORAL TESTS FAILED")
            return 1

def main():
    """Main test execution"""
    tester = BehavioralAnalysisTester()
    return tester.run_behavioral_tests()

if __name__ == "__main__":
    sys.exit(main())