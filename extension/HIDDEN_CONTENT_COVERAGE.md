# 包含隐藏内容搜索 - 完整覆盖说明

## 当前检测的隐藏类型（已扩展）

### 自然隐藏（isNaturallyHidden）- 可高亮 ✅

这些内容在 DOM 中存在，但当前未显示，可以通过交互显示：

1. **菜单、下拉框**
   - 通过标签名（menu, nav, header）
   - 通过 role 属性（menu, navigation, menubar）
   - 通过类名/ID（包含 menu, dropdown）

2. **手风琴、折叠面板**
   - 通过类名（accordion, collapse, collapsible）
   - 通过 data-toggle 属性
   - 通过 role="region" 且 aria-expanded="false"

3. **标签页内容**
   - 通过类名（tab-content, tab-pane）
   - 通过 role="tabpanel"

4. **Hover 显示的内容** ✅ **新增**
   - 通过类名（hover, hover-menu, dropdown-hover, tooltip, popover）
   - 通过 data 属性（data-hover, data-tooltip, data-popover）

5. **常见的隐藏类名** ✅ **新增**
   - `.hidden`, `.d-none`, `.invisible`, `.sr-only`
   - `.visually-hidden`, `.hide`, `.hidden-element`
   - `.not-visible`, `.off-screen`, `.screen-reader-only`

6. **CSS 隐藏方式**
   - `max-height: 0` + `overflow: hidden`
   - `height: 0` + `overflow: hidden`
   - `transform: translateY(-100%)` 或 `translateX(-100%)`
   - `position: absolute/fixed` 在视口外但父元素可见

7. **opacity: 0 的交互内容** ✅ **新增**
   - 如果元素有 hover、menu、dropdown 等标识
   - 如果元素的父元素是 hover 相关的

### 强制隐藏（includeForcedHidden）- 不可高亮，只能计数和定位 ✅

这些内容是开发者刻意隐藏的：

1. **display: none**
2. **visibility: hidden**
3. **opacity: 0**（且不是自然隐藏的元素）✅ **新增**
4. **clip-path: inset(100%)** ✅ **新增**

## 搜索逻辑流程

### 当 `includeHidden = true` 时：

```
acceptNode 检查：
  ├─ 1. 元素是否可见？
  │   └─ 如果可见 → FILTER_ACCEPT（直接接受）
  │
  ├─ 2. 元素是否自然隐藏？
  │   └─ 如果是自然隐藏 → FILTER_ACCEPT（可高亮）
  │
  └─ 3. 是否启用强制隐藏搜索？
      └─ 如果是强制隐藏 → FILTER_ACCEPT（不可高亮，只能计数）
```

### 当 `includeHidden = false` 时：

```
acceptNode 检查：
  └─ 元素是否可见？
      └─ 如果不可见 → FILTER_REJECT（拒绝）
```

## 覆盖范围总结

### ✅ 已覆盖的类型：

1. ✅ 菜单、下拉框（已展开和未展开的）
2. ✅ 手风琴、折叠面板
3. ✅ 标签页内容
4. ✅ Hover 显示的内容（通过类名和 data 属性检测）
5. ✅ 常见的隐藏类名（.hidden, .d-none 等）
6. ✅ CSS 隐藏（max-height: 0, height: 0, transform 等）
7. ✅ 被遮挡的内容（在 DOM 中可见，已被搜索）
8. ✅ opacity: 0 的交互内容
9. ✅ 强制隐藏的内容（display:none, visibility:hidden, clip-path 等）

### ⚠️ 注意事项：

1. **被其他元素遮挡的内容**：
   - 这类内容在 DOM 中是"可见"的（`isVisible` 返回 true）
   - 所以已经被搜索了，不需要特殊处理

2. **Hover 菜单的特殊情况**：
   - 如果 hover 菜单使用 `display:none`，需要 `includeForcedHidden=true` 才能搜索
   - 如果使用 `opacity:0` 且有 hover 相关标识，会被 `isNaturallyHidden` 检测到

3. **动态加载的内容**：
   - 通过 MutationObserver 和滚动监听器检测
   - 检测到新内容后会自动刷新搜索

## 使用建议

### 搜索所有前端内容（推荐设置）：
- ✅ 勾选"包含隐藏"（includeHidden = true）
- ✅ 勾选"强制搜索隐藏"（includeForcedHidden = true）

这样会搜索：
- 所有可见内容
- 所有自然隐藏内容（菜单、手风琴、hover 等）- **可高亮**
- 所有强制隐藏内容（display:none 等）- **不可高亮，只能计数和定位**

### 只搜索可交互的隐藏内容：
- ✅ 勾选"包含隐藏"（includeHidden = true）
- ❌ 不勾选"强制搜索隐藏"（includeForcedHidden = false）

这样会搜索：
- 所有可见内容
- 所有自然隐藏内容（菜单、手风琴、hover 等）- **可高亮**
- 不搜索强制隐藏内容（display:none 等）

