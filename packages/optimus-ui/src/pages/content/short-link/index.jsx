import ShortLinkProTable from './components/ShortLinkProTable';

/**
 * 短链管理页面（内容管理）
 * 只管理后台添加的短链（source='admin'）
 */
const ContentShortLinkPage = () => {
  return (
    <div style={{ padding: '24px' }}>
      <ShortLinkProTable />
    </div>
  );
};

export default ContentShortLinkPage;
