import { useMemo, useRef, useEffect } from 'react';
import ReactQuill, { Quill } from 'react-quill';
import htmlEditButton from 'quill-html-edit-button';
import 'react-quill/dist/quill.snow.css';
import './RichTextEditor.css';

// 注册 HTML 编辑按钮模块
Quill.register('modules/htmlEditButton', htmlEditButton);

/**
 * 富文本编辑器组件 - 使用 Quill 原生的 HTML 编辑模式
 */
export default function RichTextEditor({ value = '', onChange, readOnly = false, placeholder = '请输入富文本内容...' }) {
  const quillRef = useRef(null);
  
  console.log('🎨 RichTextEditor 渲染 - value:', value?.substring?.(0, 100));

  // 当 value 变化时，强制更新编辑器内容
  useEffect(() => {
    if (quillRef.current && value !== undefined) {
      const editor = quillRef.current.getEditor();
      const currentContent = editor.root.innerHTML;
      
      // 只有当内容真的不同时才更新，避免光标跳动
      if (currentContent !== value) {
        const selection = editor.getSelection();
        editor.root.innerHTML = value || '';
        
        // 恢复光标位置
        if (selection) {
          setTimeout(() => {
            try {
              editor.setSelection(selection);
            } catch (e) {
              // 忽略光标恢复错误
            }
          }, 0);
        }
      }
    }
  }, [value]);
  
  // 富文本编辑器配置 - 包含 HTML 编辑按钮
  const modules = useMemo(() => ({
    toolbar: [
      [{ 'header': [1, 2, 3, 4, 5, 6, false] }],
      ['bold', 'italic', 'underline', 'strike'],
      [{ 'list': 'ordered' }, { 'list': 'bullet' }],
      [{ 'color': [] }, { 'background': [] }],
      ['link', 'image'],
      ['clean']
    ],
    htmlEditButton: {
      debug: false,
      msg: '编辑 HTML 源码',
      okText: '确定',
      cancelText: '取消',
      buttonHTML: '&lt;&gt;',
      buttonTitle: '显示 HTML 源码',
      syntax: false,
    }
  }), []);

  const formats = useMemo(() => [
    'header',
    'bold', 'italic', 'underline', 'strike',
    'list', 'bullet',
    'color', 'background',
    'link', 'image'
  ], []);

  return (
    <div className="rich-text-editor-wrapper" style={{ minHeight: '200px' }}>
      <ReactQuill
        ref={quillRef}
        value={value || ''}
        onChange={onChange}
        modules={modules}
        formats={formats}
        theme="snow"
        placeholder={placeholder}
        readOnly={readOnly}
        style={{ height: '180px' }}
      />
    </div>
  );
}
