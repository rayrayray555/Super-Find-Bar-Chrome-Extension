# Super Find Bar 功能逻辑文档

## 1. 核心设计原则

### 1.1 实时搜索优先
- **小页面**：立即显示搜索结果，无延迟
- **超长页面**：使用手动模式（按住 Enter），避免卡住
- **懒加载页面**：通过多种方式检测（上下切换、滚动等）来更新，而不是一开始就延迟

### 1.2 配置管理
- **持久配置**：存储在 `chrome.storage.sync`，跨设备同步
- **临时配置**：存储在 `chrome.storage.local`，跨 tab 共享，浏览器关闭后清除
- **优先级**：临时配置 > 持久配置 > 默认配置

### 1.3 搜索模式
- **实时模式**：页面节点数 ≤ `perfThreshold`，输入即搜索
- **手动模式**：页面节点数 > `perfThreshold`，需要按 Enter 搜索

## 2. 搜索逻辑

### 2.1 搜索流程

```
用户输入 → 检查页面大小 → 选择模式（实时/手动）
  ↓
实时模式：延迟 200ms（小页面）或 500ms（大页面）后搜索
手动模式：等待 Enter 键触发搜索
  ↓
triggerSearch()
  ├─ 创建 TreeWalker（遍历文本节点）
  ├─ acceptNode 过滤（可见性检查）
  ├─ 处理输入框（单独搜索 value 属性）
  ├─ 处理文本节点（正则/模糊匹配）
  ├─ 创建 Range 对象
  └─ 高亮显示
```

### 2.2 可见性判断逻辑

#### 默认搜索（includeHidden = false）
```
acceptNode:
  ├─ 检查 isVisible(parent, false)
  │   └─ 如果不可见 → FILTER_REJECT
  └─ 如果可见 → FILTER_ACCEPT
```

#### 包含隐藏搜索（includeHidden = true）
```
acceptNode:
  ├─ 1. 检查 isVisible(parent, false)
  │   ├─ 如果可见 → FILTER_ACCEPT（最重要，确保可见元素不被拒绝）
  │   └─ 如果不可见 → 继续检查
  │
  ├─ 2. 检查 isNaturallyHidden(parent)
  │   ├─ 如果是自然隐藏（菜单、手风琴等） → FILTER_ACCEPT
  │   └─ 如果不是 → 继续检查
  │
  └─ 3. 检查 includeForcedHidden
      ├─ 如果启用 → 检查 style.display === 'none' || visibility === 'hidden'
      │   ├─ 如果是强制隐藏 → FILTER_ACCEPT
      │   └─ 如果不是 → FILTER_REJECT
      └─ 如果未启用 → FILTER_REJECT
```

**注意**：创建 Range 前不再重复检查可见性（已在 acceptNode 中检查过）

### 2.3 自然隐藏 vs 强制隐藏

#### 自然隐藏（isNaturallyHidden）
- **定义**：页面存在但未触发显示的内容，可以通过交互显示
- **类型**：
  - 菜单、下拉框（menu, nav, dropdown）
  - 手风琴、折叠面板（accordion, collapse）
  - 标签页内容（tab-content, tab-pane）
  - max-height: 0 + overflow: hidden
  - height: 0 + overflow: hidden
  - transform: translateY(-100%)
  - position: absolute 在视口外但父元素可见
- **行为**：可以高亮，展开后可见

#### 强制隐藏（includeForcedHidden）
- **定义**：开发者刻意隐藏的内容（display:none, visibility:hidden）
- **行为**：可以计数和雷达定位，但不能高亮

### 2.4 Range 创建逻辑

