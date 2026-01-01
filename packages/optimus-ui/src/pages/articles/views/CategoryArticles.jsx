import { useEffect, useState } from 'react';
import { Spin, message } from 'antd';
import ArticleList from './ArticleList';
import { useCategories } from '../../../shared/contexts/CategoryContext';

/**
 * 分类专属文章管理组件
 * 为特定分类提供专属的文章管理页面
 * 
 * @param {Object} props
 * @param {string} props.categoryCode - 分类代码（如 'news', 'activity', 'announcement'）
 */
const CategoryArticles = ({ categoryCode }) => {
  const { categories, loading: categoriesLoading } = useCategories();
  const [category, setCategory] = useState(null);
  const [loading, setLoading] = useState(true);

  // 根据分类代码查找分类
  useEffect(() => {
    if (!categoriesLoading) {
      if (categories.length === 0) {
        message.warning('分类列表为空，请先配置分类');
        setLoading(false);
        return;
      }

      // 递归查找分类
      const findCategoryByCode = (cats, code) => {
        for (const cat of cats) {
          if (cat.code === code) {
            return cat;
          }
          if (cat.children && cat.children.length > 0) {
            const found = findCategoryByCode(cat.children, code);
            if (found) return found;
          }
        }
        return null;
      };

      const foundCategory = findCategoryByCode(categories, categoryCode);
      
      if (foundCategory) {
        setCategory(foundCategory);
      } else {
        message.error(`未找到分类代码为 "${categoryCode}" 的分类`);
      }
      
      setLoading(false);
    }
  }, [categories, categoriesLoading, categoryCode]);

  // 加载中状态
  if (loading || categoriesLoading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        minHeight: '400px' 
      }}>
        <Spin size="large" tip="加载中..." />
      </div>
    );
  }

  // 未找到分类
  if (!category) {
    return (
      <div style={{ padding: '24px', textAlign: 'center' }}>
        <p>未找到对应的分类</p>
      </div>
    );
  }

  // 渲染文章列表，预设分类筛选，隐藏分类筛选器
  return (
    <ArticleList
      categoryId={category.id}
      showCategoryFilter={false}
    />
  );
};

export default CategoryArticles;
