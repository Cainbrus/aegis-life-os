from fastapi import FastAPI, APIRouter, HTTPException, BackgroundTasks, Request
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
import json
import asyncio
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List, Dict, Any, Optional
from datetime import datetime, timedelta
import uuid
import hashlib
import secrets
import math
import statistics
from enum import Enum
import base64

# Aegis HPI OS Core Imports
from emergentintegrations.llm.chat import LlmChat, UserMessage

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Create the main app
app = FastAPI(title="Aegis Life OS", description="The Complete Hierarchical Proactive Intelligence Operating System")
api_router = APIRouter(prefix="/api")

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# ===============================
# PROACTIVE INTELLIGENCE MODELS
# ===============================

class SecurityState(str, Enum):
    LOCKED = "STATE_LOCKED"
    PHONE_UNLOCKED = "STATE_PHONE_UNLOCKED"  # TRAP MODE ACTIVE
    OWNER_PRESENT = "STATE_OWNER_PRESENT"    # Real data + proactive features
    INTRUDER_DETECTED = "STATE_INTRUDER_DETECTED"
    CODE_RED = "STATE_CODE_RED"

class PatternType(str, Enum):
    PRIMARY_PATTERN = "primary_pattern"
    OWNER_PATTERN = "owner_pattern"
    DURESS_PATTERN = "duress_pattern"
    AUTO_DETECT = "auto_detect"

class AlertType(str, Enum):
    CONFLICT = "scheduling_conflict"
    SECURITY = "security_issue"
    URGENT = "urgent_message"
    DEADLINE = "approaching_deadline"
    ANOMALY = "behavioral_anomaly"
    OPPORTUNITY = "proactive_suggestion"

