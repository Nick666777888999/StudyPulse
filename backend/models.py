from pydantic import BaseModel
from typing import List, Optional, Dict, Any
from datetime import datetime

class UserBase(BaseModel):
    username: str
    email: str
    display_name: str

class UserCreate(UserBase):
    password: str

class UserResponse(UserBase):
    id: str
    is_admin: bool = False
    created_at: datetime
    last_login: Optional[datetime] = None

class UserProfileUpdate(BaseModel):
    display_name: Optional[str] = None
    bio: Optional[str] = None
    interests: List[str] = []
    avatar_url: Optional[str] = None

class FriendRequestCreate(BaseModel):
    to_user_id: str

class FriendRequestResponse(BaseModel):
    id: str
    from_user_id: str
    from_username: str
    from_display_name: str
    status: str
    created_at: datetime

class MessageCreate(BaseModel):
    content: str
    chat_type: str
    target_id: str

class MessageResponse(BaseModel):
    id: str
    sender_id: str
    sender_username: str
    sender_display_name: str
    content: str
    chat_type: str
    target_id: str
    created_at: datetime

class AdminStats(BaseModel):
    total_users: int
    new_users_today: int
    total_friendships: int
    total_messages: int