// 签到系统增强脚本
// 在现有表单页面中加载此脚本，实现签到签退功能

(function() {
    'use strict';
    
    // 签到表哈希值
    const SIGN_IN_TABLE_HASH = '65c97fd2268d95c3d222c8596dd893b1';
    
    // 检查当前页面是否为签到表单
    function isSignInForm() {
        const urlParams = new URLSearchParams(window.location.search);
        const tableHash = urlParams.get('table');
        return tableHash === SIGN_IN_TABLE_HASH;
    }
    
    // 获取当前时间格式化字符串
    function getCurrentTime() {
        const now = new Date();
        return now.toLocaleString('zh-CN', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        });
    }
    
    // 计算工作时间
    function calculateWorkTime(signInTime, signOutTime) {
        if (!signInTime || !signOutTime) return '';
        
        try {
            const signIn = new Date(signInTime);
            const signOut = new Date(signOutTime);
            const diffMs = signOut - signIn;
            
            if (diffMs <= 0) return '0小时';
            
            const hours = Math.floor(diffMs / (1000 * 60 * 60));
            const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
            
            if (hours === 0) {
                return `${minutes}分钟`;
            } else if (minutes === 0) {
                return `${hours}小时`;
            } else {
                return `${hours}小时${minutes}分钟`;
            }
        } catch (error) {
            console.error('计算工作时间错误:', error);
            return '';
        }
    }
    
    // 创建签到签退按钮
    function createSignButtons() {
        const formActions = document.querySelector('.form-actions');
        if (!formActions) return;
        
        // 创建按钮容器
        const buttonContainer = document.createElement('div');
        buttonContainer.className = 'sign-buttons';
        buttonContainer.style.cssText = `
            display: flex;
            gap: 10px;
            margin-bottom: 15px;
            justify-content: center;
        `;
        
        // 创建签到按钮
        const signInButton = document.createElement('el-button');
        signInButton.type = 'primary';
        signInButton.innerHTML = `
            <el-icon><Check /></el-icon>
            签到
        `;
        signInButton.onclick = handleSignIn;
        
        // 创建签退按钮
        const signOutButton = document.createElement('el-button');
        signOutButton.type = 'success';
        signOutButton.innerHTML = `
            <el-icon><Close /></el-icon>
            签退
        `;
        signOutButton.onclick = handleSignOut;
        
        buttonContainer.appendChild(signInButton);
        buttonContainer.appendChild(signOutButton);
        
        // 插入到表单操作区域前面
        formActions.parentNode.insertBefore(buttonContainer, formActions);
    }
    
    // 处理签到
    function handleSignIn() {
        const currentTime = getCurrentTime();
        
        // 查找签到时间输入框
        const signInInput = document.querySelector('input[placeholder*="签到时间"]');
        if (signInInput) {
            signInInput.value = currentTime;
            
            // 触发输入事件，确保Vue数据更新
            signInInput.dispatchEvent(new Event('input', { bubbles: true }));
            
            console.log('签到时间已记录:', currentTime);
            alert(`签到成功！时间：${currentTime}`);
        } else {
            console.warn('未找到签到时间输入框');
        }
    }
    
    // 处理签退
    function handleSignOut() {
        const currentTime = getCurrentTime();
        
        // 查找签退时间输入框
        const signOutInput = document.querySelector('input[placeholder*="签退时间"]');
        const signInInput = document.querySelector('input[placeholder*="签到时间"]');
        const workTimeInput = document.querySelector('input[placeholder*="实际工作时间"]');
        
        if (signOutInput) {
            signOutInput.value = currentTime;
            signOutInput.dispatchEvent(new Event('input', { bubbles: true }));
            
            // 计算工作时间
            if (signInInput && signInInput.value && workTimeInput) {
                const workTime = calculateWorkTime(signInInput.value, currentTime);
                workTimeInput.value = workTime;
                workTimeInput.dispatchEvent(new Event('input', { bubbles: true }));
                
                console.log('签退时间已记录:', currentTime);
                console.log('工作时间已计算:', workTime);
                alert(`签退成功！时间：${currentTime}\n工作时间：${workTime}`);
            } else {
                console.log('签退时间已记录:', currentTime);
                alert(`签退成功！时间：${currentTime}`);
            }
        } else {
            console.warn('未找到签退时间输入框');
        }
    }
    
    // 初始化
    function init() {
        if (!isSignInForm()) {
            console.log('当前页面不是签到表单，跳过增强脚本');
            return;
        }
        
        console.log('检测到签到表单，初始化增强功能...');
        
        // 等待页面加载完成
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', createSignButtons);
        } else {
            // 如果页面已经加载完成，直接创建按钮
            setTimeout(createSignButtons, 1000);
        }
        
        // 添加样式
        const style = document.createElement('style');
        style.textContent = `
            .sign-buttons .el-button {
                min-width: 100px;
            }
            .sign-buttons .el-button--primary {
                background: linear-gradient(135deg, #409EFF 0%, #67C23A 100%);
                border: none;
            }
            .sign-buttons .el-button--success {
                background: linear-gradient(135deg, #67C23A 0%, #E6A23C 100%);
                border: none;
            }
        `;
        document.head.appendChild(style);
    }
    
    // 启动初始化
    init();
    
})();

// 使用说明：
// 1. 在签到表单页面中加载此脚本
// 2. 脚本会自动检测是否为签到表单
// 3. 如果是签到表单，会自动添加签到和签退按钮
// 4. 点击按钮会自动记录当前时间并计算工作时间
