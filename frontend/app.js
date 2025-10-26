// API 基礎 URL - 根據部署環境調整
const API_BASE_URL = 'https://study-pulse-beta.vercel.app/api';

// 全域狀態
let currentUser = null;
let authToken = null;
let currentPage = 'dashboard';

// DOM 載入完成後初始化
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
});

// 初始化應用程式
function initializeApp() {
    // 顯示載入動畫
    showLoadingScreen();
    
    // 檢查是否有保存的登入狀態
    checkSavedAuth();
    
    // 綁定事件監聽器
    bindEventListeners();
    
    // 初始化語言設定
    initializeLanguage();
}

// 顯示載入動畫
function showLoadingScreen() {
    setTimeout(() => {
        document.getElementById('loading-screen').classList.add('hidden');
        showMainPage();
    }, 3000);
}

// 顯示主頁面
function showMainPage() {
    if (currentUser) {
        showAppContainer();
    } else {
        document.getElementById('main-page').classList.remove('hidden');
    }
}

// 檢查保存的認證狀態
function checkSavedAuth() {
    const savedToken = localStorage.getItem('authToken');
    const savedUser = localStorage.getItem('currentUser');
    
    if (savedToken && savedUser) {
        authToken = savedToken;
        currentUser = JSON.parse(savedUser);
    }
}

// 綁定事件監聽器
function bindEventListeners() {
    // 導航按鈕
    document.getElementById('login-btn').addEventListener('click', showLoginModal);
    document.getElementById('register-btn').addEventListener('click', showRegisterModal);
    document.getElementById('hero-login-btn').addEventListener('click', showLoginModal);
    
    // 模態框控制
    document.getElementById('switch-to-register').addEventListener('click', switchToRegister);
    document.getElementById('switch-to-login').addEventListener('click', switchToLogin);
    
    // 表單提交
    document.getElementById('login-form').addEventListener('submit', handleLogin);
    document.getElementById('register-form').addEventListener('submit', handleRegister);
    
    // 關閉按鈕
    document.querySelectorAll('.close-btn').forEach(btn => {
        btn.addEventListener('click', closeModals);
    });
    
    // 語言選擇
    document.getElementById('language-select').addEventListener('change', handleLanguageChange);
    
    // 登出按鈕
    document.getElementById('logout-btn').addEventListener('click', handleLogout);
    
    // 側邊欄選單
    document.querySelectorAll('.menu-item').forEach(item => {
        item.addEventListener('click', handleMenuClick);
    });
}

// 顯示登入模態框
function showLoginModal() {
    document.getElementById('login-modal').classList.remove('hidden');
}

// 顯示註冊模態框
function showRegisterModal() {
    document.getElementById('register-modal').classList.remove('hidden');
}

// 關閉所有模態框
function closeModals() {
    document.getElementById('login-modal').classList.add('hidden');
    document.getElementById('register-modal').classList.add('hidden');
}

// 切換到註冊表單
function switchToRegister(e) {
    e.preventDefault();
    document.getElementById('login-modal').classList.add('hidden');
    document.getElementById('register-modal').classList.remove('hidden');
}

// 切換到登入表單
function switchToLogin(e) {
    e.preventDefault();
    document.getElementById('register-modal').classList.add('hidden');
    document.getElementById('login-modal').classList.remove('hidden');
}

// 處理語言變更
function handleLanguageChange(e) {
    const selectedLanguage = e.target.value;
    // 這裡可以實作多語言切換邏輯
    console.log('切換語言:', selectedLanguage);
    showNotification(`語言已切換為 ${e.target.options[e.target.selectedIndex].text}`, 'success');
}

