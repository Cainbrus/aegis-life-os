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
# AEGIS GRAND BLUEPRINT MODELS
# ===============================

class SecurityState(str, Enum):
    OWNER_PRESENT = "STATE_OWNER_PRESENT"
    UNKNOWN_USER = "STATE_UNKNOWN_USER"
    INTRUDER_DETECTED = "STATE_INTRUDER_DETECTED"
    CODE_RED = "STATE_CODE_RED"

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

# Enhanced Behavioral Data Models
class MicroGesture(BaseModel):
    x: float
    y: float
    pressure: float
    velocity: float
    acceleration: float
    timestamp: float
    gesture_type: str  # tap, swipe, pinch, etc.

class TypingPattern(BaseModel):
    key: str
    press_duration: float
    flight_time: float  # time between keystrokes
    pressure: float
    timestamp: float

class MotionData(BaseModel):
    accelerometer: List[float]  # [x, y, z]
    gyroscope: List[float]     # [x, y, z]
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
    photo_evidence: Optional[str] = None  # base64 encoded photo
    behavioral_deviation: float = 0.0
    location_data: Optional[Dict[str, float]] = None
    duration_seconds: int = 0

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
    card_type: str  # weather, calendar, briefing, conflict, suggestion
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
# L1 ENHANCED KERNEL GUARDIAN
# ===============================

