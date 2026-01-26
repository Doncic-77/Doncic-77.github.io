// Hexo 脚本：实现 QOJ 风格的分类导航（类似 Windows 文件系统）
// 1. categories 首页只显示顶级分类
// 2. 每个分类页面只显示直接子分类（点击进入下一层）
// 3. 添加 Location 路径导航和 Back 返回按钮
// 4. 叶子分类显示文章列表

// 方法：使用 after_render:html 过滤器完全替换分类列表的 HTML

hexo.extend.filter.register('after_render:html', function(str, data) {
  // 只处理 categories 相关页面
  if (!data.path || !data.path.startsWith('categories/')) {
    return str;
  }
  
  const allCategories = hexo.locals.get('categories').toArray();
  
  // 从 URL 路径提取分类名
  // categories/index.html -> null (首页)
  // categories/book/index.html -> 'book'
  // categories/book/heart/index.html -> 'book/heart'
  const pathMatch = data.path.match(/^categories\/(.+)\/index\.html$/);
  const categoryPath = pathMatch ? pathMatch[1] : null;
  
  // 判断是 categories 首页还是具体分类页面
  const isCategoriesIndex = data.path === 'categories/index.html';
  
  if (isCategoriesIndex) {
    // 处理 categories 首页：只显示顶级分类
    return renderCategoriesIndex(str, allCategories);
  } else if (categoryPath) {
    // 处理具体分类页面：只显示直接子分类
    return renderCategoryPage(str, allCategories, categoryPath);
  }
  
  return str;
});

// 从分类的 path 属性提取层级路径
// 例如：categories/book/heart/ -> book/heart
function getCategoryPath(cat) {
  // path 格式：categories/xxx/yyy/
  const match = cat.path.match(/^categories\/(.+)\/$/);
  return match ? match[1] : cat.name;
}

// 获取路径的深度（层级数）
function getPathDepth(pathStr) {
  return pathStr.split('/').length;
}

// 渲染 categories 首页：只显示顶级分类
function renderCategoriesIndex(str, allCategories) {
  // 顶级分类：path 中只有一级，如 categories/book/
  const topLevelCategories = allCategories.filter(cat => {
    const catPath = getCategoryPath(cat);
    return getPathDepth(catPath) === 1;
  });
  
  // 计算每个顶级分类的总文章数（包括所有子分类）
  const categoriesWithCount = topLevelCategories.map(cat => {
    const catPath = getCategoryPath(cat);
    let totalCount = cat.length || 0;
    
    // 统计所有子分类的文章数
    allCategories.forEach(subCat => {
      const subPath = getCategoryPath(subCat);
      if (subPath.startsWith(catPath + '/')) {
        totalCount += subCat.length || 0;
      }
    });
    
    return {
      name: cat.name,
      path: cat.path,
      length: totalCount
    };
  });
  
  // 按名称排序
  categoriesWithCount.sort((a, b) => a.name.localeCompare(b.name));
  
  const html = generateCategoryTable(categoriesWithCount, null);
  return replaceCategoryContent(str, html);
}

// 渲染具体分类页面：只显示直接子分类
function renderCategoryPage(str, allCategories, currentPath) {
  const currentDepth = getPathDepth(currentPath);
  
  // 找到直接子分类（深度比当前多1，且前缀匹配）
  const directChildren = allCategories.filter(cat => {
    const catPath = getCategoryPath(cat);
    const catDepth = getPathDepth(catPath);
    return catDepth === currentDepth + 1 && catPath.startsWith(currentPath + '/');
  });
  
  // 计算每个子分类的总文章数（包括其所有后代分类）
  const childrenWithCount = directChildren.map(cat => {
    const catPath = getCategoryPath(cat);
    let totalCount = cat.length || 0;
    
    // 统计所有后代分类的文章数
    allCategories.forEach(subCat => {
      const subPath = getCategoryPath(subCat);
      if (subPath.startsWith(catPath + '/')) {
        totalCount += subCat.length || 0;
      }
    });
    
    return {
      name: cat.name,
      path: cat.path,
      length: totalCount
    };
  });
  
  // 按名称排序
  childrenWithCount.sort((a, b) => a.name.localeCompare(b.name));
  
  if (childrenWithCount.length > 0) {
    // 有子分类，显示子分类列表
    const html = generateCategoryTable(childrenWithCount, currentPath);
    return replaceCategoryContent(str, html);
  }
  
  // 没有子分类，这是叶子节点，显示文章列表（用文件图标风格）
  return renderArticleList(str, allCategories, currentPath);
}