```
对于每个匹配的文本：
  ├─ 验证文本节点有效性
  ├─ 验证索引范围有效性
  ├─ 验证匹配文本非空
  ├─ 创建 Range 对象
  ├─ 检查 Range 尺寸（getBoundingClientRect）
  │   ├─ 如果 width === 0 && height === 0
  │   │   ├─ 如果 includeHidden && includeForcedHidden → canHighlight = false
  │   │   └─ 否则 → return（拒绝）
  │   └─ 如果非零尺寸 → canHighlight = true
  └─ 存储到 allRanges（包含 canHighlight 标记）
```

## 3. 高亮逻辑

### 3.1 普通文本高亮
- 使用 CSS Highlight API
- 按颜色分组，创建 Highlight 对象
- 设置到 `CSS.highlights`

### 3.2 输入框高亮
- 创建覆盖层（`.sf-input-highlight`）
- 计算匹配文字在输入框中的精确位置
- 使用临时 span 元素测量文字宽度
- 只高亮匹配的文字部分，而非整个输入框

### 3.3 激活高亮
- 普通文本：使用 `sf-search-active` CSS highlight
- 输入框：通过覆盖层样式显示（橙色边框）
- 跳过 `canHighlight: false` 的 Range

### 3.4 高亮函数参数
- `highlightAll(isAutoRefresh = false)`：接收自动刷新标志
- 自动刷新时：保存状态到 `shouldSkipScroll`，避免异步操作中状态被改变
- 在双重 `requestAnimationFrame` 中使用保存的状态，而不是全局状态

## 4. 刷新机制

### 4.1 触发方式
1. **MutationObserver**：检测 DOM 节点添加
2. **滚动事件**：检测页面滚动（懒加载）
3. **切换检测**：切换搜索结果后检测内容变化

### 4.2 刷新策略
- **防抖延迟**：滚动 200ms，其他 300ms
- **重试机制**：MutationObserver 最多重试 3 次
- **结果判断**：如果结果增加 10% 以上，继续监听

### 4.3 刷新时机
- **不触发刷新**：搜索栏关闭、搜索词为空
- **自动刷新**：检测到新内容且结果增加
- **停止刷新**：重试次数达到上限、搜索被取消

### 4.4 自动刷新时的计数保持逻辑（重要）

**问题**：自动刷新时，计数会突然变成 0，然后重新计数，导致序号跳变，用户体验差。

**解决方案**：在自动刷新时保持当前高亮状态，避免计数跳变。

**实现流程**：
```
自动刷新触发（滚动/内容变化）:
  ├─ triggerSearch(isAutoRefresh = true)
  │   ├─ 保存当前高亮信息：
  │   │   ├─ preservedIdx: 当前序号
  │   │   ├─ preservedRange: 当前 Range 引用
  │   │   └─ preservedTotal: 当前总数
  │   ├─ 不清空计数显示，保持显示当前序号和总数（如"5/20"）
  │   ├─ 搜索过程中：降低计数透明度（0.6）表示加载中
  │   └─ 搜索完成后：
  │       ├─ 尝试匹配保存的 Range：
  │       │   ├─ 方法1：精确匹配（容器和偏移量）
  │       │   └─ 方法2：模糊匹配（文本内容和位置，允许5个字符误差）
  │       ├─ 如果匹配成功：保持当前序号，只更新总数（如"5/22"）
  │       └─ 如果匹配失败：重置为第一个结果（如"1/22"）
  └─ 手动搜索时：清空计数，重新计数（符合用户预期）
```

**关键点**：
- 自动刷新时不清空计数显示，保持用户当前查看的序号
- 使用双重匹配机制（精确匹配 + 模糊匹配），提高匹配成功率
- 如果当前高亮失效，智能重置为第一个结果

### 4.5 自动刷新时的滚动禁止逻辑（重要）

**问题**：自动刷新时，页面会跳转到当前高亮位置，导致用户无法正常翻页。

**解决方案**：在自动刷新时禁止滚动，保持用户当前的浏览位置。

