# GitHub 同步完整指南

## 📋 前置准备

### 1. 确认 Git 已安装

打开 PowerShell，运行：
```powershell
git --version
```

如果显示版本号（如 `git version 2.x.x`），说明已安装 ✅

如果未安装，访问：https://git-scm.com/download/win 下载安装

---

### 2. 配置 Git 用户信息（首次使用）

```powershell
git config --global user.name "您的名字"
git config --global user.email "您的邮箱@example.com"
```

**注意**：邮箱应该与 GitHub 账号邮箱一致

---

### 3. 在 GitHub 创建新仓库

1. 访问 GitHub：https://github.com
2. 点击右上角 "+" → "New repository"
3. 填写信息：
   - **Repository name**: `Chrome-Super-Find-Bar`
   - **Description**: `Advanced in-page search extension for Chrome`
   - **Public** (公开仓库)
   - ❌ **不要**勾选 "Add a README file"
   - ❌ **不要**勾选 "Add .gitignore"
   - ❌ **不要**选择 License（我们已经有了）
4. 点击 "Create repository"

**记下仓库地址**，格式如：
```
https://github.com/rayrayray555/Super-Find-Bar-Chrome-Extension.git
```

---

## 🚀 同步步骤（完整版）

### 步骤 1：打开 PowerShell 并进入项目目录

```powershell
cd "D:\PC File\桌面\Chrome-Super-Find-Bar\Chrome-Super-Find-Bar"
```

---

### 步骤 2：初始化 Git 仓库

```powershell
git init
```

**预期输出**：
```
Initialized empty Git repository in D:/PC File/桌面/Chrome-Super-Find-Bar/Chrome-Super-Find-Bar/.git/
```

---

### 步骤 3：查看将要上传的文件

```powershell
git status
```

**预期输出**（红色文件名表示未追踪）：
```
Untracked files:
  .gitignore
  CHANGELOG.md
  extension/
  LICENSE
  README.md
  README_EN.md
  ...
```

**验证 .gitignore 是否生效**：
- ✅ 不应该看到 `.DS_Store`、`Thumbs.db` 等系统文件
- ✅ 不应该看到 `node_modules/` 等临时文件

---

### 步骤 4：添加所有文件到暂存区

```powershell
git add .
```

**查看已添加的文件**：
```powershell
git status
```

**预期输出**（绿色文件名表示已暂存）：
```
Changes to be committed:
  new file:   .gitignore
  new file:   CHANGELOG.md
  new file:   LICENSE
  new file:   README.md
  new file:   README_EN.md
  new file:   V1.0_RELEASE_NOTES.md
  new file:   FIX_SUMMARY.md
  new file:   PERFORMANCE_TEST.md
  new file:   extension/background.js
  new file:   extension/content.js
  new file:   extension/manifest.json
  new file:   extension/options/options.html
  new file:   extension/options/options.js
  new file:   extension/options/options.css
  new file:   extension/icons/icon16.png
  new file:   extension/icons/icon32.png
  new file:   extension/icons/icon48.png
  new file:   extension/icons/icon128.png
```

---

### 步骤 5：提交到本地仓库

```powershell
git commit -m "feat: Super Find Bar V1.0 - Initial Release

✨ 核心功能:
- 多词搜索，7 种颜色高亮
- 模糊搜索和正则表达式支持
- X/Y 坐标轴标记系统
- 性能优化（高亮延迟从 2-10s 降至 32ms，提升 83-200 倍）
- Shift+F 快捷键（可自定义）
- 100% 隐私友好，零数据收集

🚀 性能优化:
- 双重 RAF 确保渲染完成
- Instant 滚动替代 Smooth 动画
- 智能采样限制标记数量（最多 150 个）
- 延迟绘制坐标轴避免阻塞

🎨 用户体验:
- 中英文双语支持
- 6 种布局位置（四角 + 顶部 + 底部）
- 主题颜色自定义
- Chrome 账号同步设置
- X 轴自适应搜索栏位置

📝 文档:
- 完整的中英文 README
- 隐私政策说明
- 性能测试指南
- MIT 开源许可证"
```

**预期输出**：
```
[main (root-commit) xxxxxxx] feat: Super Find Bar V1.0 - Initial Release
 XX files changed, XXXX insertions(+)
 create mode 100644 .gitignore
 create mode 100644 CHANGELOG.md
 ...
```

---

### 步骤 6：连接到 GitHub 远程仓库

```powershell
git remote add origin https://github.com/rayrayray555/Super-Find-Bar-Chrome-Extension.git
```

**验证远程仓库**：
```powershell
git remote -v
```

**预期输出**：
```
origin  https://github.com/rayrayray555/Super-Find-Bar-Chrome-Extension.git (fetch)
origin  https://github.com/rayrayray555/Super-Find-Bar-Chrome-Extension.git (push)
```

