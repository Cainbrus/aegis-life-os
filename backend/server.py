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
# AEGIS DUAL PASSWORD MODELS
# ===============================

class SecurityState(str, Enum):
    LOCKED = "STATE_LOCKED"
    PHONE_UNLOCKED = "STATE_PHONE_UNLOCKED"  # First PIN entered - shows decoy
    OWNER_PRESENT = "STATE_OWNER_PRESENT"    # Second PIN entered - shows real data
    INTRUDER_DETECTED = "STATE_INTRUDER_DETECTED"
    CODE_RED = "STATE_CODE_RED"

class PinType(str, Enum):
    PRIMARY_PIN = "primary_pin"      # Unlocks phone, shows decoy
    OWNER_PIN = "owner_pin"          # Unlocks owner mode, shows real data
    DURESS_PIN = "duress_pin"        # Silent emergency activation

class PinAttempt(BaseModel):
    pin: str
    pin_type: PinType
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    attempt_number: int = 1
    source_ip: Optional[str] = None

class DualAuthSystem(BaseModel):
    primary_pin: str = "1234"        # Default - user should change
    owner_pin: str = "9876"          # Default - user should change  
    duress_pin: str = "0000"         # Emergency pin
    max_attempts: int = 3
    lockout_duration: int = 300      # 5 minutes in seconds
    failed_attempts: int = 0
    last_failed_attempt: Optional[datetime] = None
    is_locked_out: bool = False

class AgentLevel(str, Enum):
    L1_KERNEL = "L1_KERNEL_GUARDIAN"
    L2_ORCHESTRATOR = "L2_AI_ORCHESTRATOR"
    L3_APP_AGENT = "L3_APP_AGENT"
    L4_SPECIALIST = "L4_SPECIALIST"

class ContextType(str, Enum):
    MORNING = "morning"
    COMMUTE = "commute"  
    WORK = "work"
    EVENING = "evening"
    NIGHT = "night"
    WEEKEND = "weekend"

# Enhanced Behavioral Data Models (keeping existing)
class MicroGesture(BaseModel):
    x: float
    y: float
    pressure: float
    velocity: float
    acceleration: float
    timestamp: float
    gesture_type: str

class TypingPattern(BaseModel):
    key: str
    press_duration: float
    flight_time: float
    pressure: float
    timestamp: float

class MotionData(BaseModel):
    accelerometer: List[float]
    gyroscope: List[float]
    grip_angle: float
    device_orientation: str
    timestamp: float

