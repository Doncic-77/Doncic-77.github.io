// Hexo 脚本：为 category 页面添加子分类列表（类似 QOJ 的导航）
// 如果有子分类，显示子分类列表；如果没有子分类，显示文章列表

hexo.extend.filter.register('template_locals', function(locals) {
  // 为每个 category 页面添加子分类信息
  if (locals.page && locals.page.category) {
    const categoryName = locals.page.category;
    const category = locals.categories.findOne({name: categoryName});
    
    if (category) {
      // 获取该分类的所有子分类
      const children = locals.categories.filter(cat => {
        // 检查是否是当前分类的子分类
        // Hexo 的 category 结构：如果 cat.name 是 "ml/cs189"，categoryName 是 "ml"
        // 那么 cs189 是 ml 的子分类
        if (cat.name.includes('/')) {
          const parts = cat.name.split('/');
          return parts.length > 1 && parts[0] === categoryName;
        }
        return false;
      });
      
      // 将子分类信息添加到 page 对象
      locals.page.categoryChildren = children.map(cat => ({
        name: cat.name.split('/').pop(), // 只取最后一部分作为显示名
        fullName: cat.name,
        path: cat.path,
        length: cat.length
      }));
    }
  }
  
  return locals;
});

