import React from 'react';
import { render } from '@testing-library/react';
import { ConfigProvider } from 'antd';
import zhCN from 'antd/locale/zh_CN';
import { BrowserRouter } from 'react-router-dom';
import { theme } from '../theme';

/**
 * Custom render function that wraps components with necessary providers
 * for testing with React 18 and Ant Design 5
 * 
 * @param {React.ReactElement} ui - Component to render
 * @param {Object} options - Render options
 * @param {Object} options.providerProps - Props to pass to ConfigProvider
 * @param {Object} options.routerProps - Props to pass to BrowserRouter
 * @param {Object} options.renderOptions - Options to pass to @testing-library/react render
 * @returns {Object} Render result from @testing-library/react
 */
const customRender = (ui, options = {}) => {
  const {
    providerProps = {},
    routerProps = {},
    ...renderOptions
  } = options;

  const Wrapper = ({ children }) => (
    <BrowserRouter
      future={{
        v7_startTransition: true,
        v7_relativeSplatPath: true,
      }}
      {...routerProps}
    >
      <ConfigProvider
        locale={zhCN}
        theme={theme}
        {...providerProps}
      >
        {children}
      </ConfigProvider>
    </BrowserRouter>
  );

  return render(ui, { wrapper: Wrapper, ...renderOptions });
};

// Re-export everything from @testing-library/react
export * from '@testing-library/react';

// Override render with our custom version
export { customRender as render };
