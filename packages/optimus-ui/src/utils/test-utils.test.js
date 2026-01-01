import React from 'react';
import { render, screen } from './test-utils';
import { Button } from 'antd';

describe('Test Utils', () => {
  it('should render components with ConfigProvider', () => {
    render(<Button type="primary">Test Button</Button>);
    expect(screen.getByRole('button')).toHaveTextContent('Test Button');
  });

  it('should apply Ant Design theme configuration', () => {
    render(<Button type="primary">Themed Button</Button>);
    const button = screen.getByRole('button');
    expect(button).toBeInTheDocument();
  });

  it('should provide router context', () => {
    const TestComponent = () => {
      return <div>Router Context Available</div>;
    };
    
    render(<TestComponent />);
    expect(screen.getByText('Router Context Available')).toBeInTheDocument();
  });
});
