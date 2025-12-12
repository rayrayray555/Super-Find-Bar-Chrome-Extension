// Super Find Bar - Popup Script
document.addEventListener('DOMContentLoaded', () => {
    // 检测浏览器语言并设置文本
    const browserLang = chrome.i18n.getUILanguage() || navigator.language || 'en';
    const isChinese = browserLang.startsWith('zh');
    
    const texts = isChinese ? {
        openSearch: '打开搜索栏',
        openOptions: '设置选项',
        openGithub: 'GitHub 仓库'
    } : {
        openSearch: 'Open Search Bar',
        openOptions: 'Settings',
        openGithub: 'GitHub Repository'
    };
    
    document.getElementById('text-open-search').textContent = texts.openSearch;
    document.getElementById('text-open-options').textContent = texts.openOptions;
    document.getElementById('text-open-github').textContent = texts.openGithub;
    
    // 打开搜索栏
    document.getElementById('open-search').addEventListener('click', () => {
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            if (tabs[0]?.id) {
                chrome.tabs.sendMessage(tabs[0].id, { action: 'toggle-search' }).catch(() => {});
            }
        });
        window.close();
    });

    // 打开设置页面
    document.getElementById('open-options').addEventListener('click', () => {
        chrome.runtime.openOptionsPage();
        window.close();
    });

    // 打开 GitHub 仓库
    document.getElementById('open-github').addEventListener('click', () => {
        chrome.tabs.create({ url: 'https://github.com/rayrayray555/Super-Find-Bar-Chrome-Extension' });
        window.close();
    });
});