**实现流程**：
```
自动刷新触发:
  ├─ 设置 state.isAutoRefreshing = true
  ├─ 调用 highlightAll(true) 传递自动刷新标志
  │   ├─ 保存状态：shouldSkipScroll = isAutoRefresh || state.isAutoRefreshing
  │   ├─ 在双重 requestAnimationFrame 中使用保存的状态
  │   └─ 如果 shouldSkipScroll = true，跳过 scrollToRangeImmediate()
  ├─ 延迟清除标志（100ms），确保所有异步操作都能检测到
  └─ scrollToRangeImmediate() 函数开头添加双重保险检查
```

**关键点**：
- 使用函数参数和全局状态双重检查，避免异步操作中状态被改变
- 延迟清除 `isAutoRefreshing` 标志，确保所有 `requestAnimationFrame` 都能检测到
- 在 `scrollToRangeImmediate()` 函数开头添加检查，作为双重保险
- 用户手动操作（雷达按钮、切换高亮）仍然可以正常滚动

## 5. 切换逻辑

### 5.1 go() 函数流程
```
go(dir):
  ├─ 更新 state.idx（循环索引）
  ├─ 验证 Range 有效性
  ├─ 清除所有相关定时器（避免冲突）
  ├─ 使用 requestAnimationFrame 立即调用 highlightAll()（不使用防抖）
  ├─ 延迟检查隐藏状态（双重 RAF + 50ms）
  └─ 调用 checkAndRefreshAfterSwitch()
```

### 5.2 切换优化
- **移除防抖**：使用 `requestAnimationFrame` 立即更新，避免闪烁
- **清除定时器**：切换时清除所有相关定时器，避免冲突
- **设置切换标志**：使用 `state.switchRefreshTimer` 防止刷新冲突

### 5.3 刷新冲突处理
- `checkAndRefreshAfterSwitch()` 延迟 300ms 执行
- 如果触发刷新，保留当前 `state.idx`，不重置为第一个
- 使用 `state.switchRefreshTimer` 防止在切换过程中触发刷新

## 6. 雷达定位

### 6.1 定位流程
```
点击雷达按钮:
  ├─ 锁定当前 Range
  ├─ 检测是否需要展开（菜单/下拉框）
  ├─ 触发展开操作（如果需要）
  ├─ 滚动到目标位置
  ├─ 计算涟漪中心点
  │   ├─ 输入框：计算文字精确位置
  │   └─ 普通文本：使用 Range 中心
  └─ 显示涟漪动画
```

### 6.2 展开机制
1. 查找可点击父元素（button, a, [role="button"]）
2. 设置 aria-expanded 属性
3. 添加展开类名（open, active, show）
4. 触发 mouseenter 事件

## 7. 输入框处理

### 7.1 搜索逻辑
- 单独处理 `input[type="text"]` 和 `textarea`
- 搜索 `value` 属性，而非 DOM 文本
- 支持忽略重音、正则、模糊匹配

### 7.2 高亮逻辑
- 创建覆盖层，只高亮匹配文字部分
- 计算文字位置（考虑 padding、border、字体样式）
- 监听输入框变化，动态更新高亮位置

### 7.3 激活状态
- 激活时：橙色边框、更明显的背景色
- 普通状态：使用原始颜色
- 通过覆盖层样式显示，不使用 CSS.highlights

## 8. 性能优化

### 8.1 搜索保护
- **超时机制**：10 秒超时
- **节点限制**：最多 50000 个节点
- **批量处理**：每 200 个节点 yield 一次

### 8.2 高亮限制
- **最大高亮数**：1000 个
- **坐标轴标记**：最多 150 个（采样显示）

### 8.3 缓存机制
- 使用 WeakMap 缓存 `getComputedStyle` 结果
- 避免重复计算样式

## 9. 状态管理

