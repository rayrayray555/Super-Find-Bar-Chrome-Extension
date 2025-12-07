# Super Find Bar / 超级搜索栏

<div align="center">

![Super Find Bar](extension/icons/icon128.png)

**一个功能强大的浏览器内搜索扩展，支持多词高亮、模糊搜索、正则表达式等高级功能**

**A powerful in-page search extension with multi-term highlighting, fuzzy search, regex, and more**

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Chrome Web Store](https://img.shields.io/badge/Chrome-Web%20Store-blue)](https://chrome.google.com/webstore)

</div>

---

## ✨ 主要特性 / Key Features

### 🎯 强大的搜索功能 / Powerful Search

- **多词搜索** - 同时搜索多个关键词，每个词使用不同颜色高亮
- **Multi-term Search** - Search multiple keywords simultaneously with different highlight colors

- **模糊搜索** - 容忍拼写错误，智能匹配相似内容
- **Fuzzy Search** - Tolerates typos and intelligently matches similar content

- **正则表达式** - 支持复杂的搜索模式
- **Regular Expressions** - Support complex search patterns

- **全词匹配** - 精确匹配完整单词
- **Whole Word Match** - Precisely match complete words

- **区分大小写** - 可选的大小写敏感搜索
- **Case Sensitive** - Optional case-sensitive search

- **忽略重音** - 自动匹配带重音符号的字符（如 café = cafe）
- **Ignore Accents** - Automatically match accented characters (e.g., café = cafe)

### 🎨 现代化 UI / Modern UI

- **暗色主题** - 护眼的暗色界面，可自定义颜色
- **Dark Theme** - Eye-friendly dark interface with customizable colors

- **灵活布局** - 支持浮动窗口或顶部/底部栏模式
- **Flexible Layout** - Floating window or top/bottom bar modes

- **拖拽定位** - 浮动窗口可随意拖拽到任意位置
- **Draggable** - Move floating window anywhere on the page

- **坐标标记系统** - X/Y 轴标记显示搜索结果位置
- **Coordinate Markers** - X/Y axis markers show search result positions

### ⚡ 智能优化 / Smart Optimization

- **性能监控** - 自动检测页面复杂度，大页面切换到手动搜索模式
- **Performance Monitoring** - Auto-detect page complexity, switch to manual mode for large pages

- **增量搜索** - 实时显示搜索结果（小页面）
- **Incremental Search** - Real-time results on small pages

- **智能滚动** - 自动滚动到匹配位置，适配动态内容页面
- **Smart Scrolling** - Auto-scroll to matches, adapts to dynamic content

- **X轴自适应** - 底部栏模式时X轴自动显示在顶部，避免遮挡
- **Adaptive X-axis** - Automatically positions X-axis to avoid obstruction

### 🚀 用户体验 / User Experience

- **快捷键支持** - `Ctrl+Shift+F` 快速打开（可自定义）
- **Keyboard Shortcuts** - `Ctrl+Shift+F` to open (customizable)

- **多语言** - 支持中文和英文界面
- **Multi-language** - Chinese and English UI support

- **数据同步** - 设置自动在多设备间同步（Chrome 账号登录）
- **Sync Settings** - Auto-sync across devices (Chrome account required)

- **零隐私侵犯** - 所有数据仅存储在本地，不收集任何信息
- **Zero Privacy Invasion** - All data stored locally, no collection

---

## 📦 安装 / Installation

### Chrome Web Store（推荐 / Recommended）

*即将上架... / Coming soon...*

### 手动安装（开发版） / Manual Installation (Development)

```bash
# 克隆仓库 / Clone repository
git clone https://github.com/rayrayray555/Super-Find-Bar-Chrome-Extension.git
cd Super-Find-Bar-Chrome-Extension
```

**步骤 / Steps:**

1. **打开 Chrome 扩展管理页面 / Open Chrome extensions page**
   - 访问 / Navigate to: `chrome://extensions/`
   - 开启右上角的"开发者模式" / Enable "Developer mode" in the top right

2. **加载扩展 / Load extension**
   - 点击"加载已解压的扩展程序" / Click "Load unpacked"
   - 选择项目中的 `extension` 文件夹 / Select the `extension` folder

---

## 🎮 使用方法 / Usage

### 基本操作 / Basic Operations

1. **打开搜索栏 / Open Search Bar**
   - 快捷键 / Shortcut: `Ctrl+Shift+F` (Mac: `Cmd+Shift+F`)

2. **输入关键词 / Enter Keywords**
   - 支持多个词，用空格分隔 / Multiple words separated by spaces

3. **切换结果 / Navigate Results**
   - 点击 `◀` `▶` 或使用键盘 `F3` / `Shift+F3`
   - Click `◀` `▶` or use keyboard `F3` / `Shift+F3`

4. **关闭 / Close**
   - 按 `Esc` 或点击关闭按钮
   - Press `Esc` or click close button

### 高级功能 / Advanced Features

**快速选项 / Quick Options**

点击输入框左侧的图标快速切换常用选项：

Click icons to the left of the input box to toggle options:

- 🔤 区分大小写 / Match Case
- 📝 全词匹配 / Whole Word
- 🌐 忽略重音 / Ignore Accents
- 🎨 高亮所有 / Highlight All

**高级设置 / Advanced Settings**

点击右侧齿轮图标 ⚙️ 打开设置面板：

Click the gear icon ⚙️ to open the settings panel:

- 切换布局模式（浮动窗口/顶部栏/底部栏）
- Switch layout modes (floating window/top bar/bottom bar)

- 调整7种高亮颜色
- Adjust 7 highlight colors

- 配置X/Y坐标轴显示
- Configure X/Y coordinate axis display

- 设置性能阈值
- Set performance threshold

**模糊搜索 / Fuzzy Search**

启用后可容忍拼写错误，例如搜索 "helo" 可以匹配 "hello"

When enabled, tolerates spelling errors, e.g., search "helo" matches "hello"

### 快捷键说明 / Shortcut Keys

**默认快捷键 / Default Shortcut:** `Ctrl+Shift+F` (Mac: `Cmd+Shift+F`)

**如遇到输入法冲突 / If Conflicts with Input Method:**

1. **方案1 / Option 1**: 在系统"语言设置 → 微软拼音 → 按键"中关闭简繁切换快捷键
   - Disable in system "Language Settings → Microsoft Pinyin → Keys"

2. **方案2 / Option 2**: 在 `chrome://extensions/shortcuts` 中自定义扩展快捷键
   - Customize in `chrome://extensions/shortcuts`

---

## ⚠️ 已知限制 / Known Limitations

### 不支持的页面类型 / Unsupported Page Types

**1. PDF 文档 / PDF Documents**

Chrome 的 PDF 查看器使用特殊渲染技术，扩展无法访问文本内容。

Chrome's PDF viewer uses special rendering, extension cannot access text content.

- 建议 / Suggestion: 使用 Chrome 内置搜索 / Use Chrome's built-in search `Ctrl+F`

**2. Google Docs/Sheets/Slides**

Google 使用 Canvas 渲染和虚拟 DOM，安全限制阻止扩展访问。

Google uses Canvas rendering and virtual DOM, security restrictions prevent access.

- 建议 / Suggestion: 使用 Google Docs 自带搜索 / Use Google Docs' built-in search `Ctrl+F`

**3. Chrome 系统页面 / Chrome System Pages**

扩展商店、设置页面等由于 Chrome 安全策略限制无法注入脚本。

Extension store, settings pages are restricted by Chrome security policy.

### 性能说明 / Performance Notes

- 超大页面（>5000节点）自动切换到手动搜索模式
- Very large pages (>5000 nodes) auto-switch to manual search mode

- 多列布局（如 ChatGPT）的坐标标记可能略有偏差
- Multi-column layouts (e.g., ChatGPT) may have slightly inaccurate markers

---

## 🔒 隐私政策 / Privacy Policy

### 零数据收集，完全透明 / Zero Data Collection, Completely Transparent

**Super Find Bar 非常重视您的隐私 / Super Find Bar takes your privacy seriously:**

- ✅ **不收集任何个人信息** - 扩展不会追踪、记录或上传您的数据
- ✅ **No Personal Data Collection** - No tracking, recording, or uploading

- ✅ **本地存储** - 所有设置仅保存在浏览器本地
- ✅ **Local Storage** - All settings saved locally in browser only

- ✅ **可选同步** - 通过 Chrome 账号同步（由 Chrome 加密处理）
- ✅ **Optional Sync** - Via Chrome account (encrypted by Chrome)

- ✅ **无网络请求** - 不向任何服务器发送数据
- ✅ **No Network Requests** - No data sent to servers

- ✅ **开源透明** - 所有代码公开，欢迎审查
- ✅ **Open Source** - All code public on GitHub

### 权限说明 / Permissions Explained

| 权限 / Permission | 用途 / Purpose |
|-------------------|----------------|
| `storage` | 保存用户配置（颜色、布局等）<br>Save user preferences (colors, layout, etc.) |
| `<all_urls>` | 在网页上注入搜索功能<br>Inject search functionality on web pages |

---

## 🤝 贡献 / Contributing

欢迎提交 Issue 报告问题或建议功能！

Welcome to submit Issues for bugs or feature requests!

- 🐛 [报告问题 / Report Issues](https://github.com/rayrayray555/Super-Find-Bar-Chrome-Extension/issues)
- 💡 [功能建议 / Feature Requests](https://github.com/rayrayray555/Super-Find-Bar-Chrome-Extension/issues)

---

## 💖 支持项目 / Support

如果这个扩展帮到了您 / If this extension helped you:

- ⭐ [给项目加星 / Star the Project](https://github.com/rayrayray555/Super-Find-Bar-Chrome-Extension)
- 📝 在 Chrome Web Store 留下评价（即将上架）/ Rate on Chrome Web Store (coming soon)
- 🐛 [报告问题 / Report Issues](https://github.com/rayrayray555/Super-Find-Bar-Chrome-Extension/issues)

---

## 📄 许可证 / License

MIT License - 详见 / See [LICENSE](LICENSE)

**100% 开源，永久免费！/ 100% Open Source, Forever Free!**

---

## 🔗 相关链接 / Links

- [GitHub 仓库 / Repository](https://github.com/rayrayray555/Super-Find-Bar-Chrome-Extension)
- [更新日志 / Changelog](CHANGELOG.md)
- [Chrome Web Store](https://chrome.google.com/webstore)（即将上架 / Coming soon）

---

<div align="center">

**Made with ❤️ | MIT Licensed**

**让网页搜索更强大 / Make web search more powerful**

</div>
