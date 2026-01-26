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
  const categoryName = pathMatch ? pathMatch[1] : null;
  
  // 判断是 categories 首页还是具体分类页面
  const isCategoriesIndex = data.path === 'categories/index.html';
  
  if (isCategoriesIndex) {
    // 处理 categories 首页：只显示顶级分类
    return renderCategoriesIndex(str, allCategories);
  } else if (categoryName) {
    // 处理具体分类页面：只显示直接子分类
    return renderCategoryPage(str, allCategories, categoryName);
  }
  
  return str;
});

// 渲染 categories 首页
function renderCategoriesIndex(str, allCategories) {
  // 收集所有顶级分类名（从所有分类路径中提取）
  const topLevelMap = new Map(); // name -> { totalCount, path }
  
  allCategories.forEach(cat => {
    const topName = cat.name.split('/')[0];
    
    if (!topLevelMap.has(topName)) {
      topLevelMap.set(topName, { totalCount: 0, path: null });
    }
    
    const entry = topLevelMap.get(topName);
    entry.totalCount += cat.length || 0;
    
    // 如果这个分类名正好是顶级分类，记录它的 path
    if (cat.name === topName) {
      entry.path = cat.path;
    }
  });
  
  // 构建顶级分类列表
  const topLevelCategories = [];
  topLevelMap.forEach((value, name) => {
    topLevelCategories.push({
      name: name,
      path: value.path || ('categories/' + name),
      length: value.totalCount
    });
  });
  
  // 按名称排序
  topLevelCategories.sort((a, b) => a.name.localeCompare(b.name));
  
  const html = generateCategoryTable(topLevelCategories, null);
  return replaceCategoryContent(str, html);
}

// 渲染具体分类页面
function renderCategoryPage(str, allCategories, categoryName) {
  // 收集直接子分类（只显示第一级子分类）
  const childrenMap = new Map(); // fullChildName -> { name, totalCount, path }
  
  allCategories.forEach(cat => {
    if (cat.name.startsWith(categoryName + '/')) {
      const remaining = cat.name.substring(categoryName.length + 1);
      const firstLevelName = remaining.split('/')[0];
      const fullChildName = categoryName + '/' + firstLevelName;
      
      if (!childrenMap.has(fullChildName)) {
        childrenMap.set(fullChildName, { name: firstLevelName, totalCount: 0, path: null });
      }
      
      const entry = childrenMap.get(fullChildName);
      entry.totalCount += cat.length || 0;
      
      // 如果这个分类名正好是直接子分类，记录它的 path
      if (cat.name === fullChildName) {
        entry.path = cat.path;
      }
    }
  });
  
  // 构建子分类列表
  const children = [];
  childrenMap.forEach((value, fullName) => {
    children.push({
      name: value.name,
      fullName: fullName,
      path: value.path || ('categories/' + fullName),
      length: value.totalCount
    });
  });
  
  // 按名称排序
  children.sort((a, b) => a.name.localeCompare(b.name));
  
  if (children.length > 0) {
    // 有子分类，显示子分类列表（替换掉文章列表）
    const html = generateCategoryTable(children, categoryName);
    return replaceCategoryContent(str, html);
  }
  
  // 没有子分类，保持原有的文章列表，但添加导航
  return addNavigationToArticleList(str, categoryName);
}