// 生成分类表格 HTML
function generateCategoryTable(categories, parentPath) {
  // 构建面包屑导航
  let breadcrumbHtml = '';
  if (parentPath) {
    const parts = parentPath.split('/');
    let pathAccum = '';
    breadcrumbHtml = '<a href="/categories/">root</a>';
    parts.forEach((part, idx) => {
      pathAccum += (idx === 0 ? '' : '/') + part;
      const isLast = idx === parts.length - 1;
      if (isLast) {
        breadcrumbHtml += ` / <span style="font-weight: bold;">${part}</span>`;
      } else {
        breadcrumbHtml += ` / <a href="/categories/${pathAccum}/">${part}</a>`;
      }
    });
  } else {
    breadcrumbHtml = '<span style="font-weight: bold;">root</span>';
  }
  
  // 构建返回链接
  let backLink = '';
  if (parentPath) {
    const parts = parentPath.split('/');
    if (parts.length > 1) {
      const parentOfParent = parts.slice(0, -1).join('/');
      backLink = `<a href="/categories/${parentOfParent}/" class="qoj-back-link">◀ Back</a>`;
    } else {
      backLink = `<a href="/categories/" class="qoj-back-link">◀ Back</a>`;
    }
  }
  
  let html = `
<style>
  .qoj-category-nav { margin-bottom: 20px; }
  .qoj-category-nav a { color: #4285f4; text-decoration: none; }
  .qoj-category-nav a:hover { text-decoration: underline; }
  .qoj-back-link { float: right; }
  .qoj-nav-header { margin-bottom: 15px; display: flex; justify-content: space-between; align-items: center; color: #666; }
  .qoj-category-table { width: 100%; border-collapse: collapse; }
  .qoj-category-table thead tr { border-bottom: 2px solid #ddd; background: #f8f9fa; }
  .qoj-category-table th { text-align: left; padding: 12px 15px; font-weight: bold; }
  .qoj-category-table th:last-child { text-align: right; width: 120px; }
  .qoj-category-table tbody tr { border-bottom: 1px solid #eee; }
  .qoj-category-table tbody tr:hover { background: #f5f5f5; }
  .qoj-category-table td { padding: 12px 15px; }
  .qoj-category-table td:last-child { text-align: right; color: #666; }
  .qoj-folder-icon { margin-right: 10px; color: #5bc0de; }
</style>
<div class="qoj-category-nav">
  <div class="qoj-nav-header">
    <span>Location: ${breadcrumbHtml}</span>
    ${backLink}
  </div>
  <table class="qoj-category-table">
    <thead>
      <tr>
        <th>Category</th>
        <th>文章数</th>
      </tr>
    </thead>
    <tbody>
`;
  
  categories.forEach(cat => {
    const displayName = cat.name;
    // 修复双斜杠问题
    const href = '/' + cat.path.replace(/\/+$/, '') + '/';
    html += `
      <tr>
        <td>
          <a href="${href}">
            <span class="qoj-folder-icon">📁</span><span>${displayName}</span>
          </a>
        </td>
        <td>${cat.length}</td>
      </tr>
`;
  });
  
  html += `
    </tbody>
  </table>
</div>
`;
  
  return html;
}

// 渲染叶子节点的文章列表（用文件图标风格）
function renderArticleList(str, allCategories, currentPath) {
  // 找到当前分类
  const currentCategory = allCategories.find(cat => {
    const catPath = getCategoryPath(cat);
    return catPath === currentPath;
  });
  
  // 获取文章列表
  let posts = [];
  if (currentCategory && currentCategory.posts) {
    posts = currentCategory.posts.toArray();
  }
  
  // 按标题排序
  posts.sort((a, b) => (a.title || '').localeCompare(b.title || ''));
  
  const html = generateArticleTable(posts, currentPath);
  return replaceCategoryContent(str, html);
}

