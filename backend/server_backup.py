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

class PinType(str, Enum):
    PRIMARY_PIN = "primary_pin"
    OWNER_PIN = "owner_pin"
    DURESS_PIN = "duress_pin"
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

class PinAttempt(BaseModel):
    pin: str
    pin_type: PinType
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    attempt_number: int = 1
    source_ip: Optional[str] = None

class DualAuthSystem(BaseModel):
    primary_pin: str = "1234"
    owner_pin: str = "9876"
    duress_pin: str = "0000"
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
    
    async def authenticate_with_pin(self, pin_attempt: PinAttempt) -> Dict[str, Any]:
        """Enhanced dual PIN authentication"""
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
            
            if pin_attempt.pin_type == PinType.DURESS_PIN:
                return await self._handle_duress_pin(pin_attempt)
            elif pin_attempt.pin_type == PinType.PRIMARY_PIN:
                return await self._handle_primary_pin(pin_attempt)
            elif pin_attempt.pin_type == PinType.OWNER_PIN:
                return await self._handle_owner_pin(pin_attempt)
            else:  # AUTO_DETECT or unknown
                return await self._handle_auto_detect_pin(pin_attempt)
                
        except Exception as e:
            logger.error(f"L1 PIN Authentication error: {e}")
            return {
                "success": False,
                "security_state": SecurityState.CODE_RED.value,
                "message": "Authentication system error"
            }
    
    async def _handle_primary_pin(self, pin_attempt: PinAttempt) -> Dict[str, Any]:
        """Handle primary PIN - activates TRAP MODE"""
        if pin_attempt.pin == self.dual_auth_system.primary_pin:
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
            return await self._handle_failed_attempt(pin_attempt, "PIN incorrect")
    
    async def _handle_owner_pin(self, pin_attempt: PinAttempt) -> Dict[str, Any]:
        """Handle owner PIN - activates PROACTIVE MODE"""
        if self.current_security_state != SecurityState.PHONE_UNLOCKED:
            return {
                "success": False,
                "security_state": self.current_security_state.value,
                "message": "Must unlock phone first with primary PIN"
            }
        
        if pin_attempt.pin == self.dual_auth_system.owner_pin:
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
            return await self._handle_failed_attempt(pin_attempt, "Owner PIN incorrect")
    
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
    async def _handle_failed_attempt(self, pin_attempt: PinAttempt, message: str) -> Dict[str, Any]:
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
    
    async def _handle_duress_pin(self, pin_attempt: PinAttempt) -> Dict[str, Any]:
        if pin_attempt.pin == self.dual_auth_system.duress_pin:
            self.current_security_state = SecurityState.PHONE_UNLOCKED
            self.trap_mode_active = True
            await self._activate_trap_mode()
            await self._initiate_silent_duress_protocol(pin_attempt)
            
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
            return await self._handle_failed_attempt(pin_attempt, "PIN incorrect")
    
    async def _handle_auto_detect_pin(self, pin_attempt: PinAttempt) -> Dict[str, Any]:
        if pin_attempt.pin == self.dual_auth_system.duress_pin:
            pin_attempt.pin_type = PinType.DURESS_PIN
            return await self._handle_duress_pin(pin_attempt)
        
        if self.current_security_state == SecurityState.LOCKED:
            pin_attempt.pin_type = PinType.PRIMARY_PIN
            return await self._handle_primary_pin(pin_attempt)
        elif self.current_security_state == SecurityState.PHONE_UNLOCKED:
            pin_attempt.pin_type = PinType.OWNER_PIN
            return await self._handle_owner_pin(pin_attempt)
        else:
            return {
                "success": False,
                "security_state": self.current_security_state.value,
                "message": "Invalid state for PIN entry"
            }
    
    async def _initiate_lockout(self):
        self.dual_auth_system.is_locked_out = True
        self.current_security_state = SecurityState.LOCKED
        
        if self.trap_mode_active:
            await self._deactivate_trap_mode()
    
    async def _initiate_silent_duress_protocol(self, pin_attempt: PinAttempt):
        duress_event = {
            "event_type": "duress_pin_activated",
            "timestamp": datetime.utcnow(),
            "source_ip": pin_attempt.source_ip,
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
    
    async def setup_dual_auth(self, primary_pin: str, owner_pin: str, duress_pin: str = "0000") -> Dict[str, Any]:
        if len(primary_pin) < 4 or len(owner_pin) < 4:
            return {"success": False, "message": "PINs must be at least 4 digits"}
        
        if primary_pin == owner_pin:
            return {"success": False, "message": "Primary and Owner PINs must be different"}
        
        self.dual_auth_system.primary_pin = primary_pin
        self.dual_auth_system.owner_pin = owner_pin
        self.dual_auth_system.duress_pin = duress_pin
        
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
        "philosophy": "Perfect Trap + Proactive AI Planning",
        "tagline": "Two PINs, Total Intelligence",
        "features": ["Trap System", "Proactive Planning", "Voice Interface", "Smart Alerts"]
    }

