// 替換 checkSavedAuth 函數
function checkSavedAuth() {
    try {
        const savedToken = localStorage.getItem('authToken');
        const savedUser = localStorage.getItem('currentUser');
        
        if (savedToken && savedUser) {
            // 添加錯誤處理
            const userData = JSON.parse(savedUser);
            if (userData && typeof userData === 'object') {
                authToken = savedToken;
                currentUser = userData;
                console.log('✅ 從本地儲存恢復登入狀態');
            } else {
                // 如果資料損壞，清除它
                localStorage.removeItem('authToken');
                localStorage.removeItem('currentUser');
                console.log('🔄 清除損壞的登入資料');
            }
        }
    } catch (error) {
        console.error('❌ 讀取本地儲存失敗:', error);
        // 清除損壞的資料
        localStorage.removeItem('authToken');
        localStorage.removeItem('currentUser');
    }
}
