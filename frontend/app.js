// API 基礎 URL
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
    showLoadingScreen();
    checkSavedAuth();
    bindEventListeners();
    initializeLanguage();
}

// 顯示載入動畫
function showLoadingScreen() {
    setTimeout(() => {
        document.getElementById('loading-screen').classList.add('hidden');
        showMainPage();
    }, 2000);
}

// 修復版的 checkSavedAuth 函數
function checkSavedAuth() {
    try {
        const savedToken = localStorage.getItem('authToken');
        const savedUser = localStorage.getItem('currentUser');
        
        if (savedToken && savedUser) {
            try {
                const userData = JSON.parse(savedUser);
                if (userData && userData.username) {
                    authToken = savedToken;
                    currentUser = userData;
                    console.log('恢復用戶:', userData.username);
                }
            } catch (e) {
                localStorage.removeItem('authToken');
                localStorage.removeItem('currentUser');
            }
        }
    } catch (error) {
        console.error('檢查登入狀態錯誤:', error);
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
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', handleLogout);
    }
    
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
    console.log('切換語言:', selectedLanguage);
    showNotification(\`語言已切換為 \${e.target.options[e.target.selectedIndex].text}\`, 'success');
}

// 處理登入
async function handleLogin(e) {
    e.preventDefault();
    
    const username = document.getElementById('login-username').value;
    const password = document.getElementById('login-password').value;
    
    try {
        const response = await fetch(\`\${API_BASE_URL}/login\`, {
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
    
    if (password !== confirmPassword) {
        showNotification('密碼確認不一致', 'error');
        return;
    }
    
    if (password.length < 6) {
        showNotification('密碼長度至少6位', 'error');
        return;
    }
    
    try {
        const response = await fetch(\`\${API_BASE_URL}/register\`, {
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
    updateUserInfo();
    loadPage(currentPage);
}

// 更新用戶資訊
function updateUserInfo() {
    if (currentUser) {
        const displayNameElement = document.getElementById('user-display-name');
        const avatarElement = document.getElementById('user-avatar');
        
        if (displayNameElement) {
            displayNameElement.textContent = currentUser.display_name || currentUser.username;
        }
        
        if (avatarElement) {
            if (currentUser.avatar_url) {
                avatarElement.src = currentUser.avatar_url;
            } else {
                const initials = (currentUser.display_name || currentUser.username).charAt(0).toUpperCase();
                avatarElement.textContent = initials;
            }
        }
        
        const adminMenu = document.getElementById('admin-menu');
        if (adminMenu) {
            if (currentUser.is_admin) {
                adminMenu.classList.remove('hidden');
            } else {
                adminMenu.classList.add('hidden');
            }
        }
    }
}

// 顯示主頁面
function showMainPage() {
    if (currentUser) {
        showAppContainer();
    } else {
        document.getElementById('main-page').classList.remove('hidden');
    }
}

// 處理選單點擊
function handleMenuClick(e) {
    const menuItem = e.currentTarget;
    const targetPage = menuItem.dataset.page;
    
    document.querySelectorAll('.menu-item').forEach(item => {
        item.classList.remove('active');
    });
    menuItem.classList.add('active');
    
    loadPage(targetPage);
}

// 載入頁面內容
function loadPage(page) {
    currentPage = page;
    
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
    
    const titleElement = document.getElementById('page-title');
    if (titleElement) {
        titleElement.textContent = pageTitles[page] || '頁面';
    }
    
    const contentArea = document.getElementById('content-area');
    if (!contentArea) return;
    
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
            contentArea.innerHTML = \`
                <div class="feature-coming-soon">
                    <div class="feature-icon">
                        <i class="fas fa-tools"></i>
                    </div>
                    <h2>功能即將推出</h2>
                    <p>我們正在努力開發這個功能，敬請期待！</p>
                </div>
            \`;
    }
}

// 載入儀表板
function loadDashboard(container) {
    container.innerHTML = \`
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
                </div>
            </div>
        </div>
    \`;
}

// 載入好友頁面
function loadFriendsPage(container) {
    container.innerHTML = \`
        <div class="friends-page">
            <div class="page-header">
                <h2>好友管理</h2>
                <button class="btn btn-primary" onclick="showNotification('功能開發中', 'info')">
                    <i class="fas fa-user-plus"></i>
                    添加好友
                </button>
            </div>
            <div class="empty-state">
                <i class="fas fa-user-friends"></i>
                <h3>好友功能開發中</h3>
                <p>我們正在努力開發完整的好友系統</p>
            </div>
        </div>
    \`;
}

// 載入聊天頁面
function loadChatPage(container) {
    container.innerHTML = \`
        <div class="chat-page">
            <div class="empty-state">
                <i class="fas fa-comments"></i>
                <h3>聊天功能開發中</h3>
                <p>即時聊天系統即將推出</p>
            </div>
        </div>
    \`;
}

// 載入個人檔案頁面
function loadProfilePage(container) {
    container.innerHTML = \`
        <div class="profile-page">
            <div class="profile-header">
                <div class="profile-avatar-large">
                    <span>\${(currentUser?.display_name || currentUser?.username || 'U').charAt(0).toUpperCase()}</span>
                </div>
                <div class="profile-info">
                    <h2>\${currentUser?.display_name || currentUser?.username || '用戶'}</h2>
                    <p>@\${currentUser?.username || 'username'}</p>
                </div>
            </div>
            <div class="profile-content">
                <div class="profile-section">
                    <h3>個人資料</h3>
                    <p>個人資料編輯功能即將推出</p>
                </div>
            </div>
        </div>
    \`;
}

// 載入管理員頁面
function loadAdminPage(container) {
    if (!currentUser || !currentUser.is_admin) {
        container.innerHTML = '<p>權限不足</p>';
        return;
    }
    
    container.innerHTML = \`
        <div class="admin-page">
            <h2>管理員面板</h2>
            <div class="admin-stats">
                <div class="admin-stat-card">
                    <h3>總用戶數</h3>
                    <p>1</p>
                </div>
                <div class="admin-stat-card">
                    <h3>今日新增</h3>
                    <p>0</p>
                </div>
            </div>
            <div class="admin-actions">
                <h3>管理操作</h3>
                <div class="action-buttons">
                    <button class="btn btn-primary" onclick="showNotification('管理功能開發中', 'info')">
                        <i class="fas fa-users"></i>
                        用戶管理
                    </button>
                </div>
            </div>
        </div>
    \`;
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
    const notification = document.createElement('div');
    notification.className = \`notification notification-\${type}\`;
    notification.innerHTML = \`
        <div class="notification-content">
            <i class="fas fa-\${getNotificationIcon(type)}"></i>
            <span>\${message}</span>
        </div>
    \`;
    
    document.body.appendChild(notification);
    
    setTimeout(() => notification.classList.add('show'), 100);
    
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
    const savedLanguage = localStorage.getItem('preferredLanguage') || 'zh-TW';
    const languageSelect = document.getElementById('language-select');
    if (languageSelect) {
        languageSelect.value = savedLanguage;
    }
}

// API 請求輔助函數
async function apiRequest(endpoint, options = {}) {
    const defaultOptions = {
        headers: {
            'Content-Type': 'application/json',
            'Authorization': authToken ? \`Bearer \${authToken}\` : ''
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
        const response = await fetch(\`\${API_BASE_URL}\${endpoint}\`, mergedOptions);
        return await response.json();
    } catch (error) {
        console.error('API 請求錯誤:', error);
        throw error;
    }
}
