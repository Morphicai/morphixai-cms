import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Result, Spin } from 'antd';
import { EmbedFrame } from '../../shared/components/IframeApp';
import { serviceOpsApi } from '../../apis/serviceOps';
import { getUserPermissionCodes } from '../../apis/permission';

/**
 * 服务目录动态入口的宿主页:/embed/:serviceKey。
 * 菜单项由目录生成(见 routes.js getDynamicServiceMenus),这里按 key 取
 * embedUrl 渲染。进页前再校验一次 permCode——菜单过滤挡不住直敲 URL 的人;
 * 当然这层也只是体验,真正的门在子应用自己的后端(introspect+hasPerm)。
 */
const EmbedApp = () => {
  const { serviceKey } = useParams();
  // state: loading | denied | missing | {entry}
  const [state, setState] = useState('loading');

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const [res, perms] = await Promise.all([serviceOpsApi.entries(), getUserPermissionCodes()]);
        if (!alive) return;
        const entry = (res.data || []).find((e) => e.key === serviceKey);
        if (!entry) { setState('missing'); return; }
        const codes = perms || [];
        if (entry.permCode && !codes.includes('*') && !codes.includes(entry.permCode)) {
          setState('denied');
          return;
        }
        setState(entry);
      } catch {
        if (alive) setState('missing');
      }
    })();
    return () => { alive = false; };
  }, [serviceKey]);

  if (state === 'loading') {
    return <div style={{ textAlign: 'center', padding: 80 }}><Spin tip="正在读取服务目录..." /></div>;
  }
  if (state === 'missing') {
    return <Result status="404" title="服务不存在或未开启入口" subTitle={`服务目录里没有 ${serviceKey} 的 embed 入口,可能已下线`} />;
  }
  if (state === 'denied') {
    return <Result status="403" title="无权访问" subTitle="缺少该服务要求的权限码,请联系管理员在角色上分配" />;
  }
  return <EmbedFrame url={state.embedUrl} title={state.menuTitle || serviceKey} />;
};

export default EmbedApp;
