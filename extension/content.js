// Super Find Bar - Chrome Extension V1.0
// Content Script - 主入口文件
(function () {
    'use strict';

    // 使用模块化的配置和工具函数
    const HOST_ID = window.SF_CONFIG.HOST_ID;
    const BTN_ID = window.SF_CONFIG.BTN_ID;
    const STORAGE_KEY = window.SF_CONFIG.STORAGE_KEY;
    const DEFAULT_CONFIG = window.SF_CONFIG.DEFAULT_CONFIG;

    let CONFIG = { ...DEFAULT_CONFIG };

    // 使用模块化的配置加载函数
    async function loadConfig() {
        CONFIG = await window.SF_CONFIG.loadConfig();
    }

    async function saveConfig() {
        await window.SF_CONFIG.saveConfig(CONFIG);
        }

    async function saveSessionConfig() {
        await window.SF_CONFIG.saveSessionConfig(CONFIG);
    }

    function t(path) {
        return window.SF_CONFIG.t(CONFIG, path);
    }

    /********************
      2. 核心逻辑 (Core Logic) - 使用模块化工具函数
    ********************/

    /********************
      2. 核心逻辑 (Core Logic) - 使用模块化工具函数
    ********************/

    // 使用模块化的工具函数（如果模块未加载，使用后备函数）
    const isCJK = window.SF_UTILS?.isCJK || ((str) => /[\u4e00-\u9fa5]/.test(str));
    const findScrollContainer = window.SF_UTILS?.findScrollContainer || function(element) {
        let current = element;
        for (let i = 0; i < 20; i++) {
            if (!current || current === document.body || current === document.documentElement) break;
            const style = window.getComputedStyle(current);
            const isScrollable = style.overflow === 'auto' || style.overflow === 'scroll' || 
                                 style.overflowY === 'auto' || style.overflowY === 'scroll';
            if (isScrollable && current.scrollHeight > current.clientHeight) return current;
            current = current.parentElement;
        }
        return null;
    };
    const levenshtein = window.SF_UTILS?.levenshtein || function(s, t) {
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
    };
    const isRangeValid = window.SF_UTILS?.isRangeValid || function(range) {
        try {
            const rect = range.getBoundingClientRect();
            return rect !== null && rect !== undefined;
        } catch (e) {
            return false;
        }
    };
    const showContentChangedWarning = function() {
        if (window.SF_UTILS?.showContentChangedWarning) {
            window.SF_UTILS.showContentChangedWarning(toast, CONFIG);
        } else {
            const msg = CONFIG.lang === 'zh' ? '⚠️ 页面内容已变化，请重新搜索' : '⚠️ Page content changed, please search again';
        toast.textContent = msg;
        toast.classList.add('visible');
        setTimeout(() => toast.classList.remove('visible'), 3000);
    }
    };
    const detectSpecialPage = function() {
        return window.SF_UTILS?.detectSpecialPage ? window.SF_UTILS.detectSpecialPage(CONFIG) : null;
    };
    const showSpecialPageWarning = function(info) {
        if (window.SF_UTILS?.showSpecialPageWarning) {
            window.SF_UTILS.showSpecialPageWarning(toast, info);
        } else {
        toast.textContent = info.message;
        toast.classList.add('visible');
            toast.style.whiteSpace = 'pre-line';
        toast.style.maxWidth = '400px';
        toast.style.textAlign = 'left';
        setTimeout(() => {
            toast.classList.remove('visible');
            toast.style.whiteSpace = '';
            toast.style.maxWidth = '';
            toast.style.textAlign = '';
        }, 5000);
    }
    };

    // 使用模块化的可见性判断函数（如果模块未加载，使用后备函数）
    const isNaturallyHidden = function(el) {
        if (window.SF_VISIBILITY?.isNaturallyHidden) {
            return window.SF_VISIBILITY.isNaturallyHidden(el);
        }
        // 后备实现（简化版）
        if (!el) return false;
        const style = window.getComputedStyle(el);
        const tagName = el.tagName ? el.tagName.toLowerCase() : '';
        const className = el.className || '';
        if (tagName === 'menu' || tagName === 'nav' || className.toLowerCase().includes('menu') || className.toLowerCase().includes('dropdown')) {
            if (style.display === 'none' || style.visibility === 'hidden') return true;
        }
        const maxHeight = style.maxHeight;
        const overflow = style.overflow || style.overflowY;
        if (maxHeight === '0px' && (overflow === 'hidden' || overflow === 'auto')) return true;
        if (style.height === '0px' && (overflow === 'hidden' || overflow === 'auto')) return true;
        return false;
    };
    const isVisible = function(el, includeForcedHidden = false) {
        if (window.SF_VISIBILITY?.isVisible) {
            return window.SF_VISIBILITY.isVisible(el, includeForcedHidden, HOST_ID, BTN_ID);
        }
        // 后备实现（简化版）
        if (!el) return false;
        if (el.id === HOST_ID || el.id === BTN_ID || el.closest('#' + HOST_ID)) return false;
        const style = window.getComputedStyle(el);
        if (style.display === 'none' || style.visibility === 'hidden') return includeForcedHidden;
        const opacity = parseFloat(style.opacity);
        if (isNaN(opacity) || opacity === 0) return includeForcedHidden;
        const rect = el.getBoundingClientRect();
        if (rect.width === 0 || rect.height === 0) return false;
        return true;
    };

    /********************
      3. UI 构建 (UI Construction)
    ********************/

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
        refreshRetryCount: 0,
        // 切换相关状态
        switchRefreshTimer: null,
        // 自动刷新标志（用于区分用户主动操作和自动刷新）
        isAutoRefreshing: false,
        // 页面加载状态监测
        pageLoadStatus: 'loading', // 'loading' | 'complete'
        searchCompleteStatus: 'incomplete', // 'incomplete' | 'complete'
        lastContentChangeTime: 0,
        stableSearchCheckTimer: null
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
                transition: border-color 0.2s, background-color 0.3s; font-size: 12px;
            }
            input[type="text"]:focus { border-color: var(--sf-accent); }
            input[type="text"].warn-hidden { border-color: var(--sf-accent); border-style: dashed; }
            /* 加载状态提示：浅红色表示还在加载，浅绿色表示加载完成 */
            input[type="text"].status-loading { 
                background: rgba(255, 87, 34, 0.15) !important; /* 浅红色 */
            }
            input[type="text"].status-complete { 
                background: rgba(76, 175, 80, 0.15) !important; /* 浅绿色 */
            }

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
                // 检测目标元素是否为隐藏的菜单/下拉框/手风琴，如果是则尝试展开
                let shouldExpand = false;
                let expandTarget = null;
                
                if (currentRange.isInput) {
                    // 输入框类型：检查输入框的父元素
                    expandTarget = currentRange.node.parentElement;
                } else {
                    // 普通文本节点：获取包含文本的元素
                    const container = lockedRange.startContainer.nodeType === Node.TEXT_NODE
                        ? lockedRange.startContainer.parentElement
                        : lockedRange.startContainer;
                    expandTarget = container;
                }
                
                // 检查是否需要展开
                if (expandTarget) {
                    // 检查元素是否被隐藏（自然隐藏或强制隐藏）
                    const isHidden = !isVisible(expandTarget, false);
                    const isNaturallyHiddenEl = isNaturallyHidden(expandTarget);
                    
                    if (isHidden || isNaturallyHiddenEl) {
                        shouldExpand = true;
                    }
                }
                
                // 如果需要展开，尝试触发展开操作
                if (shouldExpand && expandTarget) {
                    try {
                        // 方法1：查找可点击的父元素（但不包括链接，因为链接会触发页面跳转）
                        // 对于链接，我们只触发 mouseenter/focus 事件来展开菜单，而不点击
                        const clickableParent = expandTarget.closest('button, [role="button"], [onclick], .dropdown-toggle, [data-toggle], [data-bs-toggle]');
                        if (clickableParent && clickableParent.tagName !== 'A') {
                            // 非链接元素：可以安全点击
                            clickableParent.click();
                            shouldExpand = false; // 已触发，不需要其他方法
                        } else {
                            // 检查是否是链接，如果是链接，只触发 mouseenter/focus，不点击
                            const linkParent = expandTarget.closest('a');
                            if (linkParent) {
                                // 对于链接，触发 mouseenter 和 focus 事件来展开菜单，但不触发点击
                                const mouseenterEvent = new MouseEvent('mouseenter', {
                                    bubbles: true,
                                    cancelable: true,
                                    view: window
                                });
                                linkParent.dispatchEvent(mouseenterEvent);
                                
                                const focusEvent = new FocusEvent('focus', {
                                    bubbles: true,
                                    cancelable: true,
                                    view: window
                                });
                                linkParent.dispatchEvent(focusEvent);
                                
                                // 如果链接有父菜单容器，也尝试触发父容器的 mouseenter
                                const menuContainer = linkParent.closest('nav, [role="menu"], [role="navigation"], .menu, .dropdown, .navbar');
                                if (menuContainer && menuContainer !== linkParent) {
                                    const containerMouseenter = new MouseEvent('mouseenter', {
                                        bubbles: true,
                                        cancelable: true,
                                        view: window
                                    });
                                    menuContainer.dispatchEvent(containerMouseenter);
                                }
                                
                                shouldExpand = false; // 已触发，不需要其他方法
                            }
                        }
                        
                        // 方法2：设置 aria-expanded 属性（适用于可访问性菜单）
                        if (shouldExpand && expandTarget.hasAttribute('aria-expanded')) {
                            expandTarget.setAttribute('aria-expanded', 'true');
                            shouldExpand = false;
                        }
                        
                        // 方法3：添加常见的展开类名（适用于 Bootstrap 等框架）
                        if (shouldExpand) {
                            const commonExpandClasses = ['open', 'active', 'show', 'expanded', 'visible'];
                            for (const className of commonExpandClasses) {
                                if (expandTarget.classList.contains(className.replace('expanded', '')) || 
                                    expandTarget.parentElement?.classList.contains(className)) {
                                    expandTarget.classList.add(className);
                                    expandTarget.parentElement?.classList.add(className);
                                    shouldExpand = false;
                                    break;
                                }
                            }
                        }
                        
                        // 方法4：触发 mouseenter 事件（适用于 hover 菜单）
                        if (shouldExpand) {
                            const mouseenterEvent = new MouseEvent('mouseenter', {
                                bubbles: true,
                                cancelable: true,
                                view: window
                            });
                            expandTarget.dispatchEvent(mouseenterEvent);
                            
                            // 也尝试触发父菜单容器的 mouseenter
                            const menuContainer = expandTarget.closest('nav, [role="menu"], [role="navigation"], .menu, .dropdown, .navbar');
                            if (menuContainer && menuContainer !== expandTarget) {
                                const containerMouseenter = new MouseEvent('mouseenter', {
                                    bubbles: true,
                                    cancelable: true,
                                    view: window
                                });
                                menuContainer.dispatchEvent(containerMouseenter);
                            }
                        }
                    } catch (e) {
                        console.warn('[Super Find Bar] Failed to expand element:', e);
                    }
                }
                
                // 先滚动到该位置，确保range可见
                scrollToRangeImmediate(lockedRange);

                // 等待滚动完成后再显示涟漪（如果需要展开，延迟更长时间）
                const delay = shouldExpand ? 300 : 100;
                setTimeout(() => {
                    try {
                        let rippleLeft = 0;
                        let rippleTop = 0;

                        // 检查是否为输入框类型
                        if (currentRange.isInput) {
                            // 输入框类型：计算匹配文字的精确位置
                            const inputEl = currentRange.node;
                            if (!inputEl || !inputEl.parentNode) {
                                console.log('[Super Find Bar] Input element not found');
                                state.isRadarLocating = false;
                                return;
                            }

                            const rect = inputEl.getBoundingClientRect();
                            if (rect.width === 0 && rect.height === 0) {
                                console.log('[Super Find Bar] Input element has zero size');
                                state.isRadarLocating = false;
                                return;
                            }

                            // 计算匹配文字在输入框中的位置
                            const matchStart = currentRange.matchStart;
                            const matchEnd = currentRange.matchEnd;
                            const inputValue = currentRange.inputValue;
                            const matchedText = inputValue.substring(matchStart, matchEnd);
                            const textBeforeMatch = inputValue.substring(0, matchStart);

                            // 创建临时测量元素，获取输入框的样式
                            const tempSpan = document.createElement('span');
                            tempSpan.style.cssText = `
                                position: absolute;
                                visibility: hidden;
                                white-space: pre;
                                font-family: ${window.getComputedStyle(inputEl).fontFamily};
                                font-size: ${window.getComputedStyle(inputEl).fontSize};
                                font-weight: ${window.getComputedStyle(inputEl).fontWeight};
                                font-style: ${window.getComputedStyle(inputEl).fontStyle};
                                letter-spacing: ${window.getComputedStyle(inputEl).letterSpacing};
                                text-transform: ${window.getComputedStyle(inputEl).textTransform};
                            `;
                            document.body.appendChild(tempSpan);

                            // 测量匹配前文字的宽度
                            tempSpan.textContent = textBeforeMatch;
                            const textBeforeWidth = tempSpan.offsetWidth;

                            // 测量匹配文字的宽度
                            tempSpan.textContent = matchedText;
                            const matchTextWidth = tempSpan.offsetWidth;

                            // 清理临时元素
                            document.body.removeChild(tempSpan);

                            // 获取输入框的样式信息
                            const inputStyle = window.getComputedStyle(inputEl);
                            const paddingLeft = parseFloat(inputStyle.paddingLeft) || 0;
                            const paddingTop = parseFloat(inputStyle.paddingTop) || 0;
                            const borderLeft = parseFloat(inputStyle.borderLeftWidth) || 0;
                            const borderTop = parseFloat(inputStyle.borderTopWidth) || 0;
                            const lineHeight = parseFloat(inputStyle.lineHeight) || parseFloat(inputStyle.fontSize);

                            // 计算匹配文字的中心点坐标
                            const highlightLeft = rect.left + paddingLeft + borderLeft + textBeforeWidth;
                            const highlightTop = rect.top + paddingTop + borderTop;
                            rippleLeft = highlightLeft + matchTextWidth / 2;
                            rippleTop = highlightTop + parseFloat(lineHeight) / 2;
                        } else {
                            // 普通文本节点：使用 Range 的边界矩形
                            const rect = lockedRange.getBoundingClientRect();

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
            if (isNaN(v) || v < 0) v = 3000;
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
        if (cls) b.className = cls; return b;
    }
    function mkChk(key, label) {
        const l = document.createElement('label'); l.className = 'sf-chk';
        // 只有 pinned 数组中的选项才能被勾选，且读取当前勾选状态
        const c = document.createElement('input');
        c.type = 'checkbox';
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
        if (state.visible) root.classList.add('show');
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
        while (walker.nextNode()) count++;
        state.nodeCount = count;
        state.manualMode = count > CONFIG.search.perfThreshold;
        if (state.manualMode && !state.hasWarned) {
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

            // 如果检测到新文本内容，更新加载状态并触发刷新
            if (hasNewText) {
                // 更新内容变化时间
                state.lastContentChangeTime = Date.now();
                // 标记页面还在加载，搜索可能不完整
                updateLoadStatus('loading', 'incomplete');
                
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

        // 启动滚动事件监听器（用于懒加载页面）
        if (!state.scrollListener) {
            let scrollDebounceTimer = null;
            state.scrollListener = () => {
                // 清除之前的防抖定时器
                if (scrollDebounceTimer) {
                    clearTimeout(scrollDebounceTimer);
                }
                
                // 检查是否有搜索词（避免在搜索栏关闭时刷新）
                if (input && input.value.trim()) {
                    // 使用防抖（300ms）调用刷新
                    scrollDebounceTimer = setTimeout(() => {
                        debouncedRefreshSearch('scroll');
                        scrollDebounceTimer = null;
                    }, 300);
                }
            };
            
            // 监听滚动事件（使用 passive: true 优化性能）
            window.addEventListener('scroll', state.scrollListener, { passive: true, capture: true });
        }
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
        // 停止滚动事件监听器
        if (state.scrollListener) {
            window.removeEventListener('scroll', state.scrollListener, { capture: true });
            state.scrollListener = null;
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

        // 限制刷新频率：滚动触发使用更短的间隔（200ms），其他使用300ms
        const now = Date.now();
        const timeSinceLastRefresh = now - state.lastSearchTime;
        const minInterval = source === 'scroll' ? 200 : 300;

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

        // 如果正在切换高亮字段，延迟刷新，避免冲突
        if (state.switchRefreshTimer) {
            // 用户正在切换，延迟刷新
            return;
        }

        if (source === 'mutation') {
            state.refreshRetryCount++;
        }

        // 记录刷新时间
        state.lastSearchTime = Date.now();

        // 延迟等待页面内容加载完成：滚动触发使用更短的延迟（200ms），其他使用500ms
        const delay = source === 'scroll' ? 200 : 500;
        await new Promise(r => setTimeout(r, delay));

        // 如果搜索词已清空，不刷新
        if (!input || !input.value.trim()) return;

        // 如果正在切换高亮字段，不刷新（双重检查，避免冲突）
        if (state.switchRefreshTimer) {
            return;
        }

        // 执行搜索（标记为自动刷新）
        const previousCount = state.ranges.length;
        await triggerSearch(true); // true表示这是自动刷新
        const currentCount = state.ranges.length;

        // 更新结果数量记录
        state.lastResultCount = currentCount;
        
        // 更新内容变化时间（滚动触发的内容加载）
        if (source === 'scroll') {
            state.lastContentChangeTime = Date.now();
        }

        // 如果结果数量明显增加（增加10%以上），继续监听
        if (currentCount > previousCount * 1.1) {
            if (source === 'mutation') {
                // 结果增加了，继续监听可能的新内容（重新启动监听器，延长监听时间）
                startMutationObserver();
            } else if (source === 'scroll') {
                // 滚动触发的结果增加，也继续监听（重新启动监听器）
                startMutationObserver();
            }
        } else if (source === 'mutation') {
            // 结果没有明显增加，但重试次数还没到上限，继续监听（重新启动延长监听时间）
            // 如果重试次数已到上限，会在下次refreshSearch时停止
            if (state.refreshRetryCount < 3) {
                startMutationObserver();
            }
        } else if (source === 'scroll') {
            // 滚动触发的结果没有明显增加，也继续监听（用户可能继续滚动）
            startMutationObserver();
        }
    }

    /********************
      页面加载状态监测 (Page Load Status Monitoring)
    ********************/

    // 更新加载状态并更新输入框视觉提示
    function updateLoadStatus(pageStatus, searchStatus) {
        if (!input) return;
        
        // 更新状态
        if (pageStatus) state.pageLoadStatus = pageStatus;
        if (searchStatus) state.searchCompleteStatus = searchStatus;
        
        // 移除旧的状态类
        input.classList.remove('status-loading', 'status-complete');
        
        // 根据状态添加新的类
        // 如果页面还在加载或搜索不完整，显示浅红色
        if (state.pageLoadStatus === 'loading' || state.searchCompleteStatus === 'incomplete') {
            input.classList.add('status-loading');
        } else {
            // 页面已加载且搜索完整，显示浅绿色
            input.classList.add('status-complete');
        }
    }

    // 检查搜索稳定性（判断搜索是否完整）
    function checkSearchStability(previousCount, currentCount) {
        // 清除之前的定时器
        if (state.stableSearchCheckTimer) {
            clearTimeout(state.stableSearchCheckTimer);
        }
        
        // 如果结果数量增加了，说明还在加载新内容
        if (currentCount > previousCount) {
            // 标记搜索不完整
            updateLoadStatus(null, 'incomplete');
            // 重置定时器，等待结果稳定
            state.stableSearchCheckTimer = setTimeout(() => {
                // 2秒内没有新内容增加，认为搜索已稳定
                checkPageLoadComplete();
            }, 2000);
        } else if (currentCount === previousCount && currentCount > 0) {
            // 结果数量没有变化，可能已经稳定
            // 延迟检查，确保真的稳定了
            state.stableSearchCheckTimer = setTimeout(() => {
                checkPageLoadComplete();
            }, 2000);
        }
    }

    // 检查页面是否完全加载
    function checkPageLoadComplete() {
        const now = Date.now();
        const timeSinceLastChange = now - state.lastContentChangeTime;
        
        // 检查页面 readyState
        const isPageLoaded = document.readyState === 'complete';
        
        // 如果页面已加载，且3秒内没有新内容变化，认为页面已完全加载
        if (isPageLoaded && timeSinceLastChange > 3000) {
            updateLoadStatus('complete', 'complete');
        } else if (isPageLoaded && timeSinceLastChange > 1000) {
            // 页面已加载，但最近有新内容，搜索可能还不完整
            updateLoadStatus('complete', 'incomplete');
        } else {
            // 页面还在加载
            updateLoadStatus('loading', 'incomplete');
        }
    }

    // 初始化页面加载状态监测
    function initLoadStatusMonitoring() {
        // 初始状态：假设还在加载
        state.pageLoadStatus = document.readyState === 'complete' ? 'complete' : 'loading';
        state.searchCompleteStatus = 'incomplete';
        state.lastContentChangeTime = Date.now();
        
        // 监听页面加载事件
        if (document.readyState !== 'complete') {
            window.addEventListener('load', () => {
                state.pageLoadStatus = 'complete';
                // 延迟检查，给页面一些时间加载动态内容
                setTimeout(() => {
                    checkPageLoadComplete();
                }, 1000);
            }, { once: true });
        } else {
            // 页面已经加载完成，延迟检查
            setTimeout(() => {
                checkPageLoadComplete();
            }, 1000);
        }
        
        // 定期检查页面加载状态（每5秒检查一次）
        setInterval(() => {
            if (input && input.value.trim()) {
                checkPageLoadComplete();
            }
        }, 5000);
    }

    // 切换后检测是否需要刷新
    function checkAndRefreshAfterSwitch() {
        // 如果当前没有搜索结果，不需要刷新
        if (!state.ranges.length || !input.value.trim()) return;

        // 注意：切换时不要立即启动监听器，避免在切换过程中触发刷新
        // 只在用户停止切换一段时间后才启动监听器
        // 这个函数会在 go() 中被延迟调用（1秒后），所以这里不需要再次延迟
        if (state.mutationObserver) {
            // 如果监听器已存在，不重复启动（避免冲突）
            return;
        }
        // 启动监听器，但不会立即触发搜索（只有在检测到DOM变化时才会触发）
        startMutationObserver();
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
                    if (p) {
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

        // 自动刷新时：保存当前高亮信息，保持计数显示
        let preservedIdx = -1;
        let preservedRange = null;
        let preservedTotal = 0;
        if (isAutoRefresh && state.idx >= 0 && state.ranges && state.ranges.length > 0 && state.ranges[state.idx]) {
            preservedIdx = state.idx;
            preservedRange = state.ranges[state.idx].range;
            preservedTotal = state.ranges.length;
            // 不清空计数显示，保持显示当前序号和总数
        } else {
            // 手动搜索时：清空计数显示
            countDisplay.textContent = '';
        }

        state.ranges = [];
        state.idx = -1;
        if (tickBarX) tickBarX.innerHTML = '';
        if (tickBarY) tickBarY.innerHTML = '';
        toast.classList.remove('visible');
        input.classList.remove('warn-hidden');

        if (!val.trim()) {
            loadingInd.style.display = 'none';
            countDisplay.style.opacity = '1';
            state.abortController = null;
            return;
        }

        loadingInd.style.display = 'block';
        // 自动刷新时：保持计数显示可见，只降低透明度表示加载中
        if (isAutoRefresh && preservedIdx >= 0) {
            countDisplay.style.opacity = '0.6'; // 降低透明度表示正在刷新
        } else {
        countDisplay.style.opacity = '0';
        }

        // 实时搜索优先：只在必要时延迟
        // 对于小页面，立即搜索；对于超大页面，仅在页面未完全加载时等待
        if (!isAutoRefresh) {
            // 检查页面加载状态
            if (document.readyState !== 'complete') {
                // 页面未完全加载，等待 load 事件（但不强制延迟）
                await new Promise(resolve => {
                    if (document.readyState === 'complete') {
                        resolve();
                    } else {
                        window.addEventListener('load', resolve, { once: true });
                    }
                });
            }
            // 只在超大页面时延迟（避免卡住），小页面立即搜索
            if (state.nodeCount > CONFIG.search.perfThreshold) {
                // 超大页面：延迟 300ms 等待动态内容加载
                await new Promise(r => setTimeout(r, 300));
            }
            // 小页面：不延迟，立即搜索（保证实时性）
        } else {
        await new Promise(r => setTimeout(r, 0));
        }
        
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

        // 性能保护：添加超时机制（10秒）
        const searchStartTime = performance.now();
        const SEARCH_TIMEOUT = 10000; // 10秒超时
        let nodeCount = 0;
        const MAX_NODES = 50000; // 最大节点数限制，防止无限循环

        // 缓存 getComputedStyle 结果，避免重复计算
        const styleCache = new WeakMap();
        const getCachedStyle = (el) => {
            if (!styleCache.has(el)) {
                styleCache.set(el, window.getComputedStyle(el));
            }
            return styleCache.get(el);
        };

        const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, {
            acceptNode: n => {
                try {
                    // 性能保护：检查超时
                    if (performance.now() - searchStartTime > SEARCH_TIMEOUT) {
                        console.warn('[Super Find Bar] Search timeout, aborting');
                        abortSignal.abort = true;
                        return NodeFilter.FILTER_REJECT;
                    }

                    // 性能保护：限制节点数量
                    nodeCount++;
                    if (nodeCount > MAX_NODES) {
                        console.warn('[Super Find Bar] Too many nodes, aborting');
                        abortSignal.abort = true;
                        return NodeFilter.FILTER_REJECT;
                    }

                const p = n.parentNode;
                    if (!p) return NodeFilter.FILTER_REJECT;

                    // 注意：INPUT和TEXTAREA现在单独处理，不再在这里拒绝
                    if (['SCRIPT', 'STYLE', 'NOSCRIPT', 'SELECT'].includes(p.tagName))
                    return NodeFilter.FILTER_REJECT;

                    if (shadow && shadow.host && shadow.host.contains(p))
                    return NodeFilter.FILTER_REJECT;

                    // 根据includeHidden和includeForcedHidden决定是否接受节点
                    if (!cfg.includeHidden) {
                        // 默认搜索：只搜索可见内容
                        if (!isVisible(p, false)) {
                    return NodeFilter.FILTER_REJECT;
                        }
                        // 可见元素，接受
                        return NodeFilter.FILTER_ACCEPT;
                    } else {
                        // 包含隐藏元素：搜索可见元素 + 自然隐藏元素 + （可选）强制隐藏元素

                        // 1. 如果元素是可见的，直接接受（这是最重要的，确保可见元素不会被拒绝）
                        if (isVisible(p, false)) {
                return NodeFilter.FILTER_ACCEPT;
                        }
                        
                        // 2. 如果元素是自然隐藏的（菜单、手风琴等），接受
                        if (isNaturallyHidden(p)) {
                            return NodeFilter.FILTER_ACCEPT;
                        }
                        
                        // 2.5. 额外检查：如果元素在菜单容器内，且不可见，也应该接受（确保菜单项能被搜索到）
                        // 这是一个兜底检查，防止 isNaturallyHidden 漏掉某些菜单项
                        let checkParent = p.parentElement;
                        let parentDepth = 0;
                        while (checkParent && checkParent !== document.body && parentDepth < 10) {
                            const parentTagName = checkParent.tagName ? checkParent.tagName.toLowerCase() : '';
                            const parentRole = checkParent.getAttribute('role') || '';
                            const parentClassName = checkParent.className || '';
                            const parentId = checkParent.id || '';
                            
                            // 检查父元素是否是菜单容器
                            if (parentTagName === 'menu' || parentTagName === 'nav' || parentTagName === 'header' ||
                                parentRole === 'menu' || parentRole === 'navigation' || parentRole === 'menubar' ||
                                parentClassName.toLowerCase().includes('menu') || parentClassName.toLowerCase().includes('dropdown') ||
                                parentId.toLowerCase().includes('menu') || parentId.toLowerCase().includes('dropdown') ||
                                parentClassName.toLowerCase().includes('nav') || parentClassName.toLowerCase().includes('navbar')) {
                                // 元素在菜单容器内，且不可见，视为自然隐藏
                                return NodeFilter.FILTER_ACCEPT;
                            }
                            checkParent = checkParent.parentElement;
                            parentDepth++;
                        }
                        
                        // 3. 如果启用了强制隐藏搜索，且元素是强制隐藏的，接受
                        if (includeForcedHidden) {
                            // 使用缓存的样式，避免重复计算
                            const style = getCachedStyle(p);
                            // 强制隐藏：display:none, visibility:hidden
                            if (style.display === 'none' || style.visibility === 'hidden') {
                                return NodeFilter.FILTER_ACCEPT;
                            }
                            // opacity: 0 且不是自然隐藏的元素，视为强制隐藏
                            const opacity = parseFloat(style.opacity);
                            if (!isNaN(opacity) && opacity === 0 && !isNaturallyHidden(p)) {
                                return NodeFilter.FILTER_ACCEPT;
                            }
                            // clip-path 隐藏
                            const clipPath = style.clipPath || style.webkitClipPath;
                            if (clipPath && (clipPath.includes('inset(100%)') || clipPath.includes('inset(100% 100%)'))) {
                                return NodeFilter.FILTER_ACCEPT;
                            }
                        }
                        
                        // 其他情况拒绝（既不可见，也不是自然隐藏，也不是强制隐藏）
                        return NodeFilter.FILTER_REJECT;
                    }
                } catch (e) {
                    // 错误处理：捕获异常，避免中断搜索
                    console.warn('[Super Find Bar] Error in acceptNode:', e);
                    return NodeFilter.FILTER_REJECT;
                }
            }
        });
        const nodes = [];
        try {
            while (walker.nextNode()) {
                if (abortSignal.abort) break;
                // 再次检查超时
                if (performance.now() - searchStartTime > SEARCH_TIMEOUT) {
                    console.warn('[Super Find Bar] Search timeout during node collection');
                    abortSignal.abort = true;
                    break;
                }
                nodes.push(walker.currentNode);
            }
        } catch (e) {
            console.warn('[Super Find Bar] Error during node collection:', e);
            if (abortSignal.abort) {
                loadingInd.style.display = 'none';
                countDisplay.style.opacity = '1';
                state.abortController = null;
                return;
            }
        }

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
                    } catch (e) { }
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

                        // FIX: input/textarea cannot use selectNodeContents safely if they are void elements
                        // Use selectNode to target the element itself
                        range.selectNode(inputEl);

                        // 验证Range是否有效
                        const testRect = range.getBoundingClientRect();
                        const isZeroSize = testRect.width === 0 && testRect.height === 0;
                        
                        // 判断是否可高亮（输入框默认可高亮，除非是强制隐藏的）
                        let canHighlight = true;
                        
                        if (isZeroSize) {
                            // 零尺寸输入框：根据配置决定是否创建 Range
                            if (cfg.includeHidden && includeForcedHidden) {
                                // 强制隐藏的输入框：可以计数和雷达定位，但不能高亮
                                canHighlight = false;
                            } else {
                                // 未启用强制隐藏，拒绝零尺寸输入框
                                return;
                            }
                        } else if (cfg.includeHidden) {
                            // 启用"包含隐藏"时，检查输入框是否被强制隐藏
                            const inputStyle = window.getComputedStyle(inputEl);
                            if (inputStyle.display === 'none' || inputStyle.visibility === 'hidden') {
                                if (includeForcedHidden) {
                                    // 强制隐藏的输入框：不能高亮
                                    canHighlight = false;
                                } else {
                                    // 未启用强制隐藏，跳过
                                    return;
                                }
                            }
                            // 可见或自然隐藏的输入框：可以高亮
                        }

                        // 存储匹配信息，用于后续高亮
                        allRanges.push({
                            range: range,
                            color: termColor,
                            node: inputEl, // 存储输入框元素
                            isInput: true, // 标记为输入框
                            matchStart: match.s, // 匹配的起始位置
                            matchEnd: match.e, // 匹配的结束位置
                            inputValue: inputValue, // 存储原始值
                            canHighlight: canHighlight // 是否可以高亮
                        });
                    } catch (e) {
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
                    } catch (e) { }
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

                    // 注意：不再重复检查可见性，因为已经在 acceptNode 中检查过了
                    // 这样可以避免双重检查导致的不一致，提高搜索完整性

                    const range = document.createRange();
                    range.setStart(node, r.s);
                    range.setEnd(node, r.e);

                    // 验证 Range 是否有效（检查是否能获取矩形）
                    const testRect = range.getBoundingClientRect();
                    const isZeroSize = testRect.width === 0 && testRect.height === 0;

                    // 判断是否可高亮
                    let canHighlight = true;
                    
                    // 检查元素是否在菜单容器内（自然隐藏）
                    const parentEl = node.parentElement;
                    let isInMenuContainer = false;
                    if (parentEl) {
                        let checkParent = parentEl;
                        let parentDepth = 0;
                        while (checkParent && checkParent !== document.body && parentDepth < 10) {
                            const parentTagName = checkParent.tagName ? checkParent.tagName.toLowerCase() : '';
                            const parentRole = checkParent.getAttribute('role') || '';
                            const parentClassName = checkParent.className || '';
                            const parentId = checkParent.id || '';
                            
                            if (parentTagName === 'menu' || parentTagName === 'nav' || parentTagName === 'header' ||
                                parentRole === 'menu' || parentRole === 'navigation' || parentRole === 'menubar' ||
                                parentClassName.toLowerCase().includes('menu') || parentClassName.toLowerCase().includes('dropdown') ||
                                parentId.toLowerCase().includes('menu') || parentId.toLowerCase().includes('dropdown') ||
                                parentClassName.toLowerCase().includes('nav') || parentClassName.toLowerCase().includes('navbar')) {
                                isInMenuContainer = true;
                                break;
                            }
                            checkParent = checkParent.parentElement;
                            parentDepth++;
                        }
                    }
                    
                    if (isZeroSize) {
                        // 零尺寸元素：根据配置决定是否创建 Range
                        if (cfg.includeHidden) {
                            // 如果元素在菜单容器内（自然隐藏），即使零尺寸也可以高亮（展开后会显示）
                            if (isInMenuContainer || isNaturallyHidden(parentEl)) {
                                canHighlight = true;
                            } else if (includeForcedHidden) {
                                // 强制隐藏：可以计数和雷达定位，但不能高亮
                                canHighlight = false;
                            } else {
                                // 未启用强制隐藏，拒绝零尺寸 Range
                                return;
                            }
                        } else {
                            // 未启用包含隐藏，拒绝零尺寸 Range
                            return;
                        }
                    } else {
                        // 非零尺寸：根据配置判断是否可高亮
                        // 注意：可见性检查已在 acceptNode 中完成，这里只判断 canHighlight
                        if (cfg.includeHidden) {
                            if (parentEl && !isVisible(parentEl, false)) {
                                // 不可见元素：检查是否为强制隐藏
                                if (includeForcedHidden) {
                                    const style = window.getComputedStyle(parentEl);
                                    if (style.display === 'none' || style.visibility === 'hidden') {
                                        // 强制隐藏：不能高亮
                                        canHighlight = false;
                                    } else if (isNaturallyHidden(parentEl) || isInMenuContainer) {
                                        // 自然隐藏（包括菜单容器内的元素）：可以高亮
                                        canHighlight = true;
                                    } else {
                                        // 其他情况：可以高亮（已在 acceptNode 中接受）
                                        canHighlight = true;
                                    }
                                } else {
                                    // 未启用强制隐藏，但已在 acceptNode 中接受（应该是自然隐藏）
                                    canHighlight = true;
                                }
                            } else {
                                // 可见元素：可以高亮
                                canHighlight = true;
                            }
                        } else {
                            // 未启用包含隐藏：所有 Range 都可以高亮（已在 acceptNode 中过滤）
                            canHighlight = true;
                        }
                    }

                    allRanges.push({
                        range: range,
                        color: r.c,
                        node: node,
                        canHighlight: canHighlight
                    });
                } catch (e) {
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

        // 自动刷新时：尝试匹配之前的高亮，保持序号
        if (isAutoRefresh && preservedRange && preservedIdx >= 0) {
            // 尝试在结果中找到匹配的 Range
            let matchedIdx = -1;
            
            // 方法1：精确匹配 Range 的容器和偏移量
            try {
                if (preservedRange.startContainer && preservedRange.startOffset !== undefined) {
                    matchedIdx = allRanges.findIndex(r => {
                        if (!r.range) return false;
                        try {
                            return r.range.startContainer === preservedRange.startContainer &&
                                   r.range.startOffset === preservedRange.startOffset &&
                                   r.range.endContainer === preservedRange.endContainer &&
                                   r.range.endOffset === preservedRange.endOffset;
                        } catch (e) {
                            return false;
                        }
                    });
                }
            } catch (e) {
                // Range 可能已失效，继续尝试其他方法
            }
            
            // 方法2：如果精确匹配失败，尝试匹配文本内容和位置
            if (matchedIdx < 0 && preservedRange.startContainer) {
                try {
                    const preservedText = preservedRange.toString();
                    const preservedNode = preservedRange.startContainer;
                    
                    matchedIdx = allRanges.findIndex(r => {
                        if (!r.range) return false;
                        try {
                            // 比较文本内容和节点
                            const currentText = r.range.toString();
                            if (currentText === preservedText && r.range.startContainer === preservedNode) {
                                // 进一步比较偏移量（允许小范围误差）
                                const offsetDiff = Math.abs(r.range.startOffset - preservedRange.startOffset);
                                return offsetDiff <= 5; // 允许5个字符的误差
                            }
                            return false;
                        } catch (e) {
                            return false;
                        }
                    });
                } catch (e) {
                    // 匹配失败，继续
                }
            }
            
            // 如果找到匹配，保持当前序号；否则重置为第一个
            if (matchedIdx >= 0 && matchedIdx < allRanges.length) {
                state.idx = matchedIdx; // 保持当前序号
            } else {
                // 匹配失败，重置为第一个结果（如果有）
                state.idx = allRanges.length > 0 ? 0 : -1;
            }
        } else if (!isAutoRefresh) {
            // 手动搜索时：重置为第一个结果
            state.idx = allRanges.length > 0 ? 0 : -1;
        } else {
            // 自动刷新但没有保存的高亮：保持当前索引（如果有效）
            if (state.idx < 0 || state.idx >= allRanges.length) {
                state.idx = allRanges.length > 0 ? 0 : -1;
            }
        }

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
        const previousCount = state.lastResultCount;
        state.lastResultCount = allRanges.length;
        state.lastSearchTime = Date.now();
        
        // 检查搜索结果是否稳定（用于判断搜索是否完整）
        checkSearchStability(previousCount, allRanges.length);
        
        // 检查搜索结果是否稳定（用于判断搜索是否完整）
        checkSearchStability(previousCount, allRanges.length);

        // 如果是用户主动搜索（非自动刷新），启动智能刷新监听器
        if (!isAutoRefresh) {
        if (allRanges.length > 0) {
                // 启动DOM变化监听，检测页面内容加载
                startMutationObserver();
                // 保留当前索引（如果有），否则设置为第一个
                if (state.idx < 0 || state.idx >= allRanges.length) {
            go(1);
        } else {
                    // 保留当前索引，只更新高亮
                    highlightAll();
                    updateUI();
                }
            } else {
                // 没有搜索结果，停止监听
                stopMutationObserver();
            drawTickBar();
                // 没有搜索结果时，重置加载状态为默认
                updateLoadStatus('complete', 'complete');
        }
        } else {
            // 自动刷新：保留当前索引，不重置，不滚动
            state.isAutoRefreshing = true; // 设置自动刷新标志
            if (allRanges.length > 0) {
                // 如果当前索引仍然有效，保留；否则设置为 -1（不激活任何字段，避免滚动）
                if (state.idx >= 0 && state.idx < allRanges.length) {
                    // 保留当前索引，只更新高亮（不滚动）
                    highlightAll(true); // 传递 isAutoRefresh 参数
                    updateUI();
                } else {
                    // 索引无效时，设置为 -1，只更新高亮，不滚动
                    state.idx = -1;
                    highlightAll(true); // 传递 isAutoRefresh 参数
                    updateUI();
                }
            } else {
                // 没有结果，清除索引
                state.idx = -1;
                drawTickBar();
            }
            // 延迟清除自动刷新标志，确保所有异步操作（如 requestAnimationFrame）都能检测到
            // 使用 setTimeout 确保在下一个事件循环中清除，给所有 RAF 足够的时间
            setTimeout(() => {
                state.isAutoRefreshing = false;
            }, 100); // 100ms 足够让所有 RAF 完成
        }
    }

    function highlightAll(isAutoRefresh = false) {
        if (!state.supportsHighlight || !CSS.highlights) {
            drawTickBar();
            return;
        }

        // 保存自动刷新状态，避免在异步操作中状态被改变
        const shouldSkipScroll = isAutoRefresh || state.isAutoRefreshing;

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
                // 跳过不能高亮的 Range（强制隐藏的元素不参与高亮，但已计入总数）
                if (rangeData.canHighlight === false) {
                    return;
                }
                
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

                        // 计算匹配文字在输入框中的位置
                        const matchStart = rangeData.matchStart;
                        const matchEnd = rangeData.matchEnd;
                        const inputValue = rangeData.inputValue;
                        const matchedText = inputValue.substring(matchStart, matchEnd);
                        const textBeforeMatch = inputValue.substring(0, matchStart);

                        // 创建临时测量元素，获取输入框的样式
                        const tempSpan = document.createElement('span');
                        tempSpan.style.cssText = `
                            position: absolute;
                            visibility: hidden;
                            white-space: pre;
                            font-family: ${window.getComputedStyle(inputEl).fontFamily};
                            font-size: ${window.getComputedStyle(inputEl).fontSize};
                            font-weight: ${window.getComputedStyle(inputEl).fontWeight};
                            font-style: ${window.getComputedStyle(inputEl).fontStyle};
                            letter-spacing: ${window.getComputedStyle(inputEl).letterSpacing};
                            text-transform: ${window.getComputedStyle(inputEl).textTransform};
                        `;
                        document.body.appendChild(tempSpan);

                        // 测量匹配前文字的宽度
                        tempSpan.textContent = textBeforeMatch;
                        const textBeforeWidth = tempSpan.offsetWidth;

                        // 测量匹配文字的宽度
                        tempSpan.textContent = matchedText;
                        const matchTextWidth = tempSpan.offsetWidth;

                        // 清理临时元素
                        document.body.removeChild(tempSpan);

                        // 获取输入框的样式信息
                        const inputStyle = window.getComputedStyle(inputEl);
                        const paddingLeft = parseFloat(inputStyle.paddingLeft) || 0;
                        const paddingTop = parseFloat(inputStyle.paddingTop) || 0;
                        const borderLeft = parseFloat(inputStyle.borderLeftWidth) || 0;
                        const borderTop = parseFloat(inputStyle.borderTopWidth) || 0;
                        const lineHeight = parseFloat(inputStyle.lineHeight) || parseFloat(inputStyle.fontSize);

                        // 计算高亮位置（考虑 padding 和 border）
                        const highlightLeft = rect.left + paddingLeft + borderLeft + textBeforeWidth;
                        const highlightTop = rect.top + paddingTop + borderTop;
                        const highlightWidth = matchTextWidth;
                        const highlightHeight = lineHeight;

                        // 检查是否为当前激活的 Range
                        const isActive = rangeData === state.ranges[state.idx];

                        // 创建高亮覆盖层（只高亮匹配的文字部分）
                        const highlightOverlay = document.createElement('div');
                        highlightOverlay.className = 'sf-input-highlight';
                        
                        // 根据激活状态设置不同的样式
                        if (isActive) {
                            // 激活状态：橙色边框、更明显的背景色
                            highlightOverlay.style.cssText = `
                                position: fixed;
                                pointer-events: none;
                                z-index: 2147483645;
                                background: #ff572240;
                                border: 2px solid #ff5722;
                                border-radius: 2px;
                                box-shadow: 0 0 4px #ff572280, 0 0 8px #ff572240;
                            `;
                        } else {
                            // 普通状态：使用原始颜色
                            highlightOverlay.style.cssText = `
                                position: fixed;
                                pointer-events: none;
                                z-index: 2147483645;
                                background: ${rangeData.color}40;
                                border-radius: 2px;
                                box-shadow: 0 0 2px ${rangeData.color}80;
                            `;
                        }
                        
                        // 存储 rangeData 引用，用于后续更新激活状态
                        highlightOverlay._rangeData = rangeData;

                        highlightOverlay.style.left = highlightLeft + 'px';
                        highlightOverlay.style.top = highlightTop + 'px';
                        highlightOverlay.style.width = highlightWidth + 'px';
                        highlightOverlay.style.height = highlightHeight + 'px';

                        document.body.appendChild(highlightOverlay);

                        // 监听输入框位置和内容变化，更新高亮位置
                        const updatePosition = () => {
                            try {
                                const newRect = inputEl.getBoundingClientRect();
                                if (newRect.width === 0 && newRect.height === 0) {
                                    highlightOverlay.style.display = 'none';
                                    return;
                                }
                                highlightOverlay.style.display = '';

                                // 重新计算位置（输入框内容可能已变化）
                                const currentValue = inputEl.value || '';
                                if (currentValue !== inputValue) {
                                    // 内容已变化，尝试重新匹配
                                    const newMatchStart = currentValue.indexOf(matchedText, matchStart);
                                    if (newMatchStart !== -1) {
                                        const newTextBeforeMatch = currentValue.substring(0, newMatchStart);
                                        
                                        // 重新测量（获取输入框样式）
                                        const inputStyle = window.getComputedStyle(inputEl);
                                        const newTempSpan = document.createElement('span');
                                        newTempSpan.style.cssText = `
                                            position: absolute;
                                            visibility: hidden;
                                            white-space: pre;
                                            font-family: ${inputStyle.fontFamily};
                                            font-size: ${inputStyle.fontSize};
                                            font-weight: ${inputStyle.fontWeight};
                                            font-style: ${inputStyle.fontStyle};
                                            letter-spacing: ${inputStyle.letterSpacing};
                                            text-transform: ${inputStyle.textTransform};
                                        `;
                                        document.body.appendChild(newTempSpan);
                                        
                                        newTempSpan.textContent = newTextBeforeMatch;
                                        const newTextBeforeWidth = newTempSpan.offsetWidth;
                                        
                                        newTempSpan.textContent = matchedText;
                                        const newMatchTextWidth = newTempSpan.offsetWidth;
                                        
                                        document.body.removeChild(newTempSpan);

                                        const newHighlightLeft = newRect.left + paddingLeft + borderLeft + newTextBeforeWidth;
                                        const newHighlightTop = newRect.top + paddingTop + borderTop;

                                        highlightOverlay.style.left = newHighlightLeft + 'px';
                                        highlightOverlay.style.top = newHighlightTop + 'px';
                                        highlightOverlay.style.width = newMatchTextWidth + 'px';
                                    } else {
                                        // 匹配文字已不存在，隐藏高亮
                                        highlightOverlay.style.display = 'none';
                                    }
                                } else {
                                    // 内容未变化，只更新位置
                                    const newHighlightLeft = newRect.left + paddingLeft + borderLeft + textBeforeWidth;
                                    const newHighlightTop = newRect.top + paddingTop + borderTop;

                                    highlightOverlay.style.left = newHighlightLeft + 'px';
                                    highlightOverlay.style.top = newHighlightTop + 'px';
                                }
                            } catch (e) {
                                // 更新失败，忽略
                            }
                        };

                        // 使用ResizeObserver监听输入框大小变化
                        const resizeObserver = new ResizeObserver(updatePosition);
                        resizeObserver.observe(inputEl);

                        // 监听滚动事件更新位置
                        const scrollHandler = () => updatePosition();
                        window.addEventListener('scroll', scrollHandler, true);

                        // 监听输入框内容变化（MutationObserver 监听 value 属性变化）
                        const inputHandler = () => updatePosition();
                        inputEl.addEventListener('input', inputHandler);
                        inputEl.addEventListener('change', inputHandler);

                        // 存储清理函数
                        highlightOverlay._cleanup = () => {
                            resizeObserver.disconnect();
                            window.removeEventListener('scroll', scrollHandler, true);
                            inputEl.removeEventListener('input', inputHandler);
                            inputEl.removeEventListener('change', inputHandler);
                        };
                    } catch (e) {
                        console.error('[Super Find Bar] Failed to highlight input:', e);
                    }
                });
            }
        } else {
            // 清除输入框高亮
            document.querySelectorAll('.sf-input-highlight').forEach(el => el.remove());
        }

        // 更新所有输入框高亮的激活状态
        document.querySelectorAll('.sf-input-highlight').forEach(overlay => {
            if (overlay._rangeData) {
                const isActive = overlay._rangeData === state.ranges[state.idx];
                if (isActive) {
                    // 激活状态：橙色边框、更明显的背景色
                    overlay.style.background = '#ff572240';
                    overlay.style.border = '2px solid #ff5722';
                    overlay.style.boxShadow = '0 0 4px #ff572280, 0 0 8px #ff572240';
                } else {
                    // 普通状态：使用原始颜色
                    const color = overlay._rangeData.color;
                    overlay.style.background = `${color}40`;
                    overlay.style.border = 'none';
                    overlay.style.boxShadow = `0 0 2px ${color}80`;
                }
            }
        });

        // 设置当前激活的高亮并滚动
        if (state.idx > -1 && state.ranges[state.idx]) {
            const activeRangeData = state.ranges[state.idx];
            const activeRange = activeRangeData.range;
            
            // 对于输入框类型的 Range，跳过 CSS.highlights 设置（使用覆盖层样式）
            if (activeRangeData.isInput) {
                CSS.highlights.delete('sf-search-active');
            } else if (activeRangeData.canHighlight !== false) {
                // 只有可高亮的 Range 才设置激活高亮（强制隐藏的元素不能高亮，但能计数和雷达定位）
            const activeHighlight = new Highlight(activeRange);
            CSS.highlights.set('sf-search-active', activeHighlight);
            } else {
                // 强制隐藏的元素清除激活高亮，但仍然可以滚动定位（通过雷达）
                CSS.highlights.delete('sf-search-active');
            }

            // 使用双重 RAF 确保高亮已渲染完成
            // RAF #1: 进入浏览器的渲染队列
            requestAnimationFrame(() => {
                // RAF #2: 确保布局和绘制已完成
                requestAnimationFrame(() => {
                    // 检查是否正在使用雷达定位或自动刷新，如果是则跳过滚动，避免冲突
                    // 自动刷新时不应该滚动，保持用户当前的浏览位置
                    // 使用保存的状态，而不是全局状态（因为可能在异步操作中已被改变）
                    if (!state.isRadarLocating && !shouldSkipScroll) {
                        // 对于自然隐藏的元素（菜单、手风琴等），即使当前不可见，也尝试滚动到其位置
                        // 当用户展开菜单时，高亮会显示出来
                        // 对于强制隐藏的元素，滚动可能无效，但仍然尝试（主要用于雷达定位）
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
        // 双重保险：如果正在自动刷新，禁止滚动
        if (state.isAutoRefreshing) {
            return;
        }
        
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
        } catch (e) {
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
        
        if (!state.ranges.length) {
            if (tickBarX) tickBarX.style.display = 'none';
            if (tickBarY) tickBarY.style.display = 'none';
            return;
        }
        
        // 显示已启用的坐标轴
        if (CONFIG.coordinates.showXAxis && tickBarX) tickBarX.style.display = 'block';
        if (CONFIG.coordinates.showYAxis && tickBarY) tickBarY.style.display = 'block';
        
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
            } catch (e) {
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
    // 防抖切换定时器，避免快速切换时闪烁
    let goDebounceTimer = null;

    function go(dir) {
        if (!state.ranges.length) return;
        
        // 清除所有相关的定时器，避免冲突
        if (goDebounceTimer) {
            clearTimeout(goDebounceTimer);
            goDebounceTimer = null;
        }
        if (hiddenCheckTimer) {
            clearTimeout(hiddenCheckTimer);
            hiddenCheckTimer = null;
        }
        
        // 立即更新索引
        state.idx = (state.idx + dir + state.ranges.length) % state.ranges.length;

        // 验证当前 Range 是否仍然有效
        const currentRange = state.ranges[state.idx];
        if (!currentRange || !isRangeValid(currentRange.range)) {
            // Range 已失效，显示警告
            showContentChangedWarning();
            input.classList.add('warn-hidden');
            return;
        }

        // 立即更新UI（不延迟）
        toast.textContent = '';
        toast.classList.remove('visible');
        input.classList.remove('warn-hidden');
        updateUI();
        
        // 立即更新高亮（不使用防抖，避免闪烁）
        // 使用 RAF 确保在下一帧更新，但不要延迟太久
        if (goDebounceTimer !== null) {
            // goDebounceTimer 可能是 RAF ID 或 setTimeout ID，需要分别处理
            if (typeof goDebounceTimer === 'number' && goDebounceTimer > 1000000) {
                // 看起来是 RAF ID（通常很大）
                cancelAnimationFrame(goDebounceTimer);
            } else {
                // 看起来是 setTimeout ID
                clearTimeout(goDebounceTimer);
            }
        }
        goDebounceTimer = requestAnimationFrame(() => {
            highlightAll();
            goDebounceTimer = null;
        });

        // 延迟检查隐藏状态（不影响切换流畅性）
        hiddenCheckTimer = setTimeout(() => {
        let isHidden = false;
        try {
            const rangeNode = currentRange.range.startContainer;
            const element = rangeNode.nodeType === Node.TEXT_NODE ? rangeNode.parentElement : rangeNode;
            isHidden = element ? !isVisible(element) : false;
            } catch (e) {
                isHidden = false;
            }

            if (isHidden) {
                toast.textContent = t('hiddenAlert');
                toast.classList.add('visible');
                input.classList.add('warn-hidden');
            }
            hiddenCheckTimer = null;
        }, 100); // 延迟100ms检查隐藏状态，不影响切换

        // 注意：切换时不要立即启动刷新监听器，避免触发刷新导致闪烁
        // 只在用户停止切换一段时间后才启动监听器
        if (state.switchRefreshTimer) {
            clearTimeout(state.switchRefreshTimer);
        }
        state.switchRefreshTimer = setTimeout(() => {
            checkAndRefreshAfterSwitch();
            state.switchRefreshTimer = null;
        }, 1000); // 切换后1秒才启动刷新监听器，避免冲突
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
            
            // 更新加载状态（搜索框打开时）
            if (input.value && input.value.trim()) {
                // 有搜索词时，检查当前状态
                checkPageLoadComplete();
            } else {
                // 没有搜索词时，显示初始状态
                updateLoadStatus(state.pageLoadStatus, 'incomplete');
            }
            
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
                    if (p) { p.replaceChild(document.createTextNode(m.textContent), m); p.normalize(); }
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
        // 初始化页面加载状态监测
        initLoadStatusMonitoring();
    });

})();



