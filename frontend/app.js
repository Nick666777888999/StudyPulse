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
}

// 顯示載入動畫
function showLoadingScreen() {
    setTimeout(() => {
        const loadingScreen = document.getElementById('loading-screen');
        if (loadingScreen) {
            loadingScreen.classList.add('hidden');
        }
        showMainPage();
    }, 2000);
}

// 檢查保存的認證狀態
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
    // 登入相關
    const loginBtn = document.getElementById('login-btn');
    const registerBtn = document.getElementById('register-btn');
    const heroLoginBtn = document.getElementById('hero-login-btn');
    const loginForm = document.getElementById('login-form');
    
    if (loginBtn) loginBtn.addEventListener('click', showLoginModal);
    if (registerBtn) registerBtn.addEventListener('click', showRegisterModal);
    if (heroLoginBtn) heroLoginBtn.addEventListener('click', showLoginModal);
    if (loginForm) loginForm.addEventListener('submit', handleLogin);
    
    // 模態框控制
    const closeBtns = document.querySelectorAll('.close-btn');
    closeBtns.forEach(btn => {
        btn.addEventListener('click', closeModals);
    });
    
    // 登出按鈕
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', handleLogout);
    }
    
    // 側邊欄選單
    const menuItems = document.querySelectorAll('.menu-item');
    menuItems.forEach(item => {
        item.addEventListener('click', handleMenuClick);
    });
}

// 顯示登入模態框
function showLoginModal() {
    const modal = document.getElementById('login-modal');
    if (modal) modal.classList.remove('hidden');
}

// 顯示註冊模態框
function showRegisterModal() {
    alert('註冊功能即將推出！目前請使用測試帳號：\n用戶名: Nick20130104\n密碼: Nick20130104');
    showLoginModal();
}

// 關閉所有模態框
function closeModals() {
    const loginModal = document.getElementById('login-modal');
    if (loginModal) loginModal.classList.add('hidden');
}

