# Chrome Web Store 提交指南 / Chrome Web Store Submission Guide

## 📦 打包步骤 / Packaging Steps

### 1. 准备文件 / Prepare Files

确保以下文件都在 `extension` 文件夹中：

Make sure all these files are in the `extension` folder:

```
extension/
├── manifest.json          ✅ 必需 / Required
├── background.js          ✅ 必需 / Required
├── content.js            ✅ 必需 / Required
├── icons/
│   ├── icon16.png        ✅ 必需 / Required
│   ├── icon32.png        ✅ 必需 / Required
│   ├── icon48.png        ✅ 必需 / Required
│   └── icon128.png       ✅ 必需 / Required
└── options/
    ├── options.html      ✅ 必需 / Required
    ├── options.js        ✅ 必需 / Required
    └── options.css       ✅ 必需 / Required
```

### 2. 检查清单 / Checklist

在打包前，请确认：

Before packaging, please confirm:

- ✅ `manifest.json` 版本号正确（当前：1.0.0）
- ✅ 所有图标文件存在且尺寸正确
- ✅ 代码无语法错误（已通过 lint 检查）
- ✅ 没有包含测试文件或临时文件
- ✅ 没有包含 `.git` 文件夹
- ✅ 没有包含 `node_modules` 或其他开发依赖

### 3. 创建 ZIP 压缩包 / Create ZIP Archive

#### Windows 方法 / Windows Method:

1. 进入项目根目录
2. 右键点击 `extension` 文件夹
3. 选择"发送到" → "压缩(zipped)文件夹"
4. 重命名为 `Super-Find-Bar-v1.0.0.zip`

#### Mac 方法 / Mac Method:

```bash
cd /path/to/Super-Find-Bar-Chrome-Extension
zip -r Super-Find-Bar-v1.0.0.zip extension/ -x "*.DS_Store" "*.git*"
```

#### Linux 方法 / Linux Method:

```bash
cd /path/to/Super-Find-Bar-Chrome-Extension
zip -r Super-Find-Bar-v1.0.0.zip extension/ -x "*.git*"
```

### 4. 验证 ZIP 文件 / Verify ZIP File

解压 ZIP 文件到临时文件夹，确认：
- 所有文件都在根目录（不是嵌套的 extension 文件夹）
- 文件结构正确
- 可以正常加载到 Chrome（测试用）

---

## 🚀 提交到 Chrome Web Store / Submit to Chrome Web Store

### 步骤 1: 注册开发者账号 / Register Developer Account

