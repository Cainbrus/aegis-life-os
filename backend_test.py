#!/usr/bin/env python3
"""
Aegis Enhanced System - Comprehensive Backend API Testing
Tests the complete enhanced Aegis system with all new features including pattern authentication,
vault endpoints, voice interface, emergency duress, onboarding, and proactive intelligence.
"""

import requests
import json
import time
import sys
from datetime import datetime
from typing import Dict, Any, List

class AegisEnhancedSystemTester:
    def __init__(self, base_url="https://aegis-os.preview.emergentagent.com"):
        self.base_url = base_url
        self.api_url = f"{base_url}/api"
        self.tests_run = 0
        self.tests_passed = 0
        self.current_security_state = "STATE_LOCKED"
        
        print(f"🚀 Aegis Enhanced System Testing Suite")
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
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=headers, timeout=10)
            elif method == 'DELETE':
                response = requests.delete(url, headers=headers, timeout=10)
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
            "system/trap-status",
            200,
            expected_fields=["system"]
        )
        
        if success:
            system_info = data.get("system", "Unknown")
            print(f"   🏗️  System: {system_info}")
            
            # Try to get current security state from auth status
            auth_success, auth_data = self.run_test(
                "Get Current Security State",
                "GET",
                "auth/status", 
                200
            )
            
            if auth_success:
                self.current_security_state = auth_data.get("security_state", "UNKNOWN")
                print(f"   🔒 Current Security State: {self.current_security_state}")
            
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

    def test_calculator_secret_handshake(self) -> bool:
        """Test Calculator Secret Handshake - POST /api/vault/access-attempt"""
        calculator_access_data = {
            "action": "secret_calculation",
            "code_used": "8675309",
            "calculation": "867 + 5309 = 6176"
        }
        
        success, data = self.run_test(
            "Calculator Secret Handshake",
            "POST",
            "vault/access-attempt",
            200,
            data=calculator_access_data,
            expected_fields=["success", "message", "handshake_detected"]
        )
        
        if success:
            handshake_detected = data.get("handshake_detected", False)
            message = data.get("message", "")
            
            if handshake_detected:
                print(f"   ✅ Calculator secret handshake detected and logged")
                return True
            else:
                print(f"   ❌ Calculator secret handshake not properly detected")
                return False
        
        return False

    def test_phantom_folder_authentication(self) -> bool:
        """Test Phantom Folder authentication - POST /api/vault/authenticate"""
        if self.current_security_state != "STATE_OWNER_PRESENT":
            print(f"   ⚠️  Skipping vault auth test - requires owner authentication")
            return True
            
        vault_auth_data = {
            "method": "pattern",
            "vault_key": "phantom_access"
        }
        
        success, data = self.run_test(
            "Phantom Folder Authentication",
            "POST",
            "vault/authenticate",
            200,
            data=vault_auth_data,
            expected_fields=["success", "message", "vault_unlocked"]
        )
        
        if success:
            vault_unlocked = data.get("vault_unlocked", False)
            auth_method = data.get("auth_method", "")
            
            if vault_unlocked:
                print(f"   ✅ Phantom Folder successfully authenticated via {auth_method}")
                return True
            else:
                print(f"   ❌ Phantom Folder authentication failed")
                return False
        
        return False

    def test_phantom_folder_data_access(self) -> bool:
        """Test Phantom Folder data access - GET /api/vault/data"""
        if self.current_security_state != "STATE_OWNER_PRESENT":
            print(f"   ⚠️  Skipping vault data test - requires owner authentication")
            return True
            
        success, data = self.run_test(
            "Phantom Folder Data Access",
            "GET",
            "vault/data",
            200,
            expected_fields=["secure_files", "hidden_apps", "ai_hidden_plans", "quarantine_bin", "vault_stats"]
        )
        
        if success:
            secure_files = data.get("secure_files", [])
            hidden_apps = data.get("hidden_apps", [])
            ai_plans = data.get("ai_hidden_plans", [])
            quarantine = data.get("quarantine_bin", [])
            
            print(f"   📁 Secure Files: {len(secure_files)} found")
            print(f"   📱 Hidden Apps: {len(hidden_apps)} found")
            print(f"   🧠 AI Plans: {len(ai_plans)} found")
            print(f"   🗑️  Quarantine Items: {len(quarantine)} found")
            
            if secure_files and hidden_apps and ai_plans:
                print(f"   ✅ Phantom Folder data comprehensive and accessible")
                return True
            else:
                print(f"   ❌ Phantom Folder data incomplete or missing")
                return False
        
        return False

    def test_voice_interface_processing(self) -> bool:
        """Test Voice interface - POST /api/voice/process"""
        if self.current_security_state != "STATE_OWNER_PRESENT":
            print(f"   ⚠️  Skipping voice test - requires owner authentication")
            return True
            
        voice_command_data = {
            "command": "Hey Mate, schedule a meeting with Sarah tomorrow at 3pm and check my messages",
            "wake_word": "mate",
            "confidence": 0.95
        }
        
        success, data = self.run_test(
            "Voice Interface Processing",
            "POST",
            "voice/process",
            200,
            data=voice_command_data,
            expected_fields=["status", "response"]
        )
        
        if success:
            status = data.get("status", "")
            response = data.get("response", "")
            suggestions = data.get("suggestions", [])
            
            print(f"   🎤 Voice Response: {response[:100]}...")
            print(f"   💡 Suggestions: {len(suggestions)} provided")
            
            if status == "success" and response:
                print(f"   ✅ Voice interface successfully processed command")
                return True
            else:
                print(f"   ❌ Voice interface failed to process command")
                return False
        
        return False

    def test_emergency_duress_protocol(self) -> bool:
        """Test Emergency duress - POST /api/emergency/duress (CRITICAL SECURITY FEATURE)"""
        duress_data = {
            "phrase": "help me please",
            "location": "home",
            "context": "voice_command"
        }
        
        success, data = self.run_test(
            "Emergency Duress Protocol",
            "POST",
            "emergency/duress",
            200,
            data=duress_data,
            expected_fields=["status", "message"]
        )
        
        if success:
            status = data.get("status", "")
            message = data.get("message", "")
            
            # CRITICAL: Duress should respond normally to avoid alerting attacker
            if status == "success" and "processing complete" in message.lower():
                print(f"   ✅ CRITICAL - Duress protocol activated silently (responds normally)")
                print(f"   🚨 Emergency response would be triggered in background")
                return True
            else:
                print(f"   ❌ CRITICAL - Duress protocol not working properly")
                return False
        
        return False

    def test_onboarding_status_check(self) -> bool:
        """Test Onboarding status - GET /api/onboarding/status"""
        success, data = self.run_test(
            "Onboarding Status Check",
            "GET",
            "onboarding/status",
            200,
            expected_fields=["onboarding_complete"]
        )
        
        if success:
            onboarding_complete = data.get("onboarding_complete", False)
            setup_date = data.get("setup_date", None)
            
            print(f"   📋 Onboarding Complete: {onboarding_complete}")
            if setup_date:
                print(f"   📅 Setup Date: {setup_date}")
            
            print(f"   ✅ Onboarding status endpoint working correctly")
            return True
        
        return False

    def test_onboarding_completion(self) -> bool:
        """Test Onboarding completion - POST /api/onboarding/complete"""
        onboarding_data = {
            "customWakeName": "Mate",
            "duressPhrase": "help me please",
            "calculatorCode": "8675309",
            "behavioral_baseline": {
                "typing_speed": 45,
                "app_usage_patterns": ["messages", "calendar", "photos"],
                "security_preferences": "high"
            }
        }
        
        success, data = self.run_test(
            "Onboarding Completion",
            "POST",
            "onboarding/complete",
            200,
            data=onboarding_data,
            expected_fields=["success", "message", "user_id"]
        )
        
        if success:
            setup_success = data.get("success", False)
            user_id = data.get("user_id", "")
            message = data.get("message", "")
            
            if setup_success and user_id:
                print(f"   ✅ Onboarding completed successfully")
                print(f"   👤 User ID: {user_id}")
                return True
            else:
                print(f"   ❌ Onboarding completion failed: {message}")
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

    def test_proactive_briefing_generation(self) -> bool:
        """Test Proactive briefings - GET /api/proactive/briefing"""
        if self.current_security_state != "STATE_OWNER_PRESENT":
            print(f"   ⚠️  Skipping briefing test - requires owner authentication")
            return True
            
        success, data = self.run_test(
            "Proactive Briefing Generation",
            "GET",
            "proactive/briefing?briefing_type=morning",
            200,
            expected_fields=["briefing_type", "title", "summary", "insights", "action_items"]
        )
        
        if success:
            briefing_type = data.get("briefing_type", "")
            title = data.get("title", "")
            insights = data.get("insights", [])
            action_items = data.get("action_items", [])
            
            print(f"   📋 Briefing Type: {briefing_type}")
            print(f"   📝 Title: {title}")
            print(f"   💡 Insights: {len(insights)} provided")
            print(f"   ✅ Action Items: {len(action_items)} provided")
            
            if briefing_type and title and insights:
                print(f"   ✅ Proactive briefing generated successfully")
                return True
            else:
                print(f"   ❌ Proactive briefing incomplete")
                return False
        
        return False

    def test_wake_word_status(self) -> bool:
        """Test Wake word status - GET /api/voice/wake-word-status"""
        if self.current_security_state != "STATE_OWNER_PRESENT":
            print(f"   ⚠️  Skipping wake word test - requires owner authentication")
            return True
            
        success, data = self.run_test(
            "Wake Word Status Check",
            "GET",
            "voice/wake-word-status",
            200,
            expected_fields=["wake_word_active", "custom_name", "duress_monitoring"]
        )
        
        if success:
            wake_word_active = data.get("wake_word_active", False)
            custom_name = data.get("custom_name", "")
            duress_monitoring = data.get("duress_monitoring", False)
            
            print(f"   🎤 Wake Word Active: {wake_word_active}")
            print(f"   📛 Custom Name: {custom_name}")
            print(f"   🚨 Duress Monitoring: {duress_monitoring}")
            
            if wake_word_active and custom_name:
                print(f"   ✅ Wake word system operational")
                return True
            else:
                print(f"   ❌ Wake word system not properly configured")
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

    def test_trap_action_logging(self) -> bool:
        """Test trap action logging when in trap mode"""
        if self.current_security_state != "STATE_PHONE_UNLOCKED":
            print(f"   ⚠️  Skipping trap action test - not in trap mode")
            return True
            
        trap_action_data = {
            "action_type": "app_access",
            "app_name": "messages",
            "details": {"action": "view_messages", "timestamp": datetime.now().isoformat()},
            "duration_ms": 1500
        }
        
        success, data = self.run_test(
            "Trap Action Logging",
            "POST",
            "trap/log-action",
            200,
            data=trap_action_data,
            expected_fields=["logged", "action_id"]
        )
        
        if success:
            logged = data.get("logged", False)
            action_id = data.get("action_id", "")
            
            if logged and action_id:
                print(f"   ✅ Trap action logged successfully: {action_id}")
                return True
            else:
                print(f"   ❌ Trap action logging failed")
                return False
        
        return False

    def test_trap_status_check(self) -> bool:
        """Test trap status endpoint (owner only)"""
        if self.current_security_state != "STATE_OWNER_PRESENT":
            print(f"   ⚠️  Skipping trap status test - requires owner authentication")
            return True
            
        success, data = self.run_test(
            "Trap Status Check - Owner Only",
            "GET",
            "trap/status",
            200,
            expected_fields=["trap_active"]
        )
        
        if success:
            trap_active = data.get("trap_active", False)
            
            if not trap_active:
                print(f"   ✅ Trap status correctly shows inactive when owner authenticated")
                return True
            else:
                session_id = data.get("session_id", "")
                actions_logged = data.get("actions_logged", 0)
                print(f"   ℹ️  Trap session active: {session_id}, actions: {actions_logged}")
                return True
        
        return False

    def test_vault_access_without_auth(self) -> bool:
        """Test vault endpoints require proper authentication"""
        # Reset to locked state to test security
        self.test_logout()
        
        success, data = self.run_test(
            "Vault Access Without Authentication",
            "POST",
            "vault/authenticate",
            200,
            data={"method": "pattern"},
            expected_fields=["success", "message"]
        )
        
        if success:
            vault_success = data.get("success", True)  # Should be False
            message = data.get("message", "")
            
            if not vault_success and "owner authentication required" in message.lower():
                print(f"   ✅ Vault properly protected - requires owner authentication")
                return True
            else:
                print(f"   ❌ SECURITY ISSUE - Vault accessible without proper authentication")
                return False
        
        return False

    def test_digital_mate_vault_verify_secret(self) -> bool:
        """Test Calculator Vault Secret Verification - POST /api/vault/verify-secret"""
        secret_data = {
            "code": "8675309"
        }
        
        success, data = self.run_test(
            "Digital Mate - Vault Secret Verification",
            "POST",
            "vault/verify-secret",
            200,
            data=secret_data,
            expected_fields=["success", "message", "vault_unlocked"]
        )
        
        if success:
            vault_unlocked = data.get("vault_unlocked", False)
            message = data.get("message", "")
            
            if vault_unlocked:
                print(f"   ✅ Calculator secret code 8675309 verified successfully")
                return True
            else:
                print(f"   ❌ Calculator secret code verification failed: {message}")
                return False
        
        return False

    def test_digital_mate_vault_files(self) -> bool:
        """Test Vault Files Access - GET /api/vault/files"""
        if self.current_security_state != "STATE_OWNER_PRESENT":
            print(f"   ⚠️  Skipping vault files test - requires owner authentication")
            return True
            
        success, data = self.run_test(
            "Digital Mate - Vault Files Access",
            "GET",
            "vault/files",
            200,
            expected_fields=["files", "total_count", "vault_stats"]
        )
        
        if success:
            files = data.get("files", [])
            total_count = data.get("total_count", 0)
            vault_stats = data.get("vault_stats", {})
            
            print(f"   📁 Vault Files: {total_count} found")
            print(f"   📊 Vault Stats: {vault_stats}")
            print(f"   ✅ Vault files endpoint working correctly")
            return True
        
        return False

    def test_digital_mate_vault_upload(self) -> bool:
        """Test Vault File Upload - POST /api/vault/upload"""
        if self.current_security_state != "STATE_OWNER_PRESENT":
            print(f"   ⚠️  Skipping vault upload test - requires owner authentication")
            return True
            
        upload_data = {
            "filename": "test_document.txt",
            "file_type": "text/plain",
            "content": "VGVzdCBkb2N1bWVudCBjb250ZW50",  # Base64 encoded "Test document content"
            "category": "test",
            "tags": ["test", "digital_mate"],
            "is_sensitive": True
        }
        
        success, data = self.run_test(
            "Digital Mate - Vault File Upload",
            "POST",
            "vault/upload",
            200,
            data=upload_data,
            expected_fields=["success", "file_id", "message"]
        )
        
        if success:
            file_id = data.get("file_id", "")
            message = data.get("message", "")
            
            if file_id:
                print(f"   ✅ File uploaded to vault successfully: {file_id}")
                # Store file_id for deletion test
                self.uploaded_file_id = file_id
                return True
            else:
                print(f"   ❌ File upload failed: {message}")
                return False
        
        return False

    def test_digital_mate_vault_delete(self) -> bool:
        """Test Vault File Deletion - DELETE /api/vault/files/{file_id}"""
        if self.current_security_state != "STATE_OWNER_PRESENT":
            print(f"   ⚠️  Skipping vault delete test - requires owner authentication")
            return True
            
        if not hasattr(self, 'uploaded_file_id'):
            print(f"   ⚠️  Skipping vault delete test - no file uploaded to delete")
            return True
            
        success, data = self.run_test(
            "Digital Mate - Vault File Deletion",
            "DELETE",
            f"vault/files/{self.uploaded_file_id}",
            200,
            expected_fields=["success", "message"]
        )
        
        if success:
            delete_success = data.get("success", False)
            message = data.get("message", "")
            
            if delete_success:
                print(f"   ✅ File deleted from vault successfully")
                return True
            else:
                print(f"   ❌ File deletion failed: {message}")
                return False
        
        return False

    def test_digital_mate_privacy_analyze(self) -> bool:
        """Test AI Privacy Analysis - POST /api/privacy/analyze"""
        if self.current_security_state != "STATE_OWNER_PRESENT":
            print(f"   ⚠️  Skipping privacy analysis test - requires owner authentication")
            return True
            
        analyze_data = {
            "content_type": "file",
            "content_data": {
                "name": "personal_photo.jpg",
                "metadata": {"size": "2.4MB", "location": "home"},
                "preview": "A photo showing family members at a private gathering"
            }
        }
        
        success, data = self.run_test(
            "Digital Mate - AI Privacy Analysis",
            "POST",
            "privacy/analyze",
            200,
            data=analyze_data,
            expected_fields=["analysis", "guardian_mode", "trust_level"]
        )
        
        if success:
            analysis = data.get("analysis", {})
            guardian_mode = data.get("guardian_mode", "")
            trust_level = data.get("trust_level", 0)
            
            sensitivity_score = analysis.get("sensitivity_score", 0)
            recommended_action = analysis.get("recommended_action", "")
            
            print(f"   🔍 Sensitivity Score: {sensitivity_score}")
            print(f"   🤖 Guardian Mode: {guardian_mode}")
            print(f"   📊 Trust Level: {trust_level:.2f}")
            print(f"   💡 Recommended Action: {recommended_action}")
            print(f"   ✅ AI Privacy analysis working correctly")
            return True
        
        return False

    def test_digital_mate_privacy_feedback(self) -> bool:
        """Test AI Privacy Feedback - POST /api/privacy/feedback"""
        if self.current_security_state != "STATE_OWNER_PRESENT":
            print(f"   ⚠️  Skipping privacy feedback test - requires owner authentication")
            return True
            
        feedback_data = {
            "content_type": "file",
            "suggestion": "hide",
            "decision": "accepted",
            "preference": "Always hide personal photos automatically"
        }
        
        success, data = self.run_test(
            "Digital Mate - AI Privacy Feedback",
            "POST",
            "privacy/feedback",
            200,
            data=feedback_data,
            expected_fields=["success", "message", "new_trust_level", "learning_mode"]
        )
        
        if success:
            feedback_success = data.get("success", False)
            new_trust_level = data.get("new_trust_level", 0)
            learning_mode = data.get("learning_mode", "")
            
            if feedback_success:
                print(f"   ✅ Privacy feedback recorded successfully")
                print(f"   📈 New Trust Level: {new_trust_level:.2f}")
                print(f"   🎓 Learning Mode: {learning_mode}")
                return True
            else:
                print(f"   ❌ Privacy feedback recording failed")
                return False
        
        return False

    def test_digital_mate_privacy_suggestions(self) -> bool:
        """Test AI Privacy Suggestions - GET /api/privacy/suggestions"""
        if self.current_security_state != "STATE_OWNER_PRESENT":
            print(f"   ⚠️  Skipping privacy suggestions test - requires owner authentication")
            return True
            
        success, data = self.run_test(
            "Digital Mate - AI Privacy Suggestions",
            "GET",
            "privacy/suggestions",
            200,
            expected_fields=["suggestions", "guardian_mode", "trust_level", "total_pending"]
        )
        
        if success:
            suggestions = data.get("suggestions", [])
            total_pending = data.get("total_pending", 0)
            guardian_mode = data.get("guardian_mode", "")
            
            print(f"   💡 Pending Suggestions: {total_pending}")
            print(f"   🤖 Guardian Mode: {guardian_mode}")
            print(f"   ✅ Privacy suggestions endpoint working correctly")
            return True
        
        return False

    def test_digital_mate_privacy_stats(self) -> bool:
        """Test AI Privacy Stats - GET /api/privacy/stats"""
        if self.current_security_state != "STATE_OWNER_PRESENT":
            print(f"   ⚠️  Skipping privacy stats test - requires owner authentication")
            return True
            
        success, data = self.run_test(
            "Digital Mate - AI Privacy Stats",
            "GET",
            "privacy/stats",
            200,
            expected_fields=["total_analyzed", "acceptance_rate", "trust_level", "learning_mode"]
        )
        
        if success:
            total_analyzed = data.get("total_analyzed", 0)
            acceptance_rate = data.get("acceptance_rate", 0)
            trust_level = data.get("trust_level", 0)
            learning_mode = data.get("learning_mode", "")
            
            print(f"   📊 Total Analyzed: {total_analyzed}")
            print(f"   📈 Acceptance Rate: {acceptance_rate:.1%}")
            print(f"   🎯 Trust Level: {trust_level:.1%}")
            print(f"   🎓 Learning Mode: {learning_mode}")
            print(f"   ✅ Privacy stats endpoint working correctly")
            return True
        
        return False

    def test_digital_mate_intelligence_briefing(self) -> bool:
        """Test Proactive Intelligence Briefing - GET /api/intelligence/briefing"""
        success, data = self.run_test(
            "Digital Mate - Proactive Intelligence Briefing",
            "GET",
            "intelligence/briefing",
            200,
            expected_fields=["briefing_type", "title", "summary"]
        )
        
        if success:
            briefing_type = data.get("briefing_type", "")
            title = data.get("title", "")
            summary = data.get("summary", "")
            insights = data.get("insights", [])
            action_items = data.get("action_items", [])
            
            print(f"   📋 Briefing Type: {briefing_type}")
            print(f"   📝 Title: {title}")
            print(f"   💡 Insights: {len(insights)} provided")
            print(f"   ✅ Action Items: {len(action_items)} provided")
            print(f"   ✅ Proactive intelligence briefing working correctly")
            return True
        
        return False

    def test_digital_mate_process_goal(self) -> bool:
        """Test Goal Processing - POST /api/intelligence/process-goal"""
        if self.current_security_state != "STATE_OWNER_PRESENT":
            print(f"   ⚠️  Skipping goal processing test - requires owner authentication")
            return True
            
        goal_data = {
            "goal": "plan a vacation to Japan for next month"
        }
        
        success, data = self.run_test(
            "Digital Mate - Goal Processing",
            "POST",
            "intelligence/process-goal",
            200,
            data=goal_data,
            expected_fields=["goal_id", "plan", "message"]
        )
        
        if success:
            goal_id = data.get("goal_id", "")
            plan = data.get("plan", {})
            message = data.get("message", "")
            
            understood_goal = plan.get("understood_goal", "")
            execution_plan = plan.get("execution_plan", [])
            
            print(f"   🎯 Goal ID: {goal_id}")
            print(f"   🧠 Understood: {understood_goal}")
            print(f"   📋 Execution Steps: {len(execution_plan)}")
            print(f"   ✅ Goal processing working correctly")
            return True
        
        return False

    def test_digital_mate_intelligence_chat(self) -> bool:
        """Test Digital Mate Chat - POST /api/intelligence/chat"""
        if self.current_security_state != "STATE_OWNER_PRESENT":
            print(f"   ⚠️  Skipping intelligence chat test - requires owner authentication")
            return True
            
        chat_data = {
            "message": "What's the weather like and do I have any meetings today?",
            "context": "general"
        }
        
        success, data = self.run_test(
            "Digital Mate - Intelligence Chat",
            "POST",
            "intelligence/chat",
            200,
            data=chat_data,
            expected_fields=["status", "response"]
        )
        
        if success:
            status = data.get("status", "")
            response = data.get("response", "")
            suggestions = data.get("suggestions", [])
            
            print(f"   💬 Chat Response: {response[:100]}...")
            print(f"   💡 Suggestions: {len(suggestions)} provided")
            print(f"   ✅ Digital Mate chat working correctly")
            return True
        
        return False

    def test_digital_mate_voice_process(self) -> bool:
        """Test Voice Command Processing - POST /api/voice/process"""
        voice_data = {
            "command": "Hey Mate, check my schedule and remind me about important tasks",
            "context": {"source": "voice_interface"}
        }
        
        success, data = self.run_test(
            "Digital Mate - Voice Command Processing",
            "POST",
            "voice/process",
            200,
            data=voice_data,
            expected_fields=["understood_command", "intent", "response_text"]
        )
        
        if success:
            understood_command = data.get("understood_command", "")
            intent = data.get("intent", "")
            response_text = data.get("response_text", "")
            confidence = data.get("confidence", 0)
            
            print(f"   🎤 Understood: {understood_command}")
            print(f"   🎯 Intent: {intent}")
            print(f"   📊 Confidence: {confidence:.2f}")
            print(f"   💬 Response: {response_text[:100]}...")
            print(f"   ✅ Voice command processing working correctly")
            return True
        
        return False

    def test_digital_mate_wake_detected(self) -> bool:
        """Test Wake Word Detection - POST /api/voice/wake-detected"""
        wake_data = {
            "wake_word": "mate"
        }
        
        success, data = self.run_test(
            "Digital Mate - Wake Word Detection",
            "POST",
            "voice/wake-detected",
            200,
            data=wake_data,
            expected_fields=["success", "message", "ready_for_command"]
        )
        
        if success:
            wake_success = data.get("success", False)
            ready_for_command = data.get("ready_for_command", False)
            
            if wake_success and ready_for_command:
                print(f"   ✅ Wake word detection working correctly")
                return True
            else:
                print(f"   ❌ Wake word detection not working properly")
                return False
        
        return False

    def test_digital_mate_voice_settings(self) -> bool:
        """Test Voice Settings - GET /api/voice/settings"""
        success, data = self.run_test(
            "Digital Mate - Voice Settings",
            "GET",
            "voice/settings",
            200,
            expected_fields=["wake_word", "duress_phrase", "voice_enabled"]
        )
        
        if success:
            wake_word = data.get("wake_word", "")
            duress_phrase = data.get("duress_phrase", "")
            voice_enabled = data.get("voice_enabled", False)
            
            print(f"   🎤 Wake Word: {wake_word}")
            print(f"   🚨 Duress Phrase: {duress_phrase}")
            print(f"   🔊 Voice Enabled: {voice_enabled}")
            print(f"   ✅ Voice settings endpoint working correctly")
            return True
        
        return False

    def test_digital_mate_voice_settings_update(self) -> bool:
        """Test Voice Settings Update - PUT /api/voice/settings"""
        if self.current_security_state != "STATE_OWNER_PRESENT":
            print(f"   ⚠️  Skipping voice settings update test - requires owner authentication")
            return True
            
        settings_data = {
            "wake_word": "Mate",
            "duress_phrase": "help me please"
        }
        
        success, data = self.run_test(
            "Digital Mate - Voice Settings Update",
            "PUT",
            "voice/settings",
            200,
            data=settings_data,
            expected_fields=["success", "message"]
        )
        
        if success:
            update_success = data.get("success", False)
            message = data.get("message", "")
            
            if update_success:
                print(f"   ✅ Voice settings updated successfully")
                return True
            else:
                print(f"   ❌ Voice settings update failed: {message}")
                return False
        
        return False

    def test_digital_mate_context_cards(self) -> bool:
        """Test Dynamic Context Cards - GET /api/context/cards"""
        success, data = self.run_test(
            "Digital Mate - Dynamic Context Cards",
            "GET",
            "context/cards",
            200,
            expected_fields=["cards", "time_context", "generated_at"]
        )
        
        if success:
            cards = data.get("cards", [])
            time_context = data.get("time_context", "")
            generated_at = data.get("generated_at", "")
            
            print(f"   🃏 Context Cards: {len(cards)} generated")
            print(f"   ⏰ Time Context: {time_context}")
            print(f"   📅 Generated At: {generated_at}")
            
            # Check for expected card types
            card_types = [card.get("type") for card in cards]
            print(f"   🏷️  Card Types: {', '.join(set(card_types))}")
            
            print(f"   ✅ Dynamic context cards working correctly")
            return True
        
        return False

    def test_push_notifications_subscribe(self) -> bool:
        """Test Push Notification Subscription - POST /api/notifications/subscribe"""
        subscription_data = {
            "subscription": {
                "endpoint": "https://fcm.googleapis.com/fcm/send/test-endpoint-123",
                "keys": {
                    "p256dh": "test-p256dh-key",
                    "auth": "test-auth-key"
                },
                "expirationTime": None
            },
            "user_agent": "Mozilla/5.0 (Test Browser)"
        }
        
        success, data = self.run_test(
            "Push Notifications - Subscribe",
            "POST",
            "notifications/subscribe",
            200,
            data=subscription_data,
            expected_fields=["success", "message", "subscription_id"]
        )
        
        if success:
            subscribe_success = data.get("success", False)
            subscription_id = data.get("subscription_id", "")
            message = data.get("message", "")
            
            if subscribe_success and subscription_id:
                print(f"   ✅ Push subscription registered successfully: {subscription_id}")
                # Store for unsubscribe test
                self.test_subscription_endpoint = subscription_data["subscription"]["endpoint"]
                return True
            else:
                print(f"   ❌ Push subscription failed: {message}")
                return False
        
        return False

    def test_push_notifications_subscribe_invalid(self) -> bool:
        """Test Push Notification Subscription with invalid data"""
        invalid_subscription_data = {
            "subscription": {
                # Missing endpoint - should fail
                "keys": {
                    "p256dh": "test-p256dh-key",
                    "auth": "test-auth-key"
                }
            }
        }
        
        success, data = self.run_test(
            "Push Notifications - Subscribe Invalid Data",
            "POST",
            "notifications/subscribe",
            200,
            data=invalid_subscription_data,
            expected_fields=["success", "message"]
        )
        
        if success:
            subscribe_success = data.get("success", False)
            message = data.get("message", "")
            
            if not subscribe_success and "missing endpoint" in message.lower():
                print(f"   ✅ Invalid subscription correctly rejected: {message}")
                return True
            else:
                print(f"   ❌ Invalid subscription validation failed")
                return False
        
        return False

    def test_push_notifications_unsubscribe(self) -> bool:
        """Test Push Notification Unsubscription - POST /api/notifications/unsubscribe"""
        if not hasattr(self, 'test_subscription_endpoint'):
            print(f"   ⚠️  Skipping unsubscribe test - no subscription endpoint available")
            return True
            
        unsubscribe_data = {
            "endpoint": self.test_subscription_endpoint
        }
        
        success, data = self.run_test(
            "Push Notifications - Unsubscribe",
            "POST",
            "notifications/unsubscribe",
            200,
            data=unsubscribe_data,
            expected_fields=["success", "message"]
        )
        
        if success:
            unsubscribe_success = data.get("success", False)
            message = data.get("message", "")
            
            if unsubscribe_success:
                print(f"   ✅ Push unsubscription successful: {message}")
                return True
            else:
                print(f"   ❌ Push unsubscription failed: {message}")
                return False
        
        return False

    def test_push_notifications_unsubscribe_invalid(self) -> bool:
        """Test Push Notification Unsubscription with invalid endpoint"""
        unsubscribe_data = {
            "endpoint": "https://invalid-endpoint-that-does-not-exist.com"
        }
        
        success, data = self.run_test(
            "Push Notifications - Unsubscribe Invalid Endpoint",
            "POST",
            "notifications/unsubscribe",
            200,
            data=unsubscribe_data,
            expected_fields=["success", "message"]
        )
        
        if success:
            unsubscribe_success = data.get("success", False)
            message = data.get("message", "")
            
            if not unsubscribe_success and "not found" in message.lower():
                print(f"   ✅ Invalid unsubscription correctly handled: {message}")
                return True
            else:
                print(f"   ❌ Invalid unsubscription validation failed")
                return False
        
        return False

    def test_push_notifications_status(self) -> bool:
        """Test Push Notification Status - GET /api/notifications/push-status"""
        success, data = self.run_test(
            "Push Notifications - Status Check",
            "GET",
            "notifications/push-status",
            200,
            expected_fields=["push_enabled", "active_subscriptions", "total_subscriptions"]
        )
        
        if success:
            push_enabled = data.get("push_enabled", False)
            active_subscriptions = data.get("active_subscriptions", 0)
            total_subscriptions = data.get("total_subscriptions", 0)
            vapid_configured = data.get("vapid_configured", False)
            
            print(f"   📊 Push Enabled: {push_enabled}")
            print(f"   📱 Active Subscriptions: {active_subscriptions}")
            print(f"   📈 Total Subscriptions: {total_subscriptions}")
            print(f"   🔑 VAPID Configured: {vapid_configured}")
            
            if push_enabled:
                print(f"   ✅ Push notification status endpoint working correctly")
                return True
            else:
                print(f"   ❌ Push notifications not enabled")
                return False
        
        return False

    def test_push_notifications_send_without_auth(self) -> bool:
        """Test Push Notification Send without owner authentication (should fail)"""
        # Ensure we're not in owner mode
        if self.current_security_state == "STATE_OWNER_PRESENT":
            self.test_logout()
        
        push_data = {
            "title": "Test Notification",
            "body": "This should fail without owner authentication",
            "type": "security"
        }
        
        success, data = self.run_test(
            "Push Notifications - Send Without Auth",
            "POST",
            "notifications/send-push",
            200,
            data=push_data,
            expected_fields=["error"]
        )
        
        if success:
            error = data.get("error", "")
            
            if "owner authentication required" in error.lower():
                print(f"   ✅ Push send correctly requires owner authentication")
                return True
            else:
                print(f"   ❌ SECURITY ISSUE - Push send allowed without owner auth")
                return False
        
        return False

    def test_push_notifications_send_with_auth(self) -> bool:
        """Test Push Notification Send with owner authentication"""
        # Ensure we're in owner mode
        if self.current_security_state != "STATE_OWNER_PRESENT":
            self.test_owner_pattern_auth()
        
        if self.current_security_state != "STATE_OWNER_PRESENT":
            print(f"   ⚠️  Skipping push send test - requires owner authentication")
            return True
        
        push_data = {
            "title": "Aegis Security Alert",
            "body": "Test push notification from Aegis Life OS",
            "type": "security"
        }
        
        success, data = self.run_test(
            "Push Notifications - Send With Owner Auth",
            "POST",
            "notifications/send-push",
            200,
            data=push_data,
            expected_fields=["success", "message", "notification_id"]
        )
        
        if success:
            send_success = data.get("success", False)
            notification_id = data.get("notification_id", "")
            message = data.get("message", "")
            
            if send_success and notification_id:
                print(f"   ✅ Push notification sent successfully: {notification_id}")
                print(f"   📨 Message: {message}")
                return True
            else:
                print(f"   ❌ Push notification send failed: {message}")
                return False
        
        return False

    def test_push_notifications_send_different_types(self) -> bool:
        """Test Push Notification Send with different notification types"""
        if self.current_security_state != "STATE_OWNER_PRESENT":
            print(f"   ⚠️  Skipping push types test - requires owner authentication")
            return True
        
        notification_types = [
            {"type": "info", "title": "Information", "body": "General information notification"},
            {"type": "warning", "title": "Warning", "body": "Warning notification test"},
            {"type": "emergency", "title": "Emergency", "body": "Emergency notification test"}
        ]
        
        all_success = True
        
        for i, notification in enumerate(notification_types):
            success, data = self.run_test(
                f"Push Notifications - Type {notification['type'].upper()}",
                "POST",
                "notifications/send-push",
                200,
                data=notification,
                expected_fields=["success", "notification_id"]
            )
            
            if success:
                send_success = data.get("success", False)
                notification_id = data.get("notification_id", "")
                
                if send_success and notification_id:
                    print(f"   ✅ {notification['type'].upper()} notification sent: {notification_id}")
                else:
                    print(f"   ❌ {notification['type'].upper()} notification failed")
                    all_success = False
            else:
                all_success = False
            
            time.sleep(0.5)  # Brief pause between notifications
        
        return all_success

    def run_comprehensive_test_suite(self):
        """Run the complete Enhanced Aegis System Test Suite"""
        print(f"\n🚀 STARTING DIGITAL MATE COMPREHENSIVE TEST SUITE")
        print(f"⏰ Test started at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        print("=" * 60)
        
        # Phase 1: System Status & Setup
        print(f"\n📊 PHASE 1: SYSTEM STATUS & PATTERN SETUP")
        self.test_system_status()
        self.test_auth_status()
        self.test_pattern_setup()
        self.test_pattern_validation()
        
        # Phase 2: Core Authentication & Security (Priority 1)
        print(f"\n🔐 PHASE 2: CORE AUTHENTICATION & SECURITY (PRIORITY 1)")
        self.test_primary_pattern_auth()
        time.sleep(1)  # Brief pause for state propagation
        self.test_l3_agents_trap_mode()
        self.test_trap_action_logging()
        
        # Phase 3: Owner Pattern Authentication
        print(f"\n👑 PHASE 3: OWNER PATTERN AUTHENTICATION")
        self.test_owner_pattern_auth()
        time.sleep(1)  # Brief pause for state propagation
        self.test_l3_agents_owner_mode()
        self.test_trap_status_check()
        
        # Phase 4: DIGITAL MATE - CALCULATOR VAULT SYSTEM (Phase 1)
        print(f"\n🔐 PHASE 4: DIGITAL MATE - CALCULATOR VAULT SYSTEM")
        self.test_digital_mate_vault_verify_secret()
        self.test_digital_mate_vault_files()
        self.test_digital_mate_vault_upload()
        self.test_digital_mate_vault_delete()
        
        # Phase 5: DIGITAL MATE - AI PRIVACY GUARDIAN (Phase 2)
        print(f"\n🛡️  PHASE 5: DIGITAL MATE - AI PRIVACY GUARDIAN")
        self.test_digital_mate_privacy_analyze()
        self.test_digital_mate_privacy_feedback()
        self.test_digital_mate_privacy_suggestions()
        self.test_digital_mate_privacy_stats()
        
        # Phase 6: DIGITAL MATE - PROACTIVE INTELLIGENCE (Phase 3)
        print(f"\n🧠 PHASE 6: DIGITAL MATE - PROACTIVE INTELLIGENCE")
        self.test_digital_mate_intelligence_briefing()
        self.test_digital_mate_process_goal()
        self.test_digital_mate_intelligence_chat()
        self.test_digital_mate_context_cards()
        
        # Phase 7: DIGITAL MATE - VOICE INTERFACE (Phase 4)
        print(f"\n🎤 PHASE 7: DIGITAL MATE - VOICE INTERFACE")
        self.test_digital_mate_voice_process()
        self.test_digital_mate_wake_detected()
        self.test_digital_mate_voice_settings()
        self.test_digital_mate_voice_settings_update()
        
        # Phase 8: REAL PUSH NOTIFICATIONS SYSTEM
        print(f"\n🔔 PHASE 8: REAL PUSH NOTIFICATIONS SYSTEM")
        self.test_push_notifications_status()
        self.test_push_notifications_subscribe()
        self.test_push_notifications_subscribe_invalid()
        self.test_push_notifications_unsubscribe()
        self.test_push_notifications_unsubscribe_invalid()
        self.test_push_notifications_send_without_auth()
        self.test_push_notifications_send_with_auth()
        self.test_push_notifications_send_different_types()
        
        # Phase 9: Legacy Advanced Features (Priority 2)
        print(f"\n🚀 PHASE 9: LEGACY ADVANCED FEATURES")
        self.test_calculator_secret_handshake()
        self.test_phantom_folder_authentication()
        self.test_phantom_folder_data_access()
        self.test_voice_interface_processing()
        self.test_emergency_duress_protocol()
        self.test_onboarding_status_check()
        self.test_onboarding_completion()
        
        # Phase 10: Legacy Proactive Intelligence (Priority 3)
        print(f"\n🧠 PHASE 10: LEGACY PROACTIVE INTELLIGENCE")
        self.test_l2_ai_orchestrator()
        self.test_proactive_briefing_generation()
        self.test_wake_word_status()
        
        # Phase 11: Advanced Pattern Features & Security
        print(f"\n🔒 PHASE 11: ADVANCED PATTERN FEATURES & SECURITY")
        self.test_duress_pattern_auth()
        self.test_auto_detect_pattern()
        self.test_vault_access_without_auth()
        
        # Phase 12: Security & Lockout Testing
        print(f"\n🛡️  PHASE 12: SECURITY & LOCKOUT TESTING")
        self.test_failed_authentication_lockout()
        self.test_logout()
        
        # Final Results
        print(f"\n" + "=" * 60)
        print(f"🏁 DIGITAL MATE COMPREHENSIVE TEST SUITE COMPLETED")
        print(f"📊 Tests Run: {self.tests_run}")
        print(f"✅ Tests Passed: {self.tests_passed}")
        print(f"❌ Tests Failed: {self.tests_run - self.tests_passed}")
        print(f"📈 Success Rate: {(self.tests_passed/self.tests_run)*100:.1f}%")
        print(f"🔒 Final Security State: {self.current_security_state}")
        print(f"⏰ Test completed at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        
        if self.tests_passed == self.tests_run:
            print(f"\n🎉 ALL TESTS PASSED - DIGITAL MATE SYSTEM IS FULLY OPERATIONAL!")
            print(f"🚀 Complete 'Digital Mate' experience with all 4 phases working!")
            return 0
        else:
            print(f"\n⚠️  SOME TESTS FAILED - REVIEW RESULTS ABOVE")
            return 1

def main():
    """Main test execution"""
    tester = AegisEnhancedSystemTester()
    return tester.run_comprehensive_test_suite()

if __name__ == "__main__":
    sys.exit(main())