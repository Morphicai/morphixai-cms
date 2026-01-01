import ShortLinkProTable from './components/ShortLinkProTable';

/**
 * 短链管理页面
 * 仅超级管理员可访问
 */
const ShortLinkPage = () => {
  return (
    <div style={{ padding: '24px' }}>
      <ShortLinkProTable />
    </div>
  );
};

export default ShortLinkPage;
