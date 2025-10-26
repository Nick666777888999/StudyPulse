// 在 loadPage 函數中替換默認內容
function loadPage(page) {
    // ... 其他代碼 ...
    
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
            // 改進的"開發中"頁面
            contentArea.innerHTML = `
                <div class="feature-coming-soon">
                    <div class="feature-icon">
                        <i class="fas fa-tools"></i>
                    </div>
                    <h2>功能即將推出</h2>
                    <p>我們正在努力開發這個功能，敬請期待！</p>
                    <div class="progress-container">
                        <div class="progress-bar">
                            <div class="progress" style="width: ${Math.random()*30 + 50}%"></div>
                        </div>
                        <span>開發進度</span>
                    </div>
                </div>
            `;
    }
}
