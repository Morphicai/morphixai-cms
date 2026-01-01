/**
 * ThemeErrorBoundary 组件
 * 捕获主题系统中的错误,防止整个应用崩溃
 */

import React from 'react';

class ThemeErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error) {
    // 更新 state 使下一次渲染能够显示降级后的 UI
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // 记录错误信息
    console.error('Theme system error:', error);
    console.error('Error info:', errorInfo);
    
    this.setState({
      error,
      errorInfo,
    });

    // 可以将错误日志上报给服务器
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  handleReset = () => {
    // 重置错误状态
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });

    // 尝试重置主题到默认状态
    try {
      localStorage.removeItem('optimus-theme-mode');
      document.documentElement.setAttribute('data-theme', 'light');
    } catch (e) {
      console.error('Failed to reset theme:', e);
    }

    // 刷新页面
    if (this.props.resetOnError) {
      window.location.reload();
    }
  };

  render() {
    if (this.state.hasError) {
      // 自定义降级 UI
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // 默认降级 UI
      return (
        <div
          style={{
            padding: '20px',
            margin: '20px',
            border: '1px solid #f5222d',
            borderRadius: '4px',
            backgroundColor: '#fff2f0',
          }}
        >
          <h2 style={{ color: '#cf1322', marginTop: 0 }}>主题系统错误</h2>
          <p style={{ color: '#595959' }}>
            主题系统遇到了一个错误。这可能是由于浏览器不兼容或配置问题导致的。
          </p>
          {this.state.error && (
            <details style={{ marginTop: '10px' }}>
              <summary style={{ cursor: 'pointer', color: '#1890ff' }}>
                查看错误详情
              </summary>
              <pre
                style={{
                  marginTop: '10px',
                  padding: '10px',
                  backgroundColor: '#f5f5f5',
                  borderRadius: '4px',
                  overflow: 'auto',
                  fontSize: '12px',
                }}
              >
                {this.state.error.toString()}
                {this.state.errorInfo && this.state.errorInfo.componentStack}
              </pre>
            </details>
          )}
          <button
            onClick={this.handleReset}
            style={{
              marginTop: '15px',
              padding: '8px 16px',
              backgroundColor: '#1890ff',
              color: '#fff',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
            }}
          >
            重置主题并刷新
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ThemeErrorBoundary;
