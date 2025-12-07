// Super Find Bar - Options Page Script

const STORAGE_KEY = 'sf-bar-config-v17';

const DEFAULT_CONFIG = {
    theme: {
        bg: '#202124',
        text: '#e8eaed',
        opacity: 0.95
    },
    layout: {
        mode: 'float',
        position: 'top-right',
        persistent: false,
        showLaunchBtn: false
    },
    search: {
        matchCase: false,
        wholeWord: false,
        highlightAll: true,
        ignoreAccents: true,
        regex: false,
        includeHidden: false,
        fuzzy: false,
        fuzzyTolerance: 1,
        pinned: ['matchCase', 'wholeWord', 'ignoreAccents', 'highlightAll'],
        perfThreshold: 5000
    },
    colors: [
        '#fce8b2', '#ccff90', '#8ab4f8', '#e6c9a8',
        '#d7aefb', '#fdcfe8', '#a7ffeb'
    ],
    lang: 'zh'
};

let CONFIG = { ...DEFAULT_CONFIG };

// i18n 翻译
const I18N = {
    zh: {
        defaultSearchSettings: '默认搜索设置',
        defaultSearchSettingsDesc: '以下设置将作为搜索框打开时的默认值',
        matchCase: '区分大小写',
        wholeWord: '全词匹配',
        highlightAll: '高亮所有',
        ignoreAccents: '忽略重音',
        regex: '正则表达式',
        includeHidden: '包含隐藏元素',
        fuzzy: '模糊搜索',
        fuzzyTolerance: '模糊搜索容错',
        perfThreshold: '自动搜索阈值（节点数）',
        perfThresholdHint: '超过此数值将关闭实时搜索，需要手动按 Enter 触发',
        reset: '重置',
        shortcutSettings: '快捷键设置',
        defaultShortcut: '默认快捷键',
        recommended: '推荐',
        customShortcutDesc: '💡 如果默认快捷键与其他程序冲突，可以在 Chrome 扩展快捷键设置中自定义',
        openChromeShortcuts: '⚙️ 打开 Chrome 快捷键设置',
        shortcutLimitation: '⚠️ 注意：快捷键在 Chrome 系统页面（如扩展商店、设置页面）无法生效',
        appearanceLayout: '外观与布局',
        windowPosition: '窗口位置',
        colorScheme: '多词颜色方案',
        themeColors: '主题颜色',
        background: '背景',
        text: '文字',
        backgroundOpacity: '背景透明度',
        showLaunchBtn: '显示右下角放大镜按钮',
        persistent: '刷新后自动显示搜索栏',
        supportProject: '支持这个项目',
        supportDesc: '如果这个扩展帮到了您，请考虑：',
        githubStar: 'GitHub Star',
        rateExtension: '五星好评',
        tutorial: '使用教程',
        reportIssue: '报告问题',
        privacyPolicy: '隐私政策',
        openSource: '100% 开源',
        saved: '✓ 设置已保存'
    },
    en: {
        defaultSearchSettings: 'Default Search Settings',
        defaultSearchSettingsDesc: 'These settings will be used as defaults when opening the search bar',
        matchCase: 'Match Case',
        wholeWord: 'Whole Word',
        highlightAll: 'Highlight All',
        ignoreAccents: 'Ignore Accents',
        regex: 'Regular Expression',
        includeHidden: 'Include Hidden',
        fuzzy: 'Fuzzy Search',
        fuzzyTolerance: 'Fuzzy Tolerance',
        perfThreshold: 'Auto-Search Threshold (Nodes)',
        perfThresholdHint: 'Live search will be disabled if nodes exceed this value',
        reset: 'Reset',
        shortcutSettings: 'Shortcut Settings',
        defaultShortcut: 'Default Shortcut',
        recommended: 'Recommended',
        customShortcutDesc: '💡 If the default shortcut conflicts with other apps, you can customize it in Chrome\'s extension shortcuts settings',
        openChromeShortcuts: '⚙️ Open Chrome Shortcuts Settings',
        shortcutLimitation: '⚠️ Note: Shortcuts do not work on Chrome system pages (e.g., extension store, settings)',
        appearanceLayout: 'Appearance & Layout',
        windowPosition: 'Window Position',
        colorScheme: 'Multi-term Colors',
        themeColors: 'Theme Colors',
        background: 'Background',
        text: 'Text',
        backgroundOpacity: 'Background Opacity',
        showLaunchBtn: 'Show Launch Button',
        persistent: 'Auto-show on page refresh',
        supportProject: 'Support This Project',
        supportDesc: 'If this extension helped you, please consider:',
        githubStar: 'GitHub Star',
        rateExtension: 'Rate 5 Stars',
        tutorial: 'Tutorial',
        reportIssue: 'Report Issue',
        privacyPolicy: 'Privacy Policy',
        openSource: '100% Open Source',
        saved: '✓ Settings Saved'
    }
};

