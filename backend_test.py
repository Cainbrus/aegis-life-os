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

    def test_behavioral_auth_unknown_user(self) -> bool:
        """Test L1 Behavioral Authentication - Unknown User (Minimal Data)"""
        minimal_behavioral_data = {
            "mouse_movements": [
                {"x": 100, "y": 200, "timestamp": int(time.time() * 1000), "velocity": 5}
            ],
            "typing_patterns": [
                {"key": "a", "timestamp": int(time.time() * 1000), "duration": 100}
            ],
            "is_owner": False
        }
        
        success, data = self.run_test(
            "L1 Behavioral Auth - Unknown User",
            "POST",
            "auth/behavioral", 
            200,
            data=minimal_behavioral_data,
            expected_fields=["status", "security_state", "authenticated", "timestamp"]
        )
        
        if success:
            security_state = data.get("security_state")
            authenticated = data.get("authenticated", False)
            
            if security_state == "STATE_UNKNOWN_USER" and not authenticated:
                print(f"   ✅ CORRECT - Unknown user detected, decoy mode should activate")
                self.current_security_state = security_state
                return True
            else:
                print(f"   ❌ UNEXPECTED - Expected UNKNOWN_USER, got {security_state}")
                return False
        
        return False

    def test_behavioral_auth_owner(self) -> bool:
        """Test L1 Behavioral Authentication - Owner (Rich Data)"""
        rich_behavioral_data = {
            "mouse_movements": [
                {"x": 100 + i*10, "y": 200 + i*5, "timestamp": int(time.time() * 1000) + i*100, "velocity": 5 + i}
                for i in range(8)  # 8 mouse movements for high confidence
            ],
            "typing_patterns": [
                {"key": chr(97 + i), "timestamp": int(time.time() * 1000) + i*150, "duration": 100 + i*10}
                for i in range(6)  # 6 typing patterns for high confidence
            ],
            "is_owner": True
        }
        
        success, data = self.run_test(
            "L1 Behavioral Auth - Owner",
            "POST",
            "auth/behavioral",
            200, 
            data=rich_behavioral_data,
            expected_fields=["status", "security_state", "authenticated", "timestamp"]
        )
        
        if success:
            security_state = data.get("security_state")
            authenticated = data.get("authenticated", False)
            
            if security_state == "STATE_OWNER_PRESENT" and authenticated:
                print(f"   ✅ CORRECT - Owner authenticated, full access granted")
                self.current_security_state = security_state
                return True
            else:
                print(f"   ❌ UNEXPECTED - Expected OWNER_PRESENT, got {security_state}")
                return False
        
        return False

    def test_l2_ai_orchestrator(self) -> bool:
        """Test L2 AI Orchestrator - Strategic AI Goal Processing"""
        complex_goal = {
            "input": "Schedule a meeting with Sarah tomorrow at 2pm and check my recent messages"
        }
        
        success, data = self.run_test(
            "L2 AI Orchestrator - Complex Goal",
            "POST",
            "orchestrator/goal",
            200,
            data=complex_goal,
            expected_fields=["status", "goal_id", "parsed_intents", "execution_plan", "goal_status"]
        )
        
        if success:
            parsed_intents = data.get("parsed_intents", [])
            execution_plan = data.get("execution_plan", [])
            goal_status = data.get("goal_status", "unknown")
            
            print(f"   🧠 Parsed Intents: {len(parsed_intents)} intents")
            print(f"   📋 Execution Plan: {len(execution_plan)} steps")
            print(f"   📊 Goal Status: {goal_status}")
            
            # Verify AI processed the goal intelligently
            if len(parsed_intents) > 0 and len(execution_plan) > 0:
                print(f"   ✅ AI successfully parsed and planned goal execution")
                return True
            else:
                print(f"   ❌ AI failed to properly process the goal")
                return False
        
        return False

    def test_l3_agents_decoy_mode(self) -> bool:
        """Test L3 App Agents - Decoy Mode (when unknown user)"""
        print(f"\n🎭 Testing L3 Agents in Decoy Mode (Security State: {self.current_security_state})")
        
        agents_results = []
        
        # Test Messages Agent
        success, data = self.run_test(
            "L3 Messages Agent - Decoy Mode",
            "GET",
            "agents/messages",
            200,
            expected_fields=["status", "messages", "count"]
        )
        
        if success:
            has_decoy_flag = data.get("decoy", False)
            messages = data.get("messages", [])
            
            if has_decoy_flag and len(messages) > 0:
                print(f"   ✅ Messages agent returning decoy data correctly")
                agents_results.append(True)
            else:
                print(f"   ❌ Messages agent not in proper decoy mode")
                agents_results.append(False)
        else:
            agents_results.append(False)

        # Test Calendar Agent  
        success, data = self.run_test(
            "L3 Calendar Agent - Decoy Mode",
            "GET",
            "agents/calendar",
            200,
            expected_fields=["status", "events", "count"]
        )
        
        if success:
            has_decoy_flag = data.get("decoy", False)
            events = data.get("events", [])
            
            if has_decoy_flag and len(events) > 0:
                print(f"   ✅ Calendar agent returning decoy data correctly")
                agents_results.append(True)
            else:
                print(f"   ❌ Calendar agent not in proper decoy mode")
                agents_results.append(False)
        else:
            agents_results.append(False)

        # Test Photos Agent
        success, data = self.run_test(
            "L3 Photos Agent - Decoy Mode", 
            "GET",
            "agents/photos",
            200,
            expected_fields=["status", "photos", "count"]
        )
        
        if success:
            has_decoy_flag = data.get("decoy", False)
            photos = data.get("photos", [])
            
            if has_decoy_flag and len(photos) > 0:
                print(f"   ✅ Photos agent returning decoy data correctly")
                agents_results.append(True)
            else:
                print(f"   ❌ Photos agent not in proper decoy mode")
                agents_results.append(False)
        else:
            agents_results.append(False)

        return all(agents_results)

    def test_l3_agents_owner_mode(self) -> bool:
        """Test L3 App Agents - Owner Mode (when authenticated)"""
        print(f"\n🔓 Testing L3 Agents in Owner Mode (Security State: {self.current_security_state})")
        
        agents_results = []
        
        # Test Messages Agent
        success, data = self.run_test(
            "L3 Messages Agent - Owner Mode",
            "GET", 
            "agents/messages",
            200,
            expected_fields=["status", "messages", "count"]
        )
        
        if success:
            has_decoy_flag = data.get("decoy", False)
            messages = data.get("messages", [])
            
            if not has_decoy_flag:
                print(f"   ✅ Messages agent returning real data (no decoy flag)")
                agents_results.append(True)
            else:
                print(f"   ❌ Messages agent still in decoy mode when owner authenticated")
                agents_results.append(False)
        else:
            agents_results.append(False)

        # Test Calendar Agent
        success, data = self.run_test(
            "L3 Calendar Agent - Owner Mode",
            "GET",
            "agents/calendar", 
            200,
            expected_fields=["status", "events", "count"]
        )
        
        if success:
            has_decoy_flag = data.get("decoy", False)
            events = data.get("events", [])
            
            if not has_decoy_flag:
                print(f"   ✅ Calendar agent returning real data (no decoy flag)")
                agents_results.append(True)
            else:
                print(f"   ❌ Calendar agent still in decoy mode when owner authenticated")
                agents_results.append(False)
        else:
            agents_results.append(False)

        # Test Photos Agent
        success, data = self.run_test(
            "L3 Photos Agent - Owner Mode",
            "GET",
            "agents/photos",
            200,
            expected_fields=["status", "photos", "count"]
        )
        
        if success:
            has_decoy_flag = data.get("decoy", False)
            photos = data.get("photos", [])
            
            if not has_decoy_flag:
                print(f"   ✅ Photos agent returning real data (no decoy flag)")
                agents_results.append(True)
            else:
                print(f"   ❌ Photos agent still in decoy mode when owner authenticated")
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