// Hexo 脚本：为所有分类层级生成页面（包括中间层级）
// 这样即使某个分类没有直接文章，只要有子分类，也会生成页面
// 例如：book/heart/xxx 会生成 /categories/book/ 和 /categories/book/heart/ 页面

const pagination = require('hexo-pagination');

hexo.extend.generator.register('category-pages', function(locals) {
  const config = this.config;
  const perPage = config.category_generator ? config.category_generator.per_page : (config.per_page || 10);
  const paginationDir = config.pagination_dir || 'page';
  const categoryDir = config.category_dir || 'categories';
  
  const result = [];
  const allCategories = locals.categories.toArray();
  
  // 收集所有需要生成页面的分类路径（包括中间层级）
  const categoryPaths = new Set();
  
  allCategories.forEach(category => {
    const parts = category.name.split('/');
    
    // 为每个层级创建路径（包括中间层级）
    for (let i = 1; i <= parts.length; i++) {
      const path = parts.slice(0, i).join('/');
      categoryPaths.add(path);
    }
  });
  
  // 为每个分类路径生成页面
  categoryPaths.forEach(categoryPath => {
    // 检查是否已经有 Hexo 内置的分类页面
    const existingCategory = allCategories.find(cat => cat.name === categoryPath);
    
    // 收集属于这个分类或其子分类的所有文章
    const allPosts = [];
    allCategories.forEach(cat => {
      if (cat.name === categoryPath || cat.name.startsWith(categoryPath + '/')) {
        allPosts.push(...cat.posts.toArray());
      }
    });
    
    // 去重
    const uniquePosts = [...new Map(allPosts.map(p => [p._id, p])).values()];
    
    // 检查是否有直接子分类
    const hasChildren = allCategories.some(cat => 
      cat.name.startsWith(categoryPath + '/') && 
      cat.name !== categoryPath
    );
    
    // 如果 Hexo 内置已经为这个分类生成了页面，跳过
    // （避免重复生成，让内置 generator 处理叶子分类）
    if (existingCategory) {
      return;
    }
    
    // 只为中间层级生成页面（即那些不存在于 allCategories 中的路径）
    const categoryPathForUrl = categoryDir + '/' + categoryPath;
    
    const pageData = pagination(categoryPathForUrl, uniquePosts, {
      perPage: hasChildren ? 0 : perPage, // 有子分类时不分页
      layout: ['category', 'archive', 'index'],
      format: paginationDir + '/%d/',
      data: {
        category: categoryPath,
        hasChildren: hasChildren
      }
    });
    
    result.push(...pageData);
  });
  
  return result;
});
