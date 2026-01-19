#!/bin/bash
# 同步 blog/ 目录中的 .md 文件到 deploy/source/_posts/

cd "$(dirname "$0")"
rm -f deploy/source/_posts/*.md

for f in blog/*.md; do
    if [ -f "$f" ]; then
        filename=$(basename "$f")
        cd deploy/source/_posts
        ln -sf "../../../blog/$filename" "$filename"
        cd - > /dev/null
    fi
done

echo "Blog posts synced to deploy/source/_posts/"