// 處理登入
async function handleLogin(e) {
    e.preventDefault();
    
    const username = document.getElementById('login-username').value;
    const password = document.getElementById('login-password').value;
    
    try {
        const response = await fetch(`${API_BASE_URL}/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ username, password })
        });
        
        const data = await response.json();
        
        if (data.success) {
            authToken = data.token;
            currentUser = data.user;
            
            // 保存登入狀態
            localStorage.setItem('authToken', authToken);
            localStorage.setItem('currentUser', JSON.stringify(currentUser));
            
            showNotification('登入成功！', 'success');
            closeModals();
            showAppContainer();
        } else {
            showNotification(data.detail || '登入失敗', 'error');
        }
    } catch (error) {
        console.error('登入錯誤:', error);
        showNotification('網路錯誤，請稍後再試', 'error');
    }
}

// 處理註冊
async function handleRegister(e) {
    e.preventDefault();
    
    const username = document.getElementById('register-username').value;
    const email = document.getElementById('register-email').value;
    const displayName = document.getElementById('register-display-name').value;
    const password = document.getElementById('register-password').value;
    const confirmPassword = document.getElementById('register-confirm-password').value;
    
    // 基本驗證
    if (password !== confirmPassword) {
        showNotification('密碼確認不一致', 'error');
        return;
    }
    
    if (password.length < 6) {
        showNotification('密碼長度至少6位', 'error');
        return;
    }
    
    try {
        const response = await fetch(`${API_BASE_URL}/register`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                username,
                email,
                display_name: displayName,
                password
            })
        });
        
        const data = await response.json();
        
        if (data.success) {
            showNotification('註冊成功！請登入', 'success');
            switchToLogin({ preventDefault: () => {} });
            // 清空表單
            document.getElementById('register-form').reset();
        } else {
            showNotification(data.detail || '註冊失敗', 'error');
        }
    } catch (error) {
        console.error('註冊錯誤:', error);
        showNotification('網路錯誤，請稍後再試', 'error');
    }
}

// 顯示應用程式主界面
function showAppContainer() {
    document.getElementById('main-page').classList.add('hidden');
    document.getElementById('app-container').classList.remove('hidden');
    
    // 更新用戶資訊
    updateUserInfo();
    
    // 載入初始頁面
    loadPage(currentPage);
}

// 更新用戶資訊
function updateUserInfo() {
    if (currentUser) {
        document.getElementById('user-display-name').textContent = currentUser.display_name;
        
        // 設定頭像（如果有）
        const avatarElement = document.getElementById('user-avatar');
        if (currentUser?.avatar_url || "" || "") {
            avatarElement.src = currentUser?.avatar_url || "" || "";
        } else {
            // 使用顯示名稱的首字母作為頭像
            avatarElement.textContent = currentUser.display_name.charAt(0).toUpperCase();
        }
        
        // 顯示/隱藏管理員選單
        const adminMenu = document.getElementById('admin-menu');
        if (currentUser.is_admin) {
            adminMenu.classList.remove('hidden');
        } else {
            adminMenu.classList.add('hidden');
        }
    }
}

// 處理選單點擊
function handleMenuClick(e) {
    const menuItem = e.currentTarget;
    const targetPage = menuItem.dataset.page;
    
    // 更新活躍狀態
    document.querySelectorAll('.menu-item').forEach(item => {
        item.classList.remove('active');
    });
    menuItem.classList.add('active');
    
    // 載入頁面
    loadPage(targetPage);
}

// 載入頁面內容
function loadPage(page) {
    currentPage = page;
    
    // 更新頁面標題
    const pageTitles = {
        'dashboard': '儀表板',
        'friends': '好友管理',
        'chat': '聊天系統',
        'study': '學科討論',
        'resources': '資源共享',
        'study-room': '虛擬自習室',
        'profile': '我的檔案',
        'settings': '系統設定',
        'admin': '管理員面板'
    };
    
    document.getElementById('page-title').textContent = pageTitles[page] || '頁面';
    
    // 根據頁面載入相應內容
    const contentArea = document.getElementById('content-area');
    
    switch (page) {
        case 'dashboard':
            loadDashboard(contentArea);
            break;
        case 'friends':
            loadFriendsPage(contentArea);
            break;
        case 'chat':
            loadChatPage(contentArea);
            break;
        case 'profile':
            loadProfilePage(contentArea);
            break;
        case 'admin':
            loadAdminPage(contentArea);
            break;
        default:
            contentArea.innerHTML = `<div class="coming-soon">
                <h2>功能開發中</h2>
                <p>此功能即將推出，敬請期待！</p>
            </div>`;
    }
}

// 載入儀表板
function loadDashboard(container) {
    container.innerHTML = `
        <div class="dashboard">
            <div class="stats-grid">
                <div class="stat-card">
                    <div class="stat-icon">
                        <i class="fas fa-user-friends"></i>
                    </div>
                    <div class="stat-info">
                        <h3 id="friends-count">0</h3>
                        <p>好友數量</p>
                    </div>
                </div>
                <div class="stat-card">
                    <div class="stat-icon">
                        <i class="fas fa-comments"></i>
                    </div>
                    <div class="stat-info">
                        <h3 id="messages-count">0</h3>
                        <p>未讀訊息</p>
                    </div>
                </div>
                <div class="stat-card">
                    <div class="stat-icon">
                        <i class="fas fa-book"></i>
                    </div>
                    <div class="stat-info">
                        <h3 id="study-time">0h</h3>
                        <p>學習時數</p>
                    </div>
                </div>
            </div>
            
            <div class="dashboard-content">
                <div class="recent-activity">
                    <h3>近期活動</h3>
                    <div id="activity-list" class="activity-list">
                        <div class="activity-item">
                            <i class="fas fa-user-plus"></i>
                            <span>歡迎使用 StudyHub！</span>
                        </div>
                    </div>
                </div>
                
                <div class="quick-actions">
                    <h3>快速操作</h3>
                    <div class="actions-grid">
                        <button class="action-btn" onclick="loadPage('friends')">
                            <i class="fas fa-user-plus"></i>
                            <span>添加好友</span>
                        </button>
                        <button class="action-btn" onclick="loadPage('chat')">
                            <i class="fas fa-comments"></i>
                            <span>開始聊天</span>
                        </button>
                        <button class="action-btn" onclick="loadPage('study')">
                            <i class="fas fa-book"></i>
                            <span>學科討論</span>
                        </button>
                        <button class="action-btn" onclick="loadPage('study-room')">
                            <i class="fas fa-door-open"></i>
                            <span>自習室</span>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    // 載入儀表板數據
    loadDashboardData();
}

// 載入儀表板數據
async function loadDashboardData() {
    try {
        // 載入好友數量
        const friendsResponse = await fetch(`${API_BASE_URL}/friends`, {
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });
        
        if (friendsResponse.ok) {
            const friendsData = await friendsResponse.json();
            document.getElementById('friends-count').textContent = friendsData.friends ? friendsData.friends.length : 0;
        }
        
        // 這裡可以添加更多數據載入邏輯
        
    } catch (error) {
        console.error('載入儀表板數據錯誤:', error);
    }
}

// 載入好友頁面
function loadFriendsPage(container) {
    container.innerHTML = `
        <div class="friends-page">
            <div class="page-header">
                <h2>好友管理</h2>
                <button class="btn btn-primary" onclick="showAddFriendModal()">
                    <i class="fas fa-user-plus"></i>
                    添加好友
                </button>
            </div>
            
            <div class="friends-tabs">
                <button class="tab-btn active" data-tab="friends-list">好友列表</button>
                <button class="tab-btn" data-tab="friend-requests">好友申請</button>
                <button class="tab-btn" data-tab="find-friends">尋找好友</button>
            </div>
            
            <div class="tab-content">
                <div id="friends-list" class="tab-pane active">
                    <div id="friends-container" class="friends-container">
                        <div class="loading">載入中...</div>
                    </div>
                </div>
                <div id="friend-requests" class="tab-pane">
                    <div id="requests-container" class="requests-container">
                        <div class="loading">載入中...</div>
                    </div>
                </div>
                <div id="find-friends" class="tab-pane">
                    <div class="search-friends">
                        <div class="search-box">
                            <input type="text" id="friend-search" placeholder="輸入用戶名或ID搜尋好友...">
                            <button class="btn btn-primary" onclick="searchFriends()">
                                <i class="fas fa-search"></i>
                                搜尋
                            </button>
                        </div>
                        <div id="search-results" class="search-results">
                            <p>輸入關鍵字搜尋好友</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    // 綁定標籤頁事件
    bindFriendsTabEvents();
    // 載入好友列表
    loadFriendsList();
    // 載入好友申請
    loadFriendRequests();
}

// 綁定好友頁面標籤事件
function bindFriendsTabEvents() {
    document.querySelectorAll('.friends-tabs .tab-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            // 更新活躍標籤
            document.querySelectorAll('.friends-tabs .tab-btn').forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            
            // 顯示對應內容
            const tabId = this.dataset.tab;
            document.querySelectorAll('.tab-pane').forEach(pane => pane.classList.remove('active'));
            document.getElementById(tabId).classList.add('active');
        });
    });
}

// 載入好友列表
async function loadFriendsList() {
    try {
        const response = await fetch(`${API_BASE_URL}/friends`, {
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });
        
        if (response.ok) {
            const data = await response.json();
            displayFriendsList(data.friends || []);
        } else {
            document.getElementById('friends-container').innerHTML = '<p>載入好友列表失敗</p>';
        }
    } catch (error) {
        console.error('載入好友列表錯誤:', error);
        document.getElementById('friends-container').innerHTML = '<p>網路錯誤，請稍後再試</p>';
    }
}

// 顯示好友列表
function displayFriendsList(friends) {
    const container = document.getElementById('friends-container');
    
    if (friends.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-user-friends"></i>
                <h3>還沒有好友</h3>
                <p>快去尋找並添加好友吧！</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = friends.map(friend => `
        <div class="friend-item">
            <div class="friend-avatar">
                ${friend.avatar_url ? 
                    `<img src="${friend.avatar_url}" alt="${friend.display_name}">` :
                    `<span>${friend.display_name.charAt(0).toUpperCase()}</span>`
                }
            </div>
            <div class="friend-info">
                <h4>${friend.display_name}</h4>
                <p>@${friend.username}</p>
            </div>
            <div class="friend-actions">
                <button class="btn btn-outline" onclick="startChatWithFriend('${friend.id}')">
                    <i class="fas fa-comment"></i>
                    聊天
                </button>
            </div>
        </div>
    `).join('');
}

// 載入好友申請
async function loadFriendRequests() {
    try {
        const response = await fetch(`${API_BASE_URL}/friends/requests`, {
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });
        
        if (response.ok) {
            const data = await response.json();
            displayFriendRequests(data.requests || []);
        }
    } catch (error) {
        console.error('載入好友申請錯誤:', error);
    }
}

// 顯示好友申請
function displayFriendRequests(requests) {
    const container = document.getElementById('requests-container');
    
    if (requests.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-inbox"></i>
                <h3>沒有待處理的申請</h3>
                <p>當有人傳送好友申請時，會顯示在這裡</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = requests.map(request => `
        <div class="request-item">
            <div class="request-avatar">
                <span>${request.from_display_name.charAt(0).toUpperCase()}</span>
            </div>
            <div class="request-info">
                <h4>${request.from_display_name}</h4>
                <p>@${request.from_username}</p>
                <small>${new Date(request.created_at).toLocaleDateString()}</small>
            </div>
            <div class="request-actions">
                <button class="btn btn-primary" onclick="acceptFriendRequest('${request.id}')">
                    <i class="fas fa-check"></i>
                    接受
                </button>
                <button class="btn btn-outline" onclick="declineFriendRequest('${request.id}')">
                    <i class="fas fa-times"></i>
                    拒絕
                </button>
            </div>
        </div>
    `).join('');
}

// 接受好友申請
async function acceptFriendRequest(requestId) {
    try {
        const response = await fetch(`${API_BASE_URL}/friends/accept/${requestId}`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });
        
        if (response.ok) {
            showNotification('好友申請已接受', 'success');
            loadFriendRequests();
            loadFriendsList();
        }
    } catch (error) {
        console.error('接受好友申請錯誤:', error);
        showNotification('操作失敗', 'error');
    }
}

// 拒絕好友申請
async function declineFriendRequest(requestId) {
    // 這裡實作拒絕好友申請的邏輯
    showNotification('好友申請已拒絕', 'success');
    loadFriendRequests();
}

// 搜尋好友
async function searchFriends() {
    const searchTerm = document.getElementById('friend-search').value.trim();
    
    if (!searchTerm) {
        showNotification('請輸入搜尋關鍵字', 'warning');
        return;
    }
    
    // 這裡實作搜尋好友的邏輯
    showNotification('搜尋功能開發中', 'info');
}

// 載入聊天頁面
function loadChatPage(container) {
    container.innerHTML = `
        <div class="chat-page">
            <div class="chat-container">
                <div class="chat-sidebar">
                    <div class="chat-tabs">
                        <button class="chat-tab active" data-tab="private">私訊</button>
                        <button class="chat-tab" data-tab="group">群組</button>
                        <button class="chat-tab" data-tab="global">聊天廣場</button>
                    </div>
                    <div class="chat-list" id="chat-list">
                        <div class="loading">載入中...</div>
                    </div>
                </div>
                <div class="chat-main">
                    <div class="chat-header">
                        <h3 id="current-chat-title">選擇聊天對象</h3>
                    </div>
                    <div class="chat-messages" id="chat-messages">
                        <div class="empty-chat">
                            <i class="fas fa-comments"></i>
                            <p>選擇一個聊天開始對話</p>
                        </div>
                    </div>
                    <div class="chat-input-container">
                        <div class="chat-input">
                            <input type="text" id="message-input" placeholder="輸入訊息..." disabled>
                            <button id="send-message-btn" disabled>
                                <i class="fas fa-paper-plane"></i>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    // 綁定聊天頁面事件
    bindChatTabEvents();
    loadChatList();
}

// 綁定聊天標籤事件
function bindChatTabEvents() {
    document.querySelectorAll('.chat-tab').forEach(tab => {
        tab.addEventListener('click', function() {
            document.querySelectorAll('.chat-tab').forEach(t => t.classList.remove('active'));
            this.classList.add('active');
            // 這裡可以根據標籤載入不同的聊天列表
        });
    });
}

// 載入聊天列表
async function loadChatList() {
    // 這裡實作載入聊天列表的邏輯
    document.getElementById('chat-list').innerHTML = `
        <div class="empty-state">
            <i class="fas fa-comments"></i>
            <p>還沒有聊天記錄</p>
        </div>
    `;
}

// 載入個人檔案頁面
function loadProfilePage(container) {
    container.innerHTML = `
        <div class="profile-page">
            <div class="profile-header">
                <div class="profile-avatar-large">
                    ${currentUser?.avatar_url || "" || "" ? 
                        `<img src="${currentUser?.avatar_url || "" || ""}" alt="${currentUser.display_name}">` :
                        `<span>${currentUser.display_name.charAt(0).toUpperCase()}</span>`
                    }
                </div>
                <div class="profile-info">
                    <h2>${currentUser.display_name}</h2>
                    <p>@${currentUser.username}</p>
                    <p class="profile-email">${currentUser.email}</p>
                </div>
            </div>
            
            <div class="profile-content">
                <div class="profile-section">
                    <h3>個人資料</h3>
                    <form id="profile-form" class="profile-form">
                        <div class="form-group">
                            <label for="profile-display-name">顯示名稱</label>
                            <input type="text" id="profile-display-name" value="${currentUser.display_name}">
                        </div>
                        <div class="form-group">
                            <label for="profile-bio">個人簡介</label>
                            <textarea id="profile-bio" placeholder="寫點關於自己的介紹..."></textarea>
                        </div>
                        <div class="form-group">
                            <label for="profile-interests">興趣標籤</label>
                            <input type="text" id="profile-interests" placeholder="添加興趣標籤，用逗號分隔">
                        </div>
                        <button type="submit" class="btn btn-primary">更新資料</button>
                    </form>
                </div>
            </div>
        </div>
    `;
    
    // 綁定個人資料表單事件
    document.getElementById('profile-form').addEventListener('submit', updateProfile);
}

// 更新個人資料
async function updateProfile(e) {
    e.preventDefault();
    
    const displayName = document.getElementById('profile-display-name').value;
    const bio = document.getElementById('profile-bio').value;
    const interests = document.getElementById('profile-interests').value.split(',').map(i => i.trim()).filter(i => i);
    
    try {
        const response = await fetch(`${API_BASE_URL}/user/profile`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
            },
            body: JSON.stringify({
                display_name: displayName,
                bio: bio,
                interests: interests
            })
        });
        
        if (response.ok) {
            showNotification('個人資料更新成功', 'success');
            // 更新當前用戶資訊
            currentUser.display_name = displayName;
            updateUserInfo();
        }
    } catch (error) {
        console.error('更新個人資料錯誤:', error);
        showNotification('更新失敗', 'error');
    }
}

