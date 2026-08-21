import { useEffect, useState } from 'react';
import { Result, Spin, Typography } from 'antd';
import { TranslationOutlined } from '@ant-design/icons';

/**
 * 翻译工作台——内嵌独立运行的多语言文案平台。
 * 刻意不把那套代码搬进本仓库:它自己能跑、自己有存储,两个系统各管各的,
 * 这里只负责入口和权限。地址可用环境变量覆盖,默认本机 5181。
 */
const WORKBENCH_URL =
  process.env.REACT_APP_TRANSLATION_URL || 'http://localhost:5181';

const TranslationWorkbench = () => {
  // null=探测中 true=可用 false=未启动
  const [alive, setAlive] = useState(null);

  useEffect(() => {
    // no-cors 探测:只关心服务在不在,拿不到状态码也无所谓,能连上就行
    fetch(WORKBENCH_URL, { mode: 'no-cors', signal: AbortSignal.timeout(4000) })
      .then(() => setAlive(true))
      .catch(() => setAlive(false));
  }, []);

  if (alive === null) {
    return (
      <div style={{ textAlign: 'center', padding: '80px 0' }}>
        <Spin tip="正在连接翻译服务..." />
      </div>
    );
  }

  if (!alive) {
    return (
      <Result
        icon={<TranslationOutlined />}
        title="翻译服务未启动"
        subTitle={
          <Typography.Paragraph style={{ textAlign: 'left', maxWidth: 560, margin: '16px auto 0' }}>
            翻译工作台是独立进程，当前没有检测到它在运行。启动方式：
            <pre style={{ marginTop: 8 }}>
              {`cd i18n-platform 项目目录\nnpm run dev   # server 5180 + web 5181`}
            </pre>
            启动后刷新本页即可。地址可通过 REACT_APP_TRANSLATION_URL 覆盖（当前：{WORKBENCH_URL}）。
          </Typography.Paragraph>
        }
      />
    );
  }

  return (
    <iframe
      title="翻译工作台"
      src={WORKBENCH_URL}
      style={{ width: '100%', height: 'calc(100vh - 120px)', border: 'none', display: 'block' }}
    />
  );
};

export default TranslationWorkbench;
