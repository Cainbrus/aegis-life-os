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
    primary_pattern: str = "1-2-3-6-9"  # L-shape pattern
    owner_pattern: str = "1-5-9-8-7"   # Z-shape pattern
    duress_pattern: str = "2-5-8"      # Vertical line pattern
    max_attempts: int = 3
    lockout_duration: int = 300
    failed_attempts: int = 0
    last_failed_attempt: Optional[datetime] = None
    is_locked_out: bool = False

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
        """Enhanced dual PATTERN authentication"""
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
            elif pattern_attempt.pattern_type == PatternType.PRIMARY_PATTERN:
                return await self._handle_primary_pattern(pattern_attempt)
            elif pattern_attempt.pattern_type == PatternType.OWNER_PATTERN:
                return await self._handle_owner_pattern(pattern_attempt)
            else:  # AUTO_DETECT or unknown
                return await self._handle_auto_detect_pattern(pattern_attempt)
                
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

# Voice Interface Endpoints
@api_router.post("/voice/process")
async def process_voice_command(voice_data: Dict[str, Any]):
    """Process voice command"""
    if l1_enhanced_kernel.current_security_state == SecurityState.OWNER_PRESENT:
        # Process with proactive AI
        result = await l2_proactive_orchestrator.process_proactive_request(
            user_input=voice_data.get("command", ""),
            context="voice_interface"
        )
        return result
    else:
        return {"error": "Voice interface requires owner authentication"}

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