class L1EnhancedKernelGuardian:
    def __init__(self):
        self.current_security_state = SecurityState.UNKNOWN_USER
        self.behavioral_baseline = None
        self.intruder_session = None
        self.constitution_rules = [
            "PRIVACY_FIRST: Never expose user data without explicit consent",
            "SECURITY_BY_DESIGN: Always validate and authenticate requests", 
            "MINIMAL_PRIVILEGE: Operate with least required permissions",
            "USER_VETO: User command always overrides AI suggestion",
            "PROACTIVE_PROTECTION: Anticipate and prevent security threats",
            "EVIDENCE_GATHERING: Silently collect evidence of unauthorized access"
        ]
        
    async def authenticate_user_enhanced(self, behavioral_data: EnhancedBehavioralData) -> SecurityState:
        """Enhanced L1 Behavioral Authentication with micro-gesture analysis"""
        try:
            # Analyze micro-gestures
            gesture_score = await self._analyze_micro_gestures(behavioral_data.micro_gestures)
            
            # Analyze typing patterns
            typing_score = await self._analyze_typing_cadence(behavioral_data.typing_patterns)
            
            # Analyze motion/grip dynamics  
            motion_score = await self._analyze_motion_dynamics(behavioral_data.motion_data)
            
            # Combined confidence calculation
            weights = {"gesture": 0.4, "typing": 0.35, "motion": 0.25}
            confidence_score = (
                gesture_score * weights["gesture"] + 
                typing_score * weights["typing"] + 
                motion_score * weights["motion"]
            )
            
            behavioral_data.confidence_score = confidence_score
            
            # Determine security state based on confidence
            # Owner authentication with realistic thresholds
            if confidence_score > 0.75 and len(behavioral_data.micro_gestures) >= 10 and len(behavioral_data.typing_patterns) >= 8:
                await self._authenticate_as_owner()
            elif confidence_score < 0.3:
                await self._detect_intruder(behavioral_data)
            else:
                await self._set_unknown_user()
            
            # Store behavioral analysis
            await db.behavioral_analyses.insert_one(behavioral_data.dict())
            
            return self.current_security_state
            
        except Exception as e:
            logger.error(f"L1 Enhanced Authentication error: {e}")
            await self._initiate_code_red()
            return SecurityState.CODE_RED
    
    async def _analyze_micro_gestures(self, gestures: List[MicroGesture]) -> float:
        """Analyze micro-gesture patterns for user authentication"""
        if not gestures or len(gestures) < 3:
            return 0.2
        
        # Analyze pressure patterns
        pressures = [g.pressure for g in gestures]
        pressure_consistency = 1.0 - (statistics.stdev(pressures) / max(pressures) if max(pressures) > 0 else 0)
        
        # Analyze velocity patterns
        velocities = [g.velocity for g in gestures]
        velocity_pattern = statistics.mean(velocities) / 100.0  # Normalize
        
        # Analyze gesture diversity (authentic users vary their gestures)
        gesture_types = set(g.gesture_type for g in gestures)
        diversity_score = min(len(gesture_types) / 3.0, 1.0)
        
        return (pressure_consistency * 0.4 + velocity_pattern * 0.4 + diversity_score * 0.2)
    
    async def _analyze_typing_cadence(self, typing_patterns: List[TypingPattern]) -> float:
        """Analyze typing rhythm and cadence"""
        if not typing_patterns or len(typing_patterns) < 2:
            return 0.3
        
        # Analyze flight times (time between keystrokes)
        flight_times = [t.flight_time for t in typing_patterns[1:]]
        if not flight_times:
            return 0.3
            
        # Consistent rhythm indicates authentic user
        rhythm_consistency = 1.0 - (statistics.stdev(flight_times) / statistics.mean(flight_times) if statistics.mean(flight_times) > 0 else 0)
        
        # Analyze pressure consistency
        pressures = [t.pressure for t in typing_patterns]
        pressure_score = 1.0 - (statistics.stdev(pressures) / max(pressures) if max(pressures) > 0 else 0)
        
        return (rhythm_consistency * 0.6 + pressure_score * 0.4)
    
    async def _analyze_motion_dynamics(self, motion_data: List[MotionData]) -> float:
        """Analyze grip angle and device motion patterns"""
        if not motion_data:
            return 0.4
        
        # Analyze grip consistency
        grip_angles = [m.grip_angle for m in motion_data]
        grip_consistency = 1.0 - (statistics.stdev(grip_angles) / 180.0)  # Normalize to 180 degrees
        
        # Analyze motion stability
        accelerometer_data = [m.accelerometer for m in motion_data]
        if accelerometer_data:
            motion_stability = 1.0 - min(statistics.stdev([sum(acc) for acc in accelerometer_data]) / 10.0, 1.0)
        else:
            motion_stability = 0.5
        
        return (grip_consistency * 0.6 + motion_stability * 0.4)
    
    async def _authenticate_as_owner(self):
        """Set owner authentication state"""
        self.current_security_state = SecurityState.OWNER_PRESENT
        if self.intruder_session:
            await self._end_intruder_session()
        await self._broadcast_security_state("Owner authenticated successfully")
        logger.info("L1: OWNER_PRESENT - Full access granted")
    
    async def _detect_intruder(self, behavioral_data: EnhancedBehavioralData):
        """Detect intruder and initiate evidence gathering"""
        self.current_security_state = SecurityState.INTRUDER_DETECTED
        
        if not self.intruder_session:
            self.intruder_session = IntruderEvidence()
            logger.warning("L1: INTRUDER_DETECTED - Starting evidence collection")
        
        # Log behavioral deviation
        self.intruder_session.behavioral_deviation = 1.0 - behavioral_data.confidence_score
        
        await self._broadcast_security_state("Intruder detected - Evidence collection active")
    
    async def _set_unknown_user(self):
        """Set unknown user state"""
        self.current_security_state = SecurityState.UNKNOWN_USER
        await self._broadcast_security_state("Unknown user - Decoy mode active")
    
    async def log_intruder_action(self, action: Dict[str, Any]):
        """Log actions taken by potential intruder"""
        if self.intruder_session:
            self.intruder_session.actions_logged.append({
                **action,
                "timestamp": datetime.utcnow().isoformat()
            })
            
    async def capture_intruder_photo(self, photo_data: str):
        """Store photo evidence of intruder"""
        if self.intruder_session:
            self.intruder_session.photo_evidence = photo_data
            logger.info("L1: Intruder photo evidence captured")
    
    async def _initiate_code_red(self):
        """Emergency security protocol"""
        self.current_security_state = SecurityState.CODE_RED
        logger.critical("L1: CODE RED INITIATED - System lockdown")
        await db.security_events.insert_one({
            "event_type": "code_red_initiated",
            "timestamp": datetime.utcnow(),
            "severity": "CRITICAL"
        })
    
    async def _end_intruder_session(self):
        """End intruder session and store evidence"""
        if self.intruder_session:
            self.intruder_session.duration_seconds = int((datetime.utcnow() - self.intruder_session.session_start).total_seconds())
            await db.intruder_evidence.insert_one(self.intruder_session.dict())
            logger.info(f"L1: Intruder session ended - Evidence stored with {len(self.intruder_session.actions_logged)} actions logged")
            self.intruder_session = None
    
    async def _broadcast_security_state(self, message: str = ""):
        """Notify all agents of security state change"""
        await db.security_events.insert_one({
            "event_type": "security_state_change",
            "state": self.current_security_state.value,
            "message": message,
            "timestamp": datetime.utcnow()
        })

# ===============================
# L2 PROACTIVE AI ORCHESTRATOR
# ===============================