// 載入管理員頁面
function loadAdminPage(container) {
    if (!currentUser || !currentUser.is_admin) {
        container.innerHTML = '<p>權限不足</p>';
        return;
    }
    
    container.innerHTML = `
        <div class="admin-page">
            <h2>管理員面板</h2>
            <div class="admin-stats">
                <div class="admin-stat-card">
                    <h3>總用戶數</h3>
                    <p id="total-users">載入中...</p>
                </div>
                <div class="admin-stat-card">
                    <h3>今日新增</h3>
                    <p id="new-users-today">載入中...</p>
                </div>
                <div class="admin-stat-card">
                    <h3>好友關係</h3>
                    <p id="total-friendships">載入中...</p>
                </div>
                <div class="admin-stat-card">
                    <h3>總訊息數</h3>
                    <p id="total-messages">載入中...</p>
                </div>
            </div>
            
            <div class="admin-actions">
                <h3>管理操作</h3>
                <div class="action-buttons">
                    <button class="btn btn-primary" onclick="loadAllUsers()">
                        <i class="fas fa-users"></i>
                        用戶管理
                    </button>
                    <button class="btn btn-outline" onclick="showAnnouncementModal()">
                        <i class="fas fa-bullhorn"></i>
                        發布公告
                    </button>
                    <button class="btn btn-outline">
                        <i class="fas fa-chart-bar"></i>
                        數據分析
                    </button>
                </div>
            </div>
            
            <div id="admin-content" class="admin-content">
                <p>選擇一個管理操作開始</p>
            </div>
        </div>
    `;
    
    loadAdminStats();
}

