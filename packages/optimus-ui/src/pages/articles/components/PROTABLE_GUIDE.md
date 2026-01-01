# 文章列表 ProTable 使用指南

## 概述

使用 `@ant-design/pro-components` 的 ProTable 组件重构文章列表，提供更强大的功能和更好的用户体验。

## 主要优势

### 相比传统 Table 的优势

1. **内置搜索表单** - 自动生成搜索表单，无需手动编写
2. **工具栏功能** - 内置刷新、密度调整、列设置等功能
3. **更好的类型支持** - valueType 自动处理数据格式
4. **请求封装** - 统一的数据请求接口
5. **状态管理** - 自动管理加载、分页、排序状态

## 组件结构

```
ArticleProTable.jsx       # ProTable 主组件
ArticleListPro.jsx        # 页面容器组件
```

## 使用方法

### 基础使用

```jsx
import ArticleListPro from '@/pages/articles/views/ArticleListPro';

// 显示所有文章
<ArticleListPro />

// 按分类筛选
<ArticleListPro categoryId={1} />

// 隐藏分类筛选
<ArticleListPro showCategoryFilter={false} />
```

### 直接使用 ProTable 组件

```jsx
import ArticleProTable from '@/pages/articles/components/ArticleProTable';

<ArticleProTable 
  categoryId={1} 
  showCategoryFilter={true} 
/>
```

## 功能特性

### 1. 搜索功能

- **标题搜索** - 支持模糊搜索文章标题
- **分类筛选** - 下拉选择分类（支持层级显示）
- **状态筛选** - 草稿/已发布/已归档

### 2. 表格功能

- **封面预览** - 点击放大查看
- **标题复制** - 一键复制文章标题
- **排序** - 支持按排序权重、发布时间、更新时间排序
- **分页** - 支持快速跳转和每页条数调整

### 3. 操作功能

- **编辑** - 跳转到编辑页面
- **发布** - 草稿状态可发布
- **归档** - 已发布状态可归档
- **删除** - 带二次确认

### 4. 工具栏功能

- **刷新** - 重新加载数据
- **密度调整** - 紧凑/默认/宽松
- **列设置** - 显示/隐藏列
- **新建文章** - 跳转到创建页面

## 列配置说明

```javascript
{
  title: '标题',              // 列标题
  dataIndex: ['currentVersion', 'title'],  // 数据路径（支持嵌套）
  key: 'title',               // 唯一标识
  ellipsis: true,             // 超长省略
  width: 250,                 // 列宽
  copyable: true,             // 可复制
  valueType: 'text',          // 值类型
  search: true,               // 是否可搜索（默认 true）
  sorter: true,               // 是否可排序
}
```

### 支持的 valueType

- `text` - 文本
- `select` - 下拉选择
- `dateTime` - 日期时间
- `date` - 日期
- `dateRange` - 日期范围
- `money` - 金额
- `digit` - 数字

## 数据请求格式

### 请求参数

```javascript
{
  current: 1,           // 当前页
  pageSize: 10,         // 每页条数
  title: '搜索关键词',   // 搜索字段
  categoryId: 1,        // 分类ID
  status: 'published',  // 状态
  sortBy: 'updateDate', // 排序字段
  sortOrder: 'DESC'     // 排序方向
}
```

### 返回格式

```javascript
{
  data: [],           // 数据列表
  success: true,      // 是否成功
  total: 100          // 总条数
}
```

## 样式优化

ProTable 已自动应用全局样式优化：

- 表格行高优化
- 表头样式增强
- 缩略图尺寸优化（80x60px）
- 操作按钮间距优化
- 分页器样式优化

## 迁移指南

### 从旧版 ArticleList 迁移

1. **替换导入**
```javascript
// 旧版
import ArticleList from '@/pages/articles/views/ArticleList';

// 新版
import ArticleListPro from '@/pages/articles/views/ArticleListPro';
```

2. **Props 保持不变**
```javascript
// 两个版本的 Props 完全兼容
<ArticleListPro 
  categoryId={categoryId}
  showCategoryFilter={true}
/>
```

3. **功能增强**
- 无需修改代码即可获得 ProTable 的所有高级功能
- 搜索表单自动生成
- 工具栏功能自动添加

## 性能优化

1. **按需加载** - 只加载当前页数据
2. **防抖搜索** - 搜索输入自动防抖
3. **缓存优化** - 自动缓存搜索条件
4. **虚拟滚动** - 大数据量时自动启用

## 注意事项

1. **依赖安装** - 确保已安装 `@ant-design/pro-components`
```bash
pnpm add @ant-design/pro-components
```

2. **API 兼容** - 确保后端 API 返回格式符合要求

3. **样式覆盖** - 如需自定义样式，使用 `className` 或 `style` props

## 示例代码

### 完整示例

```jsx
import React from 'react';
import { PageContainer } from '@ant-design/pro-components';
import ArticleProTable from '@/pages/articles/components/ArticleProTable';

const ArticlePage = () => {
  return (
    <PageContainer>
      <ArticleProTable 
        showCategoryFilter={true}
      />
    </PageContainer>
  );
};

export default ArticlePage;
```

### 自定义工具栏

```jsx
<ProTable
  toolBarRender={() => [
    <Button key="export">导出</Button>,
    <Button key="import">导入</Button>,
    <Button key="create" type="primary">新建</Button>,
  ]}
/>
```

### 自定义搜索表单

```jsx
<ProTable
  search={{
    labelWidth: 120,
    defaultCollapsed: false,  // 默认展开
    optionRender: (searchConfig, formProps, dom) => [
      ...dom.reverse(),
      <Button key="export">导出</Button>,
    ],
  }}
/>
```
