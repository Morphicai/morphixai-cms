import { Row, Col, Form, Input, Button, Card } from "antd";
import { UserOutlined, LockOutlined, QuestionCircleOutlined } from "@ant-design/icons";
import useAuth from "../../hooks/useAuth";
import "./style.scss";

export default function Login() {
  const { login, captchaImaBase64 = {}, onChangeCaptchaImage, isAutoLoggingIn } = useAuth();

  // 如果正在自动登录，显示加载状态
  if (isAutoLoggingIn) {
    return (
      <div className="login-wrap">
        <Card className="login-wrap-card" style={{ width: 500 }}>
          <div style={{ textAlign: 'center', padding: '40px 0' }}>
            <div style={{ fontSize: '16px', marginBottom: '20px' }}>
              🔧 开发环境自动登录中...
            </div>
            <div style={{ color: '#666' }}>
              使用账号: {process.env.REACT_APP_DEV_AUTO_LOGIN_ACCOUNT}
            </div>
          </div>
        </Card>
      </div>
    );
  }
  return (
    <div className="login-wrap">
      <Card className="login-wrap-card" style={{ width: 500 }}>
        <Form
          name="basic"
          labelCol={{ span: 8 }}
          wrapperCol={{ span: 16 }}
          initialValues={{ remember: true }}
          onFinish={login}
          autoComplete="off"
        >
          <Form.Item
            label="Username"
            name="account"
            rules={[
              {
                required: true,
                message: "Please input your account!",
              },
            ]}
          >
            <Input
              data-testid="login-account-input"
              prefix={
                <UserOutlined className="site-form-item-icon" />
              }
              placeholder="Username"
            />
          </Form.Item>

          <Form.Item
            label="Password"
            name="password"
            rules={[
              {
                required: true,
                message: "Please input your password!",
              },
            ]}
          >
            <Input.Password
              data-testid="login-password-input"
              prefix={
                <LockOutlined className="site-form-item-icon" />
              }
              type="password"
              placeholder="Password"
            />
          </Form.Item>
          <Form.Item label="Captcha">
            <Row gutter={8}>
              <Col span={15}>
                <Form.Item
                  name="verifyCode"
                  noStyle
                  rules={[
                    {
                      // 开发和测试环境不强制要求验证码
                      required: process.env.NODE_ENV === 'production',
                      message:
                        "Please input the captcha you got!",
                    },
                  ]}
                >
                  <Input data-testid="login-captcha-input" />
                </Form.Item>
              </Col>
              <Col span={9}>
                {captchaImaBase64.base64 ? (
                  <img
                    data-testid="login-captcha-image"
                    alt="点击更换验证码"
                    onClick={onChangeCaptchaImage}
                    src={captchaImaBase64.base64}
                  />
                ) : null}
              </Col>
            </Row>
          </Form.Item>

          {/* 开发环境提示信息 */}
          {process.env.NODE_ENV === 'development' && process.env.REACT_APP_DEV_AUTO_LOGIN_ENABLED === 'true' && (
            <Form.Item wrapperCol={{ offset: 8, span: 16 }}>
              <div style={{
                background: '#f6ffed',
                border: '1px solid #b7eb8f',
                borderRadius: '4px',
                padding: '8px 12px',
                fontSize: '12px',
                color: '#52c41a'
              }}>
                🔧 开发模式：自动登录已启用
              </div>
            </Form.Item>
          )}
          {/* 测试环境提示信息 */}
          {process.env.NODE_ENV !== 'production' && (
            <Form.Item wrapperCol={{ offset: 8, span: 16 }}>
              <div style={{
                background: '#e6f7ff',
                border: '1px solid #91d5ff',
                borderRadius: '4px',
                padding: '8px 12px',
                fontSize: '12px',
                color: '#1890ff'
              }}>
                ℹ️ 开发/测试模式：验证码非必填
              </div>
            </Form.Item>
          )}
          <Form.Item wrapperCol={{ offset: 8, span: 16 }}>
            <Button
              data-testid="login-submit-button"
              type="primary"
              htmlType="submit"
              style={{ marginRight: '8px' }}
            >
              Log in
            </Button>
            <Button
              type="link"
              icon={<QuestionCircleOutlined />}
              onClick={() => window.open('#/help', '_blank')}
            >
              使用说明
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
}
