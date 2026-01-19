# 项目结构设计原则

## 核心需求

根据文件类型和用途，将项目文件分类组织：

- **部署相关的** → 放入 `deploy/` 目录
- **文章内容相关的** → 放入 `book/` 或其他内容目录
- **垃圾文件** → 放入 `trash/` 目录，并在 `.gitignore` 中忽略，不被别人看到

## 设计原则

### 1. 部署相关文件 → `deploy/`

所有与 Hexo 配置、构建、部署相关的文件都应该放在 `deploy/` 目录下：

- Hexo 配置文件（`_config.yml`）
- 部署脚本（`scripts-tools/`）
- GitHub Actions 工作流（`.github/workflows/`）
- 主题和模板文件
- 构建生成的临时文件

**原因**：保持部署配置和文章内容的清晰分离，便于管理和维护。

### 2. 文章内容 → `book/` 等目录

所有文章内容按分类组织在根目录下的各个文件夹中：

- `book/` - 书籍相关文章
- 其他分类目录 - 根据内容主题自由创建

**原因**：文章是核心内容，应该清晰可见，便于管理和访问。

### 3. 垃圾文件 → `trash/` + `.gitignore`

不需要的文件放入 `trash/` 目录，并在 `.gitignore` 中忽略：

```gitignore
trash/
```

**原因**：保留文件但不提交到 Git，避免被别人看到，同时本地可以保留作为备份。

## 项目结构示例

```
/root/code/
├── deploy/              # 部署相关（Hexo 配置、脚本、工作流）
│   ├── scripts-tools/   # 部署脚本
│   ├── _config.yml      # Hexo 配置
│   ├── .github/         # GitHub Actions
│   └── ...
├── book/                # 文章内容（书籍相关）
│   └── heart/
│       └── the-road-to-financial-freedom.md
├── prompt/              # 设计文档和需求记录
│   └── move-scripts-to-deploy.md
├── trash/               # 垃圾文件（在 .gitignore 中）
└── .gitignore          # 忽略 trash/ 目录
```

## 使用场景

这个 prompt 可以用于：

1. **新成员理解项目结构**：快速了解文件组织原则
2. **AI 助手理解项目**：喂给大模型时，能快速理解设计意图
3. **维护项目一致性**：确保新文件放在正确的位置

## 关键决策记录

- **scripts-tools 的位置**：从根目录移动到 `deploy/scripts-tools/`，因为它们是部署相关的工具
- **trash 目录的处理**：在 `.gitignore` 中忽略，保留本地但不提交
- **文章目录的灵活性**：支持多层嵌套，所有非 deploy 目录的文章都会被自动收集和展示

## 日期

2026-01-19
