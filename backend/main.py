# backend/main.py
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="StudyPulse API")

# CORS 設定
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
async def root():
    return {"message": "StudyPulse API is running!"}

@app.get("/api/")
async def api_root():
    return {
        "status": "success", 
        "endpoints": {
            "login": "/api/login",
            "register": "/api/register",
            "friends": "/api/friends",
            "chat": "/api/chat"
        }
    }

@app.post("/api/login")
async def login():
    return {
        "success": True,
        "token": "jwt-token-12345",
        "user": {
            "id": "1",
            "username": "testuser",
            "display_name": "測試用戶",
            "email": "test@studypulse.com",
            "is_admin": False
        }
    }

@app.post("/api/register")
async def register():
    return {"success": True, "message": "註冊成功"}

@app.get("/api/friends")
async def get_friends():
    return {
        "success": True,
        "friends": [
            {
                "id": "1",
                "username": "user1",
                "display_name": "小明",
                "avatar_url": None
            }
        ]
    }

@app.get("/api/chat/messages")
async def get_messages():
    return {
        "success": True,
        "messages": []
    }