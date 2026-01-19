# 将 scripts-tools 移动到 deploy/ 目录

## 操作说明

将部署相关的脚本工具目录 `scripts-tools/` 移动到 `deploy/` 目录下，使其与 Hexo 配置保持一致。

## 执行的操作

```bash
# 将 scripts-tools 移动到 deploy/ 目录
mv scripts-tools deploy/
```

## 原因

- `scripts-tools/` 包含的是部署相关的脚本（`new-post.sh`、`update-post-date.sh`）
- 这些脚本与 Hexo 配置和部署流程相关
- 将它们放在 `deploy/` 目录下，使项目结构更清晰：
  - `deploy/` - 所有 Hexo 和部署相关的文件
  - 其他目录 - 文章内容

## 目录结构

移动后的结构：
```
/root/code/
├── deploy/
│   ├── scripts-tools/      # 部署相关脚本
│   │   ├── new-post.sh
│   │   └── update-post-date.sh
│   ├── _config.yml
│   ├── source/
│   └── ...
├── book/
├── prompt/                 # 操作记录
└── ...
```

## 使用方式

移动后，脚本的使用方式需要更新路径：

```bash
# 之前
./scripts-tools/new-post.sh "文章标题" "分类目录"

# 之后
./deploy/scripts-tools/new-post.sh "文章标题" "分类目录"
```

## 日期

2026-01-19