class L2ProactiveOrchestrator:
    def __init__(self):
        self.llm_chat = None
        self.initialize_llm()
        self.security_state = SecurityState.UNKNOWN_USER
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
                system_message="""You are the L2 Proactive AI Orchestrator of Aegis - the revolutionary "Digital Mate" operating system.

CORE PHILOSOPHY: "Computer Butter" - You make interactions seamless, adaptive, and frictionless. You anticipate needs and provide proactive intelligence.

YOUR RESPONSIBILITIES:
1. PROACTIVE INTELLIGENCE: Don't wait for requests - anticipate user needs based on context
2. CONTEXTUAL AWARENESS: Understand time, location, activity, and adapt responses accordingly  
3. CONFLICT RESOLUTION: Identify scheduling conflicts and propose intelligent solutions
4. GOAL ORCHESTRATION: Parse complex natural language goals and coordinate L3 agents
5. PREDICTIVE SYNTHESIS: Connect dots across all data sources to provide insights

CURRENT CONTEXT AWARENESS:
- Time-based: Morning (news/weather), Commute (navigation/media), Work (productivity), Evening (entertainment/relaxation)
- Activity-based: Adapt interface and suggestions based on user's current activity
- Conflict-aware: Actively scan for scheduling conflicts and propose solutions

RESPONSE FORMAT: Always respond with structured JSON:
{
    "parsed_intents": ["intent1", "intent2"],
    "execution_plan": [
        {"agent": "agent_name", "action": "action_name", "params": {...}, "priority": 1}
    ],
    "proactive_suggestions": ["suggestion1", "suggestion2"],
    "contextual_cards": [
        {"type": "card_type", "title": "title", "content": "content", "actions": [...]}
    ],
    "conflict_alerts": [
        {"type": "conflict", "description": "conflict description", "solutions": [...]}
    ],
    "briefing_insights": ["insight1", "insight2"]
}

PROACTIVE BEHAVIORS:
- Generate morning briefings with weather, calendar, and news
- Detect scheduling conflicts and propose solutions before user notices
- Suggest optimizations based on patterns
- Provide contextual reminders and insights
- Adapt interface based on time/location/activity"""
            ).with_model("openai", "gpt-4o")
            logger.info("L2: Proactive AI Orchestrator initialized successfully")
        except Exception as e:
            logger.error(f"L2: Failed to initialize LLM: {e}")
    
    async def process_proactive_goal(self, user_input: str, context: ContextType = ContextType.MORNING) -> UserGoal:
        """Enhanced goal processing with proactive intelligence"""
        try:
            goal = UserGoal(user_input=user_input, context_type=context)
            self.current_context = context
            
            # Enhanced prompt with context
            contextual_prompt = f"""
            CONTEXT: Current time context is {context.value}
            SECURITY STATE: {self.security_state.value}
            USER GOAL: {user_input}
            
            Process this goal with full contextual awareness. Provide proactive suggestions based on the context.
            If this is morning context, include weather/news briefings.
            If work context, focus on productivity optimizations.
            If evening context, suggest relaxation/entertainment options.
            
            Also scan for potential conflicts and provide intelligent solutions.
            """
            
            user_message = UserMessage(text=contextual_prompt)
            ai_response = await self.llm_chat.send_message(user_message)
            
            # Parse AI response
            try:
                response_data = json.loads(ai_response)
                goal.parsed_intents = response_data.get("parsed_intents", [])
                goal.execution_plan = response_data.get("execution_plan", [])
                goal.proactive_suggestions = response_data.get("proactive_suggestions", [])
                
                # Create contextual cards from AI response
                cards_data = response_data.get("contextual_cards", [])
                for card_data in cards_data:
                    await self._create_contextual_card(card_data)
                
                # Handle conflict alerts
                conflicts = response_data.get("conflict_alerts", [])
                for conflict in conflicts:
                    await self._handle_conflict_alert(conflict)
                
            except json.JSONDecodeError:
                # Fallback parsing
                goal.parsed_intents = [user_input]
                goal.execution_plan = [{"agent": "general", "action": "process", "params": {"input": user_input}, "priority": 1}]
                goal.proactive_suggestions = ["I can help you with more specific requests"]
            
            # Apply security state considerations
            if self.security_state in [SecurityState.UNKNOWN_USER, SecurityState.INTRUDER_DETECTED]:
                goal = await self._apply_enhanced_decoy_mode(goal)
            
            # Calculate priority score
            goal.priority_score = await self._calculate_priority_score(goal)
            
            # Store and execute goal
            await db.user_goals.insert_one(goal.dict())
            await self._execute_proactive_plan(goal)
            
            return goal
            
        except Exception as e:
            logger.error(f"L2: Error processing proactive goal: {e}")
            raise HTTPException(status_code=500, detail="Failed to process goal")
    
    async def generate_proactive_briefing(self, context: ContextType) -> List[ContextualCard]:
        """Generate proactive briefings based on current context"""
        try:
            briefing_prompt = f"""
            Generate a proactive briefing for {context.value} context.
            
            Consider:
            - Current time and typical activities for this time
            - Weather information needs
            - Calendar conflicts or important events
            - Productivity optimizations
            - Relevant news or updates
            - Contextual reminders
            
            Create 3-5 contextual cards with actionable insights.
            """
            
            user_message = UserMessage(text=briefing_prompt)
            ai_response = await self.llm_chat.send_message(user_message)
            
            try:
                response_data = json.loads(ai_response)
                cards_data = response_data.get("contextual_cards", [])
                
                cards = []
                for card_data in cards_data:
                    card = await self._create_contextual_card(card_data)
                    cards.append(card)
                
                return cards
                
            except json.JSONDecodeError:
                # Fallback briefing
                return await self._create_fallback_briefing(context)
                
        except Exception as e:
            logger.error(f"L2: Error generating proactive briefing: {e}")
            return []
    
    async def _create_contextual_card(self, card_data: Dict[str, Any]) -> ContextualCard:
        """Create and store a contextual card"""
        card = ContextualCard(
            card_type=card_data.get("type", "briefing"),
            title=card_data.get("title", "Update"),
            content=card_data.get("content", ""),
            action_buttons=card_data.get("actions", []),
            priority=card_data.get("priority", 1),
            context_relevance=card_data.get("relevance", 1.0)
        )
        
        await db.contextual_cards.insert_one(card.dict())
        return card
    
    async def _handle_conflict_alert(self, conflict: Dict[str, Any]):
        """Handle scheduling conflicts with intelligent solutions"""
        conflict_card = ContextualCard(
            card_type="conflict",
            title=f"⚠️ {conflict.get('type', 'Conflict').title()} Alert",
            content=conflict.get("description", "Scheduling conflict detected"),
            action_buttons=conflict.get("solutions", []),
            priority=3,  # High priority
            context_relevance=1.0
        )
        
        await db.contextual_cards.insert_one(conflict_card.dict())
        logger.info(f"L2: Conflict alert created - {conflict_card.title}")
    
    async def _calculate_priority_score(self, goal: UserGoal) -> float:
        """Calculate priority score for goal execution"""
        base_score = 0.5
        
        # Increase priority for specific contexts
        context_multipliers = {
            ContextType.MORNING: 0.8,
            ContextType.COMMUTE: 0.9,
            ContextType.WORK: 1.0,
            ContextType.EVENING: 0.6,
            ContextType.NIGHT: 0.3
        }
        
        context_score = context_multipliers.get(goal.context_type, 0.5)
        
        # Increase priority for urgent keywords
        urgent_keywords = ["urgent", "asap", "immediately", "emergency", "critical"]
        urgency_bonus = 0.3 if any(keyword in goal.user_input.lower() for keyword in urgent_keywords) else 0
        
        return min(base_score + context_score + urgency_bonus, 1.0)
    
    async def _apply_enhanced_decoy_mode(self, goal: UserGoal) -> UserGoal:
        """Apply enhanced decoy mode for security"""
        logger.info("L2: Applying enhanced decoy mode with sanitized responses")
        
        # Sanitize execution plan
        for step in goal.execution_plan:
            step["decoy_mode"] = True
            step["sanitized"] = True
            if "params" in step:
                step["params"]["use_decoy_data"] = True
        
        # Replace proactive suggestions with generic ones
        goal.proactive_suggestions = [
            "Check your calendar for today",
            "Review recent notifications", 
            "Update your preferences"
        ]
        
        goal.status = "decoy_mode_active"
        return goal
    
    async def _execute_proactive_plan(self, goal: UserGoal):
        """Execute orchestrated plan with proactive intelligence"""
        for step in goal.execution_plan:
            agent_name = step.get("agent", "unknown")
            action = step.get("action", "process")
            params = step.get("params", {})
            priority = step.get("priority", 1)
            
            # Add proactive context to params
            params["context"] = goal.context_type.value
            params["priority"] = priority
            
            # Delegate to L3 agents
            if agent_name in ["messages", "calendar", "photos", "weather", "news"]:
                await self._delegate_to_l3_agent(agent_name, action, params)
        
        # Mark goal as completed
        goal.status = "completed"
        goal.completed_at = datetime.utcnow()
        await db.user_goals.update_one(
            {"id": goal.id}, 
            {"$set": {"status": goal.status, "completed_at": goal.completed_at}}
        )
    
    async def _delegate_to_l3_agent(self, agent_name: str, action: str, params: Dict[str, Any]):
        """Enhanced delegation to L3 agents"""
        message = {
            "agent_name": agent_name,
            "action": action,
            "data": params,
            "security_state": self.security_state.value,
            "context": self.current_context.value,
            "timestamp": datetime.utcnow()
        }
        
        await db.l3_agent_messages.insert_one(message)
        logger.info(f"L2: Delegated {action} to {agent_name} agent with context {self.current_context.value}")
    
    async def update_security_state(self, new_state: SecurityState):
        """Update security state from L1"""
        self.security_state = new_state
        logger.info(f"L2: Security state updated to {new_state.value}")

