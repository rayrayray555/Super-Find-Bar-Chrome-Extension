// Super Find Bar - Options Page Script (Refactored)

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
    scroll: {
        alwaysCenter: true
    },
    colors: [
        '#fce8b2', '#ccff90', '#8ab4f8', '#e6c9a8',
        '#d7aefb', '#fdcfe8', '#a7ffeb'
    ],
    lang: 'zh'
};

let CONFIG = { ...DEFAULT_CONFIG };

// i18n
const I18N = {
    zh: {
        defaultSearchSettings: '默认搜索设置',
        matchCase: '区分大小写',
        wholeWord: '全词匹配',
        highlightAll: '高亮所有',
        ignoreAccents: '忽略重音',
        regex: '正则表达式',
        includeHidden: '包含隐藏元素',
        fuzzy: '模糊搜索',
        fuzzyTolerance: '容错字符数',
        perfThreshold: '自动搜索阈值',
        perfThresholdHint: '超过此数值将关闭实时搜索，需要手动按 Enter 触发',
        scrollBehavior: '滚动行为',
        alwaysCenter: '始终居中',
        onlyWhenHidden: '仅不可见时滚动',
        scrollBehaviorHint: '始终居中：避免被浮动元素遮挡，适合 ChatGPT 等网站 | 仅不可见时滚动：减少跳动，适合长文档阅读',
        showLaunchBtn: '显示右下角放大镜按钮',
        persistent: '刷新后自动显示搜索栏',
        appearanceLayout: '外观与布局',
        windowPosition: '窗口位置',
        colorScheme: '多词颜色方案',
        themeColors: '主题颜色',
        backgroundOpacity: '背景透明度',
        shortcutSettings: '快捷键设置',
        defaultShortcut: '默认快捷键',
        supportProject: '支持这个项目',
        githubStar: 'GitHub Star',
        rateExtension: '五星好评',
        tutorial: '使用教程',
        reportIssue: '报告问题',
        privacyPolicy: '隐私政策',
        saved: '✓ 设置已保存',
        imeConflictWarning: '输入法冲突提示',
        imeConflictHint: '如果 Ctrl+Shift+F 触发微软输入法简繁切换，请在系统输入法设置中关闭该快捷键。',
        shortcutNotWorking: '快捷键在扩展商店等系统页面不生效',
        customShortcut: '自定义快捷键'
    },
    en: {
        defaultSearchSettings: 'Default Search Settings',
        matchCase: 'Match Case',
        wholeWord: 'Whole Word',
        highlightAll: 'Highlight All',
        ignoreAccents: 'Ignore Accents',
        regex: 'Regular Expression',
        includeHidden: 'Include Hidden',
        fuzzy: 'Fuzzy Search',
        fuzzyTolerance: 'Tolerance Character Count',
        perfThreshold: 'Auto-Search Threshold',
        perfThresholdHint: 'Live search disabled above this node count, Enter key required',
        scrollBehavior: 'Scroll Behavior',
        alwaysCenter: 'Always Center',
        onlyWhenHidden: 'Scroll Only When Hidden',
        scrollBehaviorHint: 'Always Center: Avoids obstruction by floating elements | Only When Hidden: Reduces jumps, stable reading',
        showLaunchBtn: 'Show Launch Button',
        persistent: 'Auto-show on Refresh',
        appearanceLayout: 'Appearance & Layout',
        windowPosition: 'Window Position',
        colorScheme: 'Multi-term Colors',
        themeColors: 'Theme Colors',
        backgroundOpacity: 'Background Opacity',
        shortcutSettings: 'Shortcut Settings',
        defaultShortcut: 'Default Shortcut',
        supportProject: 'Support Project',
        githubStar: 'GitHub Star',
        rateExtension: 'Rate 5 Stars',
        tutorial: 'Tutorial',
        reportIssue: 'Report Issue',
        privacyPolicy: 'Privacy Policy',
        saved: '✓ Settings Saved',
        imeConflictWarning: 'IME Conflict Warning',
        imeConflictHint: 'If Ctrl+Shift+F triggers Microsoft IME simplified/traditional toggle, please disable this shortcut in system IME settings.',
        shortcutNotWorking: 'Shortcut does not work on extension store and other system pages',
        customShortcut: 'Customize Shortcut'
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
                scroll: { ...DEFAULT_CONFIG.scroll, ...result[STORAGE_KEY].scroll },
                colors: result[STORAGE_KEY].colors || DEFAULT_CONFIG.colors
            };
        }
        if (!CONFIG.lang) CONFIG.lang = 'zh';
        if (!CONFIG.scroll) CONFIG.scroll = DEFAULT_CONFIG.scroll;
        
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
        showSaveToast();
    } catch (e) {
        console.error('[Options] Failed to save config:', e);
    }
}

// 显示保存提示
function showSaveToast() {
    const toast = document.getElementById('save-toast');
    toast.textContent = I18N[CONFIG.lang].saved;
    toast.classList.add('show');
    setTimeout(() => {
        toast.classList.remove('show');
    }, 2000);
}

