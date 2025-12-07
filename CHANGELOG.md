# 更新日志 (Changelog)

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [1.0.0] - 2025-12-07

### 🎉 首次发布 (Initial Release)

#### ✨ 新增 (Added)
- **核心搜索功能**
  - 多词搜索，每个词使用不同颜色高亮
  - 模糊搜索（Levenshtein 距离算法）
  - 正则表达式搜索
  - 全词匹配和区分大小写
  - 忽略重音符号匹配
  - 包含隐藏元素搜索选项

- **用户界面**
  - 暗色主题，现代化设计
  - 浮动窗口和顶部/底部栏两种布局模式
  - 可拖拽的浮动窗口
  - X/Y 坐标轴标记系统，显示搜索结果位置
  - 7 种可自定义的高亮颜色
  - 主题颜色自定义（背景色、文字色、透明度）

- **性能优化**
  - 智能性能监控，大页面自动切换手动模式
  - 增量搜索，实时显示结果
  - 智能滚动，适配动态内容页面（如 ChatGPT、Gemini）
  - Range 有效性验证，检测 DOM 变化

- **用户体验**
  - `Ctrl+Shift+F` 快捷键（可在 Chrome 中自定义）
  - 中文和英文双语支持
  - Chrome 账号同步设置
  - 完整的选项页面配置
  - 快速选项图标（固定常用选项）

- **特殊页面支持**
  - 检测 PDF 文档，提示用户使用替代方案
  - 检测 Google Docs/Sheets/Slides，说明限制原因

#### 🔒 安全与隐私
- 零数据收集，所有设置仅存储在本地
- 使用 Chrome Storage Sync API 实现设备间同步（可选）
- 完整的隐私政策文档

#### 📚 文档
- 完整的中英文 README
- 使用教程（待完善）
- 隐私政策
- 安装和配置指南

---

## [Preview] - 2025-11-XX

### 📝 预览版本 (Preview Version)

#### 功能测试 (Feature Testing)
- Tampermonkey 脚本版本
- 基础搜索功能验证
- UI 交互测试
- 滚动和高亮逻辑优化

---

## 即将推出 (Coming Soon)

### [1.1.0] - 计划中
- 完整的 PDF 搜索支持（PDF.js 集成）
- Google Workspace Add-on（独立版本）
- 更多主题选项（浅色主题、自定义主题）
- 搜索历史记录
- 导入/导出配置

### [1.2.0] - 规划中
- Gemini AI 集成（智能搜索建议）
- 搜索结果导出功能
- 更多语言支持（日语、韩语、西班牙语等）
- 搜索模板和预设

---

## 技术说明 (Technical Notes)

### 版本命名规则
- **主版本号 (Major)**: 重大功能变更或架构升级
- **次版本号 (Minor)**: 新功能添加
- **修订号 (Patch)**: Bug 修复和小改进

### 支持的浏览器
- Chrome 88+ (Manifest V3)
- Edge 88+ (Chromium-based)
- 其他 Chromium 内核浏览器

---

<div align="center">

📝 完整的版本历史请访问 [GitHub Releases](https://github.com/rayrayray555/Super-Find-Bar-Chrome-Extension/releases)

</div>