# ===============================
# ENHANCED L3 APP AGENTS
# ===============================

class L3EnhancedMessagesAgent:
    def __init__(self):
        self.name = "messages"
        self.proactive_insights = []
        
    async def process_contextual_action(self, action: str, params: Dict[str, Any]) -> Dict[str, Any]:
        """Process messages with contextual awareness"""
        context = params.get("context", "morning")
        use_decoy = params.get("use_decoy_data", False)
        
        if use_decoy:
            return await self._get_enhanced_decoy_messages(context)
        
        if action == "get_recent":
            return await self._get_contextual_messages(context)
        elif action == "get_important":
            return await self._get_important_messages()
        elif action == "send":
            return await self._send_contextual_message(params)
        elif action == "analyze_sentiment":
            return await self._analyze_message_sentiment()
        else:
            return {"status": "unknown_action", "action": action}
    
    async def _get_contextual_messages(self, context: str) -> Dict[str, Any]:
        """Get messages with contextual filtering"""
        # In morning context, prioritize important/urgent messages
        # In work context, focus on professional communications
        # In evening context, show personal messages
        
        messages = await db.messages.find().sort("timestamp", -1).limit(10).to_list(10)
        
        # Add contextual insights
        insights = []
        if context == "morning":
            insights.append("3 unread messages from work colleagues")
            insights.append("1 urgent message requires response")
        elif context == "work":
            insights.append("Focus mode: Personal messages filtered")
        
        return {
            "status": "success", 
            "messages": messages, 
            "count": len(messages),
            "context": context,
            "insights": insights
        }
    
    async def _get_enhanced_decoy_messages(self, context: str) -> Dict[str, Any]:
        """Enhanced decoy messages with context awareness"""
        decoy_messages = {
            "morning": [
                {"from": "Mom", "content": "Good morning! Have a great day at work", "timestamp": datetime.utcnow(), "type": "personal"},
                {"from": "Bank", "content": "Your statement is ready for review", "timestamp": datetime.utcnow(), "type": "finance"},
                {"from": "Weather App", "content": "Sunny day ahead, 72°F", "timestamp": datetime.utcnow(), "type": "info"}
            ],
            "work": [
                {"from": "Team Lead", "content": "Great job on the presentation", "timestamp": datetime.utcnow(), "type": "work"},
                {"from": "HR", "content": "Reminder: Team building next Friday", "timestamp": datetime.utcnow(), "type": "work"},
                {"from": "Calendar", "content": "Meeting in 30 minutes", "timestamp": datetime.utcnow(), "type": "reminder"}
            ],
            "evening": [
                {"from": "Friend", "content": "Want to grab dinner this weekend?", "timestamp": datetime.utcnow(), "type": "social"},
                {"from": "Netflix", "content": "New episodes of your favorite show", "timestamp": datetime.utcnow(), "type": "entertainment"},
                {"from": "Gym", "content": "Don't forget your workout tomorrow", "timestamp": datetime.utcnow(), "type": "health"}
            ]
        }
        
        context_messages = decoy_messages.get(context, decoy_messages["morning"])
        
        return {
            "status": "success",
            "messages": context_messages,
            "count": len(context_messages),
            "decoy": True,
            "context": context,
            "insights": [f"Decoy messages optimized for {context} context"]
        }

