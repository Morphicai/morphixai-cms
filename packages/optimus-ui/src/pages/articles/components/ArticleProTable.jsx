import React, { useRef } from 'react';
import { ProTable } from '@ant-design/pro-table';
import { Button, Space, Popconfirm, message, Image, Tag } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, CheckOutlined, InboxOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import ArticleService from '../../../services/ArticleService';
import { getFullFileUrl } from '../../../shared/utils/fileUtils';
import { useCategories } from '../../../shared/contexts/CategoryContext';

/**
 * 文章 ProTable 组件
 * 使用 ProTable 实现高级表格功能
 */
const ArticleProTable = ({ categoryId = null, showCategoryFilter = true }) => {
  const navigate = useNavigate();
  const actionRef = useRef();
  const { categories } = useCategories();

  // 扁平化分类树
  const flattenCategories = (cats, level = 0) => {
    let result = [];
    cats.forEach((cat) => {
      result.push({
        label: '　'.repeat(level) + cat.name,
        value: cat.id,
      });
      if (cat.children && cat.children.length > 0) {
        result = result.concat(flattenCategories(cat.children, level + 1));
      }
    });
    return result;
  };

  const categoryOptions = flattenCategories(categories);

  // 状态映射
  const statusMap = {
    draft: { text: '草稿', status: 'Default' },
    published: { text: '已发布', status: 'Success' },
    archived: { text: '已归档', status: 'Warning' },
  };

  // 处理编辑
  const handleEdit = (record) => {
    navigate(`/articles/edit/${record.id}`);
  };

  // 处理发布
  const handlePublish = async (record) => {
    try {
      const response = await ArticleService.publish(record.id);
      if (response.success) {
        message.success('文章发布成功');
        actionRef.current?.reload();
      } else {
        message.error(response.msg || '文章发布失败');
      }
    } catch (error) {
      console.error('发布文章失败:', error);
      message.error('文章发布失败');
    }
  };

  // 处理归档
  const handleArchive = async (record) => {
    try {
      const response = await ArticleService.archive(record.id);
      if (response.success) {
        message.success('文章归档成功');
        actionRef.current?.reload();
      } else {
        message.error(response.msg || '文章归档失败');
      }
    } catch (error) {
      console.error('归档文章失败:', error);
      message.error('文章归档失败');
    }
  };

  // 处理删除
  const handleDelete = async (record) => {
    try {
      const response = await ArticleService.delete(record.id);
      if (response.success) {
        message.success('文章删除成功');
        actionRef.current?.reload();
      } else {
        message.error(response.msg || '文章删除失败');
      }
    } catch (error) {
      console.error('删除文章失败:', error);
      message.error('文章删除失败');
    }
  };

  // 处理新建
  const handleCreate = () => {
    if (categoryId) {
      navigate(`/articles/create?categoryId=${categoryId}`);
    } else {
      navigate('/articles/create');
    }
  };

  // 列配置
  const columns = [
    {
      title: '封面',
      dataIndex: ['currentVersion', 'coverImages'],
      key: 'cover',
      width: 100,
      search: false,
      render: (coverImages) => {
        if (coverImages && coverImages.length > 0) {
          const imageUrl = getFullFileUrl(coverImages[0]);
          return (
            <Image
              src={imageUrl}
              alt="封面"
              width={80}
              height={60}
              style={{ objectFit: 'cover', borderRadius: 4 }}
              preview={{ src: imageUrl }}
            />
          );
        }
        return <div style={{ width: 80, height: 60, background: 'var(--color-bg-tertiary)', borderRadius: 4 }} />;
      },
    },
    {
      title: '标题',
      dataIndex: ['currentVersion', 'title'],
      key: 'title',
      ellipsis: true,
      width: 250,
      copyable: true,
    },
    {
      title: '摘要',
      dataIndex: ['currentVersion', 'summary'],
      key: 'summary',
      ellipsis: true,
      width: 300,
      search: false,
      hideInTable: true,
    },
    ...(showCategoryFilter
      ? [
          {
            title: '分类',
            dataIndex: ['category', 'name'],
            key: 'categoryId',
            width: 120,
            valueType: 'select',
            fieldProps: {
              options: categoryOptions,
            },
          },
        ]
      : []),
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      valueType: 'select',
      valueEnum: {
        draft: { text: '草稿', status: 'Default' },
        published: { text: '已发布', status: 'Success' },
        archived: { text: '已归档', status: 'Warning' },
      },
      render: (_, record) => {
        const status = statusMap[record.status];
        return <Tag color={status?.status === 'Success' ? 'success' : status?.status === 'Warning' ? 'warning' : 'default'}>{status?.text}</Tag>;
      },
    },
    {
      title: '排序权重',
      dataIndex: ['currentVersion', 'sortWeight'],
      key: 'sortWeight',
      width: 100,
      sorter: true,
      search: false,
    },
    {
      title: '发布时间',
      dataIndex: 'publishedAt',
      key: 'publishedAt',
      width: 180,
      valueType: 'dateTime',
      sorter: true,
      search: false,
      render: (_, record) => (record.publishedAt ? dayjs(record.publishedAt).format('YYYY-MM-DD HH:mm') : '-'),
    },
    {
      title: '更新时间',
      dataIndex: 'updateDate',
      key: 'updateDate',
      width: 180,
      valueType: 'dateTime',
      sorter: true,
      search: false,
      render: (_, record) => dayjs(record.updateDate).format('YYYY-MM-DD HH:mm'),
    },
    {
      title: '操作',
      key: 'action',
      fixed: 'right',
      width: 240,
      search: false,
      render: (_, record) => (
        <Space size={4}>
          <Button 
            type="link" 
            size="small" 
            icon={<EditOutlined />} 
            onClick={() => handleEdit(record)}
            style={{ padding: '0 8px' }}
          >
            编辑
          </Button>
          {record.status === 'draft' && (
            <Button 
              type="link" 
              size="small" 
              icon={<CheckOutlined />} 
              onClick={() => handlePublish(record)}
              style={{ padding: '0 8px' }}
            >
              发布
            </Button>
          )}
          {record.status === 'published' && (
            <Popconfirm
              title="确定要归档这篇文章吗？"
              description="归档后文章将不再显示在前台"
              onConfirm={() => handleArchive(record)}
              okText="确定"
              cancelText="取消"
            >
              <Button 
                type="link" 
                size="small" 
                icon={<InboxOutlined />}
                style={{ padding: '0 8px' }}
              >
                归档
              </Button>
            </Popconfirm>
          )}
          <Popconfirm 
            title="确定要删除这篇文章吗？" 
            onConfirm={() => handleDelete(record)} 
            okText="确定" 
            cancelText="取消"
          >
            <Button 
              type="link" 
              size="small" 
              danger 
              icon={<DeleteOutlined />}
              style={{ padding: '0 8px' }}
            >
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  // 请求数据
  const request = async (params, sort, filter) => {
    try {
      const { current, pageSize, title, categoryId: filterCategoryId, status } = params;

      const queryParams = {
        page: current,
        pageSize,
        keyword: title,
        categoryId: categoryId || filterCategoryId,
        status,
      };

      // 处理排序
      if (sort && Object.keys(sort).length > 0) {
        const sortField = Object.keys(sort)[0];
        const sortOrder = sort[sortField] === 'ascend' ? 'ASC' : 'DESC';
        queryParams.sortBy = sortField;
        queryParams.sortOrder = sortOrder;
      }

      const response = await ArticleService.list(queryParams);

      if (response.success) {
        return {
          data: response.data.items || response.data.list || [],
          success: true,
          total: response.data.total || 0,
        };
      }

      return {
        data: [],
        success: false,
        total: 0,
      };
    } catch (error) {
      console.error('获取文章列表失败:', error);
      return {
        data: [],
        success: false,
        total: 0,
      };
    }
  };

  return (
    <ProTable
      columns={columns}
      actionRef={actionRef}
      request={request}
      rowKey="id"
      pagination={{
        defaultPageSize: 10,
        showSizeChanger: true,
        showQuickJumper: true,
        pageSizeOptions: ['10', '20', '50'],
      }}
      search={{
        labelWidth: 'auto',
        defaultCollapsed: false,
        span: 6,
      }}
      form={{
        syncToUrl: false,
        size: 'middle',
      }}
      dateFormatter="string"
      headerTitle="文章列表"
      toolBarRender={() => [
        <div key="actions" style={{ display: 'flex', justifyContent: 'flex-end', width: '100%' }}>
          <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate}>
            新建文章
          </Button>
        </div>,
      ]}
      scroll={{ x: 1400 }}
      options={{
        reload: true,
        density: true,
        setting: true,
      }}
    />
  );
};

export default ArticleProTable;