class EnhancedBehavioralData(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str = "default_user"
    micro_gestures: List[MicroGesture] = []
    typing_patterns: List[TypingPattern] = []
    motion_data: List[MotionData] = []
    session_context: str = "normal"
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    confidence_score: float = 0.0

class IntruderEvidence(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    session_start: datetime = Field(default_factory=datetime.utcnow)
    actions_logged: List[Dict[str, Any]] = []
    photo_evidence: Optional[str] = None
    behavioral_deviation: float = 0.0
    location_data: Optional[Dict[str, float]] = None
    duration_seconds: int = 0
    failed_pin_attempts: List[Dict[str, Any]] = []

class UserGoal(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_input: str
    context_type: ContextType = ContextType.MORNING
    parsed_intents: List[str] = []
    execution_plan: List[Dict[str, Any]] = []
    proactive_suggestions: List[str] = []
    priority_score: float = 0.5
    status: str = "pending"
    created_at: datetime = Field(default_factory=datetime.utcnow)
    completed_at: Optional[datetime] = None

class ContextualCard(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    card_type: str
    title: str
    content: str
    action_buttons: List[Dict[str, str]] = []
    priority: int = 1
    context_relevance: float = 1.0
    expires_at: Optional[datetime] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)

class VoiceCommand(BaseModel):
    wake_word: str = "mate"
    command_text: str
    voice_print_match: float = 0.0
    is_duress: bool = False
    safe_word_detected: bool = False
    timestamp: datetime = Field(default_factory=datetime.utcnow)

# ===============================
# L1 DUAL AUTH KERNEL GUARDIAN
# ===============================

class L1DualAuthKernelGuardian:
    def __init__(self):
        self.current_security_state = SecurityState.LOCKED
        self.dual_auth_system = DualAuthSystem()
        self.behavioral_baseline = None
        self.intruder_session = None
        self.constitution_rules = [
            "PRIVACY_FIRST: Never expose user data without explicit consent",
            "DUAL_AUTH_REQUIRED: Two-layer authentication protects against coercion", 
            "SECURITY_BY_DESIGN: Always validate and authenticate requests",
            "MINIMAL_PRIVILEGE: Operate with least required permissions",
            "USER_VETO: User command always overrides AI suggestion",
            "PROACTIVE_PROTECTION: Anticipate and prevent security threats",
            "DURESS_AWARENESS: Silent emergency protocols always active"
        ]
    
    async def authenticate_with_pin(self, pin_attempt: PinAttempt) -> Dict[str, Any]:
        """Dual PIN authentication system"""
        try:
            # Check if system is locked out
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
            
            # Handle different PIN types
            if pin_attempt.pin_type == PinType.DURESS_PIN:
                return await self._handle_duress_pin(pin_attempt)
            elif pin_attempt.pin_type == PinType.PRIMARY_PIN:
                return await self._handle_primary_pin(pin_attempt)
            elif pin_attempt.pin_type == PinType.OWNER_PIN:
                return await self._handle_owner_pin(pin_attempt)
            else:
                return await self._handle_auto_detect_pin(pin_attempt)
                
        except Exception as e:
            logger.error(f"L1 PIN Authentication error: {e}")
            return {
                "success": False,
                "security_state": SecurityState.CODE_RED.value,
                "message": "Authentication system error"
            }
    
    async def _handle_primary_pin(self, pin_attempt: PinAttempt) -> Dict[str, Any]:
        """Handle primary PIN - unlocks phone with decoy data"""
        if pin_attempt.pin == self.dual_auth_system.primary_pin:
            self.current_security_state = SecurityState.PHONE_UNLOCKED
            await self._reset_failed_attempts()
            await self._broadcast_security_state("Phone unlocked - Decoy mode active")
            
            logger.info("L1: PRIMARY PIN SUCCESS - Phone unlocked, decoy mode active")
            return {
                "success": True,
                "security_state": SecurityState.PHONE_UNLOCKED.value,
                "message": "Phone unlocked successfully",
                "decoy_mode": True,
                "next_step": "Enter owner PIN for full access"
            }
        else:
            return await self._handle_failed_attempt(pin_attempt, "Primary PIN incorrect")
    
    async def _handle_owner_pin(self, pin_attempt: PinAttempt) -> Dict[str, Any]:
        """Handle owner PIN - switches to real data mode"""
        if self.current_security_state != SecurityState.PHONE_UNLOCKED:
            return {
                "success": False,
                "security_state": self.current_security_state.value,
                "message": "Must unlock phone first with primary PIN"
            }
        
        if pin_attempt.pin == self.dual_auth_system.owner_pin:
            self.current_security_state = SecurityState.OWNER_PRESENT
            await self._reset_failed_attempts()
            await self._broadcast_security_state("Owner authenticated - Full access granted")
            
            logger.info("L1: OWNER PIN SUCCESS - Full owner access granted")
            return {
                "success": True,
                "security_state": SecurityState.OWNER_PRESENT.value,
                "message": "Owner access granted - Welcome back",
                "decoy_mode": False,
                "full_access": True
            }
        else:
            return await self._handle_failed_attempt(pin_attempt, "Owner PIN incorrect")
    
    async def _handle_duress_pin(self, pin_attempt: PinAttempt) -> Dict[str, Any]:
        """Handle duress PIN - silent emergency activation"""
        if pin_attempt.pin == self.dual_auth_system.duress_pin:
            # Silent emergency activation - appears to work normally
            self.current_security_state = SecurityState.PHONE_UNLOCKED
            await self._initiate_silent_duress_protocol(pin_attempt)
            
            logger.critical("L1: DURESS PIN ACTIVATED - Silent emergency protocols active")
            return {
                "success": True,
                "security_state": SecurityState.PHONE_UNLOCKED.value,
                "message": "Phone unlocked successfully",  # Never reveal duress activation
                "decoy_mode": True,
                "duress_active": False  # Always hide this from response
            }
        else:
            return await self._handle_failed_attempt(pin_attempt, "PIN incorrect")
    
    async def _handle_auto_detect_pin(self, pin_attempt: PinAttempt) -> Dict[str, Any]:
        """Auto-detect PIN type and handle accordingly"""
        # Check duress first (highest priority)
        if pin_attempt.pin == self.dual_auth_system.duress_pin:
            pin_attempt.pin_type = PinType.DURESS_PIN
            return await self._handle_duress_pin(pin_attempt)
        
        # Check based on current state
        if self.current_security_state == SecurityState.LOCKED:
            # Must be primary PIN attempt
            pin_attempt.pin_type = PinType.PRIMARY_PIN
            return await self._handle_primary_pin(pin_attempt)
        elif self.current_security_state == SecurityState.PHONE_UNLOCKED:
            # Must be owner PIN attempt
            pin_attempt.pin_type = PinType.OWNER_PIN
            return await self._handle_owner_pin(pin_attempt)
        else:
            return {
                "success": False,
                "security_state": self.current_security_state.value,
                "message": "Invalid state for PIN entry"
            }
    
    async def _handle_failed_attempt(self, pin_attempt: PinAttempt, message: str) -> Dict[str, Any]:
        """Handle failed PIN attempts with lockout logic"""
        self.dual_auth_system.failed_attempts += 1
        self.dual_auth_system.last_failed_attempt = datetime.utcnow()
        
        # Log failed attempt for intruder detection
        if self.intruder_session:
            self.intruder_session.failed_pin_attempts.append({
                "pin_entered": pin_attempt.pin[:2] + "*" * (len(pin_attempt.pin) - 2),  # Partial logging
                "pin_type": pin_attempt.pin_type.value,
                "timestamp": pin_attempt.timestamp.isoformat(),
                "attempt_number": self.dual_auth_system.failed_attempts
            })
        else:
            # Start intruder session on failed attempts
            self.intruder_session = IntruderEvidence()
            self.intruder_session.failed_pin_attempts.append({
                "pin_entered": pin_attempt.pin[:2] + "*" * (len(pin_attempt.pin) - 2),
                "pin_type": pin_attempt.pin_type.value,
                "timestamp": pin_attempt.timestamp.isoformat(),
                "attempt_number": self.dual_auth_system.failed_attempts
            })
        
        remaining_attempts = self.dual_auth_system.max_attempts - self.dual_auth_system.failed_attempts
        
        if remaining_attempts <= 0:
            await self._initiate_lockout()
            return {
                "success": False,
                "security_state": SecurityState.LOCKED.value,
                "message": f"Too many failed attempts. System locked for {self.dual_auth_system.lockout_duration} seconds",
                "lockout_active": True,
                "failed_attempts": self.dual_auth_system.failed_attempts
            }
        
        logger.warning(f"L1: Failed PIN attempt - {remaining_attempts} attempts remaining")
        return {
            "success": False,
            "security_state": self.current_security_state.value,
            "message": f"{message}. {remaining_attempts} attempts remaining",
            "remaining_attempts": remaining_attempts,
            "failed_attempts": self.dual_auth_system.failed_attempts
        }
    
    async def _initiate_lockout(self):
        """Initiate system lockout after too many failed attempts"""
        self.dual_auth_system.is_locked_out = True
        self.current_security_state = SecurityState.LOCKED
        
        await self._broadcast_security_state("System locked due to multiple failed PIN attempts")
        logger.warning(f"L1: System locked out for {self.dual_auth_system.lockout_duration} seconds")
    
    async def _initiate_silent_duress_protocol(self, pin_attempt: PinAttempt):
        """Silently initiate duress protocol without alerting attacker"""
        duress_event = {
            "event_type": "duress_pin_activated",
            "timestamp": datetime.utcnow(),
            "source_ip": pin_attempt.source_ip,
            "severity": "CRITICAL"
        }
        
        await db.security_events.insert_one(duress_event)
        
        # In real implementation, this would:
        # 1. Send silent emergency alerts to contacts
        # 2. Begin location tracking
        # 3. Start silent recording
        # 4. Prepare for remote wipe if needed
        
        logger.critical("L1: DURESS PROTOCOL ACTIVATED - Silent emergency response")
    
    async def _check_lockout_expired(self) -> bool:
        """Check if lockout period has expired"""
        if not self.dual_auth_system.last_failed_attempt:
            return True
        
        elapsed = (datetime.utcnow() - self.dual_auth_system.last_failed_attempt).total_seconds()
        return elapsed >= self.dual_auth_system.lockout_duration
    
    async def _get_remaining_lockout_time(self) -> int:
        """Get remaining lockout time in seconds"""
        if not self.dual_auth_system.last_failed_attempt:
            return 0
        
        elapsed = (datetime.utcnow() - self.dual_auth_system.last_failed_attempt).total_seconds()
        remaining = max(0, self.dual_auth_system.lockout_duration - elapsed)
        return int(remaining)
    
    async def _reset_lockout(self):
        """Reset lockout state"""
        self.dual_auth_system.is_locked_out = False
        self.dual_auth_system.failed_attempts = 0
        self.dual_auth_system.last_failed_attempt = None
    
    async def _reset_failed_attempts(self):
        """Reset failed attempt counter after successful auth"""
        self.dual_auth_system.failed_attempts = 0
        self.dual_auth_system.last_failed_attempt = None
    
    async def setup_dual_auth(self, primary_pin: str, owner_pin: str, duress_pin: str = "0000") -> Dict[str, Any]:
        """Setup or change dual authentication PINs"""
        # Validate PIN requirements
        if len(primary_pin) < 4 or len(owner_pin) < 4:
            return {
                "success": False,
                "message": "PINs must be at least 4 digits"
            }
        
        if primary_pin == owner_pin:
            return {
                "success": False,
                "message": "Primary and Owner PINs must be different"
            }
        
        # Update PINs
        self.dual_auth_system.primary_pin = primary_pin
        self.dual_auth_system.owner_pin = owner_pin
        self.dual_auth_system.duress_pin = duress_pin
        
        # Store in database (hashed)
        auth_config = {
            "primary_pin_hash": hashlib.sha256(primary_pin.encode()).hexdigest(),
            "owner_pin_hash": hashlib.sha256(owner_pin.encode()).hexdigest(),
            "duress_pin_hash": hashlib.sha256(duress_pin.encode()).hexdigest(),
            "created_at": datetime.utcnow(),
            "user_id": "default_user"
        }
        
        await db.dual_auth_config.replace_one(
            {"user_id": "default_user"}, 
            auth_config, 
            upsert=True
        )
        
        logger.info("L1: Dual authentication system configured successfully")
        return {
            "success": True,
            "message": "Dual authentication configured successfully",
            "primary_pin_set": True,
            "owner_pin_set": True,
            "duress_pin_set": True
        }
    
    async def get_security_status(self) -> Dict[str, Any]:
        """Get current security status"""
        return {
            "security_state": self.current_security_state.value,
            "dual_auth_configured": True,
            "failed_attempts": self.dual_auth_system.failed_attempts,
            "max_attempts": self.dual_auth_system.max_attempts,
            "is_locked_out": self.dual_auth_system.is_locked_out,
            "remaining_lockout_time": await self._get_remaining_lockout_time() if self.dual_auth_system.is_locked_out else 0,
            "intruder_session_active": self.intruder_session is not None,
            "constitution_rules": len(self.constitution_rules)
        }
    
    async def logout(self) -> Dict[str, Any]:
        """Logout and return to locked state"""
        previous_state = self.current_security_state
        self.current_security_state = SecurityState.LOCKED
        
        # End any intruder session
        if self.intruder_session:
            await self._end_intruder_session()
        
        await self._broadcast_security_state("User logged out - System locked")
        
        logger.info(f"L1: User logged out from {previous_state.value}")
        return {
            "success": True,
            "security_state": SecurityState.LOCKED.value,
            "message": "Logged out successfully"
        }
    
    async def _broadcast_security_state(self, message: str = ""):
        """Notify all agents of security state change"""
        await db.security_events.insert_one({
            "event_type": "security_state_change",
            "state": self.current_security_state.value,
            "message": message,
            "timestamp": datetime.utcnow()
        })
    
    async def _end_intruder_session(self):
        """End intruder session and store evidence"""
        if self.intruder_session:
            self.intruder_session.duration_seconds = int((datetime.utcnow() - self.intruder_session.session_start).total_seconds())
            await db.intruder_evidence.insert_one(self.intruder_session.dict())
            logger.info(f"L1: Intruder session ended - Evidence stored with {len(self.intruder_session.actions_logged)} actions logged")
            self.intruder_session = None

# ===============================
# L2 PROACTIVE AI ORCHESTRATOR (Updated for Dual Auth)
# ===============================

class L2ProactiveOrchestrator:
    def __init__(self):
        self.llm_chat = None
        self.initialize_llm()
        self.security_state = SecurityState.LOCKED
        self.current_context = ContextType.MORNING
        self.l3_agents = {}
        self.active_briefings = []
        
    def initialize_llm(self):
        """Initialize the Strategic AI with enhanced prompting"""
        try:
            api_key = os.environ.get('EMERGENT_LLM_KEY')
            self.llm_chat = LlmChat(
                api_key=api_key,
                session_id="aegis_l2_proactive_orchestrator",
                system_message="""You are the L2 Proactive AI Orchestrator of Aegis - the revolutionary "Digital Mate" operating system with DUAL AUTHENTICATION security.

CORE PHILOSOPHY: "Computer Butter" - You make interactions seamless, adaptive, and frictionless while maintaining iron-clad security.

DUAL AUTHENTICATION AWARENESS:
- LOCKED: System is locked, no access
- PHONE_UNLOCKED: Primary PIN entered, show DECOY data only
- OWNER_PRESENT: Owner PIN entered, show REAL data and full functionality

YOUR RESPONSIBILITIES:
1. SECURITY-AWARE RESPONSES: Always consider current authentication state
2. DECOY MODE MANAGEMENT: Provide convincing fake data when in PHONE_UNLOCKED state
3. PROACTIVE INTELLIGENCE: Anticipate needs while respecting security boundaries
4. DUAL AUTH SUPPORT: Guide users through two-PIN authentication process

RESPONSE ADAPTATION BY STATE:
- LOCKED: "Please unlock your device first"
- PHONE_UNLOCKED: Provide decoy data, suggest owner authentication for full features
- OWNER_PRESENT: Full proactive intelligence and real data access

RESPONSE FORMAT: Always respond with structured JSON:
{
    "parsed_intents": ["intent1", "intent2"],
    "execution_plan": [{"agent": "agent_name", "action": "action_name", "params": {...}}],
    "proactive_suggestions": ["suggestion1", "suggestion2"],
    "security_guidance": "guidance based on current auth state",
    "requires_owner_auth": boolean
}"""
            ).with_model("openai", "gpt-4o")
            logger.info("L2: Proactive AI Orchestrator initialized with dual auth support")
        except Exception as e:
            logger.error(f"L2: Failed to initialize LLM: {e}")
    
    async def update_security_state(self, new_state: SecurityState):
        """Update security state from L1"""
        self.security_state = new_state
        logger.info(f"L2: Security state updated to {new_state.value}")

# ===============================
# ENHANCED L3 AGENTS (Dual Auth Aware)
# ===============================

class L3DualAuthMessagesAgent:
    def __init__(self):
        self.name = "messages"
        
    async def process_contextual_action(self, action: str, params: Dict[str, Any], security_state: SecurityState) -> Dict[str, Any]:
        """Process messages with dual auth awareness"""
        context = params.get("context", "morning")
        
        if security_state == SecurityState.LOCKED:
            return {"status": "error", "message": "Device locked. Please unlock first."}
        elif security_state == SecurityState.PHONE_UNLOCKED:
            return await self._get_decoy_messages(context)
        elif security_state == SecurityState.OWNER_PRESENT:
            return await self._get_real_messages(context)
        else:
            return {"status": "error", "message": "Invalid security state"}
    
    async def _get_real_messages(self, context: str) -> Dict[str, Any]:
        """Get real user messages (owner authenticated)"""
        # In a real implementation, this would fetch actual user messages
        real_messages = [
            {"from": "Sarah", "content": "Can we reschedule our meeting to 3pm?", "timestamp": datetime.utcnow(), "type": "work", "priority": "high"},
            {"from": "Bank Alert", "content": "Large transaction detected: $2,500", "timestamp": datetime.utcnow(), "type": "finance", "priority": "urgent"},
            {"from": "Mom", "content": "Happy birthday! Love you ❤️", "timestamp": datetime.utcnow(), "type": "personal", "priority": "high"},
            {"from": "Dr. Smith", "content": "Your test results are in. Please call.", "timestamp": datetime.utcnow(), "type": "medical", "priority": "urgent"}
        ]
        
        return {
            "status": "success",
            "messages": real_messages,
            "count": len(real_messages),
            "context": context,
            "data_type": "real",
            "insights": [f"Real messages for {context} context", "4 unread messages", "2 urgent items require attention"]
        }
    
    async def _get_decoy_messages(self, context: str) -> Dict[str, Any]:
        """Return decoy messages (phone unlocked but not owner authenticated)"""
        decoy_messages = {
            "morning": [
                {"from": "Mom", "content": "Good morning! Have a great day", "timestamp": datetime.utcnow(), "type": "personal"},
                {"from": "Weather", "content": "Sunny, 72°F today", "timestamp": datetime.utcnow(), "type": "info"},
                {"from": "News", "content": "Daily news digest ready", "timestamp": datetime.utcnow(), "type": "info"}
            ],
            "work": [
                {"from": "Team", "content": "Meeting reminder for 2pm", "timestamp": datetime.utcnow(), "type": "work"},
                {"from": "Calendar", "content": "3 events scheduled today", "timestamp": datetime.utcnow(), "type": "reminder"}
            ],
            "evening": [
                {"from": "Friend", "content": "Want to grab dinner?", "timestamp": datetime.utcnow(), "type": "social"},
                {"from": "Netflix", "content": "New episodes available", "timestamp": datetime.utcnow(), "type": "entertainment"}
            ]
        }
        
        context_messages = decoy_messages.get(context, decoy_messages["morning"])
        
        return {
            "status": "success",
            "messages": context_messages,
            "count": len(context_messages),
            "context": context,
            "data_type": "decoy",
            "insights": [f"Decoy messages for {context} context", "Enter owner PIN for real messages"]
        }

# ===============================
# GLOBAL INSTANCES
# ===============================

# Initialize enhanced dual auth agents
l1_dual_auth_kernel = L1DualAuthKernelGuardian()
l2_proactive_orchestrator = L2ProactiveOrchestrator()
l3_dual_auth_messages = L3DualAuthMessagesAgent()

# ===============================
# DUAL AUTH API ENDPOINTS
# ===============================

@api_router.get("/")
async def root():
    return {
        "message": "Aegis Life OS - Your Digital Mate", 
        "version": "Dual Auth v1.0",
        "philosophy": "Computer Butter with Iron-Clad Security",
        "tagline": "Two PINs, Total Protection",
        "authentication": "Dual PIN System Active"
    }

@api_router.post("/auth/pin")
async def authenticate_with_pin(pin_data: Dict[str, Any]):
    """Dual PIN Authentication Endpoint"""
    try:
        pin_attempt = PinAttempt(
            pin=pin_data.get("pin", ""),
            pin_type=PinType(pin_data.get("pin_type", "auto_detect")),
            source_ip=pin_data.get("source_ip")
        )
        
        result = await l1_dual_auth_kernel.authenticate_with_pin(pin_attempt)
        
        # Update L2 orchestrator with new security state
        if result.get("success"):
            security_state = SecurityState(result["security_state"])
            await l2_proactive_orchestrator.update_security_state(security_state)
        
        return result
        
    except Exception as e:
        logger.error(f"PIN authentication failed: {e}")
        raise HTTPException(status_code=500, detail="Authentication failed")

@api_router.post("/auth/setup-dual-pins")
async def setup_dual_authentication(pin_setup: Dict[str, str]):
    """Setup or change dual authentication PINs"""
    try:
        primary_pin = pin_setup.get("primary_pin", "")
        owner_pin = pin_setup.get("owner_pin", "")
        duress_pin = pin_setup.get("duress_pin", "0000")
        
        result = await l1_dual_auth_kernel.setup_dual_auth(primary_pin, owner_pin, duress_pin)
        return result
        
    except Exception as e:
        logger.error(f"Dual PIN setup failed: {e}")
        raise HTTPException(status_code=500, detail="PIN setup failed")

@api_router.post("/auth/logout")
async def logout():
    """Logout and return to locked state"""
    try:
        result = await l1_dual_auth_kernel.logout()
        
        # Update L2 orchestrator
        await l2_proactive_orchestrator.update_security_state(SecurityState.LOCKED)
        
        return result
        
    except Exception as e:
        logger.error(f"Logout failed: {e}")
        raise HTTPException(status_code=500, detail="Logout failed")

@api_router.get("/auth/status")
async def get_auth_status():
    """Get current authentication status"""
    try:
        return await l1_dual_auth_kernel.get_security_status()
    except Exception as e:
        logger.error(f"Failed to get auth status: {e}")
        raise HTTPException(status_code=500, detail="Failed to get status")

@api_router.get("/agents/secure/{agent_name}")
async def get_secure_agent_data(agent_name: str, context: str = "morning"):
    """Get agent data with dual auth security"""
    try:
        security_state = l1_dual_auth_kernel.current_security_state
        
        if agent_name == "messages":
            result = await l3_dual_auth_messages.process_contextual_action(
                "get_recent", 
                {"context": context}, 
                security_state
            )
        else:
            result = {"status": "agent_not_found", "agent": agent_name}
            
        return result
        
    except Exception as e:
        logger.error(f"Failed to get secure agent data: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to get {agent_name} data")

@api_router.get("/system/dual-auth-status")
async def get_dual_auth_system_status():
    """Enhanced system status with dual auth information"""
    current_hour = datetime.utcnow().hour
    
    # Determine context based on time
    if 5 <= current_hour < 10:
        context = "morning"
    elif 10 <= current_hour < 17:
        context = "work"
    elif 17 <= current_hour < 22:
        context = "evening"
    else:
        context = "night"
    
    security_status = await l1_dual_auth_kernel.get_security_status()
    
    return {
        "system": "Aegis Life OS",
        "version": "Dual Auth v1.0",
        "tagline": "Your Digital Mate",
        "philosophy": "Computer Butter with Iron-Clad Security",
        "security_state": security_status["security_state"],
        "dual_auth_active": True,
        "current_context": context,
        "authentication_status": {
            "phone_unlocked": security_status["security_state"] in ["STATE_PHONE_UNLOCKED", "STATE_OWNER_PRESENT"],
            "owner_authenticated": security_status["security_state"] == "STATE_OWNER_PRESENT",
            "failed_attempts": security_status["failed_attempts"],
            "max_attempts": security_status["max_attempts"],
            "locked_out": security_status["is_locked_out"],
            "remaining_lockout": security_status["remaining_lockout_time"]
        },
        "data_mode": {
            "STATE_LOCKED": "No access",
            "STATE_PHONE_UNLOCKED": "Decoy data only", 
            "STATE_OWNER_PRESENT": "Real data access"
        }.get(security_status["security_state"], "Unknown"),
        "enhanced_agents": {
            "messages": "dual_auth_aware",
            "calendar": "dual_auth_aware", 
            "phantom_folder": "owner_only",
            "voice_interface": "duress_monitoring"
        },
        "constitution_rules": security_status["constitution_rules"],
        "intruder_detection": "active" if security_status["intruder_session_active"] else "standby",
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