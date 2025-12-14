# 包含隐藏内容搜索逻辑分析

## 当前检测的隐藏类型

### 1. 自然隐藏（isNaturallyHidden）- 可高亮
这些内容在 DOM 中存在，但当前未显示，可以通过交互显示：

✅ **已检测的类型**：
- 菜单、下拉框（menu, nav, dropdown）
- 手风琴、折叠面板（accordion, collapse）
- 标签页内容（tab-content, tab-pane）
- max-height: 0 + overflow: hidden
- height: 0 + overflow: hidden
- transform: translateY(-100%) 或 translateX(-100%)
- position: absolute/fixed 在视口外但父元素可见

### 2. 强制隐藏（includeForcedHidden）- 不可高亮，只能计数和定位
这些内容是开发者刻意隐藏的：

✅ **已检测的类型**：
- display: none
- visibility: hidden

## 可能缺失的隐藏类型

### ❌ 未检测的类型：

1. **Hover 显示的内容**
   - 通过 CSS `:hover` 伪类控制
   - 通过 JavaScript `mouseenter`/`mouseleave` 控制
   - 这些内容在 DOM 中通常已经存在，但可能被 `display:none` 或 `opacity:0` 隐藏
   - **问题**：如果使用 `display:none`，会被 `isVisible` 拒绝；如果使用 `opacity:0`，也会被 `isVisible` 拒绝

2. **被其他元素遮挡的内容**
   - 通过 `z-index` 和 `position` 被其他元素覆盖
   - 这些内容在 DOM 中是"可见"的（`isVisible` 返回 true），但被遮挡
   - **问题**：这类内容实际上已经被 `isVisible` 接受了，因为它们在 DOM 中是可见的

3. **opacity: 0 的内容**
   - 完全透明但仍在 DOM 中
   - **问题**：在 `isVisible` 中会被拒绝（除非 `includeForcedHidden=true`）

4. **clip-path 隐藏的内容**
   - 通过 `clip-path: inset(100%)` 隐藏
   - **问题**：在 `isVisible` 中会被拒绝（除非 `includeForcedHidden=true`）

5. **CSS 类名控制的隐藏**
   - 如 `.hidden`, `.d-none`, `.invisible` 等
   - 这些通常是通过 `display:none` 或 `visibility:hidden` 实现的
   - **问题**：如果使用 `display:none`，会被 `isVisible` 拒绝；需要 `includeForcedHidden=true` 才能搜索

6. **被其他元素完全覆盖的内容**
   - 通过 `position: absolute/fixed` 和 `z-index` 被覆盖
   - **问题**：这类内容在 DOM 中是可见的，`isVisible` 会返回 true，所以已经被搜索了

## 当前逻辑的问题

### 问题1：opacity: 0 的内容
- 如果元素 `opacity: 0`，`isVisible` 会返回 `includeForcedHidden`
- 这意味着如果 `includeHidden=true` 但 `includeForcedHidden=false`，`opacity: 0` 的内容不会被搜索
- **建议**：`opacity: 0` 应该被视为"自然隐藏"，因为用户可以通过交互使其可见

### 问题2：hover 菜单
- Hover 菜单通常使用 `display:none` 或 `opacity:0` 隐藏
- 如果使用 `display:none`，需要 `includeForcedHidden=true` 才能搜索
- 如果使用 `opacity:0`，也需要 `includeForcedHidden=true` 才能搜索
- **建议**：检测 hover 相关的元素（通过 class 名如 `hover`, `hover-menu`, `dropdown-hover` 等）

### 问题3：CSS 类名隐藏
- 很多框架使用类名控制显示/隐藏（如 Bootstrap 的 `.d-none`, `.hidden`）
- 这些类名通常对应 `display:none` 或 `visibility:hidden`
- **建议**：检测常见的隐藏类名

## 建议的改进

1. **扩展 isNaturallyHidden**：
   - 检测 hover 相关的元素（通过 class 名、data 属性等）
   - 检测常见的隐藏类名（`.hidden`, `.d-none`, `.invisible`, `.sr-only` 等）
   - 将 `opacity: 0` 视为自然隐藏（如果元素在 DOM 中且不是强制隐藏）

2. **优化 isVisible**：
   - 当 `includeHidden=true` 时，对于 `opacity: 0` 的元素，应该检查是否为自然隐藏
   - 如果元素有 hover 相关的标识，即使 `opacity: 0` 也应该视为自然隐藏

3. **检测被遮挡的内容**：
   - 被其他元素遮挡的内容实际上已经在搜索范围内（因为 `isVisible` 返回 true）
   - 不需要特殊处理

