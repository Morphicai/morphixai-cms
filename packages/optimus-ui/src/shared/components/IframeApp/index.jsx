import { useContext, useEffect, useRef, useState } from 'react';
import { Spin } from 'antd';
import storage from '../../utils/storage';
import { globalContext } from '../../contexts/useGlobalContext';
import { getUserPermissionCodes } from '../../../apis/permission';
import { refreshToken } from '../../../apis/user';

/**
 * 外部子应用嵌入的基座侧实现(与 @optimus/admin-embed 是同一份协议的两端)。
 * 用工厂而不是"通用组件+路由喂参":路由 map 只透传固定字段,为传一个 url 去改
 * 路由机制不值得。routes.js 里 `Xxx: createIframeApp({ url })` 登记即接入,
 * 权限控制走菜单节点的 code,与普通页面一致。
 *
 * 时序:子应用发 optimus:ready → 这里回 optimus:handshake(token/user/perms/
 * locale/theme);子应用发 optimus:refresh-token → 刷新后回 optimus:token。
 * 消息双向都校验 origin;token 用 postMessage 定向传,不走 URL。
 */
const createIframeApp = ({ url, title = '子应用' }) => {
  const targetOrigin = new URL(url).origin;

  const IframeApp = () => {
    const iframeRef = useRef(null);
    const { userInfo } = useContext(globalContext);
    // userInfo 随时可能异步更新,握手回调里要读最新值,存 ref 避免闭包旧值
    const userRef = useRef(userInfo);
    userRef.current = userInfo;
    const [loading, setLoading] = useState(true);

    useEffect(() => {
      const buildHandshakePayload = async () => {
        let perms = [];
        try {
          // getUserPermissionCodes 自己解包过 response.data,这里拿到的直接是数组
          perms = (await getUserPermissionCodes()) || [];
        } catch { /* 拿不到就给空数组,真正的门禁在服务端 @Perm */ }
        const u = userRef.current || {};
        return {
          token: storage('access-token') || '',
          user: { id: u.id, account: u.account || u.username, fullName: u.fullName, email: u.email },
          perms,
          locale: 'zh-CN',
          theme: 'light',
        };
      };

      const onMessage = async (event) => {
        if (event.origin !== targetOrigin) return; // 只理登记的子应用
        if (event.source !== iframeRef.current?.contentWindow) return; // 只理自己这个 iframe
        const msg = event.data;
        if (!msg || typeof msg.type !== 'string') return;

        if (msg.type === 'optimus:ready') {
          const payload = await buildHandshakePayload();
          event.source.postMessage({ type: 'optimus:handshake', payload }, targetOrigin);
        } else if (msg.type === 'optimus:refresh-token') {
          try {
            const res = await refreshToken();
            const token = res?.data?.accessToken;
            if (token) {
              storage('access-token', token);
              if (res.data.refreshToken) storage('refresh-token', res.data.refreshToken);
              event.source.postMessage(
                { type: 'optimus:token', payload: { token } },
                targetOrigin,
              );
            }
          } catch { /* 刷新失败让子应用等超时,基座这边的登录态问题由基座自己的 401 流程处理 */ }
        }
      };

      window.addEventListener('message', onMessage);
      return () => window.removeEventListener('message', onMessage);
    }, []);

    return (
      <div style={{ position: 'relative', height: 'calc(100vh - 120px)' }}>
        {loading && (
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Spin tip={`正在加载${title}...`} />
          </div>
        )}
        <iframe
          ref={iframeRef}
          src={url}
          title={title}
          onLoad={() => setLoading(false)}
          style={{ width: '100%', height: '100%', border: 'none', borderRadius: 8, background: '#fff' }}
        />
      </div>
    );
  };

  return IframeApp;
};

export default createIframeApp;