// 加载配置
async function loadConfig() {
    try {
        const result = await chrome.storage.sync.get(STORAGE_KEY);
        if (result[STORAGE_KEY]) {
            CONFIG = {
                ...DEFAULT_CONFIG,
                ...result[STORAGE_KEY],
                theme: { ...DEFAULT_CONFIG.theme, ...result[STORAGE_KEY].theme },
                layout: { ...DEFAULT_CONFIG.layout, ...result[STORAGE_KEY].layout },
                search: { ...DEFAULT_CONFIG.search, ...result[STORAGE_KEY].search },
                colors: result[STORAGE_KEY].colors || DEFAULT_CONFIG.colors
            };
        }
        if (!CONFIG.lang) CONFIG.lang = 'zh';
        
        updateUI();
        updateLanguage(CONFIG.lang);
    } catch (e) {
        console.error('[Options] Failed to load config:', e);
    }
}

// 保存配置
async function saveConfig() {
    try {
        await chrome.storage.sync.set({ [STORAGE_KEY]: CONFIG });
        showSaveStatus();
    } catch (e) {
        console.error('[Options] Failed to save config:', e);
    }
}

// 更新 UI
function updateUI() {
    // 搜索选项
    document.getElementById('opt-matchCase').checked = CONFIG.search.matchCase;
    document.getElementById('opt-wholeWord').checked = CONFIG.search.wholeWord;
    document.getElementById('opt-highlightAll').checked = CONFIG.search.highlightAll;
    document.getElementById('opt-ignoreAccents').checked = CONFIG.search.ignoreAccents;
    document.getElementById('opt-regex').checked = CONFIG.search.regex;
    document.getElementById('opt-includeHidden').checked = CONFIG.search.includeHidden;
    document.getElementById('opt-fuzzy').checked = CONFIG.search.fuzzy;
    
    // 模糊搜索容错
    document.getElementById('fuzzy-tolerance').value = CONFIG.search.fuzzyTolerance;
    document.getElementById('fuzzy-tolerance-value').textContent = CONFIG.search.fuzzyTolerance;
    
    // 性能阈值
    document.getElementById('perf-threshold').value = CONFIG.search.perfThreshold;
    
    // 窗口位置
    document.querySelectorAll('.position-btn').forEach(btn => {
        const pos = btn.dataset.position;
        const isBar = pos === 'top' || pos === 'bottom';
        const currentMode = CONFIG.layout.mode;
        const currentPos = CONFIG.layout.position;
        
        if ((isBar && currentMode === 'bar' && currentPos === pos) ||
            (!isBar && currentMode === 'float' && currentPos === pos)) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });
    
    // 颜色方案
    document.querySelectorAll('.color-picker input[type="color"]').forEach((input, idx) => {
        if (CONFIG.colors[idx]) {
            input.value = CONFIG.colors[idx];
        }
    });
    
    // 主题颜色
    document.getElementById('theme-bg').value = CONFIG.theme.bg;
    document.getElementById('theme-text').value = CONFIG.theme.text;
    document.getElementById('theme-opacity').value = CONFIG.theme.opacity;
    document.getElementById('theme-opacity-value').textContent = Math.round(CONFIG.theme.opacity * 100) + '%';
    
    // 其他选项
    document.getElementById('show-launch-btn').checked = CONFIG.layout.showLaunchBtn;
    document.getElementById('persistent').checked = CONFIG.layout.persistent;
    
    // 语言选择器
    document.getElementById('lang-selector').value = CONFIG.lang;
}

// 更新语言
function updateLanguage(lang) {
    CONFIG.lang = lang;
    document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.dataset.i18n;
        if (I18N[lang] && I18N[lang][key]) {
            el.textContent = I18N[lang][key];
        }
    });
}