// 處理登入
async function handleLogin(e) {
    if (e) e.preventDefault();
    
    const usernameInput = document.getElementById('login-username');
    const passwordInput = document.getElementById('login-password');
    
    if (!usernameInput || !passwordInput) return;
    
    const username = usernameInput.value;
    const password = passwordInput.value;
    
    if (!username || !password) {
        showNotification('請輸入用戶名和密碼', 'error');
        return;
    }
    
    try {
        // 測試帳號直接通過
        if (username === 'Nick20130104' && password === 'Nick20130104') {
            const testUser = {
                id: '1',
                username: 'Nick20130104',
                display_name: '系統管理員',
                email: 'admin@studypulse.com',
                is_admin: true
            };
            
            authToken = 'test-jwt-token';
            currentUser = testUser;
            
            localStorage.setItem('authToken', authToken);
            localStorage.setItem('currentUser', JSON.stringify(testUser));
            
            showNotification('登入成功！', 'success');
            closeModals();
            showAppContainer();
            return;
        }
        
        // 真實 API 呼叫
        const response = await fetch(API_BASE_URL + '/login', {
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

// 顯示應用程式主界面
function showAppContainer() {
    const mainPage = document.getElementById('main-page');
    const appContainer = document.getElementById('app-container');
    
    if (mainPage) mainPage.classList.add('hidden');
    if (appContainer) appContainer.classList.remove('hidden');
    
    updateUserInfo();
    loadPage(currentPage);
}

// 更新用戶資訊
function updateUserInfo() {
    if (!currentUser) return;
    
    const displayNameElement = document.getElementById('user-display-name');
    const avatarElement = document.getElementById('user-avatar');
    const adminMenu = document.querySelector('.admin-only');
    
    if (displayNameElement) {
        displayNameElement.textContent = currentUser.display_name || currentUser.username;
    }
    
    if (avatarElement) {
        const initials = (currentUser.display_name || currentUser.username).charAt(0).toUpperCase();
        avatarElement.textContent = initials;
    }
    
    if (adminMenu) {
        if (currentUser.is_admin) {
            adminMenu.classList.remove('hidden');
        } else {
            adminMenu.classList.add('hidden');
        }
    }
}

// 顯示主頁面
function showMainPage() {
    if (currentUser) {
        showAppContainer();
    } else {
        const mainPage = document.getElementById('main-page');
        if (mainPage) mainPage.classList.remove('hidden');
    }
}

// 處理選單點擊
function handleMenuClick(e) {
    const menuItem = e.currentTarget;
    const targetPage = menuItem.dataset.page;
    
    if (!targetPage) return;
    
    // 更新活躍狀態
    const menuItems = document.querySelectorAll('.menu-item');
    menuItems.forEach(item => {
        item.classList.remove('active');
    });
    menuItem.classList.add('active');
    
    // 載入頁面
    loadPage(targetPage);
}

// 載入頁面內容
function loadPage(page) {
    currentPage = page;
    
    const pageTitles = {
        'dashboard': '儀表板',
        'friends': '好友系統',
        'chat': '即時聊天',
        'study': '學科討論',
        'resources': '資源共享',
        'profile': '個人檔案',
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
        case 'study':
            loadStudyPage(contentArea);
            break;
        case 'resources':
            loadResourcesPage(contentArea);
            break;
        case 'profile':
            loadProfilePage(contentArea);
            break;
        case 'admin':
            loadAdminPage(contentArea);
            break;
        default:
            loadDefaultPage(contentArea);
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
                        <h3>12</h3>
                        <p>好友數量</p>
                    </div>
                </div>
                <div class="stat-card">
                    <div class="stat-icon">
                        <i class="fas fa-comments"></i>
                    </div>
                    <div class="stat-info">
                        <h3>5</h3>
                        <p>未讀訊息</p>
                    </div>
                </div>
                <div class="stat-card">
                    <div class="stat-icon">
                        <i class="fas fa-book"></i>
                    </div>
                    <div class="stat-info">
                        <h3>24h</h3>
                        <p>學習時數</p>
                    </div>
                </div>
                <div class="stat-card">
                    <div class="stat-icon">
                        <i class="fas fa-star"></i>
                    </div>
                    <div class="stat-info">
                        <h3>85%</h3>
                        <p>學習進度</p>
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
                    <button class="action-btn" onclick="loadPage('resources')">
                        <i class="fas fa-share-alt"></i>
                        <span>資源共享</span>
                    </button>
                </div>
            </div>
            
            <div class="recent-activity">
                <h3>近期活動</h3>
                <div class="activity-list">
                    <div class="activity-item">
                        <i class="fas fa-user-plus text-success"></i>
                        <span>小明 接受了你的好友申請</span>
                        <small>2分鐘前</small>
                    </div>
                    <div class="activity-item">
                        <i class="fas fa-comment text-primary"></i>
                        <span>小美 在數學討論區回覆了你的問題</span>
                        <small>1小時前</small>
                    </div>
                    <div class="activity-item">
                        <i class="fas fa-book text-accent"></i>
                        <span>你完成了今天的學習目標</span>
                        <small>3小時前</small>
                    </div>
                </div>
            </div>
        </div>
    `;
}

// 載入好友頁面
function loadFriendsPage(container) {
    container.innerHTML = `
        <div class="page-container">
            <div class="page-header">
                <h2>好友系統</h2>
                <button class="btn btn-primary" onclick="showAddFriendModal()">
                    <i class="fas fa-user-plus"></i>
                    添加好友
                </button>
            </div>
            
            <div class="friends-grid">
                <div class="friend-card">
                    <div class="friend-avatar">
                        <span>小</span>
                    </div>
                    <div class="friend-info">
                        <h4>小明</h4>
                        <p>在線 • 數學愛好者</p>
                    </div>
                    <div class="friend-actions">
                        <button class="btn btn-outline" onclick="startChat('小明')">
                            <i class="fas fa-comment"></i>
                            聊天
                        </button>
                    </div>
                </div>
                
                <div class="friend-card">
                    <div class="friend-avatar">
                        <span>美</span>
                    </div>
                    <div class="friend-info">
                        <h4>小美</h4>
                        <p>離線 • 英文高手</p>
                    </div>
                    <div class="friend-actions">
                        <button class="btn btn-outline" onclick="startChat('小美')">
                            <i class="fas fa-comment"></i>
                            聊天
                        </button>
                    </div>
                </div>
                
                <div class="friend-card">
                    <div class="friend-avatar">
                        <span>華</span>
                    </div>
                    <div class="friend-info">
                        <h4>小華</h4>
                        <p>在線 • 程式設計</p>
                    </div>
                    <div class="friend-actions">
                        <button class="btn btn-outline" onclick="startChat('小華')">
                            <i class="fas fa-comment"></i>
                            聊天
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;
}

// 載入聊天頁面
function loadChatPage(container) {
    container.innerHTML = `
        <div class="page-container">
            <h2>即時聊天</h2>
            <div class="chat-container">
                <div class="chat-sidebar">
                    <div class="chat-list">
                        <div class="chat-item active" onclick="selectChat('小明')">
                            <div class="chat-avatar">
                                <span>小</span>
                            </div>
                            <div class="chat-info">
                                <h4>小明</h4>
                                <p>最近在學微積分...</p>
                            </div>
                            <div class="chat-time">2分鐘前</div>
                        </div>
                        <div class="chat-item" onclick="selectChat('小美')">
                            <div class="chat-avatar">
                                <span>美</span>
                            </div>
                            <div class="chat-info">
                                <h4>小美</h4>
                                <p>英文學習資源分享</p>
                            </div>
                            <div class="chat-time">1小時前</div>
                        </div>
                    </div>
                </div>
                <div class="chat-main">
                    <div class="chat-messages">
                        <div class="message received">
                            <div class="message-content">
                                <p>嗨！最近在學什麼？</p>
                            </div>
                            <div class="message-time">14:30</div>
                        </div>
                        <div class="message sent">
                            <div class="message-content">
                                <p>在複習數學，有些題目不太懂</p>
                            </div>
                            <div class="message-time">14:31</div>
                        </div>
                        <div class="message received">
                            <div class="message-content">
                                <p>需要幫忙嗎？我可以教你</p>
                            </div>
                            <div class="message-time">14:32</div>
                        </div>
                    </div>
                    <div class="chat-input">
                        <input type="text" placeholder="輸入訊息...">
                        <button class="btn btn-primary">
                            <i class="fas fa-paper-plane"></i>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;
}

// 載入學科討論頁面
function loadStudyPage(container) {
    container.innerHTML = `
        <div class="page-container">
            <h2>學科討論區</h2>
            <div class="discussion-grid">
                <div class="discussion-card">
                    <div class="discussion-header">
                        <span class="subject-badge math">數學</span>
                        <h3>微積分問題請教</h3>
                    </div>
                    <p>有人可以解釋一下鏈鎖法則嗎？一直搞不懂...</p>
                    <div class="discussion-meta">
                        <span>by 小明 • 5個回覆 • 2小時前</span>
                    </div>
                </div>
                
                <div class="discussion-card">
                    <div class="discussion-header">
                        <span class="subject-badge english">英文</span>
                        <h3>英文作文技巧分享</h3>
                    </div>
                    <p>分享一些提升英文寫作能力的方法</p>
                    <div class="discussion-meta">
                        <span>by 小美 • 12個回覆 • 1天前</span>
                    </div>
                </div>
                
                <div class="discussion-card">
                    <div class="discussion-header">
                        <span class="subject-badge programming">程式設計</span>
                        <h3>Python 學習資源</h3>
                    </div>
                    <p>推薦一些適合初學者的 Python 學習資源</p>
                    <div class="discussion-meta">
                        <span>by 小華 • 8個回覆 • 3小時前</span>
                    </div>
                </div>
            </div>
        </div>
    `;
}

// 載入資源共享頁面
function loadResourcesPage(container) {
    container.innerHTML = `
        <div class="page-container">
            <h2>資源共享</h2>
            <div class="resources-grid">
                <div class="resource-card">
                    <div class="resource-icon">
                        <i class="fas fa-file-pdf"></i>
                    </div>
                    <div class="resource-info">
                        <h4>數學公式大全</h4>
                        <p>包含高中到大學的數學公式整理</p>
                        <div class="resource-meta">
                            <span>PDF • 2.3MB</span>
                            <button class="btn btn-outline btn-small">下載</button>
                        </div>
                    </div>
                </div>
                
                <div class="resource-card">
                    <div class="resource-icon">
                        <i class="fas fa-video"></i>
                    </div>
                    <div class="resource-info">
                        <h4>英文發音教學</h4>
                        <p>美式發音完整教學影片</p>
                        <div class="resource-meta">
                            <span>影片 • 45分鐘</span>
                            <button class="btn btn-outline btn-small">觀看</button>
                        </div>
                    </div>
                </div>
                
                <div class="resource-card">
                    <div class="resource-icon">
                        <i class="fas fa-code"></i>
                    </div>
                    <div class="resource-info">
                        <h4>Python 練習題</h4>
                        <p>100+ 程式設計練習題目</p>
                        <div class="resource-meta">
                            <span>ZIP • 1.5MB</span>
                            <button class="btn btn-outline btn-small">下載</button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
}

// 載入個人檔案頁面
function loadProfilePage(container) {
    const user = currentUser || {};
    container.innerHTML = `
        <div class="page-container">
            <div class="profile-header">
                <div class="profile-avatar-large">
                    <span>${(user.display_name || user.username || 'U').charAt(0).toUpperCase()}</span>
                </div>
                <div class="profile-info">
                    <h2>${user.display_name || user.username || '用戶'}</h2>
                    <p>@${user.username || 'username'}</p>
                    <p class="profile-email">${user.email || 'user@example.com'}</p>
                </div>
            </div>
            
            <div class="profile-stats">
                <div class="stat-item">
                    <h3>12</h3>
                    <p>好友</p>
                </div>
                <div class="stat-item">
                    <h3>24</h3>
                    <p>學習時數</p>
                </div>
                <div class="stat-item">
                    <h3>8</h3>
                    <p>分享資源</p>
                </div>
            </div>
            
            <div class="profile-content">
                <div class="profile-section">
                    <h3>關於我</h3>
                    <p>熱愛學習的學生，喜歡數學和程式設計，希望透過這個平台認識更多學習夥伴！</p>
                </div>
                
                <div class="profile-section">
                    <h3>學習興趣</h3>
                    <div class="interests">
                        <span class="interest-tag">數學</span>
                        <span class="interest-tag">程式設計</span>
                        <span class="interest-tag">英文</span>
                        <span class="interest-tag">物理</span>
                    </div>
                </div>
            </div>
        </div>
    `;
}

// 載入管理員頁面
function loadAdminPage(container) {
    if (!currentUser || !currentUser.is_admin) {
        container.innerHTML = '<div class="empty-state"><h3>權限不足</h3></div>';
        return;
    }
    
    container.innerHTML = `
        <div class="page-container">
            <h2>管理員面板</h2>
            
            <div class="admin-stats-grid">
                <div class="admin-stat-card">
                    <div class="stat-icon">
                        <i class="fas fa-users"></i>
                    </div>
                    <div class="stat-info">
                        <h3>156</h3>
                        <p>總用戶數</p>
                    </div>
                </div>
                <div class="admin-stat-card">
                    <div class="stat-icon">
                        <i class="fas fa-user-plus"></i>
                    </div>
                    <div class="stat-info">
                        <h3>12</h3>
                        <p>今日新增</p>
                    </div>
                </div>
                <div class="admin-stat-card">
                    <div class="stat-icon">
                        <i class="fas fa-comments"></i>
                    </div>
                    <div class="stat-info">
                        <h3>2,347</h3>
                        <p>總訊息數</p>
                    </div>
                </div>
                <div class="admin-stat-card">
                    <div class="stat-icon">
                        <i class="fas fa-chart-line"></i>
                    </div>
                    <div class="stat-info">
                        <h3>85%</h3>
                        <p>活躍度</p>
                    </div>
                </div>
            </div>
            
            <div class="admin-actions">
                <h3>管理操作</h3>
                <div class="action-buttons">
                    <button class="btn btn-primary" onclick="showNotification('用戶管理功能')">
                        <i class="fas fa-users"></i>
                        用戶管理
                    </button>
                    <button class="btn btn-outline" onclick="showNotification('內容審核功能')">
                        <i class="fas fa-shield-alt"></i>
                        內容審核
                    </button>
                    <button class="btn btn-outline" onclick="showNotification('數據分析功能')">
                        <i class="fas fa-chart-bar"></i>
                        數據分析
                    </button>
                </div>
            </div>
        </div>
    `;
}

// 載入默認頁面
function loadDefaultPage(container) {
    container.innerHTML = `
        <div class="empty-state">
            <i class="fas fa-cogs"></i>
            <h3>功能開發中</h3>
            <p>我們正在努力開發這個功能</p>
        </div>
    `;
}

// 處理登出
function handleLogout() {
    currentUser = null;
    authToken = null;
    localStorage.removeItem('authToken');
    localStorage.removeItem('currentUser');
    
    const appContainer = document.getElementById('app-container');
    const mainPage = document.getElementById('main-page');
    
    if (appContainer) appContainer.classList.add('hidden');
    if (mainPage) mainPage.classList.remove('hidden');
    
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

// 工具函數
function showAddFriendModal() {
    showNotification('添加好友功能即將推出', 'info');
}

function startChat(friendName) {
    loadPage('chat');
    showNotification(`開始與 ${friendName} 聊天`, 'success');
}

function selectChat(friendName) {
    showNotification(`選擇與 ${friendName} 的對話`, 'info');
}