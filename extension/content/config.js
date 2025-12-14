// Super Find Bar - 配置和常量模块
(function() {
    'use strict';

    // 导出到全局作用域（通过 window 对象）
    window.SF_CONFIG = {
        HOST_ID: 'sf-bar-root-v17',
        BTN_ID: 'sf-launch-btn-v17',
        STORAGE_KEY: 'sf-bar-config-v17',

        DEFAULT_CONFIG: {
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
                includeForcedHidden: false,
                fuzzy: false,
                fuzzyTolerance: 1,
                pinned: ['matchCase', 'wholeWord', 'ignoreAccents', 'highlightAll'],
                perfThreshold: 10000
            },
            coordinates: {
                showXAxis: true,
                showYAxis: true,
                xPosition: 'bottom',
                yPosition: 'right'
            },
            scroll: {
                behavior: 'always-center'
            },
            colors: [
                '#fce8b2', '#ccff90', '#8ab4f8', '#e6c9a8',
                '#d7aefb', '#fdcfe8', '#a7ffeb'
            ],
            lang: 'zh'
        },

        I18N: {
            zh: {
                ph: '多词搜索"，"分隔（不同颜色）',
                phFuzzy: '模糊模式：输入后按 Enter 搜索...',
                phManual: '页面内容过多：输入后按 Enter 搜索...',
                count: '{i} / {total}',
                hiddenAlert: '位于隐藏区域',
                loading: '计算中...',
                saved: '✓ 已保存',
                titles: {
                    prev: '上一个 (←)',
                    next: '下一个 (→)',
                    close: '关闭 (Esc)',
                    pin: '固定窗口（刷新后自动显示）',
                    rate: '给个好评吧 ♥',
                    adv: '设置',
                    reset: '重置'
                },
                group: {
                    tool: '工具栏显示',
                    search: '搜索设置',
                    layout: '布局 & 外观'
                },
                lbl: {
                    fuzzyTol: '模糊容错 (字数)',
                    perf: '自动搜索阈值 (节点数)',
                    perfHint: '超过此数值将关闭实时搜索。',
                    bg: '背景',
                    txt: '文字',
                    op: '背景透明度',
                    lang: '语言 / Language'
                },
                opts: {
                    matchCase: '区分大小写',
                    wholeWord: '全词匹配',
                    highlightAll: '高亮所有',
                    ignoreAccents: '忽略重音',
                    regex: '正则表达式',
                    includeHidden: '包含隐藏',
                    fuzzy: '模糊搜索'
                }
            },
            en: {
                ph: 'Multi-term: comma-separated (different colors)',
                phFuzzy: 'Fuzzy Mode: Press Enter to search...',
                phManual: 'Page too large: Press Enter to search...',
                count: '{i} / {total}',
                hiddenAlert: 'Hidden Element',
                loading: 'Searching...',
                saved: '✓ Saved',
                titles: {
                    prev: 'Previous (←)',
                    next: 'Next (→)',
                    close: 'Close (Esc)',
                    pin: 'Pin (Auto-show on refresh)',
                    rate: 'Rate on Chrome Web Store ♥',
                    adv: 'Settings',
                    reset: 'Reset'
                },
                group: {
                    tool: 'Toolbar Options',
                    search: 'Search Settings',
                    layout: 'Layout & Appearance'
                },
                lbl: {
                    fuzzyTol: 'Fuzzy Tolerance',
                    perf: 'Auto-Search Threshold',
                    perfHint: 'Disable live search if nodes exceed this.',
                    bg: 'Bg',
                    txt: 'Txt',
                    op: 'Bg Opacity',
                    lang: 'Language'
                },
                opts: {
                    matchCase: 'Match Case',
                    wholeWord: 'Whole Word',
                    highlightAll: 'Highlight All',
                    ignoreAccents: 'Ignore Accents',
                    regex: 'Regex',
                    includeHidden: 'Include Hidden',
                    fuzzy: 'Fuzzy Search'
                }
            }
        },

        // 异步加载配置
        async loadConfig() {
            let CONFIG = { ...this.DEFAULT_CONFIG };
            try {
                const result = await chrome.storage.sync.get(this.STORAGE_KEY);
                if (result[this.STORAGE_KEY]) {
                    CONFIG = {
                        ...this.DEFAULT_CONFIG,
                        ...result[this.STORAGE_KEY],
                        theme: { ...this.DEFAULT_CONFIG.theme, ...result[this.STORAGE_KEY].theme },
                        layout: { ...this.DEFAULT_CONFIG.layout, ...result[this.STORAGE_KEY].layout },
                        search: { ...this.DEFAULT_CONFIG.search, ...result[this.STORAGE_KEY].search },
                        coordinates: { ...this.DEFAULT_CONFIG.coordinates, ...result[this.STORAGE_KEY].coordinates },
                        scroll: { ...this.DEFAULT_CONFIG.scroll, ...result[this.STORAGE_KEY].scroll },
                        colors: result[this.STORAGE_KEY].colors || this.DEFAULT_CONFIG.colors
                    };
                }
                if (!CONFIG.lang) CONFIG.lang = 'zh';
                if (!CONFIG.coordinates) CONFIG.coordinates = this.DEFAULT_CONFIG.coordinates;
                if (!CONFIG.scroll) CONFIG.scroll = this.DEFAULT_CONFIG.scroll;
                if (!CONFIG.scroll.behavior) {
                    CONFIG.scroll.behavior = this.DEFAULT_CONFIG.scroll.behavior;
                }

                // 从 chrome.storage.local 加载临时设置
                try {
                    const tempConfig = await chrome.storage.local.get([
                        'sf-temp-pinned',
                        'sf-temp-coordinates',
                        'sf-temp-search',
                        'sf-temp-colors',
                        'sf-temp-layout',
                        'sf-temp-theme',
                        'sf-temp-lang',
                        'sf-temp-scroll'
                    ]);

                    if (tempConfig['sf-temp-pinned']) {
                        CONFIG.search.pinned = tempConfig['sf-temp-pinned'];
                    }
                    if (tempConfig['sf-temp-coordinates']) {
                        CONFIG.coordinates = { ...CONFIG.coordinates, ...tempConfig['sf-temp-coordinates'] };
                    }
                    if (tempConfig['sf-temp-search']) {
                        const searchTemp = tempConfig['sf-temp-search'];
                        CONFIG.search.fuzzy = searchTemp.fuzzy !== undefined ? searchTemp.fuzzy : CONFIG.search.fuzzy;
                        CONFIG.search.fuzzyTolerance = searchTemp.fuzzyTolerance !== undefined ? searchTemp.fuzzyTolerance : CONFIG.search.fuzzyTolerance;
                        CONFIG.search.perfThreshold = searchTemp.perfThreshold !== undefined ? searchTemp.perfThreshold : CONFIG.search.perfThreshold;
                    }
                    if (tempConfig['sf-temp-scroll']) {
                        const scrollTemp = tempConfig['sf-temp-scroll'];
                        CONFIG.scroll.behavior = scrollTemp.behavior || CONFIG.scroll.behavior;
                    }
                    if (tempConfig['sf-temp-colors']) {
                        CONFIG.colors = tempConfig['sf-temp-colors'];
                    }
                    if (tempConfig['sf-temp-layout']) {
                        const layoutTemp = tempConfig['sf-temp-layout'];
                        CONFIG.layout.showLaunchBtn = layoutTemp.showLaunchBtn !== undefined ? layoutTemp.showLaunchBtn : CONFIG.layout.showLaunchBtn;
                        CONFIG.layout.position = layoutTemp.position || CONFIG.layout.position;
                        CONFIG.layout.mode = layoutTemp.mode || CONFIG.layout.mode;
                    }
                    if (tempConfig['sf-temp-theme']) {
                        const themeTemp = tempConfig['sf-temp-theme'];
                        CONFIG.theme.bg = themeTemp.bg || CONFIG.theme.bg;
                        CONFIG.theme.text = themeTemp.text || CONFIG.theme.text;
                        CONFIG.theme.opacity = themeTemp.opacity !== undefined ? themeTemp.opacity : CONFIG.theme.opacity;
                    }
                    if (tempConfig['sf-temp-lang']) {
                        CONFIG.lang = tempConfig['sf-temp-lang'];
                    }
                } catch (e) {
                    console.error('[Super Find Bar] Failed to load temporary config:', e);
                }
            } catch (e) {
                console.error('[Super Find Bar] Failed to load config:', e);
            }
            return CONFIG;
        },

        async saveConfig(CONFIG) {
            try {
                await chrome.storage.sync.set({ [this.STORAGE_KEY]: CONFIG });
            } catch (e) {
                console.error('[Super Find Bar] Failed to save config:', e);
            }
        },

        async saveSessionConfig(CONFIG) {
            try {
                await chrome.storage.local.set({
                    'sf-temp-pinned': CONFIG.search.pinned,
                    'sf-temp-coordinates': CONFIG.coordinates,
                    'sf-temp-search': {
                        fuzzy: CONFIG.search.fuzzy,
                        fuzzyTolerance: CONFIG.search.fuzzyTolerance,
                        perfThreshold: CONFIG.search.perfThreshold
                    },
                    'sf-temp-scroll': {
                        behavior: CONFIG.scroll.behavior
                    },
                    'sf-temp-colors': CONFIG.colors,
                    'sf-temp-layout': {
                        showLaunchBtn: CONFIG.layout.showLaunchBtn,
                        position: CONFIG.layout.position,
                        mode: CONFIG.layout.mode
                    },
                    'sf-temp-theme': {
                        bg: CONFIG.theme.bg,
                        text: CONFIG.theme.text,
                        opacity: CONFIG.theme.opacity
                    },
                    'sf-temp-lang': CONFIG.lang
                });
            } catch (e) {
                console.error('[Super Find Bar] Failed to save temporary config:', e);
            }
        },

        t(CONFIG, path) {
            const keys = path.split('.');
            let curr = this.I18N[CONFIG.lang];
            for (let k of keys) curr = curr[k];
            return curr;
        }
    };
})();

