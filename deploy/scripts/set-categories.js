// Hexo 脚本：根据文件路径自动设置 categories
// 这个脚本会在 Hexo 处理文章前运行，为每篇文章设置基于路径的 categories

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
    
    // 转换为标准路径分隔符
    const normalizedPath = relativePath.replace(/\\/g, '/');
    
    // 提取目录结构作为 categories
    // 例如：ml/cs189/lecture1/lecture1.md -> ['ml', 'cs189', 'lecture1']
    const pathParts = normalizedPath.split('/');
    
    // 移除文件名，保留所有目录层级
    const directories = pathParts.slice(0, -1);
    
    // 如果 front matter 中没有 categories，则自动设置
    // Hexo 的 categories 是特殊对象，需要这样判断
    const hasCategories = data.categories && data.categories.data && data.categories.data.length > 0;
    
    if (!hasCategories && directories.length > 0) {
      // 使用 Hexo 的 API 设置 categories
      data.categories = directories;
    }
  } catch (e) {
    // 如果不是符号链接或读取失败，忽略
  }
  
  return data;
});

