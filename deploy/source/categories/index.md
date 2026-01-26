---
title: 分类
date: 2026-01-26 15:20:00
type: "categories"
comments: false
---

<div id="categories-page"></div>

<script>
(function() {
  // 获取所有分类数据
  const allCategories = <%- JSON.stringify(site.categories.toArray().map(cat => ({
    name: cat.name,
    path: cat.path,
    length: cat.length,
    parent: cat.parent ? cat.parent.name : null
  }))) %>;
  
  // 只显示顶级分类（没有父分类的分类）
  const topLevelCategories = allCategories.filter(cat => !cat.parent);
  
  // 构建分类树（只显示当前层级的子分类）
  function buildCategoryTree(categories, parentName) {
    return categories
      .filter(cat => {
        if (parentName === null) {
          return !cat.parent;
        } else {
          return cat.parent === parentName;
        }
      })
      .map(cat => {
        const children = buildCategoryTree(categories, cat.name);
        return {
          ...cat,
          children: children.length > 0 ? children : null
        };
      });
  }
  
  // 渲染分类列表
  function renderCategories(categories, container) {
    if (!categories || categories.length === 0) {
      container.innerHTML = '<p>暂无分类</p>';
      return;
    }
    
    const table = document.createElement('table');
    table.style.cssText = 'width: 100%; border-collapse: collapse; margin-top: 20px;';
    
    // 表头
    const thead = document.createElement('thead');
    const headerRow = document.createElement('tr');
    headerRow.style.cssText = 'border-bottom: 2px solid #ddd;';
    
    const th1 = document.createElement('th');
    th1.textContent = '分类';
    th1.style.cssText = 'text-align: left; padding: 10px; font-weight: bold;';
    
    const th2 = document.createElement('th');
    th2.textContent = '文章数';
    th2.style.cssText = 'text-align: right; padding: 10px; font-weight: bold;';
    
    headerRow.appendChild(th1);
    headerRow.appendChild(th2);
    thead.appendChild(headerRow);
    table.appendChild(thead);
    
    // 表体
    const tbody = document.createElement('tbody');
    
    categories.forEach(cat => {
      const row = document.createElement('tr');
      row.style.cssText = 'border-bottom: 1px solid #eee;';
      
      const td1 = document.createElement('td');
      td1.style.cssText = 'padding: 10px;';
      
      const link = document.createElement('a');
      link.href = '/' + cat.path + '/';
      link.style.cssText = 'color: #4285f4; text-decoration: none; display: flex; align-items: center;';
      
      // 文件夹图标
      const icon = document.createElement('span');
      icon.innerHTML = '📁';
      icon.style.cssText = 'margin-right: 8px;';
      link.appendChild(icon);
      
      // 分类名
      const name = document.createElement('span');
      name.textContent = cat.name;
      link.appendChild(name);
      
      td1.appendChild(link);
      
      const td2 = document.createElement('td');
      td2.textContent = cat.length || 0;
      td2.style.cssText = 'text-align: right; padding: 10px; color: #666;';
      
      row.appendChild(td1);
      row.appendChild(td2);
      tbody.appendChild(row);
    });
    
    table.appendChild(tbody);
    container.appendChild(table);
  }
  
  // 初始化
  const container = document.getElementById('categories-page');
  if (container) {
    const tree = buildCategoryTree(allCategories, null);
    renderCategories(tree, container);
  }
})();
</script>
