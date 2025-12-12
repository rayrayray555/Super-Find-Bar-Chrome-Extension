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
            includeForcedHidden: false,
            fuzzy: false,
            fuzzyTolerance: 1,
            pinned: ['matchCase', 'wholeWord', 'ignoreAccents', 'highlightAll'],
            perfThreshold: 10000
        },
        coordinates: {
            showXAxis: true,   // X 轴标记（横向，默认开启）
            showYAxis: true,   // Y 轴标记（纵向，默认开启）
            xPosition: 'bottom', // X 轴位置：top | bottom
            yPosition: 'right'   // Y 轴位置：left | right
        },
        scroll: {
            behavior: 'always-center'  // 滚动行为：'always-center' | 'only-when-hidden'
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
            // 确保 scroll.behavior 有默认值
            if (!CONFIG.scroll.behavior) {
                CONFIG.scroll.behavior = DEFAULT_CONFIG.scroll.behavior;
            }
            
            // 从 chrome.storage.local 加载临时设置（跨 tab 共享，浏览器关闭后清除）
            // 优先级：storage.local（临时值）> storage.sync（默认值）
            try {
                const tempConfig = await chrome.storage.local.get([
                    'sf-temp-pinned',
                    'sf-temp-coordinates',
                    'sf-temp-search',
                    'sf-temp-colors',
                    'sf-temp-layout',
                    'sf-temp-theme',
                    'sf-temp-lang'
                ]);
                
                // 工具栏显示
                if (tempConfig['sf-temp-pinned']) {
                    CONFIG.search.pinned = tempConfig['sf-temp-pinned'];
                }
                
                // 坐标轴设置
                if (tempConfig['sf-temp-coordinates']) {
                    CONFIG.coordinates = { ...CONFIG.coordinates, ...tempConfig['sf-temp-coordinates'] };
                }
                
                // 搜索设置
                if (tempConfig['sf-temp-search']) {
                    const searchTemp = tempConfig['sf-temp-search'];
                    CONFIG.search.fuzzy = searchTemp.fuzzy !== undefined ? searchTemp.fuzzy : CONFIG.search.fuzzy;
                    CONFIG.search.fuzzyTolerance = searchTemp.fuzzyTolerance !== undefined ? searchTemp.fuzzyTolerance : CONFIG.search.fuzzyTolerance;
                    CONFIG.search.perfThreshold = searchTemp.perfThreshold !== undefined ? searchTemp.perfThreshold : CONFIG.search.perfThreshold;
                }
                
                // 滚动行为设置
                if (tempConfig['sf-temp-scroll']) {
                    const scrollTemp = tempConfig['sf-temp-scroll'];
                    CONFIG.scroll.behavior = scrollTemp.behavior || CONFIG.scroll.behavior;
                }
                
                // 颜色方案
                if (tempConfig['sf-temp-colors']) {
                    CONFIG.colors = tempConfig['sf-temp-colors'];
                }
                
                // 布局设置
                if (tempConfig['sf-temp-layout']) {
                    const layoutTemp = tempConfig['sf-temp-layout'];
                    CONFIG.layout.showLaunchBtn = layoutTemp.showLaunchBtn !== undefined ? layoutTemp.showLaunchBtn : CONFIG.layout.showLaunchBtn;
                    CONFIG.layout.position = layoutTemp.position || CONFIG.layout.position;
                    CONFIG.layout.mode = layoutTemp.mode || CONFIG.layout.mode;
                }
                
                // 主题设置
                if (tempConfig['sf-temp-theme']) {
                    const themeTemp = tempConfig['sf-temp-theme'];
                    CONFIG.theme.bg = themeTemp.bg || CONFIG.theme.bg;
                    CONFIG.theme.text = themeTemp.text || CONFIG.theme.text;
                    CONFIG.theme.opacity = themeTemp.opacity !== undefined ? themeTemp.opacity : CONFIG.theme.opacity;
                }
                
                // 语言设置
                if (tempConfig['sf-temp-lang']) {
                    CONFIG.lang = tempConfig['sf-temp-lang'];
                }
            } catch (e) {
                console.error('[Super Find Bar] Failed to load temporary config:', e);
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
    
    // 保存临时配置到 chrome.storage.local（跨 tab 共享，浏览器关闭后由 background.js 清除）
    async function saveSessionConfig() {
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

    // 判断是否为"自然隐藏"（页面存在但未触发显示的内容）
    function isNaturallyHidden(el) {
        if (!el) return false;
        const style = window.getComputedStyle(el);
        
        // 检查是否是菜单类元素（menu、nav、header、dropdown等）
        const tagName = el.tagName ? el.tagName.toLowerCase() : '';
        const role = el.getAttribute('role') || '';
        const className = el.className || '';
        const id = el.id || '';
        
        // 识别菜单容器和菜单项
        const isMenuContainer = tagName === 'menu' || tagName === 'nav' || tagName === 'header' || 
                                role === 'menu' || role === 'navigation' || role === 'menubar' ||
                                className.toLowerCase().includes('menu') || className.toLowerCase().includes('dropdown') ||
                                id.toLowerCase().includes('menu') || id.toLowerCase().includes('dropdown');
        
        const isMenuItem = tagName === 'option' || tagName === 'menuitem' ||
                          role === 'menuitem' || role === 'option' ||
                          className.toLowerCase().includes('menu-item') || className.toLowerCase().includes('dropdown-item');
        
        // 如果是菜单类元素，即使display:none也视为自然隐藏（因为可以通过交互显示）
        if (isMenuContainer || isMenuItem) {
            if (style.display === 'none' || style.visibility === 'hidden') {
                return true;
            }
        }
        
        // 自然隐藏的常见方式：
        // 1. max-height: 0 + overflow: hidden（折叠菜单）
        const maxHeight = style.maxHeight;
        const overflow = style.overflow || style.overflowY;
        if (maxHeight === '0px' && (overflow === 'hidden' || overflow === 'auto')) {
            return true;
        }
        
        // 2. height: 0 + overflow: hidden
        const height = style.height;
        if (height === '0px' && (overflow === 'hidden' || overflow === 'auto')) {
            return true;
        }
        
        // 3. transform: translateY(-100%) 或 translateX(-100%)（移出视口但未完全隐藏）
        const transform = style.transform || style.webkitTransform;
        if (transform && transform !== 'none') {
            // 检查translateY(-100%)或translateX(-100%)，但不包括-9999px这种极端值
            if (transform.includes('translateY(-100%)') || transform.includes('translateX(-100%)')) {
                return true;
            }
        }
        
        // 4. position: absolute + 在视口外但父元素可见（滑动内容）
        const position = style.position;
        if (position === 'absolute' || position === 'fixed') {
            const rect = el.getBoundingClientRect();
            const viewportWidth = window.innerWidth || document.documentElement.clientWidth;
            const viewportHeight = window.innerHeight || document.documentElement.clientHeight;
            
            // 如果元素在视口外，但父元素可见，可能是滑动内容
            if ((rect.right < 0 || rect.bottom < 0 || rect.left > viewportWidth || rect.top > viewportHeight)) {
                // 检查父元素是否可见
                let parent = el.parentElement;
                if (parent && parent !== document.body) {
                    const parentStyle = window.getComputedStyle(parent);
                    if (parentStyle.display !== 'none' && parentStyle.visibility !== 'hidden') {
                        return true;
                    }
                }
            }
        }
        
        return false;
    }

    function isVisible(el, includeForcedHidden = false) {
        if (!el) return false;
        if (el.id === HOST_ID || el.id === BTN_ID || el.closest('#' + HOST_ID)) return false;
        
        const style = window.getComputedStyle(el);
        
        // 检查基本可见性属性（刻意隐藏）
        if (style.display === 'none' || style.visibility === 'hidden') {
            // 如果允许搜索强制隐藏内容，则允许这些元素
            return includeForcedHidden;
        }
        
        // 检查透明度（完全透明视为不可见）
        const opacity = parseFloat(style.opacity);
        if (isNaN(opacity) || opacity === 0) {
            return includeForcedHidden;
        }
        
        // 检查clip-path隐藏（clip-path: inset(100%) 表示完全隐藏）
        const clipPath = style.clipPath || style.webkitClipPath;
        if (clipPath && (clipPath.includes('inset(100%)') || clipPath.includes('inset(100% 100%)'))) {
            return includeForcedHidden;
        }
        
        // 检查transform隐藏（scale(0) 或 translateX(-9999px) 等）
        const transform = style.transform || style.webkitTransform;
        if (transform && transform !== 'none') {
            // 检查scale(0)或scaleX(0)或scaleY(0)
            if (transform.includes('scale(0') || transform.includes('scaleX(0') || transform.includes('scaleY(0')) {
                return includeForcedHidden;
            }
            // 检查translateX/Y超出视口（如-9999px）
            const translateMatch = transform.match(/translate[XY]\(([^)]+)\)/);
            if (translateMatch) {
                const translateValue = parseFloat(translateMatch[1]);
                if (Math.abs(translateValue) > 10000) return includeForcedHidden;
            }
        }
        
        // 检查尺寸
        const rect = el.getBoundingClientRect();
        if (rect.width === 0 || rect.height === 0) return false;
        
        // 检查是否在视口内（对于position: absolute/fixed的元素）
        const position = style.position;
        if (position === 'absolute' || position === 'fixed') {
            // 检查是否在视口范围内
            const viewportWidth = window.innerWidth || document.documentElement.clientWidth;
            const viewportHeight = window.innerHeight || document.documentElement.clientHeight;
            
            // 如果元素完全在视口外，视为不可见
            if (rect.right < 0 || rect.bottom < 0 || rect.left > viewportWidth || rect.top > viewportHeight) {
                return false;
            }
        }
        
        // 递归检查父元素可见性（如果父元素隐藏，子元素也不可见）
        let parent = el.parentElement;
        let depth = 0;
        while (parent && parent !== document.body && depth < 10) {
            const parentStyle = window.getComputedStyle(parent);
            if (parentStyle.display === 'none' || parentStyle.visibility === 'hidden') {
                return includeForcedHidden;
            }
            const parentOpacity = parseFloat(parentStyle.opacity);
            if (!isNaN(parentOpacity) && parentOpacity === 0) {
                return includeForcedHidden;
            }
            parent = parent.parentElement;
            depth++;
        }
        
        // 检查文本内容（对于文本节点）
        if (el.nodeType === Node.TEXT_NODE) {
            const text = el.textContent.trim();
            if (!text || text.length === 0) return false;
        } else if (el.nodeType === Node.ELEMENT_NODE) {
            // 对于元素节点，检查是否有实际文本内容
            const text = el.textContent.trim();
            if (!text || text.length === 0) {
                // 如果没有文本内容，检查是否有可见的子元素
                const children = Array.from(el.children);
                const hasVisibleChild = children.some(child => {
                    const childStyle = window.getComputedStyle(child);
                    return childStyle.display !== 'none' && childStyle.visibility !== 'hidden';
                });
                if (!hasVisibleChild) return false;
            }
        }
        
        return true;
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
        isRadarLocating: false,
        supportsHighlight: typeof CSS !== 'undefined' && CSS.highlights,
        // 智能刷新相关状态
        lastResultCount: 0,
        lastSearchTime: 0,
        mutationObserver: null,
        refreshTimer: null,
        observeTimeout: null,
        refreshRetryCount: 0
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

        // 将涟漪动画样式添加到document.head（因为涟漪元素添加到document.body，需要全局样式）
        if (!document.getElementById('sf-ripple-styles')) {
            const rippleStyle = document.createElement('style');
            rippleStyle.id = 'sf-ripple-styles';
            rippleStyle.textContent = `
                /* 水滴涟漪动画：从很小扩散到全屏，像水滴滴到湖面（优化：更快更流畅） */
                @keyframes sf-water-ripple {
                    0% {
                        transform: scale(0.1) translateZ(0);
                        opacity: 0.8;
                        border-width: 2px;
                    }
                    15% {
                        opacity: 0.7;
                        border-width: 1.8px;
                    }
                    30% {
                        opacity: 0.5;
                        border-width: 1.5px;
                    }
                    50% {
                        opacity: 0.3;
                        border-width: 1px;
                    }
                    70% {
                        opacity: 0.15;
                        border-width: 0.8px;
                    }
                    85% {
                        opacity: 0.08;
                        border-width: 0.5px;
                    }
                    100% {
                        transform: scale(var(--ripple-max-scale)) translateZ(0);
                        opacity: 0;
                        border-width: 0px;
                    }
                }
                
                /* 涟漪容器：使用严格的containment和隔离，完全不影响页面内容 */
                .sf-ripple-container {
                    position: fixed;
                    pointer-events: none;
                    z-index: 2147483647 !important; /* 最高z-index，确保不被遮挡 */
                    contain: strict; /* 最严格的containment */
                    isolation: isolate;
                    transform: translate3d(0, 0, 0); /* 使用3D变换强制GPU加速和独立层 */
                    overflow: hidden;
                    will-change: transform;
                    /* 移除混合模式，避免在白色背景上变白 */
                    opacity: 1;
                }
                
                /* 单层涟漪：圆形，从中心扩散，完全隔离 */
                .sf-ripple-layer {
                    position: absolute;
                    border-radius: 50%;
                    border: 2px solid rgba(0, 122, 255, 0.7);
                    background: transparent;
                    animation: sf-water-ripple 1.8s cubic-bezier(0.4, 0.0, 0.2, 1) forwards; /* 更快的缓动函数 */
                    will-change: transform, opacity;
                    transform: translate3d(0, 0, 0); /* 3D变换强制独立层 */
                    backface-visibility: hidden;
                    -webkit-backface-visibility: hidden;
                    /* 确保不影响其他元素 */
                    contain: layout style paint;
                    isolation: isolate;
                }
            `;
            document.head.appendChild(rippleStyle);
        }

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
                flex-direction: column; width: 435px; border-radius: 12px; margin: 20px; padding: 10px;
            }
            .mode-float .sf-row-top { display: flex; align-items: center; gap: 6px; width: 100%; }
            .mode-float .sf-row-bot { margin-top: 8px; padding-top: 8px; border-top: 1px solid rgba(255,255,255,0.1); }
            .mode-float .sf-chk-group { display: flex; flex-wrap: wrap; gap: 6px; align-items: center; }

            .sf-pos-top-right { top: 0; right: 0; transform: translateY(-150%); }
            .sf-pos-top-right.show { transform: translateY(0); }
            .sf-pos-top-left { top: 0; left: 0; transform: translateY(-150%); }
            .sf-pos-top-left.show { transform: translateY(0); }
            .sf-pos-bottom-right { bottom: 0; right: 0; transform: translateY(150%); }
            .sf-pos-bottom-right.show { transform: translateY(0); }
            .sf-pos-bottom-left { bottom: 0; left: 0; transform: translateY(150%); }
            .sf-pos-bottom-left.show { transform: translateY(0); }

            .sf-box.mode-bar {
                width: 100%; left: 0; right: 0; margin: 0; border-radius: 0; border: 0;
                flex-direction: row; align-items: center; padding: 0 12px; height: 35px;
                justify-content: flex-start; gap: 6px;
            }
            .sf-pos-top { top: 0; transform: translateY(-120%); border-bottom: 1px solid rgba(255,255,255,0.1); }
            .sf-pos-top.show { transform: translateY(0); }
            .sf-pos-bottom { bottom: 0; transform: translateY(120%); border-top: 1px solid rgba(255,255,255,0.1); }
            .sf-pos-bottom.show { transform: translateY(0); }

            .mode-bar .sf-row-top, .mode-bar .sf-row-bot { display: contents; }
            .mode-bar .sf-input-wrap { order: 1; flex: 0 1 320px; }
            .mode-bar .sf-btn-radar { order: 2; }
            .mode-bar .sf-btn-prev { order: 3; }
            .mode-bar .sf-btn-next { order: 4; }
            .mode-bar .sf-btn-adv { order: 5; margin-right: 10px; }
            .mode-bar .sf-chk-group { order: 6; display: flex; align-items: center; border-left: 1px solid rgba(255,255,255,0.2); padding-left: 10px; }
            .mode-bar .sf-btn-pin { order: 99; margin-left: auto; margin-right: 4px; }
            .mode-bar .sf-btn-rate { order: 99; margin-right: 4px; }
            .mode-bar .sf-btn-close { order: 100; }
            .mode-float .sf-btn-pin { margin-left: auto; }
            .mode-float .sf-btn-rate { margin-right: 4px; }

            .sf-input-wrap { position: relative; display: flex; align-items: center; flex-grow: 1; }
            input[type="text"] {
                width: 100%; background: rgba(255,255,255,0.1); border: 2px solid transparent;
                color: inherit; padding: 4px 32px 4px 6px; border-radius: 6px; outline: none;
                transition: border-color 0.2s; font-size: 12px;
            }
            input[type="text"]:focus { border-color: var(--sf-accent); }
            input[type="text"].warn-hidden { border-color: var(--sf-accent); border-style: dashed; }

            .sf-count { position: absolute; right: 6px; font-size: 10px; opacity: 0.7; pointer-events: none; transition: opacity 0.2s; }
            .sf-loading {
                position: absolute; right: 6px; width: 12px; height: 12px;
                border: 2px solid rgba(255,255,255,0.3); border-top-color: var(--sf-accent);
                border-radius: 50%; animation: spin 0.8s linear infinite; display: none;
            }
            @keyframes spin { to { transform: rotate(360deg); } }

            button {
                background: transparent; border: none; color: inherit; cursor: pointer;
                padding: 4px; border-radius: 4px; display: flex; align-items: center; justify-content: center;
                transition: background 0.1s; min-width: 24px; height: 24px; flex-shrink: 0;
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
                display: inline-flex; align-items: center; gap: 3px; cursor: pointer; user-select: none;
                opacity: 0.8; font-size: 11px; margin-right: 6px;
                background: rgba(255,255,255,0.05); padding: 2px 5px; border-radius: 4px;
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

            .sf-grid { display: grid; grid-template-columns: 1fr; gap: 6px; }
            .sf-group-title {
                font-size: 10px; opacity: 0.6; text-transform: uppercase; font-weight: 600;
                margin-bottom: 3px; border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 2px;
                display:flex; justify-content: space-between; align-items: center;
            }
            .sf-adv-row { 
                display: flex; align-items: center; justify-content: space-between; 
                margin-bottom: 1px; flex-wrap: wrap;
                min-height: 20px;
                padding: 1px 0;
            }
            .sf-adv-lbl { 
                font-size: 10px; 
                flex: 1;
                color: var(--sf-txt);
            }
            .sf-hint { 
                font-size: 10px; 
                color: #ff9800; 
                margin-top: 2px; 
                line-height: 1.3; 
                width: 100%; 
                padding-left: 0;
            }
            .sf-switch-label {
                position: relative;
                display: inline-block;
                width: 28px;
                height: 16px;
            }
            .sf-slider {
                position: absolute;
                cursor: pointer;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background-color: rgba(255,255,255,0.2);
                transition: .3s;
                border-radius: 16px;
            }
            .sf-slider:before {
                position: absolute;
                content: "";
                height: 12px;
                width: 12px;
                left: 2px;
                bottom: 2px;
                background-color: white;
                transition: .3s;
                border-radius: 50%;
                box-shadow: 0 1px 2px rgba(0,0,0,0.2);
            }
            input:checked ~ .sf-slider {
                background-color: var(--sf-accent);
            }
            input:checked ~ .sf-slider:before {
                transform: translateX(12px);
            }

            .sf-mini-map { display: grid; grid-template-columns: 1fr 1fr; gap: 4px; width: 60px; }
            .sf-mini-btn { height: 15px; width: 15px; background: rgba(255,255,255,0.1); border-radius: 2px; cursor: pointer; border: 1px solid transparent; }
            .sf-mini-btn:hover { background: var(--sf-accent); }
            .sf-mini-btn.active { background: var(--sf-accent); border-color: #fff; }
            .sf-bar-btn { width: 100%; height: 15px; background: rgba(255,255,255,0.1); cursor: pointer; border-radius: 2px; border: 1px solid transparent; text-align:center; line-height:15px; font-size:7px; padding:0;}
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

            /* 隐藏number input的上下切换按钮 */
            input[type="number"]::-webkit-inner-spin-button,
            input[type="number"]::-webkit-outer-spin-button {
                -webkit-appearance: none;
                margin: 0;
            }
            input[type="number"] {
                -moz-appearance: textfield;
            }

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

        // 雷达定位按钮（使用SVG绘制平面圆形雷达图标）
        const radarIcon = `<svg width="16" height="16" viewBox="0 0 16 16" style="display:block;">
            <circle cx="8" cy="8" r="6" fill="none" stroke="currentColor" stroke-width="1.5" opacity="0.8"/>
            <circle cx="8" cy="8" r="3" fill="none" stroke="currentColor" stroke-width="1.5" opacity="0.6"/>
            <line x1="8" y1="8" x2="8" y2="2" stroke="currentColor" stroke-width="1.5" opacity="0.8"/>
            <line x1="8" y1="8" x2="12" y2="8" stroke="currentColor" stroke-width="1.5" opacity="0.8"/>
            <circle cx="8" cy="8" r="1" fill="currentColor" opacity="0.9"/>
        </svg>`;
        const btnRadar = mkBtn(radarIcon, CONFIG.lang === 'zh' ? '定位当前高亮' : 'Locate Highlight', () => {
            // 检查是否有搜索结果
            if (!state.ranges || state.ranges.length === 0) {
                console.log('[Super Find Bar] No search results to locate');
                return;
            }
            
            // 确保idx有效
            if (state.idx < 0 || state.idx >= state.ranges.length) {
                console.log('[Super Find Bar] Invalid index:', state.idx, 'total:', state.ranges.length);
                return;
            }
            
            const currentRange = state.ranges[state.idx];
            if (!currentRange || !currentRange.range) {
                console.log('[Super Find Bar] Invalid range at index:', state.idx);
                return;
            }
            
            // 锁定当前索引，防止在定位期间被修改
            const lockedIdx = state.idx;
            const lockedRange = currentRange.range;
            
            // 设置雷达定位标志，防止highlightAll()中的滚动冲突
            state.isRadarLocating = true;
            
            try {
                // 先滚动到该位置，确保range可见
                scrollToRangeImmediate(lockedRange);
                
                // 等待滚动完成后再显示涟漪
                setTimeout(() => {
                    try {
                        const rect = lockedRange.getBoundingClientRect();
                        let rippleLeft = 0;
                        let rippleTop = 0;
                        
                        if (rect.width === 0 && rect.height === 0) {
                            // 如果range不可见，尝试获取包含它的元素
                            const container = lockedRange.startContainer.nodeType === Node.TEXT_NODE 
                                ? lockedRange.startContainer.parentElement 
                                : lockedRange.startContainer;
                            if (container) {
                                const containerRect = container.getBoundingClientRect();
                                rippleLeft = containerRect.left + containerRect.width / 2;
                                rippleTop = containerRect.top + containerRect.height / 2;
                            } else {
                                console.log('[Super Find Bar] Cannot find container element');
                                state.isRadarLocating = false;
                                return;
                            }
                        } else {
                            rippleLeft = rect.left + rect.width / 2;
                            rippleTop = rect.top + rect.height / 2;
                        }
                        
                        // 计算屏幕对角线长度，缩小范围以减少闪烁
                        const screenWidth = window.innerWidth;
                        const screenHeight = window.innerHeight;
                        const screenDiagonal = Math.sqrt(screenWidth * screenWidth + screenHeight * screenHeight);
                        
                        // 起始大小：30px（像水滴刚接触湖面）
                        const rippleStartSize = 30;
                        
                        // 缩小扩散范围：0.5倍屏幕对角线，减少对页面的影响
                        const rippleMaxSize = screenDiagonal * 0.5; // 0.5倍，足够覆盖大部分屏幕但不会太大
                        const maxScale = rippleMaxSize / rippleStartSize;
                        
                        // 创建涟漪容器，大小包含最大扩散范围
                        const containerSize = rippleMaxSize;
                        const containerLeft = rippleLeft - containerSize / 2;
                        const containerTop = rippleTop - containerSize / 2;
                        
                        const rippleContainer = document.createElement('div');
                        rippleContainer.className = 'sf-ripple-container';
                        rippleContainer.style.left = containerLeft + 'px';
                        rippleContainer.style.top = containerTop + 'px';
                        rippleContainer.style.width = containerSize + 'px';
                        rippleContainer.style.height = containerSize + 'px';
                        rippleContainer.style.setProperty('--ripple-max-scale', maxScale.toString());
                        
                        // 创建5层涟漪，每层有延迟，像水滴效果
                        const layerCount = 5;
                        const layerDelay = 0.12; // 每层延迟0.12秒（加快速度）
                        const layerOpacities = [0.7, 0.6, 0.5, 0.4, 0.3]; // 每层的初始透明度
                        const layerColors = [
                            'rgba(0, 122, 255, 0.7)',   // iOS蓝色
                            'rgba(10, 132, 255, 0.65)',
                            'rgba(20, 148, 255, 0.6)',
                            'rgba(30, 160, 255, 0.55)',
                            'rgba(40, 170, 255, 0.5)'
                        ];
                        
                        // 涟漪层相对于容器中心的位置
                        const layerLeft = (containerSize - rippleStartSize) / 2;
                        const layerTop = (containerSize - rippleStartSize) / 2;
                        
                        for (let i = 0; i < layerCount; i++) {
                            const layer = document.createElement('div');
                            layer.className = 'sf-ripple-layer';
                            layer.style.width = rippleStartSize + 'px';
                            layer.style.height = rippleStartSize + 'px';
                            layer.style.left = layerLeft + 'px';
                            layer.style.top = layerTop + 'px';
                            layer.style.borderColor = layerColors[i];
                            layer.style.opacity = layerOpacities[i];
                            layer.style.animationDelay = (i * layerDelay) + 's';
                            rippleContainer.appendChild(layer);
                        }
                        
                        document.body.appendChild(rippleContainer);
                        
                        // 动画结束后立即移除，避免闪烁
                        // 动画时长1.8s，加上最后一层的延迟，总共约2.16秒（比之前快约33%）
                        const totalDuration = 1800 + (layerCount - 1) * layerDelay * 1000 + 100;
                        setTimeout(() => {
                            if (rippleContainer.parentNode) {
                                rippleContainer.style.opacity = '0';
                                rippleContainer.style.pointerEvents = 'none';
                                requestAnimationFrame(() => {
                                    if (rippleContainer.parentNode) {
                                        rippleContainer.remove();
                                    }
                                    // 清除雷达定位标志
                                    state.isRadarLocating = false;
                                });
                            } else {
                                state.isRadarLocating = false;
                            }
                        }, totalDuration);
                    } catch (e) {
                        console.error('[Super Find Bar] Failed to create ripple:', e);
                        state.isRadarLocating = false;
                    }
                }, 100);
            } catch (e) {
                console.error('[Super Find Bar] Failed to locate highlight:', e);
                state.isRadarLocating = false;
            }
        }, 'sf-btn-radar');

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

        topRow.append(inputWrap, btnRadar, btnPrev, btnNext, btnAdv, btnPin, btnRate, btnClose);

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
                // Enter键搜索：强制重新检查页面大小并完整搜索
                checkPageSize();
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

    // 创建紧凑的 switch 控件辅助函数
    function createCompactSwitch(checked, onChange) {
        const switchWrapper = document.createElement('div');
        switchWrapper.style.display = 'flex';
        switchWrapper.style.justifyContent = 'flex-end';
        switchWrapper.style.width = '28px';
        
        const switchLabel = document.createElement('label');
        switchLabel.className = 'sf-switch-label';
        switchLabel.style.position = 'relative';
        switchLabel.style.display = 'inline-block';
        switchLabel.style.width = '28px';
        switchLabel.style.height = '16px';
        
        const chk = document.createElement('input');
        chk.type = 'checkbox';
        chk.checked = checked;
        chk.style.opacity = '0';
        chk.style.width = '0';
        chk.style.height = '0';
        chk.onchange = onChange;
        
        const slider = document.createElement('span');
        slider.className = 'sf-slider';
        slider.style.cssText = 'position:absolute;cursor:pointer;top:0;left:0;right:0;bottom:0;background-color:rgba(255,255,255,0.2);transition:.3s;border-radius:16px;';
        slider.style.background = checked ? 'var(--sf-accent)' : 'rgba(255,255,255,0.2)';
        
        const sliderBefore = document.createElement('span');
        sliderBefore.style.cssText = 'position:absolute;content:"";height:12px;width:12px;left:2px;bottom:2px;background-color:white;transition:.3s;border-radius:50%;box-shadow:0 1px 2px rgba(0,0,0,0.2);';
        sliderBefore.style.transform = checked ? 'translateX(12px)' : 'translateX(0)';
        
        chk.addEventListener('change', () => {
            slider.style.background = chk.checked ? 'var(--sf-accent)' : 'rgba(255,255,255,0.2)';
            sliderBefore.style.transform = chk.checked ? 'translateX(12px)' : 'translateX(0)';
        });
        
        slider.appendChild(sliderBefore);
        switchLabel.append(chk, slider);
        switchWrapper.appendChild(switchLabel);
        return { wrapper: switchWrapper, checkbox: chk };
    }

    function renderAdvPanel() {
        advPanel.innerHTML = '';
        const grid = document.createElement('div');
        grid.className = 'sf-grid';

        // Group 1: 搜索选项设置（工具栏显示）- 按照 options 页面顺序
        const grpTools = document.createElement('div');
        const toolTitle = document.createElement('div');
        toolTitle.className = 'sf-group-title';
        toolTitle.style.display = 'flex';
        toolTitle.style.justifyContent = 'space-between';
        toolTitle.style.alignItems = 'center';
        const titleText = document.createElement('span');
        titleText.textContent = CONFIG.lang === 'zh' ? '搜索选项设置' : 'Search Options';
        const headerLabel = document.createElement('span');
        headerLabel.textContent = CONFIG.lang === 'zh' ? '显示在工具栏' : 'Show in Toolbar';
        toolTitle.append(titleText, headerLabel);
        grpTools.appendChild(toolTitle);
        
        // 按照 options 页面顺序：matchCase, wholeWord, ignoreAccents, highlightAll, regex, includeHidden, fuzzy
        const toolList = ['matchCase', 'wholeWord', 'ignoreAccents', 'highlightAll', 'regex', 'includeHidden', 'fuzzy'];
        toolList.forEach(key => {
            const row = document.createElement('div');
            row.className = 'sf-adv-row';
            const lbl = document.createElement('span');
            lbl.className = 'sf-adv-lbl';
            lbl.textContent = t(`opts.${key}`);
            lbl.style.flex = '1';
            
            const switchCtrl = createCompactSwitch(CONFIG.search.pinned.includes(key), (e) => {
                if (e.target.checked) {
                    if (!CONFIG.search.pinned.includes(key)) {
                        CONFIG.search.pinned.push(key);
                        CONFIG.search[key] = false;
                    }
                } else {
                    CONFIG.search.pinned = CONFIG.search.pinned.filter(k => k !== key);
                    CONFIG.search[key] = false;
                }
                saveSessionConfig();
                showSuccessToast(t('saved'));
                renderCheckboxes(chkGroup);
                // 实时更新搜索结果：如果有搜索词，立即触发搜索
                if (input.value && input.value.trim() && !CONFIG.search.fuzzy && !state.manualMode) {
                    triggerSearch();
                }
                // 如果是模糊搜索，需要重新渲染以显示/隐藏容错字符数
                if (key === 'fuzzy') {
                    renderAdvPanel();
                }
            });
            
            row.append(lbl, switchCtrl.wrapper);
            grpTools.append(row);
            
            // 容错字符数（作为模糊搜索的子项，只有模糊搜索在工具栏中时才显示）
            if (key === 'fuzzy' && CONFIG.search.pinned.includes('fuzzy')) {
        const fuzzyToleranceRow = document.createElement('div');
        fuzzyToleranceRow.className = 'sf-adv-row';
                fuzzyToleranceRow.style.paddingLeft = '16px';
                fuzzyToleranceRow.style.marginTop = '2px';
        const toleranceLabel = document.createElement('span');
                toleranceLabel.className = 'sf-adv-lbl';
        toleranceLabel.textContent = CONFIG.lang === 'zh' ? '容错字符数' : 'Tolerance';
                toleranceLabel.style.fontSize = '10px';
        
        const toleranceControl = document.createElement('div');
        toleranceControl.style.display = 'flex';
        toleranceControl.style.alignItems = 'center';
                toleranceControl.style.gap = '6px';
        
        const fuzzyRange = document.createElement('input');
        fuzzyRange.type = 'range';
        fuzzyRange.min = '0';
        fuzzyRange.max = '15'; // 增加到15（根据现代电脑性能，不限制搜索范围的情况下最大支持15个字符容错）
        fuzzyRange.step = '1';
        fuzzyRange.value = CONFIG.search.fuzzyTolerance;
                fuzzyRange.style.width = '60px';
                fuzzyRange.style.height = '3px';
        fuzzyRange.oninput = (e) => {
            CONFIG.search.fuzzyTolerance = parseInt(e.target.value);
            toleranceValue.textContent = CONFIG.search.fuzzyTolerance;
                    // advance中的修改只保存到临时配置，不影响options
                    saveSessionConfig();
            showSuccessToast(t('saved'));
        };
        
        const toleranceValue = document.createElement('span');
        toleranceValue.textContent = CONFIG.search.fuzzyTolerance;
            toleranceValue.style.minWidth = '14px';
        toleranceValue.style.textAlign = 'center';
            toleranceValue.style.fontSize = '9px';
        
        toleranceControl.append(fuzzyRange, toleranceValue);
        fuzzyToleranceRow.append(toleranceLabel, toleranceControl);
                grpTools.append(fuzzyToleranceRow);
            }
        });

        // Group 2: 搜索设置
        const grpSearch = document.createElement('div');
        const searchTitle = document.createElement('div');
        searchTitle.className = 'sf-group-title';
        searchTitle.textContent = CONFIG.lang === 'zh' ? '搜索设置' : 'Search Settings';
        grpSearch.appendChild(searchTitle);

        // 自动搜索阈值
        const perfRow = document.createElement('div');
        perfRow.className = 'sf-adv-row';
        const perfLbl = document.createElement('span');
        perfLbl.className = 'sf-adv-lbl';
        perfLbl.textContent = t('lbl.perf');

        const perfCtrl = document.createElement('div');
        perfCtrl.style.display = 'flex';
        perfCtrl.style.gap = '4px';
        perfCtrl.style.marginLeft = 'auto';

        const perfInp = document.createElement('input');
        perfInp.type = 'number';
        perfInp.value = CONFIG.search.perfThreshold;
        perfInp.style.width = '45px';
        perfInp.style.height = '18px';
        perfInp.style.background = 'rgba(255,255,255,0.1)';
        perfInp.style.border = 'none';
        perfInp.style.color = 'inherit';
        perfInp.style.borderRadius = '3px';
        perfInp.style.padding = '1px 3px';
        perfInp.style.fontSize = '9px';
        perfInp.onchange = (e) => {
            let v = parseInt(e.target.value);
            if(isNaN(v) || v < 0) v = 3000;
            CONFIG.search.perfThreshold = v;
            // advance中的修改只保存到临时配置，不影响options
            saveSessionConfig();
            showSuccessToast(t('saved'));
        };

        const btnResetPerf = document.createElement('button');
        btnResetPerf.innerHTML = '↺';
        btnResetPerf.title = CONFIG.lang === 'zh' ? '重置为默认' : 'Reset to Default';
        btnResetPerf.style.cssText = 'width:18px;height:18px;padding:0;font-size:10px;border-radius:50%;border:1px solid rgba(255,255,255,0.3);background:rgba(255,255,255,0.1);cursor:pointer;display:flex;align-items:center;justify-content:center;';
        btnResetPerf.onmouseover = () => btnResetPerf.style.background = 'rgba(255,255,255,0.2)';
        btnResetPerf.onmouseout = () => btnResetPerf.style.background = 'rgba(255,255,255,0.1)';
        btnResetPerf.onclick = async () => {
            try {
                const defaultConfig = await chrome.storage.sync.get(STORAGE_KEY);
                const defaultPerfThreshold = defaultConfig[STORAGE_KEY]?.search?.perfThreshold || DEFAULT_CONFIG.search.perfThreshold;
                CONFIG.search.perfThreshold = defaultPerfThreshold;
            perfInp.value = CONFIG.search.perfThreshold;
                // advance中的修改只保存到临时配置，不影响options
                saveSessionConfig();
            showSuccessToast(t('saved'));
            } catch (e) {
                console.error('[Super Find Bar] Failed to reset perf threshold:', e);
            }
        };

        perfCtrl.append(perfInp, btnResetPerf);
        perfRow.append(perfLbl, perfCtrl);
        grpSearch.appendChild(perfRow);

        // 滚动行为
        const scrollRow = document.createElement('div');
        scrollRow.className = 'sf-adv-row';
        const scrollLbl = document.createElement('span');
        scrollLbl.className = 'sf-adv-lbl';
        scrollLbl.textContent = CONFIG.lang === 'zh' ? '滚动行为' : 'Scroll Behavior';
        
        const scrollCtrl = document.createElement('div');
        scrollCtrl.style.display = 'flex';
        scrollCtrl.style.gap = '8px';
        scrollCtrl.style.marginLeft = 'auto';
        
        // 确保有默认值
        if (!CONFIG.scroll.behavior) {
            CONFIG.scroll.behavior = 'always-center';
        }
        
        const scrollAlways = document.createElement('label');
        scrollAlways.style.display = 'flex';
        scrollAlways.style.alignItems = 'center';
        scrollAlways.style.gap = '3px';
        scrollAlways.style.fontSize = '10px';
        scrollAlways.style.cursor = 'pointer';
        const radioAlways = document.createElement('input');
        radioAlways.type = 'radio';
        radioAlways.name = 'scroll-behavior-adv';
        radioAlways.value = 'always-center';
        radioAlways.checked = CONFIG.scroll.behavior === 'always-center';
        radioAlways.style.width = '10px';
        radioAlways.style.height = '10px';
        radioAlways.onchange = () => {
            CONFIG.scroll.behavior = 'always-center';
            // advance中的修改只保存到临时配置，不影响options
            saveSessionConfig();
            showSuccessToast(t('saved'));
        };
        scrollAlways.append(radioAlways, document.createTextNode(CONFIG.lang === 'zh' ? '始终居中' : 'Always Center'));
        
        const scrollHidden = document.createElement('label');
        scrollHidden.style.display = 'flex';
        scrollHidden.style.alignItems = 'center';
        scrollHidden.style.gap = '3px';
        scrollHidden.style.fontSize = '10px';
        scrollHidden.style.cursor = 'pointer';
        const radioHidden = document.createElement('input');
        radioHidden.type = 'radio';
        radioHidden.name = 'scroll-behavior-adv';
        radioHidden.value = 'only-when-hidden';
        radioHidden.checked = CONFIG.scroll.behavior === 'only-when-hidden';
        radioHidden.style.width = '10px';
        radioHidden.style.height = '10px';
        radioHidden.onchange = () => {
            CONFIG.scroll.behavior = 'only-when-hidden';
            // advance中的修改只保存到临时配置，不影响options
            saveSessionConfig();
            showSuccessToast(t('saved'));
        };
        scrollHidden.append(radioHidden, document.createTextNode(CONFIG.lang === 'zh' ? '仅不可见时' : 'Only When Hidden'));
        
        scrollCtrl.append(scrollAlways, scrollHidden);
        scrollRow.append(scrollLbl, scrollCtrl);
        grpSearch.appendChild(scrollRow);

        // 多词颜色方案
        const colorRow = document.createElement('div');
        colorRow.className = 'sf-adv-row';
        const colorLbl = document.createElement('span');
        colorLbl.className = 'sf-adv-lbl';
        colorLbl.textContent = CONFIG.lang === 'zh' ? '多词颜色方案' : 'Multi-term Colors';

        const colorGrid = document.createElement('div');
        colorGrid.style.display = 'flex';
        colorGrid.style.gap = '2px';
        colorGrid.style.alignItems = 'center';

        CONFIG.colors.forEach((color, idx) => {
            const colorCircle = document.createElement('div');
            colorCircle.style.cssText = 'width:16px;height:16px;border-radius:50%;border:1px solid rgba(255,255,255,0.3);overflow:hidden;cursor:pointer;position:relative;';
            colorCircle.title = `${idx + 1}`;
            colorCircle.onmouseover = () => colorCircle.style.borderColor = 'rgba(255,255,255,0.5)';
            colorCircle.onmouseout = () => colorCircle.style.borderColor = 'rgba(255,255,255,0.3)';
            
            const colorInp = document.createElement('input');
            colorInp.type = 'color';
            colorInp.value = color;
            colorInp.style.cssText = 'position:absolute;top:-50%;left:-50%;width:200%;height:200%;border:none;padding:0;margin:0;cursor:pointer;';
            colorInp.onchange = (e) => {
                CONFIG.colors[idx] = e.target.value;
                // advance中的修改只保存到临时配置，不影响options
                saveSessionConfig();
                showSuccessToast(t('saved'));
                updateColorStyles();
            };
            colorCircle.appendChild(colorInp);
            colorGrid.appendChild(colorCircle);
        });
        
        const btnResetColors = document.createElement('button');
        btnResetColors.innerHTML = '↺';
        btnResetColors.title = CONFIG.lang === 'zh' ? '重置为默认' : 'Reset Colors';
        btnResetColors.style.cssText = 'width:18px;height:18px;padding:0;font-size:9px;border-radius:50%;border:1px solid rgba(255,255,255,0.3);background:rgba(255,255,255,0.1);cursor:pointer;display:flex;align-items:center;justify-content:center;';
        btnResetColors.onmouseover = () => btnResetColors.style.background = 'rgba(255,255,255,0.2)';
        btnResetColors.onmouseout = () => btnResetColors.style.background = 'rgba(255,255,255,0.1)';
        btnResetColors.onclick = async () => {
            try {
                const defaultConfig = await chrome.storage.sync.get(STORAGE_KEY);
                const defaultColors = defaultConfig[STORAGE_KEY]?.colors || DEFAULT_CONFIG.colors;
                CONFIG.colors = [...defaultColors];
                // advance中的修改只保存到临时配置，不影响options
                saveSessionConfig();
                showSuccessToast(t('saved'));
            updateColorStyles();
            renderAdvPanel();
            } catch (e) {
                console.error('[Super Find Bar] Failed to reset colors:', e);
            }
        };
        colorGrid.appendChild(btnResetColors);
        
        colorRow.append(colorLbl, colorGrid);
        grpSearch.appendChild(colorRow);

        // Group 3: 外观和布局
        const grpLayout = document.createElement('div');
        const layoutTitle = document.createElement('div');
        layoutTitle.className = 'sf-group-title';
        layoutTitle.textContent = CONFIG.lang === 'zh' ? '外观和布局' : 'Appearance & Layout';
        grpLayout.appendChild(layoutTitle);

        // 坐标轴位置
        const coordRow = document.createElement('div');
        coordRow.className = 'sf-adv-row';
        const coordLbl = document.createElement('span');
        coordLbl.className = 'sf-adv-lbl';
        coordLbl.textContent = CONFIG.lang === 'zh' ? '坐标轴位置' : 'Axis Position';
        
        const coordCtrl = document.createElement('div');
        coordCtrl.style.display = 'flex';
        coordCtrl.style.flexDirection = 'column';
        coordCtrl.style.gap = '4px';
        coordCtrl.style.marginLeft = 'auto';
        
        // X 轴位置（包含显示开关）
        const xAxisCtrl = document.createElement('div');
        xAxisCtrl.style.display = 'flex';
        xAxisCtrl.style.gap = '6px';
        xAxisCtrl.style.alignItems = 'center';
        const xAxisLabel = document.createElement('span');
        xAxisLabel.textContent = CONFIG.lang === 'zh' ? 'X轴:' : 'X:';
        xAxisLabel.style.fontSize = '9px';
        xAxisLabel.style.minWidth = '28px'; // 与Y轴标签对齐
        const xAxisTop = document.createElement('label');
        xAxisTop.style.display = 'flex';
        xAxisTop.style.alignItems = 'center';
        xAxisTop.style.gap = '2px';
        xAxisTop.style.fontSize = '9px';
        xAxisTop.style.cursor = 'pointer';
        const radioXTop = document.createElement('input');
        radioXTop.type = 'radio';
        radioXTop.name = 'x-axis-adv';
        radioXTop.value = 'top';
        radioXTop.checked = CONFIG.coordinates.xPosition === 'top';
        radioXTop.style.width = '9px';
        radioXTop.style.height = '9px';
        radioXTop.onchange = () => {
            CONFIG.coordinates.xPosition = 'top';
            // advance中的修改只保存到临时配置，不影响options
            saveSessionConfig();
            updateTickBarPositions();
        };
        xAxisTop.append(radioXTop, document.createTextNode(CONFIG.lang === 'zh' ? '顶部' : 'Top'));
        const xAxisBottom = document.createElement('label');
        xAxisBottom.style.display = 'flex';
        xAxisBottom.style.alignItems = 'center';
        xAxisBottom.style.gap = '2px';
        xAxisBottom.style.fontSize = '9px';
        xAxisBottom.style.cursor = 'pointer';
        const radioXBottom = document.createElement('input');
        radioXBottom.type = 'radio';
        radioXBottom.name = 'x-axis-adv';
        radioXBottom.value = 'bottom';
        radioXBottom.checked = CONFIG.coordinates.xPosition === 'bottom';
        radioXBottom.style.width = '9px';
        radioXBottom.style.height = '9px';
        radioXBottom.onchange = () => {
            CONFIG.coordinates.xPosition = 'bottom';
            // advance中的修改只保存到临时配置，不影响options
            saveSessionConfig();
            showSuccessToast(t('saved'));
            updateTickBarPositions();
        };
        xAxisBottom.append(radioXBottom, document.createTextNode(CONFIG.lang === 'zh' ? '底部' : 'Bottom'));
        // X轴显示开关（放在底部选项后面）
        const xAxisShowSwitch = createCompactSwitch(CONFIG.coordinates.showXAxis, (e) => {
            CONFIG.coordinates.showXAxis = e.target.checked;
            // advance中的修改只保存到临时配置，不影响options
            saveSessionConfig();
            showSuccessToast(t('saved'));
            drawTickBar();
        });
        xAxisCtrl.append(xAxisLabel, xAxisTop, xAxisBottom, xAxisShowSwitch.wrapper);
        
        // Y 轴位置（包含显示开关）
        const yAxisCtrl = document.createElement('div');
        yAxisCtrl.style.display = 'flex';
        yAxisCtrl.style.gap = '6px';
        yAxisCtrl.style.alignItems = 'center';
        const yAxisLabel = document.createElement('span');
        yAxisLabel.textContent = CONFIG.lang === 'zh' ? 'Y轴:' : 'Y:';
        yAxisLabel.style.fontSize = '9px';
        yAxisLabel.style.minWidth = '28px'; // 与X轴标签对齐
        const yAxisLeft = document.createElement('label');
        yAxisLeft.style.display = 'flex';
        yAxisLeft.style.alignItems = 'center';
        yAxisLeft.style.gap = '2px';
        yAxisLeft.style.fontSize = '9px';
        yAxisLeft.style.cursor = 'pointer';
        const radioYLeft = document.createElement('input');
        radioYLeft.type = 'radio';
        radioYLeft.name = 'y-axis-adv';
        radioYLeft.value = 'left';
        radioYLeft.checked = CONFIG.coordinates.yPosition === 'left';
        radioYLeft.style.width = '9px';
        radioYLeft.style.height = '9px';
        radioYLeft.onchange = () => {
            CONFIG.coordinates.yPosition = 'left';
            // advance中的修改只保存到临时配置，不影响options
            saveSessionConfig();
            showSuccessToast(t('saved'));
            updateTickBarPositions();
        };
        yAxisLeft.append(radioYLeft, document.createTextNode(CONFIG.lang === 'zh' ? '左侧' : 'Left'));
        const yAxisRight = document.createElement('label');
        yAxisRight.style.display = 'flex';
        yAxisRight.style.alignItems = 'center';
        yAxisRight.style.gap = '2px';
        yAxisRight.style.fontSize = '9px';
        yAxisRight.style.cursor = 'pointer';
        const radioYRight = document.createElement('input');
        radioYRight.type = 'radio';
        radioYRight.name = 'y-axis-adv';
        radioYRight.value = 'right';
        radioYRight.checked = CONFIG.coordinates.yPosition === 'right';
        radioYRight.style.width = '9px';
        radioYRight.style.height = '9px';
        radioYRight.onchange = () => {
            CONFIG.coordinates.yPosition = 'right';
            // advance中的修改只保存到临时配置，不影响options
            saveSessionConfig();
            showSuccessToast(t('saved'));
            updateTickBarPositions();
        };
        yAxisRight.append(radioYRight, document.createTextNode(CONFIG.lang === 'zh' ? '右侧' : 'Right'));
        // Y轴显示开关（放在右侧选项后面）
        const yAxisShowSwitch = createCompactSwitch(CONFIG.coordinates.showYAxis, (e) => {
            CONFIG.coordinates.showYAxis = e.target.checked;
            // advance中的修改只保存到临时配置，不影响options
            saveSessionConfig();
            showSuccessToast(t('saved'));
            drawTickBar();
        });
        yAxisCtrl.append(yAxisLabel, yAxisLeft, yAxisRight, yAxisShowSwitch.wrapper);
        
        coordCtrl.append(xAxisCtrl, yAxisCtrl);
        coordRow.append(coordLbl, coordCtrl);
        grpLayout.appendChild(coordRow);

        // 窗口位置
        const layoutRow = document.createElement('div');
        layoutRow.className = 'sf-adv-row';
        const layoutLbl = document.createElement('span');
        layoutLbl.className = 'sf-adv-lbl';
        layoutLbl.textContent = CONFIG.lang === 'zh' ? '窗口位置' : 'Window Position';

        const positionGrid = document.createElement('div');
        positionGrid.style.display = 'grid';
        positionGrid.style.gridTemplateColumns = '15px 15px minmax(50px, 1fr)';
        positionGrid.style.gridTemplateRows = 'repeat(2, 15px)';
        positionGrid.style.gap = '2px';

        const btnTL = document.createElement('div');
        btnTL.className = `sf-mini-btn ${CONFIG.layout.position === 'top-left' ? 'active' : ''}`;
        btnTL.title = CONFIG.lang === 'zh' ? '左上角' : 'Top Left';
        btnTL.textContent = 'TL';
        btnTL.style.fontSize = '7px';
        btnTL.style.fontWeight = '500';
        btnTL.style.display = 'flex';
        btnTL.style.alignItems = 'center';
        btnTL.style.justifyContent = 'center';
        btnTL.onclick = () => setPos('top-left', 'float');
        const btnTR = document.createElement('div');
        btnTR.className = `sf-mini-btn ${CONFIG.layout.position === 'top-right' ? 'active' : ''}`;
        btnTR.title = CONFIG.lang === 'zh' ? '右上角' : 'Top Right';
        btnTR.textContent = 'TR';
        btnTR.style.fontSize = '7px';
        btnTR.style.fontWeight = '500';
        btnTR.style.display = 'flex';
        btnTR.style.alignItems = 'center';
        btnTR.style.justifyContent = 'center';
        btnTR.onclick = () => setPos('top-right', 'float');
        const btnTop = document.createElement('div');
        btnTop.className = `sf-bar-btn ${CONFIG.layout.position === 'top' ? 'active' : ''}`;
        btnTop.textContent = CONFIG.lang === 'zh' ? '顶部' : 'TOP';
        btnTop.title = CONFIG.lang === 'zh' ? '顶部横条' : 'Top Bar';
        btnTop.style.fontSize = '7px';
        btnTop.style.fontWeight = '500';
        btnTop.onclick = () => setPos('top', 'bar');
        const btnBL = document.createElement('div');
        btnBL.className = `sf-mini-btn ${CONFIG.layout.position === 'bottom-left' ? 'active' : ''}`;
        btnBL.title = CONFIG.lang === 'zh' ? '左下角' : 'Bottom Left';
        btnBL.textContent = 'BL';
        btnBL.style.fontSize = '7px';
        btnBL.style.fontWeight = '500';
        btnBL.style.display = 'flex';
        btnBL.style.alignItems = 'center';
        btnBL.style.justifyContent = 'center';
        btnBL.onclick = () => setPos('bottom-left', 'float');
        const btnBR = document.createElement('div');
        btnBR.className = `sf-mini-btn ${CONFIG.layout.position === 'bottom-right' ? 'active' : ''}`;
        btnBR.title = CONFIG.lang === 'zh' ? '右下角' : 'Bottom Right';
        btnBR.textContent = 'BR';
        btnBR.style.fontSize = '7px';
        btnBR.style.fontWeight = '500';
        btnBR.style.display = 'flex';
        btnBR.style.alignItems = 'center';
        btnBR.style.justifyContent = 'center';
        btnBR.onclick = () => setPos('bottom-right', 'float');
        const btnBot = document.createElement('div');
        btnBot.className = `sf-bar-btn ${CONFIG.layout.position === 'bottom' ? 'active' : ''}`;
        btnBot.textContent = CONFIG.lang === 'zh' ? '底部' : 'BOT';
        btnBot.title = CONFIG.lang === 'zh' ? '底部横条' : 'Bottom Bar';
        btnBot.style.fontSize = '7px';
        btnBot.style.fontWeight = '500';
        btnBot.onclick = () => setPos('bottom', 'bar');

        positionGrid.append(btnTL, btnTR, btnTop, btnBL, btnBR, btnBot);
        layoutRow.append(layoutLbl, positionGrid);
        grpLayout.appendChild(layoutRow);

        // 显示右下角放大镜
        const launchBtnRow = document.createElement('div');
        launchBtnRow.className = 'sf-adv-row';
        const launchBtnLbl = document.createElement('span');
        launchBtnLbl.className = 'sf-adv-lbl';
        launchBtnLbl.textContent = CONFIG.lang === 'zh' ? '显示右下角放大镜' : 'Show Launch Button';
        const launchBtnSwitch = createCompactSwitch(CONFIG.layout.showLaunchBtn, (e) => {
            CONFIG.layout.showLaunchBtn = e.target.checked;
            // advance中的修改只保存到临时配置，不影响options
            saveSessionConfig();
            showSuccessToast(t('saved'));
            initLaunchBtn();
        });
        launchBtnRow.append(launchBtnLbl, launchBtnSwitch.wrapper);
        grpLayout.appendChild(launchBtnRow);

        // 主题颜色
        const themeRow = document.createElement('div');
        themeRow.className = 'sf-adv-row';
        const themeLbl = document.createElement('span');
        themeLbl.className = 'sf-adv-lbl';
        themeLbl.textContent = CONFIG.lang === 'zh' ? '主题颜色' : 'Theme Colors';
        
        const themeCtrl = document.createElement('div');
        themeCtrl.style.display = 'flex';
        themeCtrl.style.gap = '4px';
        themeCtrl.style.alignItems = 'center';
        
        const bgLabel = document.createElement('span');
        bgLabel.textContent = CONFIG.lang === 'zh' ? '背景' : 'BG';
        bgLabel.style.fontSize = '9px';
        const bgInp = document.createElement('input');
        bgInp.type = 'color';
        bgInp.value = CONFIG.theme.bg;
        bgInp.style.cssText = 'width:16px;height:16px;border:none;padding:0;cursor:pointer;border-radius:3px;';
        bgInp.onchange = e => {
            CONFIG.theme.bg = e.target.value;
            applyTheme();
            // advance中的修改只保存到临时配置，不影响options
            saveSessionConfig();
            showSuccessToast(t('saved'));
        };
        const txtLabel = document.createElement('span');
        txtLabel.textContent = CONFIG.lang === 'zh' ? '文字' : 'TXT';
        txtLabel.style.fontSize = '9px';
        const txtInp = document.createElement('input');
        txtInp.type = 'color';
        txtInp.value = CONFIG.theme.text;
        txtInp.style.cssText = 'width:16px;height:16px;border:none;padding:0;cursor:pointer;border-radius:3px;';
        txtInp.onchange = e => {
            CONFIG.theme.text = e.target.value;
            applyTheme();
            // advance中的修改只保存到临时配置，不影响options
            saveSessionConfig();
            showSuccessToast(t('saved'));
        };
        const opLabel = document.createElement('span');
        opLabel.textContent = CONFIG.lang === 'zh' ? '透明度' : 'OP';
        opLabel.style.fontSize = '9px';
        const opInp = document.createElement('input');
        opInp.type = 'range';
        opInp.min = '0.5';
        opInp.max = '1';
        opInp.step = '0.05';
        opInp.value = CONFIG.theme.opacity;
        opInp.style.width = '45px';
        opInp.style.height = '3px';
        opInp.oninput = e => {
            CONFIG.theme.opacity = e.target.value;
            applyTheme();
            // advance中的修改只保存到临时配置，不影响options
            saveSessionConfig();
            showSuccessToast(t('saved'));
        };
        
        themeCtrl.append(bgLabel, bgInp, txtLabel, txtInp, opLabel, opInp);
        themeRow.append(themeLbl, themeCtrl);
        grpLayout.appendChild(themeRow);

        // 语言切换（按钮形式）
        const langRow = document.createElement('div');
        langRow.className = 'sf-adv-row';
        const langLbl = document.createElement('span');
        langLbl.className = 'sf-adv-lbl';
        langLbl.textContent = CONFIG.lang === 'zh' ? '语言' : 'Language';
        
        const langSwitch = document.createElement('div');
        langSwitch.style.display = 'flex';
        langSwitch.style.gap = '3px';
        langSwitch.style.marginLeft = 'auto';
        const optZh = document.createElement('button');
        optZh.textContent = '中文';
        optZh.style.cssText = `padding:1px 6px;font-size:9px;border-radius:3px;border:1px solid rgba(255,255,255,0.3);background:${CONFIG.lang === 'zh' ? 'var(--sf-accent)' : 'rgba(255,255,255,0.1)'};cursor:pointer;height:18px;line-height:16px;`;
        optZh.onclick = () => switchLang('zh');
        const optEn = document.createElement('button');
        optEn.textContent = 'EN';
        optEn.style.cssText = `padding:1px 6px;font-size:9px;border-radius:3px;border:1px solid rgba(255,255,255,0.3);background:${CONFIG.lang === 'en' ? 'var(--sf-accent)' : 'rgba(255,255,255,0.1)'};cursor:pointer;height:18px;line-height:16px;`;
        optEn.onclick = () => switchLang('en');
        langSwitch.append(optZh, optEn);
        langRow.append(langLbl, langSwitch);
        grpLayout.appendChild(langRow);

        grid.append(grpTools, grpSearch, grpLayout);
        advPanel.append(grid);
    }

    function switchLang(l) {
        CONFIG.lang = l;
        saveSessionConfig(); // 使用会话存储，不持久化（advance 面板中的语言切换是临时的）
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
            // X轴位置自适应：当搜索栏在底部时，X轴无论选项是什么都自动去顶部，避免遮挡
            let xPosition = CONFIG.coordinates.xPosition;
            if (CONFIG.layout.mode === 'bar' && CONFIG.layout.position === 'bottom') {
                // 搜索栏在底部时，X轴强制去顶部
                xPosition = 'top';
            } else if (CONFIG.layout.mode === 'bar') {
                // 搜索栏在顶部时，X轴去底部
                xPosition = 'bottom';
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
                // 实时更新搜索结果：如果有搜索词，立即触发搜索
                if (input.value && input.value.trim() && !CONFIG.search.fuzzy && !state.manualMode) {
                    triggerSearch();
                } else if (!CONFIG.search.fuzzy && !state.manualMode && state.isDirty) {
                    triggerSearch();
                }
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
                let right = window.innerWidth - btnRect.right;
                if (right < 10) right = 10;
                advPanel.style.position = 'fixed';
                advPanel.style.right = right + 'px';
                advPanel.style.left = 'auto';
                
                // 根据搜索栏位置决定弹窗显示方向
                if (CONFIG.layout.position === 'top') {
                    // 搜索栏在顶部，弹窗显示在按钮下方
                    advPanel.style.top = (btnRect.bottom + 6) + 'px';
                    advPanel.style.bottom = 'auto';
                } else {
                    // 搜索栏在底部，弹窗显示在按钮上方
                    // btnRect.top 是按钮顶部距离窗口顶部的距离
                    // 弹窗底部应该在按钮顶部上方6px，即距离窗口顶部 (btnRect.top - 6)
                    // 转换为距离窗口底部：window.innerHeight - (btnRect.top - 6)
                    advPanel.style.bottom = (window.innerHeight - btnRect.top + 6) + 'px';
                    advPanel.style.top = 'auto';
                }
            } else {
                advPanel.style.cssText = '';
            }
        }
    }
    function setPos(pos, mode) {
        CONFIG.layout.position = pos; 
        CONFIG.layout.mode = mode; 
        // advance中的修改只保存到临时配置，不影响options
        saveSessionConfig();
        applyLayout();
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

    /********************
      智能刷新逻辑 (Smart Refresh Logic)
    ********************/

    // 启动DOM变化监听器
    function startMutationObserver() {
        // 如果已经有监听器在运行，不重复启动
        if (state.mutationObserver) return;
        
        // 重置重试计数
        state.refreshRetryCount = 0;
        
        state.mutationObserver = new MutationObserver((mutations) => {
            let hasNewText = false;
            
            mutations.forEach(mutation => {
                mutation.addedNodes.forEach(node => {
                    // 检测是否有新的文本节点或包含文本的元素
                    if (node.nodeType === Node.TEXT_NODE) {
                        hasNewText = true;
                    } else if (node.nodeType === Node.ELEMENT_NODE) {
                        // 检查元素是否包含文本内容
                        if (node.textContent && node.textContent.trim().length > 0) {
                            hasNewText = true;
                        }
                    }
                });
            });
            
            // 如果检测到新文本内容，触发刷新
            // 移除时间限制：只要搜索栏打开且有搜索结果，就应该响应内容变化
            if (hasNewText) {
                // 检查是否有搜索词（避免在搜索栏关闭时刷新）
                if (input && input.value.trim()) {
                    debouncedRefreshSearch('mutation');
                }
            }
        });
        
        // 监听document.body的所有子节点变化和子树变化
        state.mutationObserver.observe(document.body, {
            childList: true,
            subtree: true,
            characterData: false // 不监听文本内容变化，只监听节点添加
        });
        
        // 设置监听超时：30秒后自动停止（延长监听时间，确保能检测到延迟加载的内容）
        // 注意：监听器会在搜索栏关闭时自动停止，这里只是作为安全机制
        if (state.observeTimeout) {
            clearTimeout(state.observeTimeout);
        }
        state.observeTimeout = setTimeout(() => {
            stopMutationObserver();
        }, 30000); // 延长到30秒
    }

    // 停止DOM变化监听器
    function stopMutationObserver() {
        if (state.mutationObserver) {
            state.mutationObserver.disconnect();
            state.mutationObserver = null;
        }
        if (state.observeTimeout) {
            clearTimeout(state.observeTimeout);
            state.observeTimeout = null;
        }
        state.refreshRetryCount = 0;
    }

    // 防抖刷新搜索
    function debouncedRefreshSearch(source) {
        // 如果当前没有搜索词，不刷新
        if (!input || !input.value.trim()) return;
        
        // 清除之前的定时器
        if (state.refreshTimer) {
            clearTimeout(state.refreshTimer);
        }
        
        // 限制刷新频率：最小间隔300ms
        const now = Date.now();
        const timeSinceLastRefresh = now - state.lastSearchTime;
        const minInterval = 300;
        
        if (timeSinceLastRefresh < minInterval) {
            // 延迟执行，确保最小间隔
            state.refreshTimer = setTimeout(() => {
                refreshSearch(source);
            }, minInterval - timeSinceLastRefresh);
        } else {
            // 立即执行
            refreshSearch(source);
        }
    }

    // 刷新搜索
    async function refreshSearch(source) {
        // 限制重试次数：最多3次
        if (source === 'mutation' && state.refreshRetryCount >= 3) {
            stopMutationObserver();
            return;
        }
        
        if (source === 'mutation') {
            state.refreshRetryCount++;
        }
        
        // 记录刷新时间
        state.lastSearchTime = Date.now();
        
        // 延迟500ms等待页面内容加载完成
        await new Promise(r => setTimeout(r, 500));
        
        // 如果搜索词已清空，不刷新
        if (!input || !input.value.trim()) return;
        
        // 执行搜索（标记为自动刷新）
        const previousCount = state.ranges.length;
        await triggerSearch(true); // true表示这是自动刷新
        const currentCount = state.ranges.length;
        
        // 更新结果数量记录
        state.lastResultCount = currentCount;
        
        // 如果结果数量明显增加（增加10%以上），继续监听
        if (currentCount > previousCount * 1.1 && source === 'mutation') {
            // 结果增加了，继续监听可能的新内容（重新启动监听器，延长监听时间）
            startMutationObserver();
        } else if (source === 'mutation') {
            // 结果没有明显增加，但重试次数还没到上限，继续监听（重新启动延长监听时间）
            // 如果重试次数已到上限，会在下次refreshSearch时停止
            if (state.refreshRetryCount < 3) {
                startMutationObserver();
            }
        }
    }

    // 切换后检测是否需要刷新
    function checkAndRefreshAfterSwitch() {
        // 如果当前没有搜索结果，不需要刷新
        if (!state.ranges.length || !input.value.trim()) return;
        
        // 延迟300ms后检测（给页面加载时间）
        setTimeout(() => {
            // 切换后重新启动监听器，延长监听时间
            // 这样可以检测到切换后触发的页面加载
            startMutationObserver();
        }, 300);
    }

    async function triggerSearch(isAutoRefresh = false) {
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
        
        // 清除输入框高亮覆盖层
        document.querySelectorAll('.sf-input-highlight').forEach(el => {
            if (el._cleanup) el._cleanup();
            el.remove();
        });

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

        // 获取includeForcedHidden配置（从CONFIG中获取，不受pinned限制）
        const includeForcedHidden = CONFIG.search.includeForcedHidden || false;

        const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, {
            acceptNode: n => {
                const p = n.parentNode;

                // 注意：INPUT和TEXTAREA现在单独处理，不再在这里拒绝
                if(['SCRIPT','STYLE','NOSCRIPT','SELECT'].includes(p.tagName))
                    return NodeFilter.FILTER_REJECT;

                if(shadow && shadow.host && shadow.host.contains(p))
                    return NodeFilter.FILTER_REJECT;

                // 根据includeHidden和includeForcedHidden决定是否接受节点
                if (!cfg.includeHidden) {
                    // 默认搜索：只搜索可见内容
                    if (!isVisible(p, false)) {
                        return NodeFilter.FILTER_REJECT;
                    }
                } else {
                    // 包含隐藏元素：搜索自然隐藏的内容
                    // 如果元素是可见的，直接接受
                    if (isVisible(p, false)) {
                        return NodeFilter.FILTER_ACCEPT;
                    }
                    
                    // 检查是否是菜单类元素（需要特殊处理）
                    const tagName = p.tagName ? p.tagName.toLowerCase() : '';
                    const role = p.getAttribute('role') || '';
                    const className = p.className || '';
                    const isMenuElement = tagName === 'menu' || tagName === 'nav' || tagName === 'header' || 
                                         tagName === 'select' || tagName === 'option' ||
                                         role === 'menu' || role === 'navigation' || role === 'menubar' || role === 'menuitem' ||
                                         className.toLowerCase().includes('menu') || className.toLowerCase().includes('dropdown');
                    
                    // 如果是菜单类元素，即使父元素隐藏也允许搜索（因为菜单可以通过交互显示）
                    if (isMenuElement) {
                        // 检查元素本身是否被刻意隐藏
                        const style = window.getComputedStyle(p);
                        if (style.display === 'none' || style.visibility === 'hidden') {
                            // 菜单元素即使display:none也视为自然隐藏
                            return NodeFilter.FILTER_ACCEPT;
                        }
                    }
                    
                    // 如果元素是自然隐藏的，接受
                    if (isNaturallyHidden(p)) {
                        return NodeFilter.FILTER_ACCEPT;
                    }
                    // 如果元素是刻意隐藏的，且includeForcedHidden为true，接受
                    if (includeForcedHidden && !isVisible(p, false)) {
                        // 再次检查，使用includeForcedHidden参数
                        if (isVisible(p, true)) {
                            return NodeFilter.FILTER_ACCEPT;
                        }
                    }
                    // 其他情况拒绝
                    return NodeFilter.FILTER_REJECT;
                }

                return NodeFilter.FILTER_ACCEPT;
            }
        });
        const nodes = [];
        while(walker.nextNode()) nodes.push(walker.currentNode);
        
        // 初始化allRanges数组（必须在输入框处理之前声明）
        const allRanges = [];
        const MAX_HIGHLIGHTS = 1000;
        const BATCH_SIZE = 200;
        
        // 单独处理INPUT和TEXTAREA元素：搜索它们的value属性
        const inputElements = document.querySelectorAll('input[type="text"], input[type="search"], input:not([type]), textarea');
        for (const inputEl of inputElements) {
            if (abortSignal.abort || state.searchId !== currentId) break;
            
            // 跳过shadow DOM中的元素
            if (shadow && shadow.host && shadow.host.contains(inputEl)) continue;
            
            // 输入框的可见性检查：更宽松，主要检查display和visibility
            const inputStyle = window.getComputedStyle(inputEl);
            const isInputDisplayNone = inputStyle.display === 'none';
            const isInputVisibilityHidden = inputStyle.visibility === 'hidden';
            
            // 如果输入框是display:none或visibility:hidden，根据配置决定是否搜索
            if (isInputDisplayNone || isInputVisibilityHidden) {
                if (!cfg.includeHidden) {
                    // 默认搜索：跳过隐藏的输入框
                    continue;
                } else {
                    // 包含隐藏元素：如果允许搜索强制隐藏内容，则允许
                    if (!includeForcedHidden) {
                        continue;
                    }
                }
            }
            // 其他情况（如opacity:0、height:0等）都允许搜索，因为输入框的value属性仍然有效
            
            const inputValue = inputEl.value || '';
            if (!inputValue.trim()) continue;
            
            // 处理忽略重音符号
            const textForSearch = cfg.ignoreAccents ? inputValue.normalize("NFD").replace(/[\u0300-\u036f]/g, "") : inputValue;
            
            // 对每个搜索词进行匹配
            terms.forEach((termObj, termIdx) => {
                if (abortSignal.abort || state.searchId !== currentId) return;
                
                const termColor = CONFIG.colors[termIdx % CONFIG.colors.length];
                let matches = [];
                
                if (termObj.isRegex) {
                    try {
                        const re = new RegExp(termObj.text, cfg.matchCase ? 'g' : 'gi');
                        let m;
                        while ((m = re.exec(textForSearch)) !== null) {
                            matches.push({ s: m.index, e: re.lastIndex });
                        }
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
                            matches.push({ s: pos, e: pos + bestLen });
                            pos += bestLen - 1;
                        }
                    }
                } else {
                    const esc = s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                    const pattern = effectiveWholeWord ? `\\b${esc(termObj.text)}\\b` : esc(termObj.text);
                    const re = new RegExp(pattern, cfg.matchCase ? 'g' : 'gi');
                    let m;
                    while ((m = re.exec(textForSearch)) !== null) {
                        matches.push({ s: m.index, e: re.lastIndex });
                    }
                }
                
                // 为每个匹配创建高亮
                matches.forEach(match => {
                    if (allRanges.length >= MAX_HIGHLIGHTS) return;
                    
                    try {
                        // 对于INPUT和TEXTAREA，我们需要创建一个特殊的Range对象
                        // 由于value不在DOM中，我们创建一个临时的文本节点来模拟
                        // 但更好的方式是直接高亮整个输入框
                        
                        // 创建Range对象，指向输入框元素本身
                        // 注意：这不会高亮文本内容，但可以标记匹配的位置
                        const range = document.createRange();
                        range.selectNodeContents(inputEl);
                        
                        // 验证Range是否有效
                        const testRect = range.getBoundingClientRect();
                        if (testRect.width === 0 && testRect.height === 0) return;
                        
                        // 存储匹配信息，用于后续高亮
                        allRanges.push({
                            range: range,
                            color: termColor,
                            node: inputEl, // 存储输入框元素
                            isInput: true, // 标记为输入框
                            matchStart: match.s, // 匹配的起始位置
                            matchEnd: match.e, // 匹配的结束位置
                            inputValue: inputValue // 存储原始值
                        });
                    } catch(e) {
                        // Range创建失败，跳过
                    }
                });
            });
        }

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
                    // 验证文本节点是否仍然有效
                    if (!node || !node.parentNode) return;
                    
                    // 验证索引范围是否有效
                    const nodeText = node.textContent || '';
                    if (r.s < 0 || r.e > nodeText.length || r.s >= r.e) return;
                    
                    // 验证匹配的文本是否为空或仅包含空白字符
                    const matchedText = nodeText.substring(r.s, r.e).trim();
                    if (!matchedText || matchedText.length === 0) return;
                    
                    // 创建 Range 前再次检查父元素可见性（如果未启用包含隐藏内容）
                    if (!cfg.includeHidden) {
                        const parentEl = node.parentElement;
                        if (parentEl && !isVisible(parentEl, false)) return;
                    } else {
                        // 包含隐藏元素时，检查是否为自然隐藏或强制隐藏
                        const parentEl = node.parentElement;
                        if (parentEl) {
                            // 如果可见，直接通过
                            if (isVisible(parentEl, false)) {
                                // 继续处理
                            } else if (isNaturallyHidden(parentEl)) {
                                // 自然隐藏，通过
                            } else if (includeForcedHidden && isVisible(parentEl, true)) {
                                // 强制隐藏且允许搜索，通过
                            } else {
                                // 其他情况，拒绝
                                return;
                            }
                        }
                    }
                    
                    const range = document.createRange();
                    range.setStart(node, r.s);
                    range.setEnd(node, r.e);
                    
                    // 验证 Range 是否有效（检查是否能获取矩形）
                    const testRect = range.getBoundingClientRect();
                    if (testRect.width === 0 && testRect.height === 0) return;
                    
                    allRanges.push({
                        range: range,
                        color: r.c,
                        node: node
                    });
                } catch(e) {
                    // Range 创建失败，跳过
                }
            });

            nodes[i] = null;
        }

        if (abortSignal.abort || state.searchId !== currentId) {
            state.abortController = null;
            // 搜索被取消时，停止监听器
            stopMutationObserver();
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
        
        // 更新搜索结果数量和时间
        state.lastResultCount = allRanges.length;
        state.lastSearchTime = Date.now();
        
        // 如果是用户主动搜索（非自动刷新），启动智能刷新监听器
        if (!isAutoRefresh) {
        if (allRanges.length > 0) {
                // 启动DOM变化监听，检测页面内容加载
                startMutationObserver();
            go(1);
        } else {
                // 没有搜索结果，停止监听
                stopMutationObserver();
            drawTickBar();
            }
        } else {
            // 自动刷新：根据结果数量变化决定是否继续监听
            if (allRanges.length > 0) {
                go(1);
            } else {
                drawTickBar();
            }
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
            const inputHighlights = []; // 存储输入框高亮信息
            
            state.ranges.forEach(rangeData => {
                // 如果是输入框，特殊处理
                if (rangeData.isInput) {
                    inputHighlights.push(rangeData);
                    return;
                }
                
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
            
            // 处理输入框高亮：创建覆盖层
            if (inputHighlights.length > 0) {
                // 清除旧的输入框高亮
                document.querySelectorAll('.sf-input-highlight').forEach(el => el.remove());
                
                inputHighlights.forEach(rangeData => {
                    try {
                        const inputEl = rangeData.node;
                        if (!inputEl || !inputEl.parentNode) return;
                        
                        const rect = inputEl.getBoundingClientRect();
                        if (rect.width === 0 && rect.height === 0) return;
                        
                        // 创建高亮覆盖层（高亮整个输入框，因为精确计算文本位置很复杂）
                        const highlightOverlay = document.createElement('div');
                        highlightOverlay.className = 'sf-input-highlight';
                        highlightOverlay.style.cssText = `
                            position: fixed;
                            pointer-events: none;
                            z-index: 2147483645;
                            background: ${rangeData.color}30;
                            border: 2px solid ${rangeData.color};
                            border-radius: 4px;
                            box-shadow: 0 0 8px ${rangeData.color}60;
                        `;
                        
                        // 高亮整个输入框（简单但有效）
                        highlightOverlay.style.left = rect.left + 'px';
                        highlightOverlay.style.top = rect.top + 'px';
                        highlightOverlay.style.width = rect.width + 'px';
                        highlightOverlay.style.height = rect.height + 'px';
                        
                        document.body.appendChild(highlightOverlay);
                        
                        // 监听输入框位置变化，更新高亮位置
                        const updatePosition = () => {
                            const newRect = inputEl.getBoundingClientRect();
                            if (newRect.width > 0 && newRect.height > 0) {
                                highlightOverlay.style.left = newRect.left + 'px';
                                highlightOverlay.style.top = newRect.top + 'px';
                                highlightOverlay.style.width = newRect.width + 'px';
                                highlightOverlay.style.height = newRect.height + 'px';
                            }
                        };
                        
                        // 使用ResizeObserver和MutationObserver监听位置变化
                        const resizeObserver = new ResizeObserver(updatePosition);
                        resizeObserver.observe(inputEl);
                        
                        // 监听滚动事件更新位置
                        const scrollHandler = () => updatePosition();
                        window.addEventListener('scroll', scrollHandler, true);
                        
                        // 存储清理函数
                        highlightOverlay._cleanup = () => {
                            resizeObserver.disconnect();
                            window.removeEventListener('scroll', scrollHandler, true);
                        };
                    } catch(e) {
                        console.error('[Super Find Bar] Failed to highlight input:', e);
                    }
                });
            }
        } else {
            // 清除输入框高亮
            document.querySelectorAll('.sf-input-highlight').forEach(el => el.remove());
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
                    // 检查是否正在使用雷达定位，如果是则跳过滚动，避免冲突
                    if (!state.isRadarLocating) {
                    // 此时高亮已经渲染，立即滚动到位置
                    scrollToRangeImmediate(activeRange);
                    }
                    
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
            if (CONFIG.scroll.behavior === 'only-when-hidden') {
                // 仅当结果不在可视区域时才滚动
                const isOutOfView = rect.top < 0 || rect.bottom > window.innerHeight;
                if (!isOutOfView) return;
            }
            // behavior='always-center': 始终滚动到屏幕中间，避免被浮动元素遮挡
            
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
                    // X轴位置自适应：当搜索栏在底部时，X轴无论选项是什么都自动去顶部，避免遮挡
                    let xPos = CONFIG.coordinates.xPosition === 'bottom' ? 'bottom' : 'top';
                    if (CONFIG.layout.mode === 'bar' && CONFIG.layout.position === 'bottom') {
                        // 搜索栏在底部时，X轴强制去顶部
                        xPos = 'top';
                    } else if (CONFIG.layout.mode === 'bar') {
                        // 搜索栏在顶部时，X轴去底部
                        xPos = 'bottom';
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

    // 防抖检查隐藏状态的定时器
    let hiddenCheckTimer = null;

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

        // 先清除之前的隐藏检查定时器
        if (hiddenCheckTimer) {
            clearTimeout(hiddenCheckTimer);
            hiddenCheckTimer = null;
        }
        
        // 先更新UI和高亮，不立即检查隐藏状态
        toast.textContent = '';
        toast.classList.remove('visible');
        input.classList.remove('warn-hidden');
        highlightAll();
        updateUI();
        
        // 延迟检查隐藏状态，确保DOM已完全更新（使用双重RAF确保高亮渲染完成）
        requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                // 再次延迟50ms，确保所有渲染完成
                hiddenCheckTimer = setTimeout(() => {
        let isHidden = false;
        try {
            const rangeNode = currentRange.range.startContainer;
            const element = rangeNode.nodeType === Node.TEXT_NODE ? rangeNode.parentElement : rangeNode;
            isHidden = element ? !isVisible(element) : false;
        } catch(e) {
                        // 如果出错，不显示隐藏提示
                        isHidden = false;
                    }
                    
                    // 只有在确实隐藏时才显示提示
                    if (isHidden) {
                        toast.textContent = t('hiddenAlert');
                        toast.classList.add('visible');
                        input.classList.add('warn-hidden');
                    }
                    hiddenCheckTimer = null;
                }, 50);
            });
        });
        
        // 智能刷新：切换后检测是否需要刷新搜索结果
        checkAndRefreshAfterSwitch();
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

            // 停止智能刷新监听器
            stopMutationObserver();
            if (state.refreshTimer) {
                clearTimeout(state.refreshTimer);
                state.refreshTimer = null;
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