// 載入管理員統計數據
async function loadAdminStats() {
    try {
        const response = await fetch(`${API_BASE_URL}/admin/dashboard`, {
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });
        
        if (response.ok) {
            const data = await response.json();
            document.getElementById('total-users').textContent = data.stats.total_users;
            document.getElementById('new-users-today').textContent = data.stats.new_users_today;
            document.getElementById('total-friendships').textContent = data.stats.total_friendships;
            document.getElementById('total-messages').textContent = data.stats.total_messages;
        }
    } catch (error) {
        console.error('載入管理員統計錯誤:', error);
    }
}

// 載入所有用戶（管理員功能）
async function loadAllUsers() {
    try {
        const response = await fetch(`${API_BASE_URL}/admin/users`, {
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });
        
        if (response.ok) {
            const data = await response.json();
            displayAllUsers(data.users);
        }
    } catch (error) {
        console.error('載入用戶列表錯誤:', error);
    }
}

// 顯示所有用戶
function displayAllUsers(users) {
    const container = document.getElementById('admin-content');
    
    container.innerHTML = `
        <div class="users-management">
            <h4>用戶管理</h4>
            <div class="users-list">
                ${users.map(user => `
                    <div class="user-management-item">
                        <div class="user-info">
                            <strong>${user.display_name}</strong>
                            <span>@${user.username}</span>
                            ${user.is_admin ? '<span class="admin-badge">管理員</span>' : ''}
                        </div>
                        <div class="user-actions">
                            <button class="btn btn-outline btn-small">查看</button>
                            ${!user.is_admin ? `<button class="btn btn-outline btn-small">停權</button>` : ''}
                        </div>
                    </div>
                `).join('')}
            </div>
        </div>
    `;
}

