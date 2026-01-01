import React, { useMemo } from 'react';
import { Form, Input, InputNumber, Select, Collapse } from 'antd';
import QuillEditor from './QuillEditor';
import CoverUpload from './CoverUpload';
import { useCategories } from '../../../shared/contexts/CategoryContext';

const { TextArea } = Input;
const { Panel } = Collapse;

/**
 * ArticleForm - 文章表单组件
 * 
 * @param {Object} props
 * @param {Object} props.article - 文章数据
 * @param {string} props.mode - 模式 ('create' | 'edit')
 * @param {Function} props.onChange - 字段变更回调
 * @param {Array<string>} props.readOnlyFields - 只读字段列表，如 ['categoryId']
 */
const ArticleForm = ({ article = {}, mode = 'create', onChange, readOnlyFields = [] }) => {
  const { categories, loading: categoriesLoading } = useCategories();

  // 获取当前选中的分类信息
  const selectedCategory = useMemo(() => {
    if (!article.categoryId || !categories.length) return null;

    const findCategory = (cats) => {
      for (const cat of cats) {
        // 转换为数字进行比较，因为 ID 可能是字符串或数字
        if (Number(cat.id) === Number(article.categoryId)) return cat;
        if (cat.children) {
          const found = findCategory(cat.children);
          if (found) return found;
        }
      }
      return null;
    };

    return findCategory(categories);
  }, [article.categoryId, categories]);

  // 扁平化分类树用于选择器
  const flatCategories = useMemo(() => {
    const flatten = (cats, level = 0) => {
      let result = [];
      cats.forEach(cat => {
        result.push({
          ...cat,
          level,
          label: '　'.repeat(level) + cat.name,
          value: cat.id
        });
        if (cat.children && cat.children.length > 0) {
          result = result.concat(flatten(cat.children, level + 1));
        }
      });
      return result;
    };

    return flatten(categories);
  }, [categories]);

  // 处理字段变更
  const handleChange = (field, value) => {
    if (onChange) {
      onChange(field, value);
    }
  };

  // 定时发布功能已隐藏
  // const handleScheduledAtChange = (date) => {
  //   handleChange('scheduledAt', date ? date.toISOString() : null);
  // };

  return (
    <div className="article-form-wrapper">
      <Form layout="vertical" className="article-form">
        {/* 标题 */}
        <Form.Item
          label="文章标题"
          required
        >
          <Input
            placeholder="请输入文章标题"
            value={article.title || ''}
            onChange={(e) => handleChange('title', e.target.value)}
            maxLength={200}
            showCount
          />
        </Form.Item>

        {/* 分类 */}
        <Form.Item
          label="文章分类"
          required
          help={!article.categoryId && '请选择文章分类'}
          validateStatus={!article.categoryId ? 'error' : ''}
        >
          {readOnlyFields.includes('categoryId') ? (
            // 只读模式：显示分类名称
            <div>
              <Input
                value={selectedCategory?.name || (categoriesLoading ? '加载中...' : '未选择分类')}
                disabled
                style={{
                  cursor: 'not-allowed'
                }}
              />
              {selectedCategory && (
                <div style={{ marginTop: 8, fontSize: 12, opacity: 0.65 }}>
                  最大封面数量: {selectedCategory.config?.maxCoverImages || 3}张，
                  最大版本数量: {selectedCategory.config?.maxVersions || 10}个
                </div>
              )}
              <div style={{ marginTop: 8, fontSize: 12, opacity: 0.85 }}>
                从分类页面创建文章时，分类不可更改
              </div>
            </div>
          ) : (
            // 可编辑模式：显示下拉选择器
            <>
              <Select
                placeholder="请选择文章分类"
                value={article.categoryId || undefined}
                onChange={(value) => handleChange('categoryId', value)}
                loading={categoriesLoading}
                options={flatCategories}
                showSearch
                filterOption={(input, option) =>
                  option.name.toLowerCase().includes(input.toLowerCase())
                }
              />
              {selectedCategory && (
                <div style={{ marginTop: 8, fontSize: 12, opacity: 0.65 }}>
                  最大封面数量: {selectedCategory.config?.maxCoverImages || 3}张，
                  最大版本数量: {selectedCategory.config?.maxVersions || 10}个
                </div>
              )}
            </>
          )}
        </Form.Item>

        {/* 摘要 */}
        <Form.Item
          label="文章摘要"
          help="可选，用于文章列表和详情页显示"
        >
          <TextArea
            placeholder="请输入文章摘要"
            value={article.summary || ''}
            onChange={(e) => handleChange('summary', e.target.value)}
            rows={4}
            maxLength={500}
            showCount
          />
        </Form.Item>

        {/* 封面图片 */}
        <Form.Item label="封面图片">
          <CoverUpload
            value={article.coverImages || []}
            onChange={(value) => handleChange('coverImages', value)}
            maxCount={selectedCategory?.config?.maxCoverImages || 3}
            coverConfig={selectedCategory?.config?.coverConfig}
            categoryName={selectedCategory?.name}
          />
        </Form.Item>

        {/* 文章内容 */}
        <Form.Item
          label="文章内容"
          required
          help={!article.content && '请输入文章内容'}
          validateStatus={!article.content ? 'error' : ''}
        >
          <QuillEditor
            value={article.content || ''}
            onChange={(value) => handleChange('content', value)}
            placeholder="请输入文章内容..."
            height={500}
          />
        </Form.Item>

        {/* 排序权重 */}
        <Form.Item
          label="排序权重"
          help="数值越大，排序越靠前（0-999）"
        >
          <InputNumber
            placeholder="请输入排序权重"
            value={article.sortWeight || 0}
            onChange={(value) => handleChange('sortWeight', value)}
            min={0}
            max={999}
            style={{ width: '100%' }}
          />
        </Form.Item>

        {/* 预定发布时间 - 已隐藏 */}
        {/* <Form.Item
          label="预定发布时间"
          help="设置后文章将在指定时间自动发布"
        >
          <DatePicker
            showTime
            placeholder="选择发布时间"
            value={article.scheduledAt ? dayjs(article.scheduledAt) : null}
            onChange={handleScheduledAtChange}
            disabledDate={(current) => {
              // 不能选择过去的日期
              return current && current < dayjs().startOf('day');
            }}
            style={{ width: '100%' }}
            format="YYYY-MM-DD HH:mm:ss"
          />
        </Form.Item> */}

        {/* SEO信息折叠面板 */}
        <Collapse ghost>
          <Panel header="SEO优化信息（可选）" key="seo">
            <Form.Item
              label="URL 标识"
              help="可选，用于生成友好的URL地址，只能包含小写字母、数字和连字符"
            >
              <Input
                placeholder="例如: my-first-article"
                value={article.slug || ''}
                onChange={(e) => handleChange('slug', e.target.value.toLowerCase())}
                maxLength={200}
                showCount
              />
            </Form.Item>

            <Form.Item
              label="SEO标题"
              help="用于搜索引擎显示，不填则使用文章标题"
            >
              <Input
                placeholder="请输入SEO标题"
                value={article.seoTitle || ''}
                onChange={(e) => handleChange('seoTitle', e.target.value)}
                maxLength={100}
                showCount
              />
            </Form.Item>

            <Form.Item
              label="SEO描述"
              help="用于搜索引擎显示，不填则使用文章摘要"
            >
              <TextArea
                placeholder="请输入SEO描述"
                value={article.seoDescription || ''}
                onChange={(e) => handleChange('seoDescription', e.target.value)}
                rows={3}
                maxLength={200}
                showCount
              />
            </Form.Item>

            <Form.Item
              label="SEO关键词"
              help="多个关键词用逗号分隔"
            >
              <Input
                placeholder="请输入SEO关键词，用逗号分隔"
                value={article.seoKeywords || ''}
                onChange={(e) => handleChange('seoKeywords', e.target.value)}
                maxLength={200}
                showCount
              />
            </Form.Item>
          </Panel>
        </Collapse>
      </Form>

      <style jsx>{`
        .article-form-wrapper {
          background: #fff;
          padding: 32px 24px;
        }
        
        .article-form {
          max-width: 1200px;
          margin: 0 auto;
        }

        .article-form .ant-form-item-label > label {
          font-weight: 500;
        }
      `}</style>
    </div>
  );
};

export default ArticleForm;
