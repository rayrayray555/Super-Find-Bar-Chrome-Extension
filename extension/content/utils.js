// Super Find Bar - 工具函数模块
(function() {
    'use strict';

    window.SF_UTILS = {
        isCJK(str) {
            return /[\u4e00-\u9fa5]/.test(str);
        },

        findScrollContainer(element) {
            let current = element;
            for (let i = 0; i < 20; i++) {
                if (!current || current === document.body || current === document.documentElement) {
                    break;
                }
                const style = window.getComputedStyle(current);
                const isScrollable = style.overflow === 'auto' || style.overflow === 'scroll' ||
                    style.overflowY === 'auto' || style.overflowY === 'scroll';
                if (isScrollable && current.scrollHeight > current.clientHeight) {
                    return current;
                }
                current = current.parentElement;
            }
            return null;
        },

        levenshtein(s, t) {
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
        },

        isRangeValid(range) {
            try {
                const rect = range.getBoundingClientRect();
                return rect !== null && rect !== undefined;
            } catch (e) {
                return false;
            }
        },

        showContentChangedWarning(toast, CONFIG) {
            const msg = CONFIG.lang === 'zh' ?
                '⚠️ 页面内容已变化，请重新搜索' :
                '⚠️ Page content changed, please search again';
            toast.textContent = msg;
            toast.classList.add('visible');
            setTimeout(() => toast.classList.remove('visible'), 3000);
        },

        detectSpecialPage(CONFIG) {
            const url = window.location.href;
            const host = window.location.hostname;

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
        },

        showSpecialPageWarning(toast, info) {
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
})();

