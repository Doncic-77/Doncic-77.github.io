#!/bin/bash
# 为所有文章设置基于路径的 permalink

cd deploy/source/_posts

for link in *.md; do
  if [ -L "$link" ]; then
    # 获取符号链接指向的实际文件路径
    real_file=$(readlink -f "$link")
    
    # 获取相对于项目根目录的路径
    project_root="$(cd ../../.. && pwd)"
    relative_path=$(realpath --relative-to="$project_root" "$real_file")
    
    # 转换为 URL 路径：book/heart/the-road-to-financial-freedom.md -> book/heart/the-road-to-financial-freedom
    url_path=$(echo "$relative_path" | sed 's|\.md$||' | sed 's| |/|g')
    
    # 读取文件内容
    content=$(cat "$real_file")
    
    # 检查是否已有 permalink
    if ! echo "$content" | grep -q "^permalink:"; then
      # 在 front matter 的 tags 后面添加 permalink
      if echo "$content" | grep -q "^tags:"; then
        # 在 tags 行后添加 permalink
        content=$(echo "$content" | sed "/^tags:/a\\
permalink: $url_path
")
      elif echo "$content" | grep -q "^updated:"; then
        # 在 updated 行后添加 permalink
        content=$(echo "$content" | sed "/^updated:/a\\
permalink: $url_path
")
      else
        # 在 date 行后添加 permalink
        content=$(echo "$content" | sed "/^date:/a\\
permalink: $url_path
")
      fi
      
      # 写回文件
      echo "$content" > "$real_file"
      echo "Set permalink for $real_file: $url_path"
    fi
  fi
done

