// Super Find Bar - Chrome Extension V1.0
// Content Script
(function () {
    'use strict';

    /********************
      1. 配置与常量 (Config & Constants)
    ********************/
    const HOST_ID = 'sf-bar-root-v17';
    const BTN_ID = 'sf-launch-btn-v17';
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
        coordinates: {
            showXAxis: false,  // X 轴标记（横向）
            showYAxis: true,   // Y 轴标记（纵向，默认开启）
            xPosition: 'bottom', // X 轴位置：top | bottom
            yPosition: 'right'   // Y 轴位置：left | right
        },
        scroll: {
            alwaysCenter: true  // 始终居中显示搜索结果（避免被浮动元素遮挡）
        },
        colors: [
            '#fce8b2', // Yellow
            '#ccff90', // Green
            '#8ab4f8', // Blue
            '#e6c9a8', // Beige
            '#d7aefb', // Purple
            '#fdcfe8', // Pink
            '#a7ffeb'  // Teal
        ],
        lang: 'zh' // 'zh' | 'en'
    };

    let CONFIG = { ...DEFAULT_CONFIG };

    // 异步加载配置
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
                    coordinates: { ...DEFAULT_CONFIG.coordinates, ...result[STORAGE_KEY].coordinates },
                    scroll: { ...DEFAULT_CONFIG.scroll, ...result[STORAGE_KEY].scroll },
                    colors: result[STORAGE_KEY].colors || DEFAULT_CONFIG.colors
                };
            }
            if (!CONFIG.lang) CONFIG.lang = 'zh';
            if (!CONFIG.coordinates) CONFIG.coordinates = DEFAULT_CONFIG.coordinates;
            if (!CONFIG.scroll) CONFIG.scroll = DEFAULT_CONFIG.scroll;
            
            // 从 sessionStorage 加载临时设置（会话级，浏览器关闭后清除）
            // 优先级：sessionStorage > storage.sync（默认值）
            try {
                const sessionPinned = sessionStorage.getItem('sf-session-pinned');
                if (sessionPinned) {
                    CONFIG.search.pinned = JSON.parse(sessionPinned);
                }
                
                const sessionCoordinates = sessionStorage.getItem('sf-session-coordinates');
                if (sessionCoordinates) {
                    CONFIG.coordinates = { ...CONFIG.coordinates, ...JSON.parse(sessionCoordinates) };
                }
            } catch (e) {
                console.error('[Super Find Bar] Failed to load session config:', e);
            }
        } catch (e) {
            console.error('[Super Find Bar] Failed to load config:', e);
        }
    }

    async function saveConfig() {
        try {
            await chrome.storage.sync.set({ [STORAGE_KEY]: CONFIG });
        } catch (e) {
            console.error('[Super Find Bar] Failed to save config:', e);
        }
    }
    
    // 保存会话级临时配置（不持久化，浏览器关闭后清除）
    function saveSessionConfig() {
        try {
            sessionStorage.setItem('sf-session-pinned', JSON.stringify(CONFIG.search.pinned));
            sessionStorage.setItem('sf-session-coordinates', JSON.stringify(CONFIG.coordinates));
        } catch (e) {
            console.error('[Super Find Bar] Failed to save session config:', e);
        }
    }

    // i18n
    const I18N = {
        zh: {
            ph: '多词搜索用"，"分隔（不同颜色）',
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
    };

    function t(path) {
        const keys = path.split('.');
        let curr = I18N[CONFIG.lang];
        for (let k of keys) curr = curr[k];
        return curr;
    }

    /********************
      2. 核心逻辑 (Core Logic)
    ********************/

    function isCJK(str) { return /[\u4e00-\u9fa5]/.test(str); }

    // 智能检测滚动容器（用于 ChatGPT 等自定义滚动布局）
    function findScrollContainer(element) {
        let current = element;
        // 向上遍历最多20层（避免无限循环）
        for (let i = 0; i < 20; i++) {
            if (!current || current === document.body || current === document.documentElement) {
                break;
            }
            
            // 检查是否为滚动容器
            const style = window.getComputedStyle(current);
            const isScrollable = style.overflow === 'auto' || style.overflow === 'scroll' || 
                                 style.overflowY === 'auto' || style.overflowY === 'scroll';
            
            if (isScrollable && current.scrollHeight > current.clientHeight) {
                return current; // 找到滚动容器
            }
            
            current = current.parentElement;
        }
        return null; // 没找到，使用 window
    }

    function isVisible(el) {
        if (!el) return false;
        if (el.id === HOST_ID || el.id === BTN_ID || el.closest('#' + HOST_ID)) return false;
        const style = window.getComputedStyle(el);
        if (style.display === 'none' || style.visibility === 'hidden') return false;
        const rect = el.getBoundingClientRect();
        return rect.width > 0 && rect.height > 0;
    }

    function levenshtein(s, t) {
        if (s === t) return 0;
        if (s.length === 0) return t.length;
        if (t.length === 0) return s.length;
        if (s.length > t.length) { [s, t] = [t, s]; }
        let v0 = new Int32Array(s.length + 1);
        let v1 = new Int32Array(s.length + 1);
        for (let i = 0; i <= s.length; i++) v0[i] = i;
        for (let j = 0; j < t.length; j++) {
            v1[0] = j + 1;
            for (let i = 0; i < s.length; i++) {
                const cost = s[i] === t[j] ? 0 : 1;
                v1[i + 1] = Math.min(v1[i] + 1, v0[i + 1] + 1, v0[i] + cost);
            }
            const tmp = v0; v0 = v1; v1 = tmp;
        }
        return v0[s.length];
    }

    // 验证 Range 对象是否有效（用于检测 DOM 变化）
    function isRangeValid(range) {
        try {
            // 检查 Range 对象是否仍然有效
            const rect = range.getBoundingClientRect();
            // 有效的 Range 应该有尺寸或者至少能获取矩形
            return rect !== null && rect !== undefined;
        } catch(e) {
            // Range 已失效（节点被删除或替换）
            return false;
        }
    }
    
    // 显示内容变化警告提示
    function showContentChangedWarning() {
        const msg = CONFIG.lang === 'zh' ? 
            '⚠️ 页面内容已变化，请重新搜索' : 
            '⚠️ Page content changed, please search again';
        toast.textContent = msg;
        toast.classList.add('visible');
        setTimeout(() => toast.classList.remove('visible'), 3000);
    }
    
    // 检测特殊页面类型
    function detectSpecialPage() {
        const url = window.location.href;
        const host = window.location.hostname;
        
        // 检测 PDF 页面
        if (url.includes('.pdf') || 
            url.includes('chrome-extension://') && document.querySelector('embed[type="application/pdf"]') ||
            document.querySelector('embed[type="application/pdf"]')) {
            return {
                type: 'pdf',
                message: CONFIG.lang === 'zh' ? 
                    '⚠️ PDF 文档暂不支持搜索\n请使用 Chrome 内置搜索（Ctrl+F）或下载后使用专业 PDF 工具' :
                    '⚠️ PDF search not supported yet\nPlease use Chrome\'s built-in search (Ctrl+F) or download and use a PDF tool'
            };
        }
        
        // 检测 Google Docs / Sheets / Slides
        if (host.includes('docs.google.com')) {
            const docType = url.includes('/document/') ? 'Docs' :
                          url.includes('/spreadsheets/') ? 'Sheets' :
                          url.includes('/presentation/') ? 'Slides' :
                          'Docs';
            return {
                type: 'google-docs',
                message: CONFIG.lang === 'zh' ?
                    `⚠️ Google ${docType} 暂不支持搜索\n原因：Google 使用特殊渲染技术，出于安全考虑限制扩展访问\n建议使用 Google ${docType} 自带搜索功能（Ctrl+F）` :
                    `⚠️ Google ${docType} search not supported\nReason: Google uses special rendering technology and restricts extension access for security\nPlease use Google ${docType}'s built-in search (Ctrl+F)`
            };
        }
        
        return null;
    }
    
    // 显示特殊页面警告
    function showSpecialPageWarning(info) {
        toast.textContent = info.message;
        toast.classList.add('visible');
        toast.style.whiteSpace = 'pre-line'; // 支持换行
        toast.style.maxWidth = '400px';
        toast.style.textAlign = 'left';
        // 显示更长时间
        setTimeout(() => {
            toast.classList.remove('visible');
            toast.style.whiteSpace = '';
            toast.style.maxWidth = '';
            toast.style.textAlign = '';
        }, 5000);
    }

    /********************
      3. UI 构建 (UI Construction)
    ********************/
    let shadow, root, input, countDisplay, toast, tickBarX, tickBarY, chkGroup, loadingInd, advPanel, btnAdv;
    let launchBtn;
    let state = {
        ranges: [],
        idx: -1,
        visible: false,
        searchId: 0,
        isDirty: false,
        nodeCount: 0,
        manualMode: false,
        hasWarned: false,
        abortController: null,
        currentHighlight: null,
        supportsHighlight: typeof CSS !== 'undefined' && CSS.highlights
    };

    function tryInit() {
        if (document.body) {
            init();
            initLaunchBtn();
        } else {
            window.addEventListener('DOMContentLoaded', () => {
                init();
                initLaunchBtn();
            });
        }
    }

    function initLaunchBtn() {
        if (!CONFIG.layout.showLaunchBtn) {
            const existing = document.getElementById(BTN_ID);
            if (existing) existing.remove();
            return;
        }
        
        if (document.getElementById(BTN_ID)) return;
        launchBtn = document.createElement('div');
        launchBtn.id = BTN_ID;
        Object.assign(launchBtn.style, {
            position: 'fixed', bottom: '20px', right: '20px',
            width: '40px', height: '40px', borderRadius: '50%',
            background: CONFIG.theme.bg, color: CONFIG.theme.text,
            boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
            zIndex: 2147483646, cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '20px', opacity: '0.6', transition: 'opacity 0.2s',
            pointerEvents: 'auto'
        });
        launchBtn.textContent = '🔍';
        launchBtn.title = 'Super Find Bar (Ctrl+Shift+F)';
        launchBtn.onclick = () => toggle(true);
        launchBtn.onmouseenter = () => launchBtn.style.opacity = '1';
        launchBtn.onmouseleave = () => launchBtn.style.opacity = '0.6';
        document.body.appendChild(launchBtn);
    }

    function init() {
        if (document.getElementById(HOST_ID)) return;

        const host = document.createElement('div');
        host.id = HOST_ID;
        Object.assign(host.style, { position: 'fixed', top: '0', left: '0', zIndex: 2147483647, pointerEvents: 'none' });
        document.body.appendChild(host);
        shadow = host.attachShadow({ mode: 'closed' });

        const style = document.createElement('style');
        style.textContent = `
            :host { all: initial; font-family: system-ui, sans-serif; font-size: 14px; --sf-accent: #8ab4f8; --sf-warn: #d93025; --sf-bg: ${CONFIG.theme.bg}; --sf-txt: ${CONFIG.theme.text}; }
            * { box-sizing: border-box; }

            .sf-box {
                position: fixed; display: flex;
                background: var(--sf-bg); color: var(--sf-txt);
                opacity: ${CONFIG.theme.opacity};
                backdrop-filter: blur(5px);
                box-shadow: 0 8px 24px rgba(0,0,0,0.4);
                transition: transform 0.2s, opacity 0.2s;
                pointer-events: auto;
                border: 1px solid rgba(255,255,255,0.15);
            }

            .sf-box.mode-float {
                flex-direction: column; width: 485px; border-radius: 12px; margin: 20px; padding: 10px;
            }
            .mode-float .sf-row-top { display: flex; align-items: center; gap: 8px; width: 100%; }
            .mode-float .sf-row-bot { margin-top: 8px; padding-top: 8px; border-top: 1px solid rgba(255,255,255,0.1); }
            .mode-float .sf-chk-group { display: flex; flex-wrap: wrap; gap: 8px; align-items: center; }

            .sf-pos-top-right { top: 0; right: 0; transform: translateY(-120%); }
            .sf-pos-top-right.show { transform: translateY(0); }
            .sf-pos-top-left { top: 0; left: 0; transform: translateY(-120%); }
            .sf-pos-top-left.show { transform: translateY(0); }
            .sf-pos-bottom-right { bottom: 0; right: 0; transform: translateY(120%); }
            .sf-pos-bottom-right.show { transform: translateY(0); }
            .sf-pos-bottom-left { bottom: 0; left: 0; transform: translateY(120%); }
            .sf-pos-bottom-left.show { transform: translateY(0); }

            .sf-box.mode-bar {
                width: 100%; left: 0; right: 0; margin: 0; border-radius: 0; border: 0;
                flex-direction: row; align-items: center; padding: 0 16px; height: 50px;
                justify-content: flex-start; gap: 8px;
            }
            .sf-pos-top { top: 0; transform: translateY(-100%); border-bottom: 1px solid rgba(255,255,255,0.1); }
            .sf-pos-top.show { transform: translateY(0); }
            .sf-pos-bottom { bottom: 0; transform: translateY(100%); border-top: 1px solid rgba(255,255,255,0.1); }
            .sf-pos-bottom.show { transform: translateY(0); }

            .mode-bar .sf-row-top, .mode-bar .sf-row-bot { display: contents; }
            .mode-bar .sf-input-wrap { order: 1; flex: 0 1 350px; }
            .mode-bar .sf-btn-prev { order: 2; }
            .mode-bar .sf-btn-next { order: 3; }
            .mode-bar .sf-btn-adv { order: 4; margin-right: 12px; }
            .mode-bar .sf-chk-group { order: 5; display: flex; align-items: center; border-left: 1px solid rgba(255,255,255,0.2); padding-left: 12px; }
            .mode-bar .sf-btn-pin { order: 99; margin-left: auto; margin-right: 4px; }
            .mode-bar .sf-btn-rate { order: 99; margin-right: 4px; }
            .mode-bar .sf-btn-close { order: 100; }
            .mode-float .sf-btn-pin { margin-left: auto; }
            .mode-float .sf-btn-rate { margin-right: 4px; }

            .sf-input-wrap { position: relative; display: flex; align-items: center; flex-grow: 1; }
            input[type="text"] {
                width: 100%; background: rgba(255,255,255,0.1); border: 2px solid transparent;
                color: inherit; padding: 6px 40px 6px 8px; border-radius: 6px; outline: none;
                transition: border-color 0.2s; font-size: 14px;
            }
            input[type="text"]:focus { border-color: var(--sf-accent); }
            input[type="text"].warn-hidden { border-color: var(--sf-accent); border-style: dashed; }

            .sf-count { position: absolute; right: 8px; font-size: 11px; opacity: 0.7; pointer-events: none; transition: opacity 0.2s; }
            .sf-loading {
                position: absolute; right: 8px; width: 14px; height: 14px;
                border: 2px solid rgba(255,255,255,0.3); border-top-color: var(--sf-accent);
                border-radius: 50%; animation: spin 0.8s linear infinite; display: none;
            }
            @keyframes spin { to { transform: rotate(360deg); } }

            button {
                background: transparent; border: none; color: inherit; cursor: pointer;
                padding: 6px; border-radius: 4px; display: flex; align-items: center; justify-content: center;
                transition: background 0.1s; min-width: 28px; height: 28px; flex-shrink: 0;
            }
            button:hover { background: rgba(255,255,255,0.15); }
            button.active { color: var(--sf-accent); background: rgba(138, 180, 248, 0.1); }
            .sf-btn-pin.active { color: #ff5555; opacity: 1; transform: none; }
            .sf-btn-rate { 
                color: #ff6b9d; 
                font-size: 16px; 
                transition: color 0.2s, transform 0.2s;
            }
            .sf-btn-rate:hover { 
                color: #ff4757; 
                transform: scale(1.15);
                background: rgba(255, 107, 157, 0.1);
            }

            .sf-chk {
                display: inline-flex; align-items: center; gap: 4px; cursor: pointer; user-select: none;
                opacity: 0.8; font-size: 12px; margin-right: 8px;
                background: rgba(255,255,255,0.05); padding: 2px 6px; border-radius: 4px;
                white-space: nowrap;
            }
            .sf-chk:hover { opacity: 1; background: rgba(255,255,255,0.1); }
            .sf-chk input { accent-color: var(--sf-accent); margin: 0; }

            .sf-adv-panel {
                display: none; background: var(--sf-bg); border: 1px solid rgba(255,255,255,0.2);
                border-radius: 8px; padding: 12px; box-shadow: 0 8px 24px rgba(0,0,0,0.5);
                width: 340px; z-index: 2147483648; color: var(--sf-txt);
            }
            .sf-adv-panel.open { display: block; }
            .mode-float .sf-adv-panel { margin-top: 12px; width: 100%; }
            .mode-bar .sf-adv-panel { position: fixed; }

            .sf-grid { display: grid; grid-template-columns: 1fr; gap: 12px; }
            .sf-group-title {
                font-size: 11px; opacity: 0.5; text-transform: uppercase; font-weight: bold;
                margin-bottom: 6px; border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 2px;
                display:flex; justify-content: space-between; align-items: center;
            }
            .sf-adv-row { display: flex; align-items: center; justify-content: space-between; margin-bottom: 4px; flex-wrap: wrap;}
            .sf-adv-lbl { font-size: 13px; }
            .sf-hint { font-size: 10px; color: #ff9800; margin-top: 2px; line-height: 1.2; width: 100%; }

            .sf-mini-map { display: grid; grid-template-columns: 1fr 1fr; gap: 4px; width: 60px; }
            .sf-mini-btn { height: 24px; background: rgba(255,255,255,0.1); border-radius: 2px; cursor: pointer; border: 1px solid transparent; }
            .sf-mini-btn:hover { background: var(--sf-accent); }
            .sf-mini-btn.active { background: var(--sf-accent); border-color: #fff; }
            .sf-bar-btn { width: 100%; height: 20px; background: rgba(255,255,255,0.1); cursor: pointer; border-radius: 2px; margin-top: 4px; border: 1px solid transparent; text-align:center; line-height:18px; font-size:10px;}
            .sf-bar-btn:hover { background: var(--sf-accent); }
            .sf-bar-btn.active { background: var(--sf-accent); border-color: #fff; }

            .sf-toast {
                position: absolute; right: 0; top: -30px; padding: 4px 8px;
                background: var(--sf-warn); color: #fff; border-radius: 4px;
                font-size: 11px; font-weight: bold; pointer-events: none;
                opacity: 0; transition: opacity 0.2s;
            }
            .sf-toast.visible { opacity: 1; }

            .sf-lang-switch { display: flex; background: rgba(255,255,255,0.1); border-radius: 4px; padding: 2px; cursor: pointer; }
            .sf-lang-opt { padding: 2px 8px; border-radius: 2px; font-size: 11px; opacity: 0.6; transition: 0.2s; }
            .sf-lang-opt.active { background: var(--sf-accent); color: #fff; opacity: 1; font-weight: bold; }

            .sf-success-toast {
                position: absolute; top: 10px; right: 10px; z-index: 9999;
                background: #4caf50; color: white; padding: 6px 12px;
                border-radius: 4px; font-size: 12px; font-weight: 500;
                opacity: 0; transition: opacity 0.3s;
                box-shadow: 0 2px 8px rgba(76,175,80,0.4);
            }
            .sf-success-toast.show { opacity: 1; }
        `;
        shadow.appendChild(style);

        root = document.createElement('div');

        const topRow = document.createElement('div');
        topRow.className = 'sf-row-top';

        const inputWrap = document.createElement('div');
        inputWrap.className = 'sf-input-wrap';
        input = document.createElement('input');
        input.type = 'text';
        input.placeholder = t('ph');

        countDisplay = document.createElement('div');
        countDisplay.className = 'sf-count';

        loadingInd = document.createElement('div');
        loadingInd.className = 'sf-loading';

        toast = document.createElement('div');
        toast.className = 'sf-toast';
        toast.textContent = t('hiddenAlert');

        inputWrap.append(input, countDisplay, loadingInd, toast);

        const btnPrev = mkBtn('◀', t('titles.prev'), () => go(-1), 'sf-btn-prev');
        const btnNext = mkBtn('▶', t('titles.next'), () => go(1), 'sf-btn-next');
        btnAdv = mkBtn('⚙', t('titles.adv'), (e) => toggleAdv(e), 'sf-btn-adv');
        const btnPin = mkBtn('📌', t('titles.pin'), () => togglePin(), 'sf-btn-pin ' + (CONFIG.layout.persistent ? 'active' : ''));
        const btnRate = mkBtn('♥', t('titles.rate'), () => {
            // 临时跳转到 GitHub（等扩展上架 Chrome Store 后再修改为商店评价链接）
            window.open('https://github.com/rayrayray555/Super-Find-Bar-Chrome-Extension', '_blank');
            // 上架后改为：window.open('https://chrome.google.com/webstore/detail/YOUR_EXTENSION_ID/reviews', '_blank');
        }, 'sf-btn-rate');
        const btnClose = mkBtn('✕', t('titles.close'), () => toggle(false), 'sf-btn-close');

        topRow.append(inputWrap, btnPrev, btnNext, btnAdv, btnPin, btnRate, btnClose);

        const botRow = document.createElement('div');
        botRow.className = 'sf-row-bot';
        chkGroup = document.createElement('div');
        chkGroup.className = 'sf-chk-group';
        botRow.appendChild(chkGroup);

        advPanel = document.createElement('div');
        advPanel.className = 'sf-adv-panel';
        renderAdvPanel();

        root.append(topRow, botRow, advPanel);
        shadow.appendChild(root);

        renderCheckboxes(chkGroup);
        applyLayout();
        initTickBar();
        updateColorStyles();

        let deb;
        input.oninput = () => {
            state.isDirty = true;
            if (CONFIG.search.fuzzy || state.manualMode) return;
            clearTimeout(deb);
            const delay = state.nodeCount > CONFIG.search.perfThreshold ? 500 : 200;
            deb = setTimeout(triggerSearch, delay);
        };
        input.onkeydown = (e) => {
            e.stopPropagation();
            
            if (e.key === 'Enter') {
                e.preventDefault();
                triggerSearch();
                return;
            }
            
            if (e.key === 'ArrowLeft') {
                e.preventDefault();
                if (state.ranges.length > 0) go(-1);
                return;
            }
            
            if (e.key === 'ArrowRight') {
                e.preventDefault();
                if (state.ranges.length > 0) go(1);
                return;
            }
        };

        document.addEventListener('mousedown', (e) => {
            if (!state.visible) return;
            const host = document.getElementById(HOST_ID);
            if (host && !host.contains(e.target)) {
                if (advPanel.classList.contains('open')) {
                    advPanel.classList.remove('open');
                }
            }
        });
        root.addEventListener('mousedown', (e) => {
            if (advPanel.classList.contains('open')) {
                const path = e.composedPath();
                if (!path.includes(advPanel) && !path.includes(btnAdv)) {
                    advPanel.classList.remove('open');
                }
            }
        });
    }

    function renderAdvPanel() {
        advPanel.innerHTML = '';
        const grid = document.createElement('div');
        grid.className = 'sf-grid';

        // Group 1: Toolbar
        const grpTools = document.createElement('div');
        grpTools.innerHTML = `<div class="sf-group-title">${t('group.tool')}</div>`;
        const toolList = ['regex', 'includeHidden', 'fuzzy', 'matchCase', 'wholeWord', 'ignoreAccents', 'highlightAll'];
        toolList.forEach(key => {
            const row = document.createElement('div');
            row.className = 'sf-adv-row';
            const lbl = document.createElement('span');
            lbl.className = 'sf-adv-lbl';
            lbl.textContent = t(`opts.${key}`);
            const chk = document.createElement('input');
            chk.type = 'checkbox';
            chk.checked = CONFIG.search.pinned.includes(key);
            chk.onchange = (e) => {
                if (e.target.checked) {
                    if (!CONFIG.search.pinned.includes(key)) {
                        CONFIG.search.pinned.push(key);
                        // 添加到工具栏时，默认设为不勾选状态
                        CONFIG.search[key] = false;
                    }
                } else {
                    CONFIG.search.pinned = CONFIG.search.pinned.filter(k => k !== key);
                    // 从工具栏移除时，也清除勾选状态
                    CONFIG.search[key] = false;
                }
                saveSessionConfig(); // 使用会话存储，不持久化
                renderCheckboxes(chkGroup);
            };
            row.append(lbl, chk);
            grpTools.append(row);
        });

        // Group 2: Search Settings
        const grpSearch = document.createElement('div');
        grpSearch.innerHTML = `<div class="sf-group-title">${t('group.search')}</div>`;

        // 模糊搜索开关（与其他工具栏选项一致）
        const fuzzySwitchRow = document.createElement('div');
        fuzzySwitchRow.className = 'sf-adv-row';
        const fuzzyLbl = document.createElement('span');
        fuzzyLbl.className = 'sf-adv-lbl';
        fuzzyLbl.textContent = t('opts.fuzzy');
        const fuzzyChk = document.createElement('input');
        fuzzyChk.type = 'checkbox';
        fuzzyChk.checked = CONFIG.search.fuzzy;
        fuzzyChk.onchange = (e) => {
            CONFIG.search.fuzzy = e.target.checked;
            saveConfig();
            showSuccessToast(t('saved'));
        };
        fuzzySwitchRow.append(fuzzyLbl, fuzzyChk);

        // 容错字符数（紧凑布局，参考图片）
        const fuzzyToleranceRow = document.createElement('div');
        fuzzyToleranceRow.className = 'sf-adv-row';
        fuzzyToleranceRow.style.marginTop = '4px';
        fuzzyToleranceRow.style.paddingLeft = '12px';
        fuzzyToleranceRow.style.fontSize = '12px';
        const toleranceLabel = document.createElement('span');
        toleranceLabel.textContent = CONFIG.lang === 'zh' ? '容错字符数' : 'Tolerance';
        toleranceLabel.style.marginRight = 'auto';
        
        const toleranceControl = document.createElement('div');
        toleranceControl.style.display = 'flex';
        toleranceControl.style.alignItems = 'center';
        toleranceControl.style.gap = '8px';
        
        const fuzzyRange = document.createElement('input');
        fuzzyRange.type = 'range';
        fuzzyRange.min = '0';
        fuzzyRange.max = '5';
        fuzzyRange.step = '1';
        fuzzyRange.value = CONFIG.search.fuzzyTolerance;
        fuzzyRange.style.width = '80px';
        fuzzyRange.oninput = (e) => {
            CONFIG.search.fuzzyTolerance = parseInt(e.target.value);
            toleranceValue.textContent = CONFIG.search.fuzzyTolerance;
            saveConfig();
            showSuccessToast(t('saved'));
        };
        
        const toleranceValue = document.createElement('span');
        toleranceValue.textContent = CONFIG.search.fuzzyTolerance;
        toleranceValue.style.minWidth = '20px';
        toleranceValue.style.textAlign = 'center';
        
        toleranceControl.append(fuzzyRange, toleranceValue);
        fuzzyToleranceRow.append(toleranceLabel, toleranceControl);

        // Performance Threshold
        const perfRow = document.createElement('div');
        perfRow.className = 'sf-adv-row';
        perfRow.style.marginTop = '8px';
        perfRow.innerHTML = `<span class="sf-adv-lbl">${t('lbl.perf')}</span>`;

        const perfCtrl = document.createElement('div');
        perfCtrl.style.display = 'flex'; perfCtrl.style.gap = '4px'; perfCtrl.style.marginLeft = 'auto';

        const perfInp = document.createElement('input');
        perfInp.type = 'number'; perfInp.value = CONFIG.search.perfThreshold;
        perfInp.style.width = '60px'; perfInp.style.background = 'rgba(255,255,255,0.1)'; perfInp.style.border = 'none'; perfInp.style.color='inherit'; perfInp.style.borderRadius='4px'; perfInp.style.padding='2px';
        perfInp.onchange = (e) => {
            let v = parseInt(e.target.value);
            if(isNaN(v) || v < 0) v = 3000;
            CONFIG.search.perfThreshold = v;
            saveConfig();
            showSuccessToast(t('saved'));
        };

        // 性能阈值重置按钮（环形箭头）
        const btnResetPerf = document.createElement('button');
        btnResetPerf.innerHTML = '↺';
        btnResetPerf.title = CONFIG.lang === 'zh' ? '重置为默认' : 'Reset to Default';
        btnResetPerf.style.cssText = 'width:28px;height:28px;padding:0;font-size:16px;border-radius:50%;border:1px solid rgba(255,255,255,0.3);background:rgba(255,255,255,0.1);cursor:pointer;display:flex;align-items:center;justify-content:center;';
        btnResetPerf.onmouseover = () => btnResetPerf.style.background = 'rgba(255,255,255,0.2)';
        btnResetPerf.onmouseout = () => btnResetPerf.style.background = 'rgba(255,255,255,0.1)';
        btnResetPerf.onclick = () => {
            CONFIG.search.perfThreshold = DEFAULT_CONFIG.search.perfThreshold;
            perfInp.value = CONFIG.search.perfThreshold;
            saveConfig();
            showSuccessToast(t('saved'));
        };

        perfCtrl.append(perfInp, btnResetPerf);
        perfRow.append(perfCtrl);

        // 多词颜色方案设置（8列：7色块 + 重置按钮）
        const colorSchemeRow = document.createElement('div');
        colorSchemeRow.style.marginTop = '12px';
        const colorTitle = document.createElement('div');
        colorTitle.className = 'sf-adv-lbl';
        colorTitle.textContent = CONFIG.lang === 'zh' ? '多词颜色方案 (最多7词)' : 'Multi-term Colors (Max 7)';
        colorTitle.style.marginBottom = '8px';
        colorSchemeRow.appendChild(colorTitle);

        const colorGrid = document.createElement('div');
        colorGrid.style.display = 'grid';
        colorGrid.style.gridTemplateColumns = 'repeat(8, 1fr)';
        colorGrid.style.gap = '6px';
        colorGrid.style.marginBottom = '8px';
        colorGrid.style.alignItems = 'center';

        CONFIG.colors.forEach((color, idx) => {
            const colorWrap = document.createElement('div');
            colorWrap.style.display = 'flex';
            colorWrap.style.flexDirection = 'column';
            colorWrap.style.alignItems = 'center';
            
            // 圆形颜色选择器（与 options.html 一致）
            const colorCircle = document.createElement('div');
            colorCircle.style.cssText = 'width:28px;height:28px;border-radius:50%;border:2px solid rgba(255,255,255,0.25);overflow:hidden;cursor:pointer;position:relative;transition:transform 0.2s;';
            colorCircle.onmouseover = () => {
                colorCircle.style.transform = 'scale(1.1)';
                colorCircle.style.borderColor = 'rgba(255,255,255,0.4)';
            };
            colorCircle.onmouseout = () => {
                colorCircle.style.transform = 'scale(1)';
                colorCircle.style.borderColor = 'rgba(255,255,255,0.25)';
            };
            
            const colorInp = document.createElement('input');
            colorInp.type = 'color';
            colorInp.value = color;
            colorInp.style.cssText = 'position:absolute;top:-50%;left:-50%;width:200%;height:200%;border:none;padding:0;margin:0;cursor:pointer;';
            colorInp.onchange = (e) => {
                CONFIG.colors[idx] = e.target.value;
                saveConfig();
                updateColorStyles();
                showSuccessToast(t('saved'));
            };
            
            colorCircle.appendChild(colorInp);
            
            const colorLabel = document.createElement('div');
            colorLabel.textContent = idx + 1;
            colorLabel.style.fontSize = '9px';
            colorLabel.style.marginTop = '2px';
            colorLabel.style.opacity = '0.7';
            
            colorWrap.append(colorCircle, colorLabel);
            colorGrid.appendChild(colorWrap);
        });

        const resetWrap = document.createElement('div');
        resetWrap.style.display = 'flex';
        resetWrap.style.flexDirection = 'column';
        resetWrap.style.alignItems = 'center';
        resetWrap.style.justifyContent = 'center';
        
        // 颜色重置按钮（环形箭头，统一样式）
        const btnResetColors = document.createElement('button');
        btnResetColors.innerHTML = '↺';
        btnResetColors.title = CONFIG.lang === 'zh' ? '重置为默认' : 'Reset Colors';
        btnResetColors.style.cssText = 'width:36px;height:36px;padding:0;font-size:18px;border-radius:50%;border:2px solid rgba(255,255,255,0.25);background:rgba(255,255,255,0.1);cursor:pointer;display:flex;align-items:center;justify-content:center;transition:transform 0.2s;';
        btnResetColors.onmouseover = () => {
            btnResetColors.style.transform = 'scale(1.1)';
            btnResetColors.style.borderColor = 'rgba(255,255,255,0.4)';
        };
        btnResetColors.onmouseout = () => {
            btnResetColors.style.transform = 'scale(1)';
            btnResetColors.style.borderColor = 'rgba(255,255,255,0.25)';
        };
        btnResetColors.onclick = () => {
            CONFIG.colors = [...DEFAULT_CONFIG.colors];
            saveConfig();
            updateColorStyles();
            renderAdvPanel();
            showSuccessToast(t('saved'));
        };
        
        const resetLabel = document.createElement('div');
        resetLabel.textContent = CONFIG.lang === 'zh' ? '重置' : 'Reset';
        resetLabel.style.fontSize = '9px';
        resetLabel.style.marginTop = '2px';
        resetLabel.style.opacity = '0.6';
        
        resetWrap.append(btnResetColors, resetLabel);
        colorGrid.appendChild(resetWrap);

        colorSchemeRow.append(colorGrid);

        grpSearch.append(fuzzySwitchRow, fuzzyToleranceRow, perfRow, colorSchemeRow);

        // Group 3: Layout
        const grpLayout = document.createElement('div');
        grpLayout.innerHTML = `<div class="sf-group-title">${t('group.layout')}</div>`;

        // 放大镜按钮开关
        const launchBtnRow = document.createElement('div');
        launchBtnRow.className = 'sf-adv-row';
        const launchBtnLbl = document.createElement('span');
        launchBtnLbl.className = 'sf-adv-lbl';
        launchBtnLbl.textContent = CONFIG.lang === 'zh' ? '显示右下角放大镜' : 'Show Launch Button';
        const launchBtnChk = document.createElement('input');
        launchBtnChk.type = 'checkbox';
        launchBtnChk.checked = CONFIG.layout.showLaunchBtn;
        launchBtnChk.onchange = (e) => {
            CONFIG.layout.showLaunchBtn = e.target.checked;
            saveConfig();
            initLaunchBtn();
            showSuccessToast(t('saved'));
        };
        launchBtnRow.append(launchBtnLbl, launchBtnChk);

        // Lang Switch
        const langRow = document.createElement('div');
        langRow.className = 'sf-adv-row';
        langRow.innerHTML = `<span class="sf-adv-lbl">${t('lbl.lang')}</span>`;
        const langSwitch = document.createElement('div');
        langSwitch.className = 'sf-lang-switch';

        const optZh = document.createElement('div'); optZh.className = `sf-lang-opt ${CONFIG.lang === 'zh' ? 'active' : ''}`;
        optZh.textContent = '中文';
        optZh.onclick = () => switchLang('zh');

        const optEn = document.createElement('div'); optEn.className = `sf-lang-opt ${CONFIG.lang === 'en' ? 'active' : ''}`;
        optEn.textContent = 'EN';
        optEn.onclick = () => switchLang('en');

        langSwitch.append(optZh, optEn);
        langRow.appendChild(langSwitch);

        // 窗口位置控制布局
        const layoutRow = document.createElement('div');
        layoutRow.style.display = 'flex';
        layoutRow.style.alignItems = 'center';
        layoutRow.style.justifyContent = 'space-between';
        layoutRow.style.gap = '12px';
        layoutRow.style.marginTop = '8px';

        const layoutLabel = document.createElement('div');
        layoutLabel.style.fontSize = '13px';
        layoutLabel.style.whiteSpace = 'nowrap';
        layoutLabel.textContent = CONFIG.lang === 'zh' ? '窗口位置' : 'Position';

        const positionGrid = document.createElement('div');
        positionGrid.style.display = 'grid';
        positionGrid.style.gridTemplateColumns = 'repeat(3, 28px)';
        positionGrid.style.gridTemplateRows = 'repeat(2, 24px)';
        positionGrid.style.gap = '4px';

        const btnTL = document.createElement('div');
        btnTL.className = `sf-mini-btn ${CONFIG.layout.position === 'top-left' ? 'active' : ''}`;
        btnTL.title = CONFIG.lang === 'zh' ? '左上角' : 'Top Left';
        btnTL.onclick = () => setPos('top-left', 'float');

        const btnTR = document.createElement('div');
        btnTR.className = `sf-mini-btn ${CONFIG.layout.position === 'top-right' ? 'active' : ''}`;
        btnTR.title = CONFIG.lang === 'zh' ? '右上角' : 'Top Right';
        btnTR.onclick = () => setPos('top-right', 'float');

        const btnTop = document.createElement('div');
        btnTop.className = `sf-bar-btn ${CONFIG.layout.position === 'top' ? 'active' : ''}`;
        btnTop.textContent = 'TOP';
        btnTop.title = CONFIG.lang === 'zh' ? '顶部横条' : 'Top Bar';
        btnTop.style.fontSize = '9px';
        btnTop.onclick = () => setPos('top', 'bar');

        const btnBL = document.createElement('div');
        btnBL.className = `sf-mini-btn ${CONFIG.layout.position === 'bottom-left' ? 'active' : ''}`;
        btnBL.title = CONFIG.lang === 'zh' ? '左下角' : 'Bottom Left';
        btnBL.onclick = () => setPos('bottom-left', 'float');

        const btnBR = document.createElement('div');
        btnBR.className = `sf-mini-btn ${CONFIG.layout.position === 'bottom-right' ? 'active' : ''}`;
        btnBR.title = CONFIG.lang === 'zh' ? '右下角' : 'Bottom Right';
        btnBR.onclick = () => setPos('bottom-right', 'float');

        const btnBot = document.createElement('div');
        btnBot.className = `sf-bar-btn ${CONFIG.layout.position === 'bottom' ? 'active' : ''}`;
        btnBot.textContent = 'BOT';
        btnBot.title = CONFIG.lang === 'zh' ? '底部横条' : 'Bottom Bar';
        btnBot.style.fontSize = '9px';
        btnBot.onclick = () => setPos('bottom', 'bar');

        positionGrid.append(btnTL, btnTR, btnTop, btnBL, btnBR, btnBot);
        layoutRow.append(layoutLabel, positionGrid);

        const colorRow = document.createElement('div');
        colorRow.style.marginTop = '8px'; colorRow.style.display='flex'; colorRow.style.alignItems='center'; colorRow.style.justifyContent='space-between';

        const c1 = document.createElement('div'); c1.style.display='flex'; c1.style.alignItems='center'; c1.style.gap='4px';
        const bgInp = document.createElement('input'); bgInp.type='color'; bgInp.value = CONFIG.theme.bg;
        bgInp.style.cssText = "width:20px;height:20px;border:none;padding:0;cursor:pointer;border-radius:4px";
        bgInp.onchange = e => { CONFIG.theme.bg = e.target.value; applyTheme(); saveConfig(); };
        c1.append(document.createTextNode(t('lbl.bg')), bgInp);

        const c2 = document.createElement('div'); c2.style.display='flex'; c2.style.alignItems='center'; c2.style.gap='4px';
        const txtInp = document.createElement('input'); txtInp.type='color'; txtInp.value = CONFIG.theme.text;
        txtInp.style.cssText = "width:20px;height:20px;border:none;padding:0;cursor:pointer;border-radius:4px";
        txtInp.onchange = e => { CONFIG.theme.text = e.target.value; applyTheme(); saveConfig(); };
        c2.append(document.createTextNode(t('lbl.txt')), txtInp);

        colorRow.append(c1, c2);

        const opRow = document.createElement('div');
        opRow.className = 'sf-adv-row'; opRow.style.marginTop = '4px';
        opRow.innerHTML = `<span class="sf-adv-lbl">${t('lbl.op')}</span>`;

        const opVal = document.createElement('span');
        opVal.style.fontSize = '12px'; opVal.style.marginLeft='auto'; opVal.style.marginRight='8px';
        opVal.textContent = Math.round(CONFIG.theme.opacity * 100) + '%';

        const opInp = document.createElement('input'); opInp.type='range'; opInp.min='0.5'; opInp.max='1'; opInp.step='0.05';
        opInp.value = CONFIG.theme.opacity; opInp.style.width='80px';
        opInp.oninput = e => {
            CONFIG.theme.opacity = e.target.value;
            opVal.textContent = Math.round(e.target.value * 100) + '%';
            applyTheme(); saveConfig();
        };

        opRow.append(opVal, opInp);

        // 坐标轴标记配置
        const coordRow = document.createElement('div');
        coordRow.style.marginTop = '12px';
        const coordTitle = document.createElement('div');
        coordTitle.className = 'sf-adv-lbl';
        coordTitle.textContent = CONFIG.lang === 'zh' ? '搜索结果坐标标记' : 'Search Result Markers';
        coordTitle.style.marginBottom = '8px';
        coordRow.appendChild(coordTitle);
        
        const coordGrid = document.createElement('div');
        coordGrid.style.display = 'grid';
        coordGrid.style.gridTemplateColumns = '1fr 1fr';
        coordGrid.style.gap = '8px';
        
        // X 轴开关
        const xAxisRow = document.createElement('div');
        xAxisRow.className = 'sf-adv-row';
        const xAxisLbl = document.createElement('span');
        xAxisLbl.className = 'sf-adv-lbl';
        xAxisLbl.style.fontSize = '12px';
        xAxisLbl.textContent = CONFIG.lang === 'zh' ? 'X 轴（横向）' : 'X-Axis';
        const xAxisChk = document.createElement('input');
        xAxisChk.type = 'checkbox';
        xAxisChk.checked = CONFIG.coordinates.showXAxis;
        xAxisChk.onchange = (e) => {
            CONFIG.coordinates.showXAxis = e.target.checked;
            saveSessionConfig(); // 使用会话存储，不持久化
            updateTickBarPositions();
            drawTickBar();
            showSuccessToast(t('saved'));
        };
        xAxisRow.append(xAxisChk, xAxisLbl);
        
        // Y 轴开关
        const yAxisRow = document.createElement('div');
        yAxisRow.className = 'sf-adv-row';
        const yAxisLbl = document.createElement('span');
        yAxisLbl.className = 'sf-adv-lbl';
        yAxisLbl.style.fontSize = '12px';
        yAxisLbl.textContent = CONFIG.lang === 'zh' ? 'Y 轴（纵向）' : 'Y-Axis';
        const yAxisChk = document.createElement('input');
        yAxisChk.type = 'checkbox';
        yAxisChk.checked = CONFIG.coordinates.showYAxis;
        yAxisChk.onchange = (e) => {
            CONFIG.coordinates.showYAxis = e.target.checked;
            saveSessionConfig(); // 使用会话存储，不持久化
            updateTickBarPositions();
            drawTickBar();
            showSuccessToast(t('saved'));
        };
        yAxisRow.append(yAxisChk, yAxisLbl);
        
        coordGrid.append(xAxisRow, yAxisRow);
        
        // 多容器警告
        const coordHint = document.createElement('div');
        coordHint.className = 'sf-hint';
        coordHint.textContent = CONFIG.lang === 'zh' ? 
            '⚠️ 注意：在多列布局或多容器页面（如 ChatGPT）中，标记位置可能不完全准确。' :
            '⚠️ Note: Markers may be inaccurate on multi-column or multi-container pages (e.g., ChatGPT).';
        coordRow.append(coordGrid, coordHint);

        grpLayout.append(launchBtnRow, langRow, layoutRow, colorRow, opRow, coordRow);

        grid.append(grpTools, grpSearch, grpLayout);
        advPanel.append(grid);
    }

    function switchLang(l) {
        CONFIG.lang = l;
        saveConfig();
        renderAdvPanel();
        renderCheckboxes(chkGroup);
        updatePlaceholder();
        shadow.querySelector('.sf-btn-prev').title = t('titles.prev');
        shadow.querySelector('.sf-btn-next').title = t('titles.next');
        shadow.querySelector('.sf-btn-close').title = t('titles.close');
        shadow.querySelector('.sf-btn-pin').title = t('titles.pin');
        shadow.querySelector('.sf-btn-rate').title = t('titles.rate');
        shadow.querySelector('.sf-btn-adv').title = t('titles.adv');
        toast.textContent = t('hiddenAlert');
    }

    function renderCheckboxes(container) {
        container.innerHTML = '';
        const order = ['matchCase', 'wholeWord', 'ignoreAccents', 'highlightAll', 'regex', 'includeHidden', 'fuzzy'];
        order.forEach(key => {
            if (CONFIG.search.pinned.includes(key)) {
                const chk = mkChk(key, t(`opts.${key}`));
                container.appendChild(chk);
            }
        });
    }

    function initTickBar() {
        // Y 轴标记（纵向，左侧或右侧）
        tickBarY = document.createElement('div');
        tickBarY.id = 'sf-tick-y';
        Object.assign(tickBarY.style, {
            position: 'fixed',
            top: '0',
            width: '20px',
            height: '100%',
            zIndex: 2147483646,
            pointerEvents: 'none',
            display: 'none'
        });
        
        // X 轴标记（横向，顶部或底部）
        tickBarX = document.createElement('div');
        tickBarX.id = 'sf-tick-x';
        Object.assign(tickBarX.style, {
            position: 'fixed',
            left: '0',
            width: '100%',
            height: '20px',
            zIndex: 2147483646,
            pointerEvents: 'none',
            display: 'none'
        });
        
        updateTickBarPositions();
        document.body.appendChild(tickBarY);
        document.body.appendChild(tickBarX);
    }
    
    // 根据配置更新坐标轴位置
    function updateTickBarPositions() {
        if (tickBarY) {
            tickBarY.style[CONFIG.coordinates.yPosition] = '0';
            tickBarY.style[CONFIG.coordinates.yPosition === 'left' ? 'right' : 'left'] = 'auto';
        }
        if (tickBarX) {
            // X轴位置自适应：栏模式下X轴位置与搜索栏相反，避免遮挡
            let xPosition = CONFIG.coordinates.xPosition;
            if (CONFIG.layout.mode === 'bar') {
                xPosition = CONFIG.layout.position === 'bottom' ? 'top' : 'bottom';
            }
            
            tickBarX.style[xPosition] = '0';
            tickBarX.style[xPosition === 'top' ? 'bottom' : 'top'] = 'auto';
        }
    }

    function updatePlaceholder() {
        if (!input) return;
        if (CONFIG.search.fuzzy) {
            input.placeholder = t('phFuzzy');
        } else if (state.manualMode) {
            input.placeholder = t('phManual');
        } else {
            input.placeholder = t('ph');
        }
    }

    function mkBtn(html, title, cb, cls) {
        const b = document.createElement('button');
        b.innerHTML = html; b.title = title; b.onclick = cb;
        if(cls) b.className = cls; return b;
    }
    function mkChk(key, label) {
        const l = document.createElement('label'); l.className = 'sf-chk';
        // 只有 pinned 数组中的选项才能被勾选，且读取当前勾选状态
        const c = document.createElement('input'); 
        c.type='checkbox'; 
        c.checked = CONFIG.search.pinned.includes(key) ? CONFIG.search[key] : false;
        c.disabled = !CONFIG.search.pinned.includes(key); // 不在工具栏中的选项禁用
        c.onchange = () => {
            // 只有 pinned 中的选项才能修改勾选状态
            if (CONFIG.search.pinned.includes(key)) {
                CONFIG.search[key] = c.checked;
                saveConfig();
                updatePlaceholder();
                if (!CONFIG.search.fuzzy && !state.manualMode && state.isDirty) triggerSearch();
            }
        };
        l.append(c, document.createTextNode(label)); return l;
    }
    function togglePin() {
        CONFIG.layout.persistent = !CONFIG.layout.persistent; saveConfig();
        shadow.querySelector('.sf-btn-pin').classList.toggle('active', CONFIG.layout.persistent);
    }
    function toggleAdv(e) {
        if (advPanel.classList.contains('open')) {
            advPanel.classList.remove('open');
        } else {
            advPanel.classList.add('open');
            if (CONFIG.layout.mode === 'bar') {
                const btnRect = e.currentTarget.getBoundingClientRect();
                let top = btnRect.bottom + 6;
                let right = window.innerWidth - btnRect.right;
                if (right < 10) right = 10;
                advPanel.style.position = 'fixed';
                advPanel.style.top = (CONFIG.layout.position === 'top' ? top : 'auto') + 'px';
                advPanel.style.bottom = (CONFIG.layout.position === 'bottom' ? (window.innerHeight - btnRect.top + 6) : 'auto') + 'px';
                advPanel.style.right = right + 'px'; advPanel.style.left = 'auto';
            } else {
                advPanel.style.cssText = '';
            }
        }
    }
    function setPos(pos, mode) {
        CONFIG.layout.position = pos; CONFIG.layout.mode = mode; saveConfig(); applyLayout();
        advPanel.classList.remove('open');
        renderAdvPanel();
        showSuccessToast(t('saved'));
    }
    function applyLayout() {
        root.className = 'sf-box';
        root.classList.add(`mode-${CONFIG.layout.mode}`);
        root.classList.add(`sf-pos-${CONFIG.layout.position}`);
        if(state.visible) root.classList.add('show');
        applyTheme();
        
        // 布局切换后强制重绘坐标轴（修复X轴自适应问题）
        if (state.ranges && state.ranges.length > 0) {
            updateTickBarPositions();
            requestAnimationFrame(() => {
                drawTickBarImmediate();
            });
        }
    }
    function applyTheme() {
        root.style.setProperty('--sf-bg', CONFIG.theme.bg);
        root.style.setProperty('--sf-txt', CONFIG.theme.text);
        root.style.opacity = CONFIG.theme.opacity;
    }

    function updateColorStyles() {
        const oldStyle = document.getElementById('sf-color-styles');
        if (oldStyle) oldStyle.remove();
        
        const style = document.createElement('style');
        style.id = 'sf-color-styles';
        style.textContent = CONFIG.colors.map((color, idx) => `
            ::highlight(sf-term-${idx}) {
                background-color: ${color};
                color: #000000;
                border-radius: 2px;
            }
        `).join('\n');
        document.head.appendChild(style);
    }

    function showSuccessToast(message) {
        const oldToast = advPanel.querySelector('.sf-success-toast');
        if (oldToast) oldToast.remove();
        
        const successToast = document.createElement('div');
        successToast.className = 'sf-success-toast';
        successToast.textContent = message;
        advPanel.appendChild(successToast);
        
        setTimeout(() => successToast.classList.add('show'), 10);
        setTimeout(() => {
            successToast.classList.remove('show');
            setTimeout(() => successToast.remove(), 300);
        }, 1500);
    }

    /********************
      4. 搜索逻辑 (Search Logic)
    ********************/

    function checkPageSize() {
        const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, null, false);
        let count = 0;
        while(walker.nextNode()) count++;
        state.nodeCount = count;
        state.manualMode = count > CONFIG.search.perfThreshold;
        if(state.manualMode && !state.hasWarned) {
             toast.textContent = `Page huge (${count} nodes). Manual mode on.`;
             toast.classList.add('visible');
             setTimeout(() => toast.classList.remove('visible'), 3000);
             state.hasWarned = true;
        }
        updatePlaceholder();
    }

    async function triggerSearch() {
        if (state.abortController) {
            state.abortController.abort = true;
        }

        if (state.supportsHighlight && CSS.highlights) {
            CSS.highlights.clear();
        } else {
            const oldMarks = document.querySelectorAll('sf-mark');
            if (oldMarks.length > 0) {
                oldMarks.forEach(m => {
                    const p = m.parentNode;
                    if(p) {
                        p.replaceChild(document.createTextNode(m.textContent), m);
                        p.normalize();
                    }
                });
            }
        }

        state.isDirty = false;
        state.searchId++;
        const currentId = state.searchId;

        state.abortController = { abort: false };
        const abortSignal = state.abortController;

        const val = input.value;
        // 创建搜索配置，但只使用 pinned 数组中的选项
        const cfg = JSON.parse(JSON.stringify(CONFIG.search));
        
        // 关键逻辑：只有 pinned 数组中的选项才参与搜索筛选
        // 如果选项不在 pinned 中，强制设为 false（不参与搜索）
        const searchOptions = ['matchCase', 'wholeWord', 'highlightAll', 'ignoreAccents', 'regex', 'includeHidden', 'fuzzy'];
        searchOptions.forEach(opt => {
            if (!CONFIG.search.pinned.includes(opt)) {
                cfg[opt] = false; // 不在工具栏中的选项不参与搜索
            }
        });

        state.ranges = [];
        state.idx = -1;
        if (tickBarX) tickBarX.innerHTML = '';
        if (tickBarY) tickBarY.innerHTML = '';
        toast.classList.remove('visible');
        input.classList.remove('warn-hidden');
        countDisplay.textContent = '';

        if (!val.trim()) {
            loadingInd.style.display = 'none';
            countDisplay.style.opacity = '1';
            state.abortController = null;
            return;
        }

        loadingInd.style.display = 'block';
        countDisplay.style.opacity = '0';

        await new Promise(r => setTimeout(r, 0));
        if (abortSignal.abort) return;

        const effectiveWholeWord = cfg.wholeWord && !isCJK(val);
        let terms = [];
        if (cfg.regex) terms = [{ text: val, isRegex: true }];
        else terms = val.split(/,|，/).map(t => t.trim()).filter(Boolean).map(t => ({ text: t, isRegex: false }));

        if (terms.length === 0) {
            loadingInd.style.display = 'none';
            countDisplay.style.opacity = '1';
            state.abortController = null;
            return;
        }

        const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, {
            acceptNode: n => {
                const p = n.parentNode;

                if(['SCRIPT','STYLE','TEXTAREA','NOSCRIPT','INPUT','SELECT'].includes(p.tagName))
                    return NodeFilter.FILTER_REJECT;

                if(shadow && shadow.host && shadow.host.contains(p))
                    return NodeFilter.FILTER_REJECT;

                if(!cfg.includeHidden && !isVisible(p))
                    return NodeFilter.FILTER_REJECT;

                return NodeFilter.FILTER_ACCEPT;
            }
        });
        const nodes = [];
        while(walker.nextNode()) nodes.push(walker.currentNode);

        const allRanges = [];
        const MAX_HIGHLIGHTS = 1000;
        const BATCH_SIZE = 200;
        let lastYield = performance.now();
        let skippedDueToLimit = false;

        for (let i = 0; i < nodes.length; i++) {
            if (abortSignal.abort || state.searchId !== currentId) {
                for (let j = i; j < nodes.length; j++) {
                    nodes[j] = null;
                }
                state.abortController = null;
                return;
            }

            if (allRanges.length >= MAX_HIGHLIGHTS) {
                skippedDueToLimit = true;
                break;
            }

            if (i % BATCH_SIZE === 0 && i > 0) {
                const now = performance.now();
                if (now - lastYield > 32) {
                    await new Promise(r => setTimeout(r, 0));
                    lastYield = performance.now();

                    for (let j = Math.max(0, i - BATCH_SIZE); j < i; j++) {
                        nodes[j] = null;
                    }
                }
            }

            const node = nodes[i];
            if (!node || !node.parentNode) continue;

            const originalText = node.textContent;
            const textForSearch = cfg.ignoreAccents ? originalText.normalize("NFD").replace(/[\u0300-\u036f]/g, "") : originalText;
            let ranges = [];

            terms.forEach((termObj, termIdx) => {
                const termColor = CONFIG.colors[termIdx % CONFIG.colors.length];

                if (termObj.isRegex) {
                    try {
                        const re = new RegExp(termObj.text, cfg.matchCase ? 'g' : 'gi');
                        let m;
                        while ((m = re.exec(textForSearch)) !== null) ranges.push({ s: m.index, e: re.lastIndex, c: termColor });
                    } catch(e) {}
                } else if (cfg.fuzzy) {
                    const k = cfg.fuzzyTolerance;
                    const termLen = termObj.text.length;
                    const textLen = textForSearch.length;
                    const term = cfg.matchCase ? termObj.text : termObj.text.toLowerCase();
                    const text = cfg.matchCase ? textForSearch : textForSearch.toLowerCase();
                    const minL = Math.max(1, termLen - k);
                    const maxL = Math.min(textLen, termLen + k);

                    for (let pos = 0; pos < textLen; pos++) {
                        if (pos + minL > textLen) break;
                        let bestDist = k + 1;
                        let bestLen = -1;
                        for (let len = minL; len <= maxL; len++) {
                            if (pos + len > textLen) break;
                            const sub = text.substr(pos, len);
                            const dist = levenshtein(sub, term);
                            if (dist <= k) {
                                if (dist < bestDist) {
                                    bestDist = dist;
                                    bestLen = len;
                                } else if (dist === bestDist) {
                                    if (Math.abs(len - termLen) < Math.abs(bestLen - termLen)) bestLen = len;
                                }
                            }
                        }
                        if (bestLen !== -1) {
                            ranges.push({ s: pos, e: pos + bestLen, c: termColor });
                            pos += bestLen - 1;
                        }
                    }
                } else {
                    const esc = s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                    const pattern = effectiveWholeWord ? `\\b${esc(termObj.text)}\\b` : esc(termObj.text);
                    const re = new RegExp(pattern, cfg.matchCase ? 'g' : 'gi');
                    let m;
                    while ((m = re.exec(textForSearch)) !== null) ranges.push({ s: m.index, e: re.lastIndex, c: termColor });
                }
            });

            ranges.forEach(r => {
                try {
                    const range = document.createRange();
                    range.setStart(node, r.s);
                    range.setEnd(node, r.e);
                    allRanges.push({
                        range: range,
                        color: r.c,
                        node: node
                    });
                } catch(e) {}
            });

            nodes[i] = null;
        }

        if (abortSignal.abort || state.searchId !== currentId) {
            state.abortController = null;
            return;
        }

        state.ranges = allRanges;
        state.abortController = null;

        loadingInd.style.display = 'none';
        countDisplay.style.opacity = '1';

        if (skippedDueToLimit) {
            toast.textContent = `${CONFIG.lang === 'zh' ? '结果过多，仅显示前' : 'Too many, showing first'} ${MAX_HIGHLIGHTS}`;
            toast.classList.add('visible');
            setTimeout(() => toast.classList.remove('visible'), 3000);
        }

        if (!state.supportsHighlight) {
            toast.textContent = CONFIG.lang === 'zh' ? '浏览器不支持，请升级 Chrome 105+' : 'Unsupported browser, upgrade to Chrome 105+';
            toast.classList.add('visible');
            setTimeout(() => toast.classList.remove('visible'), 5000);
        }

        updateUI();
        if (allRanges.length > 0) {
            go(1);
        } else {
            drawTickBar();
        }
    }

    function highlightAll() {
        if (!state.supportsHighlight || !CSS.highlights) {
            drawTickBar();
            return;
        }

        const show = CONFIG.search.highlightAll;

        // 立即清除旧高亮，避免闪烁
        CSS.highlights.clear();

        if (state.ranges.length === 0) {
            drawTickBar();
            return;
        }

        // 设置所有词的高亮
        if (show) {
            const colorGroups = {};
            state.ranges.forEach(rangeData => {
                const color = rangeData.color;
                if (!colorGroups[color]) {
                    colorGroups[color] = [];
                }
                colorGroups[color].push(rangeData.range);
            });

            Object.keys(colorGroups).forEach(color => {
                const colorIdx = CONFIG.colors.indexOf(color);
                if (colorIdx !== -1) {
                    const highlight = new Highlight(...colorGroups[color]);
                    CSS.highlights.set(`sf-term-${colorIdx}`, highlight);
                }
            });
        }

        // 设置当前激活的高亮并滚动
        if (state.idx > -1 && state.ranges[state.idx]) {
            const activeRange = state.ranges[state.idx].range;
            const activeHighlight = new Highlight(activeRange);
            CSS.highlights.set('sf-search-active', activeHighlight);

            // 使用双重 RAF 确保高亮已渲染完成
            // RAF #1: 进入浏览器的渲染队列
            requestAnimationFrame(() => {
                // RAF #2: 确保布局和绘制已完成
                requestAnimationFrame(() => {
                    // 此时高亮已经渲染，立即滚动到位置
                    scrollToRangeImmediate(activeRange);
                    
                    // RAF #3: 延迟绘制坐标轴，避免阻塞高亮和滚动
                    requestAnimationFrame(() => {
                        drawTickBar();
                    });
                });
            });
        } else {
            // 没有激活结果，直接绘制坐标轴
            drawTickBar();
        }
    }
    
    // 立即滚动到指定 Range（不使用 smooth 动画）
    function scrollToRangeImmediate(range) {
        try {
            const rect = range.getBoundingClientRect();
            
            // 根据配置决定滚动行为
            if (!CONFIG.scroll.alwaysCenter) {
                // 仅当结果不在可视区域时才滚动
                const isOutOfView = rect.top < 0 || rect.bottom > window.innerHeight;
                if (!isOutOfView) return;
            }
            // alwaysCenter=true: 始终滚动到屏幕中间，避免被浮动元素遮挡
            
            let targetElement = range.startContainer;
            while (targetElement && targetElement.nodeType === Node.TEXT_NODE) {
                targetElement = targetElement.parentElement;
            }
            
            if (!targetElement) return;
            
            const scrollContainer = findScrollContainer(targetElement);
            
            if (scrollContainer) {
                // 在自定义滚动容器中滚动（如 ChatGPT 的 main 元素）
                const containerRect = scrollContainer.getBoundingClientRect();
                const relativeTop = rect.top - containerRect.top;
                const targetScrollTop = scrollContainer.scrollTop + relativeTop - scrollContainer.clientHeight / 2;
                
                scrollContainer.scrollTo({
                    top: Math.max(0, targetScrollTop),
                    behavior: 'auto'  // 使用 instant 滚动，避免动画延迟
                });
            } else {
                // 在主窗口中滚动
                const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
                const absoluteTop = scrollTop + rect.top;
                const targetY = absoluteTop - window.innerHeight / 2;
                
                window.scrollTo({
                    top: Math.max(0, targetY),
                    behavior: 'auto'  // 使用 instant 滚动，避免动画延迟
                });
            }
        } catch(e) {
            // Range 无效，忽略错误
        }
    }

    // 性能优化：防抖 drawTickBar 调用
    let drawTickBarTimer = null;
    function drawTickBar() {
        // 防抖：避免频繁调用
        if (drawTickBarTimer) {
            cancelAnimationFrame(drawTickBarTimer);
        }
        
        drawTickBarTimer = requestAnimationFrame(() => {
            drawTickBarImmediate();
            drawTickBarTimer = null;
        });
    }
    
    function drawTickBarImmediate() {
        // 清空坐标轴
        if (tickBarX) tickBarX.innerHTML = '';
        if (tickBarY) tickBarY.innerHTML = '';
        
        if(!state.ranges.length) {
            if (tickBarX) tickBarX.style.display='none';
            if (tickBarY) tickBarY.style.display='none';
            return;
        }
        
        // 显示已启用的坐标轴
        if (CONFIG.coordinates.showXAxis && tickBarX) tickBarX.style.display='block';
        if (CONFIG.coordinates.showYAxis && tickBarY) tickBarY.style.display='block';
        
        // 性能优化：限制标记数量，避免渲染过多 DOM 导致卡顿
        const MAX_MARKERS = 150;
        const rangesToRender = state.ranges.length > MAX_MARKERS ? 
            sampleRanges(state.ranges, MAX_MARKERS) : 
            state.ranges;
        
        // 计算页面尺寸（以左下角为原点）
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        const scrollHeight = document.documentElement.scrollHeight;
        const scrollWidth = document.documentElement.scrollWidth;

        // 使用 DocumentFragment 批量添加，避免逐个 appendChild 导致的重排
        const fragmentX = document.createDocumentFragment();
        const fragmentY = document.createDocumentFragment();

        rangesToRender.forEach((rangeData, i) => {
            try {
                const rect = rangeData.range.getBoundingClientRect();
                const absoluteTop = scrollTop + rect.top;
                const absoluteLeft = window.pageXOffset + rect.left;
                
                // Y 轴百分比（从上到下，0-100%）
                const yPercent = Math.max(0, Math.min(100, (absoluteTop / scrollHeight) * 100));
                
                // X 轴百分比（从左到右，0-100%）
                const xPercent = Math.max(0, Math.min(100, (absoluteLeft / scrollWidth) * 100));
                
                // 判断是否为当前激活的结果
                const isActive = rangeData === state.ranges[state.idx];
                
                // 绘制 Y 轴标记（纵向）
                if (CONFIG.coordinates.showYAxis && tickBarY) {
                    const markY = document.createElement('div');
                    const yPos = CONFIG.coordinates.yPosition === 'right' ? 'right' : 'left';
                    const offset = CONFIG.coordinates.yPosition === 'right' ? 
                        (isActive ? '3px' : '6px') : 
                        (isActive ? '3px' : '6px');
                    
                    if (isActive) {
                        markY.style.cssText = `
                            position: absolute;
                            ${yPos}: ${offset};
                            top: ${yPercent}%;
                            width: 14px;
                            height: 14px;
                            background: #ff5722;
                            border: 2px solid #ffffff;
                            border-radius: 50%;
                            transform: translateY(-50%);
                            z-index: 999;
                            box-shadow: 0 0 6px rgba(255,87,34,0.8), 0 0 12px rgba(255,87,34,0.4);
                        `;
                    } else {
                        markY.style.cssText = `
                            position: absolute;
                            ${yPos}: ${offset};
                            top: ${yPercent}%;
                            width: 8px;
                            height: 8px;
                            background: ${rangeData.color};
                            border-radius: 50%;
                            opacity: 0.85;
                            transform: translateY(-50%);
                        `;
                    }
                    fragmentY.appendChild(markY);
                }
                
                // 绘制 X 轴标记（横向）
                if (CONFIG.coordinates.showXAxis && tickBarX) {
                    const markX = document.createElement('div');
                    // X轴位置自适应：栏模式下X轴位置与搜索栏相反
                    let xPos = CONFIG.coordinates.xPosition === 'bottom' ? 'bottom' : 'top';
                    if (CONFIG.layout.mode === 'bar') {
                        xPos = CONFIG.layout.position === 'bottom' ? 'top' : 'bottom';
                    }
                    
                    const offset = isActive ? '3px' : '6px';
                    
                    if (isActive) {
                        markX.style.cssText = `
                            position: absolute;
                            left: ${xPercent}%;
                            ${xPos}: ${offset};
                            width: 14px;
                            height: 14px;
                            background: #ff5722;
                            border: 2px solid #ffffff;
                            border-radius: 50%;
                            transform: translateX(-50%);
                            z-index: 999;
                            box-shadow: 0 0 6px rgba(255,87,34,0.8), 0 0 12px rgba(255,87,34,0.4);
                        `;
                    } else {
                        markX.style.cssText = `
                            position: absolute;
                            left: ${xPercent}%;
                            ${xPos}: ${offset};
                            width: 8px;
                            height: 8px;
                            background: ${rangeData.color};
                            border-radius: 50%;
                            opacity: 0.85;
                            transform: translateX(-50%);
                        `;
                    }
                    fragmentX.appendChild(markX);
                }
            } catch(e) {
                // Range 无效，跳过
            }
        });
        
        // 批量添加到 DOM，只触发一次重排
        if (CONFIG.coordinates.showYAxis && tickBarY) {
            tickBarY.appendChild(fragmentY);
        }
        if (CONFIG.coordinates.showXAxis && tickBarX) {
            tickBarX.appendChild(fragmentX);
        }
    }
    
    // 采样函数：从大量结果中均匀采样
    function sampleRanges(ranges, maxCount) {
        if (ranges.length <= maxCount) return ranges;
        
        const sampled = [];
        const step = ranges.length / maxCount;
        
        // 确保当前激活的结果一定被包含
        const currentIdx = state.idx;
        if (currentIdx >= 0 && currentIdx < ranges.length) {
            sampled.push(ranges[currentIdx]);
        }
        
        // 均匀采样其他结果
        for (let i = 0; i < maxCount - 1; i++) {
            const idx = Math.floor(i * step);
            if (idx !== currentIdx && idx < ranges.length) {
                sampled.push(ranges[idx]);
            }
        }
        
        return sampled;
    }

    function go(dir) {
        if (!state.ranges.length) return;
        state.idx = (state.idx + dir + state.ranges.length) % state.ranges.length;

        // 验证当前 Range 是否仍然有效
        const currentRange = state.ranges[state.idx];
        if (!currentRange || !isRangeValid(currentRange.range)) {
            // Range 已失效，显示警告
            showContentChangedWarning();
            input.classList.add('warn-hidden');
            return;
        }

        let isHidden = false;
        try {
            const rangeNode = currentRange.range.startContainer;
            const element = rangeNode.nodeType === Node.TEXT_NODE ? rangeNode.parentElement : rangeNode;
            isHidden = element ? !isVisible(element) : false;
        } catch(e) {
            // 如果出错，也认为 Range 可能已失效
            showContentChangedWarning();
            return;
        }

        toast.textContent = isHidden ? t('hiddenAlert') : '';
        toast.classList.toggle('visible', isHidden);
        input.classList.toggle('warn-hidden', isHidden);
        highlightAll();
        updateUI();
    }

    function updateUI() {
        countDisplay.textContent = state.ranges.length ? t('count').replace('{i}', state.idx + 1).replace('{total}', state.ranges.length) : '';
    }

    function toggle(force) {
        if (!root) tryInit();
        const next = (force !== undefined) ? force : !state.visible;
        state.visible = next;

        if (!root) { setTimeout(() => toggle(force), 100); return; }

        root.classList.toggle('show', next);

        if (next) {
            // 检测特殊页面并显示提示
            const specialPage = detectSpecialPage();
            if (specialPage) {
                showSpecialPageWarning(specialPage);
            }
            
            checkPageSize();
            setTimeout(() => input.focus(), 50);
            updatePlaceholder();
            if (input.value && state.ranges.length === 0 && !CONFIG.search.fuzzy && !state.manualMode) triggerSearch();
        } else {
            if (state.abortController) {
                state.abortController.abort = true;
                state.abortController = null;
            }

            if (state.supportsHighlight && CSS.highlights) {
                CSS.highlights.clear();
            } else {
                document.querySelectorAll('sf-mark').forEach(m => {
                    const p = m.parentNode;
                    if(p) { p.replaceChild(document.createTextNode(m.textContent), m); p.normalize(); }
                });
            }

            state.ranges = [];
            state.currentHighlight = null;
            if (tickBarX) tickBarX.style.display = 'none';
            if (tickBarY) tickBarY.style.display = 'none';
        }
    }

    // CSS Highlight API 固定样式
    const globalStyle = document.createElement('style');
    globalStyle.textContent = `
        ::highlight(sf-search-active) {
            background-color: #ff5722 !important;
            color: #ffffff !important;
            outline: 3px solid #d32f2f;
            outline-offset: -1px;
            border-radius: 3px;
            box-shadow: 0 0 8px rgba(255,87,34,0.6);
            font-weight: 600;
        }

        sf-mark {
            all: unset;
            display: inline;
            border-radius: 2px;
            box-decoration-break: clone;
            -webkit-box-decoration-break: clone;
            color: inherit;
        }
    `;
    if (document.head) document.head.appendChild(globalStyle);
    else window.addEventListener('DOMContentLoaded', () => document.head.appendChild(globalStyle));

    // 快捷键处理（支持 Ctrl+F 劫持 + 默认 Ctrl+Shift+F）
    function handleKey(e) {
        // 主要快捷键：Ctrl+Shift+F（可在 chrome://extensions/shortcuts 中自定义）
        if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === 'f') {
            e.preventDefault();
            e.stopImmediatePropagation();
            toggle();
            return;
        }
        
        // F3 快捷键切换搜索结果
        if (e.key === 'F3' && state.visible) {
            e.preventDefault(); 
            e.stopImmediatePropagation();
            go(e.shiftKey ? -1 : 1);
        }
        
        // Esc 关闭搜索栏
        if (e.key === 'Escape' && state.visible) {
            e.preventDefault(); 
            e.stopImmediatePropagation();
            toggle(false);
        }
    }

    window.addEventListener('keydown', handleKey, true);
    document.addEventListener('keydown', handleKey, true);

    // 监听来自 background 的消息（通过 chrome.commands 触发）
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
        if (request.action === 'toggle-search') {
            toggle();
        }
    });

    // 启动初始化
    loadConfig().then(() => {
        if (CONFIG.layout.persistent) {
            window.addEventListener('load', () => toggle(true));
        }
        tryInit();
    });

})();



