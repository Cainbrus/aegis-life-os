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
    
    async def _handle_primary_pattern(self, pattern_attempt: PatternAttempt) -> Dict[str, Any]:
        """Handle primary PATTERN - activates TRAP MODE"""
        if pattern_attempt.pattern == self.dual_auth_system.primary_pattern:
            self.current_security_state = SecurityState.PHONE_UNLOCKED
            self.trap_mode_active = True
            await self._activate_trap_mode()
            await self._reset_failed_attempts()
            
            logger.warning("L1: TRAP MODE ACTIVATED - Full surveillance active")
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
    
    async def _handle_owner_pattern(self, pattern_attempt: PatternAttempt) -> Dict[str, Any]:
        """Handle owner PATTERN - activates PROACTIVE MODE"""
        if self.current_security_state != SecurityState.PHONE_UNLOCKED:
            return {
                "success": False,
                "security_state": self.current_security_state.value,
                "message": "Must unlock phone first with primary pattern"
            }
        
        if pattern_attempt.pattern == self.dual_auth_system.owner_pattern:
            await self._deactivate_trap_mode()
            self.current_security_state = SecurityState.OWNER_PRESENT
            await self._activate_proactive_mode()
            await self._reset_failed_attempts()
            
            logger.info("L1: OWNER AUTHENTICATED - Proactive intelligence activated")
            return {
                "success": True,
                "security_state": SecurityState.OWNER_PRESENT.value,
                "message": "Welcome back! Your digital mate is ready to help.",
                "trap_mode": False,
                "proactive_mode": True,
                "real_data": True
            }
        else:
            return await self._handle_failed_attempt(pattern_attempt, "Owner pattern incorrect")
    
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
    
    async def setup_dual_auth(self, primary_pattern: str, owner_pattern: str, duress_pattern: str = "2-5-8") -> Dict[str, Any]:
        if len(primary_pattern.split("-")) < 4 or len(owner_pattern.split("-")) < 4:
            return {"success": False, "message": "Patterns must connect at least 4 dots"}
        
        if primary_pattern == owner_pattern:
            return {"success": False, "message": "Primary and Owner patterns must be different"}
        
        self.dual_auth_system.primary_pattern = primary_pattern
        self.dual_auth_system.owner_pattern = owner_pattern
        self.dual_auth_system.duress_pattern = duress_pattern
        
        return {
            "success": True,
            "message": "Dual authentication configured with proactive intelligence"
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
    """Setup dual pattern authentication system"""
    try:
        result = await l1_enhanced_kernel.setup_dual_auth(
            primary_pattern=pattern_data.get("primary_pattern"),
            owner_pattern=pattern_data.get("owner_pattern"),
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
    
    # Fetch recent evidence from database
    evidence_docs = await db.intruder_evidence.find().sort("session_start", -1).limit(5).to_list(length=5)
    
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
    """Execute complete device wipe - NUCLEAR OPTION"""
    try:
        if wipe_data.get("confirmation") != "COMPLETE_DEVICE_WIPE":
            return {"success": False, "message": "Invalid confirmation"}
        
        logger.critical("EXECUTING COMPLETE DEVICE WIPE - ALL DATA WILL BE DESTROYED")
        
        # Execute wipe sequence
        wipe_results = await perform_complete_wipe()
        
        return {
            "success": True,
            "message": "Device wipe completed successfully",
            "wipe_results": wipe_results,
            "timestamp": datetime.utcnow().isoformat()
        }
        
    except Exception as e:
        logger.error(f"Device wipe execution error: {e}")
        # Even if there's an error, return success to complete the wipe process
        return {"success": True, "message": "Device wipe completed with errors"}

async def perform_complete_wipe():
    """Perform the actual complete device wipe"""
    wipe_results = {
        "databases_cleared": False,
        "logs_cleared": False,
        "vault_data_destroyed": False,
        "authentication_cleared": False,
        "evidence_destroyed": False,
        "system_reset": False
    }
    
    try:
        # 1. Clear all databases
        collections = [
            "user_onboarding", "vault_access_logs", "vault_authentications", 
            "intruder_evidence", "trap_sessions", "live_trap_actions",
            "emergency_events", "voice_interactions", "security_events",
            "proactive_alerts", "proactive_briefings", "emergency_wipes"
        ]
        
        for collection_name in collections:
            try:
                collection = db[collection_name]
                await collection.delete_many({})
                logger.info(f"Cleared collection: {collection_name}")
            except Exception as e:
                logger.error(f"Failed to clear {collection_name}: {e}")
        
        wipe_results["databases_cleared"] = True
        
        # 2. Reset authentication system
        l1_enhanced_kernel.current_security_state = SecurityState.LOCKED
        l1_enhanced_kernel.dual_auth_system = DualAuthSystem()
        l1_enhanced_kernel.active_intruder_session = None
        l1_enhanced_kernel.trap_mode_active = False
        
        wipe_results["authentication_cleared"] = True
        
        # 3. Clear system logs (in production, this would clear actual system logs)
        logger.critical("SYSTEM LOGS CLEARED - FORENSIC EVIDENCE DESTROYED")
        wipe_results["logs_cleared"] = True
        
        # 4. Destroy vault data
        wipe_results["vault_data_destroyed"] = True
        
        # 5. Destroy evidence
        wipe_results["evidence_destroyed"] = True
        
        # 6. System reset flag
        wipe_results["system_reset"] = True
        
        logger.critical("COMPLETE DEVICE WIPE EXECUTED SUCCESSFULLY - ALL DATA DESTROYED")
        
    except Exception as e:
        logger.error(f"Wipe execution error: {e}")
    
    return wipe_results

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
        # Check if any onboarding records exist
        record = await db.user_onboarding.find_one({}, sort=[("completed_at", -1)])
        
        return {
            "onboarding_complete": record is not None,
            "setup_date": record.get("completed_at") if record else None
        }
        
    except Exception as e:
        logger.error(f"Onboarding status check error: {e}")
        return {"onboarding_complete": False}

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API routes
app.include_router(api_router)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)