# Content.js 拆分计划

## 拆分方案

由于代码量大且功能相互依赖，采用以下模块化结构：

### 模块结构
```
extension/
├── content/
│   ├── config.js          # 配置和常量（已完成）
│   ├── utils.js           # 工具函数
│   ├── visibility.js      # 可见性判断逻辑
│   └── (其他模块...)
└── content.js             # 主入口文件（整合所有模块）
```

### 模块说明

1. **config.js** - 配置管理
   - 常量定义（HOST_ID, BTN_ID, STORAGE_KEY）
   - DEFAULT_CONFIG
   - I18N 翻译
   - loadConfig, saveConfig, saveSessionConfig
   - t() 翻译函数

2. **utils.js** - 工具函数
   - isCJK()
   - findScrollContainer()
   - levenshtein()
   - isRangeValid()
   - showContentChangedWarning()
   - detectSpecialPage()
   - showSpecialPageWarning()

3. **visibility.js** - 可见性判断
   - isVisible()
   - isNaturallyHidden()

4. **content.js** - 主文件
   - 整合所有模块
   - UI 构建
   - 搜索逻辑
   - 高亮逻辑
   - 事件处理
   - 初始化

## 加载顺序

在 manifest.json 中按以下顺序加载：
1. content/config.js
2. content/utils.js
3. content/visibility.js
4. content.js

## 注意事项

- 所有模块通过 window 对象共享全局变量
- 保持向后兼容，确保功能不受影响
- 模块之间通过全局变量通信（CONFIG, state 等）

