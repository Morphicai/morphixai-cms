import React, { useState } from "react";
import { Card, Row, Col, Statistic, Spin } from "antd";
import {
    UserOutlined,
    TeamOutlined,
    RiseOutlined,
    LockOutlined,
    TrophyOutlined,
    DollarOutlined,
} from "@ant-design/icons";
import { useMount } from "../../../../shared/hooks";
import adminPartnerService from "../../../../services/AdminPartnerService";
import "./index.css";

/**
 * 合伙人系统总览页面
 */
const PartnerDashboard = () => {
    const [loading, setLoading] = useState(false);
    const [dashboardData, setDashboardData] = useState(null);

    // 加载总览数据
    const loadDashboard = async () => {
        try {
            setLoading(true);
            const response = await adminPartnerService.getDashboard();
            if (response.code === 200) {
                setDashboardData(response.data);
            }
        } catch (error) {
            console.error("加载总览数据失败:", error);
        } finally {
            setLoading(false);
        }
    };

    useMount(() => {
        loadDashboard();
    });

    if (loading || !dashboardData) {
        return (
            <div className="partner-dashboard-loading">
                <Spin size="large" tip="加载中..." />
            </div>
        );
    }

    const { overview, points, team } = dashboardData;

    return (
        <div className="partner-dashboard">
            <h2 className="page-title">合伙人系统总览</h2>

            {/* 合伙人统计 */}
            <div className="section">
                <h3 className="section-title">合伙人统计</h3>
                <Row gutter={16}>
                    <Col span={6}>
                        <Card>
                            <Statistic
                                title="合伙人总数"
                                value={overview.totalPartners}
                                prefix={<UserOutlined />}
                                valueStyle={{ color: "#3f8600" }}
                            />
                        </Card>
                    </Col>
                    <Col span={6}>
                        <Card>
                            <Statistic
                                title="活跃合伙人"
                                value={overview.activePartners}
                                prefix={<TeamOutlined />}
                                suffix={`/ ${overview.totalPartners}`}
                                valueStyle={{ color: "#1890ff" }}
                            />
                        </Card>
                    </Col>
                    <Col span={6}>
                        <Card>
                            <Statistic
                                title="本月新增"
                                value={overview.newPartnersThisMonth}
                                prefix={<RiseOutlined />}
                                suffix={`(${overview.growthRate}%)`}
                                valueStyle={{ color: "#cf1322" }}
                            />
                        </Card>
                    </Col>
                    <Col span={6}>
                        <Card>
                            <Statistic
                                title="冻结数量"
                                value={overview.frozenPartners}
                                prefix={<LockOutlined />}
                                valueStyle={{ color: "#999" }}
                            />
                        </Card>
                    </Col>
                </Row>
            </div>

            {/* 积分统计 */}
            <div className="section">
                <h3 className="section-title">积分统计</h3>
                <Row gutter={16}>
                    <Col span={8}>
                        <Card>
                            <Statistic
                                title="总发放积分"
                                value={points.totalIssued}
                                prefix={<DollarOutlined />}
                                valueStyle={{ color: "#3f8600" }}
                            />
                        </Card>
                    </Col>
                    <Col span={8}>
                        <Card>
                            <Statistic
                                title="本月发放"
                                value={points.issuedThisMonth}
                                prefix={<DollarOutlined />}
                                valueStyle={{ color: "#1890ff" }}
                            />
                        </Card>
                    </Col>
                    <Col span={8}>
                        <Card>
                            <Statistic
                                title="平均积分"
                                value={points.averagePoints}
                                prefix={<TrophyOutlined />}
                                valueStyle={{ color: "#cf1322" }}
                            />
                        </Card>
                    </Col>
                </Row>
            </div>

            {/* 团队统计 */}
            <div className="section">
                <h3 className="section-title">团队统计</h3>
                <Row gutter={16}>
                    <Col span={8}>
                        <Card>
                            <Statistic
                                title="一级团队总数"
                                value={team.totalL1}
                                prefix={<TeamOutlined />}
                                valueStyle={{ color: "#3f8600" }}
                            />
                        </Card>
                    </Col>
                    <Col span={8}>
                        <Card>
                            <Statistic
                                title="二级团队总数"
                                value={team.totalL2}
                                prefix={<TeamOutlined />}
                                valueStyle={{ color: "#1890ff" }}
                            />
                        </Card>
                    </Col>
                    <Col span={8}>
                        <Card>
                            <Statistic
                                title="平均团队规模"
                                value={team.averageTeamSize}
                                suffix="人"
                                valueStyle={{ color: "#cf1322" }}
                            />
                        </Card>
                    </Col>
                </Row>
            </div>

            {/* 积分排行榜 */}
            <div className="section">
                <h3 className="section-title">积分排行榜 TOP 10</h3>
                <Card>
                    <div className="ranking-list">
                        {points.topEarners.map((earner, index) => (
                            <div key={earner.partnerId} className="ranking-item">
                                <span className={`rank rank-${index + 1}`}>{index + 1}</span>
                                <span className="partner-code">{earner.partnerCode}</span>
                                <span className="points">{earner.points} 积分</span>
                            </div>
                        ))}
                    </div>
                </Card>
            </div>
        </div>
    );
};

export default PartnerDashboard;