// 生成分类表格 HTML
function generateCategoryTable(categories, parentCategory) {
  // 构建面包屑导航
  let breadcrumbHtml = '';
  if (parentCategory) {
    const parts = parentCategory.split('/');
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
  if (parentCategory) {
    const parts = parentCategory.split('/');
    if (parts.length > 1) {
      const parentPath = parts.slice(0, -1).join('/');
      backLink = `<a href="/categories/${parentPath}/" class="qoj-back-link">◀ Back</a>`;
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
    const href = '/' + cat.path + '/';
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

// 为文章列表添加导航
function addNavigationToArticleList(str, categoryName) {
  const parts = categoryName.split('/');
  
  // 构建面包屑
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
  
  // 返回链接
  let backLink = '';
  if (parts.length > 1) {
    const parentPath = parts.slice(0, -1).join('/');
    backLink = `<a href="/categories/${parentPath}/" class="qoj-back-link">◀ Back</a>`;
  } else {
    backLink = `<a href="/categories/" class="qoj-back-link">◀ Back</a>`;
  }
  
  const navHtml = `
<style>
  .qoj-category-nav { margin-bottom: 20px; }
  .qoj-category-nav a { color: #4285f4; text-decoration: none; }
  .qoj-category-nav a:hover { text-decoration: underline; }
  .qoj-back-link { float: right; }
  .qoj-nav-header { margin-bottom: 15px; display: flex; justify-content: space-between; align-items: center; color: #666; }
</style>
<div class="qoj-category-nav">
  <div class="qoj-nav-header">
    <span>Location: ${breadcrumbHtml}</span>
    ${backLink}
  </div>
</div>
`;
  
  // 在内容区域开始处插入导航
  // 尝试多种模式
  const patterns = [
    // Butterfly 主题的 category-lists
    /(<div[^>]*class="[^"]*category-lists[^"]*"[^>]*>)/,
    // article-container
    /(<div[^>]*id="article-container"[^>]*>[\s\S]*?<article[^>]*>)/,
    // 直接在 main 后面
    /(<main[^>]*>[\s\S]*?<div[^>]*class="[^"]*layout[^"]*"[^>]*>)/
  ];
  
  for (const pattern of patterns) {
    if (pattern.test(str)) {
      return str.replace(pattern, '$1' + navHtml);
    }
  }
  
  return str;
}

// 替换分类内容区域 - 使用最强大的匹配策略
function replaceCategoryContent(str, newContent) {
  // 策略1: 直接查找并替换 .category-lists div 及其所有内容
  // 使用更精确的匹配，包括可能的嵌套结构
  // list_categories() 可能生成 <ul><li> 嵌套结构
  const categoryListsRegex = /<div[^>]*class="[^"]*category-lists[^"]*"[^>]*>[\s\S]*?<\/div>/;
  const match = str.match(categoryListsRegex);
  if (match) {
    // 计算匹配的 div 标签深度，找到对应的闭合标签
    const matchStart = str.indexOf(match[0]);
    const matchContent = match[0];
    
    // 简单替换：直接替换整个匹配
    return str.replace(categoryListsRegex, '<div class="category-lists">' + newContent + '</div>');
  }
  
  // 策略2: 如果找不到 category-lists，查找包含分类链接的区域
  // list_categories 会生成包含 /categories/ 链接的 HTML
  const categoryLinksRegex = /<div[^>]*>[\s\S]*?<a[^>]*href="[^"]*\/categories\/[^"]*"[\s\S]*?<\/div>/;
  if (categoryLinksRegex.test(str)) {
    // 找到包含分类链接的 div，尝试替换
    const linkMatch = str.match(categoryLinksRegex);
    if (linkMatch) {
      // 查找这个 div 的开始位置
      const linkMatchStart = str.indexOf(linkMatch[0]);
      // 向前查找最近的 <div class="category-lists"> 或类似的 div
      const beforeMatch = str.substring(0, linkMatchStart);
      const categoryDivMatch = beforeMatch.match(/<div[^>]*class="[^"]*category[^"]*"[^>]*>/);
      if (categoryDivMatch) {
        const divStart = categoryDivMatch[0];
        const divStartPos = beforeMatch.lastIndexOf(divStart);
        // 向后查找对应的 </div>
        const afterMatch = str.substring(linkMatchStart + linkMatch[0].length);
        const divEndPos = afterMatch.indexOf('</div>');
        if (divEndPos !== -1) {
          const beforeDiv = str.substring(0, divStartPos);
          const afterDiv = afterMatch.substring(divEndPos + 6);
          return beforeDiv + '<div class="category-lists">' + newContent + '</div>' + afterDiv;
        }
      }
    }
  }
  
  // 策略3: 查找 article 标签，替换其中的分类列表部分
  const articleRegex = /(<article[^>]*>)([\s\S]*?)(<\/article>)/;
  if (articleRegex.test(str)) {
    const articleMatch = str.match(articleRegex);
    if (articleMatch) {
      const articleContent = articleMatch[2];
      // 提取标题
      const titleMatch = articleContent.match(/<h1[^>]*>[\s\S]*?<\/h1>/);
      const titleHtml = titleMatch ? titleMatch[0] : '';
      
      // 查找并替换分类列表部分
      // 可能包含 <ul>、<li>、<a> 等标签
      const listPattern = /(<div[^>]*class="[^"]*category[^"]*"[^>]*>[\s\S]*?<\/div>|<ul[^>]*>[\s\S]*?<\/ul>)/;
      if (listPattern.test(articleContent)) {
        const replacedContent = articleContent.replace(listPattern, '<div class="category-lists">' + newContent + '</div>');
        return str.replace(articleRegex, '$1' + replacedContent + '$3');
      } else {
        // 如果没有找到，在标题后插入
        return str.replace(articleRegex, '$1' + titleHtml + '<div class="category-lists">' + newContent + '</div>$3');
      }
    }
  }
  
  // 策略4: 最后手段 - 查找 body 标签，在合适位置插入
  const bodyRegex = /(<body[^>]*>)([\s\S]*?)(<\/body>)/;
  if (bodyRegex.test(str)) {
    const bodyMatch = str.match(bodyRegex);
    if (bodyMatch) {
      const bodyContent = bodyMatch[2];
      // 查找 main 或 article-container
      const mainMatch = bodyContent.match(/(<main[^>]*>|<div[^>]*id="article-container"[^>]*>)/);
      if (mainMatch) {
        const mainPos = bodyContent.indexOf(mainMatch[0]);
        const beforeMain = bodyContent.substring(0, mainPos);
        const afterMain = bodyContent.substring(mainPos);
        // 在 main 后插入
        return str.replace(bodyRegex, '$1' + beforeMain + afterMain.replace(/(<main[^>]*>|<div[^>]*id="article-container"[^>]*>)/, '$1<div class="category-lists">' + newContent + '</div>') + '$3');
      }
    }
  }
  
  // 如果所有策略都失败，在 </body> 前插入（作为最后手段）
  if (str.includes('</body>')) {
    return str.replace('</body>', '<div class="category-lists">' + newContent + '</div></body>');
  }
  
  return str;
}
