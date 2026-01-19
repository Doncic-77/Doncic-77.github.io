#!/bin/bash
# 创建新文章的辅助脚本
# 用法: ./new-post.sh "文章标题"

if [ -z "$1" ]; then
    echo "用法: $0 \"文章标题\""
    exit 1
fi

TITLE="$1"
# 获取项目根目录（deploy/scripts/ 的上级目录的上级目录）
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

# 将标题转换为文件名（小写，空格替换为横线）
FILENAME=$(echo "$TITLE" | tr '[:upper:]' '[:lower:]' | sed 's/[^a-z0-9]/-/g' | sed 's/--*/-/g' | sed 's/^-\|-$//g')
FILENAME="${FILENAME}.md"

# 当前时间
DATE=$(date '+%Y-%m-%d %H:%M:%S')

# 创建文件
cat > "$PROJECT_ROOT/blog/$FILENAME" << EOF
---
title: $TITLE
date: $DATE
updated: $DATE
tags:
---
EOF

echo "文章已创建: $PROJECT_ROOT/blog/$FILENAME"
echo "创建时间: $DATE"
echo ""
echo "请编辑 $PROJECT_ROOT/blog/$FILENAME 来编写文章内容"

