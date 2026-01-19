#!/bin/bash
# 更新文章的修改时间
# 用法: ./update-post-date.sh "文章文件名.md"

if [ -z "$1" ]; then
    echo "用法: $0 \"文章文件名.md\""
    echo "示例: $0 hello-world.md"
    exit 1
fi

# 获取项目根目录（deploy/scripts/ 的上级目录的上级目录）
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
POST_FILE="$PROJECT_ROOT/blog/$1"

if [ ! -f "$POST_FILE" ]; then
    echo "错误: 文件不存在: $POST_FILE"
    exit 1
fi

# 获取当前时间
UPDATED_DATE=$(date '+%Y-%m-%d %H:%M:%S')

# 检查文件是否已有 updated 字段
if grep -q "^updated:" "$POST_FILE"; then
    # 更新现有的 updated 字段
    if [[ "$OSTYPE" == "darwin"* ]]; then
        # macOS
        sed -i '' "s/^updated:.*/updated: $UPDATED_DATE/" "$POST_FILE"
    else
        # Linux
        sed -i "s/^updated:.*/updated: $UPDATED_DATE/" "$POST_FILE"
    fi
    echo "已更新修改时间: $UPDATED_DATE"
else
    # 添加 updated 字段（在 date 字段后面）
    if [[ "$OSTYPE" == "darwin"* ]]; then
        # macOS
        sed -i '' "/^date:/a\\
updated: $UPDATED_DATE
" "$POST_FILE"
    else
        # Linux
        sed -i "/^date:/a updated: $UPDATED_DATE" "$POST_FILE"
    fi
    echo "已添加修改时间: $UPDATED_DATE"
fi

echo "完成！请提交更改:"
echo "  cd $PROJECT_ROOT"
echo "  git add blog/ && git commit -m '更新文章时间' && git push"

