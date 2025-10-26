from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

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
    return {"message": "API is working!"}

@app.get("/api/")
async def api_root():
    return {"status": "success", "endpoints": ["/", "/api/", "/api/test"]}

@app.get("/api/test")
async def test():
    return {"test": "ok"}

@app.post("/api/login")
async def login():
    return {"success": True, "token": "test-token-123"}

# 好友系統 API
@app.get("/api/friends")
async def get_friends():
    return {"success": True, "friends": []}

@app.get("/api/friends/requests")
async def get_friend_requests():
    return {"success": True, "requests": []}

@app.post("/api/friends/request")
async def send_friend_request():
    return {"success": True, "message": "Friend request sent"}

# 用戶資料 API
@app.get("/api/user/profile")
async def get_user_profile():
    return {
        "success": True, 
        "profile": {
            "display_name": "Test User",
            "username": "testuser",
            "email": "test@example.com",
            "avatar_url": null,
            "bio": "這是測試用戶",
            "interests": ["程式設計", "學習"],
            "is_admin": False
        }
    }

# 管理員 API
@app.get("/api/admin/dashboard")
async def admin_dashboard():
    return {
        "success": True, 
        "stats": {
            "total_users": 1,
            "new_users_today": 0,
            "total_friendships": 0,
            "total_messages": 0
        }
    }

@app.get("/api/admin/users")
async def admin_users():
    return {
        "success": True,
        "users": [
            {
                "id": "1",
                "username": "Nick20130104", 
                "display_name": "管理員",
                "email": "admin@example.com",
                "is_admin": True
            }
        ]
    }

# 添加所有缺失的 API 端點
@app.get("/api/friends")
async def get_friends():
    return {"success": True, "friends": []}

@app.get("/api/friends/requests") 
async def get_friend_requests():
    return {"success": True, "requests": []}

@app.post("/api/friends/request")
async def send_friend_request():
    return {"success": True, "message": "Friend request sent"}

@app.get("/api/user/profile")
async def get_user_profile():
    return {"success": True, "profile": {"display_name": "用戶", "avatar_url": null}}

@app.get("/api/admin/dashboard")
async def admin_dashboard():
    return {"success": True, "stats": {"total_users": 1, "new_users_today": 0, "total_friendships": 0, "total_messages": 0}}