// 生成文章表格 HTML（叶子节点用）
function generateArticleTable(posts, parentPath) {
  // 构建面包屑导航
  const parts = parentPath.split('/');
  let breadcrumbHtml = '<a href="/categories/">root</a>';
  let pathAccum = '';
  parts.forEach((part, idx) => {
    pathAccum += (idx === 0 ? '' : '/') + part;
    const isLast = idx === parts.length - 1;
    if (isLast) {
      breadcrumbHtml += ` / <span style="font-weight: bold;">${part}</span>`;
    } else {
      breadcrumbHtml += ` / <a href="/categories/${pathAccum}/">${part}</a>`;
    }
  });
  
  // 构建返回链接
  let backLink = '';
  if (parts.length > 1) {
    const parentOfParent = parts.slice(0, -1).join('/');
    backLink = `<a href="/categories/${parentOfParent}/" class="qoj-back-link">◀ Back</a>`;
  } else {
    backLink = `<a href="/categories/" class="qoj-back-link">◀ Back</a>`;
  }
  
  let html = `
<style>
  .qoj-category-nav { margin-bottom: 20px; }
  .qoj-category-nav a { color: #4285f4; text-decoration: none; }
  .qoj-category-nav a:hover { text-decoration: underline; }
  .qoj-back-link { float: right; }
  .qoj-nav-header { margin-bottom: 15px; display: flex; justify-content: space-between; align-items: center; color: #666; }
  .qoj-category-table { width: 100%; border-collapse: collapse; }
  .qoj-category-table thead tr { border-bottom: 2px solid #ddd; background: #f8f9fa; }
  .qoj-category-table th { text-align: left; padding: 12px 15px; font-weight: bold; }
  .qoj-category-table th:last-child { text-align: right; width: 150px; }
  .qoj-category-table tbody tr { border-bottom: 1px solid #eee; }
  .qoj-category-table tbody tr:hover { background: #f5f5f5; }
  .qoj-category-table td { padding: 12px 15px; }
  .qoj-category-table td:last-child { text-align: right; color: #666; }
  .qoj-file-icon { margin-right: 10px; color: #f0ad4e; }
</style>
<div class="qoj-category-nav">
  <div class="qoj-nav-header">
    <span>Location: ${breadcrumbHtml}</span>
    ${backLink}
  </div>
  <table class="qoj-category-table">
    <thead>
      <tr>
        <th>文章</th>
        <th>日期</th>
      </tr>
    </thead>
    <tbody>
`;
  
  posts.forEach(post => {
    const title = post.title || '未命名';
    // 确保路径以单斜杠开头
    const href = post.path.startsWith('/') ? post.path : '/' + post.path;
    // 格式化日期
    let dateStr = '';
    if (post.date) {
      const d = new Date(post.date);
      dateStr = d.toISOString().split('T')[0]; // YYYY-MM-DD
    }
    html += `
      <tr>
        <td>
          <a href="${href}">
            <span class="qoj-file-icon">📄</span><span>${title}</span>
          </a>
        </td>
        <td>${dateStr}</td>
      </tr>
`;
  });
  
  html += `
    </tbody>
  </table>
</div>
`;
  
  return html;
}

// 替换分类内容区域
function replaceCategoryContent(str, newContent) {
  // 策略1: 替换 .category-lists div（categories 首页使用）
  const categoryListsRegex = /<div[^>]*class="[^"]*category-lists[^"]*"[^>]*>[\s\S]*?<\/div>/;
  if (categoryListsRegex.test(str)) {
    return str.replace(categoryListsRegex, '<div class="category-lists">' + newContent + '</div>');
  }
  
  // 策略2: 替换 #category div（分类页面使用）
  // 匹配 <div id="category">...</div> 直到遇到 </div><div class="aside-content"
  const categoryDivRegex = /<div[^>]*id="category"[^>]*>[\s\S]*?<\/div>(?=<div[^>]*class="[^"]*aside-content)/;
  if (categoryDivRegex.test(str)) {
    return str.replace(categoryDivRegex, '<div id="category">' + newContent + '</div>');
  }
  
  // 策略3: 更宽松的 #category 匹配
  const categoryDivLooseRegex = /(<div[^>]*id="category"[^>]*>)([\s\S]*?)(<\/div>[\s]*<div[^>]*class="[^"]*aside)/;
  if (categoryDivLooseRegex.test(str)) {
    return str.replace(categoryDivLooseRegex, '$1' + newContent + '</div><div class="aside');
  }
  
  // 策略4: 查找 article 标签
  const articleRegex = /(<article[^>]*>)([\s\S]*?)(<\/article>)/;
  if (articleRegex.test(str)) {
    const articleMatch = str.match(articleRegex);
    if (articleMatch) {
      const articleContent = articleMatch[2];
      const titleMatch = articleContent.match(/<h1[^>]*>[\s\S]*?<\/h1>/);
      const titleHtml = titleMatch ? titleMatch[0] : '';
      return str.replace(articleRegex, '$1' + titleHtml + '<div class="category-lists">' + newContent + '</div>$3');
    }
  }
  
  // 策略5: 最后手段 - 在 </body> 前插入
  if (str.includes('</body>')) {
    return str.replace('</body>', '<div class="category-lists">' + newContent + '</div></body>');
  }
  
  return str;
}
