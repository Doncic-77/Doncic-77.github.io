// Hexo 脚本：为所有分类层级生成页面（包括中间层级）
// 这样即使某个分类没有直接文章，只要有子分类，也会生成页面

const pagination = require('hexo-pagination');

hexo.extend.generator.register('category-pages', function(locals) {
  const config = this.config;
  const perPage = config.category_generator ? config.category_generator.per_page : (config.per_page || 10);
  const paginationDir = config.pagination_dir || 'page';
  const orderBy = config.category_generator ? config.category_generator.order_by : '-date';
  const categoryDir = config.category_dir || 'categories';
  
  const result = [];
  const allCategories = locals.categories.toArray();
  
  // 收集所有分类路径（包括中间层级）
  const categoryPaths = new Set();
  
  allCategories.forEach(category => {
    // 如果分类名包含 "/"，说明是层级分类
    if (category.name.includes('/')) {
      const parts = category.name.split('/');
      // 为每个层级创建路径
      for (let i = 1; i < parts.length; i++) {
        const parentPath = parts.slice(0, i).join('/');
        categoryPaths.add(parentPath);
      }
    }
    // 添加完整路径
    categoryPaths.add(category.name);
  });
  
  // 为每个分类路径生成页面
  categoryPaths.forEach(categoryPath => {
    // 找到所有属于这个分类或子分类的文章
    const posts = [];
    const directPosts = [];
    const children = [];
    
    allCategories.forEach(cat => {
      if (cat.name === categoryPath) {
        // 直接属于这个分类的文章
        directPosts.push(...cat.posts.toArray());
      } else if (cat.name.startsWith(categoryPath + '/')) {
        // 子分类
        const childName = cat.name.substring(categoryPath.length + 1).split('/')[0];
        if (!children.find(c => c.name === childName)) {
          children.push({
            name: childName,
            fullName: cat.name,
            path: cat.path,
            length: cat.length
          });
        }
        // 子分类的文章也计入总数
        posts.push(...cat.posts.toArray());
      }
    });
    
    // 合并直接文章和子分类文章
    const allPosts = [...directPosts, ...posts];
    
    // 如果有子分类或文章，生成页面
    if (children.length > 0 || allPosts.length > 0) {
      const pathParts = categoryPath.split('/');
      const categoryUrl = pathParts.join('/');
      const categoryPathForUrl = categoryDir + '/' + categoryUrl;
      
      // 如果有子分类，优先显示子分类（类似 QOJ）
      // 如果没有子分类，显示文章列表
      const pageData = pagination(categoryPathForUrl, allPosts.length > 0 ? allPosts : [], {
        perPage: children.length > 0 ? 0 : perPage, // 有子分类时不分页（因为不显示文章）
        layout: ['category', 'archive', 'index'],
        format: paginationDir + '/%d/',
        data: {
          category: categoryPath,
          categoryChildren: children,
          hasChildren: children.length > 0
        }
      });
      
      result.push(...pageData);
    }
  });
  
  return result;
});

