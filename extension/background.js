// Super Find Bar - Background Service Worker
// Handles global shortcuts and cross-tab communication

// 监听快捷键命令
chrome.commands.onCommand.addListener((command) => {
    if (command === 'toggle-search') {
        // 向当前活跃的标签页发送消息
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            if (tabs[0]?.id) {
                chrome.tabs.sendMessage(tabs[0].id, { action: 'toggle-search' }).catch(() => {
                    // 忽略错误（页面可能还未加载 content script）
                });
            }
        });
    }
});

// 监听扩展安装/更新事件
chrome.runtime.onInstalled.addListener((details) => {
    if (details.reason === 'install') {
        // 首次安装：打开欢迎页面
        chrome.tabs.create({ url: 'options/options.html?welcome=1' });
    } else if (details.reason === 'update') {
        // 更新：可选的通知（当前注释掉）
        const currentVersion = chrome.runtime.getManifest().version;
        console.log(`[Super Find Bar] Updated to version ${currentVersion}`);
        
        // 可选：显示更新通知
        // chrome.notifications.create({
        //     type: 'basic',
        //     iconUrl: 'icons/icon128.png',
        //     title: 'Super Find Bar 已更新',
        //     message: `版本 ${currentVersion} 的新功能：支持 Gemini/PDF 搜索！`
        // });
    }
});

// 监听来自 options 页面或 content script 的消息
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'getConfig') {
        // 从 storage 获取配置
        chrome.storage.sync.get('sf-bar-config-v17', (result) => {
            sendResponse(result);
        });
        return true; // 保持消息通道打开
    }
    
    if (request.action === 'saveConfig') {
        // 保存配置到 storage
        chrome.storage.sync.set({ 'sf-bar-config-v17': request.config }, () => {
            sendResponse({ success: true });
        });
        return true;
    }
});

// 监听 storage 变化（可选：用于跨标签页同步）
chrome.storage.onChanged.addListener((changes, areaName) => {
    if (areaName === 'sync' && changes['sf-bar-config-v17']) {
        console.log('[Super Find Bar] Config synced across devices');
    }
});