// 處理登出
function handleLogout() {
    currentUser = null;
    authToken = null;
    localStorage.removeItem('authToken');
    localStorage.removeItem('currentUser');
    
    document.getElementById('app-container').classList.add('hidden');
    document.getElementById('main-page').classList.remove('hidden');
    
    showNotification('已成功登出', 'success');
}

// 顯示通知
function showNotification(message, type = 'info') {
    // 創建通知元素
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
        <div class="notification-content">
            <i class="fas fa-${getNotificationIcon(type)}"></i>
            <span>${message}</span>
        </div>
    `;
    
    // 添加到頁面
    document.body.appendChild(notification);
    
    // 顯示動畫
    setTimeout(() => notification.classList.add('show'), 100);
    
    // 自動移除
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    }, 3000);
}

// 獲取通知圖標
function getNotificationIcon(type) {
    const icons = {
        'success': 'check-circle',
        'error': 'exclamation-circle',
        'warning': 'exclamation-triangle',
        'info': 'info-circle'
    };
    return icons[type] || 'info-circle';
}

// 初始化語言設定
function initializeLanguage() {
    // 這裡可以實作多語言初始化邏輯
    const savedLanguage = localStorage.getItem('preferredLanguage') || 'zh-TW';
    document.getElementById('language-select').value = savedLanguage;
}

// API 請求輔助函數
async function apiRequest(endpoint, options = {}) {
    const defaultOptions = {
        headers: {
            'Content-Type': 'application/json',
            'Authorization': authToken ? `Bearer ${authToken}` : ''
        }
    };
    
    const mergedOptions = {
        ...defaultOptions,
        ...options,
        headers: {
            ...defaultOptions.headers,
            ...options.headers
        }
    };
    
    try {
        const response = await fetch(`${API_BASE_URL}${endpoint}`, mergedOptions);
        return await response.json();
    } catch (error) {
        console.error('API 請求錯誤:', error);
        throw error;
    }
}