// 更新 UI
function updateUI() {
    // 搜索选项 (Switch)
    const searchOptions = ['matchCase', 'wholeWord', 'highlightAll', 'ignoreAccents', 'regex', 'includeHidden', 'fuzzy'];
    searchOptions.forEach(opt => {
        const el = document.getElementById(`opt-${opt}`);
        if(el) el.checked = CONFIG.search[opt];
    });

    // 模糊搜索容错
    document.getElementById('fuzzy-tolerance').value = CONFIG.search.fuzzyTolerance;
    document.getElementById('fuzzy-tolerance-value').textContent = CONFIG.search.fuzzyTolerance;

    // 性能阈值
    document.getElementById('perf-threshold').value = CONFIG.search.perfThreshold;

    // 滚动行为
    const scrollValue = CONFIG.scroll.alwaysCenter ? 'always-center' : 'only-when-hidden';
    const scrollRadio = document.querySelector(`input[name="scroll-behavior"][value="${scrollValue}"]`);
    if (scrollRadio) scrollRadio.checked = true;

    // 其他开关
    document.getElementById('show-launch-btn').checked = CONFIG.layout.showLaunchBtn;
    document.getElementById('persistent').checked = CONFIG.layout.persistent;

    // 窗口位置
    document.querySelectorAll('.pos-btn').forEach(btn => {
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

    // 颜色方案 (需要先清空再重建)
    const colorContainer = document.getElementById('color-pickers-container');
    // 保留最后的重置按钮，清空前面的颜色
    while(colorContainer.children.length > 1) {
        colorContainer.removeChild(colorContainer.firstChild);
    }
    
    // 重新创建颜色选择器 (倒序插入到重置按钮前)
    CONFIG.colors.forEach((color, idx) => {
        const wrapper = document.createElement('div');
        wrapper.className = 'color-circle';
        const input = document.createElement('input');
        input.type = 'color';
        input.value = color;
        input.addEventListener('change', (e) => {
            CONFIG.colors[idx] = e.target.value;
            saveConfig();
        });
        wrapper.appendChild(input);
        colorContainer.insertBefore(wrapper, document.getElementById('reset-colors'));
    });

    // 主题颜色
    document.getElementById('theme-bg').value = CONFIG.theme.bg;
    document.getElementById('theme-text').value = CONFIG.theme.text;
    document.getElementById('theme-opacity').value = CONFIG.theme.opacity;
    document.getElementById('theme-opacity-value').textContent = Math.round(CONFIG.theme.opacity * 100) + '%';

    // 语言
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

// 初始化事件监听
function initEventListeners() {
    // 搜索选项
    const searchOptions = ['matchCase', 'wholeWord', 'highlightAll', 'ignoreAccents', 'regex', 'includeHidden', 'fuzzy'];
    searchOptions.forEach(opt => {
        const el = document.getElementById(`opt-${opt}`);
        if(el) {
            el.addEventListener('change', (e) => {
                CONFIG.search[opt] = e.target.checked;
                saveConfig();
            });
        }
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

    // 性能阈值重置
    document.getElementById('reset-perf-threshold').addEventListener('click', () => {
        CONFIG.search.perfThreshold = DEFAULT_CONFIG.search.perfThreshold;
        document.getElementById('perf-threshold').value = CONFIG.search.perfThreshold;
        saveConfig();
    });

    // 滚动行为
    document.querySelectorAll('input[name="scroll-behavior"]').forEach(radio => {
        radio.addEventListener('change', (e) => {
            CONFIG.scroll.alwaysCenter = e.target.value === 'always-center';
            saveConfig();
        });
    });

    // 显示按钮 & 持久化
    document.getElementById('show-launch-btn').addEventListener('change', (e) => {
        CONFIG.layout.showLaunchBtn = e.target.checked;
        saveConfig();
    });
    
    document.getElementById('persistent').addEventListener('change', (e) => {
        CONFIG.layout.persistent = e.target.checked;
        saveConfig();
    });

    // 窗口位置
    document.querySelectorAll('.pos-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const pos = btn.dataset.position;
            const isBar = pos === 'top' || pos === 'bottom';
            
            CONFIG.layout.position = pos;
            CONFIG.layout.mode = isBar ? 'bar' : 'float';
            
            updateUI(); // 刷新按钮状态
            saveConfig();
        });
    });

    // 颜色重置
    document.getElementById('reset-colors').addEventListener('click', () => {
        CONFIG.colors = [...DEFAULT_CONFIG.colors];
        updateUI();
        saveConfig();
    });

    // 主题设置
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

    // 快捷键按钮
    const openShortcutsBtn = document.getElementById('open-chrome-shortcuts');
    if (openShortcutsBtn) {
        openShortcutsBtn.addEventListener('click', () => {
            chrome.tabs.create({ url: 'chrome://extensions/shortcuts' });
        });
    }

    // 语言切换
    document.getElementById('lang-selector').addEventListener('change', (e) => {
        updateLanguage(e.target.value);
        saveConfig();
    });
}

document.addEventListener('DOMContentLoaded', () => {
    loadConfig();
    initEventListeners();
});