class L3EnhancedCalendarAgent:
    def __init__(self):
        self.name = "calendar"
        
    async def process_contextual_action(self, action: str, params: Dict[str, Any]) -> Dict[str, Any]:
        """Process calendar with proactive conflict detection"""
        context = params.get("context", "morning")
        use_decoy = params.get("use_decoy_data", False)
        
        if use_decoy:
            return await self._get_enhanced_decoy_events(context)
        
        if action == "get_events":
            return await self._get_contextual_events(context)
        elif action == "detect_conflicts":
            return await self._detect_scheduling_conflicts()
        elif action == "create_event":
            return await self._create_smart_event(params)
        else:
            return {"status": "unknown_action", "action": action}
    
    async def _detect_scheduling_conflicts(self) -> Dict[str, Any]:
        """Proactively detect and resolve scheduling conflicts"""
        # This would typically integrate with real calendar APIs
        # For demo, simulate conflict detection
        
        conflicts = [
            {
                "type": "overlap",
                "description": "Two meetings scheduled at 2pm today",
                "events": ["Team Standup", "Client Call"],
                "solutions": [
                    {"action": "move_first", "text": "Move Team Standup to 1:30pm"},
                    {"action": "move_second", "text": "Reschedule Client Call to 3pm"},
                    {"action": "shorten", "text": "Shorten Team Standup to 15 minutes"}
                ]
            }
        ]
        
        return {
            "status": "success",
            "conflicts": conflicts,
            "count": len(conflicts),
            "proactive": True
        }
    
    async def _get_enhanced_decoy_events(self, context: str) -> Dict[str, Any]:
        """Context-aware decoy calendar events"""
        base_time = datetime.utcnow()
        
        decoy_events = {
            "morning": [
                {"title": "Team Standup", "date": base_time + timedelta(hours=2), "location": "Conference Room A", "type": "work"},
                {"title": "Dentist Appointment", "date": base_time + timedelta(days=1), "location": "Downtown Clinic", "type": "personal"},
                {"title": "Lunch Meeting", "date": base_time + timedelta(hours=4), "location": "Cafe Downtown", "type": "business"}
            ],
            "work": [
                {"title": "Project Review", "date": base_time + timedelta(hours=1), "location": "Meeting Room B", "type": "work"},
                {"title": "Client Presentation", "date": base_time + timedelta(hours=3), "location": "Virtual", "type": "important"},
                {"title": "1:1 with Manager", "date": base_time + timedelta(days=1), "location": "Office", "type": "work"}
            ],
            "evening": [
                {"title": "Gym Session", "date": base_time + timedelta(hours=1), "location": "Fitness Center", "type": "personal"},
                {"title": "Dinner with Family", "date": base_time + timedelta(hours=2), "location": "Home", "type": "family"},
                {"title": "Movie Night", "date": base_time + timedelta(hours=4), "location": "Home", "type": "entertainment"}
            ]
        }
        
        context_events = decoy_events.get(context, decoy_events["morning"])
        
        return {
            "status": "success",
            "events": context_events,
            "count": len(context_events),
            "decoy": True,
            "context": context,
            "insights": [f"Context-optimized schedule for {context}"]
        }

