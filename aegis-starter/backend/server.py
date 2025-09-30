from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
from pydantic import BaseModel, Field
from typing import List, Dict, Any, Optional
from datetime import datetime
import uuid
from enum import Enum

# Initialize FastAPI
app = FastAPI(title="Aegis Life OS", description="Your Hierarchical Proactive Intelligence Digital Mate")

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Database
mongo_url = os.environ.get('MONGO_URL', 'mongodb://localhost:27017')
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ.get('DB_NAME', 'aegis_production')]

# Models
class SecurityState(str, Enum):
    LOCKED = "STATE_LOCKED"
    PHONE_UNLOCKED = "STATE_PHONE_UNLOCKED"
    OWNER_PRESENT = "STATE_OWNER_PRESENT"

class PatternAttempt(BaseModel):
    pattern: str
    pattern_type: str = "auto_detect"
    timestamp: datetime = Field(default_factory=datetime.utcnow)

class DualAuthSystem:
    def __init__(self):
        self.normal_pattern = "1-2-3-6-9"
        self.owner_code = "1-5-9-8-7" 
        self.duress_pattern = "2-5-8"
        self.current_state = SecurityState.LOCKED
        self.behavioral_trust = 0.8
        self.trap_mode_active = False

auth_system = DualAuthSystem()

# Routes
@app.get("/")
async def root():
    return {
        "message": "Aegis Life OS - Your Digital Mate",
        "status": "Active",
        "version": "1.0"
    }

@app.get("/api/auth/status")
async def get_auth_status():
    return {
        "security_state": auth_system.current_state.value,
        "trap_mode": auth_system.trap_mode_active,
        "system": "Aegis Pattern Authentication"
    }

@app.post("/api/auth/pattern")
async def authenticate_pattern(pattern_data: Dict[str, Any]):
    try:
        pattern = pattern_data.get("pattern", "")
        
        if pattern == auth_system.duress_pattern:
            # Emergency mode
            auth_system.current_state = SecurityState.PHONE_UNLOCKED
            auth_system.trap_mode_active = True
            return {
                "success": True,
                "security_state": SecurityState.PHONE_UNLOCKED.value,
                "message": "Phone unlocked",
                "mode": "emergency"
            }
        
        elif pattern == auth_system.owner_code:
            # Owner verified
            auth_system.current_state = SecurityState.OWNER_PRESENT
            auth_system.trap_mode_active = False
            return {
                "success": True,
                "security_state": SecurityState.OWNER_PRESENT.value,
                "message": "Welcome back! Your digital mate is ready.",
                "mode": "owner_mode"
            }
            
        elif pattern == auth_system.normal_pattern:
            # Normal unlock - AI decides based on behavior
            if auth_system.behavioral_trust > 0.7:
                # Likely owner
                auth_system.current_state = SecurityState.PHONE_UNLOCKED
                auth_system.trap_mode_active = False
                mode = "normal_phone"
            else:
                # Likely intruder - doge mode
                auth_system.current_state = SecurityState.PHONE_UNLOCKED
                auth_system.trap_mode_active = True
                mode = "doge_mode"
                
            return {
                "success": True,
                "security_state": SecurityState.PHONE_UNLOCKED.value,
                "message": "Phone unlocked",
                "mode": mode,
                "trap_mode": auth_system.trap_mode_active
            }
        
        else:
            return {
                "success": False,
                "security_state": auth_system.current_state.value,
                "message": "Pattern incorrect"
            }
            
    except Exception as e:
        return {"success": False, "message": "Authentication error"}

@app.post("/api/auth/setup-dual-patterns")
async def setup_patterns(pattern_data: Dict[str, str]):
    try:
        auth_system.normal_pattern = pattern_data.get("normal_pattern", "1-2-3-6-9")
        auth_system.owner_code = pattern_data.get("owner_code", "1-5-9-8-7")
        auth_system.duress_pattern = pattern_data.get("duress_pattern", "2-5-8")
        
        return {"success": True, "message": "Patterns configured successfully"}
    except:
        return {"success": False, "message": "Pattern setup failed"}

@app.post("/api/beta/signup")
async def beta_signup(signup_data: Dict[str, Any]):
    try:
        beta_user = {
            "email": signup_data.get("email", ""),
            "signup_timestamp": datetime.utcnow(),
            "source": signup_data.get("source", "landing_page"),
            "beta_id": str(uuid.uuid4())
        }
        
        await db.beta_users.insert_one(beta_user)
        
        return {
            "success": True,
            "message": "Successfully registered for Aegis beta",
            "beta_id": beta_user["beta_id"]
        }
    except:
        return {"success": False, "message": "Signup failed"}

@app.post("/api/onboarding/complete")
async def complete_onboarding(onboarding_data: Dict[str, Any]):
    try:
        record = {
            "user_id": str(uuid.uuid4()),
            "completed_at": datetime.utcnow(),
            "custom_wake_name": onboarding_data.get("customWakeName", "Mate"),
            "setup_version": "1.0"
        }
        
        await db.user_onboarding.insert_one(record)
        
        return {"success": True, "message": "Onboarding complete"}
    except:
        return {"success": False, "message": "Onboarding failed"}

@app.get("/api/onboarding/status")
async def get_onboarding_status():
    try:
        record = await db.user_onboarding.find_one({}, sort=[("completed_at", -1)])
        return {"onboarding_complete": record is not None}
    except:
        return {"onboarding_complete": False}

@app.get("/api/workforce/status")
async def get_workforce_status():
    if auth_system.current_state != SecurityState.OWNER_PRESENT:
        return {"error": "Owner authentication required"}
    
    return {
        "workforce_status": {
            "owner_status": "ACTIVE",
            "manager_status": "COORDINATING",
            "workers_active": 8,
            "total_workers": 12
        },
        "active_jobs": [
            {
                "title": "Analyzing morning schedule",
                "assigned_to": "Calendar Agent (L3)",
                "status": "IN_PROGRESS",
                "priority": "HIGH"
            }
        ],
        "recent_activity": [
            {
                "timestamp": datetime.utcnow().strftime("%H:%M:%S"),
                "agent": "L2 Manager",
                "action": "Delegated task to Calendar Agent",
                "type": "DELEGATION"
            }
        ]
    }

@app.get("/api/apps/{app_name}/data")
async def get_app_data(app_name: str):
    if auth_system.trap_mode_active:
        # Return fake data for trap mode
        fake_data = {
            "messages": {
                "recent_messages": [
                    {"from": "Mom", "content": "How was your day?", "time": "2 hours ago"},
                    {"from": "Work", "content": "Meeting at 2pm", "time": "4 hours ago"}
                ]
            },
            "photos": {
                "recent_photos": [
                    {"filename": "sunset.jpg", "date": "Yesterday"},
                    {"filename": "family.jpg", "date": "Last week"}
                ]
            }
        }
        return {
            "status": "success",
            "app": app_name,
            "data": fake_data.get(app_name, {}),
            "trap_active": True
        }
    else:
        return {
            "status": "success", 
            "app": app_name,
            "data": {"message": "Real data would be here"},
            "trap_active": False
        }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=int(os.environ.get("PORT", 8001)))