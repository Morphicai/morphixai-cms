/**
 * 使用说明页面
 * 
 * 功能：
 * 1. 不需要登录即可访问
 * 2. 展示后台系统使用说明
 * 3. 支持响应式布局
 * 4. 按运营和管理员角色分类说明
 */

import React, { useState } from 'react';
import { Card, Typography, Row, Col, Steps, Alert, Button, Tabs, Collapse, Divider, Space, Tag } from 'antd';
import {
  UserOutlined,
  FileTextOutlined,
  SettingOutlined,
  TeamOutlined,
  CalendarOutlined,
  FolderOutlined,
  DashboardOutlined,
  ArrowLeftOutlined,
  SafetyOutlined,
  BarChartOutlined,
  GiftOutlined,
  LinkOutlined,
  DatabaseOutlined,
  ShoppingCartOutlined,
  FormOutlined,
  FileProtectOutlined,
  PartitionOutlined,
  CrownOutlined,
  ThunderboltOutlined,
  HistoryOutlined,
  RocketOutlined,
  BugOutlined,
  CheckCircleOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';

const { Title, Paragraph, Text } = Typography;
const { Step } = Steps;
const { Panel } = Collapse;

export default function HelpPage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');

  const handleBackToLogin = () => {
    navigate('/login');
  };

  // 获取环境变量中的域名
  const getClientUrl = () => {
    return process.env.REACT_APP_CLIENT_URL || 'https://example.com/';
  };

  // 运营人员功能模块
  const operationModules = [
    {
      icon: <FileTextOutlined />,
      title: '内容管理',
      key: 'content',
      description: '管理新闻、文章等内容发布',
      features: [
        { 
          name: '新闻管理', 
          desc: '发布和管理新闻内容，支持富文本编辑、图片上传、状态管理（草稿/已发布）'
        },
        { 
          name: '文章管理', 
          desc: '创建和编辑文章，支持分类管理、标签设置、SEO优化',
          details: [
            '1. 添加分类：进入"分类管理"，点击"新建分类"，输入分类名称和排序值',
            '2. 添加文章：进入"文章管理"，点击"新建文章"，选择分类，填写标题和内容',
            '3. 使用编辑器：支持可视化编辑，可插入图片、视频、链接等富媒体内容',
            '4. 版本管理：每次保存会自动创建版本，需要在备注中说明修改内容'
          ]
        },
        { 
          name: '分类管理', 
          desc: '管理内容分类体系，支持多级分类和排序',
          details: [
            '创建分类时需要设置分类名称、标识符（英文）和排序值',
            '排序值越小越靠前，建议使用10、20、30这样的间隔值便于后续调整'
          ]
        }
      ]
    },
    {
      icon: <CalendarOutlined />,
      title: '活动中心',
      key: 'activity',
      description: '策划和管理各类营销活动',
      features: [
        { 
          name: '创建活动', 
          desc: '如何创建一个完整的活动',
          details: [
            '1. 点击"新建活动"按钮',
            '2. 填写活动代码（唯一标识，只能包含字母、数字和下划线）',
            '3. 填写活动名称（用户可见的活动标题）',
            '4. 选择活动类型：福利领取 或 充值返利',
            '5. 设置活动时间：选择开始时间和结束时间',
            '6. 设置活动状态：开启（用户可领取）或 关闭（用户不可领取）',
            '7. 设置最大领取次数：每个用户在该活动中最多可领取的次数（默认1次）',
            '8. 填写活动规则说明（可选）：向用户展示的活动规则'
          ]
        },
        { 
          name: '管理活动', 
          desc: '开启、关闭和编辑活动',
          details: [
            '开启活动：将活动状态设置为"开启"，用户即可参与领取',
            '关闭活动：将活动状态设置为"关闭"，用户无法领取',
            '编辑活动：可修改活动名称、时间、状态、规则等（活动代码不可修改）',
            '删除活动：谨慎操作，删除后相关数据将无法恢复'
          ]
        },
        {
          name: '可设置参数',
          desc: '活动支持的配置参数说明',
          details: [
            'activityCode：活动唯一标识，用于API调用',
            'name：活动名称',
            'type：活动类型（welfare_claim/recharge_rebate）',
            'startTime/endTime：活动有效时间范围',
            'status：活动状态（enabled/disabled）',
            'maxClaimTimes：每个用户最大领取次数',
            'rules：活动规则说明文本'
          ]
        },
        { 
          name: '第三方接口调用', 
          desc: '合作伙伴如何通过API发送奖励',
          details: [
            'API端点：POST /api/biz/reward-claim-record/claim',
            '请求参数：',
            '  - activityCode: 活动代码（必填）',
            '  - userId: 用户ID（必填）',
            '  - rewardType: 奖励类型（必填）',
            '  - rewardAmount: 奖励数量（必填）',
            '  - rewardData: 奖励详细数据（JSON格式，可选）',
            '返回结果：包含领取记录ID和状态',
            '注意：需要配置合作伙伴API密钥才能调用'
          ]
        },
        { 
          name: '活动数据', 
          desc: '查看活动参与数据、领奖记录、效果分析',
          details: [
            '在"奖励管理"模块可查看所有领奖记录',
            '支持按活动代码、用户ID、状态等条件筛选',
            '可导出数据进行分析'
          ]
        }
      ]
    },
    {
      icon: <GiftOutlined />,
      title: '奖励管理',
      key: 'reward',
      description: '管理用户奖励和领取记录',
      features: [
        { 
          name: '领奖记录', 
          desc: '查看和管理用户领奖记录，支持状态筛选和导出',
          details: [
            '查看所有用户的领奖记录，包括活动信息、奖励类型、领取时间等',
            '支持按活动代码、用户ID、状态等条件筛选',
            '可导出Excel进行数据分析'
          ]
        }
      ]
    },
    {
      icon: <ShoppingCartOutlined />,
      title: '订单管理',
      key: 'order',
      description: '管理用户订单',
      features: [
        { 
          name: '订单查询', 
          desc: '查看订单详情、订单状态、支付信息',
          details: [
            '查看所有订单记录，包括订单号、用户信息、商品信息、支付状态等',
            '支持按订单号、用户ID、时间范围等条件搜索',
            '可查看订单详细信息和支付流水'
          ]
        }
      ]
    },
    {
      icon: <LinkOutlined />,
      title: '短链管理',
      key: 'shortlink',
      description: '创建和管理短链接，支持自动设备检测',
      features: [
        { 
          name: '短链功能介绍', 
          desc: '智能短链系统，自动识别用户设备并跳转',
          details: [
            '支持为同一个短链配置多个目标地址（PC端、移动端、默认地址）',
            '自动检测用户设备类型（iOS、Android、PC）并跳转到对应地址',
            '支持设置有效期，过期后自动失效',
            '记录访问统计数据，包括访问次数、设备类型分布等'
          ]
        },
        { 
          name: '创建短链', 
          desc: '如何创建一个智能短链',
          details: [
            '1. 点击"新建短链"按钮',
            '2. 填写短链标识（短链的唯一代码，如：download）',
            '3. 填写短链名称（便于管理识别）',
            '4. 配置目标地址：',
            '   - 默认地址（必填）：当无法识别设备时跳转',
            '   - PC端地址（可选）：PC浏览器访问时跳转',
            '   - iOS地址（可选）：iOS设备访问时跳转',
            '   - Android地址（可选）：Android设备访问时跳转',
            '5. 设置有效期（可选）：留空表示永久有效',
            '6. 填写备注说明（可选）'
          ]
        },
        { 
          name: '使用短链', 
          desc: '短链的访问方式',
          details: [
            `访问格式：${getClientUrl()}s/{短链标识}`,
            `示例：${getClientUrl()}s/download`,
            '用户访问短链后，系统会自动检测设备类型并跳转到对应地址',
            '如果对应设备类型没有配置地址，则跳转到默认地址'
          ]
        },
        { 
          name: '设备检测规则', 
          desc: '系统如何识别用户设备',
          details: [
            'iOS设备：检测User-Agent中是否包含iPhone、iPad、iPod',
            'Android设备：检测User-Agent中是否包含Android',
            'PC设备：非移动设备的其他情况',
            '优先级：iOS > Android > PC > 默认地址'
          ]
        },
        { 
          name: '访问统计', 
          desc: '查看短链访问数据',
          details: [
            '查看每个短链的总访问次数',
            '查看不同设备类型的访问分布',
            '查看访问时间趋势',
            '导出访问数据进行分析'
          ]
        }
      ]
    },
    {
      icon: <FolderOutlined />,
      title: '文件管理',
      key: 'files',
      description: '上传和管理系统文件',
      features: [
        { 
          name: '文件上传', 
          desc: '上传图片、文档等文件，支持批量上传',
          details: [
            '支持的图片格式：JPG、PNG、GIF、WebP',
            '支持的文档格式：PDF、DOC、DOCX、XLS、XLSX',
            '单个文件大小限制：10MB',
            '支持拖拽上传和批量上传'
          ]
        },
        { 
          name: '文件组织', 
          desc: '创建文件夹，分类管理文件资源',
          details: [
            '创建文件夹对文件进行分类管理',
            '支持文件夹重命名和删除',
            '删除文件夹时会同时删除其中的所有文件，请谨慎操作'
          ]
        },
        { 
          name: '文件引用', 
          desc: '获取文件链接，用于内容编辑',
          details: [
            '点击文件可复制文件URL',
            '在编辑器中可直接插入文件链接',
            '文件URL格式：https://cdn.example.com/path/to/file.jpg'
          ]
        }
      ]
    },
    {
      icon: <FileProtectOutlined />,
      title: '文档管理',
      key: 'document',
      description: '官网编辑器和动态配置管理',
      features: [
        { 
          name: '功能介绍', 
          desc: '强大的文档管理和配置系统',
          details: [
            '支持可视化编辑器，所见即所得',
            '可创建独立的页面，生成唯一访问链接',
            '支持作为动态配置，给前端暴露数据',
            '支持版本管理，可回溯历史版本'
          ]
        },
        { 
          name: '创建独立页面', 
          desc: '如何创建一个可访问的独立页面',
          details: [
            '1. 进入"文档管理"，点击"新建文档"',
            '2. 填写文档标识（docKey）：如 mir_plane_terms',
            '3. 选择文档类型：选择"页面"',
            '4. 选择来源：选择"官网"或其他来源',
            '5. 使用可视化编辑器编辑内容',
            '6. 保存后，页面访问地址为：',
            `   ${getClientUrl()}document/{docKey}`,
            `   示例：${getClientUrl()}document/mir_plane_terms`,
            '7. 可设置是否在左侧菜单显示（勾选"显示在菜单"）'
          ]
        },
        { 
          name: '作为动态配置', 
          desc: '如何将文档作为配置数据供前端使用',
          details: [
            '1. 创建文档时，选择文档类型为"配置"',
            '2. 在内容中填写JSON格式的配置数据',
            '3. 前端可通过API获取配置：',
            '   GET /api/document/getAppResource',
            '   参数：{ docKey: "配置标识", source: "来源" }',
            '4. 返回的content字段即为配置内容',
            '5. 修改配置后会自动生效，无需重启服务'
          ]
        },
        { 
          name: '可视化编辑器', 
          desc: '强大的富文本编辑功能',
          details: [
            '支持富文本格式：标题、段落、列表、引用等',
            '支持插入图片、视频、链接',
            '支持表格编辑',
            '支持代码块（支持语法高亮）',
            '支持Markdown语法',
            '所见即所得，实时预览效果'
          ]
        },
        { 
          name: '左侧菜单自动显示', 
          desc: '文档如何自动出现在左侧导航菜单',
          details: [
            '1. 创建文档时，勾选"显示在菜单"选项',
            '2. 设置菜单名称（用于在菜单中显示）',
            '3. 设置排序值（数值越小越靠前）',
            '4. 保存后，文档会自动出现在左侧导航菜单中',
            '5. 用户点击菜单项即可访问该文档页面',
            '6. 可随时修改菜单显示状态和排序'
          ]
        },
        { 
          name: '版本管理', 
          desc: '文档版本控制和历史回溯',
          details: [
            '每次保存文档会自动创建新版本',
            '可查看历史版本列表',
            '可对比不同版本的差异',
            '可恢复到任意历史版本',
            '建议在备注中说明每次修改的内容'
          ]
        }
      ]
    },
    {
      icon: <BarChartOutlined />,
      title: '业务数据统计',
      key: 'statistics',
      description: '查看运营数据和业务报表',
      features: [
        { 
          name: '数据概览', 
          desc: '工作台数据总览',
          details: [
            '查看关键业务指标：用户数、订单数、活动参与数等',
            '查看数据趋势图表：日活、月活、转化率等',
            '查看实时数据：今日新增、今日活跃等',
            '支持自定义时间范围查询'
          ]
        },
        { 
          name: '活动数据分析', 
          desc: '活动效果数据统计',
          details: [
            '查看活动参与人数、领取人数',
            '查看活动转化率、完成率',
            '查看不同活动类型的效果对比',
            '支持导出数据进行深度分析'
          ]
        },
        { 
          name: '用户行为分析', 
          desc: '用户行为数据统计',
          details: [
            '查看用户访问路径',
            '查看用户留存率',
            '查看用户活跃度分布',
            '查看用户来源渠道分析'
          ]
        },
        { 
          name: '操作日志', 
          desc: '查看系统操作记录，追踪数据变更',
          details: [
            '记录所有用户的操作行为',
            '包括操作时间、操作人、操作模块、操作内容',
            '支持按时间、用户、模块等条件筛选',
            '可用于审计和问题排查'
          ]
        }
      ]
    }
  ];

  // 管理员功能模块
  const adminModules = [
    {
      icon: <UserOutlined />,
      title: '用户管理',
      key: 'user',
      description: '管理系统用户账号',
      features: [
        { name: '用户列表', desc: '查看所有系统用户，支持搜索和筛选' },
        { name: '创建用户', desc: '添加新用户，设置用户名、密码和基本信息' },
        { name: '编辑用户', desc: '修改用户信息、重置密码、分配角色' },
        { name: '禁用用户', desc: '禁用或启用用户账号，控制登录权限' }
      ]
    },
    {
      icon: <TeamOutlined />,
      title: '角色管理',
      key: 'role',
      description: '配置系统角色和权限',
      features: [
        { name: '角色列表', desc: '查看所有角色及其权限配置' },
        { name: '创建角色', desc: '创建新角色，定义角色名称和描述' },
        { name: '权限配置', desc: '为角色分配菜单权限和操作权限' },
        { name: '角色分配', desc: '将角色分配给用户，实现权限控制' }
      ]
    },
    {
      icon: <SafetyOutlined />,
      title: '权限管理',
      key: 'permission',
      description: '管理系统权限点',
      features: [
        { name: '权限列表', desc: '查看所有权限点，包括菜单和操作权限' },
        { name: '权限配置', desc: '创建和编辑权限点，设置权限标识' },
        { name: '权限树', desc: '以树形结构展示权限层级关系' }
      ]
    },
    {
      icon: <PartitionOutlined />,
      title: '合作伙伴管理',
      key: 'partner',
      description: '管理合作伙伴和对接配置',
      features: [
        { name: '伙伴列表', desc: '查看所有合作伙伴信息' },
        { name: '伙伴配置', desc: '配置合作伙伴参数、API密钥、回调地址' },
        { name: '对接管理', desc: '管理合作伙伴对接状态和数据同步' }
      ]
    },
    {
      icon: <FileProtectOutlined />,
      title: '文档中心',
      key: 'document',
      description: '管理系统文档和API文档',
      features: [
        { name: '文档管理', desc: '创建和编辑系统文档，支持Markdown' },
        { name: '文档分类', desc: '组织文档结构，设置文档权限' },
        { name: 'API文档', desc: '管理API接口文档，提供给合作伙伴' }
      ]
    },
    {
      icon: <DatabaseOutlined />,
      title: '数据库管理',
      key: 'database',
      description: '数据库备份和恢复',
      features: [
        { name: '数据备份', desc: '创建数据库备份，支持定时备份' },
        { name: '备份恢复', desc: '从备份文件恢复数据' },
        { name: '备份管理', desc: '查看备份历史，下载或删除备份文件' }
      ]
    },
    {
      icon: <FormOutlined />,
      title: '外部任务审核',
      key: 'external-task',
      description: '审核外部提交的任务',
      features: [
        { name: '任务列表', desc: '查看待审核的外部任务' },
        { name: '任务审核', desc: '审核任务内容，通过或驳回' },
        { name: '审核记录', desc: '查看历史审核记录和结果' }
      ]
    },
    {
      icon: <SettingOutlined />,
      title: '系统设置',
      key: 'system',
      description: '系统配置和参数管理',
      features: [
        { name: '系统配置', desc: '配置系统基本参数、邮件服务等' },
        { name: '操作日志', desc: '查看所有用户的操作日志，追踪系统变更' },
        { name: '联系反馈', desc: '查看和处理用户反馈信息' }
      ]
    }
  ];

  return (
    <div style={{
      minHeight: '100vh',
      padding: '24px',
      background: '#f0f2f5'
    }}>
      <div style={{
        maxWidth: '1400px',
        margin: '0 auto'
      }}>
        {/* 头部 */}
        <Card style={{ marginBottom: '24px' }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <Title level={2} style={{ margin: 0 }}>
              <DashboardOutlined style={{ marginRight: '8px' }} />
              Optimus 后台管理系统使用说明
            </Title>
            <Button
              type="primary"
              icon={<ArrowLeftOutlined />}
              onClick={handleBackToLogin}
            >
              返回登录
            </Button>
          </div>
        </Card>

        {/* 主要内容 - 标签页 */}
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          size="large"
          items={[
            {
              key: 'overview',
              label: (
                <span>
                  <DashboardOutlined />
                  系统概述
                </span>
              ),
              children: (
                <>
                  {/* 系统概述 */}
                  <Card style={{ marginBottom: '24px' }}>
                    <Title level={3}>系统简介</Title>
                    <Paragraph>
                      Optimus 是一个现代化的后台管理系统，提供内容管理、活动运营、用户管理、权限控制等核心功能。
                      系统采用基于角色的权限控制（RBAC），确保数据安全和操作规范。
                    </Paragraph>

                    <Alert
                      message="重要提示"
                      description="请联系系统管理员获取账号和密码。首次登录后请及时修改密码。"
                      type="info"
                      showIcon
                      style={{ marginTop: '16px' }}
                    />
                  </Card>

                  {/* 快速开始 */}
                  <Card style={{ marginBottom: '24px' }}>
                    <Title level={3}>快速开始</Title>
                    <Steps direction="vertical">
                      <Step
                        title="获取账号"
                        description="联系系统管理员获取登录账号和初始密码"
                        icon={<UserOutlined />}
                      />
                      <Step
                        title="首次登录"
                        description="使用获得的账号密码登录系统，输入验证码完成登录"
                        icon={<ThunderboltOutlined />}
                      />
                      <Step
                        title="修改密码"
                        description="登录后点击右上角头像，进入个人中心修改密码"
                        icon={<SettingOutlined />}
                      />
                      <Step
                        title="开始使用"
                        description="根据分配的权限使用相应的功能模块"
                        icon={<DashboardOutlined />}
                      />
                    </Steps>
                  </Card>

                  {/* 角色说明 */}
                  <Card>
                    <Title level={3}>角色说明</Title>
                    <Row gutter={[16, 16]}>
                      <Col xs={24} md={12}>
                        <Card
                          size="small"
                          style={{ height: '100%', borderColor: '#1890ff' }}
                        >
                          <Space direction="vertical" style={{ width: '100%' }}>
                            <Title level={4}>
                              <ThunderboltOutlined style={{ color: '#1890ff' }} /> 运营人员
                            </Title>
                            <Paragraph>
                              负责日常内容运营、活动策划、数据分析等工作。主要使用内容管理、活动中心、
                              订单管理等功能模块。
                            </Paragraph>
                            <Button type="primary" onClick={() => setActiveTab('operation')}>
                              查看运营功能
                            </Button>
                          </Space>
                        </Card>
                      </Col>
                      <Col xs={24} md={12}>
                        <Card
                          size="small"
                          style={{ height: '100%', borderColor: '#52c41a' }}
                        >
                          <Space direction="vertical" style={{ width: '100%' }}>
                            <Title level={4}>
                              <CrownOutlined style={{ color: '#52c41a' }} /> 系统管理员
                            </Title>
                            <Paragraph>
                              负责系统配置、用户管理、权限分配、数据备份等工作。拥有系统最高权限，
                              可以访问所有功能模块。
                            </Paragraph>
                            <Button type="primary" style={{ background: '#52c41a' }} onClick={() => setActiveTab('admin')}>
                              查看管理员功能
                            </Button>
                          </Space>
                        </Card>
                      </Col>
                    </Row>
                  </Card>
                </>
              )
            },
            {
              key: 'operation',
              label: (
                <span>
                  <ThunderboltOutlined />
                  运营人员
                </span>
              ),
              children: (
                <Card>
                  <div style={{ marginBottom: '16px' }}>
                    <Tag color="blue" style={{ fontSize: '14px', padding: '4px 12px' }}>
                      运营人员功能说明
                    </Tag>
                  </div>
                  <Paragraph>
                    运营人员主要负责内容发布、活动策划、数据分析等日常运营工作。以下是运营人员可以使用的功能模块：
                  </Paragraph>

                  <Collapse
                    defaultActiveKey={['content']}
                    style={{ marginTop: '24px' }}
                  >
                    {operationModules.map(module => (
                      <Panel
                        key={module.key}
                        header={
                          <Space>
                            {module.icon}
                            <Text strong>{module.title}</Text>
                            <Text type="secondary">- {module.description}</Text>
                          </Space>
                        }
                      >
                        <div style={{ paddingLeft: '24px' }}>
                          {module.features.map((feature, index) => (
                            <div key={index} style={{ marginBottom: '20px' }}>
                              <div style={{ marginBottom: '8px' }}>
                                <Text strong style={{ color: '#1890ff', fontSize: '15px' }}>
                                  • {feature.name}
                                </Text>
                              </div>
                              <div style={{ paddingLeft: '16px', marginBottom: '8px' }}>
                                <Text type="secondary">{feature.desc}</Text>
                              </div>
                              {feature.details && feature.details.length > 0 && (
                                <div style={{ 
                                  paddingLeft: '16px', 
                                  marginTop: '8px',
                                  background: '#fafafa',
                                  padding: '12px',
                                  borderRadius: '4px',
                                  borderLeft: '3px solid #1890ff'
                                }}>
                                  {feature.details.map((detail, detailIndex) => (
                                    <div key={detailIndex} style={{ marginBottom: '6px', lineHeight: '1.8' }}>
                                      <Text style={{ fontSize: '13px' }}>{detail}</Text>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </Panel>
                    ))}
                  </Collapse>

                  <Divider />

                  <Card size="small" style={{ background: '#f6ffed', border: '1px solid #b7eb8f' }}>
                    <Title level={5}>💡 运营小贴士</Title>
                    <ul style={{ marginBottom: 0 }}>
                      <li>发布内容前请仔细检查文字和图片，确保信息准确无误</li>
                      <li>活动创建后请及时测试，确保活动规则和奖励配置正确</li>
                      <li>定期查看数据统计，分析运营效果并优化策略</li>
                      <li>上传文件时注意文件大小和格式要求</li>
                      <li>重要操作前建议先在测试环境验证</li>
                    </ul>
                  </Card>
                </Card>
              )
            },
            {
              key: 'admin',
              label: (
                <span>
                  <CrownOutlined />
                  系统管理员
                </span>
              ),
              children: (
                <Card>
                  <div style={{ marginBottom: '16px' }}>
                    <Tag color="green" style={{ fontSize: '14px', padding: '4px 12px' }}>
                      系统管理员功能说明
                    </Tag>
                  </div>
                  <Paragraph>
                    系统管理员拥有最高权限，负责系统配置、用户管理、权限分配、数据维护等核心管理工作。
                    以下是管理员专属的功能模块：
                  </Paragraph>

                  <Collapse
                    defaultActiveKey={['user']}
                    style={{ marginTop: '24px' }}
                  >
                    {adminModules.map(module => (
                      <Panel
                        key={module.key}
                        header={
                          <Space>
                            {module.icon}
                            <Text strong>{module.title}</Text>
                            <Text type="secondary">- {module.description}</Text>
                          </Space>
                        }
                      >
                        <div style={{ paddingLeft: '24px' }}>
                          {module.features.map((feature, index) => (
                            <div key={index} style={{ marginBottom: '12px' }}>
                              <Text strong style={{ color: '#52c41a' }}>• {feature.name}：</Text>
                              <Text>{feature.desc}</Text>
                            </div>
                          ))}
                        </div>
                      </Panel>
                    ))}
                  </Collapse>

                  <Divider />

                  <Card size="small" style={{ background: '#fff7e6', border: '1px solid #ffd591' }}>
                    <Title level={5}>⚠️ 管理员注意事项</Title>
                    <ul style={{ marginBottom: 0 }}>
                      <li>创建用户时请设置强密码，并提醒用户首次登录后修改密码</li>
                      <li>分配角色权限时遵循最小权限原则，只授予必要的权限</li>
                      <li>定期检查用户账号状态，及时禁用离职人员账号</li>
                      <li>重要操作（如数据库恢复）前务必做好备份</li>
                      <li>定期查看操作日志，监控系统安全</li>
                      <li>合作伙伴配置涉及敏感信息，请妥善保管API密钥</li>
                    </ul>
                  </Card>
                </Card>
              )
            },
            {
              key: 'faq',
              label: (
                <span>
                  <FileTextOutlined />
                  常见问题
                </span>
              ),
              children: (
                <Card>
                  <Collapse accordion>
                    <Panel header="Q: 忘记密码怎么办？" key="1">
                      <Paragraph>
                        A: 请联系系统管理员重置密码。出于安全考虑，系统暂不支持自助找回密码功能。
                        管理员可以在用户管理模块中为您重置密码。
                      </Paragraph>
                    </Panel>

                    <Panel header="Q: 验证码看不清楚怎么办？" key="2">
                      <Paragraph>
                        A: 点击验证码图片可以刷新获取新的验证码。在开发和测试环境中，验证码不是必填项。
                        如果多次刷新仍然看不清，请联系技术支持。
                      </Paragraph>
                    </Panel>

                    <Panel header="Q: 没有某个功能的访问权限怎么办？" key="3">
                      <Paragraph>
                        A: 请联系系统管理员检查您的角色权限配置。权限是基于角色分配的，需要管理员在角色管理模块中
                        为您的角色添加相应的权限，或者为您分配新的角色。
                      </Paragraph>
                    </Panel>

                    <Panel header="Q: 上传文件失败怎么办？" key="4">
                      <Paragraph>
                        A: 请检查以下几点：
                      </Paragraph>
                      <ul>
                        <li>文件大小是否超过限制（一般不超过10MB）</li>
                        <li>文件格式是否符合要求（图片支持jpg、png、gif等）</li>
                        <li>网络连接是否正常</li>
                        <li>浏览器是否支持文件上传功能</li>
                      </ul>
                      <Paragraph>
                        如果问题持续存在，请联系技术支持。
                      </Paragraph>
                    </Panel>

                    <Panel header="Q: 如何修改个人密码？" key="5">
                      <Paragraph>
                        A: 登录后点击右上角的用户头像，在下拉菜单中选择"个人中心"或"修改密码"，
                        输入当前密码和新密码即可完成修改。建议定期更换密码以保证账号安全。
                      </Paragraph>
                    </Panel>

                    <Panel header="Q: 为什么我的操作没有生效？" key="6">
                      <Paragraph>
                        A: 可能的原因包括：
                      </Paragraph>
                      <ul>
                        <li>没有保存修改，请检查是否点击了保存按钮</li>
                        <li>表单验证未通过，请检查是否有红色错误提示</li>
                        <li>权限不足，无法执行该操作</li>
                        <li>网络问题导致请求失败</li>
                      </ul>
                      <Paragraph>
                        如果确认以上都没有问题，请联系技术支持并提供操作步骤。
                      </Paragraph>
                    </Panel>

                    <Panel header="Q: 如何导出数据？" key="7">
                      <Paragraph>
                        A: 大部分列表页面都提供导出功能，通常在列表上方有"导出"按钮。
                        点击后可以选择导出格式（Excel、CSV等）和导出范围（当前页、全部数据等）。
                        导出的文件会自动下载到您的电脑。
                      </Paragraph>
                    </Panel>

                    <Panel header="Q: 系统支持哪些浏览器？" key="8">
                      <Paragraph>
                        A: 系统支持以下现代浏览器的最新版本：
                      </Paragraph>
                      <ul>
                        <li>Chrome（推荐）</li>
                        <li>Firefox</li>
                        <li>Safari</li>
                        <li>Edge</li>
                      </ul>
                      <Paragraph>
                        不建议使用IE浏览器，可能会出现兼容性问题。
                      </Paragraph>
                    </Panel>
                  </Collapse>
                </Card>
              )
            },
            {
              key: 'contact',
              label: (
                <span>
                  <SettingOutlined />
                  技术支持
                </span>
              ),
              children: (
                <Card>
                  <Title level={3}>联系我们</Title>
                  <Paragraph>
                    如果您在使用过程中遇到问题，请通过以下方式联系我们：
                  </Paragraph>

                  <Row gutter={[16, 16]} style={{ marginTop: '24px' }}>
                    <Col xs={24} md={8}>
                      <Card size="small" style={{ textAlign: 'center' }}>
                        <UserOutlined style={{ fontSize: '32px', color: '#1890ff' }} />
                        <Title level={5} style={{ marginTop: '12px' }}>技术支持</Title>
                        <Paragraph>
                          邮箱：support@example.com
                        </Paragraph>
                      </Card>
                    </Col>
                    <Col xs={24} md={8}>
                      <Card size="small" style={{ textAlign: 'center' }}>
                        <CrownOutlined style={{ fontSize: '32px', color: '#52c41a' }} />
                        <Title level={5} style={{ marginTop: '12px' }}>系统管理员</Title>
                        <Paragraph>
                          邮箱：support@example.com
                        </Paragraph>
                      </Card>
                    </Col>
                    <Col xs={24} md={8}>
                      <Card size="small" style={{ textAlign: 'center' }}>
                        <SettingOutlined style={{ fontSize: '32px', color: '#faad14' }} />
                        <Title level={5} style={{ marginTop: '12px' }}>紧急联系</Title>
                        <Paragraph>
                          电话：400-000-0000
                        </Paragraph>
                      </Card>
                    </Col>
                  </Row>

                  <Alert
                    message="服务时间"
                    description="我们会在工作时间内（周一至周五 9:00-18:00）及时回复您的问题。紧急问题请拨打紧急联系电话。"
                    type="info"
                    showIcon
                    style={{ marginTop: '24px' }}
                  />

                  <Divider />

                  <Title level={4}>反馈建议</Title>
                  <Paragraph>
                    我们非常重视您的意见和建议。如果您对系统有任何改进建议，或者发现了系统bug，
                    欢迎通过以下方式反馈：
                  </Paragraph>
                  <ul>
                    <li>登录系统后，在"联系反馈"模块提交反馈</li>
                    <li>发送邮件至技术支持邮箱</li>
                    <li>联系您的系统管理员</li>
                  </ul>
                </Card>
              )
            },
            {
              key: 'changelog',
              label: (
                <span>
                  <HistoryOutlined />
                  版本日志
                </span>
              ),
              children: (
                <Card>
                  <Title level={3}>版本更新记录</Title>
                  <Paragraph type="secondary">
                    记录系统每次版本更新的功能变更、优化改进和问题修复
                  </Paragraph>

                  <Divider />

                  {/* 版本 1.2.0 */}
                  <Card 
                    size="small" 
                    style={{ marginBottom: '16px', borderLeft: '4px solid #52c41a' }}
                  >
                    <Space direction="vertical" style={{ width: '100%' }} size="small">
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Title level={4} style={{ margin: 0 }}>
                          <RocketOutlined style={{ color: '#52c41a', marginRight: '8px' }} />
                          v1.2.0
                        </Title>
                        <Tag color="green">最新版本</Tag>
                      </div>
                      <Text type="secondary">发布时间：2024-12-13</Text>
                      
                      <Divider style={{ margin: '12px 0' }} />
                      
                      <div>
                        <Text strong style={{ color: '#52c41a' }}>
                          <CheckCircleOutlined /> 新增功能
                        </Text>
                        <ul style={{ marginTop: '8px', marginBottom: '12px' }}>
                          <li>活动中心：新增活动状态管理（开启/关闭）</li>
                          <li>活动中心：支持设置每个用户的最大领取次数</li>
                          <li>文档管理：支持创建独立页面，可通过URL直接访问</li>
                          <li>文档管理：支持左侧菜单自动显示功能</li>
                          <li>短链管理：支持自动设备检测（iOS/Android/PC）</li>
                          <li>短链管理：支持为不同设备配置不同的跳转地址</li>
                        </ul>
                      </div>

                      <div>
                        <Text strong style={{ color: '#1890ff' }}>
                          <RocketOutlined /> 功能优化
                        </Text>
                        <ul style={{ marginTop: '8px', marginBottom: '12px' }}>
                          <li>活动管理：优化活动表单，增加参数说明和提示</li>
                          <li>文档管理：优化编辑器体验，支持更多富文本格式</li>
                          <li>系统性能：优化数据库查询，提升列表加载速度</li>
                          <li>用户体验：优化表单验证提示，更加友好清晰</li>
                        </ul>
                      </div>

                      <div>
                        <Text strong style={{ color: '#faad14' }}>
                          <BugOutlined /> 问题修复
                        </Text>
                        <ul style={{ marginTop: '8px', marginBottom: '0' }}>
                          <li>修复活动时间范围选择的时区问题</li>
                          <li>修复文件上传时的进度显示异常</li>
                          <li>修复短链访问统计数据不准确的问题</li>
                          <li>修复部分页面在移动端显示错位的问题</li>
                        </ul>
                      </div>
                    </Space>
                  </Card>

                  {/* 版本 1.1.0 */}
                  <Card 
                    size="small" 
                    style={{ marginBottom: '16px', borderLeft: '4px solid #1890ff' }}
                  >
                    <Space direction="vertical" style={{ width: '100%' }} size="small">
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Title level={4} style={{ margin: 0 }}>
                          <RocketOutlined style={{ color: '#1890ff', marginRight: '8px' }} />
                          v1.1.0
                        </Title>
                        <Tag color="blue">稳定版本</Tag>
                      </div>
                      <Text type="secondary">发布时间：2024-11-15</Text>
                      
                      <Divider style={{ margin: '12px 0' }} />
                      
                      <div>
                        <Text strong style={{ color: '#52c41a' }}>
                          <CheckCircleOutlined /> 新增功能
                        </Text>
                        <ul style={{ marginTop: '8px', marginBottom: '12px' }}>
                          <li>活动中心：新增活动管理功能模块</li>
                          <li>奖励管理：新增领奖记录查询和管理</li>
                          <li>文档管理：新增文档版本管理功能</li>
                          <li>短链管理：新增短链创建和管理功能</li>
                          <li>数据统计：新增业务数据统计看板</li>
                        </ul>
                      </div>

                      <div>
                        <Text strong style={{ color: '#1890ff' }}>
                          <RocketOutlined /> 功能优化
                        </Text>
                        <ul style={{ marginTop: '8px', marginBottom: '12px' }}>
                          <li>优化登录流程，支持验证码验证</li>
                          <li>优化文件上传功能，支持拖拽上传</li>
                          <li>优化列表页面，支持更多筛选条件</li>
                          <li>优化移动端适配，提升响应式体验</li>
                        </ul>
                      </div>

                      <div>
                        <Text strong style={{ color: '#faad14' }}>
                          <BugOutlined /> 问题修复
                        </Text>
                        <ul style={{ marginTop: '8px', marginBottom: '0' }}>
                          <li>修复角色权限配置不生效的问题</li>
                          <li>修复文件删除后缓存未清除的问题</li>
                          <li>修复导出数据时中文乱码的问题</li>
                        </ul>
                      </div>
                    </Space>
                  </Card>

                  {/* 版本 1.0.0 */}
                  <Card 
                    size="small" 
                    style={{ marginBottom: '16px', borderLeft: '4px solid #722ed1' }}
                  >
                    <Space direction="vertical" style={{ width: '100%' }} size="small">
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Title level={4} style={{ margin: 0 }}>
                          <RocketOutlined style={{ color: '#722ed1', marginRight: '8px' }} />
                          v1.0.0
                        </Title>
                        <Tag color="purple">首个版本</Tag>
                      </div>
                      <Text type="secondary">发布时间：2024-10-01</Text>
                      
                      <Divider style={{ margin: '12px 0' }} />
                      
                      <div>
                        <Text strong style={{ color: '#52c41a' }}>
                          <CheckCircleOutlined /> 核心功能
                        </Text>
                        <ul style={{ marginTop: '8px', marginBottom: '0' }}>
                          <li>用户管理：用户账号的创建、编辑、禁用等基础功能</li>
                          <li>角色管理：角色创建和权限配置</li>
                          <li>权限管理：系统权限点管理</li>
                          <li>内容管理：新闻、文章的发布和管理</li>
                          <li>文件管理：文件上传和组织管理</li>
                          <li>订单管理：订单查询和管理</li>
                          <li>合作伙伴：合作伙伴信息和对接配置</li>
                          <li>系统设置：基础系统配置和参数管理</li>
                          <li>操作日志：系统操作记录和审计</li>
                        </ul>
                      </div>
                    </Space>
                  </Card>

                  <Alert
                    message="版本更新说明"
                    description="系统会定期发布新版本，包含新功能、优化改进和问题修复。重要更新会提前通知用户。"
                    type="info"
                    showIcon
                    style={{ marginTop: '24px' }}
                  />
                </Card>
              )
            }
          ]}
        />
      </div>
    </div>
  );
}