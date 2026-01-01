import { useRef } from 'react';
import { ProTable } from '@ant-design/pro-table';
import { Tag, Space, Alert, Button, Modal } from 'antd';
import { EditOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import ProductService from '../../services/ProductService';
import { PRODUCT_TYPE_ENUM, PRODUCT_STATUS_ENUM } from '../../constants/products';

/**
 * 商品管理页面
 */
const ProductManagement = () => {
  const actionRef = useRef();

  // 处理编辑点击
  const handleEdit = (record) => {
    if (record.isBuiltIn) {
      Modal.warning({
        title: '内置商品',
        content: '该商品为系统内置商品，如需修改请联系系统管理员。',
        okText: '知道了',
      });
    }
  };

  // 列配置
  const columns = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 80,
      hideInSearch: true,
    },
    {
      title: '商品代码',
      dataIndex: 'productCode',
      key: 'productCode',
      width: 150,
      copyable: true,
      fieldProps: {
        placeholder: '请输入商品代码',
      },
    },
    {
      title: '商品名称',
      dataIndex: 'productName',
      key: 'productName',
      width: 150,
      ellipsis: true,
      fieldProps: {
        placeholder: '请输入商品名称',
      },
    },
    {
      title: '商品类型',
      dataIndex: 'productType',
      key: 'productType',
      width: 120,
      valueType: 'select',
      valueEnum: PRODUCT_TYPE_ENUM,
      render: (_, record) => {
        const typeInfo = PRODUCT_TYPE_ENUM[record.productType] || { text: record.productType, color: 'default' };
        return <Tag color={typeInfo.color}>{typeInfo.text}</Tag>;
      },
    },
    {
      title: '价格',
      dataIndex: 'price',
      key: 'price',
      width: 100,
      hideInSearch: true,
      render: (_, record) => {
        return `¥${record.price.toFixed(2)}`;
      },
    },
    {
      title: '原价',
      dataIndex: 'originalPrice',
      key: 'originalPrice',
      width: 100,
      hideInSearch: true,
      render: (_, record) => {
        if (record.originalPrice > record.price) {
          return (
            <Space>
              <span style={{ textDecoration: 'line-through', color: '#999' }}>
                ¥{record.originalPrice.toFixed(2)}
              </span>
              <Tag color="red">折扣</Tag>
            </Space>
          );
        }
        return `¥${record.originalPrice.toFixed(2)}`;
      },
    },
    {
      title: '库存',
      dataIndex: 'stock',
      key: 'stock',
      width: 100,
      hideInSearch: true,
      render: (_, record) => {
        if (record.stock === 0) {
          return <Tag color="error">缺货</Tag>;
        }
        if (record.stock < 100) {
          return <Tag color="warning">{record.stock}</Tag>;
        }
        return <Tag color="success">{record.stock}</Tag>;
      },
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      valueType: 'select',
      valueEnum: PRODUCT_STATUS_ENUM,
      render: (_, record) => {
        const statusInfo = PRODUCT_STATUS_ENUM[record.status] || { text: record.status, color: 'default' };
        return <Tag color={statusInfo.color}>{statusInfo.text}</Tag>;
      },
    },
    {
      title: '描述',
      dataIndex: 'description',
      key: 'description',
      width: 200,
      ellipsis: true,
      hideInSearch: true,
    },
    {
      title: '商品来源',
      dataIndex: 'isBuiltIn',
      key: 'isBuiltIn',
      width: 100,
      hideInSearch: true,
      render: (_, record) => {
        if (record.isBuiltIn) {
          return <Tag color="purple">内置</Tag>;
        }
        return <Tag color="default">自定义</Tag>;
      },
    },
    {
      title: '创建时间',
      dataIndex: 'createDate',
      key: 'createDate',
      width: 180,
      valueType: 'dateTime',
      hideInSearch: true,
      render: (_, record) => {
        return record.createDate ? dayjs(record.createDate).format('YYYY-MM-DD HH:mm:ss') : '-';
      },
    },
    {
      title: '操作',
      key: 'action',
      width: 100,
      fixed: 'right',
      hideInSearch: true,
      render: (_, record) => (
        <Button
          type="link"
          size="small"
          icon={<EditOutlined />}
          onClick={() => handleEdit(record)}
        >
          编辑
        </Button>
      ),
    },
  ];

  // 请求数据
  const request = async (params) => {
    try {
      const { current = 1, pageSize = 10, productCode, productName, productType, status } = params;

      const queryParams = {
        page: current || 1,
        pageSize: pageSize || 10,
        productCode,
        productName,
        productType,
        status,
      };

      const response = await ProductService.list(queryParams);

      if (response.success) {
        return {
          data: response.data || [],
          success: true,
          total: response.total || 0,
        };
      }

      return {
        data: [],
        success: false,
        total: 0,
      };
    } catch (error) {
      console.error('获取商品列表失败:', error);
      return {
        data: [],
        success: false,
        total: 0,
      };
    }
  };

  return (
    <>
      <Alert
        message="提示"
        description="内置商品由系统维护，如需修改请联系系统管理员。"
        type="info"
        showIcon
        style={{ marginBottom: 16 }}
      />
      <ProTable
        columns={columns}
        actionRef={actionRef}
        request={request}
        rowKey="id"
        pagination={{
          defaultPageSize: 10,
          showSizeChanger: true,
          showQuickJumper: true,
          showTotal: (total) => `共 ${total} 条记录`,
          pageSizeOptions: ['10', '20', '50', '100'],
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
        headerTitle="商品管理"
        toolBarRender={() => []}
      />
    </>
  );
};

export default ProductManagement;