### 9.1 全局状态（state 对象）
- `ranges`: 搜索结果数组
- `idx`: 当前激活的索引
- `visible`: 搜索栏是否可见
- `searchId`: 搜索 ID（用于取消）
- `abortController`: 中止控制器
- `mutationObserver`: DOM 变化监听器
- `scrollListener`: 滚动事件监听器
- `isAutoRefreshing`: 自动刷新标志（用于禁止滚动）
- `switchRefreshTimer`: 切换刷新定时器（防止刷新冲突）

### 9.2 配置状态（CONFIG 对象）
- `search`: 搜索配置（matchCase, wholeWord 等）
- `layout`: 布局配置（mode, position 等）
- `theme`: 主题配置（bg, text, opacity）
- `coordinates`: 坐标轴配置
- `scroll`: 滚动行为配置

## 10. 存储机制

### 10.1 持久存储（chrome.storage.sync）
- 存储用户默认设置
- 跨设备同步
- 键名：`sf-bar-config-v17`

### 10.2 临时存储（chrome.storage.local）
- 存储临时设置（advance 面板中的修改）
- 跨 tab 共享
- 浏览器关闭后由 background.js 清除
- 键名：`sf-temp-*`

## 11. 事件处理

### 11.1 键盘事件
- `Ctrl+Shift+F` / `Cmd+Shift+F`：切换搜索栏
- `Enter`：手动触发搜索（手动模式）
- `←` / `→`：切换搜索结果
- `Esc`：关闭搜索栏
- `F3`：下一个结果，`Shift+F3`：上一个结果

### 11.2 输入事件
- `oninput`：实时搜索（实时模式）
- 防抖延迟：小页面 200ms，大页面 500ms

### 11.3 DOM 事件
- `MutationObserver`：监听 DOM 变化
- `scroll`：监听滚动事件
- `resize`：监听窗口大小变化

## 12. 特殊页面处理

### 12.1 PDF 页面
- 检测并显示提示
- 建议使用 Chrome 内置搜索

### 12.2 Google Docs/Sheets/Slides
- 检测并显示提示
- 说明不支持原因（安全限制）

## 13. 错误处理

### 13.1 搜索错误
- `acceptNode` 中使用 try-catch
- 节点收集时使用 try-catch
- 捕获异常时返回 `FILTER_REJECT`，避免中断搜索

### 13.2 Range 错误
- 验证 Range 有效性（`isRangeValid`）
- 创建 Range 失败时跳过，不中断搜索

### 13.3 高亮错误
- 输入框高亮失败时记录错误，不影响其他高亮
- 使用 try-catch 包裹关键操作

## 14. 国际化（i18n）

### 14.1 支持语言
- 中文（zh）
- 英文（en）

### 14.2 翻译内容
- 占位符文本
- 按钮标题
- 提示消息
- 选项标签

## 15. 坐标轴系统

### 15.1 功能
- 显示搜索结果在页面中的位置
- X 轴：横向位置（0-100%）
- Y 轴：纵向位置（0-100%）

### 15.2 显示逻辑
- 激活结果：橙色大圆点（14px）
- 普通结果：彩色小圆点（8px）
- 采样显示：超过 150 个时均匀采样

### 15.3 位置自适应
- 搜索栏在底部时，X 轴强制去顶部
- 搜索栏在顶部时，X 轴去底部

## 16. 已知问题和限制

### 16.1 性能限制
- 超大页面（> 50000 节点）可能超时
- 搜索结果过多（> 1000）时只显示前 1000 个

### 16.2 兼容性限制
- 需要 Chrome 105+（CSS Highlight API）
- 不支持 PDF 页面
- 不支持 Google Docs/Sheets/Slides

### 16.3 功能限制
- Shadow DOM 中的内容无法搜索
- 某些动态加载的内容需要手动刷新

## 17. 未来改进方向

1. 支持更多页面类型（PDF、Google Docs 等）
2. 优化超大页面的搜索性能
3. 支持更多语言
4. 添加更多搜索选项（如搜索范围限制）
5. 改进懒加载页面的检测机制

