// Hexo 脚本：根据文件路径设置 permalink
// 这个脚本会在 Hexo 处理文章前运行，为每篇文章设置基于路径的 permalink

const fs = require('fs');
const path = require('path');

hexo.extend.filter.register('before_post_render', function(data) {
  // 只处理 _posts 目录中的文件（符号链接）
  if (!data.source || !data.source.includes('_posts')) {
    return data;
  }

  // 获取符号链接指向的实际文件路径
  const sourcePath = data.source;
  const fullPath = path.resolve(hexo.source_dir, sourcePath);
  
  try {
    // 读取符号链接的目标
    const realPath = fs.readlinkSync(fullPath);
    const resolvedPath = path.resolve(path.dirname(fullPath), realPath);
    
    // 获取相对于项目根目录的路径
    const projectRoot = path.resolve(hexo.base_dir, '..');
    const relativePath = path.relative(projectRoot, resolvedPath);
    
    // 转换为 URL 路径：book/heart/the-road-to-financial-freedom.md -> book/heart/the-road-to-financial-freedom
    let urlPath = relativePath
      .replace(/\.md$/, '')  // 移除 .md 扩展名
      .replace(/\\/g, '/');  // Windows 路径分隔符转正斜杠
    
    // 如果 front matter 中没有 permalink，则设置
    if (!data.permalink) {
      data.permalink = urlPath + '/';
    }
  } catch (e) {
    // 如果不是符号链接或读取失败，忽略
  }
  
  return data;
});

