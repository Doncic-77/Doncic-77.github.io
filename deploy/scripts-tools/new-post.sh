#!/bin/bash
# 创建新文章的辅助脚本
# 用法: ./new-post.sh "文章标题" [分类目录]
# 示例: ./new-post.sh "React学习" "前端"
# 示例: ./new-post.sh "Node.js实践" "后端/Node.js"

if [ -z "$1" ]; then
    echo "用法: $0 \"文章标题\" [分类目录]"
    echo "示例: $0 \"React学习\" \"前端\""
    echo "示例: $0 \"Node.js实践\" \"后端/Node.js\""
    exit 1
fi

TITLE="$1"
CATEGORY_DIR="${2:-随笔}"  # 默认使用"随笔"目录

# 获取项目根目录（deploy/scripts-tools/ 的上级目录的上级目录）
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

# 创建分类目录（如果不存在）
TARGET_DIR="$PROJECT_ROOT/$CATEGORY_DIR"
mkdir -p "$TARGET_DIR"

# 将标题转换为文件名（小写，空格替换为横线）
FILENAME=$(echo "$TITLE" | tr '[:upper:]' '[:lower:]' | sed 's/[^a-z0-9]/-/g' | sed 's/--*/-/g' | sed 's/^-\|-$//g')
FILENAME="${FILENAME}.md"

# 当前时间
DATE=$(date '+%Y-%m-%d %H:%M:%S')

# 创建文件
cat > "$TARGET_DIR/$FILENAME" << EOF
---
title: $TITLE
date: $DATE
updated: $DATE
tags:
---
EOF

echo "文章已创建: $TARGET_DIR/$FILENAME"
echo "分类目录: $CATEGORY_DIR"
echo "创建时间: $DATE"
echo ""
echo "请编辑 $TARGET_DIR/$FILENAME 来编写文章内容"

