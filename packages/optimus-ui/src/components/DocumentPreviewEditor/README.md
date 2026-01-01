# DocumentPreviewEditor 组件

用于在管理后台内嵌前台页面，并支持可视化编辑文档内容的组件。

## 功能特性

- ✅ 内嵌前台页面预览
- ✅ 监听编辑事件
- ✅ 复用现有文档编辑弹窗
- ✅ 保存后自动通知 iframe 刷新
- ✅ 支持自定义回调

## 使用方法

### 基础用法

```jsx
import DocumentPreviewEditor from '@/components/DocumentPreviewEditor';

function MyPage() {
  return (
    <DocumentPreviewEditor 
      previewUrl="http://localhost:3101" 
    />
  );
}
```

### 完整示例

```jsx
import { useState } from 'react';
import { Switch } from 'antd';
import DocumentPreviewEditor from '@/components/DocumentPreviewEditor';

function MyPage() {
  const [editMode, setEditMode] = useState(true);

  const handleDocumentEdit = (payload) => {
    console.log('用户点击编辑:', payload);
    // payload 包含: docKey, documentType, dimensions, currentContent, description
  };

  const handleDocumentSave = (values, payload) => {
    console.log('保存成功:', values);
    console.log('原始编辑信息:', payload);
  };

  return (
    <div>
      <div style={{ padding: 16 }}>
        <Switch 
          checked={editMode} 
          onChange={setEditMode}
          checkedChildren="编辑模式"
          unCheckedChildren="预览模式"
        />
      </div>
      
      <DocumentPreviewEditor 
        previewUrl="http://localhost:3101/home"
        editMode={editMode}
        onDocumentEdit={handleDocumentEdit}
        onDocumentSave={handleDocumentSave}
      />
    </div>
  );
}
```

## Props

| 参数 | 说明 | 类型 | 默认值 | 必填 |
|------|------|------|--------|------|
| previewUrl | 前台页面的 URL | string | - | 是 |
| editMode | 是否启用编辑模式 | boolean | true | 否 |
| onDocumentEdit | 编辑事件回调 | (payload) => void | - | 否 |
| onDocumentSave | 保存成功回调 | (values, payload) => void | - | 否 |

### onDocumentEdit 回调参数

```typescript
{
  docKey: string;           // 文档标识符
  documentType?: string;    // 文档类型
  dimensions: {             // 渲染尺寸
    width: number;
    height: number;
  };
  currentContent?: string;  // 当前内容
  description?: string;     // 文档描述
}
```

### onDocumentSave 回调参数

- `values`: 保存的表单数据
- `payload`: 原始编辑事件的 payload

## 工作流程

1. 监听来自 iframe 的 `OPTIMUS_PAGE_READY` 事件（C 端页面加载完成后发送）
2. 收到准备就绪事件后，通过 `postMessage` 发送 `OPTIMUS_SET_EDIT_MODE` 启用/关闭编辑模式
3. 监听 `editMode` prop 变化，动态切换编辑模式
4. 监听来自 iframe 的 `OPTIMUS_EDIT_DOCUMENT` 事件
5. 收到事件后，根据 `docKey` 查询文档详情
6. 打开 `DocumentFormModal` 编辑弹窗
7. 用户编辑并保存
8. 调用 `DocumentService.update()` 更新文档
9. 发送 `OPTIMUS_DOCUMENT_UPDATED` 事件通知 iframe 刷新
10. 触发 `onDocumentSave` 回调
11. 组件卸载时发送 `OPTIMUS_SET_EDIT_MODE` 关闭编辑模式

## 通讯协议

### 页面准备就绪（C 端 → 管理后台）

```javascript
// C 端页面加载完成后发送
window.parent.postMessage({
  type: 'OPTIMUS_PAGE_READY',
  payload: {
    url: window.location.href,
    timestamp: Date.now()
  }
}, '*')
```

### 启用编辑模式（管理后台 → C 端）

```javascript
// 收到 OPTIMUS_PAGE_READY 后发送
iframe.contentWindow.postMessage({
  type: 'OPTIMUS_SET_EDIT_MODE',
  payload: { enabled: true }
}, '*')
```

### 编辑请求（C 端 → 管理后台）

```javascript
window.parent.postMessage({
  type: 'OPTIMUS_EDIT_DOCUMENT',
  payload: {
    docKey: 'home_banner',
    documentType: 'image',
    dimensions: { width: 1200, height: 400 },
    currentContent: '/path/to/image.jpg',
    description: '首页横幅'
  }
}, '*')
```

### 更新通知（管理后台 → C 端）

```javascript
iframe.contentWindow.postMessage({
  type: 'OPTIMUS_DOCUMENT_UPDATED',
  payload: { docKey: 'home_banner' }
}, '*')
```

## 注意事项

1. **跨域问题**: 如果前台页面和管理后台不在同一域名，需要配置 CORS
2. **安全性**: 生产环境需要验证 `event.origin`
3. **文档必须存在**: 如果 `docKey` 对应的文档不存在，会提示用户先创建
4. **编辑模式控制**: 组件通过 `postMessage` 动态控制编辑模式的开启/关闭

## 相关文档

- [DOC_EDIT_SECTON.md](../../../docs/DOC_EDIT_SECTON.md) - DocumentSection 编辑模式集成指南
- [DocumentFormModal](../../pages/document/components/DocumentFormModal.jsx) - 文档编辑弹窗组件
- [DocumentService](../../services/DocumentService.js) - 文档服务
