import ShortTokenProTable from './components/ShortTokenProTable';

/**
 * ShortToken管理页面（系统管理）
 * 管理所有来源的短链
 */
const ShortTokenPage = () => {
  return (
    <div style={{ padding: '24px' }}>
      <ShortTokenProTable />
    </div>
  );
};

export default ShortTokenPage;