@api_router.post("/auth/pin")
async def authenticate_with_pin(pin_data: Dict[str, Any]):
    """Enhanced Dual PIN Authentication with Proactive Features"""
    try:
        pin_attempt = PinAttempt(
            pin=pin_data.get("pin", ""),
            pin_type=PinType(pin_data.get("pin_type", "auto_detect")),
            source_ip=pin_data.get("source_ip")
        )
        
        result = await l1_enhanced_kernel.authenticate_with_pin(pin_attempt)
        return result
        
    except Exception as e:
        logger.error(f"PIN authentication failed: {e}")
        raise HTTPException(status_code=500, detail="Authentication failed")

@api_router.get("/auth/status")
async def get_auth_status():
    """Get current authentication status"""
    try:
        return {
            "security_state": l1_enhanced_kernel.current_security_state.value,
            "dual_auth_configured": True,
            "failed_attempts": l1_enhanced_kernel.dual_auth_system.failed_attempts,
            "max_attempts": l1_enhanced_kernel.dual_auth_system.max_attempts,
            "is_locked_out": l1_enhanced_kernel.dual_auth_system.is_locked_out,
            "trap_mode": l1_enhanced_kernel.trap_mode_active,
            "proactive_mode": l1_enhanced_kernel.current_security_state == SecurityState.OWNER_PRESENT
        }
    except Exception as e:
        logger.error(f"Failed to get auth status: {e}")
        raise HTTPException(status_code=500, detail="Failed to get status")

@api_router.post("/proactive/request")
async def process_proactive_request(request_data: Dict[str, Any]):
    """Process user request with proactive intelligence"""
    try:
        if l1_enhanced_kernel.current_security_state != SecurityState.OWNER_PRESENT:
            raise HTTPException(status_code=403, detail="Owner authentication required for proactive features")
        
        user_input = request_data.get("input", "")
        context = request_data.get("context", "general")
        
        result = await l2_proactive_orchestrator.process_proactive_request(user_input, context)
        return result
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to process proactive request: {e}")
        raise HTTPException(status_code=500, detail="Failed to process request")

@api_router.get("/proactive/briefing")
async def get_morning_briefing():
    """Get proactive morning briefing"""
    try:
        if l1_enhanced_kernel.current_security_state != SecurityState.OWNER_PRESENT:
            raise HTTPException(status_code=403, detail="Owner authentication required")
        
        briefing = await l2_proactive_orchestrator.generate_morning_briefing()
        return briefing.dict()
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to generate briefing: {e}")
        raise HTTPException(status_code=500, detail="Failed to generate briefing")

