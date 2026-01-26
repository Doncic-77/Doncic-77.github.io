// Hexo 脚本：为 categories 页面添加折叠功能
// 这个脚本会在 Hexo 生成页面后运行，为 categories 页面添加折叠/展开功能

hexo.extend.filter.register('after_render:html', function(str, data) {
  // 只处理 categories 页面
  if (!data.path || !data.path.includes('categories/index')) {
    return str;
  }
  
  // 注入折叠功能的 JavaScript
  const collapseScript = `
<script>
(function() {
  document.addEventListener('DOMContentLoaded', function() {
    const categoryLists = document.querySelector('.category-lists');
    if (!categoryLists) return;
    
    // 找到所有有子分类的分类项
    const processCategoryList = function(ul) {
      if (!ul) return;
      
      const items = ul.querySelectorAll('li');
      items.forEach(function(item) {
        const link = item.querySelector('a');
        if (!link) return;
        
        const nested = item.querySelector('ul');
        if (nested && nested.children.length > 0) {
          // 创建折叠按钮
          const toggle = document.createElement('span');
          toggle.className = 'category-folder-toggle';
          toggle.innerHTML = '▶';
          toggle.style.cssText = 'cursor: pointer; margin-right: 8px; display: inline-block; transition: transform 0.2s; user-select: none; color: #666; font-size: 0.85em; vertical-align: middle;';
          
          // 初始隐藏子分类
          nested.style.display = 'none';
          
          // 插入折叠按钮到链接前面
          if (link.parentNode === item) {
            item.insertBefore(toggle, link);
          } else {
            link.parentNode.insertBefore(toggle, link);
          }
          
          // 点击切换
          toggle.addEventListener('click', function(e) {
            e.stopPropagation();
            const isHidden = nested.style.display === 'none';
            nested.style.display = isHidden ? 'block' : 'none';
            toggle.innerHTML = isHidden ? '▼' : '▶';
          });
          
          // 递归处理子分类
          processCategoryList(nested);
        }
      });
    };
    
    // 处理主分类列表
    const mainList = categoryLists.querySelector('ul.category-list, .category-list > ul');
    if (mainList) {
      processCategoryList(mainList);
    } else {
      // 如果没有找到标准结构，尝试处理所有 ul
      categoryLists.querySelectorAll('ul').forEach(processCategoryList);
    }
  });
})();
</script>

<style>
.category-lists .category-list ul {
  list-style: none;
  padding-left: 20px;
  margin: 5px 0;
}

.category-lists .category-list a {
  color: #4285f4;
  text-decoration: none;
}

.category-lists .category-list a:hover {
  text-decoration: underline;
}
</style>
`;
  
  // 在 </body> 标签前插入脚本
  if (str.includes('</body>')) {
    return str.replace('</body>', collapseScript + '</body>');
  }
  
  return str;
});

