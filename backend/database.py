import sqlite3
import json
from typing import List, Dict, Any, Optional
import datetime

class Database:
    def __init__(self, db_path="studenthub.db"):
        self.db_path = db_path
        self.init_database()

    def get_connection(self):
        return sqlite3.connect(self.db_path)

    def init_database(self):
        conn = self.get_connection()
        cursor = conn.cursor()
        
        # 用戶表
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS users (
                id TEXT PRIMARY KEY,
                username TEXT UNIQUE NOT NULL,
                password TEXT NOT NULL,
                email TEXT NOT NULL,
                display_name TEXT NOT NULL,
                bio TEXT,
                interests TEXT,
                avatar_url TEXT,
                is_admin BOOLEAN DEFAULT FALSE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                last_login TIMESTAMP
            )
        ''')
        
        # 好友關係表
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS friends (
                id TEXT PRIMARY KEY,
                user1_id TEXT NOT NULL,
                user2_id TEXT NOT NULL,
                status TEXT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user1_id) REFERENCES users (id),
                FOREIGN KEY (user2_id) REFERENCES users (id)
            )
        ''')
        
        # 好友請求表
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS friend_requests (
                id TEXT PRIMARY KEY,
                from_user_id TEXT NOT NULL,
                to_user_id TEXT NOT NULL,
                status TEXT DEFAULT 'pending',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (from_user_id) REFERENCES users (id),
                FOREIGN KEY (to_user_id) REFERENCES users (id)
            )
        ''')
        
        # 聊天訊息表
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS messages (
                id TEXT PRIMARY KEY,
                sender_id TEXT NOT NULL,
                content TEXT NOT NULL,
                chat_type TEXT NOT NULL,
                target_id TEXT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (sender_id) REFERENCES users (id)
            )
        ''')
        
        conn.commit()
        conn.close()

    def create_user(self, username: str, password: str, email: str, display_name: str) -> str:
        import uuid
        user_id = str(uuid.uuid4())
        
        conn = self.get_connection()
        cursor = conn.cursor()
        
        cursor.execute('''
            INSERT INTO users (id, username, password, email, display_name)
            VALUES (?, ?, ?, ?, ?)
        ''', (user_id, username, password, email, display_name))
        
        conn.commit()
        conn.close()
        return user_id

    def get_user_by_username(self, username: str) -> Optional[Dict[str, Any]]:
        conn = self.get_connection()
        cursor = conn.cursor()
        
        cursor.execute('SELECT * FROM users WHERE username = ?', (username,))
        row = cursor.fetchone()
        conn.close()
        
        if row:
            return self.row_to_dict(cursor, row)
        return None

    def get_user_by_id(self, user_id: str) -> Optional[Dict[str, Any]]:
        conn = self.get_connection()
        cursor = conn.cursor()
        
        cursor.execute('SELECT * FROM users WHERE id = ?', (user_id,))
        row = cursor.fetchone()
        conn.close()
        
        if row:
            return self.row_to_dict(cursor, row)
        return None

    def verify_user(self, username: str, password: str) -> Optional[Dict[str, Any]]:
        user = self.get_user_by_username(username)
        if user and user['password'] == password:  # 在生產環境中使用密碼雜湊
            return user
        return None

    def set_user_admin(self, user_id: str, is_admin: bool):
        conn = self.get_connection()
        cursor = conn.cursor()
        
        cursor.execute('UPDATE users SET is_admin = ? WHERE id = ?', (is_admin, user_id))
        conn.commit()
        conn.close()

    def update_user_profile(self, user_id: str, profile_data: Dict[str, Any]):
        conn = self.get_connection()
        cursor = conn.cursor()
        
        cursor.execute('''
            UPDATE users 
            SET display_name = ?, bio = ?, interests = ?, avatar_url = ?
            WHERE id = ?
        ''', (
            profile_data.get('display_name'),
            profile_data.get('bio'),
            json.dumps(profile_data.get('interests', [])),
            profile_data.get('avatar_url'),
            user_id
        ))
        
        conn.commit()
        conn.close()

    def send_friend_request(self, from_user_id: str, to_user_id: str) -> bool:
        import uuid
        
        # 檢查是否已經是好友或已有請求
        if self.check_friend_status(from_user_id, to_user_id) != 'none':
            return False
        
        conn = self.get_connection()
        cursor = conn.cursor()
        
        request_id = str(uuid.uuid4())
        cursor.execute('''
            INSERT INTO friend_requests (id, from_user_id, to_user_id, status)
            VALUES (?, ?, ?, 'pending')
        ''', (request_id, from_user_id, to_user_id))
        
        conn.commit()
        conn.close()
        return True

    def check_friend_status(self, user1_id: str, user2_id: str) -> str:
        conn = self.get_connection()
        cursor = conn.cursor()
        
        # 檢查好友關係
        cursor.execute('''
            SELECT status FROM friends 
            WHERE (user1_id = ? AND user2_id = ?) OR (user1_id = ? AND user2_id = ?)
        ''', (user1_id, user2_id, user2_id, user1_id))
        
        friend_row = cursor.fetchone()
        if friend_row:
            conn.close()
            return 'friends'
        
        # 檢查待處理的請求
        cursor.execute('''
            SELECT status FROM friend_requests 
            WHERE (from_user_id = ? AND to_user_id = ?) OR (from_user_id = ? AND to_user_id = ?)
        ''', (user1_id, user2_id, user2_id, user1_id))
        
        request_row = cursor.fetchone()
        conn.close()
        
        if request_row:
            return 'pending'
        return 'none'

    def get_pending_friend_requests(self, user_id: str) -> List[Dict[str, Any]]:
        conn = self.get_connection()
        cursor = conn.cursor()
        
        cursor.execute('''
            SELECT fr.*, u.username, u.display_name 
            FROM friend_requests fr
            JOIN users u ON fr.from_user_id = u.id
            WHERE fr.to_user_id = ? AND fr.status = 'pending'
        ''', (user_id,))
        
        rows = cursor.fetchall()
        conn.close()
        
        return [self.row_to_dict(cursor, row) for row in rows]

    def accept_friend_request(self, request_id: str) -> bool:
        import uuid
        
        conn = self.get_connection()
        cursor = conn.cursor()
        
        # 獲取請求資訊
        cursor.execute('SELECT * FROM friend_requests WHERE id = ?', (request_id,))
        request = cursor.fetchone()
        if not request:
            conn.close()
            return False
        
        request_dict = self.row_to_dict(cursor, request)
        
        # 創建好友關係
        friend_id = str(uuid.uuid4())
        cursor.execute('''
            INSERT INTO friends (id, user1_id, user2_id, status)
            VALUES (?, ?, ?, 'accepted')
        ''', (friend_id, request_dict['from_user_id'], request_dict['to_user_id']))
        
        # 更新請求狀態
        cursor.execute('UPDATE friend_requests SET status = ? WHERE id = ?', ('accepted', request_id))
        
        conn.commit()
        conn.close()
        return True

    def get_user_friends(self, user_id: str) -> List[Dict[str, Any]]:
        conn = self.get_connection()
        cursor = conn.cursor()
        
        cursor.execute('''
            SELECT u.* FROM users u
            JOIN friends f ON (u.id = f.user2_id OR u.id = f.user1_id)
            WHERE (f.user1_id = ? OR f.user2_id = ?) AND u.id != ? AND f.status = 'accepted'
        ''', (user_id, user_id, user_id))
        
        rows = cursor.fetchall()
        conn.close()
        
        return [self.row_to_dict(cursor, row) for row in rows]

    def create_message(self, sender_id: str, content: str, chat_type: str, target_id: str) -> str:
        import uuid
        
        conn = self.get_connection()
        cursor = conn.cursor()
        
        message_id = str(uuid.uuid4())
        cursor.execute('''
            INSERT INTO messages (id, sender_id, content, chat_type, target_id)
            VALUES (?, ?, ?, ?, ?)
        ''', (message_id, sender_id, content, chat_type, target_id))
        
        conn.commit()
        conn.close()
        return message_id

    def get_chat_messages(self, user_id: str, chat_type: str, target_id: str, limit: int = 50) -> List[Dict[str, Any]]:
        conn = self.get_connection()
        cursor = conn.cursor()
        
        if chat_type == 'private':
            # 確保用戶有權限查看私訊
            if not self.check_friend_status(user_id, target_id) == 'friends':
                conn.close()
                return []
            
            cursor.execute('''
                SELECT m.*, u.username, u.display_name 
                FROM messages m
                JOIN users u ON m.sender_id = u.id
                WHERE m.chat_type = 'private' 
                AND ((m.sender_id = ? AND m.target_id = ?) OR (m.sender_id = ? AND m.target_id = ?))
                ORDER BY m.created_at DESC
                LIMIT ?
            ''', (user_id, target_id, target_id, user_id, limit))
        
        else:  # group chat
            cursor.execute('''
                SELECT m.*, u.username, u.display_name 
                FROM messages m
                JOIN users u ON m.sender_id = u.id
                WHERE m.chat_type = 'group' AND m.target_id = ?
                ORDER BY m.created_at DESC
                LIMIT ?
            ''', (target_id, limit))
        
        rows = cursor.fetchall()
        conn.close()
        
        return [self.row_to_dict(cursor, row) for row in rows]

    def get_admin_stats(self) -> Dict[str, Any]:
        conn = self.get_connection()
        cursor = conn.cursor()
        
        # 用戶統計
        cursor.execute('SELECT COUNT(*) FROM users')
        total_users = cursor.fetchone()[0]
        
        cursor.execute('SELECT COUNT(*) FROM users WHERE DATE(created_at) = DATE("now")')
        new_today = cursor.fetchone()[0]
        
        # 好友關係統計
        cursor.execute('SELECT COUNT(*) FROM friends WHERE status = "accepted"')
        total_friendships = cursor.fetchone()[0]
        
        # 訊息統計
        cursor.execute('SELECT COUNT(*) FROM messages')
        total_messages = cursor.fetchone()[0]
        
        conn.close()
        
        return {
            'total_users': total_users,
            'new_users_today': new_today,
            'total_friendships': total_friendships,
            'total_messages': total_messages
        }

    def get_all_users(self) -> List[Dict[str, Any]]:
        conn = self.get_connection()
        cursor = conn.cursor()
        
        cursor.execute('SELECT * FROM users ORDER BY created_at DESC')
        rows = cursor.fetchall()
        conn.close()
        
        return [self.row_to_dict(cursor, row) for row in rows]

    def row_to_dict(self, cursor, row) -> Dict[str, Any]:
        description = cursor.description
        result = {}
        for idx, col in enumerate(description):
            result[col[0]] = row[idx]
        
        # 處理 JSON 欄位
        if 'interests' in result and result['interests']:
            try:
                result['interests'] = json.loads(result['interests'])
            except:
                result['interests'] = []
        else:
            result['interests'] = []
        
        return result