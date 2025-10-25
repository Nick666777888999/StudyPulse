from fastapi import FastAPI, HTTPException, Depends, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
import jwt
import datetime
from database import Database
import uvicorn

app = FastAPI(title="StudyHub API", version="1.0.0")

# CORS 設定
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 安全性
security = HTTPBearer()
SECRET_KEY = "your-secret-key-here"  # 在生產環境中使用環境變數

# 資料庫初始化
db = Database()

# Pydantic 模型
class UserRegister(BaseModel):
    username: str
    password: str
    email: str
    display_name: str

class UserLogin(BaseModel):
    username: str
    password: str

class UserProfile(BaseModel):
    display_name: str
    bio: Optional[str] = None
    interests: List[str] = []
    avatar_url: Optional[str] = None

class FriendRequest(BaseModel):
    to_user_id: str

class MessageSend(BaseModel):
    content: str
    chat_type: str  # 'private' or 'group'
    target_id: str  # user_id or group_id

# 工具函數
def create_token(user_id: str):
    payload = {
        'user_id': user_id,
        'exp': datetime.datetime.utcnow() + datetime.timedelta(days=7)
    }
    return jwt.encode(payload, SECRET_KEY, algorithm='HS256')

def verify_token(token: str):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=['HS256'])
        return payload['user_id']
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")

# 身份驗證相依性
async def get_current_user(token: str = Depends(security)):
    user_id = verify_token(token.credentials)
    user = db.get_user_by_id(user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user

# 路由
@app.post("/api/register")
async def register(user_data: UserRegister):
    # 檢查用戶名是否已存在
    if db.get_user_by_username(user_data.username):
        raise HTTPException(status_code=400, detail="Username already exists")
    
    # 創建用戶
    user_id = db.create_user(
        username=user_data.username,
        password=user_data.password,  # 在生產環境中應該加密
        email=user_data.email,
        display_name=user_data.display_name
    )
    
    # 如果是管理員帳號
    if user_data.username == "Nick20130104":
        db.set_user_admin(user_id, True)
    
    token = create_token(user_id)
    return {"success": True, "token": token, "user_id": user_id}

@app.post("/api/login")
async def login(login_data: UserLogin):
    user = db.verify_user(login_data.username, login_data.password)
    if not user:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    token = create_token(user['id'])
    return {
        "success": True, 
        "token": token, 
        "user": {
            "id": user['id'],
            "username": user['username'],
            "display_name": user['display_name'],
            "is_admin": user.get('is_admin', False)
        }
    }

@app.get("/api/user/profile")
async def get_user_profile(current_user: dict = Depends(get_current_user)):
    return {"success": True, "profile": current_user}

@app.put("/api/user/profile")
async def update_user_profile(
    profile: UserProfile,
    current_user: dict = Depends(get_current_user)
):
    db.update_user_profile(current_user['id'], profile.dict())
    return {"success": True, "message": "Profile updated"}

@app.get("/api/friends")
async def get_friends(current_user: dict = Depends(get_current_user)):
    friends = db.get_user_friends(current_user['id'])
    return {"success": True, "friends": friends}

@app.post("/api/friends/request")
async def send_friend_request(
    request: FriendRequest,
    current_user: dict = Depends(get_current_user)
):
    success = db.send_friend_request(current_user['id'], request.to_user_id)
    if not success:
        raise HTTPException(status_code=400, detail="Friend request failed")
    return {"success": True, "message": "Friend request sent"}

@app.get("/api/friends/requests")
async def get_friend_requests(current_user: dict = Depends(get_current_user)):
    requests = db.get_pending_friend_requests(current_user['id'])
    return {"success": True, "requests": requests}

@app.post("/api/friends/accept/{request_id}")
async def accept_friend_request(
    request_id: str,
    current_user: dict = Depends(get_current_user)
):
    success = db.accept_friend_request(request_id)
    if not success:
        raise HTTPException(status_code=400, detail="Accept request failed")
    return {"success": True, "message": "Friend request accepted"}

@app.get("/api/chat/messages")
async def get_chat_messages(
    chat_type: str,
    target_id: str,
    current_user: dict = Depends(get_current_user)
):
    messages = db.get_chat_messages(current_user['id'], chat_type, target_id)
    return {"success": True, "messages": messages}

@app.post("/api/chat/send")
async def send_message(
    message: MessageSend,
    current_user: dict = Depends(get_current_user)
):
    message_id = db.create_message(
        sender_id=current_user['id'],
        content=message.content,
        chat_type=message.chat_type,
        target_id=message.target_id
    )
    return {"success": True, "message_id": message_id}

@app.get("/api/admin/dashboard")
async def admin_dashboard(current_user: dict = Depends(get_current_user)):
    if not current_user.get('is_admin'):
        raise HTTPException(status_code=403, detail="Admin access required")
    
    stats = db.get_admin_stats()
    return {"success": True, "stats": stats}

@app.get("/api/admin/users")
async def admin_get_users(current_user: dict = Depends(get_current_user)):
    if not current_user.get('is_admin'):
        raise HTTPException(status_code=403, detail="Admin access required")
    
    users = db.get_all_users()
    return {"success": True, "users": users}

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)