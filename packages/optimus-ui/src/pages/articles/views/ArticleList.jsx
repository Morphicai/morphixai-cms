import ArticleProTable from '../components/ArticleProTable';

/**
 * 文章列表页面
 * 使用 ProTable 实现强大的表格功能
 */
const ArticleList = ({ categoryId = null, showCategoryFilter = true }) => {
  return (
    <div>
      <ArticleProTable categoryId={categoryId} showCategoryFilter={showCategoryFilter} />
    </div>
  );
};

export default ArticleList;
