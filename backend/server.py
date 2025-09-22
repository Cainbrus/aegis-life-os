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
# ENHANCED TRAP MODELS
# ===============================

class SecurityState(str, Enum):
    LOCKED = "STATE_LOCKED"
    PHONE_UNLOCKED = "STATE_PHONE_UNLOCKED"  # First PIN entered - TRAP MODE ACTIVE
    OWNER_PRESENT = "STATE_OWNER_PRESENT"    # Second PIN entered - shows real data
    INTRUDER_DETECTED = "STATE_INTRUDER_DETECTED"
    CODE_RED = "STATE_CODE_RED"

class PinType(str, Enum):
    PRIMARY_PIN = "primary_pin"
    OWNER_PIN = "owner_pin"
    DURESS_PIN = "duress_pin"

class TrapAction(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    action_type: str  # app_open, search, scroll, tap, type, etc.
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
    photo_evidence: List[str] = []  # base64 encoded photos
    apps_accessed: List[str] = []
    search_attempts: List[Dict[str, Any]] = []
    behavioral_patterns: Dict[str, Any] = {}
    interest_areas: List[str] = []  # What they're looking for
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
# L1 TRAP KERNEL GUARDIAN
# ===============================

class L1TrapKernelGuardian:
    def __init__(self):
        self.current_security_state = SecurityState.LOCKED
        self.dual_auth_system = DualAuthSystem()
        self.active_intruder_session = None
        self.trap_mode_active = False
        self.constitution_rules = [
            "PRIVACY_FIRST: Never expose user data without explicit consent",
            "DUAL_AUTH_REQUIRED: Two-layer authentication protects against coercion", 
            "TRAP_MODE: Let intruders believe they have access while collecting evidence",
            "SILENT_SURVEILLANCE: Monitor and photograph without detection",
            "EVIDENCE_COLLECTION: Log every action for owner review",
            "BEHAVIORAL_ANALYSIS: Learn what intruders are seeking"
        ]
    
    async def authenticate_with_pin(self, pin_attempt: PinAttempt) -> Dict[str, Any]:
        """Dual PIN authentication with trap activation"""
        try:
            # Check lockout
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
            
            # Handle PIN types
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
        """Handle primary PIN - activates TRAP MODE"""
        if pin_attempt.pin == self.dual_auth_system.primary_pin:
            self.current_security_state = SecurityState.PHONE_UNLOCKED
            self.trap_mode_active = True
            await self._activate_trap_mode()
            await self._reset_failed_attempts()
            await self._broadcast_security_state("TRAP MODE ACTIVATED - Full surveillance active")
            
            logger.warning("L1: TRAP MODE ACTIVATED - Intruder surveillance began")
            return {
                "success": True,
                "security_state": SecurityState.PHONE_UNLOCKED.value,
                "message": "Phone unlocked successfully",  # Never reveal trap activation
                "trap_mode": True,  # Internal flag
                "full_access": True,  # Make them think they have full access
                "apps_available": True
            }
        else:
            return await self._handle_failed_attempt(pin_attempt, "PIN incorrect")
    
    async def _handle_owner_pin(self, pin_attempt: PinAttempt) -> Dict[str, Any]:
        """Handle owner PIN - deactivates trap, shows real data"""
        if self.current_security_state != SecurityState.PHONE_UNLOCKED:
            return {
                "success": False,
                "security_state": self.current_security_state.value,
                "message": "Must unlock phone first with primary PIN"
            }
        
        if pin_attempt.pin == self.dual_auth_system.owner_pin:
            await self._deactivate_trap_mode()
            self.current_security_state = SecurityState.OWNER_PRESENT
            await self._reset_failed_attempts()
            await self._broadcast_security_state("Owner authenticated - Real data access granted")
            
            logger.info("L1: OWNER AUTHENTICATED - Trap mode deactivated, real data accessible")
            return {
                "success": True,
                "security_state": SecurityState.OWNER_PRESENT.value,
                "message": "Owner access granted - Welcome back",
                "trap_mode": False,
                "full_access": True,
                "real_data": True
            }
        else:
            return await self._handle_failed_attempt(pin_attempt, "Owner PIN incorrect")
    
    async def _activate_trap_mode(self):
        """Activate comprehensive trap surveillance"""
        # Start new intruder session
        self.active_intruder_session = IntruderSession()
        
        # Log trap activation
        await db.trap_sessions.insert_one({
            "session_id": self.active_intruder_session.id,
            "trap_activated": datetime.utcnow(),
            "status": "active",
            "evidence_collected": 0
        })
        
        # Initialize behavioral tracking
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
            
            # Calculate evidence score
            evidence_score = len(self.active_intruder_session.actions_logged) * 10
            evidence_score += len(self.active_intruder_session.photo_evidence) * 50
            evidence_score += len(self.active_intruder_session.search_attempts) * 25
            evidence_score += self.active_intruder_session.behavioral_patterns.get("suspicious_actions", 0) * 100
            
            self.active_intruder_session.evidence_score = evidence_score
            
            # Store complete evidence
            await db.intruder_evidence.insert_one(self.active_intruder_session.dict())
            
            # Update trap session
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
        
        # Create trap action
        trap_action = TrapAction(
            action_type=action_data.get("action_type", "unknown"),
            app_name=action_data.get("app_name", "system"),
            details=action_data.get("details", {}),
            coordinates=action_data.get("coordinates"),
            duration_ms=action_data.get("duration_ms", 0),
            search_terms=action_data.get("search_terms", [])
        )
        
        # Analyze if action is suspicious
        trap_action.suspicious_behavior = await self._analyze_suspicious_behavior(trap_action)
        
        # Add to session
        self.active_intruder_session.actions_logged.append(trap_action)
        
        # Update app access tracking
        if trap_action.app_name not in self.active_intruder_session.apps_accessed:
            self.active_intruder_session.apps_accessed.append(trap_action.app_name)
            self.active_intruder_session.behavioral_patterns["app_switches"] += 1
        
        # Track search attempts
        if trap_action.search_terms:
            self.active_intruder_session.search_attempts.append({
                "terms": trap_action.search_terms,
                "app": trap_action.app_name,
                "timestamp": trap_action.timestamp
            })
            self.active_intruder_session.behavioral_patterns["search_attempts"] += 1
        
        # Update behavioral patterns
        if trap_action.app_name == "photos":
            self.active_intruder_session.behavioral_patterns["photo_access"] += 1
        elif trap_action.app_name == "messages":
            self.active_intruder_session.behavioral_patterns["message_access"] += 1
        elif trap_action.app_name == "settings":
            self.active_intruder_session.behavioral_patterns["settings_access"] += 1
        
        if trap_action.suspicious_behavior:
            self.active_intruder_session.behavioral_patterns["suspicious_actions"] += 1
        
        # Store real-time (for immediate owner access)
        await db.live_trap_actions.insert_one(trap_action.dict())
        
        logger.info(f"TRAP: Logged {trap_action.action_type} in {trap_action.app_name}")
        
        return {
            "logged": True,
            "action_id": trap_action.id,
            "suspicious": trap_action.suspicious_behavior,
            "total_actions": len(self.active_intruder_session.actions_logged)
        }
    
    async def capture_intruder_photo(self, photo_data: str) -> Dict[str, Any]:
        """Silently capture intruder photo"""
        if not self.trap_mode_active or not self.active_intruder_session:
            return {"captured": False, "reason": "trap_mode_inactive"}
        
        # Store photo evidence
        self.active_intruder_session.photo_evidence.append(photo_data)
        
        # Log photo capture action
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
    
    async def _analyze_suspicious_behavior(self, action: TrapAction) -> bool:
        """Analyze if action indicates suspicious behavior"""
        suspicious_indicators = [
            # Searching for sensitive terms
            any(term.lower() in ["password", "bank", "ssn", "credit", "private", "secret", "hidden"] 
                for term in action.search_terms),
            
            # Accessing sensitive apps repeatedly
            action.app_name in ["banking", "finance", "passwords", "settings", "security"],
            
            # Looking through photos extensively
            action.app_name == "photos" and action.action_type in ["scroll", "search", "view_details"],
            
            # Trying to access system settings
            action.app_name == "settings" and "security" in str(action.details).lower(),
            
            # Rapid app switching (reconnaissance behavior)
            action.action_type == "app_switch" and action.duration_ms < 2000,
            
            # Screenshot attempts
            "screenshot" in str(action.details).lower(),
            
            # Typing potential passwords or PINs
            action.action_type == "type" and len(action.details.get("text", "")) == 4 and action.details.get("text", "").isdigit()
        ]
        
        return any(suspicious_indicators)
    
    async def get_trap_status(self) -> Dict[str, Any]:
        """Get current trap mode status (for owner only)"""
        if not self.active_intruder_session:
            return {
                "trap_active": False,
                "message": "No active trap session"
            }
        
        duration = (datetime.utcnow() - self.active_intruder_session.session_start).total_seconds()
        
        return {
            "trap_active": self.trap_mode_active,
            "session_id": self.active_intruder_session.id,
            "duration_seconds": int(duration),
            "actions_logged": len(self.active_intruder_session.actions_logged),
            "photos_captured": len(self.active_intruder_session.photo_evidence),
            "apps_accessed": self.active_intruder_session.apps_accessed,
            "search_attempts": len(self.active_intruder_session.search_attempts),
            "behavioral_patterns": self.active_intruder_session.behavioral_patterns,
            "suspicion_level": self.active_intruder_session.suspicion_level,
            "latest_actions": [action.dict() for action in self.active_intruder_session.actions_logged[-5:]]
        }
    
    async def _handle_failed_attempt(self, pin_attempt: PinAttempt, message: str) -> Dict[str, Any]:
        """Handle failed PIN attempts"""
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
        """Handle duress PIN with enhanced trap mode"""
        if pin_attempt.pin == self.dual_auth_system.duress_pin:
            # Activate trap mode but also trigger emergency
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
        """Auto-detect PIN type"""
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
        """Initiate system lockout"""
        self.dual_auth_system.is_locked_out = True
        self.current_security_state = SecurityState.LOCKED
        
        if self.trap_mode_active:
            await self._deactivate_trap_mode()
        
        await self._broadcast_security_state("System locked due to multiple failed PIN attempts")
    
    async def _initiate_silent_duress_protocol(self, pin_attempt: PinAttempt):
        """Silent duress protocol with enhanced evidence collection"""
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
        """Check if lockout expired"""
        if not self.dual_auth_system.last_failed_attempt:
            return True
        elapsed = (datetime.utcnow() - self.dual_auth_system.last_failed_attempt).total_seconds()
        return elapsed >= self.dual_auth_system.lockout_duration
    
    async def _get_remaining_lockout_time(self) -> int:
        """Get remaining lockout time"""
        if not self.dual_auth_system.last_failed_attempt:
            return 0
        elapsed = (datetime.utcnow() - self.dual_auth_system.last_failed_attempt).total_seconds()
        return int(max(0, self.dual_auth_system.lockout_duration - elapsed))
    
    async def _reset_lockout(self):
        """Reset lockout state"""
        self.dual_auth_system.is_locked_out = False
        self.dual_auth_system.failed_attempts = 0
        self.dual_auth_system.last_failed_attempt = None
    
    async def _reset_failed_attempts(self):
        """Reset failed attempts"""
        self.dual_auth_system.failed_attempts = 0
        self.dual_auth_system.last_failed_attempt = None
    
    async def setup_dual_auth(self, primary_pin: str, owner_pin: str, duress_pin: str = "0000") -> Dict[str, Any]:
        """Setup dual authentication"""
        if len(primary_pin) < 4 or len(owner_pin) < 4:
            return {"success": False, "message": "PINs must be at least 4 digits"}
        
        if primary_pin == owner_pin:
            return {"success": False, "message": "Primary and Owner PINs must be different"}
        
        self.dual_auth_system.primary_pin = primary_pin
        self.dual_auth_system.owner_pin = owner_pin
        self.dual_auth_system.duress_pin = duress_pin
        
        return {
            "success": True,
            "message": "Dual authentication configured successfully with trap system"
        }
    
    async def _broadcast_security_state(self, message: str = ""):
        """Broadcast security state change"""
        await db.security_events.insert_one({
            "event_type": "security_state_change",
            "state": self.current_security_state.value,
            "message": message,
            "timestamp": datetime.utcnow(),
            "trap_mode": self.trap_mode_active
        })

# ===============================
# TRAP-AWARE APP AGENTS
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

l1_trap_kernel = L1TrapKernelGuardian()
l3_trap_agent = L3TrapAwareAgent("trap_system")

# ===============================
# TRAP API ENDPOINTS
# ===============================

@api_router.get("/")
async def root():
    return {
        "message": "Aegis Life OS - Your Digital Mate", 
        "version": "Trap System v1.0",
        "philosophy": "Perfect Trap - Let Them Think They Won",
        "tagline": "Two PINs, Total Deception",
        "trap_system": "Active and Invisible"
    }

@api_router.post("/auth/pin")
async def authenticate_with_pin(pin_data: Dict[str, Any]):
    """Dual PIN Authentication with Trap Activation"""
    try:
        pin_attempt = PinAttempt(
            pin=pin_data.get("pin", ""),
            pin_type=PinType(pin_data.get("pin_type", "auto_detect")),
            source_ip=pin_data.get("source_ip")
        )
        
        result = await l1_trap_kernel.authenticate_with_pin(pin_attempt)
        return result
        
    except Exception as e:
        logger.error(f"PIN authentication failed: {e}")
        raise HTTPException(status_code=500, detail="Authentication failed")

@api_router.post("/trap/log-action")
async def log_trap_action(action_data: Dict[str, Any]):
    """Log intruder action in trap mode"""
    try:
        result = await l1_trap_kernel.log_trap_action(action_data)
        return result
    except Exception as e:
        logger.error(f"Failed to log trap action: {e}")
        raise HTTPException(status_code=500, detail="Failed to log action")

@api_router.post("/trap/capture-photo")
async def capture_intruder_photo(photo_data: Dict[str, str]):
    """Silently capture intruder photo"""
    try:
        photo_base64 = photo_data.get("photo", "")
        result = await l1_trap_kernel.capture_intruder_photo(photo_base64)
        return result
    except Exception as e:
        logger.error(f"Failed to capture photo: {e}")
        raise HTTPException(status_code=500, detail="Failed to capture photo")

@api_router.get("/trap/app/{app_name}")
async def get_trap_app_data(app_name: str, action: str = "view", context: str = "evening"):
    """Get convincing fake data for any app in trap mode"""
    try:
        # Log the app access
        await l1_trap_kernel.log_trap_action({
            "action_type": "app_open",
            "app_name": app_name,
            "details": {"action": action, "context": context},
            "timestamp": datetime.utcnow()
        })
        
        # Return fake but convincing data
        trap_data = await l3_trap_agent.get_trap_data(app_name, action, context)
        return trap_data
        
    except Exception as e:
        logger.error(f"Failed to get trap app data: {e}")
        raise HTTPException(status_code=500, detail="Failed to get app data")

@api_router.post("/trap/search")
async def log_trap_search(search_data: Dict[str, Any]):
    """Log search attempts in trap mode"""
    try:
        search_terms = search_data.get("terms", [])
        app_name = search_data.get("app", "unknown")
        
        # Log search attempt
        await l1_trap_kernel.log_trap_action({
            "action_type": "search",
            "app_name": app_name,
            "search_terms": search_terms,
            "details": {"query": " ".join(search_terms)},
            "timestamp": datetime.utcnow()
        })
        
        # Return fake search results
        fake_results = {
            "results": [
                {"title": "No results found", "description": "Try different search terms"},
                {"title": "Search feature temporarily unavailable", "description": "Please try again later"}
            ],
            "count": 0,
            "search_terms": search_terms
        }
        
        return {"status": "success", "data": fake_results, "trap_active": True}
        
    except Exception as e:
        logger.error(f"Failed to log search: {e}")
        raise HTTPException(status_code=500, detail="Search failed")

@api_router.get("/trap/status")
async def get_trap_status():
    """Get trap status (owner only)"""
    try:
        if l1_trap_kernel.current_security_state != SecurityState.OWNER_PRESENT:
            raise HTTPException(status_code=403, detail="Owner authentication required")
        
        status = await l1_trap_kernel.get_trap_status()
        return status
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to get trap status: {e}")
        raise HTTPException(status_code=500, detail="Failed to get status")

@api_router.get("/trap/evidence")
async def get_trap_evidence():
    """Get collected trap evidence (owner only)"""
    try:
        if l1_trap_kernel.current_security_state != SecurityState.OWNER_PRESENT:
            raise HTTPException(status_code=403, detail="Owner authentication required")
        
        # Get recent trap sessions
        sessions = await db.intruder_evidence.find().sort("session_start", -1).limit(5).to_list(5)
        
        # Convert ObjectId to string
        for session in sessions:
            if '_id' in session:
                session['_id'] = str(session['_id'])
        
        # Get live actions if trap is active
        live_actions = []
        if l1_trap_kernel.trap_mode_active:
            live_actions = await db.live_trap_actions.find().sort("timestamp", -1).limit(10).to_list(10)
            for action in live_actions:
                if '_id' in action:
                    action['_id'] = str(action['_id'])
        
        return {
            "status": "success",
            "trap_sessions": sessions,
            "live_actions": live_actions,
            "trap_currently_active": l1_trap_kernel.trap_mode_active
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to get trap evidence: {e}")
        raise HTTPException(status_code=500, detail="Failed to get evidence")

@api_router.get("/system/trap-status")
async def get_system_trap_status():
    """Get system status with trap information"""
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
        "version": "Trap System v1.0",
        "tagline": "Your Digital Mate",
        "philosophy": "Perfect Trap - Invisible Surveillance",
        "security_state": l1_trap_kernel.current_security_state.value,
        "trap_system": {
            "active": l1_trap_kernel.trap_mode_active,
            "mode": "comprehensive_surveillance" if l1_trap_kernel.trap_mode_active else "standby",
            "evidence_collection": "active" if l1_trap_kernel.trap_mode_active else "inactive",
            "photo_capture": "silent_mode" if l1_trap_kernel.trap_mode_active else "disabled",
            "app_access": "full_decoy" if l1_trap_kernel.trap_mode_active else "restricted"
        },
        "dual_auth_active": True,
        "current_context": context,
        "data_mode": {
            "STATE_LOCKED": "No access",
            "STATE_PHONE_UNLOCKED": "TRAP MODE - Full fake access", 
            "STATE_OWNER_PRESENT": "Real data access"
        }.get(l1_trap_kernel.current_security_state.value, "Unknown"),
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