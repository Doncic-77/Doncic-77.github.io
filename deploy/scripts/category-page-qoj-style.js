// Hexo 脚本：修改 category 页面，实现 QOJ 风格的导航
// 如果有子分类，显示子分类列表；如果没有子分类，显示文章列表

hexo.extend.filter.register('after_render:html', function(str, data) {
  // 只处理 category 页面（不是 categories 索引页）
  if (!data.path || !data.path.includes('categories/') || data.path === 'categories/index.html') {
    return str;
  }
  
  // 从页面数据中获取分类信息
  const categoryName = data.page && data.page.category;
  if (!categoryName) return str;
  
  // 获取所有分类
  const allCategories = hexo.locals.get('categories');
  if (!allCategories) return str;
  
  // 找到当前分类
  const currentCategory = allCategories.findOne({name: categoryName});
  if (!currentCategory) return str;
  
  // 获取子分类（名称以 "categoryName/" 开头的分类）
  const children = [];
  allCategories.forEach(cat => {
    if (cat.name && cat.name.includes('/')) {
      const parts = cat.name.split('/');
      // 检查是否是直接子分类（只有一级深度）
      if (parts.length === 2 && parts[0] === categoryName) {
        children.push(cat);
      } else if (parts.length > 2 && parts[0] === categoryName) {
        // 多级子分类，只取第一级
        const firstLevelName = categoryName + '/' + parts[1];
        if (!children.find(c => c.name === firstLevelName)) {
          // 创建一个虚拟的分类对象
          const virtualCat = {
            name: firstLevelName,
            path: 'categories/' + firstLevelName,
            length: 0
          };
          // 计算这个虚拟分类下的文章数
          allCategories.forEach(subCat => {
            if (subCat.name && subCat.name.startsWith(firstLevelName + '/')) {
              virtualCat.length += subCat.length || 0;
            }
          });
          children.push(virtualCat);
        }
      }
    }
  });
  
  // 如果有子分类，在文章列表前插入子分类表格
  if (children.length > 0) {
    let subcategoriesHTML = `
<div style="margin-bottom: 30px;">
  <h2 style="font-size: 1.5em; margin-bottom: 15px;">子分类</h2>
  <table style="width: 100%; border-collapse: collapse;">
    <thead>
      <tr style="border-bottom: 2px solid #ddd;">
        <th style="text-align: left; padding: 10px; font-weight: bold;">分类</th>
        <th style="text-align: right; padding: 10px; font-weight: bold;">文章数</th>
      </tr>
    </thead>
    <tbody>
`;
    
    children.forEach(child => {
      const childName = child.name.split('/').pop();
      subcategoriesHTML += `
      <tr style="border-bottom: 1px solid #eee;">
        <td style="padding: 10px;">
          <a href="/${child.path}/" style="color: #4285f4; text-decoration: none; display: flex; align-items: center;">
            <span style="margin-right: 8px;">📁</span>
            <span>${childName}</span>
          </a>
        </td>
        <td style="text-align: right; padding: 10px; color: #666;">${child.length || 0}</td>
      </tr>
`;
    });
    
    subcategoriesHTML += `
    </tbody>
  </table>
</div>
`;
    
    // 如果有子分类，替换整个文章列表区域为子分类表格
    // 查找 #category 或 .article-sort 区域
    const categoryBlockPattern = /<div[^>]*id="category"[^>]*>[\s\S]*?<\/div>/;
    const articleSortPattern = /<div[^>]*class="article-sort"[^>]*>[\s\S]*?<\/div>/;
    
    if (categoryBlockPattern.test(str)) {
      // 替换整个 category 块
      str = str.replace(categoryBlockPattern, '<div id="category">' + subcategoriesHTML + '</div>');
    } else if (articleSortPattern.test(str)) {
      // 替换 article-sort 块
      str = str.replace(articleSortPattern, '<div class="article-sort">' + subcategoriesHTML + '</div>');
    } else {
      // 如果都没找到，在 body 内容区域插入
      const bodyPattern = /(<body[^>]*>[\s\S]*?<main[^>]*>|<main[^>]*>)/;
      if (bodyPattern.test(str)) {
        str = str.replace(bodyPattern, '$1' + subcategoriesHTML);
      }
    }
  }
  
  return str;
});

