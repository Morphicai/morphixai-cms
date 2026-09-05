/**
 * 服务目录动态菜单的映射与渲染过滤。
 *
 * 跑的是 routes.js 里真实的 getDynamicServiceMenus / getMenuTree，只把
 * 两个 API 与 storage 换成桩——`entries()` 的入参形状直接取自真实库的
 * listEmbedEntries() 输出（见 embed-submenu 变更的 4.1 验收）。
 */
import { getDynamicServiceMenus, getMenuTree } from './routes';
import { serviceOpsApi } from '../apis/serviceOps';
import { getMenusFromDocument } from '../apis/document';
import storage from '../shared/utils/storage';

jest.mock('../apis/serviceOps', () => ({ serviceOpsApi: { entries: jest.fn() } }));
jest.mock('../apis/document', () => ({ getMenusFromDocument: jest.fn() }));
jest.mock('../shared/utils/storage', () => ({ __esModule: true, default: jest.fn() }));

/** 真实库里 partner-group + 两个子条目的形状 */
const GROUPED_TREE = [
  {
    key: 'partner-service',
    menuTitle: '合伙人服务',
    menuIcon: 'TeamOutlined',
    permCode: 'PartnerManagement',
    embedUrl: 'http://localhost:8089/admin/',
  },
  {
    key: 'partner-group',
    menuTitle: '合伙人体系',
    menuIcon: 'TeamOutlined',
    children: [
      { key: 'partner-admin', menuTitle: '合伙人管理', menuIcon: 'UserOutlined', embedUrl: 'http://x/?view=partner', permCode: 'PartnerManagement' },
      { key: 'partner-task', menuTitle: '外部任务审核', menuIcon: 'CheckSquareOutlined', embedUrl: 'http://x/?view=task', permCode: 'ExternalTaskReview' },
    ],
  },
];

beforeEach(() => {
  jest.clearAllMocks();
  storage.mockReturnValue('fake-token');
  getMenusFromDocument.mockResolvedValue({ success: true, data: [] });
});

describe('getDynamicServiceMenus', () => {
  it('无分组条目仍是带 path 的顶层项、不带 children（向后兼容）', async () => {
    serviceOpsApi.entries.mockResolvedValue({ data: [GROUPED_TREE[0]] });
    const [item] = await getDynamicServiceMenus();
    expect(item).toMatchObject({
      id: 'svc_partner-service',
      name: '合伙人服务',
      code: 'PartnerManagement',
      path: '/embed/partner-service',
      parentId: null,
    });
    expect(item.children).toBeUndefined();
  });

  it('分组条目映射成带 children 的父节点，子项 parentId 指向父', async () => {
    serviceOpsApi.entries.mockResolvedValue({ data: GROUPED_TREE });
    const menus = await getDynamicServiceMenus();
    const group = menus.find((m) => m.id === 'svc_partner-group');
    expect(group.children.map((c) => c.id)).toEqual(['svc_partner-admin', 'svc_partner-task']);
    expect(group.children.map((c) => c.parentId)).toEqual(['svc_partner-group', 'svc_partner-group']);
    expect(group.children.map((c) => c.path)).toEqual(['/embed/partner-admin', '/embed/partner-task']);
  });

  // 纯分组节点没有 embedUrl，给了 path 就会点进一个没有页面的 /embed/:key
  it('纯分组父节点不给 path，点它只展开', async () => {
    serviceOpsApi.entries.mockResolvedValue({ data: GROUPED_TREE });
    const group = (await getDynamicServiceMenus()).find((m) => m.id === 'svc_partner-group');
    expect(group.path).toBeUndefined();
    expect(group.children).toHaveLength(2);
  });

  it('未配 permCode 的条目缺省从紧（只有 ServiceOps 看得见）', async () => {
    serviceOpsApi.entries.mockResolvedValue({ data: [{ key: 'k', menuTitle: 'K', embedUrl: 'http://k' }] });
    expect((await getDynamicServiceMenus())[0].code).toBe('ServiceOps');
  });

  it('未登录不请求目录', async () => {
    storage.mockReturnValue(null);
    expect(await getDynamicServiceMenus()).toEqual([]);
    expect(serviceOpsApi.entries).not.toHaveBeenCalled();
  });

  it('目录接口报错只影响动态入口，不抛给调用方', async () => {
    serviceOpsApi.entries.mockRejectedValue(new Error('boom'));
    expect(await getDynamicServiceMenus()).toEqual([]);
  });
});

describe('getMenuTree 渲染分组菜单', () => {
  beforeEach(() => serviceOpsApi.entries.mockResolvedValue({ data: GROUPED_TREE }));

  it('超管能看到父菜单与两个子菜单', async () => {
    const tree = await getMenuTree(['*']);
    const group = tree.find((m) => m.id === 'svc_partner-group');
    expect(group.children.map((c) => c.name)).toEqual(['合伙人管理', '外部任务审核']);
  });

  it('只持有一个子项权限码时，另一个子项被过滤掉，父菜单仍在', async () => {
    const tree = await getMenuTree(['PartnerManagement']);
    const group = tree.find((m) => m.id === 'svc_partner-group');
    expect(group.children.map((c) => c.id)).toEqual(['svc_partner-admin']);
  });

  // 父节点没有 path，子项全被挡掉后不能留一个点不动的空壳
  it('所有子项都无权限时，父菜单自己消失', async () => {
    const tree = await getMenuTree(['SomethingElse']);
    expect(tree.find((m) => m.id === 'svc_partner-group')).toBeUndefined();
  });
});
