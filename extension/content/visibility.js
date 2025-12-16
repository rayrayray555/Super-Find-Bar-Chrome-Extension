// Super Find Bar - 可见性判断模块
(function() {
    'use strict';

    window.SF_VISIBILITY = {
        isNaturallyHidden(el) {
            if (!el) return false;
            const style = window.getComputedStyle(el);

            const tagName = el.tagName ? el.tagName.toLowerCase() : '';
            const role = el.getAttribute('role') || '';
            // 使用 getAttribute('class') 兼容 HTML 和 SVG 元素
            // HTML 元素：className 是字符串；SVG 元素：className 是 SVGAnimatedString 对象
            const className = el.getAttribute('class') || '';
            const id = el.id || '';
            const ariaExpanded = el.getAttribute('aria-expanded');
            const dataToggle = el.getAttribute('data-toggle') || el.getAttribute('data-bs-toggle');

            // 1. 检测菜单、下拉框（元素本身）
            const isMenuContainer = tagName === 'menu' || tagName === 'nav' || tagName === 'header' ||
                role === 'menu' || role === 'navigation' || role === 'menubar' ||
                className.toLowerCase().includes('menu') || className.toLowerCase().includes('dropdown') ||
                id.toLowerCase().includes('menu') || id.toLowerCase().includes('dropdown');

            const isMenuItem = tagName === 'option' || tagName === 'menuitem' ||
                role === 'menuitem' || role === 'option' ||
                className.toLowerCase().includes('menu-item') || className.toLowerCase().includes('dropdown-item');

            // 2. 检测手风琴、折叠面板
            const isAccordion = className.toLowerCase().includes('accordion') || 
                className.toLowerCase().includes('collapse') ||
                className.toLowerCase().includes('collapsible') ||
                dataToggle === 'collapse' || dataToggle === 'accordion' ||
                role === 'region' && ariaExpanded === 'false';

            // 3. 检测标签页内容
            const isTabContent = className.toLowerCase().includes('tab-content') ||
                className.toLowerCase().includes('tab-pane') ||
                role === 'tabpanel';

            // 4. 检测 hover 显示的内容（通过类名、data 属性等）
            const isHoverContent = className.toLowerCase().includes('hover') ||
                className.toLowerCase().includes('hover-menu') ||
                className.toLowerCase().includes('dropdown-hover') ||
                className.toLowerCase().includes('tooltip') ||
                className.toLowerCase().includes('popover') ||
                el.getAttribute('data-hover') !== null ||
                el.getAttribute('data-tooltip') !== null ||
                el.getAttribute('data-popover') !== null;

            // 5. 检测常见的隐藏类名（这些类名通常用于临时隐藏，可以通过交互显示）
            const commonHideClasses = ['hidden', 'd-none', 'invisible', 'sr-only', 'visually-hidden', 
                'hide', 'hidden-element', 'not-visible', 'off-screen', 'screen-reader-only'];
            const hasHideClass = commonHideClasses.some(cls => {
                return className.toLowerCase().includes(cls.toLowerCase());
            });

            // 6. 关键改进：检查元素是否在菜单容器内（即使元素本身没有菜单标识）
            let isInMenuContainer = false;
            let parent = el.parentElement;
            let depth = 0;
            while (parent && parent !== document.body && depth < 10) {
                const parentTagName = parent.tagName ? parent.tagName.toLowerCase() : '';
                const parentRole = parent.getAttribute('role') || '';
                // 使用 getAttribute('class') 兼容 HTML 和 SVG 元素
                const parentClassName = parent.getAttribute('class') || '';
                const parentId = parent.id || '';
                
                // 检查父元素是否是菜单容器
                if (parentTagName === 'menu' || parentTagName === 'nav' || parentTagName === 'header' ||
                    parentRole === 'menu' || parentRole === 'navigation' || parentRole === 'menubar' ||
                    parentClassName.toLowerCase().includes('menu') || parentClassName.toLowerCase().includes('dropdown') ||
                    parentId.toLowerCase().includes('menu') || parentId.toLowerCase().includes('dropdown') ||
                    parentClassName.toLowerCase().includes('nav') || parentClassName.toLowerCase().includes('navbar')) {
                    isInMenuContainer = true;
                    break;
                }
                parent = parent.parentElement;
                depth++;
            }

            // 如果元素本身是菜单相关，或者元素在菜单容器内
            if (isMenuContainer || isMenuItem || isAccordion || isTabContent || isHoverContent || hasHideClass || isInMenuContainer) {
                // 检查元素是否被隐藏（display:none, visibility:hidden, opacity:0）
                if (style.display === 'none' || style.visibility === 'hidden' || parseFloat(style.opacity) === 0) {
                    return true;
                }
                
                // 检查元素是否在视口外或零尺寸（可能是通过 CSS 隐藏的菜单项）
                const rect = el.getBoundingClientRect();
                const isZeroSize = rect.width === 0 && rect.height === 0;
                const isOutOfViewport = (rect.right < 0 || rect.bottom < 0 || 
                    rect.left > (window.innerWidth || document.documentElement.clientWidth) || 
                    rect.top > (window.innerHeight || document.documentElement.clientHeight));
                
                // 如果在菜单容器内，且不可见（零尺寸或视口外），视为自然隐藏
                if (isInMenuContainer && (isZeroSize || isOutOfViewport)) {
                    return true;
                }
                
                // 如果元素本身是菜单项，且不可见，也视为自然隐藏
                if ((isMenuContainer || isMenuItem) && (isZeroSize || isOutOfViewport)) {
                    return true;
                }
            }

            // 6. 检测 max-height: 0 + overflow: hidden（折叠菜单）
            const maxHeight = style.maxHeight;
            const overflow = style.overflow || style.overflowY;
            if (maxHeight === '0px' && (overflow === 'hidden' || overflow === 'auto')) {
                return true;
            }

            // 7. 检测 height: 0 + overflow: hidden
            const height = style.height;
            if (height === '0px' && (overflow === 'hidden' || overflow === 'auto')) {
                return true;
            }

            // 8. 检测 transform: translateY(-100%) 或 translateX(-100%)（移出视口但未完全隐藏）
            const transform = style.transform || style.webkitTransform;
            if (transform && transform !== 'none') {
                if (transform.includes('translateY(-100%)') || transform.includes('translateX(-100%)')) {
                    return true;
                }
            }

            // 9. 检测 position: absolute/fixed 在视口外但父元素可见（滑动内容）
            const position = style.position;
            if (position === 'absolute' || position === 'fixed') {
                const rect = el.getBoundingClientRect();
                const viewportWidth = window.innerWidth || document.documentElement.clientWidth;
                const viewportHeight = window.innerHeight || document.documentElement.clientHeight;
                if ((rect.right < 0 || rect.bottom < 0 || rect.left > viewportWidth || rect.top > viewportHeight)) {
                    let parent = el.parentElement;
                    if (parent && parent !== document.body) {
                        const parentStyle = window.getComputedStyle(parent);
                        if (parentStyle.display !== 'none' && parentStyle.visibility !== 'hidden') {
                            return true;
                        }
                    }
                }
            }

            // 10. 检测 opacity: 0 但元素在 DOM 中（可能是 hover 显示的内容）
            const opacity = parseFloat(style.opacity);
            if (!isNaN(opacity) && opacity === 0) {
                // 如果元素有交互相关的标识（hover、tooltip、popover 等），视为自然隐藏
                if (isHoverContent || hasHideClass || isMenuContainer || isMenuItem) {
                    return true;
                }
                // 如果元素有父元素是 hover 相关的，也视为自然隐藏
                let parent = el.parentElement;
                let depth = 0;
                while (parent && parent !== document.body && depth < 5) {
                    const parentClassName = parent.className || '';
                    if (parentClassName.toLowerCase().includes('hover') || 
                        parentClassName.toLowerCase().includes('dropdown') ||
                        parentClassName.toLowerCase().includes('menu')) {
                        return true;
                    }
                    parent = parent.parentElement;
                    depth++;
                }
            }

            return false;
        },

        isVisible(el, includeForcedHidden = false, HOST_ID, BTN_ID) {
            if (!el) return false;
            if (el.id === HOST_ID || el.id === BTN_ID || el.closest('#' + HOST_ID)) return false;

            const style = window.getComputedStyle(el);

            if (style.display === 'none' || style.visibility === 'hidden') {
                return includeForcedHidden;
            }

            const opacity = parseFloat(style.opacity);
            if (isNaN(opacity) || opacity === 0) {
                return includeForcedHidden;
            }

            const clipPath = style.clipPath || style.webkitClipPath;
            if (clipPath && (clipPath.includes('inset(100%)') || clipPath.includes('inset(100% 100%)'))) {
                return includeForcedHidden;
            }

            const transform = style.transform || style.webkitTransform;
            if (transform && transform !== 'none') {
                if (transform.includes('scale(0') || transform.includes('scaleX(0') || transform.includes('scaleY(0')) {
                    return includeForcedHidden;
                }
                const translateMatch = transform.match(/translate[XY]\(([^)]+)\)/);
                if (translateMatch) {
                    const translateValue = parseFloat(translateMatch[1]);
                    if (Math.abs(translateValue) > 10000) return includeForcedHidden;
                }
            }

            const rect = el.getBoundingClientRect();
            if (rect.width === 0 || rect.height === 0) return false;

            const position = style.position;
            if (position === 'absolute' || position === 'fixed') {
                const viewportWidth = window.innerWidth || document.documentElement.clientWidth;
                const viewportHeight = window.innerHeight || document.documentElement.clientHeight;
                if (rect.right < 0 || rect.bottom < 0 || rect.left > viewportWidth || rect.top > viewportHeight) {
                    return false;
                }
            }

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

            if (el.nodeType === Node.TEXT_NODE) {
                const text = el.textContent.trim();
                if (!text || text.length === 0) return false;
            } else if (el.nodeType === Node.ELEMENT_NODE) {
                const text = el.textContent.trim();
                if (!text || text.length === 0) {
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
    };
})();

