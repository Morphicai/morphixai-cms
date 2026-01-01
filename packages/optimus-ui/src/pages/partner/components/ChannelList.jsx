import React, { useState, useCallback } from 'react';
import { Table, Tag, Typography, Space, Button, message } from 'antd';
import { CopyOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import adminPartnerService from '../../../services/AdminPartnerService';
import { useMount } from '../../../shared/hooks';

const { Text } = Typography;

const ChannelList = ({ partnerId }) => {
  const [loading, setLoading] = useState(false);
  const [dataSource, setDataSource] = useState([]);

  const fetchChannels = useCallback(async () => {
    try {
      setLoading(true);
      const response = await adminPartnerService.getChannels(partnerId);
      if (response?.data) {
        setDataSource(response.data || []);
      }
    } catch (error) {
      message.error('获取渠道列表失败');
      console.error('Failed to fetch channels:', error);
    } finally {
      setLoading(false);
    }
  }, [partnerId]);

  useMount(() => {
    fetchChannels();
  });

  const handleCopyLink = (link) => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(link).then(() => {
        message.success('推广链接已复制');
      }).catch(() => {
        message.error('复制失败');
      });
    } else {
      const textArea = document.createElement('textarea');
      textArea.value = link;
      document.body.appendChild(textArea);
      textArea.select();
      try {
        document.execCommand('copy');
        message.success('推广链接已复制');
      } catch (err) {
        message.error('复制失败');
      }
      document.body.removeChild(textArea);
    }
  };

  const columns = [
    {
      title: '渠道名称',
      dataIndex: 'name',
      key: 'name',
      width: 200,
    },
    {
      title: '渠道码',
      dataIndex: 'channelCode',
      key: 'channelCode',
      width: 150,
    },
    {
      title: '推广链接',
      dataIndex: 'shortUrl',
      key: 'shortUrl',
      ellipsis: true,
      render: (text) => (
        <Space>
          <Text ellipsis style={{ maxWidth: 300 }}>
            {text || '-'}
          </Text>
          {text && (
            <Button
              type="link"
              size="small"
              icon={<CopyOutlined />}
              onClick={() => handleCopyLink(text)}
            >
              复制
            </Button>
          )}
        </Space>
      ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status) => {
        const statusConfig = {
          active: { color: 'success', text: '活跃' },
          disabled: { color: 'default', text: '已禁用' },
        };
        const config = statusConfig[status] || { color: 'default', text: status };
        return <Tag color={config.color}>{config.text}</Tag>;
      },
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 180,
      render: (text) => text ? dayjs(text).format('YYYY-MM-DD HH:mm:ss') : '-',
    },
  ];

  return (
    <Table
      columns={columns}
      dataSource={dataSource}
      loading={loading}
      rowKey="id"
      pagination={false}
    />
  );
};

export default ChannelList;