@api_router.get("/proactive/alerts")
async def get_proactive_alerts():
    """Get current proactive alerts"""
    try:
        if l1_enhanced_kernel.current_security_state != SecurityState.OWNER_PRESENT:
            raise HTTPException(status_code=403, detail="Owner authentication required")
        
        alerts = await db.proactive_alerts.find(
            {"user_responded": False}
        ).sort("created_at", -1).limit(10).to_list(10)
        
        for alert in alerts:
            if '_id' in alert:
                alert['_id'] = str(alert['_id'])
        
        return {
            "status": "success",
            "alerts": alerts,
            "count": len(alerts)
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to get alerts: {e}")
        raise HTTPException(status_code=500, detail="Failed to get alerts")

@api_router.post("/proactive/alert-response")
async def respond_to_alert(response_data: Dict[str, Any]):
    """Respond to a proactive alert"""
    try:
        if l1_enhanced_kernel.current_security_state != SecurityState.OWNER_PRESENT:
            raise HTTPException(status_code=403, detail="Owner authentication required")
        
        alert_id = response_data.get("alert_id", "")
        chosen_response = response_data.get("response", "")
        
        await db.proactive_alerts.update_one(
            {"id": alert_id},
            {"$set": {
                "user_responded": True,
                "response_chosen": chosen_response,
                "responded_at": datetime.utcnow()
            }}
        )
        
        return {
            "status": "success",
            "message": f"Response recorded: {chosen_response}"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to record alert response: {e}")
        raise HTTPException(status_code=500, detail="Failed to record response")

@api_router.post("/voice/command")
async def process_voice_command(voice_data: VoiceCommand):
    """Process voice commands with proactive responses"""
    try:
        # Check for duress first
        if any(safe_word in voice_data.command_text.lower() for safe_word in ["help", "emergency", "police"]):
            # Silent duress activation - don't reveal in response
            await db.security_events.insert_one({
                "event_type": "voice_duress_detected",
                "timestamp": datetime.utcnow(),
                "severity": "CRITICAL"
            })
        
        # Process normal voice command
        if l1_enhanced_kernel.current_security_state == SecurityState.OWNER_PRESENT:
            result = await l2_proactive_orchestrator.process_proactive_request(
                voice_data.command_text, 
                "voice_command"
            )
            
            return {
                "status": "success",
                "wake_word": voice_data.wake_word,
                "response": result.get("response", "I'm here to help!"),
                "suggestions": result.get("suggestions", []),
                "alerts": result.get("alerts", [])
            }
        else:
            return {
                "status": "success",
                "wake_word": voice_data.wake_word,
                "response": "Voice assistant ready. Unlock for full features.",
                "suggestions": [],
                "alerts": []
            }
        
    except Exception as e:
        logger.error(f"Voice command processing failed: {e}")
        raise HTTPException(status_code=500, detail="Voice processing error")

# Existing trap endpoints (keeping all of them)
@api_router.post("/trap/log-action")
async def log_trap_action(action_data: Dict[str, Any]):
    """Log intruder action in trap mode"""
    try:
        result = await l1_enhanced_kernel.log_trap_action(action_data)
        return result
    except Exception as e:
        logger.error(f"Failed to log trap action: {e}")
        raise HTTPException(status_code=500, detail="Failed to log action")

@api_router.post("/trap/capture-photo")
async def capture_intruder_photo(photo_data: Dict[str, str]):
    """Silently capture intruder photo"""
    try:
        photo_base64 = photo_data.get("photo", "")
        result = await l1_enhanced_kernel.capture_intruder_photo(photo_base64)
        return result
    except Exception as e:
        logger.error(f"Failed to capture photo: {e}")
        raise HTTPException(status_code=500, detail="Failed to capture photo")

@api_router.get("/trap/app/{app_name}")
async def get_trap_app_data(app_name: str, action: str = "view", context: str = "evening"):
    """Get convincing fake data for any app in trap mode"""
    try:
        await l1_enhanced_kernel.log_trap_action({
            "action_type": "app_open",
            "app_name": app_name,
            "details": {"action": action, "context": context},
            "timestamp": datetime.utcnow()
        })
        
        trap_data = await l3_trap_agent.get_trap_data(app_name, action, context)
        return trap_data
        
    except Exception as e:
        logger.error(f"Failed to get trap app data: {e}")
        raise HTTPException(status_code=500, detail="Failed to get app data")

@api_router.get("/system/proactive-status")
async def get_proactive_system_status():
    """Get system status with proactive intelligence information"""
    current_hour = datetime.utcnow().hour
    
    if 5 <= current_hour < 10:
        context = "morning"
    elif 10 <= current_hour < 17:
        context = "work"
    elif 17 <= current_hour < 22:
        context = "evening"
    else:
        context = "night"
    
    return {
        "system": "Aegis Life OS",
        "version": "Proactive Intelligence v1.0",
        "tagline": "Your Proactive Digital Mate",
        "philosophy": "Perfect Trap + Intelligent Planning",
        "security_state": l1_enhanced_kernel.current_security_state.value,
        "proactive_features": {
            "active": l1_enhanced_kernel.current_security_state == SecurityState.OWNER_PRESENT,
            "briefing_ready": True,
            "alerts_monitoring": True,
            "voice_interface": "active",
            "planning_mode": "proactive" if l1_enhanced_kernel.current_security_state == SecurityState.OWNER_PRESENT else "disabled"
        },
        "trap_system": {
            "active": l1_enhanced_kernel.trap_mode_active,
            "mode": "comprehensive_surveillance" if l1_enhanced_kernel.trap_mode_active else "standby",
            "evidence_collection": "active" if l1_enhanced_kernel.trap_mode_active else "inactive"
        },
        "current_context": context,
        "data_mode": {
            "STATE_LOCKED": "No access",
            "STATE_PHONE_UNLOCKED": "TRAP MODE - Perfect deception active", 
            "STATE_OWNER_PRESENT": "PROACTIVE MODE - Your digital mate is ready"
        }.get(l1_enhanced_kernel.current_security_state.value, "Unknown"),
        "timestamp": datetime.utcnow()
    }

# Include the router in the main app
app.include_router(api_router)

# CORS Configuration
app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)