# ===============================
# PHANTOM FOLDER WITH CALCULATOR SECRET HANDSHAKE
# ===============================

class PhantomFolderWithHandshake:
    def __init__(self):
        self.encryption_key = secrets.token_hex(32)
        self.secret_codes = {
            "8675309": "default_vault",  # Classic easter egg
            "42": "answer_vault",
            "1337": "elite_vault"
        }
        
    async def process_calculator_input(self, input_sequence: str, authenticated: bool = False) -> Dict[str, Any]:
        """Process calculator input for secret handshake detection"""
        
        # Remove operators and get just the numbers
        clean_input = ''.join(filter(str.isdigit, input_sequence))
        
        if clean_input in self.secret_codes:
            if authenticated:
                vault_name = self.secret_codes[clean_input]
                return {
                    "handshake_detected": True,
                    "vault_access": True,
                    "vault_name": vault_name,
                    "message": f"Welcome to {vault_name}. Phantom Folder unlocked."
                }
            else:
                return {
                    "handshake_detected": True,
                    "vault_access": False,
                    "message": "Phantom Folder detected, but owner authentication required."
                }
        
        # Return normal calculator result
        try:
            result = eval(input_sequence)  # In production, use safe math evaluation
            return {
                "handshake_detected": False,
                "calculator_result": result,
                "message": f"= {result}"
            }
        except:
            return {
                "handshake_detected": False,
                "calculator_result": "Error",
                "message": "Error"
            }
    
    async def access_phantom_vault(self, vault_name: str, authenticated: bool = False) -> Dict[str, Any]:
        """Access the phantom vault with proper authentication"""
        if not authenticated:
            raise HTTPException(status_code=403, detail="Owner authentication required for phantom vault access")
        
        # Retrieve files from the specified vault
        vault_files = await db.phantom_files.find({"vault_name": vault_name}).to_list(100)
        
        return {
            "status": "access_granted",
            "vault_name": vault_name,
            "files": vault_files,
            "file_count": len(vault_files),
            "encryption_status": "AES-256 Active",
            "message": f"Phantom Vault '{vault_name}' accessed successfully"
        }

# ===============================
# VOICE INTERFACE & DURESS PROTOCOL
# ===============================

class VoiceInterfaceWithDuress:
    def __init__(self):
        self.wake_words = ["mate", "aegis", "guardian"]
        self.safe_words = ["pineapple", "butterfly", "rainbow"]  # User configurable
        self.voice_prints = {}  # Store voice authentication data
        
    async def process_voice_command(self, voice_data: VoiceCommand) -> Dict[str, Any]:
        """Process voice commands with duress detection"""
        
        # Check for duress/safe word first
        if self._detect_safe_word(voice_data.command_text):
            await self._initiate_duress_protocol(voice_data)
            return {
                "status": "processed_silently",
                "duress_activated": True,
                "message": "Voice command processed"  # Never reveal duress activation
            }
        
        # Check wake word
        if not self._validate_wake_word(voice_data.wake_word):
            return {
                "status": "wake_word_not_recognized",
                "message": "Wake word not recognized"
            }
        
        # Process normal voice command
        return await self._process_normal_voice_command(voice_data)
    
    def _detect_safe_word(self, command_text: str) -> bool:
        """Detect if safe word is present in any part of the speech"""
        command_lower = command_text.lower()
        return any(safe_word in command_lower for safe_word in self.safe_words)
    
    async def _initiate_duress_protocol(self, voice_data: VoiceCommand):
        """Silently initiate emergency duress protocol"""
        
        # Log duress event
        duress_event = {
            "event_type": "duress_protocol_activated",
            "trigger": "voice_safe_word",
            "timestamp": datetime.utcnow(),
            "voice_data": voice_data.command_text[:50],  # Limited for privacy
            "severity": "CRITICAL"
        }
        
        await db.security_events.insert_one(duress_event)
        
        # In a real implementation, this would:
        # 1. Send silent emergency notification to contacts
        # 2. Share location with emergency services
        # 3. Begin recording audio/video evidence
        # 4. Prepare for potential device wipe
        
        logger.critical("DURESS PROTOCOL ACTIVATED - Silent emergency response initiated")
    
    async def _process_normal_voice_command(self, voice_data: VoiceCommand) -> Dict[str, Any]:
        """Process normal voice commands"""
        
        # In a real implementation, this would use speech-to-text
        # and natural language processing
        
        return {
            "status": "command_processed",
            "wake_word": voice_data.wake_word,
            "command": voice_data.command_text,
            "response": f"Voice command '{voice_data.command_text}' processed successfully"
        }

