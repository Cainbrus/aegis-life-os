from fastapi import FastAPI, APIRouter, HTTPException, BackgroundTasks
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
app = FastAPI(title="Aegis HPI OS", description="Hierarchical Proactive Intelligence Operating System")
api_router = APIRouter(prefix="/api")

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# ===============================
# AEGIS HPI ARCHITECTURE MODELS
# ===============================

class SecurityState(str, Enum):
    OWNER_PRESENT = "STATE_OWNER_PRESENT"
    UNKNOWN_USER = "STATE_UNKNOWN_USER"
    CODE_RED = "STATE_CODE_RED"

class AgentLevel(str, Enum):
    L1_KERNEL = "L1_KERNEL_GUARDIAN"
    L2_ORCHESTRATOR = "L2_AI_ORCHESTRATOR"
    L3_APP_AGENT = "L3_APP_AGENT"
    L4_SPECIALIST = "L4_SPECIALIST"

class UserGoal(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_input: str
    parsed_intents: List[str] = []
    execution_plan: List[Dict[str, Any]] = []
    status: str = "pending"
    created_at: datetime = Field(default_factory=datetime.utcnow)
    completed_at: Optional[datetime] = None

class BehavioralData(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str = "default_user"
    mouse_movements: List[Dict[str, Any]] = []
    typing_patterns: List[Dict[str, Any]] = []
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    is_owner: bool = True

class L3AgentMessage(BaseModel):
    agent_name: str
    action: str
    data: Dict[str, Any]
    timestamp: datetime = Field(default_factory=datetime.utcnow)

class PhantomFile(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    filename: str
    content: str
    sensitivity_level: float
    encrypted_content: str = ""
    created_at: datetime = Field(default_factory=datetime.utcnow)

# ===============================
# L1 KERNEL GUARDIAN
# ===============================

class L1KernelGuardian:
    def __init__(self):
        self.current_security_state = SecurityState.UNKNOWN_USER
        self.behavioral_model = None
        self.constitution_rules = [
            "PRIVACY_FIRST: Never expose user data without explicit consent",
            "SECURITY_BY_DESIGN: Always validate and authenticate requests",
            "MINIMAL_PRIVILEGE: Operate with least required permissions",
            "USER_VETO: User command always overrides AI suggestion"
        ]
    
    async def authenticate_user(self, behavioral_data: BehavioralData) -> SecurityState:
        """L1 Behavioral Authentication - Core security function"""
        try:
            # Simulate behavioral analysis
            confidence_score = await self._analyze_behavioral_patterns(behavioral_data)
            
            if confidence_score > 0.85:
                self.current_security_state = SecurityState.OWNER_PRESENT
                logger.info("L1: OWNER_PRESENT authentication successful")
            else:
                self.current_security_state = SecurityState.UNKNOWN_USER
                logger.warning("L1: UNKNOWN_USER detected, switching to decoy mode")
            
            await self._broadcast_security_state()
            return self.current_security_state
            
        except Exception as e:
            logger.error(f"L1 Authentication error: {e}")
            self.current_security_state = SecurityState.CODE_RED
            await self._initiate_code_red()
            return self.current_security_state
    
    async def _analyze_behavioral_patterns(self, data: BehavioralData) -> float:
        """Behavioral pattern analysis simulation"""
        # Simulate mouse movement analysis
        mouse_score = 0.9 if len(data.mouse_movements) > 5 else 0.3
        
        # Simulate typing rhythm analysis
        typing_score = 0.9 if len(data.typing_patterns) > 3 else 0.4
        
        # Combined confidence score
        return (mouse_score + typing_score) / 2
    
    async def _broadcast_security_state(self):
        """Notify all agents of security state change"""
        await db.security_events.insert_one({
            "event_type": "security_state_change",
            "state": self.current_security_state.value,
            "timestamp": datetime.utcnow()
        })
    
    async def _initiate_code_red(self):
        """Emergency security protocol"""
        logger.critical("L1: CODE RED INITIATED - System lockdown")
        await db.security_events.insert_one({
            "event_type": "code_red_initiated",
            "timestamp": datetime.utcnow(),
            "severity": "CRITICAL"
        })

# ===============================
# L2 AI ORCHESTRATOR 
# ===============================

class L2AIOrchestrator:
    def __init__(self):
        self.llm_chat = None
        self.initialize_llm()
        self.security_state = SecurityState.UNKNOWN_USER
        self.l3_agents = {}
        
    def initialize_llm(self):
        """Initialize the strategic AI with LLM"""
        try:
            api_key = os.environ.get('EMERGENT_LLM_KEY')
            self.llm_chat = LlmChat(
                api_key=api_key,
                session_id="aegis_l2_orchestrator",
                system_message="""You are the L2 AI Orchestrator of the Aegis HPI OS - a Strategic AI responsible for:

1. NATURAL LANGUAGE UNDERSTANDING: Parse complex multi-intent user goals
2. TASK DECOMPOSITION: Break down goals into logical execution plans
3. AGENT COORDINATION: Orchestrate L3 domain agents (Messages, Calendar, Photos)
4. INFORMATION SYNTHESIS: Aggregate data from multiple sources into actionable intelligence
5. SECURITY POLICY: Enforce decoy mode when UNKNOWN_USER is detected

RESPONSE FORMAT: Always respond with structured JSON containing:
{
    "parsed_intents": ["intent1", "intent2"],
    "execution_plan": [
        {"agent": "agent_name", "action": "action_name", "params": {...}},
    ],
    "proactive_suggestions": ["suggestion1", "suggestion2"],
    "security_notes": "any security considerations"
}

Remember: You coordinate but do not execute - delegate to L3 agents."""
            ).with_model("openai", "gpt-4o")
            logger.info("L2: AI Orchestrator initialized successfully")
        except Exception as e:
            logger.error(f"L2: Failed to initialize LLM: {e}")
    
    async def process_user_goal(self, user_input: str) -> UserGoal:
        """Core L2 function: Process and orchestrate user goals"""
        try:
            goal = UserGoal(user_input=user_input)
            
            # Step 1: Parse goal with Strategic AI
            user_message = UserMessage(text=f"Analyze this user goal and create execution plan: {user_input}")
            ai_response = await self.llm_chat.send_message(user_message)
            
            # Step 2: Parse AI response
            try:
                response_data = json.loads(ai_response)
                goal.parsed_intents = response_data.get("parsed_intents", [])
                goal.execution_plan = response_data.get("execution_plan", [])
            except json.JSONDecodeError:
                # Fallback if AI doesn't return valid JSON
                goal.parsed_intents = [user_input]
                goal.execution_plan = [{"agent": "general", "action": "process", "params": {"input": user_input}}]
            
            # Step 3: Check security state and apply decoy mode if needed
            if self.security_state == SecurityState.UNKNOWN_USER:
                goal = await self._apply_decoy_mode(goal)
            
            # Step 4: Store goal
            await db.user_goals.insert_one(goal.dict())
            
            # Step 5: Execute plan (delegate to L3 agents)
            await self._execute_plan(goal)
            
            return goal
            
        except Exception as e:
            logger.error(f"L2: Error processing user goal: {e}")
            raise HTTPException(status_code=500, detail="Failed to process user goal")
    
    async def _apply_decoy_mode(self, goal: UserGoal) -> UserGoal:
        """Apply decoy mode - sanitize data for unknown users"""
        logger.info("L2: Applying decoy mode for unknown user")
        
        # Modify execution plan to use decoy data
        for step in goal.execution_plan:
            step["decoy_mode"] = True
            if "params" in step:
                step["params"]["use_decoy_data"] = True
        
        goal.status = "decoy_mode_active"
        return goal
    
    async def _execute_plan(self, goal: UserGoal):
        """Execute the orchestrated plan by delegating to L3 agents"""
        for step in goal.execution_plan:
            agent_name = step.get("agent", "unknown")
            action = step.get("action", "process")
            params = step.get("params", {})
            
            # Delegate to appropriate L3 agent
            if agent_name in ["messages", "calendar", "photos"]:
                await self._delegate_to_l3_agent(agent_name, action, params)
            
        # Mark goal as completed
        goal.status = "completed"
        goal.completed_at = datetime.utcnow()
        await db.user_goals.update_one(
            {"id": goal.id}, 
            {"$set": {"status": goal.status, "completed_at": goal.completed_at}}
        )
    
    async def _delegate_to_l3_agent(self, agent_name: str, action: str, params: Dict[str, Any]):
        """Delegate task to L3 agent"""
        message = L3AgentMessage(agent_name=agent_name, action=action, data=params)
        await db.l3_agent_messages.insert_one(message.dict())
        logger.info(f"L2: Delegated {action} to {agent_name} agent")
    
    async def update_security_state(self, new_state: SecurityState):
        """Update security state from L1"""
        self.security_state = new_state
        logger.info(f"L2: Security state updated to {new_state.value}")

# ===============================
# L3 APP AGENTS
# ===============================

class L3MessagesAgent:
    def __init__(self):
        self.name = "messages"
        self.decoy_mode = False
        
    async def process_action(self, action: str, params: Dict[str, Any]) -> Dict[str, Any]:
        """Process messages-related actions"""
        if params.get("use_decoy_data", False):
            return await self._get_decoy_messages()
        
        if action == "get_recent":
            return await self._get_recent_messages()
        elif action == "send":
            return await self._send_message(params)
        else:
            return {"status": "unknown_action", "action": action}
    
    async def _get_recent_messages(self) -> Dict[str, Any]:
        """Get recent messages from database"""
        messages = await db.messages.find().sort("timestamp", -1).limit(10).to_list(10)
        return {"status": "success", "messages": messages, "count": len(messages)}
    
    async def _get_decoy_messages(self) -> Dict[str, Any]:
        """Return decoy messages for unknown users"""
        decoy_messages = [
            {"from": "Mom", "content": "Don't forget to call grandma", "timestamp": datetime.utcnow()},
            {"from": "Work", "content": "Meeting moved to 3pm", "timestamp": datetime.utcnow()},
            {"from": "Bank", "content": "Your statement is ready", "timestamp": datetime.utcnow()}
        ]
        return {"status": "success", "messages": decoy_messages, "count": len(decoy_messages), "decoy": True}
    
    async def _send_message(self, params: Dict[str, Any]) -> Dict[str, Any]:
        """Send a message"""
        message_data = {
            "id": str(uuid.uuid4()),
            "to": params.get("to", "unknown"),
            "content": params.get("content", ""),
            "timestamp": datetime.utcnow(),
            "sent": True
        }
        await db.messages.insert_one(message_data)
        return {"status": "sent", "message_id": message_data["id"]}

class L3CalendarAgent:
    def __init__(self):
        self.name = "calendar"
        
    async def process_action(self, action: str, params: Dict[str, Any]) -> Dict[str, Any]:
        """Process calendar-related actions"""
        if params.get("use_decoy_data", False):
            return await self._get_decoy_events()
        
        if action == "get_events":
            return await self._get_upcoming_events()
        elif action == "create_event":
            return await self._create_event(params)
        else:
            return {"status": "unknown_action", "action": action}
    
    async def _get_upcoming_events(self) -> Dict[str, Any]:
        """Get upcoming calendar events"""
        events = await db.calendar_events.find(
            {"date": {"$gte": datetime.utcnow()}}
        ).sort("date", 1).limit(10).to_list(10)
        return {"status": "success", "events": events, "count": len(events)}
    
    async def _get_decoy_events(self) -> Dict[str, Any]:
        """Return decoy calendar events"""
        decoy_events = [
            {"title": "Team Meeting", "date": datetime.utcnow() + timedelta(hours=2), "location": "Conference Room"},
            {"title": "Dentist Appointment", "date": datetime.utcnow() + timedelta(days=1), "location": "Downtown Clinic"},
            {"title": "Grocery Shopping", "date": datetime.utcnow() + timedelta(days=2), "location": "Supermarket"}
        ]
        return {"status": "success", "events": decoy_events, "count": len(decoy_events), "decoy": True}
    
    async def _create_event(self, params: Dict[str, Any]) -> Dict[str, Any]:
        """Create a new calendar event"""
        event_data = {
            "id": str(uuid.uuid4()),
            "title": params.get("title", "New Event"),
            "date": datetime.fromisoformat(params.get("date", datetime.utcnow().isoformat())),
            "location": params.get("location", ""),
            "created_at": datetime.utcnow()
        }
        await db.calendar_events.insert_one(event_data)
        return {"status": "created", "event_id": event_data["id"]}

class L3PhotosAgent:
    def __init__(self):
        self.name = "photos"
        
    async def process_action(self, action: str, params: Dict[str, Any]) -> Dict[str, Any]:
        """Process photos-related actions"""
        if params.get("use_decoy_data", False):
            return await self._get_decoy_photos()
        
        if action == "get_recent":
            return await self._get_recent_photos()
        elif action == "analyze":
            return await self._analyze_photo(params)
        else:
            return {"status": "unknown_action", "action": action}
    
    async def _get_recent_photos(self) -> Dict[str, Any]:
        """Get recent photos"""
        photos = await db.photos.find().sort("timestamp", -1).limit(20).to_list(20)
        return {"status": "success", "photos": photos, "count": len(photos)}
    
    async def _get_decoy_photos(self) -> Dict[str, Any]:
        """Return decoy photos for unknown users"""
        decoy_photos = [
            {"id": "decoy1", "filename": "vacation.jpg", "location": "Beach", "timestamp": datetime.utcnow()},
            {"id": "decoy2", "filename": "dinner.jpg", "location": "Restaurant", "timestamp": datetime.utcnow()},
            {"id": "decoy3", "filename": "sunset.jpg", "location": "Park", "timestamp": datetime.utcnow()}
        ]
        return {"status": "success", "photos": decoy_photos, "count": len(decoy_photos), "decoy": True}
    
    async def _analyze_photo(self, params: Dict[str, Any]) -> Dict[str, Any]:
        """Analyze photo content (L4 specialist function)"""
        photo_id = params.get("photo_id", "unknown")
        # Simulate photo analysis
        analysis = {
            "objects_detected": ["person", "outdoor", "sky"],
            "faces_count": 1,
            "sensitivity_score": 0.3,
            "location_detected": "outdoor_scene"
        }
        return {"status": "analyzed", "photo_id": photo_id, "analysis": analysis}

# ===============================
# PHANTOM FOLDER (L0 Encrypted Partition)
# ===============================

class PhantomFolder:
    def __init__(self):
        self.encryption_key = None
        self._generate_encryption_key()
    
    def _generate_encryption_key(self):
        """Generate encryption key for phantom folder"""
        self.encryption_key = secrets.token_hex(32)
    
    async def store_sensitive_file(self, filename: str, content: str, sensitivity_level: float) -> str:
        """Store file in encrypted phantom partition"""
        # Simulate encryption
        encrypted_content = self._encrypt_content(content)
        
        phantom_file = PhantomFile(
            filename=filename,
            content=content,
            sensitivity_level=sensitivity_level,
            encrypted_content=encrypted_content
        )
        
        await db.phantom_files.insert_one(phantom_file.dict())
        logger.info(f"Phantom: Stored sensitive file {filename} with level {sensitivity_level}")
        return phantom_file.id
    
    def _encrypt_content(self, content: str) -> str:
        """Simulate content encryption"""
        return hashlib.sha256((content + self.encryption_key).encode()).hexdigest()
    
    async def retrieve_file(self, file_id: str, authenticated: bool = False) -> Optional[Dict[str, Any]]:
        """Retrieve file from phantom folder (only if authenticated)"""
        if not authenticated:
            return None
        
        file_data = await db.phantom_files.find_one({"id": file_id})
        if file_data:
            # Simulate decryption
            file_data["decrypted"] = True
            return file_data
        return None

# ===============================
# GLOBAL INSTANCES
# ===============================

# Initialize core agents
l1_kernel = L1KernelGuardian()
l2_orchestrator = L2AIOrchestrator()
l3_messages = L3MessagesAgent()
l3_calendar = L3CalendarAgent()
l3_photos = L3PhotosAgent()
phantom_folder = PhantomFolder()

# ===============================
# API ENDPOINTS
# ===============================

@api_router.get("/")
async def root():
    return {"message": "Aegis HPI OS - Hierarchical Proactive Intelligence System", "version": "MVP-1.0"}

@api_router.post("/auth/behavioral")
async def behavioral_authentication(behavioral_data: BehavioralData):
    """L1 Behavioral Authentication Endpoint"""
    try:
        security_state = await l1_kernel.authenticate_user(behavioral_data)
        await l2_orchestrator.update_security_state(security_state)
        
        return {
            "status": "success",
            "security_state": security_state.value,
            "authenticated": security_state == SecurityState.OWNER_PRESENT,
            "timestamp": datetime.utcnow()
        }
    except Exception as e:
        logger.error(f"Behavioral authentication failed: {e}")
        raise HTTPException(status_code=500, detail="Authentication failed")

@api_router.post("/orchestrator/goal")
async def process_user_goal(goal_request: Dict[str, str]):
    """L2 AI Orchestrator - Process User Goal"""
    try:
        user_input = goal_request.get("input", "")
        if not user_input:
            raise HTTPException(status_code=400, detail="User input required")
        
        goal = await l2_orchestrator.process_user_goal(user_input)
        
        return {
            "status": "success",
            "goal_id": goal.id,
            "parsed_intents": goal.parsed_intents,
            "execution_plan": goal.execution_plan,
            "goal_status": goal.status,
            "security_state": l2_orchestrator.security_state.value
        }
    except Exception as e:
        logger.error(f"Goal processing failed: {e}")
        raise HTTPException(status_code=500, detail="Failed to process goal")

@api_router.get("/agents/messages")
async def get_messages():
    """L3 Messages Agent - Get Messages"""
    try:
        # Check security state and return decoy data if unknown user
        if l1_kernel.current_security_state == SecurityState.UNKNOWN_USER:
            result = await l3_messages.process_action("get_recent", {"use_decoy_data": True})
        else:
            result = await l3_messages.process_action("get_recent", {})
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get messages: {e}")

@api_router.get("/agents/calendar")
async def get_calendar_events():
    """L3 Calendar Agent - Get Events"""
    try:
        # Check security state and return decoy data if unknown user
        if l1_kernel.current_security_state == SecurityState.UNKNOWN_USER:
            result = await l3_calendar.process_action("get_events", {"use_decoy_data": True})
        else:
            result = await l3_calendar.process_action("get_events", {})
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get calendar events: {e}")

@api_router.get("/agents/photos")
async def get_photos():
    """L3 Photos Agent - Get Photos"""
    try:
        # Check security state and return decoy data if unknown user
        if l1_kernel.current_security_state == SecurityState.UNKNOWN_USER:
            result = await l3_photos.process_action("get_recent", {"use_decoy_data": True})
        else:
            result = await l3_photos.process_action("get_recent", {})
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get photos: {e}")

@api_router.post("/phantom/store")
async def store_phantom_file(file_data: Dict[str, Any]):
    """Phantom Folder - Store Sensitive File"""
    try:
        if l1_kernel.current_security_state != SecurityState.OWNER_PRESENT:
            raise HTTPException(status_code=403, detail="Owner authentication required for phantom folder access")
        
        file_id = await phantom_folder.store_sensitive_file(
            filename=file_data.get("filename", "untitled"),
            content=file_data.get("content", ""),
            sensitivity_level=file_data.get("sensitivity", 0.5)
        )
        
        return {"status": "stored", "file_id": file_id, "encrypted": True}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to store phantom file: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to store file: {e}")

@api_router.get("/system/status")
async def get_system_status():
    """System Status - All Agents"""
    return {
        "system": "Aegis HPI OS",
        "version": "MVP-1.0",
        "security_state": l1_kernel.current_security_state.value,
        "l2_orchestrator": "active",
        "l3_agents": {
            "messages": "active",
            "calendar": "active", 
            "photos": "active"
        },
        "phantom_folder": "encrypted",
        "timestamp": datetime.utcnow()
    }

@api_router.get("/system/security-events")
async def get_security_events():
    """Get Recent Security Events"""
    try:
        events = await db.security_events.find().sort("timestamp", -1).limit(10).to_list(10)
        # Convert ObjectId to string to make it JSON serializable
        for event in events:
            if '_id' in event:
                event['_id'] = str(event['_id'])
        return {"status": "success", "events": events, "count": len(events)}
    except Exception as e:
        logger.error(f"Failed to get security events: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to get security events: {e}")

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