1. 访问 [Chrome Web Store Developer Dashboard](https://chrome.google.com/webstore/devconsole)
2. 支付一次性注册费：**$5 USD**（一次性费用，永久有效）
3. 完成开发者账号注册

### 步骤 2: 创建新扩展 / Create New Extension

1. 登录 [Chrome Web Store Developer Dashboard](https://chrome.google.com/webstore/devconsole)
2. 点击"新增项目" / "Add new item"
3. 上传 ZIP 文件：`Super-Find-Bar-v1.0.0.zip`

### 步骤 3: 填写商店信息 / Fill Store Information

#### 基本信息 / Basic Information

- **名称 / Name**: `Super Find Bar`
- **简短描述 / Short Description** (132字符以内):
  - 中文：`强大的网页内搜索工具，支持多词高亮、模糊搜索、智能滚动`
  - English: `Powerful in-page search with multi-term highlighting, fuzzy search, and smart scrolling`

- **详细描述 / Detailed Description**:
  - 使用 README.md 中的内容
  - 可以包含功能列表、使用方法等

#### 分类 / Category

- **主要分类 / Primary Category**: `Productivity` (生产力工具)
- **次要分类 / Secondary Category**: `Developer Tools` (可选)

#### 图标和截图 / Icons and Screenshots

**必需图标 / Required Icons:**
- ✅ 128x128 PNG（已有：`icons/icon128.png`）

**推荐截图 / Recommended Screenshots:**
- 至少 1 张，最多 5 张
- 尺寸：1280x800 或 640x400
- 建议包含：
  1. 主界面截图（搜索栏 + 高亮效果）
  2. 设置页面截图
  3. 多词搜索效果截图
  4. 坐标轴标记截图

#### 隐私政策 / Privacy Policy

- **隐私政策 URL**: 
  - 可以指向 GitHub README 中的隐私政策部分
  - 或创建独立的隐私政策页面
  - 示例：`https://github.com/rayrayray555/Super-Find-Bar-Chrome-Extension#%EF%B8%8F-%E9%9A%90%E7%A7%81%E6%94%BF%E7%AD%96--privacy-policy`

#### 权限说明 / Permissions Explanation

Chrome 会要求你解释每个权限的用途：

**`storage` 权限:**
- 用途：保存用户设置（颜色、布局、搜索选项等）
- Purpose: Save user preferences (colors, layout, search options, etc.)

**`<all_urls>` 权限:**
- 用途：在网页上注入搜索功能
- Purpose: Inject search functionality on web pages

### 步骤 4: 提交审核 / Submit for Review

1. 检查所有必填项是否完成
2. 点击"提交审核" / "Submit for review"
3. 等待审核（通常 1-3 个工作日）

---

## 📋 提交前最终检查清单 / Final Pre-Submission Checklist

### 代码质量 / Code Quality

- ✅ 无语法错误
- ✅ 无控制台错误（在测试页面验证）
- ✅ 所有功能正常工作
- ✅ 错误处理完善

### 用户体验 / User Experience

- ✅ 界面美观，符合 Chrome 设计规范
- ✅ 多语言支持正常
- ✅ 快捷键工作正常
- ✅ 设置页面功能完整

### 隐私和安全 / Privacy and Security

- ✅ 隐私政策完整
- ✅ 权限说明清晰
- ✅ 无恶意代码
- ✅ 数据仅本地存储

### 文档 / Documentation

- ✅ README.md 完整且准确
- ✅ 使用说明清晰
- ✅ 已知限制说明清楚

---

## 🎯 提交后 / After Submission

### 审核状态 / Review Status

Chrome Web Store 审核通常需要 **1-3 个工作日**。

审核状态：
- **待审核 / Pending**: 等待审核
- **审核中 / In Review**: 正在审核
- **已发布 / Published**: 审核通过，已上架
- **被拒绝 / Rejected**: 需要修改后重新提交

### 如果被拒绝 / If Rejected

1. 查看拒绝原因
2. 根据反馈修改代码
3. 更新版本号（如 1.0.1）
4. 重新打包并提交

### 更新版本 / Update Version

当需要更新时：
1. 修改 `manifest.json` 中的版本号
2. 更新 CHANGELOG.md
3. 重新打包 ZIP 文件
4. 在开发者控制台提交新版本

---

## 📝 商店描述模板 / Store Description Template

### 简短描述 / Short Description (132字符)

**中文:**
```
强大的网页内搜索工具，支持多词高亮、模糊搜索、智能滚动和动态内容检测
```

**English:**
```
Powerful in-page search with multi-term highlighting, fuzzy search, smart scrolling & dynamic content detection
```

### 详细描述 / Detailed Description

可以使用 README.md 中的内容，建议包含：

1. **主要特性** (3-5 条)
2. **使用方法** (简要说明)
3. **适用场景** (如：长文档、动态页面等)
4. **隐私说明** (强调零数据收集)

---

## ⚠️ 常见问题 / Common Issues

### 1. ZIP 文件结构错误

**错误**: 解压后是 `extension/extension/...` 嵌套结构
**解决**: 确保 ZIP 文件内直接是文件，不是 `extension` 文件夹

### 2. 图标缺失

**错误**: 审核被拒，提示缺少图标
**解决**: 确保所有尺寸的图标都存在（16, 48, 128）

### 3. 权限说明不清晰

**错误**: 审核要求补充权限说明
**解决**: 在商店描述中详细说明每个权限的用途

### 4. 隐私政策缺失

**错误**: 审核要求提供隐私政策
**解决**: 在 README 中添加隐私政策部分，或创建独立页面

---

## ✅ 最终确认 / Final Confirmation

提交前，请确认：

- [ ] ZIP 文件结构正确
- [ ] 所有文件都在 ZIP 中
- [ ] manifest.json 版本号正确
- [ ] 图标文件完整
- [ ] 代码无错误
- [ ] 商店描述完整
- [ ] 隐私政策已提供
- [ ] 权限说明清晰
- [ ] 截图已准备（至少 1 张）

---

**祝提交顺利！/ Good luck with your submission! 🚀**