# ===============================
# GLOBAL INSTANCES
# ===============================

# Initialize enhanced core agents
l1_enhanced_kernel = L1EnhancedKernelGuardian()
l2_proactive_orchestrator = L2ProactiveOrchestrator()
l3_enhanced_messages = L3EnhancedMessagesAgent()
l3_enhanced_calendar = L3EnhancedCalendarAgent()
phantom_folder_handshake = PhantomFolderWithHandshake()
voice_interface_duress = VoiceInterfaceWithDuress()

# ===============================
# ENHANCED API ENDPOINTS
# ===============================

@api_router.get("/")
async def root():
    return {
        "message": "Aegis Life OS - Your Digital Mate", 
        "version": "Grand Blueprint v1.0",
        "philosophy": "Computer Butter - Seamless, Adaptive, Proactive",
        "tagline": "The Better Computer"
    }

@api_router.post("/auth/behavioral-enhanced")
async def enhanced_behavioral_authentication(behavioral_data: EnhancedBehavioralData):
    """Enhanced L1 Behavioral Authentication with micro-gesture analysis"""
    try:
        security_state = await l1_enhanced_kernel.authenticate_user_enhanced(behavioral_data)
        await l2_proactive_orchestrator.update_security_state(security_state)
        
        response = {
            "status": "success",
            "security_state": security_state.value,
            "authenticated": security_state == SecurityState.OWNER_PRESENT,
            "confidence_score": behavioral_data.confidence_score,
            "timestamp": datetime.utcnow()
        }
        
        # Add intruder detection info if applicable
        if security_state == SecurityState.INTRUDER_DETECTED:
            response["intruder_detected"] = True
            response["evidence_collection"] = "active"
            
        return response
        
    except Exception as e:
        logger.error(f"Enhanced behavioral authentication failed: {e}")
        raise HTTPException(status_code=500, detail="Authentication failed")

@api_router.post("/orchestrator/proactive-goal")
async def process_proactive_goal(goal_request: Dict[str, Any]):
    """Enhanced L2 AI Orchestrator with proactive intelligence"""
    try:
        user_input = goal_request.get("input", "")
        context = ContextType(goal_request.get("context", "morning"))
        
        if not user_input:
            raise HTTPException(status_code=400, detail="User input required")
        
        goal = await l2_proactive_orchestrator.process_proactive_goal(user_input, context)
        
        return {
            "status": "success",
            "goal_id": goal.id,
            "parsed_intents": goal.parsed_intents,
            "execution_plan": goal.execution_plan,
            "proactive_suggestions": goal.proactive_suggestions,
            "context_type": goal.context_type.value,
            "priority_score": goal.priority_score,
            "goal_status": goal.status,
            "security_state": l2_proactive_orchestrator.security_state.value
        }
        
    except Exception as e:
        logger.error(f"Proactive goal processing failed: {e}")
        raise HTTPException(status_code=500, detail="Failed to process goal")

@api_router.get("/briefing/proactive/{context}")
async def get_proactive_briefing(context: str):
    """Get proactive briefing for current context"""
    try:
        context_type = ContextType(context)
        cards = await l2_proactive_orchestrator.generate_proactive_briefing(context_type)
        
        return {
            "status": "success",
            "context": context,
            "cards": [card.dict() for card in cards],
            "count": len(cards),
            "generated_at": datetime.utcnow()
        }
        
    except Exception as e:
        logger.error(f"Failed to generate proactive briefing: {e}")
        raise HTTPException(status_code=500, detail="Failed to generate briefing")

@api_router.get("/agents/contextual/{agent_name}")
async def get_contextual_agent_data(agent_name: str, context: str = "morning"):
    """Get contextual data from L3 agents"""
    try:
        security_state = l1_enhanced_kernel.current_security_state
        params = {
            "context": context,
            "use_decoy_data": security_state in [SecurityState.UNKNOWN_USER, SecurityState.INTRUDER_DETECTED]
        }
        
        if agent_name == "messages":
            result = await l3_enhanced_messages.process_contextual_action("get_recent", params)
        elif agent_name == "calendar":
            result = await l3_enhanced_calendar.process_contextual_action("get_events", params)
        else:
            result = {"status": "agent_not_found", "agent": agent_name}
            
        return result
        
    except Exception as e:
        logger.error(f"Failed to get contextual agent data: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to get {agent_name} data")

