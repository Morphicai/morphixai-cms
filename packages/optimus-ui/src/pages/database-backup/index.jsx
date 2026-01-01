import DatabaseBackupProTable from './components/DatabaseBackupProTable';

/**
 * 数据库备份管理页面
 * 后端自动解密，前端直接下载解密后的文件
 */
const DatabaseBackupPage = () => {
  return (
    <div style={{ padding: '24px' }}>
      <DatabaseBackupProTable />
    </div>
  );
};

export default DatabaseBackupPage;