// 显示保存状态
function showSaveStatus() {
    const status = document.getElementById('save-status');
    status.textContent = I18N[CONFIG.lang].saved;
    status.classList.add('show');
    setTimeout(() => {
        status.classList.remove('show');
    }, 2000);
}

// 初始化事件监听
function initEventListeners() {
    // 搜索选项
    const searchOptions = ['matchCase', 'wholeWord', 'highlightAll', 'ignoreAccents', 'regex', 'includeHidden', 'fuzzy'];
    searchOptions.forEach(opt => {
        document.getElementById(`opt-${opt}`).addEventListener('change', (e) => {
            CONFIG.search[opt] = e.target.checked;
            saveConfig();
        });
    });
    
    // 模糊搜索容错
    document.getElementById('fuzzy-tolerance').addEventListener('input', (e) => {
        CONFIG.search.fuzzyTolerance = parseInt(e.target.value);
        document.getElementById('fuzzy-tolerance-value').textContent = e.target.value;
        saveConfig();
    });
    
    // 性能阈值
    document.getElementById('perf-threshold').addEventListener('change', (e) => {
        CONFIG.search.perfThreshold = parseInt(e.target.value);
        saveConfig();
    });
    
    document.getElementById('reset-perf').addEventListener('click', () => {
        CONFIG.search.perfThreshold = 5000;
        document.getElementById('perf-threshold').value = 5000;
        saveConfig();
    });
    
    // 打开 Chrome 快捷键设置
    const openShortcutsBtn = document.getElementById('open-chrome-shortcuts');
    if (openShortcutsBtn) {
        openShortcutsBtn.addEventListener('click', () => {
            chrome.tabs.create({ url: 'chrome://extensions/shortcuts' });
        });
    }
    
    // 窗口位置
    document.querySelectorAll('.position-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const pos = btn.dataset.position;
            const isBar = pos === 'top' || pos === 'bottom';
            
            CONFIG.layout.position = pos;
            CONFIG.layout.mode = isBar ? 'bar' : 'float';
            
            document.querySelectorAll('.position-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            
            saveConfig();
        });
    });
    
    // 颜色方案
    document.querySelectorAll('.color-picker input[type="color"]').forEach((input, idx) => {
        input.addEventListener('change', (e) => {
            CONFIG.colors[idx] = e.target.value;
            saveConfig();
        });
    });
    
    document.getElementById('reset-colors').addEventListener('click', () => {
        CONFIG.colors = [...DEFAULT_CONFIG.colors];
        document.querySelectorAll('.color-picker input[type="color"]').forEach((input, idx) => {
            input.value = DEFAULT_CONFIG.colors[idx];
        });
        saveConfig();
    });
    
    // 主题颜色
    document.getElementById('theme-bg').addEventListener('change', (e) => {
        CONFIG.theme.bg = e.target.value;
        saveConfig();
    });
    
    document.getElementById('theme-text').addEventListener('change', (e) => {
        CONFIG.theme.text = e.target.value;
        saveConfig();
    });
    
    document.getElementById('theme-opacity').addEventListener('input', (e) => {
        CONFIG.theme.opacity = parseFloat(e.target.value);
        document.getElementById('theme-opacity-value').textContent = Math.round(e.target.value * 100) + '%';
        saveConfig();
    });
    
    // 其他选项
    document.getElementById('show-launch-btn').addEventListener('change', (e) => {
        CONFIG.layout.showLaunchBtn = e.target.checked;
        saveConfig();
    });
    
    document.getElementById('persistent').addEventListener('change', (e) => {
        CONFIG.layout.persistent = e.target.checked;
        saveConfig();
    });
    
    // 语言切换
    document.getElementById('lang-selector').addEventListener('change', (e) => {
        updateLanguage(e.target.value);
        saveConfig();
    });
}

// 检查是否为欢迎页面
function checkWelcome() {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('welcome') === '1') {
        // 可以显示欢迎消息或引导
        console.log('[Options] Welcome to Super Find Bar!');
    }
}

// 页面加载时初始化
document.addEventListener('DOMContentLoaded', () => {
    loadConfig();
    initEventListeners();
    checkWelcome();
});