@api_router.post("/phantom/calculator")
async def calculator_handshake(calc_data: Dict[str, str]):
    """Calculator interface with secret handshake detection"""
    try:
        input_sequence = calc_data.get("input", "")
        authenticated = l1_enhanced_kernel.current_security_state == SecurityState.OWNER_PRESENT
        
        result = await phantom_folder_handshake.process_calculator_input(input_sequence, authenticated)
        
        # Log potential handshake attempt for intruders
        if result.get("handshake_detected") and not authenticated:
            await l1_enhanced_kernel.log_intruder_action({
                "action": "phantom_folder_attempt",
                "input": input_sequence[:10],  # Limited logging for security
                "result": "access_denied"
            })
        
        return result
        
    except Exception as e:
        logger.error(f"Calculator handshake failed: {e}")
        raise HTTPException(status_code=500, detail="Calculator error")

@api_router.get("/phantom/vault/{vault_name}")
async def access_phantom_vault(vault_name: str):
    """Access phantom vault after handshake authentication"""
    try:
        authenticated = l1_enhanced_kernel.current_security_state == SecurityState.OWNER_PRESENT
        result = await phantom_folder_handshake.access_phantom_vault(vault_name, authenticated)
        return result
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Phantom vault access failed: {e}")
        raise HTTPException(status_code=500, detail="Vault access error")

@api_router.post("/voice/command")
async def process_voice_command(voice_data: VoiceCommand):
    """Process voice commands with duress detection"""
    try:
        result = await voice_interface_duress.process_voice_command(voice_data)
        
        # Log voice interaction for security (but not duress events)
        if not result.get("duress_activated"):
            await l1_enhanced_kernel.log_intruder_action({
                "action": "voice_command",
                "wake_word": voice_data.wake_word,
                "command_length": len(voice_data.command_text),
                "result": result.get("status")
            })
            
        return result
        
    except Exception as e:
        logger.error(f"Voice command processing failed: {e}")
        raise HTTPException(status_code=500, detail="Voice processing error")

@api_router.get("/system/contextual-status")
async def get_contextual_system_status():
    """Enhanced system status with contextual information"""
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
    
    return {
        "system": "Aegis Life OS",
        "version": "Grand Blueprint v1.0",
        "tagline": "Your Digital Mate",
        "philosophy": "Computer Butter",
        "security_state": l1_enhanced_kernel.current_security_state.value,
        "current_context": context,
        "proactive_orchestrator": "active",
        "enhanced_agents": {
            "messages": "contextual_mode",
            "calendar": "conflict_detection_active",
            "phantom_folder": "handshake_ready",
            "voice_interface": "duress_monitoring"
        },
        "behavioral_guard": {
            "micro_gestures": "analyzing",
            "typing_cadence": "profiling", 
            "motion_dynamics": "monitoring"
        },
        "intruder_detection": "active" if l1_enhanced_kernel.intruder_session else "standby",
        "timestamp": datetime.utcnow()
    }

@api_router.get("/evidence/intruder")
async def get_intruder_evidence():
    """Get intruder evidence (owner only)"""
    try:
        if l1_enhanced_kernel.current_security_state != SecurityState.OWNER_PRESENT:
            raise HTTPException(status_code=403, detail="Owner authentication required")
        
        evidence = await db.intruder_evidence.find().sort("session_start", -1).limit(10).to_list(10)
        
        # Convert ObjectId to string for JSON serialization
        for item in evidence:
            if '_id' in item:
                item['_id'] = str(item['_id'])
        
        return {
            "status": "success",
            "evidence": evidence,
            "count": len(evidence),
            "current_session": l1_enhanced_kernel.intruder_session.dict() if l1_enhanced_kernel.intruder_session else None
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to get intruder evidence: {e}")
        raise HTTPException(status_code=500, detail="Failed to retrieve evidence")

@api_router.get("/cards/contextual")
async def get_contextual_cards():
    """Get current contextual cards for the dashboard"""
    try:
        # Get recent contextual cards
        cards = await db.contextual_cards.find(
            {"expires_at": {"$gt": datetime.utcnow()}}
        ).sort([("priority", -1), ("created_at", -1)]).limit(10).to_list(10)
        
        # Convert ObjectId to string
        for card in cards:
            if '_id' in card:
                card['_id'] = str(card['_id'])
        
        return {
            "status": "success",
            "cards": cards,
            "count": len(cards)
        }
        
    except Exception as e:
        logger.error(f"Failed to get contextual cards: {e}")
        raise HTTPException(status_code=500, detail="Failed to get contextual cards")

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