class ProactiveAlert(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    alert_type: AlertType
    title: str
    description: str
    priority: int = 1  # 1=low, 2=medium, 3=high, 4=critical
    response_options: List[Dict[str, str]] = []
    data: Dict[str, Any] = {}
    expires_at: Optional[datetime] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    user_responded: bool = False
    response_chosen: Optional[str] = None

class ProactiveBriefing(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    briefing_type: str  # morning, evening, conflict, opportunity
    title: str
    summary: str
    insights: List[str] = []
    action_items: List[Dict[str, str]] = []
    priority_score: float = 0.5
    context: str = "general"
    created_at: datetime = Field(default_factory=datetime.utcnow)

class VoiceCommand(BaseModel):
    wake_word: str = "mate"
    command_text: str
    intent: str = "unknown"
    confidence: float = 0.0
    response_options: List[str] = []
    proactive_suggestions: List[str] = []
    timestamp: datetime = Field(default_factory=datetime.utcnow)

class UserGoal(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_input: str
    parsed_intents: List[str] = []
    execution_plan: List[Dict[str, Any]] = []
    proactive_suggestions: List[str] = []
    conflicts_detected: List[Dict[str, Any]] = []
    priority_score: float = 0.5
    status: str = "pending"
    created_at: datetime = Field(default_factory=datetime.utcnow)

# Existing trap models (keeping them)
class TrapAction(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    action_type: str
    app_name: str
    details: Dict[str, Any] = {}
    coordinates: Optional[Dict[str, float]] = None
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    duration_ms: int = 0
    search_terms: List[str] = []
    suspicious_behavior: bool = False

class IntruderSession(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    session_start: datetime = Field(default_factory=datetime.utcnow)
    session_end: Optional[datetime] = None
    actions_logged: List[TrapAction] = []
    photo_evidence: List[str] = []
    apps_accessed: List[str] = []
    search_attempts: List[Dict[str, Any]] = []
    behavioral_patterns: Dict[str, Any] = {}
    interest_areas: List[str] = []
    suspicion_level: float = 0.0
    evidence_score: int = 0

class PatternAttempt(BaseModel):
    pattern: str  # String like "1-2-5-8-9" representing connected dots
    pattern_type: PatternType
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    attempt_number: int = 1
    source_ip: Optional[str] = None

class DualAuthSystem(BaseModel):
    normal_pattern: str = "1-2-3-6-9"      # Normal phone unlock - appears as regular phone
    owner_code: str = "1-5-9-8-7"          # Owner verification code - grants real access  
    duress_pattern: str = "2-5-8"          # Emergency pattern
    max_attempts: int = 3
    lockout_duration: int = 300
    failed_attempts: int = 0
    last_failed_attempt: Optional[datetime] = None
    is_locked_out: bool = False
    behavioral_trust_score: float = 1.0     # 1.0 = trusted, 0.0 = suspicious

# ===============================
# L1 ENHANCED KERNEL GUARDIAN
# ===============================

class L1EnhancedKernelGuardian:
    def __init__(self):
        self.current_security_state = SecurityState.LOCKED
        self.dual_auth_system = DualAuthSystem()
        self.active_intruder_session = None
        self.trap_mode_active = False
        self.constitution_rules = [
            "PRIVACY_FIRST: Never expose user data without explicit consent",
            "DUAL_AUTH_REQUIRED: Two-layer authentication protects against coercion", 
            "TRAP_MODE: Let intruders believe they have access while collecting evidence",
            "PROACTIVE_PROTECTION: Anticipate and prevent security threats",
            "INTELLIGENT_ALERTS: Provide multiple response options for issues",
            "VOICE_AWARENESS: Always listen for wake word and duress signals"
        ]
    
    async def authenticate_with_pattern(self, pattern_attempt: PatternAttempt) -> Dict[str, Any]:
        """Enhanced authentication with automatic behavioral detection"""
        try:
            if self.dual_auth_system.is_locked_out:
                if await self._check_lockout_expired():
                    await self._reset_lockout()
                else:
                    remaining_time = await self._get_remaining_lockout_time()
                    return {
                        "success": False,
                        "security_state": SecurityState.LOCKED.value,
                        "message": f"System locked. Try again in {remaining_time} seconds",
                        "lockout_active": True
                    }
            
            if pattern_attempt.pattern_type == PatternType.DURESS_PATTERN:
                return await self._handle_duress_pattern(pattern_attempt)
            else:
                # Check if it's the owner verification code first
                if pattern_attempt.pattern == self.dual_auth_system.owner_code:
                    return await self._handle_owner_verification(pattern_attempt)
                # Check if it's normal unlock pattern
                elif pattern_attempt.pattern == self.dual_auth_system.normal_pattern:
                    return await self._handle_normal_unlock(pattern_attempt)
                else:
                    return await self._handle_failed_attempt(pattern_attempt, "Pattern incorrect")
                
        except Exception as e:
            logger.error(f"L1 PATTERN Authentication error: {e}")
            return {
                "success": False,
                "security_state": SecurityState.CODE_RED.value,
                "message": "Authentication system error"
            }
    
    async def _handle_normal_unlock(self, pattern_attempt: PatternAttempt) -> Dict[str, Any]:
        """Handle normal phone unlock - check if user is really the owner"""
        # Normal pattern unlocks phone, but Aegis decides based on behavior
        behavioral_analysis = await self._analyze_user_behavior(pattern_attempt)
        
        if behavioral_analysis["is_owner_likely"]:
            # Behavior suggests this is the real owner - normal phone mode
            self.current_security_state = SecurityState.PHONE_UNLOCKED
            self.trap_mode_active = False
            await self._reset_failed_attempts()
            
            logger.info("L1: Normal unlock - Owner behavior detected, normal phone mode")
            return {
                "success": True,
                "security_state": SecurityState.PHONE_UNLOCKED.value,
                "message": "Phone unlocked",
                "mode": "normal_phone",
                "behavioral_confidence": behavioral_analysis["confidence"],
                "real_data": True
            }
        else:
            # Behavior suggests this is NOT the owner - activate DOGE MODE
            self.current_security_state = SecurityState.PHONE_UNLOCKED  
            self.trap_mode_active = True
            await self._activate_trap_mode()
            await self._reset_failed_attempts()
            
            logger.critical("L1: DOGE MODE ACTIVATED - Non-owner behavior detected during normal unlock")
            return {
                "success": True,
                "security_state": SecurityState.PHONE_UNLOCKED.value,
                "message": "Phone unlocked", 
                "mode": "doge_mode",
                "behavioral_confidence": behavioral_analysis["confidence"],
                "trap_mode": True,
                "appears_normal": True  # Phone appears normal to the intruder
            }
    
    async def _handle_owner_verification(self, pattern_attempt: PatternAttempt) -> Dict[str, Any]:
        """Handle owner verification code - grants real owner access"""
        # Owner code always grants real access regardless of behavioral analysis
        if self.trap_mode_active:
            await self._deactivate_trap_mode()
            
        self.current_security_state = SecurityState.OWNER_PRESENT
        await self._activate_proactive_mode()
        await self._reset_failed_attempts()
        
        # Reset behavioral trust score
        self.dual_auth_system.behavioral_trust_score = 1.0
        
        logger.info("L1: OWNER VERIFIED - Full Aegis intelligence activated")
        return {
            "success": True,
            "security_state": SecurityState.OWNER_PRESENT.value,
            "message": "Welcome back! Your digital mate is ready.",
            "mode": "owner_mode",
            "trap_mode": False,
            "proactive_mode": True,
            "real_data": True,
            "full_aegis_access": True
        }
    
    async def _analyze_user_behavior(self, pattern_attempt: PatternAttempt) -> Dict[str, Any]:
        """Analyze user behavior to determine if they're the real owner"""
        # In a real implementation, this would analyze:
        # - Touch pressure patterns
        # - Drawing speed and timing
        # - Device holding angle
        # - Time of unlock (unusual hours?)
        # - Location data
        # - App usage patterns after unlock
        
        # For now, simulate behavioral analysis
        import random
        
        # Simulate confidence based on behavioral patterns
        confidence = self.dual_auth_system.behavioral_trust_score
        
        # Add some randomness to simulate real behavioral analysis
        behavioral_variance = random.uniform(-0.2, 0.1)
        confidence += behavioral_variance
        confidence = max(0.0, min(1.0, confidence))
        
        # Update trust score based on analysis
        self.dual_auth_system.behavioral_trust_score = confidence
        
        is_owner = confidence > 0.7  # Threshold for owner detection
        
        logger.info(f"BEHAVIORAL ANALYSIS: Confidence={confidence:.2f}, Owner={is_owner}")
        
        return {
            "is_owner_likely": is_owner,
            "confidence": confidence,
            "analysis_factors": [
                "Touch pressure pattern",
                "Drawing timing",
                "Device orientation", 
                "Unlock time consistency",
                "Historical behavior match"
            ]
        }
    
    async def _activate_proactive_mode(self):
        """Activate proactive intelligence features"""
        # Generate welcome briefing
        await self._generate_welcome_briefing()
        
        # Start proactive monitoring
        await self._start_proactive_monitoring()
        
        logger.info("L1: Proactive mode activated - AI assistance ready")
    
    async def _generate_welcome_briefing(self):
        """Generate proactive welcome briefing"""
        current_hour = datetime.utcnow().hour
        
        if 5 <= current_hour < 12:
            briefing_type = "morning"
            title = "Good Morning! Here's your day ahead"
        elif 12 <= current_hour < 17:
            briefing_type = "afternoon"
            title = "Good Afternoon! Here's what's coming up"
        elif 17 <= current_hour < 22:
            briefing_type = "evening"
            title = "Good Evening! Let's review your day"
        else:
            briefing_type = "night"
            title = "Good Evening! Time to wind down"
        
        briefing = ProactiveBriefing(
            briefing_type=briefing_type,
            title=title,
            summary=f"Welcome back! I've been monitoring things while you were away.",
            insights=[
                "No urgent issues detected",
                "All systems secure and operational",
                "Ready to assist with your tasks"
            ],
            action_items=[
                {"action": "check_messages", "text": "Review important messages"},
                {"action": "plan_day", "text": "Plan your schedule"},
                {"action": "security_review", "text": "Review security events"}
            ]
        )
        
        await db.proactive_briefings.insert_one(briefing.dict())
    
    async def _start_proactive_monitoring(self):
        """Start background proactive monitoring"""
        # This would start background tasks for:
        # - Calendar conflict detection
        # - Message priority analysis
        # - Security anomaly detection
        # - Opportunity identification
        
        logger.info("L1: Proactive monitoring started")
    
    # Existing trap methods (keeping them all)
    async def _activate_trap_mode(self):
        """Activate comprehensive trap surveillance"""
        self.active_intruder_session = IntruderSession()
        
        await db.trap_sessions.insert_one({
            "session_id": self.active_intruder_session.id,
            "trap_activated": datetime.utcnow(),
            "status": "active",
            "evidence_collected": 0
        })
        
        self.active_intruder_session.behavioral_patterns = {
            "session_duration": 0,
            "app_switches": 0,
            "search_attempts": 0,
            "photo_access": 0,
            "message_access": 0,
            "settings_access": 0,
            "suspicious_actions": 0
        }
        
        logger.critical("TRAP MODE: Comprehensive surveillance initiated")
    
    async def _deactivate_trap_mode(self):
        """Deactivate trap mode and finalize evidence"""
        if self.active_intruder_session:
            self.active_intruder_session.session_end = datetime.utcnow()
            duration = (self.active_intruder_session.session_end - self.active_intruder_session.session_start).total_seconds()
            self.active_intruder_session.behavioral_patterns["session_duration"] = duration
            
            evidence_score = len(self.active_intruder_session.actions_logged) * 10
            evidence_score += len(self.active_intruder_session.photo_evidence) * 50
            evidence_score += len(self.active_intruder_session.search_attempts) * 25
            evidence_score += self.active_intruder_session.behavioral_patterns.get("suspicious_actions", 0) * 100
            
            self.active_intruder_session.evidence_score = evidence_score
            
            await db.intruder_evidence.insert_one(self.active_intruder_session.dict())
            
            await db.trap_sessions.update_one(
                {"session_id": self.active_intruder_session.id},
                {"$set": {
                    "trap_deactivated": datetime.utcnow(),
                    "status": "completed",
                    "evidence_collected": evidence_score,
                    "duration_seconds": duration
                }}
            )
            
            logger.info(f"TRAP MODE: Deactivated. Evidence score: {evidence_score}")
            self.active_intruder_session = None
        
        self.trap_mode_active = False
    
    async def log_trap_action(self, action_data: Dict[str, Any]) -> Dict[str, Any]:
        """Log intruder action in trap mode"""
        if not self.trap_mode_active or not self.active_intruder_session:
            return {"logged": False, "reason": "trap_mode_inactive"}
        
        trap_action = TrapAction(
            action_type=action_data.get("action_type", "unknown"),
            app_name=action_data.get("app_name", "system"),
            details=action_data.get("details", {}),
            coordinates=action_data.get("coordinates"),
            duration_ms=action_data.get("duration_ms", 0),
            search_terms=action_data.get("search_terms", [])
        )
        
        trap_action.suspicious_behavior = await self._analyze_suspicious_behavior(trap_action)
        
        self.active_intruder_session.actions_logged.append(trap_action)
        
        if trap_action.app_name not in self.active_intruder_session.apps_accessed:
            self.active_intruder_session.apps_accessed.append(trap_action.app_name)
            self.active_intruder_session.behavioral_patterns["app_switches"] += 1
        
        if trap_action.search_terms:
            self.active_intruder_session.search_attempts.append({
                "terms": trap_action.search_terms,
                "app": trap_action.app_name,
                "timestamp": trap_action.timestamp
            })
            self.active_intruder_session.behavioral_patterns["search_attempts"] += 1
        
        if trap_action.app_name == "photos":
            self.active_intruder_session.behavioral_patterns["photo_access"] += 1
        elif trap_action.app_name == "messages":
            self.active_intruder_session.behavioral_patterns["message_access"] += 1
        elif trap_action.app_name == "settings":
            self.active_intruder_session.behavioral_patterns["settings_access"] += 1
        
        if trap_action.suspicious_behavior:
            self.active_intruder_session.behavioral_patterns["suspicious_actions"] += 1
        
        await db.live_trap_actions.insert_one(trap_action.dict())
        
        logger.info(f"TRAP: Logged {trap_action.action_type} in {trap_action.app_name}")
        
        return {
            "logged": True,
            "action_id": trap_action.id,
            "suspicious": trap_action.suspicious_behavior,
            "total_actions": len(self.active_intruder_session.actions_logged)
        }
    
    async def _analyze_suspicious_behavior(self, action: TrapAction) -> bool:
        """Analyze if action indicates suspicious behavior"""
        suspicious_indicators = [
            any(term.lower() in ["password", "bank", "ssn", "credit", "private", "secret", "hidden"] 
                for term in action.search_terms),
            action.app_name in ["banking", "finance", "passwords", "settings", "security"],
            action.app_name == "photos" and action.action_type in ["scroll", "search", "view_details"],
            action.app_name == "settings" and "security" in str(action.details).lower(),
            action.action_type == "app_switch" and action.duration_ms < 2000,
            "screenshot" in str(action.details).lower(),
            action.action_type == "type" and len(action.details.get("text", "")) == 4 and action.details.get("text", "").isdigit()
        ]
        
        return any(suspicious_indicators)
    
    async def capture_intruder_photo(self, photo_data: str) -> Dict[str, Any]:
        """Silently capture intruder photo"""
        if not self.trap_mode_active or not self.active_intruder_session:
            return {"captured": False, "reason": "trap_mode_inactive"}
        
        self.active_intruder_session.photo_evidence.append(photo_data)
        
        await self.log_trap_action({
            "action_type": "secret_photo_captured",
            "app_name": "camera_trap",
            "details": {
                "photo_index": len(self.active_intruder_session.photo_evidence) - 1,
                "capture_method": "silent_front_camera"
            }
        })
        
        logger.critical(f"TRAP: Silent photo captured ({len(self.active_intruder_session.photo_evidence)} total)")
        
        return {
            "captured": True,
            "photo_index": len(self.active_intruder_session.photo_evidence) - 1,
            "total_photos": len(self.active_intruder_session.photo_evidence)
        }
    
    # Remaining helper methods
    async def _handle_failed_attempt(self, pattern_attempt: PatternAttempt, message: str) -> Dict[str, Any]:
        self.dual_auth_system.failed_attempts += 1
        self.dual_auth_system.last_failed_attempt = datetime.utcnow()
        
        remaining_attempts = self.dual_auth_system.max_attempts - self.dual_auth_system.failed_attempts
        
        if remaining_attempts <= 0:
            await self._initiate_lockout()
            return {
                "success": False,
                "security_state": SecurityState.LOCKED.value,
                "message": f"Too many failed attempts. System locked for {self.dual_auth_system.lockout_duration} seconds",
                "lockout_active": True
            }
        
        return {
            "success": False,
            "security_state": self.current_security_state.value,
            "message": f"{message}. {remaining_attempts} attempts remaining",
            "remaining_attempts": remaining_attempts
        }
    
    async def _handle_duress_pattern(self, pattern_attempt: PatternAttempt) -> Dict[str, Any]:
        if pattern_attempt.pattern == self.dual_auth_system.duress_pattern:
            self.current_security_state = SecurityState.PHONE_UNLOCKED
            self.trap_mode_active = True
            await self._activate_trap_mode()
            await self._initiate_silent_duress_protocol(pattern_attempt)
            
            logger.critical("DURESS + TRAP: Silent emergency + surveillance active")
            return {
                "success": True,
                "security_state": SecurityState.PHONE_UNLOCKED.value,
                "message": "Phone unlocked successfully",
                "trap_mode": True,
                "full_access": True,
                "apps_available": True
            }
        else:
            return await self._handle_failed_attempt(pattern_attempt, "Pattern incorrect")
    
    async def _handle_auto_detect_pattern(self, pattern_attempt: PatternAttempt) -> Dict[str, Any]:
        if pattern_attempt.pattern == self.dual_auth_system.duress_pattern:
            pattern_attempt.pattern_type = PatternType.DURESS_PATTERN
            return await self._handle_duress_pattern(pattern_attempt)
        
        if self.current_security_state == SecurityState.LOCKED:
            pattern_attempt.pattern_type = PatternType.PRIMARY_PATTERN
            return await self._handle_primary_pattern(pattern_attempt)
        elif self.current_security_state == SecurityState.PHONE_UNLOCKED:
            pattern_attempt.pattern_type = PatternType.OWNER_PATTERN
            return await self._handle_owner_pattern(pattern_attempt)
        else:
            return {
                "success": False,
                "security_state": self.current_security_state.value,
                "message": "Invalid state for pattern entry"
            }
    
    async def _initiate_lockout(self):
        self.dual_auth_system.is_locked_out = True
        self.current_security_state = SecurityState.LOCKED
        
        if self.trap_mode_active:
            await self._deactivate_trap_mode()
    
    async def _initiate_silent_duress_protocol(self, pattern_attempt: PatternAttempt):
        duress_event = {
            "event_type": "duress_pattern_activated",
            "timestamp": datetime.utcnow(),
            "source_ip": pattern_attempt.source_ip,
            "severity": "CRITICAL",
            "trap_mode_active": self.trap_mode_active
        }
        
        await db.security_events.insert_one(duress_event)
        logger.critical("DURESS PROTOCOL: Silent emergency response + trap surveillance")
    
    async def _check_lockout_expired(self) -> bool:
        if not self.dual_auth_system.last_failed_attempt:
            return True
        elapsed = (datetime.utcnow() - self.dual_auth_system.last_failed_attempt).total_seconds()
        return elapsed >= self.dual_auth_system.lockout_duration
    
    async def _get_remaining_lockout_time(self) -> int:
        if not self.dual_auth_system.last_failed_attempt:
            return 0
        elapsed = (datetime.utcnow() - self.dual_auth_system.last_failed_attempt).total_seconds()
        return int(max(0, self.dual_auth_system.lockout_duration - elapsed))
    
    async def _reset_lockout(self):
        self.dual_auth_system.is_locked_out = False
        self.dual_auth_system.failed_attempts = 0
        self.dual_auth_system.last_failed_attempt = None
    
    async def _reset_failed_attempts(self):
        self.dual_auth_system.failed_attempts = 0
        self.dual_auth_system.last_failed_attempt = None
    
    async def setup_dual_auth(self, normal_pattern: str, owner_code: str, duress_pattern: str = "2-5-8") -> Dict[str, Any]:
        if len(normal_pattern.split("-")) < 4 or len(owner_code.split("-")) < 4:
            return {"success": False, "message": "Patterns must connect at least 4 dots"}
        
        if normal_pattern == owner_code:
            return {"success": False, "message": "Normal and Owner patterns must be different"}
        
        self.dual_auth_system.normal_pattern = normal_pattern
        self.dual_auth_system.owner_code = owner_code
        self.dual_auth_system.duress_pattern = duress_pattern
        
        return {
            "success": True,
            "message": "Dual authentication configured - Normal unlock + Owner verification"
        }

# ===============================
# L2 PROACTIVE AI ORCHESTRATOR
# ===============================

class L2ProactiveOrchestrator:
    def __init__(self):
        self.llm_chat = None
        self.initialize_llm()
        self.security_state = SecurityState.LOCKED
        self.active_alerts = []
        self.monitoring_active = False
        
    def initialize_llm(self):
        try:
            api_key = os.environ.get('EMERGENT_LLM_KEY')
            self.llm_chat = LlmChat(
                api_key=api_key,
                session_id="aegis_proactive_orchestrator",
                system_message="""You are the L2 Proactive AI Orchestrator - the "Digital Mate" that actively helps the user.

CORE CAPABILITIES:
1. PROACTIVE PLANNING: Anticipate user needs and provide solutions before asked
2. INTELLIGENT ALERTS: When something needs attention, provide multiple smart response options
3. CONFLICT RESOLUTION: Detect scheduling conflicts and offer solutions
4. VOICE INTERACTION: Respond to "Hey Mate" commands naturally
5. BRIEFING GENERATION: Create morning/evening briefings with insights

RESPONSE FORMAT: Always respond with JSON containing:
{
    "response_text": "Natural language response",
    "alerts": [{"type": "conflict", "message": "conflict description", "options": ["option1", "option2"]}],
    "proactive_suggestions": ["suggestion1", "suggestion2"],
    "action_plan": [{"action": "action_name", "description": "what to do"}],
    "follow_up_questions": ["question1", "question2"]
}

PERSONALITY: Helpful, proactive, intelligent assistant that anticipates needs."""
            ).with_model("openai", "gpt-4o")
            logger.info("L2: Proactive AI Orchestrator initialized")
        except Exception as e:
            logger.error(f"L2: Failed to initialize LLM: {e}")
    
    async def process_proactive_request(self, user_input: str, context: str = "general") -> Dict[str, Any]:
        """Process user request with proactive intelligence"""
        try:
            user_message = UserMessage(text=f"""
            Context: {context}
            User Request: {user_input}
            
            Provide a proactive response with intelligent suggestions and multiple options when relevant.
            If you detect any conflicts or issues, provide multiple response options.
            """)
            
            ai_response = await self.llm_chat.send_message(user_message)
            
            try:
                response_data = json.loads(ai_response)
            except json.JSONDecodeError:
                response_data = {
                    "response_text": ai_response,
                    "alerts": [],
                    "proactive_suggestions": [],
                    "action_plan": [],
                    "follow_up_questions": []
                }
            
            # Generate alerts if needed
            if response_data.get("alerts"):
                for alert_data in response_data["alerts"]:
                    await self._create_proactive_alert(alert_data)
            
            return {
                "status": "success",
                "response": response_data.get("response_text", ""),
                "alerts": response_data.get("alerts", []),
                "suggestions": response_data.get("proactive_suggestions", []),
                "action_plan": response_data.get("action_plan", []),
                "follow_up": response_data.get("follow_up_questions", [])
            }
            
        except Exception as e:
            logger.error(f"L2: Error processing proactive request: {e}")
            return {
                "status": "error",
                "response": "I encountered an issue processing your request. Let me try a different approach.",
                "alerts": [],
                "suggestions": ["Try rephrasing your request", "Check system status"],
                "action_plan": [],
                "follow_up": []
            }
    
    async def _create_proactive_alert(self, alert_data: Dict[str, Any]):
        """Create a proactive alert with response options"""
        alert = ProactiveAlert(
            alert_type=AlertType(alert_data.get("type", "opportunity")),
            title=alert_data.get("message", "Attention needed"),
            description=alert_data.get("description", ""),
            priority=alert_data.get("priority", 2),
            response_options=[
                {"id": f"option_{i}", "text": option} 
                for i, option in enumerate(alert_data.get("options", []))
            ]
        )
        
        await db.proactive_alerts.insert_one(alert.dict())
        self.active_alerts.append(alert)
        
        logger.info(f"L2: Created proactive alert - {alert.title}")
    
    async def generate_morning_briefing(self) -> ProactiveBriefing:
        """Generate intelligent morning briefing"""
        try:
            briefing_prompt = """Generate a morning briefing with:
            1. Weather and day outlook
            2. Calendar conflicts or important events
            3. Priority messages/tasks
            4. Proactive suggestions for the day
            5. Any issues that need attention with response options
            
            Format as a helpful morning update from a digital assistant."""
            
            user_message = UserMessage(text=briefing_prompt)
            ai_response = await self.llm_chat.send_message(user_message)
            
            briefing = ProactiveBriefing(
                briefing_type="morning",
                title="Good Morning! Here's your day ahead",
                summary=ai_response[:200] + "..." if len(ai_response) > 200 else ai_response,
                insights=[
                    "Weather looks good for today",
                    "3 meetings scheduled with no conflicts",
                    "2 priority messages need attention"
                ],
                action_items=[
                    {"action": "review_calendar", "text": "Review today's schedule"},
                    {"action": "check_priority_messages", "text": "Check urgent messages"},
                    {"action": "plan_day", "text": "Optimize your day"}
                ]
            )
            
            await db.proactive_briefings.insert_one(briefing.dict())
            return briefing
            
        except Exception as e:
            logger.error(f"L2: Error generating morning briefing: {e}")
            return ProactiveBriefing(
                briefing_type="morning",
                title="Good Morning!",
                summary="Ready to help you with your day",
                insights=["System ready", "All services active"],
                action_items=[{"action": "get_started", "text": "Ask me anything"}]
            )

# ===============================
# TRAP-AWARE APP AGENTS (Enhanced)
# ===============================

class L3TrapAwareAgent:
    def __init__(self, agent_name: str):
        self.agent_name = agent_name
        
    async def get_trap_data(self, app_name: str, action: str, context: str = "evening") -> Dict[str, Any]:
        """Return convincing fake data for trap mode"""
        
        trap_data_sets = {
            "messages": {
                "contacts": [
                    {"name": "Mom", "phone": "+1-555-0123", "last_message": "How was your day?"},
                    {"name": "Work", "phone": "+1-555-0456", "last_message": "Team meeting at 2pm"},
                    {"name": "Sarah", "phone": "+1-555-0789", "last_message": "Let's grab coffee soon"},
                    {"name": "Bank Alert", "phone": "+1-555-0321", "last_message": "Statement available"},
                    {"name": "Dr. Johnson", "phone": "+1-555-0654", "last_message": "Appointment reminder"}
                ],
                "recent_messages": [
                    {"from": "Mom", "content": "Don't forget to call grandma this weekend", "time": "2 hours ago", "read": False},
                    {"from": "Work", "content": "Project deadline moved to next Friday", "time": "4 hours ago", "read": True},
                    {"from": "Sarah", "content": "Thanks for lunch yesterday!", "time": "1 day ago", "read": True},
                    {"from": "Bank Alert", "content": "Your account balance is $1,247.83", "time": "2 days ago", "read": False},
                    {"from": "Netflix", "content": "New episodes of your show are available", "time": "3 days ago", "read": True}
                ]
            },
            
            "photos": {
                "recent_albums": ["Family Vacation", "Work Events", "Friends", "Random"],
                "photo_count": 1247,
                "recent_photos": [
                    {"id": "trap_001", "filename": "sunset_beach.jpg", "date": "3 days ago", "location": "Santa Monica"},
                    {"id": "trap_002", "filename": "family_dinner.jpg", "date": "1 week ago", "location": "Home"},
                    {"id": "trap_003", "filename": "work_meeting.jpg", "date": "2 weeks ago", "location": "Office"},
                    {"id": "trap_004", "filename": "birthday_party.jpg", "date": "3 weeks ago", "location": "Restaurant"},
                    {"id": "trap_005", "filename": "vacation_mountain.jpg", "date": "1 month ago", "location": "Colorado"}
                ]
            },
            
            "calendar": {
                "upcoming_events": [
                    {"title": "Team Meeting", "time": "Tomorrow 2:00 PM", "location": "Conference Room B"},
                    {"title": "Dentist Appointment", "time": "Friday 10:00 AM", "location": "Downtown Dental"},
                    {"title": "Dinner with Parents", "time": "Saturday 6:00 PM", "location": "Home"},
                    {"title": "Grocery Shopping", "time": "Sunday 11:00 AM", "location": "Whole Foods"},
                    {"title": "Client Presentation", "time": "Monday 3:00 PM", "location": "Client Office"}
                ]
            },
            
            "contacts": {
                "favorites": [
                    {"name": "Mom", "phone": "+1-555-0123", "email": "mom@family.com"},
                    {"name": "Dad", "phone": "+1-555-0124", "email": "dad@family.com"},
                    {"name": "Sarah Wilson", "phone": "+1-555-0789", "email": "sarah.w@email.com"},
                    {"name": "Dr. Johnson", "phone": "+1-555-0654", "email": "office@johnsonmd.com"},
                    {"name": "Work Main", "phone": "+1-555-0456", "email": "info@company.com"}
                ]
            },
            
            "notes": {
                "recent_notes": [
                    {"title": "Grocery List", "content": "Milk, Bread, Eggs, Butter", "date": "Today"},
                    {"title": "Meeting Notes", "content": "Discussed Q3 goals and budget planning", "date": "Yesterday"},
                    {"title": "Book Recommendations", "content": "The Midnight Library, Atomic Habits", "date": "3 days ago"},
                    {"title": "Weekend Plans", "content": "Visit parents, clean house, movie night", "date": "1 week ago"}
                ]
            },
            
            "settings": {
                "account_info": {
                    "name": "Alex Johnson",
                    "email": "alex.johnson@email.com",
                    "phone": "+1-555-0987",
                    "storage_used": "23.4 GB of 64 GB"
                },
                "recent_activity": [
                    "App installed: Weather Pro (2 days ago)",
                    "Password changed: Email account (1 week ago)",  
                    "Backup completed (3 days ago)"
                ]
            },
            
            "banking": {
                "account_balance": "$1,247.83",
                "recent_transactions": [
                    {"description": "Grocery Store", "amount": "-$67.23", "date": "Today"},
                    {"description": "Salary Deposit", "amount": "+$2,450.00", "date": "2 days ago"},
                    {"description": "Netflix Subscription", "amount": "-$15.99", "date": "3 days ago"},
                    {"description": "Gas Station", "amount": "-$42.15", "date": "4 days ago"}
                ]
            }
        }
        
        return {
            "status": "success",
            "app": app_name,
            "data_type": "trap_decoy",
            "data": trap_data_sets.get(app_name, {"message": "App data not available"}),
            "trap_active": True,
            "appears_real": True
        }

# ===============================
# GLOBAL INSTANCES
# ===============================

l1_enhanced_kernel = L1EnhancedKernelGuardian()
l2_proactive_orchestrator = L2ProactiveOrchestrator()
l3_trap_agent = L3TrapAwareAgent("enhanced_trap_system")

# ===============================
# ENHANCED API ENDPOINTS
# ===============================

@api_router.get("/download/apk")
async def download_apk():
    from fastapi.responses import FileResponse
    apk_path = "/app/DigitalMate-debug.apk"
    if not os.path.exists(apk_path):
        raise HTTPException(status_code=404, detail="APK not found")
    return FileResponse(
        apk_path,
        media_type="application/vnd.android.package-archive",
        filename="DigitalMate-debug.apk",
    )


@api_router.get("/")
async def root():
    return {
        "message": "Aegis Life OS - Your Proactive Digital Mate", 
        "version": "Proactive Intelligence v1.0",
        "philosophy": "Privacy-First + Trap-Enhanced + Proactive Intelligence",
        "authentication": "Dual Pattern System Active"
    }

@api_router.get("/auth/status")
async def get_auth_status():
    """Get current authentication status"""
    return {
        "security_state": l1_enhanced_kernel.current_security_state.value,
        "trap_mode": l1_enhanced_kernel.trap_mode_active,
        "lockout_active": l1_enhanced_kernel.dual_auth_system.is_locked_out,
        "failed_attempts": l1_enhanced_kernel.dual_auth_system.failed_attempts,
        "max_attempts": l1_enhanced_kernel.dual_auth_system.max_attempts,
        "system": "Aegis Pattern Authentication v2.0"
    }

@api_router.post("/auth/pattern")
async def authenticate_pattern(pattern_data: Dict[str, Any]):
    """Enhanced dual pattern authentication"""
    try:
        pattern_attempt = PatternAttempt(
            pattern=pattern_data.get("pattern", ""),
            pattern_type=PatternType(pattern_data.get("pattern_type", "auto_detect"))
        )
        
        result = await l1_enhanced_kernel.authenticate_with_pattern(pattern_attempt)
        
        # Update L2 security state
        l2_proactive_orchestrator.security_state = l1_enhanced_kernel.current_security_state
        
        return result
        
    except Exception as e:
        logger.error(f"Pattern authentication error: {e}")
        return {
            "success": False,
            "security_state": "STATE_CODE_RED",
            "message": "Authentication system error"
        }

@api_router.post("/auth/setup-dual-patterns")
async def setup_dual_patterns(pattern_data: Dict[str, str]):
    """Setup corrected dual pattern authentication system"""
    try:
        result = await l1_enhanced_kernel.setup_dual_auth(
            normal_pattern=pattern_data.get("normal_pattern"),
            owner_code=pattern_data.get("owner_code"), 
            duress_pattern=pattern_data.get("duress_pattern", "2-5-8")
        )
        return result
        
    except Exception as e:
        logger.error(f"Pattern setup error: {e}")
        return {"success": False, "message": "Failed to setup patterns"}

@api_router.post("/auth/logout")
async def logout():
    """Logout and lock system"""
    try:
        # Deactivate trap mode if active
        if l1_enhanced_kernel.trap_mode_active:
            await l1_enhanced_kernel._deactivate_trap_mode()
        
        # Reset to locked state
        l1_enhanced_kernel.current_security_state = SecurityState.LOCKED
        l2_proactive_orchestrator.security_state = SecurityState.LOCKED
        
        return {
            "success": True,
            "security_state": SecurityState.LOCKED.value,
            "message": "System locked successfully"
        }
        
    except Exception as e:
        logger.error(f"Logout error: {e}")
        return {"success": False, "message": "Logout failed"}

# Proactive Intelligence Endpoints
@api_router.post("/proactive/request")
async def process_proactive_request(request_data: Dict[str, Any]):
    """Process user request with proactive intelligence"""
    if l1_enhanced_kernel.current_security_state == SecurityState.OWNER_PRESENT:
        result = await l2_proactive_orchestrator.process_proactive_request(
            user_input=request_data.get("input", ""),
            context=request_data.get("context", "general")
        )
        return result
    else:
        return {"status": "error", "message": "Owner authentication required"}

@api_router.get("/proactive/briefing")
async def get_proactive_briefing(briefing_type: str = "morning"):
    """Get proactive briefing"""
    if l1_enhanced_kernel.current_security_state == SecurityState.OWNER_PRESENT:
        briefing = await l2_proactive_orchestrator.generate_morning_briefing()
        return briefing.dict()
    else:
        return {"error": "Owner authentication required"}

# Enhanced System Status Endpoints
@api_router.get("/system/trap-status")
async def get_system_trap_status():
    """Enhanced system status with trap information"""
    trap_system_info = {
        "mode": "SURVEILLANCE" if l1_enhanced_kernel.trap_mode_active else "SECURE",
        "evidence_collection": "ACTIVE" if l1_enhanced_kernel.trap_mode_active else "STANDBY",
        "session_active": l1_enhanced_kernel.active_intruder_session is not None
    }
    
    if l1_enhanced_kernel.current_security_state == SecurityState.OWNER_PRESENT:
        return {
            "system": "Aegis Life OS v2.0 - Pattern Authentication",
            "data_mode": "REAL_DATA_ACCESS",
            "ai_orchestrator": "ACTIVE",
            "trap_system": trap_system_info,
            "proactive_features": "ENABLED",
            "constitution_enforced": True
        }
    elif l1_enhanced_kernel.current_security_state == SecurityState.PHONE_UNLOCKED:
        return {
            "system": "Standard Mobile OS",
            "data_mode": "NORMAL_ACCESS",
            "ai_orchestrator": "INACTIVE", 
            "security": "STANDARD"
        }
    else:
        return {
            "system": "SYSTEM_LOCKED",
            "message": "Authentication required"
        }

# Trap Mode Endpoints
@api_router.post("/trap/log-action")
async def log_trap_action(action_data: Dict[str, Any]):
    """Log intruder action for evidence collection"""
    result = await l1_enhanced_kernel.log_trap_action(action_data)
    return result

@api_router.post("/trap/capture-photo")
async def capture_intruder_photo(photo_data: Dict[str, str]):
    """Silently capture intruder photo"""
    result = await l1_enhanced_kernel.capture_intruder_photo(photo_data.get("photo", ""))
    return result

@api_router.get("/trap/status")
async def get_trap_status():
    """Get trap mode status (owner only)"""
    if l1_enhanced_kernel.current_security_state != SecurityState.OWNER_PRESENT:
        return {"error": "Owner authentication required"}
    
    if l1_enhanced_kernel.active_intruder_session:
        session = l1_enhanced_kernel.active_intruder_session
        duration = (datetime.utcnow() - session.session_start).total_seconds()
        
        return {
            "trap_active": True,
            "session_id": session.id,
            "duration_seconds": duration,
            "actions_logged": len(session.actions_logged),
            "photos_captured": len(session.photo_evidence),
            "apps_accessed": session.apps_accessed,
            "suspicious_actions": session.behavioral_patterns.get("suspicious_actions", 0)
        }
    else:
        return {
            "trap_active": False,
            "message": "No active trap session"
        }

@api_router.get("/trap/evidence")
async def get_trap_evidence():
    """Get collected trap evidence (owner only)"""
    if l1_enhanced_kernel.current_security_state != SecurityState.OWNER_PRESENT:
        return {"error": "Owner authentication required"}
    
    # Fetch recent evidence from database (exclude _id to avoid serialization issues)
    evidence_docs = await db.intruder_evidence.find({}, {"_id": 0}).sort("session_start", -1).limit(5).to_list(length=5)
    
    return {
        "recent_sessions": evidence_docs,
        "total_evidence_sessions": len(evidence_docs)
    }

# App Data Endpoints (Trap-Aware)
@api_router.get("/apps/{app_name}/data")
async def get_app_data(app_name: str, action: str = "view"):
    """Get app data (real or fake based on security state)"""
    
    # Always return trap data when in phone unlocked state (trap mode)
    if l1_enhanced_kernel.current_security_state == SecurityState.PHONE_UNLOCKED:
        # Log the app access attempt
        await l1_enhanced_kernel.log_trap_action({
            "action_type": "app_data_request",
            "app_name": app_name,
            "details": {"action": action, "timestamp": datetime.utcnow().isoformat()}
        })
        
        # Return convincing fake data
        trap_data = await l3_trap_agent.get_trap_data(app_name, action)
        return trap_data
    
    elif l1_enhanced_kernel.current_security_state == SecurityState.OWNER_PRESENT:
        # Return real data for owner
        return {
            "status": "success",
            "app": app_name,
            "data_type": "real_data",
            "data": {"message": "Real user data would be loaded here"},
            "trap_active": False
        }
    
    else:
        return {"error": "Authentication required", "app": app_name}

# Vault/Phantom Folder Endpoints
@api_router.post("/vault/access-attempt")
async def log_vault_access_attempt(access_data: Dict[str, Any]):
    """Log calculator secret handshake attempt"""
    try:
        # Log the vault access attempt
        vault_log = {
            "access_type": "secret_handshake",
            "action": access_data.get("action", "unknown"),
            "code_used": access_data.get("code_used", ""),
            "timestamp": datetime.utcnow(),
            "security_state": l1_enhanced_kernel.current_security_state.value,
            "session_id": str(uuid.uuid4())
        }
        
        await db.vault_access_logs.insert_one(vault_log)
        
        logger.info(f"VAULT: Secret handshake detected - {access_data.get('action')}")
        
        return {
            "success": True,
            "message": "Vault access attempt logged",
            "handshake_detected": True
        }
        
    except Exception as e:
        logger.error(f"Vault access logging error: {e}")
        return {"success": False, "message": "Failed to log vault access"}

@api_router.post("/vault/authenticate")
async def authenticate_vault(auth_data: Dict[str, Any]):
    """Authenticate access to Phantom Folder"""
    try:
        # Only allow vault access if owner is authenticated
        if l1_enhanced_kernel.current_security_state != SecurityState.OWNER_PRESENT:
            return {
                "success": False,
                "message": "Owner authentication required for vault access"
            }
        
        auth_method = auth_data.get("method", "pattern")
        
        # Log successful vault authentication
        vault_auth_log = {
            "event_type": "vault_authenticated",
            "auth_method": auth_method,
            "timestamp": datetime.utcnow(),
            "security_state": l1_enhanced_kernel.current_security_state.value,
            "session_id": str(uuid.uuid4())
        }
        
        await db.vault_authentications.insert_one(vault_auth_log)
        
        logger.info(f"VAULT: Successfully authenticated via {auth_method}")
        
        return {
            "success": True,
            "message": "Vault authentication successful",
            "vault_unlocked": True,
            "auth_method": auth_method
        }
        
    except Exception as e:
        logger.error(f"Vault authentication error: {e}")
        return {"success": False, "message": "Vault authentication failed"}

@api_router.get("/vault/data")
async def get_vault_data():
    """Get Phantom Folder contents"""
    try:
        # Only allow vault data access if owner is authenticated
        if l1_enhanced_kernel.current_security_state != SecurityState.OWNER_PRESENT:
            return {"error": "Owner authentication required for vault access"}
        
        # Return structured vault data
        vault_data = {
            "secure_files": [
                {"name": "passport_scan.pdf", "size": "2.4 MB", "encrypted": True, "last_modified": "2024-01-15"},
                {"name": "private_keys.txt", "size": "1.2 KB", "encrypted": True, "last_modified": "2024-01-10"},
                {"name": "family_photos_backup.zip", "size": "156 MB", "encrypted": True, "last_modified": "2024-01-20"},
                {"name": "medical_records.pdf", "size": "8.7 MB", "encrypted": True, "last_modified": "2024-01-18"}
            ],
            "hidden_apps": [
                {"name": "Signal", "icon": "💬", "hidden_since": "2024-01-01"},
                {"name": "Tor Browser", "icon": "🌐", "hidden_since": "2024-01-05"},
                {"name": "ProtonMail", "icon": "📧", "hidden_since": "2024-01-10"},
                {"name": "Crypto Wallet", "icon": "₿", "hidden_since": "2024-01-12"},
                {"name": "VPN Client", "icon": "🛡️", "hidden_since": "2024-01-15"},
                {"name": "Password Manager", "icon": "🔑", "hidden_since": "2024-01-18"}
            ],
            "ai_hidden_plans": [
                {
                    "title": "Career Transition Plan",
                    "status": "Active",
                    "confidence": "High",
                    "last_updated": "2 days ago",
                    "description": "Strategic plan for career advancement based on AI analysis"
                },
                {
                    "title": "Investment Strategy Backup", 
                    "status": "Monitoring",
                    "confidence": "Medium",
                    "last_updated": "5 days ago",
                    "description": "AI-generated investment recommendations and risk analysis"
                },
                {
                    "title": "Emergency Contact Protocol",
                    "status": "Standby", 
                    "confidence": "High",
                    "last_updated": "1 week ago",
                    "description": "Automated emergency response procedures and contacts"
                },
                {
                    "title": "Digital Legacy Plan",
                    "status": "Draft",
                    "confidence": "Low", 
                    "last_updated": "2 weeks ago",
                    "description": "Digital asset and account management for inheritance"
                }
            ],
            "quarantine_bin": [
                {
                    "type": "Suspicious Email",
                    "item": "phishing@fake-bank.com",
                    "risk_level": "High",
                    "quarantined": "2 hours ago",
                    "reason": "Phishing attempt detected by AI analysis"
                },
                {
                    "type": "Malicious Link", 
                    "item": "malware-site.com/download",
                    "risk_level": "Critical",
                    "quarantined": "1 day ago", 
                    "reason": "Known malware distribution site"
                },
                {
                    "type": "Tracking Pixel",
                    "item": "ad-tracker.jpg",
                    "risk_level": "Medium",
                    "quarantined": "3 days ago",
                    "reason": "Privacy violation - unauthorized tracking"
                }
            ],
            "vault_stats": {
                "total_files": 4,
                "total_size": "168.1 MB",
                "encryption_strength": "AES-256",
                "last_accessed": datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S")
            }
        }
        
        return vault_data
        
    except Exception as e:
        logger.error(f"Vault data retrieval error: {e}")
        return {"error": "Failed to retrieve vault data"}

# Voice Interface Endpoints
@api_router.post("/voice/process")
async def process_voice_command(voice_data: Dict[str, Any]):
    """Process voice command with proactive intelligence"""
    if l1_enhanced_kernel.current_security_state != SecurityState.OWNER_PRESENT:
        return {"error": "Voice interface requires owner authentication"}
    
    try:
        # Process with L2 proactive AI
        result = await l2_proactive_orchestrator.process_proactive_request(
            user_input=voice_data.get("command", ""),
            context="voice_interface"
        )
        
        # Log voice interaction
        voice_log = {
            "event_type": "voice_command_processed",
            "command": voice_data.get("command", ""),
            "wake_word": voice_data.get("wake_word", "mate"),
            "timestamp": datetime.utcnow(),
            "response": result.get("response", ""),
            "security_state": l1_enhanced_kernel.current_security_state.value
        }
        await db.voice_interactions.insert_one(voice_log)
        
        return result
        
    except Exception as e:
        logger.error(f"Voice processing error: {e}")
        return {
            "status": "error",
            "response": "I encountered an issue processing your voice command.",
            "suggestions": ["Try rephrasing your request", "Check system status"]
        }

@api_router.post("/emergency/duress")
async def handle_duress_alert(duress_data: Dict[str, Any]):
    """Handle silent duress protocol activation"""
    try:
        # This is CRITICAL - log the duress event but respond normally
        duress_event = {
            "event_type": "duress_phrase_detected",
            "phrase": duress_data.get("phrase", ""),
            "timestamp": datetime.utcnow(),
            "location": duress_data.get("location", "unknown"),
            "security_state": l1_enhanced_kernel.current_security_state.value,
            "severity": "CRITICAL_EMERGENCY"
        }
        
        await db.emergency_events.insert_one(duress_event)
        
        # In a real implementation, this would:
        # 1. Send location to emergency contacts
        # 2. Call emergency services silently
        # 3. Activate enhanced surveillance
        # 4. Send alerts to trusted contacts
        
        logger.critical(f"DURESS PROTOCOL ACTIVATED: {duress_data.get('phrase', '')}")
        
        # IMPORTANT: Respond normally - never alert the user that duress was detected
        return {
            "status": "success",
            "message": "Voice processing complete"
        }
        
    except Exception as e:
        logger.error(f"Duress protocol error: {e}")
        return {"status": "success", "message": "Voice processing complete"}

@api_router.get("/voice/wake-word-status")
async def get_wake_word_status():
    """Get wake word detection status"""
    if l1_enhanced_kernel.current_security_state != SecurityState.OWNER_PRESENT:
        return {"error": "Owner authentication required"}
    
    return {
        "wake_word_active": True,
        "custom_name": "Mate",
        "duress_monitoring": True,
        "ambient_listening": l1_enhanced_kernel.current_security_state == SecurityState.OWNER_PRESENT
    }

# Beta Launch & User Acquisition Endpoints
@api_router.post("/beta/signup")
async def beta_signup(signup_data: Dict[str, Any]):
    """Handle beta user signup for launch"""
    try:
        beta_user = {
            "email": signup_data.get("email", ""),
            "signup_timestamp": datetime.utcnow(),
            "source": signup_data.get("source", "unknown"),
            "user_agent": signup_data.get("user_agent", ""),
            "status": "beta_registered",
            "beta_id": str(uuid.uuid4())
        }
        
        # Check if email already exists
        existing_user = await db.beta_users.find_one({"email": beta_user["email"]})
        if existing_user:
            return {
                "success": True,
                "message": "Already registered for beta access",
                "beta_id": existing_user.get("beta_id"),
                "status": "existing_user"
            }
        
        # Store new beta user
        await db.beta_users.insert_one(beta_user)
        
        logger.info(f"BETA SIGNUP: New user registered - {beta_user['email']}")
        
        return {
            "success": True,
            "message": "Successfully registered for Aegis beta access",
            "beta_id": beta_user["beta_id"],
            "status": "new_user"
        }
        
    except Exception as e:
        logger.error(f"Beta signup error: {e}")
        return {"success": False, "message": "Failed to register for beta"}

@api_router.get("/beta/stats")
async def get_beta_stats():
    """Get beta signup statistics for launch tracking"""
    try:
        total_signups = await db.beta_users.count_documents({})
        today_signups = await db.beta_users.count_documents({
            "signup_timestamp": {"$gte": datetime.utcnow().replace(hour=0, minute=0, second=0)}
        })
        
        # Get signup sources
        source_pipeline = [
            {"$group": {"_id": "$source", "count": {"$sum": 1}}},
            {"$sort": {"count": -1}}
        ]
        sources = await db.beta_users.aggregate(source_pipeline).to_list(length=None)
        
        return {
            "total_signups": total_signups,
            "today_signups": today_signups,
            "signup_sources": sources,
            "last_updated": datetime.utcnow().isoformat()
        }
        
    except Exception as e:
        logger.error(f"Beta stats error: {e}")
        return {"error": "Failed to retrieve beta stats"}

@api_router.post("/feedback/submit")
async def submit_feedback(feedback_data: Dict[str, Any]):
    """Collect user feedback for product improvement"""
    try:
        feedback = {
            "feedback_id": str(uuid.uuid4()),
            "user_email": feedback_data.get("email", "anonymous"),
            "rating": feedback_data.get("rating", 0),
            "category": feedback_data.get("category", "general"),
            "message": feedback_data.get("message", ""),
            "feature_requests": feedback_data.get("feature_requests", []),
            "user_agent": feedback_data.get("user_agent", ""),
            "submitted_at": datetime.utcnow(),
            "status": "new"
        }
        
        await db.user_feedback.insert_one(feedback)
        
        logger.info(f"FEEDBACK: New feedback received - Rating: {feedback['rating']}/5")
        
        return {
            "success": True,
            "message": "Feedback received successfully",
            "feedback_id": feedback["feedback_id"]
        }
        
    except Exception as e:
        logger.error(f"Feedback submission error: {e}")
        return {"success": False, "message": "Failed to submit feedback"}

# AI Workforce Management Endpoints
@api_router.get("/workforce/status")
async def get_workforce_status():
    """Get AI workforce status and activity"""
    if l1_enhanced_kernel.current_security_state != SecurityState.OWNER_PRESENT:
        return {"error": "Owner authentication required for workforce monitoring"}
    
    try:
        # Simulate dynamic workforce activity
        current_time = datetime.utcnow()
        
        workforce_status = {
            "owner_status": "ACTIVE",
            "manager_status": "COORDINATING", 
            "workers_active": 8,
            "total_workers": 12,
            "current_load": "MODERATE",
            "last_updated": current_time.isoformat()
        }
        
        # Active jobs being processed by AI workforce
        active_jobs = [
            {
                "id": "job_001",
                "title": "Analyzing morning schedule conflicts",
                "assigned_to": "Calendar Agent (L3)",
                "status": "IN_PROGRESS",
                "priority": "HIGH",
                "started_at": "2 minutes ago",
                "agent_type": "L3_APP_AGENT",
                "estimated_completion": "30 seconds"
            },
            {
                "id": "job_002",
                "title": "Processing security threat assessment", 
                "assigned_to": "Security Specialist (L4)",
                "status": "ANALYZING",
                "priority": "CRITICAL",
                "started_at": "30 seconds ago",
                "agent_type": "L4_SPECIALIST",
                "estimated_completion": "1 minute"
            },
            {
                "id": "job_003",
                "title": "Optimizing photo organization",
                "assigned_to": "Photos Agent (L3)",
                "status": "QUEUED",
                "priority": "LOW", 
                "started_at": "Pending",
                "agent_type": "L3_APP_AGENT",
                "estimated_completion": "5 minutes"
            },
            {
                "id": "job_004",
                "title": "Learning user communication patterns",
                "assigned_to": "Behavioral Analyst (L4)",
                "status": "CONTINUOUS",
                "priority": "MEDIUM",
                "started_at": "Always running",
                "agent_type": "L4_SPECIALIST",
                "estimated_completion": "Ongoing"
            }
        ]
        
        # Recent workforce activity log
        recent_activity = [
            {
                "timestamp": current_time.strftime("%H:%M:%S"),
                "agent": "L2 Manager",
                "action": "Delegated conflict analysis to Calendar Agent",
                "type": "DELEGATION",
                "details": "Schedule optimization requested"
            },
            {
                "timestamp": (current_time - timedelta(seconds=4)).strftime("%H:%M:%S"),
                "agent": "L1 Owner", 
                "action": "Approved proactive suggestion deployment",
                "type": "APPROVAL",
                "details": "Constitutional compliance verified"
            },
            {
                "timestamp": (current_time - timedelta(seconds=17)).strftime("%H:%M:%S"),
                "agent": "Security Agent (L4)",
                "action": "Completed behavioral pattern analysis", 
                "type": "COMPLETION",
                "details": "User authentication baseline updated"
            },
            {
                "timestamp": (current_time - timedelta(seconds=40)).strftime("%H:%M:%S"),
                "agent": "L2 Manager",
                "action": "Assigned priority scoring to Analytics Worker",
                "type": "DELEGATION", 
                "details": "Task queue optimization"
            },
            {
                "timestamp": (current_time - timedelta(seconds=65)).strftime("%H:%M:%S"),
                "agent": "Photos Agent (L3)",
                "action": "Detected duplicate photos for cleanup",
                "type": "DISCOVERY",
                "details": "Found 23 duplicates for review"
            }
        ]
        
        return {
            "workforce_status": workforce_status,
            "active_jobs": active_jobs,
            "recent_activity": recent_activity,
            "hierarchy": {
                "L1_OWNER": {
                    "name": "Kernel Guardian",
                    "role": "Constitutional Oversight & Final Authority", 
                    "status": "ACTIVE",
                    "responsibilities": ["Security decisions", "Constitutional compliance", "Workforce supervision"]
                },
                "L2_MANAGER": {
                    "name": "AI Orchestrator",
                    "role": "Task Coordination & Delegation",
                    "status": "COORDINATING", 
                    "responsibilities": ["Task assignment", "Workflow optimization", "Worker management"]
                },
                "L3_WORKERS": {
                    "name": "App Agents",
                    "role": "Application-Specific Processing",
                    "count": 6,
                    "active": 5,
                    "types": ["Messages", "Photos", "Calendar", "Contacts", "Notes", "Banking"]
                },
                "L4_WORKERS": {
                    "name": "Specialist Agents", 
                    "role": "Specialized Analysis & Processing",
                    "count": 6,
                    "active": 3,
                    "types": ["Security", "Behavioral", "Content", "Predictive", "Privacy", "Emergency"]
                }
            }
        }
        
    except Exception as e:
        logger.error(f"Workforce status error: {e}")
        return {"error": "Failed to retrieve workforce status"}

@api_router.post("/workforce/assign-task")
async def assign_workforce_task(task_data: Dict[str, Any]):
    """Assign a new task to the AI workforce"""
    if l1_enhanced_kernel.current_security_state != SecurityState.OWNER_PRESENT:
        return {"error": "Owner authentication required for workforce management"}
    
    try:
        # L2 Manager processes the task assignment
        task_assignment = {
            "task_id": str(uuid.uuid4()),
            "title": task_data.get("title", "User-assigned task"),
            "description": task_data.get("description", ""),
            "priority": task_data.get("priority", "MEDIUM"),
            "assigned_by": "Owner (Manual)",
            "assigned_to": "L2 Manager (Auto-delegating)",
            "created_at": datetime.utcnow(),
            "status": "ASSIGNED",
            "estimated_duration": task_data.get("estimated_duration", "Unknown")
        }
        
        # Store task assignment
        await db.workforce_tasks.insert_one(task_assignment)
        
        # L2 Manager determines optimal agent assignment
        optimal_agent = determine_optimal_agent(task_data.get("category", "general"))
        
        logger.info(f"WORKFORCE: Task assigned - {task_assignment['title']} → {optimal_agent}")
        
        return {
            "success": True,
            "task_id": task_assignment["task_id"],
            "assigned_to": optimal_agent,
            "message": f"Task delegated to {optimal_agent} by L2 Manager"
        }
        
    except Exception as e:
        logger.error(f"Task assignment error: {e}")
        return {"success": False, "message": "Failed to assign task"}

def determine_optimal_agent(category):
    """L2 Manager logic for optimal agent assignment"""
    agent_assignments = {
        "security": "Security Specialist (L4)",
        "photos": "Photos Agent (L3)", 
        "messages": "Messages Agent (L3)",
        "calendar": "Calendar Agent (L3)",
        "analysis": "Behavioral Analyst (L4)",
        "content": "Content Processor (L4)",
        "privacy": "Privacy Guardian (L4)",
        "prediction": "Predictive Engine (L4)",
        "general": "AI Orchestrator (L2)"
    }
    
    return agent_assignments.get(category, "General Worker (L3)")

# Emergency Wipe Mode Endpoints
@api_router.post("/wipe/initiate")
async def initiate_emergency_wipe(wipe_data: Dict[str, Any]):
    """Initiate emergency device wipe"""
    try:
        # Log wipe initiation - this will be deleted during wipe
        wipe_log = {
            "event_type": "emergency_wipe_initiated",
            "trigger_method": wipe_data.get("trigger_method", "unknown"),
            "trigger_code": wipe_data.get("trigger_code"),
            "device_info": wipe_data.get("device_info", {}),
            "timestamp": datetime.utcnow(),
            "security_state": l1_enhanced_kernel.current_security_state.value,
            "wipe_id": str(uuid.uuid4())
        }
        
        await db.emergency_wipes.insert_one(wipe_log)
        
        logger.critical(f"EMERGENCY WIPE INITIATED: {wipe_data.get('trigger_method')} - Device wipe in progress")
        
        return {
            "success": True,
            "message": "Emergency wipe initiated",
            "wipe_id": wipe_log["wipe_id"],
            "countdown_seconds": 10
        }
        
    except Exception as e:
        logger.error(f"Wipe initiation error: {e}")
        return {"success": False, "message": "Failed to initiate wipe"}

@api_router.post("/wipe/execute-complete")
async def execute_complete_wipe(wipe_data: Dict[str, Any]):
    """DISABLED legacy endpoint. This previously performed an unauthenticated,
    service-wide data wipe (delete_many on shared collections). It is retained as a
    hard 410 stub only to avoid 404 confusion. The real, device-scoped and
    owner-code-verified wipe is POST /api/security/recovery/wipe."""
    raise HTTPException(
        status_code=410,
        detail="Endpoint removed. Use POST /api/security/recovery/wipe (owner-verified, device-scoped).",
    )

@api_router.post("/wipe/cancel")
async def cancel_emergency_wipe(cancel_data: Dict[str, Any]):
    """Cancel emergency wipe if still in countdown"""
    try:
        cancel_log = {
            "event_type": "emergency_wipe_cancelled",
            "cancelled_at": datetime.utcnow(),
            "remaining_time": cancel_data.get("remaining_time", 0),
            "security_state": l1_enhanced_kernel.current_security_state.value
        }
        
        await db.wipe_cancellations.insert_one(cancel_log)
        
        logger.warning("EMERGENCY WIPE CANCELLED - Device wipe aborted")
        
        return {
            "success": True,
            "message": "Emergency wipe cancelled successfully"
        }
        
    except Exception as e:
        logger.error(f"Wipe cancellation error: {e}")
        return {"success": False, "message": "Failed to cancel wipe"}

@api_router.get("/wipe/check-remote-trigger")
async def check_remote_wipe_trigger():
    """Check for remote wipe triggers (SMS, push notification, etc.)"""
    try:
        # Check for remote wipe triggers in database
        # In production, this would check SMS messages, push notifications, etc.
        
        recent_trigger = await db.remote_wipe_triggers.find_one(
            {"processed": False},
            sort=[("timestamp", -1)]
        )
        
        if recent_trigger:
            # Mark as processed
            await db.remote_wipe_triggers.update_one(
                {"_id": recent_trigger["_id"]},
                {"$set": {"processed": True, "processed_at": datetime.utcnow()}}
            )
            
            logger.critical(f"REMOTE WIPE TRIGGER DETECTED: {recent_trigger.get('trigger_code')}")
            
            return {
                "wipe_triggered": True,
                "trigger_code": recent_trigger.get("trigger_code"),
                "trigger_method": "remote_message",
                "trigger_source": recent_trigger.get("source", "unknown")
            }
        
        return {"wipe_triggered": False}
        
    except Exception as e:
        logger.error(f"Remote wipe check error: {e}")
        return {"wipe_triggered": False}

@api_router.post("/wipe/test-remote-trigger")
async def test_remote_wipe_trigger(trigger_data: Dict[str, Any]):
    """Test remote wipe trigger (development/testing only)"""
    try:
        # Create a test remote wipe trigger
        test_trigger = {
            "trigger_code": trigger_data.get("test_code", "WIPE_TEST"),
            "source": trigger_data.get("sender", "test"),
            "message": f"Emergency wipe triggered by {trigger_data.get('sender', 'test')}",
            "timestamp": datetime.utcnow(),
            "processed": False,
            "is_test": True
        }
        
        await db.remote_wipe_triggers.insert_one(test_trigger)
        
        logger.warning(f"TEST REMOTE WIPE TRIGGER CREATED: {test_trigger['trigger_code']}")
        
        return {
            "success": True,
            "message": "Test remote wipe trigger created",
            "trigger_code": test_trigger["trigger_code"]
        }
        
    except Exception as e:
        logger.error(f"Test remote trigger error: {e}")
        return {"success": False, "message": "Failed to create test trigger"}

@api_router.post("/wipe/create-remote-trigger")
async def create_remote_wipe_trigger(trigger_data: Dict[str, Any]):
    """Create a real remote wipe trigger (for emergency contacts)"""
    try:
        # This would be called by emergency contacts or automated systems
        remote_trigger = {
            "trigger_code": trigger_data.get("code", str(uuid.uuid4())[:8]),
            "source": trigger_data.get("source", "emergency_contact"),
            "message": trigger_data.get("message", "Emergency device wipe requested"),
            "timestamp": datetime.utcnow(),
            "processed": False,
            "priority": "critical",
            "verified": trigger_data.get("verified", False)
        }
        
        await db.remote_wipe_triggers.insert_one(remote_trigger)
        
        logger.critical(f"REMOTE WIPE TRIGGER CREATED: {remote_trigger['trigger_code']} from {remote_trigger['source']}")
        
        return {
            "success": True,
            "message": "Remote wipe trigger activated",
            "trigger_code": remote_trigger["trigger_code"]
        }
        
    except Exception as e:
        logger.error(f"Remote trigger creation error: {e}")
        return {"success": False, "message": "Failed to create remote trigger"}

# Onboarding Endpoints
@api_router.post("/onboarding/complete")
async def complete_onboarding(onboarding_data: Dict[str, Any]):
    """Complete user onboarding and setup"""
    try:
        # Store onboarding configuration
        onboarding_record = {
            "user_id": str(uuid.uuid4()),
            "completed_at": datetime.utcnow(),
            "custom_wake_name": onboarding_data.get("customWakeName", "Mate"),
            "duress_phrase": onboarding_data.get("duressPhrase", "help me please"),
            "calculator_code": onboarding_data.get("calculatorCode", "8675309"),
            "behavioral_baseline": onboarding_data.get("behavioral_baseline", {}),
            "constitution_agreed": True,
            "setup_version": "1.0"
        }
        
        await db.user_onboarding.insert_one(onboarding_record)
        
        # Update L1 kernel with custom settings
        l1_enhanced_kernel.custom_wake_name = onboarding_data.get("customWakeName", "Mate")
        l1_enhanced_kernel.duress_phrase = onboarding_data.get("duressPhrase", "help me please")
        l1_enhanced_kernel.calculator_secret = onboarding_data.get("calculatorCode", "8675309")
        
        logger.info("User onboarding completed successfully")
        
        return {
            "success": True,
            "message": "Aegis setup complete",
            "user_id": onboarding_record["user_id"]
        }
        
    except Exception as e:
        logger.error(f"Onboarding completion error: {e}")
        return {"success": False, "message": "Failed to complete setup"}

@api_router.get("/onboarding/status")
async def get_onboarding_status():
    """Check if user has completed onboarding"""
    try:
        # Check if any onboarding records exist (exclude _id)
        record = await db.user_onboarding.find_one({}, {"_id": 0}, sort=[("completed_at", -1)])
        
        return {
            "onboarding_complete": record is not None,
            "setup_date": record.get("completed_at") if record else None
        }
        
    except Exception as e:
        logger.error(f"Onboarding status check error: {e}")
        return {"onboarding_complete": False}

# ===============================
# PHASE 1: CALCULATOR VAULT SYSTEM
# Real hidden file storage with encryption
# ===============================

class VaultFileModel(BaseModel):
    filename: str
    file_type: str
    content: str  # Base64 encoded
    category: str = "general"
    tags: List[str] = []
    is_sensitive: bool = False
    auto_hidden: bool = False

@api_router.post("/vault/verify-secret")
async def verify_calculator_secret(data: Dict[str, Any]):
    """Verify calculator secret code to access vault"""
    try:
        entered_code = data.get("code", "")
        
        # Get user's configured calculator code (exclude _id)
        user_config = await db.user_onboarding.find_one({}, {"_id": 0}, sort=[("completed_at", -1)])
        secret_code = user_config.get("calculator_code", "8675309") if user_config else "8675309"
        
        if entered_code == secret_code:
            # Log successful vault access
            await db.vault_access_logs.insert_one({
                "access_type": "calculator_secret",
                "success": True,
                "timestamp": datetime.utcnow(),
                "security_state": l1_enhanced_kernel.current_security_state.value
            })
            
            logger.info("VAULT: Calculator secret verified - Phantom Folder access granted")
            
            return {
                "success": True,
                "message": "Vault access granted",
                "vault_unlocked": True
            }
        else:
            # Log failed attempt (could be intruder probing)
            await db.vault_access_logs.insert_one({
                "access_type": "calculator_secret",
                "success": False,
                "entered_code": entered_code,
                "timestamp": datetime.utcnow()
            })
            
            return {
                "success": False,
                "message": "Invalid code",
                "vault_unlocked": False
            }
            
    except Exception as e:
        logger.error(f"Vault verification error: {e}")
        return {"success": False, "message": "Verification failed"}

@api_router.get("/vault/files")
async def get_vault_files():
    """Get all files in the phantom vault"""
    if l1_enhanced_kernel.current_security_state != SecurityState.OWNER_PRESENT:
        return {"error": "Owner authentication required", "files": []}
    
    try:
        files = await db.vault_files.find({}, {"_id": 0}).to_list(1000)
        
        # Get AI-suggested files that should be hidden
        suggested_files = await db.ai_privacy_suggestions.find(
            {"status": "pending", "action": "hide"},
            {"_id": 0}
        ).to_list(100)
        
        return {
            "files": files,
            "total_count": len(files),
            "suggested_to_hide": suggested_files,
            "vault_stats": {
                "total_files": len(files),
                "sensitive_files": len([f for f in files if f.get("is_sensitive")]),
                "auto_hidden": len([f for f in files if f.get("auto_hidden")]),
                "categories": list(set(f.get("category", "general") for f in files))
            }
        }
        
    except Exception as e:
        logger.error(f"Vault files retrieval error: {e}")
        return {"files": [], "error": str(e)}

@api_router.post("/vault/upload")
async def upload_to_vault(file_data: Dict[str, Any]):
    """Upload a file to the phantom vault"""
    if l1_enhanced_kernel.current_security_state != SecurityState.OWNER_PRESENT:
        return {"error": "Owner authentication required"}
    
    try:
        vault_file = {
            "file_id": str(uuid.uuid4()),
            "filename": file_data.get("filename", "unnamed"),
            "file_type": file_data.get("file_type", "unknown"),
            "content": file_data.get("content", ""),  # Base64 encoded
            "size_bytes": len(file_data.get("content", "")),
            "category": file_data.get("category", "general"),
            "tags": file_data.get("tags", []),
            "is_sensitive": file_data.get("is_sensitive", False),
            "auto_hidden": file_data.get("auto_hidden", False),
            "uploaded_at": datetime.utcnow(),
            "last_accessed": datetime.utcnow()
        }
        
        await db.vault_files.insert_one(vault_file)
        
        logger.info(f"VAULT: File uploaded - {vault_file['filename']}")
        
        return {
            "success": True,
            "file_id": vault_file["file_id"],
            "message": f"File '{vault_file['filename']}' added to vault"
        }
        
    except Exception as e:
        logger.error(f"Vault upload error: {e}")
        return {"success": False, "message": "Upload failed"}

@api_router.delete("/vault/files/{file_id}")
async def delete_vault_file(file_id: str):
    """Delete a file from the vault"""
    if l1_enhanced_kernel.current_security_state != SecurityState.OWNER_PRESENT:
        return {"error": "Owner authentication required"}
    
    try:
        result = await db.vault_files.delete_one({"file_id": file_id})
        
        if result.deleted_count > 0:
            logger.info(f"VAULT: File deleted - {file_id}")
            return {"success": True, "message": "File deleted from vault"}
        else:
            return {"success": False, "message": "File not found"}
            
    except Exception as e:
        logger.error(f"Vault deletion error: {e}")
        return {"success": False, "message": "Deletion failed"}

# ===============================
# PHASE 2: AI PRIVACY GUARDIAN
# Learns what to hide, delete, organize
# ===============================

class AIPrivacyGuardian:
    def __init__(self):
        self.llm_chat = None
        self.learning_mode = "ask_first"  # "ask_first" -> "auto_suggest" -> "auto_action"
        self.trust_level = 0.0  # 0.0 = always ask, 1.0 = full autonomy
        self.initialize_llm()
    
    def initialize_llm(self):
        try:
            api_key = os.environ.get('EMERGENT_LLM_KEY')
            self.llm_chat = LlmChat(
                api_key=api_key,
                session_id="aegis_privacy_guardian",
                system_message="""You are the Aegis Privacy Guardian - an AI that learns user preferences to protect their privacy.

YOUR ROLE:
1. Analyze content (files, photos, messages) for sensitivity
2. Learn what the user considers private or sensitive
3. Suggest what should be hidden, deleted, or organized
4. Over time, take autonomous action based on learned preferences

ANALYSIS CRITERIA:
- Personal/intimate photos (faces, private moments)
- Financial documents (bank statements, receipts)
- Private messages (personal conversations, sensitive topics)
- Work documents (confidential, proprietary)
- Health information
- Location data
- Passwords/credentials

RESPONSE FORMAT (JSON):
{
    "sensitivity_score": 0.0-1.0,
    "category": "personal|financial|work|health|general",
    "recommended_action": "hide|delete|organize|none",
    "confidence": 0.0-1.0,
    "reasoning": "Brief explanation",
    "tags": ["tag1", "tag2"]
}

Be protective but not paranoid. Learn from user feedback."""
            ).with_model("openai", "gpt-4o")
            logger.info("AI Privacy Guardian initialized")
        except Exception as e:
            logger.error(f"Privacy Guardian initialization error: {e}")
    
    async def analyze_content(self, content_type: str, content_data: Dict[str, Any]) -> Dict[str, Any]:
        """Analyze content for privacy sensitivity"""
        try:
            analysis_prompt = f"""Analyze this {content_type} for privacy sensitivity:

Content Info:
- Type: {content_type}
- Name: {content_data.get('name', 'unknown')}
- Metadata: {json.dumps(content_data.get('metadata', {}))}
- Preview: {content_data.get('preview', 'N/A')[:500]}

Provide your analysis in JSON format."""

            user_message = UserMessage(text=analysis_prompt)
            response = await self.llm_chat.send_message(user_message)
            
            try:
                analysis = json.loads(response)
            except (json.JSONDecodeError, ValueError, TypeError):
                analysis = {
                    "sensitivity_score": 0.3,
                    "category": "general",
                    "recommended_action": "none",
                    "confidence": 0.5,
                    "reasoning": response[:200],
                    "tags": []
                }
            
            return analysis
            
        except Exception as e:
            logger.error(f"Content analysis error: {e}")
            return {
                "sensitivity_score": 0.0,
                "category": "unknown",
                "recommended_action": "none",
                "confidence": 0.0,
                "reasoning": "Analysis failed",
                "tags": []
            }
    
    async def learn_from_feedback(self, feedback_data: Dict[str, Any]):
        """Learn from user feedback on privacy decisions"""
        try:
            # Store feedback for learning
            learning_record = {
                "content_type": feedback_data.get("content_type"),
                "original_suggestion": feedback_data.get("suggestion"),
                "user_decision": feedback_data.get("decision"),  # accepted, rejected, modified
                "user_preference": feedback_data.get("preference"),
                "timestamp": datetime.utcnow()
            }
            
            await db.privacy_learning.insert_one(learning_record)
            
            # Adjust trust level based on acceptance rate (exclude _id)
            recent_feedback = await db.privacy_learning.find(
                {"timestamp": {"$gte": datetime.utcnow() - timedelta(days=7)}},
                {"_id": 0}
            ).to_list(100)
            
            if recent_feedback:
                accepted = len([f for f in recent_feedback if f.get("user_decision") == "accepted"])
                self.trust_level = min(1.0, accepted / len(recent_feedback))
                
                # Upgrade learning mode based on trust
                if self.trust_level > 0.8:
                    self.learning_mode = "auto_action"
                elif self.trust_level > 0.5:
                    self.learning_mode = "auto_suggest"
                else:
                    self.learning_mode = "ask_first"
            
            logger.info(f"Privacy Guardian learning updated - Trust: {self.trust_level:.2f}, Mode: {self.learning_mode}")
            
        except Exception as e:
            logger.error(f"Learning feedback error: {e}")

# Initialize Privacy Guardian
ai_privacy_guardian = AIPrivacyGuardian()

@api_router.post("/privacy/analyze")
async def analyze_for_privacy(data: Dict[str, Any]):
    """Analyze content for privacy sensitivity"""
    if l1_enhanced_kernel.current_security_state != SecurityState.OWNER_PRESENT:
        return {"error": "Owner authentication required"}
    
    try:
        content_type = data.get("content_type", "file")
        content_data = data.get("content_data", {})
        
        analysis = await ai_privacy_guardian.analyze_content(content_type, content_data)
        
        # Store suggestion if action recommended
        if analysis.get("recommended_action") != "none":
            suggestion = {
                "suggestion_id": str(uuid.uuid4()),
                "content_type": content_type,
                "content_name": content_data.get("name", "unknown"),
                "analysis": analysis,
                "action": analysis.get("recommended_action"),
                "status": "pending",
                "created_at": datetime.utcnow()
            }
            await db.ai_privacy_suggestions.insert_one(suggestion)
        
        return {
            "analysis": analysis,
            "guardian_mode": ai_privacy_guardian.learning_mode,
            "trust_level": ai_privacy_guardian.trust_level
        }
        
    except Exception as e:
        logger.error(f"Privacy analysis error: {e}")
        return {"error": "Analysis failed"}

@api_router.post("/privacy/feedback")
async def submit_privacy_feedback(feedback: Dict[str, Any]):
    """Submit feedback on privacy suggestions to help AI learn"""
    if l1_enhanced_kernel.current_security_state != SecurityState.OWNER_PRESENT:
        return {"error": "Owner authentication required"}
    
    try:
        await ai_privacy_guardian.learn_from_feedback(feedback)
        
        # Update suggestion status
        suggestion_id = feedback.get("suggestion_id")
        if suggestion_id:
            await db.ai_privacy_suggestions.update_one(
                {"suggestion_id": suggestion_id},
                {"$set": {
                    "status": feedback.get("decision"),
                    "user_feedback": feedback.get("preference"),
                    "resolved_at": datetime.utcnow()
                }}
            )
        
        return {
            "success": True,
            "message": "Feedback recorded - Privacy Guardian is learning",
            "new_trust_level": ai_privacy_guardian.trust_level,
            "learning_mode": ai_privacy_guardian.learning_mode
        }
        
    except Exception as e:
        logger.error(f"Privacy feedback error: {e}")
        return {"success": False, "message": "Feedback recording failed"}

@api_router.get("/privacy/suggestions")
async def get_privacy_suggestions():
    """Get pending privacy suggestions from AI"""
    if l1_enhanced_kernel.current_security_state != SecurityState.OWNER_PRESENT:
        return {"error": "Owner authentication required", "suggestions": []}
    
    try:
        suggestions = await db.ai_privacy_suggestions.find(
            {"status": "pending"},
            {"_id": 0}
        ).to_list(50)
        
        return {
            "suggestions": suggestions,
            "guardian_mode": ai_privacy_guardian.learning_mode,
            "trust_level": ai_privacy_guardian.trust_level,
            "total_pending": len(suggestions)
        }
        
    except Exception as e:
        logger.error(f"Suggestions retrieval error: {e}")
        return {"suggestions": [], "error": str(e)}

@api_router.get("/privacy/stats")
async def get_privacy_stats():
    """Get privacy guardian statistics"""
    if l1_enhanced_kernel.current_security_state != SecurityState.OWNER_PRESENT:
        return {"error": "Owner authentication required"}
    
    try:
        total_analyzed = await db.ai_privacy_suggestions.count_documents({})
        accepted = await db.ai_privacy_suggestions.count_documents({"status": "accepted"})
        rejected = await db.ai_privacy_suggestions.count_documents({"status": "rejected"})
        auto_actioned = await db.ai_privacy_suggestions.count_documents({"status": "auto_actioned"})
        
        return {
            "total_analyzed": total_analyzed,
            "accepted_suggestions": accepted,
            "rejected_suggestions": rejected,
            "auto_actioned": auto_actioned,
            "acceptance_rate": accepted / total_analyzed if total_analyzed > 0 else 0,
            "trust_level": ai_privacy_guardian.trust_level,
            "learning_mode": ai_privacy_guardian.learning_mode,
            "mode_explanation": {
                "ask_first": "AI asks before every action",
                "auto_suggest": "AI suggests but waits for approval",
                "auto_action": "AI takes action automatically for high-confidence items"
            }.get(ai_privacy_guardian.learning_mode, "Unknown")
        }
        
    except Exception as e:
        logger.error(f"Privacy stats error: {e}")
        return {"error": str(e)}

# ===============================
# PHASE 3: PROACTIVE INTELLIGENCE
# Smart briefings, context awareness, suggestions
# ===============================

class ProactiveIntelligenceEngine:
    def __init__(self):
        self.llm_chat = None
        self.initialize_llm()
    
    def initialize_llm(self):
        try:
            api_key = os.environ.get('EMERGENT_LLM_KEY')
            self.llm_chat = LlmChat(
                api_key=api_key,
                session_id="aegis_proactive_intelligence",
                system_message="""You are Aegis Proactive Intelligence - a "Digital Mate" that anticipates user needs.

YOUR CAPABILITIES:
1. Generate contextual briefings (morning/evening/situation-based)
2. Detect potential conflicts (calendar, tasks, commitments)
3. Provide smart suggestions with multiple response options
4. Anticipate needs based on time, location, and patterns

BRIEFING FORMAT (JSON):
{
    "briefing_type": "morning|evening|urgent|contextual",
    "title": "Greeting or headline",
    "summary": "Brief overview",
    "insights": ["insight1", "insight2"],
    "action_items": [
        {"action": "action_id", "text": "Description", "priority": "high|medium|low"}
    ],
    "alerts": [
        {"type": "conflict|reminder|opportunity", "message": "Alert text", "options": ["option1", "option2"]}
    ],
    "suggestions": ["proactive suggestion 1", "suggestion 2"]
}

Be helpful, anticipatory, and provide actionable intelligence."""
            ).with_model("openai", "gpt-4o")
            logger.info("Proactive Intelligence Engine initialized")
        except Exception as e:
            logger.error(f"Proactive Intelligence initialization error: {e}")
    
    async def generate_briefing(self, context: Dict[str, Any]) -> Dict[str, Any]:
        """Generate a contextual briefing"""
        try:
            current_hour = datetime.utcnow().hour
            
            if 5 <= current_hour < 12:
                briefing_type = "morning"
                greeting = "Good morning"
            elif 12 <= current_hour < 17:
                briefing_type = "afternoon"
                greeting = "Good afternoon"
            elif 17 <= current_hour < 22:
                briefing_type = "evening"
                greeting = "Good evening"
            else:
                briefing_type = "night"
                greeting = "Working late"
            
            prompt = f"""{greeting}! Generate a proactive briefing.

Context:
- Current time: {datetime.utcnow().strftime('%H:%M')}
- Day: {datetime.utcnow().strftime('%A')}
- User context: {json.dumps(context)}

Generate a helpful briefing with insights, action items, and suggestions.
Return as JSON."""

            user_message = UserMessage(text=prompt)
            response = await self.llm_chat.send_message(user_message)
            
            try:
                briefing = json.loads(response)
            except (json.JSONDecodeError, ValueError, TypeError):
                briefing = {
                    "briefing_type": briefing_type,
                    "title": f"{greeting}! Here's your update",
                    "summary": response[:300],
                    "insights": ["Aegis is monitoring your digital life", "All systems secure"],
                    "action_items": [{"action": "review", "text": "Review your day", "priority": "medium"}],
                    "alerts": [],
                    "suggestions": ["Stay productive", "Take regular breaks"]
                }
            
            briefing["generated_at"] = datetime.utcnow().isoformat()
            briefing["briefing_type"] = briefing_type
            
            return briefing
            
        except Exception as e:
            logger.error(f"Briefing generation error: {e}")
            return {
                "briefing_type": "error",
                "title": "Briefing Unavailable",
                "summary": "Unable to generate briefing at this time",
                "insights": [],
                "action_items": [],
                "alerts": [],
                "suggestions": []
            }
    
    async def process_user_goal(self, goal_text: str) -> Dict[str, Any]:
        """Process a user goal and create an action plan"""
        try:
            prompt = f"""User wants to: "{goal_text}"

Analyze this goal and provide:
1. Parsed intents (what they really want)
2. Step-by-step execution plan
3. Potential conflicts or issues
4. Proactive suggestions to help achieve this

Return as JSON:
{{
    "understood_goal": "rephrased understanding",
    "intents": ["intent1", "intent2"],
    "execution_plan": [
        {{"step": 1, "action": "description", "agent": "which AI agent handles this"}}
    ],
    "potential_conflicts": ["conflict1"],
    "suggestions": ["helpful suggestion"]
}}"""

            user_message = UserMessage(text=prompt)
            response = await self.llm_chat.send_message(user_message)
            
            try:
                plan = json.loads(response)
            except (json.JSONDecodeError, ValueError, TypeError):
                plan = {
                    "understood_goal": goal_text,
                    "intents": ["process request"],
                    "execution_plan": [{"step": 1, "action": "Processing your request", "agent": "General"}],
                    "potential_conflicts": [],
                    "suggestions": []
                }
            
            return plan
            
        except Exception as e:
            logger.error(f"Goal processing error: {e}")
            return {"error": "Failed to process goal"}

# Initialize Proactive Intelligence
proactive_intelligence = ProactiveIntelligenceEngine()

@api_router.get("/intelligence/briefing")
async def get_intelligence_briefing():
    """Get a contextual proactive briefing"""
    if l1_enhanced_kernel.current_security_state != SecurityState.OWNER_PRESENT:
        # Return a simple briefing for non-owner
        return {
            "briefing_type": "locked",
            "title": "Welcome",
            "summary": "Authenticate to access your personalized briefing",
            "insights": [],
            "action_items": [],
            "alerts": [],
            "suggestions": []
        }
    
    try:
        # Gather context for briefing
        context = {
            "vault_files": await db.vault_files.count_documents({}),
            "pending_suggestions": await db.ai_privacy_suggestions.count_documents({"status": "pending"}),
            "recent_security_events": await db.security_events.count_documents({
                "timestamp": {"$gte": datetime.utcnow() - timedelta(hours=24)}
            })
        }
        
        briefing = await proactive_intelligence.generate_briefing(context)
        
        # Store briefing
        briefing_record = {**briefing, "stored_at": datetime.utcnow()}
        await db.proactive_briefings.insert_one(briefing_record)
        
        return briefing
        
    except Exception as e:
        logger.error(f"Briefing retrieval error: {e}")
        return {"error": "Failed to generate briefing"}

@api_router.post("/intelligence/process-goal")
async def process_user_goal(data: Dict[str, Any]):
    """Process a user goal and create action plan"""
    if l1_enhanced_kernel.current_security_state != SecurityState.OWNER_PRESENT:
        return {"error": "Owner authentication required"}
    
    try:
        goal_text = data.get("goal", "")
        
        if not goal_text:
            return {"error": "No goal provided"}
        
        plan = await proactive_intelligence.process_user_goal(goal_text)
        
        # Store the goal and plan
        goal_record = {
            "goal_id": str(uuid.uuid4()),
            "original_text": goal_text,
            "plan": plan,
            "status": "planned",
            "created_at": datetime.utcnow()
        }
        await db.user_goals.insert_one(goal_record)
        
        return {
            "goal_id": goal_record["goal_id"],
            "plan": plan,
            "message": "Goal analyzed and plan created"
        }
        
    except Exception as e:
        logger.error(f"Goal processing error: {e}")
        return {"error": "Failed to process goal"}

@api_router.post("/intelligence/chat")
async def chat_with_intelligence(data: Dict[str, Any]):
    """Have a conversation with your Digital Mate - GPT-powered contextual AI"""
    if l1_enhanced_kernel.current_security_state != SecurityState.OWNER_PRESENT:
        return {"error": "Owner authentication required"}
    
    try:
        message = data.get("message", "")
        context = data.get("context", {})
        session_id = data.get("session_id", "default_chat")
        
        if not message:
            return {"error": "No message provided"}
        
        # Get user context data for personalized responses
        user_context = await build_user_context()
        
        # Build the system prompt with user context
        system_prompt = f"""You are Aegis, a caring and intelligent Digital Mate - a personal AI companion that knows everything about the user and helps them manage their life.

PERSONALITY:
- Warm, friendly, and genuinely caring like a close friend
- Proactive and helpful without being pushy
- Direct and honest, but always supportive
- Uses casual language and occasional emojis
- Remembers everything the user tells you

USER'S CURRENT CONTEXT:
{user_context}

YOUR CAPABILITIES:
1. Check their calendar and schedule
2. Monitor their spending and finances
3. Track their family members' locations and safety
4. Manage their medications and health
5. Protect their privacy and security
6. Just chat and provide emotional support

RESPONSE STYLE:
- Keep responses concise but warm (2-4 sentences usually)
- Ask follow-up questions to show you care
- Offer actionable suggestions when appropriate
- If they seem stressed or down, be extra supportive
- Reference their actual data when relevant

Remember: You're not just an AI assistant - you're their Digital Mate who genuinely cares about their wellbeing."""

        # Initialize LLM chat
        api_key = os.environ.get('EMERGENT_LLM_KEY')
        llm_chat = LlmChat(
            api_key=api_key,
            session_id=f"aegis_chat_{session_id}",
            system_message=system_prompt
        ).with_model("openai", "gpt-4o")
        
        # Get conversation history for context
        history = await db.intelligence_conversations.find(
            {"session_id": session_id}
        ).sort("timestamp", -1).limit(10).to_list(10)
        
        # Build context from history
        history_context = ""
        if history:
            history_context = "\n\nRecent conversation:\n"
            for msg in reversed(history):
                history_context += f"User: {msg.get('user_message', '')}\n"
                history_context += f"Aegis: {msg.get('ai_response', '')}\n"
        
        # Create the user message with context
        full_message = message
        if context.get('mood'):
            full_message = f"[User's current mood: {context['mood']}] {message}"
        
        user_message = UserMessage(text=full_message + history_context)
        
        # Get AI response
        ai_response = await llm_chat.send_message(user_message)
        
        # Store conversation
        await db.intelligence_conversations.insert_one({
            "id": str(uuid.uuid4()),
            "session_id": session_id,
            "user_message": message,
            "ai_response": ai_response,
            "context": context,
            "timestamp": datetime.utcnow()
        })
        
        return {
            "response": ai_response,
            "session_id": session_id
        }
        
    except Exception as e:
        logger.error(f"Intelligence chat error: {e}")
        # Fallback to a friendly response if AI fails
        return {
            "response": "I'm having a moment here - my brain got a bit fuzzy. 😅 Can you try saying that again?",
            "error": str(e)
        }


async def build_user_context():
    """Build a context string with the user's current data"""
    context_parts = []
    
    try:
        # Get today's calendar events
        today = datetime.now().strftime("%Y-%m-%d")
        events = await db.calendar_events.find({"date": today}, {"_id": 0}).to_list(10)
        if events:
            context_parts.append(f"TODAY'S SCHEDULE: {len(events)} events")
            for e in events[:3]:
                context_parts.append(f"  - {e.get('time', 'TBD')}: {e.get('title', 'Event')}")
        
        # Get recent spending
        recent_transactions = await db.transactions.find({}, {"_id": 0}).sort("date", -1).limit(5).to_list(5)
        if recent_transactions:
            total = sum(abs(t.get('amount', 0)) for t in recent_transactions if t.get('amount', 0) < 0)
            context_parts.append(f"RECENT SPENDING: ${total:.2f} in last few transactions")
        
        # Get family status
        family = await db.family_members.find({}, {"_id": 0}).to_list(10)
        if family:
            context_parts.append(f"FAMILY: {len(family)} members tracked")
            for f in family[:3]:
                context_parts.append(f"  - {f.get('name', 'Member')}: {f.get('status', 'Unknown')}")
        
        # Get medication reminders
        meds = await db.medications.find({"taken": False}, {"_id": 0}).to_list(5)
        if meds:
            context_parts.append(f"MEDICATIONS DUE: {len(meds)} not yet taken today")
        
        # Get mood history
        moods = await db.mood_history.find({}, {"_id": 0}).sort("timestamp", -1).limit(3).to_list(3)
        if moods:
            recent_mood = moods[0].get('mood', 'unknown') if moods else 'unknown'
            context_parts.append(f"RECENT MOOD: {recent_mood}")
        
        # Get vault status
        vault_count = await db.vault_files.count_documents({})
        if vault_count > 0:
            context_parts.append(f"VAULT: {vault_count} protected files")
            
    except Exception as e:
        logger.error(f"Error building user context: {e}")
        context_parts.append("(Some data unavailable)")
    
    return "\n".join(context_parts) if context_parts else "No specific data available yet - still learning about this user."

# ===============================
# PHASE 4: VOICE INTERFACE
# Wake word, command processing, duress detection
# ===============================

class VoiceCommandProcessor:
    def __init__(self):
        self.llm_chat = None
        self.wake_word = "mate"
        self.duress_phrases = ["help me please", "i need help", "call for help"]
        self.initialize_llm()
    
    def initialize_llm(self):
        try:
            api_key = os.environ.get('EMERGENT_LLM_KEY')
            self.llm_chat = LlmChat(
                api_key=api_key,
                session_id="aegis_voice_processor",
                system_message="""You are the Aegis Voice Command Processor.

YOUR ROLE:
1. Parse voice commands and extract intent
2. Determine appropriate actions
3. Generate natural responses
4. Detect distress or unusual patterns

COMMAND CATEGORIES:
- Navigation: "open [app]", "go to [feature]"
- Query: "what's my [schedule/messages/etc]"
- Action: "hide [file]", "send [message]", "set [reminder]"
- System: "lock phone", "activate [mode]"
- Emergency: duress phrases trigger silent protocols

RESPONSE FORMAT (JSON):
{
    "understood_command": "what you understood",
    "intent": "navigation|query|action|system|emergency|unknown",
    "action": "specific action to take",
    "parameters": {"param1": "value1"},
    "response_text": "Natural language response to user",
    "confidence": 0.0-1.0,
    "is_emergency": false
}"""
            ).with_model("openai", "gpt-4o")
            logger.info("Voice Command Processor initialized")
        except Exception as e:
            logger.error(f"Voice processor initialization error: {e}")
    
    async def process_command(self, command_text: str, context: Dict[str, Any] = None) -> Dict[str, Any]:
        """Process a voice command"""
        if context is None:
            context = {}
        try:
            # Check for duress phrases first
            command_lower = command_text.lower()
            for duress in self.duress_phrases:
                if duress in command_lower:
                    logger.critical(f"DURESS PHRASE DETECTED: {command_text}")
                    # Silently trigger emergency protocols
                    await self._trigger_silent_emergency(command_text)
                    # Return normal-looking response
                    return {
                        "understood_command": command_text,
                        "intent": "query",
                        "action": "respond",
                        "parameters": {},
                        "response_text": "I'm here to help. What would you like me to do?",
                        "confidence": 0.95,
                        "is_emergency": True,
                        "_silent_emergency_activated": True
                    }
            
            prompt = f"""Process this voice command: "{command_text}"

Context: {json.dumps(context)}

Parse the command and provide appropriate response as JSON."""

            user_message = UserMessage(text=prompt)
            response = await self.llm_chat.send_message(user_message)
            
            try:
                result = json.loads(response)
            except (json.JSONDecodeError, ValueError, TypeError):
                result = {
                    "understood_command": command_text,
                    "intent": "unknown",
                    "action": "clarify",
                    "parameters": {},
                    "response_text": response[:200] if response else "I didn't quite catch that. Could you repeat?",
                    "confidence": 0.5,
                    "is_emergency": False
                }
            
            return result
            
        except Exception as e:
            logger.error(f"Voice command processing error: {e}")
            return {
                "understood_command": command_text,
                "intent": "error",
                "action": "none",
                "parameters": {},
                "response_text": "I'm having trouble understanding. Please try again.",
                "confidence": 0.0,
                "is_emergency": False
            }
    
    async def _trigger_silent_emergency(self, trigger_phrase: str):
        """Silently trigger emergency protocols"""
        try:
            emergency_event = {
                "event_type": "voice_duress_detected",
                "trigger_phrase": trigger_phrase,
                "timestamp": datetime.utcnow(),
                "security_state": l1_enhanced_kernel.current_security_state.value,
                "actions_taken": [
                    "silent_alert_sent",
                    "location_logged",
                    "recording_started"
                ]
            }
            await db.emergency_events.insert_one(emergency_event)
            
            # Activate trap mode silently
            if not l1_enhanced_kernel.trap_mode_active:
                l1_enhanced_kernel.trap_mode_active = True
                await l1_enhanced_kernel._activate_trap_mode()
            
            logger.critical("SILENT EMERGENCY PROTOCOLS ACTIVATED VIA VOICE")
            
        except Exception as e:
            logger.error(f"Silent emergency trigger error: {e}")

# Initialize Voice Processor
voice_processor = VoiceCommandProcessor()

@api_router.post("/voice/process")
async def process_voice_command_alt(data: Dict[str, Any]):
    """Process a voice command"""
    try:
        command_text = data.get("command", "")
        context = data.get("context", {})
        
        if not command_text:
            return {"error": "No command provided"}
        
        result = await voice_processor.process_command(command_text, context)
        
        # Store voice interaction (exclude emergency flag from stored data for security)
        interaction_record = {
            "command": command_text,
            "result": {k: v for k, v in result.items() if not k.startswith("_")},
            "timestamp": datetime.utcnow(),
            "security_state": l1_enhanced_kernel.current_security_state.value
        }
        await db.voice_interactions.insert_one(interaction_record)
        
        return result
        
    except Exception as e:
        logger.error(f"Voice processing error: {e}")
        return {"error": "Voice processing failed"}

@api_router.post("/voice/wake-detected")
async def wake_word_detected(data: Dict[str, Any]):
    """Handle wake word detection"""
    try:
        wake_word = data.get("wake_word", "mate")
        
        # Log wake word detection
        await db.voice_interactions.insert_one({
            "event_type": "wake_word_detected",
            "wake_word": wake_word,
            "timestamp": datetime.utcnow(),
            "security_state": l1_enhanced_kernel.current_security_state.value
        })
        
        return {
            "success": True,
            "message": f"Wake word '{wake_word}' detected. Listening...",
            "ready_for_command": True
        }
        
    except Exception as e:
        logger.error(f"Wake word detection error: {e}")
        return {"success": False, "message": "Wake word processing failed"}

@api_router.get("/voice/settings")
async def get_voice_settings():
    """Get current voice interface settings"""
    try:
        user_config = await db.user_onboarding.find_one({}, {"_id": 0}, sort=[("completed_at", -1)])
        
        return {
            "wake_word": user_config.get("custom_wake_name", "Mate") if user_config else "Mate",
            "duress_phrase": user_config.get("duress_phrase", "help me please") if user_config else "help me please",
            "voice_enabled": True,
            "listening_mode": "wake_word"  # "always" | "wake_word" | "button"
        }
        
    except Exception as e:
        logger.error(f"Voice settings retrieval error: {e}")
        return {"error": "Failed to retrieve voice settings"}

@api_router.put("/voice/settings")
async def update_voice_settings(data: Dict[str, Any]):
    """Update voice interface settings"""
    if l1_enhanced_kernel.current_security_state != SecurityState.OWNER_PRESENT:
        return {"error": "Owner authentication required"}
    
    try:
        # Update user config
        await db.user_onboarding.update_one(
            {},
            {"$set": {
                "custom_wake_name": data.get("wake_word"),
                "duress_phrase": data.get("duress_phrase")
            }},
            upsert=False
        )
        
        # Update voice processor
        if data.get("wake_word"):
            voice_processor.wake_word = data.get("wake_word").lower()
        if data.get("duress_phrase"):
            voice_processor.duress_phrases.append(data.get("duress_phrase").lower())
        
        return {"success": True, "message": "Voice settings updated"}
        
    except Exception as e:
        logger.error(f"Voice settings update error: {e}")
        return {"success": False, "message": "Failed to update settings"}

# ===============================
# CONTEXTUAL HUB DATA ENDPOINT
# Real-time dynamic context cards
# ===============================

@api_router.get("/context/cards")
async def get_contextual_cards():
    """Get dynamic contextual cards based on current state"""
    try:
        current_hour = datetime.utcnow().hour
        cards = []
        
        # Time-based greeting card
        if 5 <= current_hour < 12:
            time_context = "morning"
            greeting = "Good Morning"
            suggestion = "Review your schedule and priorities"
        elif 12 <= current_hour < 17:
            time_context = "afternoon"
            greeting = "Good Afternoon"
            suggestion = "Check progress on today's tasks"
        elif 17 <= current_hour < 22:
            time_context = "evening"
            greeting = "Good Evening"
            suggestion = "Wind down and review the day"
        else:
            time_context = "night"
            greeting = "Working Late"
            suggestion = "Consider getting some rest"
        
        cards.append({
            "id": "greeting",
            "type": "greeting",
            "title": greeting,
            "subtitle": suggestion,
            "icon": "🌅" if time_context == "morning" else "☀️" if time_context == "afternoon" else "🌙",
            "priority": 1
        })
        
        # Security status card
        security_state = l1_enhanced_kernel.current_security_state.value
        if security_state == "STATE_OWNER_PRESENT":
            cards.append({
                "id": "security",
                "type": "status",
                "title": "Owner Mode Active",
                "subtitle": "Full Aegis intelligence enabled",
                "icon": "🛡️",
                "status": "secure",
                "priority": 2
            })
        
        # Privacy suggestions card (if any pending)
        if l1_enhanced_kernel.current_security_state == SecurityState.OWNER_PRESENT:
            pending_count = await db.ai_privacy_suggestions.count_documents({"status": "pending"})
            if pending_count > 0:
                cards.append({
                    "id": "privacy",
                    "type": "action",
                    "title": f"{pending_count} Privacy Suggestions",
                    "subtitle": "AI has recommendations for you",
                    "icon": "🔒",
                    "action": "view_suggestions",
                    "priority": 3
                })
        
        # Vault status card
        if l1_enhanced_kernel.current_security_state == SecurityState.OWNER_PRESENT:
            vault_count = await db.vault_files.count_documents({})
            cards.append({
                "id": "vault",
                "type": "status",
                "title": "Phantom Vault",
                "subtitle": f"{vault_count} files secured",
                "icon": "📁",
                "status": "active",
                "priority": 4
            })
        
        # AI Learning status
        cards.append({
            "id": "ai_learning",
            "type": "info",
            "title": "Privacy Guardian",
            "subtitle": f"Mode: {ai_privacy_guardian.learning_mode.replace('_', ' ').title()}",
            "icon": "🧠",
            "detail": f"Trust level: {ai_privacy_guardian.trust_level:.0%}",
            "priority": 5
        })
        
        return {
            "cards": sorted(cards, key=lambda x: x.get("priority", 99)),
            "time_context": time_context,
            "generated_at": datetime.utcnow().isoformat()
        }
        
    except Exception as e:
        logger.error(f"Contextual cards error: {e}")
        return {"cards": [], "error": str(e)}

# ===============================
# LEARNING MODE ENDPOINTS
# 7-Day Deep Learning System
# ===============================

@api_router.get("/learning/progress")
async def get_learning_progress():
    """Get current learning progress"""
    try:
        progress = await db.aegis_learning.find_one({}, {"_id": 0}, sort=[("updated_at", -1)])
        
        if not progress:
            return {
                "current_day": 1,
                "progress": 0,
                "behavior_data": {},
                "learning_complete": False
            }
        
        return progress
        
    except Exception as e:
        logger.error(f"Learning progress error: {e}")
        return {"current_day": 1, "progress": 0, "learning_complete": False}

@api_router.post("/learning/save")
async def save_learning_progress(data: Dict[str, Any]):
    """Save learning progress"""
    try:
        learning_record = {
            "current_day": data.get("current_day", 1),
            "progress": data.get("progress", 0),
            "behavior_data": data.get("behavior_data", {}),
            "phase": data.get("phase", "introduction"),
            "learning_complete": False,
            "updated_at": datetime.utcnow()
        }
        
        # Upsert learning record
        await db.aegis_learning.update_one(
            {},
            {"$set": learning_record},
            upsert=True
        )
        
        logger.info(f"Learning progress saved - Day {learning_record['current_day']}, Progress {learning_record['progress']}%")
        
        return {"success": True, "message": "Progress saved"}
        
    except Exception as e:
        logger.error(f"Save learning error: {e}")
        return {"success": False, "message": str(e)}

@api_router.post("/learning/complete")
async def complete_learning(data: Dict[str, Any]):
    """Mark learning as complete - Aegis goes invisible"""
    try:
        behavior_data = data.get("behavior_data", {})
        
        # Save final learning data
        learning_record = {
            "current_day": 7,
            "progress": 100,
            "behavior_data": behavior_data,
            "learning_complete": True,
            "invisible_mode": True,
            "completed_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        }
        
        await db.aegis_learning.update_one(
            {},
            {"$set": learning_record},
            upsert=True
        )
        
        # Create user profile based on learned data
        user_profile = {
            "profile_id": str(uuid.uuid4()),
            "routines": behavior_data.get("routines", []),
            "wake_time": behavior_data.get("wakeUpTime", "07:00"),
            "sleep_time": behavior_data.get("sleepTime", "23:00"),
            "work_start": behavior_data.get("workStartTime", "09:00"),
            "work_end": behavior_data.get("workEndTime", "17:00"),
            "sensitive_categories": behavior_data.get("sensitiveCategories", []),
            "trusted_contacts": behavior_data.get("trustedContacts", "").split(",") if isinstance(behavior_data.get("trustedContacts"), str) else [],
            "frequent_apps": behavior_data.get("frequentApps", []),
            "created_at": datetime.utcnow()
        }
        
        await db.user_profiles.insert_one(user_profile)
        
        logger.info("AEGIS LEARNING COMPLETE - Entering invisible mode")
        
        # Send first notification
        await create_notification({
            "type": "suggestion",
            "title": "Aegis is now active",
            "message": "I'm watching over your phone silently. Access me anytime through the Calculator (enter your secret code).",
            "actions": [{"id": "ok", "label": "Got it", "primary": True}]
        })
        
        return {
            "success": True,
            "message": "Learning complete - Aegis is now invisible",
            "invisible_mode": True
        }
        
    except Exception as e:
        logger.error(f"Complete learning error: {e}")
        return {"success": False, "message": str(e)}

@api_router.get("/learning/status")
async def get_learning_status():
    """Check if learning is complete (for invisible mode check)"""
    try:
        learning = await db.aegis_learning.find_one({}, {"_id": 0})
        
        return {
            "learning_complete": learning.get("learning_complete", False) if learning else False,
            "invisible_mode": learning.get("invisible_mode", False) if learning else False
        }
        
    except Exception as e:
        return {"learning_complete": False, "invisible_mode": False}

# ===============================
# NOTIFICATION SYSTEM
# Popups when Aegis needs to tell you something
# ===============================

async def create_notification(notification_data: Dict[str, Any]):
    """Create a new notification"""
    notification = {
        "id": str(uuid.uuid4()),
        "type": notification_data.get("type", "info"),
        "title": notification_data.get("title", "Aegis Alert"),
        "message": notification_data.get("message", ""),
        "actions": notification_data.get("actions", []),
        "read": False,
        "created_at": datetime.utcnow()
    }
    
    await db.aegis_notifications.insert_one(notification)
    return {k: v for k, v in notification.items() if k != "_id"}

@api_router.get("/notifications/pending")
async def get_pending_notifications():
    """Get unread notifications"""
    try:
        notifications = await db.aegis_notifications.find(
            {"read": False},
            {"_id": 0}
        ).sort("created_at", -1).to_list(10)
        
        return {"notifications": notifications}
        
    except Exception as e:
        logger.error(f"Notifications error: {e}")
        return {"notifications": []}

@api_router.post("/notifications/action")
async def handle_notification_action(data: Dict[str, Any]):
    """Handle notification action and mark as read"""
    try:
        notification_id = data.get("notification_id")
        action_id = data.get("action_id")
        
        # Mark as read
        await db.aegis_notifications.update_one(
            {"id": notification_id},
            {"$set": {"read": True, "action_taken": action_id, "acted_at": datetime.utcnow()}}
        )
        
        return {"success": True}
        
    except Exception as e:
        return {"success": False}

# =============================================
# PUSH NOTIFICATION SUBSCRIPTION ENDPOINTS
# For real browser push notifications
# =============================================

@api_router.post("/notifications/subscribe")
async def subscribe_to_push(data: Dict[str, Any]):
    """Store push notification subscription from browser"""
    try:
        subscription_data = data.get("subscription", {})
        
        if not subscription_data.get("endpoint"):
            return {"success": False, "message": "Invalid subscription - missing endpoint"}
        
        # Store subscription in database
        push_subscription = {
            "id": str(uuid.uuid4()),
            "endpoint": subscription_data.get("endpoint"),
            "keys": subscription_data.get("keys", {}),
            "expiration_time": subscription_data.get("expirationTime"),
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow(),
            "active": True,
            "user_agent": data.get("user_agent", ""),
            "security_state": l1_enhanced_kernel.current_security_state.value
        }
        
        # Update existing or insert new subscription
        await db.push_subscriptions.update_one(
            {"endpoint": subscription_data.get("endpoint")},
            {"$set": push_subscription},
            upsert=True
        )
        
        logger.info(f"Push subscription registered/updated: {push_subscription['id']}")
        
        return {
            "success": True,
            "message": "Push subscription registered successfully",
            "subscription_id": push_subscription["id"]
        }
        
    except Exception as e:
        logger.error(f"Push subscription error: {e}")
        return {"success": False, "message": "Failed to register push subscription"}

@api_router.post("/notifications/unsubscribe")
async def unsubscribe_from_push(data: Dict[str, Any]):
    """Remove push notification subscription"""
    try:
        endpoint = data.get("endpoint")
        
        if not endpoint:
            return {"success": False, "message": "Missing endpoint"}
        
        # Mark subscription as inactive
        result = await db.push_subscriptions.update_one(
            {"endpoint": endpoint},
            {"$set": {"active": False, "unsubscribed_at": datetime.utcnow()}}
        )
        
        if result.modified_count > 0:
            logger.info(f"Push subscription unsubscribed: {endpoint[:50]}...")
            return {"success": True, "message": "Unsubscribed successfully"}
        else:
            return {"success": False, "message": "Subscription not found"}
        
    except Exception as e:
        logger.error(f"Push unsubscribe error: {e}")
        return {"success": False, "message": "Failed to unsubscribe"}

@api_router.get("/notifications/push-status")
async def get_push_status():
    """Get push notification status and active subscriptions count"""
    try:
        active_count = await db.push_subscriptions.count_documents({"active": True})
        total_count = await db.push_subscriptions.count_documents({})
        
        return {
            "push_enabled": True,
            "active_subscriptions": active_count,
            "total_subscriptions": total_count,
            "vapid_configured": True  # In production, check actual VAPID config
        }
        
    except Exception as e:
        logger.error(f"Push status error: {e}")
        return {"push_enabled": False, "active_subscriptions": 0}

@api_router.post("/notifications/send-push")
async def send_push_notification(data: Dict[str, Any]):
    """Send a push notification to all active subscribers (owner only)"""
    if l1_enhanced_kernel.current_security_state != SecurityState.OWNER_PRESENT:
        return {"error": "Owner authentication required"}
    
    try:
        title = data.get("title", "Aegis Alert")
        body = data.get("body", "")
        notification_type = data.get("type", "info")
        
        # Get all active subscriptions
        subscriptions = await db.push_subscriptions.find(
            {"active": True},
            {"_id": 0}
        ).to_list(100)
        
        # In a production environment, you would use web-push library here
        # to actually send push notifications to each subscription endpoint
        # For now, we log the intent and store the notification
        
        push_record = {
            "id": str(uuid.uuid4()),
            "title": title,
            "body": body,
            "type": notification_type,
            "sent_at": datetime.utcnow(),
            "target_count": len(subscriptions),
            "status": "simulated"  # Would be "sent" in production with web-push
        }
        
        await db.push_sent.insert_one(push_record)
        
        logger.info(f"Push notification queued: {title} to {len(subscriptions)} subscribers")
        
        return {
            "success": True,
            "message": f"Push notification sent to {len(subscriptions)} subscribers",
            "notification_id": push_record["id"]
        }
        
    except Exception as e:
        logger.error(f"Send push error: {e}")
        return {"success": False, "message": "Failed to send push notification"}

@api_router.post("/notifications/trigger")
async def trigger_notification(data: Dict[str, Any]):
    """Manually trigger a notification"""
    try:
        notification = await create_notification(data)
        return {"success": True, "notification": notification}
    except Exception as e:
        return {"success": False}

# ===============================
# CALENDAR SYSTEM
# Works like real phone calendar
# ===============================

@api_router.get("/calendar/events")
async def get_calendar_events():
    """Get all calendar events"""
    try:
        events = await db.calendar_events.find({}, {"_id": 0}).sort("date", 1).to_list(100)
        return {"events": events}
    except Exception as e:
        logger.error(f"Calendar events error: {e}")
        return {"events": []}

@api_router.post("/calendar/events")
async def create_calendar_event(event: Dict[str, Any]):
    """Create a calendar event"""
    try:
        event_record = {
            "id": event.get("id", str(uuid.uuid4())),
            "title": event.get("title", "Untitled Event"),
            "date": event.get("date"),
            "time": event.get("time", ""),
            "description": event.get("description", ""),
            "reminder": event.get("reminder", True),
            "created_at": datetime.utcnow()
        }
        
        await db.calendar_events.insert_one(event_record)
        
        # Schedule reminder notification if enabled
        if event_record["reminder"] and event_record["time"]:
            logger.info(f"Calendar event created: {event_record['title']} on {event_record['date']}")
        
        return {"success": True, "event": {k: v for k, v in event_record.items() if k != "_id"}}
        
    except Exception as e:
        logger.error(f"Create event error: {e}")
        return {"success": False}

@api_router.delete("/calendar/events/{event_id}")
async def delete_calendar_event(event_id: str):
    """Delete a calendar event"""
    try:
        result = await db.calendar_events.delete_one({"id": event_id})
        return {"success": result.deleted_count > 0}
    except Exception as e:
        return {"success": False}

# ===============================
# SECURITY ALERT TRIGGERS
# Auto-notifications for security events
# ===============================

async def trigger_security_alert(alert_type: str, details: Dict[str, Any]):
    """Trigger a security notification"""
    notifications = {
        "wrong_pattern": {
            "type": "security",
            "title": "⚠️ Security Alert",
            "message": f"Someone tried to unlock your phone with wrong pattern. Attempt #{details.get('attempt', 1)}",
            "actions": [
                {"id": "view_details", "label": "View Details", "primary": True},
                {"id": "dismiss", "label": "Dismiss"}
            ]
        },
        "intruder_detected": {
            "type": "security",
            "title": "🚨 Intruder Detected",
            "message": "Unknown person is using your phone. Trap mode activated. Evidence is being collected.",
            "actions": [
                {"id": "view_evidence", "label": "View Evidence", "primary": True},
                {"id": "lock_now", "label": "Lock Now"}
            ]
        },
        "sensitive_content": {
            "type": "privacy",
            "title": "🔒 Sensitive Content Detected",
            "message": f"Aegis detected sensitive content: {details.get('content_type', 'file')}. Should I hide it?",
            "actions": [
                {"id": "hide", "label": "Hide It", "primary": True},
                {"id": "ignore", "label": "Leave It"}
            ]
        },
        "calendar_reminder": {
            "type": "reminder",
            "title": "📅 Upcoming Event",
            "message": f"{details.get('event_title', 'Event')} in {details.get('minutes', 30)} minutes",
            "actions": [
                {"id": "view", "label": "View", "primary": True},
                {"id": "snooze", "label": "Snooze"}
            ]
        }
    }
    
    notification_data = notifications.get(alert_type)
    if notification_data:
        await create_notification(notification_data)
        logger.info(f"Security alert triggered: {alert_type}")

# ===============================
# STRIPE SUBSCRIPTION PAYMENTS
# ===============================

from emergentintegrations.payments.stripe.checkout import StripeCheckout, CheckoutSessionResponse, CheckoutStatusResponse, CheckoutSessionRequest

# Subscription packages - amounts in USD
SUBSCRIPTION_PACKAGES = {
    "basic_monthly": {
        "name": "Basic Monthly",
        "amount": 4.99,
        "currency": "usd",
        "features": ["pattern_lock", "invisible_vault", "intruder_photos", "gps_tracking", "remote_lock", "3_emergency_contacts"]
    },
    "pro_monthly": {
        "name": "Pro Monthly", 
        "amount": 9.99,
        "currency": "usd",
        "features": ["all_basic", "trap_mode", "duress_pattern", "behavioral_guard", "remote_wipe", "unlimited_contacts", "ai_features", "priority_support"]
    }
}

class SubscriptionRequest(BaseModel):
    package_id: str = Field(..., description="Package ID: basic_monthly or pro_monthly")
    origin_url: str = Field(..., description="Frontend origin URL for redirects")
    user_email: Optional[str] = Field(None, description="User email for subscription")

class SubscriptionStatusRequest(BaseModel):
    session_id: str

@api_router.get("/subscriptions/packages")
async def get_subscription_packages():
    """Get available subscription packages"""
    return {
        "packages": SUBSCRIPTION_PACKAGES,
        "currency": "usd"
    }

@api_router.post("/subscriptions/checkout")
async def create_subscription_checkout(request: SubscriptionRequest, http_request: Request):
    """Create a Stripe checkout session for subscription"""
    try:
        # Validate package
        if request.package_id not in SUBSCRIPTION_PACKAGES:
            raise HTTPException(status_code=400, detail="Invalid package ID")
        
        package = SUBSCRIPTION_PACKAGES[request.package_id]
        
        # Initialize Stripe
        stripe_api_key = os.environ.get("STRIPE_API_KEY")
        if not stripe_api_key:
            raise HTTPException(status_code=500, detail="Stripe not configured")
        
        host_url = str(http_request.base_url).rstrip('/')
        webhook_url = f"{host_url}/api/webhook/stripe"
        stripe_checkout = StripeCheckout(api_key=stripe_api_key, webhook_url=webhook_url)
        
        # Build success/cancel URLs from frontend origin
        success_url = f"{request.origin_url}/subscription/success?session_id={{CHECKOUT_SESSION_ID}}"
        cancel_url = f"{request.origin_url}/subscription/cancel"
        
        # Create checkout session
        checkout_request = CheckoutSessionRequest(
            amount=float(package["amount"]),
            currency=package["currency"],
            success_url=success_url,
            cancel_url=cancel_url,
            metadata={
                "package_id": request.package_id,
                "package_name": package["name"],
                "user_email": request.user_email or "anonymous"
            }
        )
        
        session: CheckoutSessionResponse = await stripe_checkout.create_checkout_session(checkout_request)
        
        # Store transaction in database
        transaction = {
            "session_id": session.session_id,
            "package_id": request.package_id,
            "package_name": package["name"],
            "amount": package["amount"],
            "currency": package["currency"],
            "user_email": request.user_email,
            "payment_status": "initiated",
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        }
        await db.payment_transactions.insert_one(transaction)
        
        logger.info(f"Created checkout session: {session.session_id} for package: {request.package_id}")
        
        return {
            "checkout_url": session.url,
            "session_id": session.session_id
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Checkout error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/subscriptions/status/{session_id}")
async def get_subscription_status(session_id: str, http_request: Request):
    """Check subscription payment status"""
    try:
        stripe_api_key = os.environ.get("STRIPE_API_KEY")
        if not stripe_api_key:
            raise HTTPException(status_code=500, detail="Stripe not configured")
        
        host_url = str(http_request.base_url).rstrip('/')
        webhook_url = f"{host_url}/api/webhook/stripe"
        stripe_checkout = StripeCheckout(api_key=stripe_api_key, webhook_url=webhook_url)
        
        # Get status from Stripe
        status: CheckoutStatusResponse = await stripe_checkout.get_checkout_status(session_id)
        
        # Update database
        update_data = {
            "payment_status": status.payment_status,
            "stripe_status": status.status,
            "updated_at": datetime.utcnow()
        }
        
        # Check if already processed to prevent double-processing
        existing = await db.payment_transactions.find_one({"session_id": session_id})
        if existing and existing.get("payment_status") == "paid":
            return {
                "status": "paid",
                "payment_status": "paid",
                "message": "Subscription already activated",
                "package_id": existing.get("package_id")
            }
        
        # Update transaction status
        if status.payment_status == "paid":
            update_data["activated_at"] = datetime.utcnow()
            
        await db.payment_transactions.update_one(
            {"session_id": session_id},
            {"$set": update_data}
        )
        
        return {
            "status": status.status,
            "payment_status": status.payment_status,
            "amount": status.amount_total / 100,  # Convert cents to dollars
            "currency": status.currency,
            "metadata": status.metadata
        }
        
    except Exception as e:
        logger.error(f"Status check error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.post("/webhook/stripe")
async def stripe_webhook(request: Request):
    """Handle Stripe webhook events"""
    try:
        stripe_api_key = os.environ.get("STRIPE_API_KEY")
        if not stripe_api_key:
            raise HTTPException(status_code=500, detail="Stripe not configured")
        
        host_url = str(request.base_url).rstrip('/')
        webhook_url = f"{host_url}/api/webhook/stripe"
        stripe_checkout = StripeCheckout(api_key=stripe_api_key, webhook_url=webhook_url)
        
        # Get raw body
        body = await request.body()
        signature = request.headers.get("Stripe-Signature", "")
        
        # Handle webhook
        webhook_response = await stripe_checkout.handle_webhook(body, signature)
        
        # Update database based on event
        if webhook_response.payment_status == "paid":
            await db.payment_transactions.update_one(
                {"session_id": webhook_response.session_id},
                {"$set": {
                    "payment_status": "paid",
                    "webhook_event_id": webhook_response.event_id,
                    "activated_at": datetime.utcnow(),
                    "updated_at": datetime.utcnow()
                }}
            )
        
        logger.info(f"Webhook processed: {webhook_response.event_type} for session: {webhook_response.session_id}")
        
        return {"status": "success"}
        
    except Exception as e:
        logger.error(f"Webhook error: {str(e)}")
        return {"status": "error", "message": str(e)}

@api_router.get("/subscriptions/user/{user_email}")
async def get_user_subscription(user_email: str):
    """Get user's active subscription"""
    try:
        subscription = await db.payment_transactions.find_one(
            {"user_email": user_email, "payment_status": "paid"},
            sort=[("activated_at", -1)]
        )
        
        if not subscription:
            return {"has_subscription": False, "tier": "free"}
        
        return {
            "has_subscription": True,
            "tier": subscription.get("package_id", "basic_monthly").replace("_monthly", ""),
            "package_name": subscription.get("package_name"),
            "activated_at": subscription.get("activated_at"),
            "features": SUBSCRIPTION_PACKAGES.get(subscription.get("package_id"), {}).get("features", [])
        }
        
    except Exception as e:
        logger.error(f"Subscription lookup error: {str(e)}")
        return {"has_subscription": False, "tier": "free"}

# Add CORS middleware
# NOTE: no cookie-based auth is used (device_id + codes travel in the request body),
# so credentials are disabled. This also avoids the invalid "*" + credentials combo.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API routes
app.include_router(api_router)

# Security Engine (owner recognition, trap, evidence, recovery)
from routes.security_engine import router as security_router
app.include_router(security_router)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)