---

### 步骤 7：推送到 GitHub

```powershell
git branch -M main
git push -u origin main
```

**可能需要输入 GitHub 账号密码**：
- 用户名：您的 GitHub 用户名
- 密码：**不是您的 GitHub 密码！** 是 Personal Access Token (PAT)

**如果没有 PAT，需要创建**：
1. 访问：https://github.com/settings/tokens
2. 点击 "Generate new token (classic)"
3. 勾选 `repo` 权限
4. 生成并复制 Token（只显示一次，请保存）
5. 在密码提示时粘贴 Token

**预期输出**：
```
Enumerating objects: XX, done.
Counting objects: 100% (XX/XX), done.
Delta compression using up to 8 threads
Compressing objects: 100% (XX/XX), done.
Writing objects: 100% (XX/XX), XXX KiB | XXX MiB/s, done.
Total XX (delta X), reused 0 (delta 0), pack-reused 0
To https://github.com/rayrayray555/Super-Find-Bar-Chrome-Extension.git
 * [new branch]      main -> main
branch 'main' set up to track 'origin/main'.
```

---

### 步骤 8：验证上传成功

1. 访问您的 GitHub 仓库：
   ```
   https://github.com/rayrayray555/Super-Find-Bar-Chrome-Extension
   ```

2. **检查清单**：
   - ✅ README.md 正确显示（有格式、有图标）
   - ✅ 文件列表完整（extension/, LICENSE, README 等）
   - ✅ 看不到系统垃圾文件（.DS_Store, Thumbs.db）
   - ✅ 提交历史显示您的 commit 信息

---

## 📝 后续维护

### 更新代码到 GitHub（以后使用）

```powershell
# 1. 查看修改
git status

# 2. 添加修改的文件
git add .

# 3. 提交修改
git commit -m "描述您的修改内容"

# 4. 推送到 GitHub
git push
```

---

### 克隆到另一台电脑（同步下来）

```powershell
# 在新电脑上
cd "目标文件夹"
git clone https://github.com/rayrayray555/Super-Find-Bar-Chrome-Extension.git
cd Super-Find-Bar-Chrome-Extension
```

---

### 查看提交历史

```powershell
git log --oneline
```

---

### 创建 Release（发布版本）

1. 访问 GitHub 仓库
2. 点击 "Releases" → "Create a new release"
3. 填写信息：
   - **Tag**: `v1.0.0`
   - **Title**: `Super Find Bar V1.0 - Initial Release`
   - **Description**: 复制 `V1.0_RELEASE_NOTES.md` 的内容
4. 可选：上传 ZIP 文件（打包 `extension/` 文件夹）
5. 点击 "Publish release"

---

## ⚠️ 常见问题

### Q1: push 失败，提示 "Permission denied"
**A**: 可能是 Personal Access Token 过期或权限不足
- 重新生成 PAT：https://github.com/settings/tokens
- 确保勾选了 `repo` 权限

---

### Q2: 提示 "fatal: 'origin' already exists"
**A**: 远程仓库已添加，跳过步骤 6，直接执行步骤 7

---

### Q3: 想修改最后一次 commit 信息
**A**:
```powershell
git commit --amend -m "新的提交信息"
git push --force  # 注意：只在还没有人 clone 时使用
```

---

### Q4: 不小心上传了不该上传的文件
**A**:
```powershell
# 从 Git 追踪中移除（但保留本地文件）
git rm --cached 文件名

# 更新 .gitignore
echo "文件名" >> .gitignore

# 提交修改
git add .gitignore
git commit -m "Remove unwanted file"
git push
```

---

### Q5: 想要回到之前的版本
**A**:
```powershell
# 查看历史
git log --oneline

# 回到某个版本（替换 xxxxxxx 为 commit ID）
git reset --hard xxxxxxx

# 强制推送到 GitHub（谨慎使用！）
git push --force
```

---

## 🎯 检查清单（同步前）

- [ ] 已测试扩展功能（高亮速度、Ctrl+Shift+F 快捷键）
- [ ] 已确认 `.gitignore` 正常工作（没有垃圾文件）
- [ ] 已创建 GitHub 仓库（Public，空仓库）
- [ ] 已准备好 Personal Access Token（如需要）

---

## 🎉 同步完成后

1. **添加 Topics 标签**（在 GitHub 仓库页面）
   - chrome-extension
   - search
   - find-in-page
   - javascript
   - fuzzy-search
   - regex-search

3. **创建 Release v1.0.0**
   - 上传打包文件
   - 复制发布说明

4. **分享您的项目**
   - 在 V2EX、掘金等社区发布
   - 标题建议："开源了一个 Chrome 搜索增强扩展，性能提升 200 倍"

---

**祝您的扩展大获成功！** 🚀

如有问题，随时在 GitHub Issues 反馈！

