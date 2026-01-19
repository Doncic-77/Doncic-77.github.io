#!/bin/bash
# 更新文章的修改时间
# 用法: ./update-post-date.sh "文章文件名.md" 或 "分类目录/文章.md"
# 示例: ./update-post-date.sh "hello-world.md"
# 示例: ./update-post-date.sh "随笔/hello-world.md"
# 示例: ./update-post-date.sh "前端/React/文章.md"

if [ -z "$1" ]; then
    echo "用法: $0 \"文章文件名.md\" 或 \"分类目录/文章.md\""
    echo "示例: $0 hello-world.md"
    echo "示例: $0 随笔/hello-world.md"
    echo "示例: $0 前端/React/文章.md"
    exit 1
fi

# 获取项目根目录（deploy/scripts/ 的上级目录的上级目录）
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

# 查找文章文件（支持在任意目录中）
POST_FILE=""
if [ -f "$PROJECT_ROOT/$1" ]; then
    POST_FILE="$PROJECT_ROOT/$1"
elif [ -f "$1" ]; then
    POST_FILE="$1"
else
    # 在所有非 deploy 目录中查找
    POST_FILE=$(find "$PROJECT_ROOT" -name "$1" -type f -not -path "*/deploy/*" -not -path "*/.git/*" | head -1)
fi

if [ -z "$POST_FILE" ] || [ ! -f "$POST_FILE" ]; then
    echo "错误: 文件不存在: $1"
    echo "提示: 可以使用相对路径，如 '随笔/文章.md' 或 '前端/React/文章.md'"
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

# 获取文件相对于项目根目录的路径
RELATIVE_PATH=$(echo "$POST_FILE" | sed "s|^$PROJECT_ROOT/||")

echo "完成！请提交更改:"
echo "  cd $PROJECT_ROOT"
echo "  git add $RELATIVE_PATH && git commit -m '更新文章时间' && git push"
