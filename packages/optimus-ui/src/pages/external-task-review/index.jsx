import React, { useState } from 'react';
import {
  Card,
  Table,
  Form,
  Input,
  Select,
  Button,
  Space,
  Tag,
  Statistic,
  Row,
  Col,
  Modal,
  Descriptions,
  Image,
  message,
} from 'antd';
import {
  SearchOutlined,
  ReloadOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  ClockCircleOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { useMount } from '../../shared/hooks';
import externalTaskService from '../../services/ExternalTaskService';
import ReviewModal from './components/ReviewModal';
import { getFullFileUrl } from '../../shared/utils/fileUtils';

const { Option } = Select;

const ExternalTaskReview = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [dataSource, setDataSource] = useState([]);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 20,
    total: 0,
  });
  const [stats, setStats] = useState(null);
  const [detailVisible, setDetailVisible] = useState(false);
  const [currentSubmission, setCurrentSubmission] = useState(null);
  const [reviewModalVisible, setReviewModalVisible] = useState(false);
  const [reviewAction, setReviewAction] = useState(null); // 'approve' or 'reject'

  // 任务类型映射
  const taskTypeMap = {
    DOUYIN_SHORT_VIDEO: { text: '抖音短视频', color: 'magenta' },
    DOUYIN_LIVE: { text: '抖音直播', color: 'red' },
    XIAOHONGSHU_NOTE: { text: '小红书笔记', color: 'volcano' },
    BILIBILI_VIDEO: { text: 'B站视频', color: 'blue' },
    KUAISHOU_SHORT_VIDEO: { text: '快手短视频', color: 'orange' },
    WEIBO_POST: { text: '微博发文', color: 'gold' },
  };

  // 状态映射
  const statusMap = {
    PENDING: { text: '待审核', color: 'orange', icon: <ClockCircleOutlined /> },
    APPROVED: { text: '已通过', color: 'green', icon: <CheckCircleOutlined /> },
    REJECTED: { text: '已拒绝', color: 'red', icon: <CloseCircleOutlined /> },
  };

  // 加载提交记录列表
  const fetchSubmissions = async (params = {}) => {
    setLoading(true);
    try {
      const response = await externalTaskService.getSubmissions({
        page: pagination.current,
        pageSize: pagination.pageSize,
        ...params,
      });

      if (response && response.success) {
        setDataSource(response.data.items || []);
        setPagination((prev) => ({
          ...prev,
          total: response.data.total || 0,
        }));
      } else {
        message.error(response?.msg || '加载提交记录失败');
      }
    } catch (error) {
      console.error('加载提交记录失败:', error);
      message.error('加载提交记录失败');
    } finally {
      setLoading(false);
    }
  };

  // 加载统计数据
  const fetchStats = async () => {
    try {
      const response = await externalTaskService.getStatistics();
      if (response && response.success) {
        setStats(response.data);
      }
    } catch (error) {
      console.error('加载统计数据失败:', error);
    }
  };

  // 查看详情
  const handleViewDetail = async (id) => {
    try {
      const response = await externalTaskService.getSubmissionDetail(id);
      if (response && response.success) {
        setCurrentSubmission(response.data);
        setDetailVisible(true);
      } else {
        message.error(response?.msg || '加载详情失败');
      }
    } catch (error) {
      console.error('加载详情失败:', error);
      message.error('加载详情失败');
    }
  };

  // 打开审核弹窗
  const handleOpenReview = (record, action) => {
    setCurrentSubmission(record);
    setReviewAction(action);
    setReviewModalVisible(true);
  };

  // 审核操作
  const handleReview = async (values) => {
    try {
      if (reviewAction === 'approve') {
        await externalTaskService.approveSubmission(currentSubmission.id, values);
        message.success('审核通过成功');
      } else {
        await externalTaskService.rejectSubmission(currentSubmission.id, values);
        message.success('审核拒绝成功');
      }
      setReviewModalVisible(false);
      fetchSubmissions(form.getFieldsValue());
      fetchStats();
    } catch (error) {
      console.error('审核操作失败:', error);
      message.error('审核操作失败');
    }
  };

  // 搜索
  const handleSearch = () => {
    const values = form.getFieldsValue();
    setPagination((prev) => ({ ...prev, current: 1 }));
    fetchSubmissions(values);
  };

  // 重置
  const handleReset = () => {
    form.resetFields();
    setPagination((prev) => ({ ...prev, current: 1 }));
    fetchSubmissions();
  };

  // 表格列配置
  const columns = [
    {
      title: '提交码',
      dataIndex: 'submissionCode',
      key: 'submissionCode',
      width: 180,
      fixed: 'left',
    },
    {
      title: '任务类型',
      dataIndex: 'taskType',
      key: 'taskType',
      width: 130,
      render: (type) => (
        <Tag color={taskTypeMap[type]?.color}>{taskTypeMap[type]?.text || type}</Tag>
      ),
    },
    {
      title: '合伙人编号',
      dataIndex: ['submission', 'partner', 'partnerCode'],
      key: 'partnerCode',
      width: 150,
      render: (_, record) => record.partner?.partnerCode || '-',
    },
    {
      title: 'UID',
      dataIndex: ['submission', 'partner', 'uid'],
      key: 'uid',
      width: 120,
      render: (_, record) => record.partner?.uid || record.uid || '-',
    },
    {
      title: '任务链接',
      dataIndex: 'taskLink',
      key: 'taskLink',
      width: 200,
      ellipsis: true,
      render: (link) => (
        <a href={link} target="_blank" rel="noopener noreferrer">
          {link}
        </a>
      ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status) => (
        <Tag icon={statusMap[status]?.icon} color={statusMap[status]?.color}>
          {statusMap[status]?.text}
        </Tag>
      ),
    },
    {
      title: '积分奖励',
      dataIndex: 'pointsAwarded',
      key: 'pointsAwarded',
      width: 100,
      render: (points) => (points ? `${points} MIRA` : '-'),
    },
    {
      title: '提交时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 170,
      render: (time) => dayjs(time).format('YYYY-MM-DD HH:mm:ss'),
    },
    {
      title: '审核时间',
      dataIndex: 'reviewTime',
      key: 'reviewTime',
      width: 170,
      render: (time) => (time ? dayjs(time).format('YYYY-MM-DD HH:mm:ss') : '-'),
    },
    {
      title: '操作',
      key: 'action',
      width: 180,
      fixed: 'right',
      render: (_, record) => (
        <Space>
          <Button type="link" size="small" onClick={() => handleViewDetail(record.id)}>
            详情
          </Button>
          {record.status === 'PENDING' && (
            <>
              <Button
                type="link"
                size="small"
                style={{ color: '#52c41a' }}
                onClick={() => handleOpenReview(record, 'approve')}
              >
                通过
              </Button>
              <Button
                type="link"
                size="small"
                danger
                onClick={() => handleOpenReview(record, 'reject')}
              >
                拒绝
              </Button>
            </>
          )}
        </Space>
      ),
    },
  ];

  // 表格分页变化
  const handleTableChange = (newPagination) => {
    setPagination(newPagination);
    const values = form.getFieldsValue();
    fetchSubmissions({ ...values, page: newPagination.current, pageSize: newPagination.pageSize });
  };

  useMount(() => {
    fetchSubmissions();
    fetchStats();
  });

  return (
    <div style={{ padding: '24px' }}>
      {/* 统计卡片 */}
      {stats && (
        <Row gutter={16} style={{ marginBottom: 24 }}>
          <Col span={6}>
            <Card>
              <Statistic
                title="待审核"
                value={stats.pendingCount || 0}
                valueStyle={{ color: '#faad14' }}
                prefix={<ClockCircleOutlined />}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title="已通过"
                value={stats.approvedCount || 0}
                valueStyle={{ color: '#52c41a' }}
                prefix={<CheckCircleOutlined />}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title="已拒绝"
                value={stats.rejectedCount || 0}
                valueStyle={{ color: '#ff4d4f' }}
                prefix={<CloseCircleOutlined />}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title="今日审核"
                value={stats.todayReviewCount || 0}
                valueStyle={{ color: '#1890ff' }}
              />
            </Card>
          </Col>
        </Row>
      )}

      {/* 搜索表单 */}
      <Card style={{ marginBottom: 16 }}>
        <Form form={form} layout="inline">
          <Form.Item name="status" label="状态">
            <Select placeholder="请选择状态" style={{ width: 120 }} allowClear>
              <Option value="PENDING">待审核</Option>
              <Option value="APPROVED">已通过</Option>
              <Option value="REJECTED">已拒绝</Option>
            </Select>
          </Form.Item>
          <Form.Item name="taskType" label="任务类型">
            <Select placeholder="请选择任务类型" style={{ width: 150 }} allowClear>
              <Option value="DOUYIN_SHORT_VIDEO">抖音短视频</Option>
              <Option value="DOUYIN_LIVE">抖音直播</Option>
              <Option value="XIAOHONGSHU_NOTE">小红书笔记</Option>
              <Option value="BILIBILI_VIDEO">B站视频</Option>
              <Option value="KUAISHOU_SHORT_VIDEO">快手短视频</Option>
              <Option value="WEIBO_POST">微博发文</Option>
            </Select>
          </Form.Item>
          <Form.Item name="partnerId" label="合伙人ID">
            <Input placeholder="请输入合伙人ID" style={{ width: 200 }} />
          </Form.Item>
          <Form.Item>
            <Space>
              <Button type="primary" icon={<SearchOutlined />} onClick={handleSearch}>
                搜索
              </Button>
              <Button icon={<ReloadOutlined />} onClick={handleReset}>
                重置
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Card>

      {/* 提交记录列表 */}
      <Card>
        <Table
          columns={columns}
          dataSource={dataSource}
          rowKey="id"
          loading={loading}
          pagination={pagination}
          onChange={handleTableChange}
          scroll={{ x: 1600 }}
        />
      </Card>

      {/* 详情弹窗 */}
      <Modal
        title="提交详情"
        open={detailVisible}
        onCancel={() => setDetailVisible(false)}
        footer={null}
        width={900}
      >
        {currentSubmission && (
          <div>
            <Descriptions bordered column={2}>
              <Descriptions.Item label="提交码" span={2}>
                {currentSubmission.submission?.submissionCode || currentSubmission.submissionCode}
              </Descriptions.Item>
              <Descriptions.Item label="任务类型">
                <Tag color={taskTypeMap[currentSubmission.submission?.taskType || currentSubmission.taskType]?.color}>
                  {taskTypeMap[currentSubmission.submission?.taskType || currentSubmission.taskType]?.text}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="状态">
                <Tag
                  icon={statusMap[currentSubmission.submission?.status || currentSubmission.status]?.icon}
                  color={statusMap[currentSubmission.submission?.status || currentSubmission.status]?.color}
                >
                  {statusMap[currentSubmission.submission?.status || currentSubmission.status]?.text}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="合伙人编号">
                {currentSubmission.partner?.partnerCode || '-'}
              </Descriptions.Item>
              <Descriptions.Item label="UID">
                {currentSubmission.partner?.uid || currentSubmission.submission?.uid || '-'}
              </Descriptions.Item>
              <Descriptions.Item label="任务链接" span={2}>
                <a
                  href={currentSubmission.submission?.taskLink || currentSubmission.taskLink}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {currentSubmission.submission?.taskLink || currentSubmission.taskLink}
                </a>
              </Descriptions.Item>
              <Descriptions.Item label="用户备注" span={2}>
                {currentSubmission.submission?.remark || currentSubmission.remark || '-'}
              </Descriptions.Item>
              <Descriptions.Item label="积分奖励">
                {currentSubmission.submission?.pointsAwarded || currentSubmission.pointsAwarded || '-'} MIRA
              </Descriptions.Item>
              <Descriptions.Item label="提交时间">
                {dayjs(currentSubmission.submission?.createdAt || currentSubmission.createdAt).format(
                  'YYYY-MM-DD HH:mm:ss'
                )}
              </Descriptions.Item>
              {(currentSubmission.submission?.reviewTime || currentSubmission.reviewTime) && (
                <>
                  <Descriptions.Item label="审核时间" span={2}>
                    {dayjs(currentSubmission.submission?.reviewTime || currentSubmission.reviewTime).format(
                      'YYYY-MM-DD HH:mm:ss'
                    )}
                  </Descriptions.Item>
                  <Descriptions.Item label="审核备注" span={2}>
                    {currentSubmission.submission?.reviewRemark || currentSubmission.reviewRemark || '-'}
                  </Descriptions.Item>
                </>
              )}
            </Descriptions>

            {/* 凭证图片 */}
            {(currentSubmission.submission?.proofImages || currentSubmission.proofImages) && (
              <div style={{ marginTop: 24 }}>
                <h4>凭证图片：</h4>
                <Image.PreviewGroup>
                  {(currentSubmission.submission?.proofImages || currentSubmission.proofImages).map((url, index) => (
                    <Image
                      key={index}
                      src={getFullFileUrl(url)}
                      alt={`凭证${index + 1}`}
                      style={{ marginRight: 8, marginBottom: 8 }}
                      width={200}
                    />
                  ))}
                </Image.PreviewGroup>
              </div>
            )}

            {/* 合伙人信息 */}
            {currentSubmission.partner && (
              <div style={{ marginTop: 24 }}>
                <h4>合伙人信息：</h4>
                <Descriptions bordered column={2} size="small">
                  <Descriptions.Item label="合伙人编号">
                    {currentSubmission.partner.partnerCode}
                  </Descriptions.Item>
                  <Descriptions.Item label="UID">{currentSubmission.partner.uid}</Descriptions.Item>
                  <Descriptions.Item label="当前星级">
                    {currentSubmission.partner.currentStar || 'NEW'}
                  </Descriptions.Item>
                  <Descriptions.Item label="累计积分">
                    {currentSubmission.partner.totalPoints || 0} MIRA
                  </Descriptions.Item>
                </Descriptions>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* 审核弹窗 */}
      <ReviewModal
        visible={reviewModalVisible}
        action={reviewAction}
        submission={currentSubmission}
        onCancel={() => setReviewModalVisible(false)}
        onOk={handleReview}
      />
    </div>
  );
};

export default ExternalTaskReview;
