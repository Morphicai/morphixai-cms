import React, { useRef, useMemo, useCallback, useState } from 'react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import { message, Button, Space } from 'antd';
import { CodeOutlined, EyeOutlined } from '@ant-design/icons';
import DOMPurify from 'dompurify';
import fileService from '../../../services/FileService';
import { 
  getStorageUrl, 
  convertContentImageUrls, 
  convertContentImageUrlsToStorage 
} from '../../../shared/utils/contentUtils';

/**
 * QuillEditor - 富文本编辑器组件
 * 
 * @param {Object} props
 * @param {string} props.value - HTML内容
 * @param {Function} props.onChange - 内容变更回调
 * @param {string} props.placeholder - 占位符
 * @param {boolean} props.readOnly - 只读模式
 * @param {number} props.height - 编辑器高度（像素）
 */
const QuillEditor = ({ 
  value = '', 
  onChange, 
  placeholder = '请输入内容...', 
  readOnly = false, 
  height = 400 
}) => {
  const quillRef = useRef(null);
  const [isHtmlMode, setIsHtmlMode] = useState(false);
  const [htmlContent, setHtmlContent] = useState('');

  // 图片上传处理器
  const imageHandler = useCallback(() => {
    const input = document.createElement('input');
    input.setAttribute('type', 'file');
    input.setAttribute('accept', 'image/*');
    input.click();

    input.onchange = async () => {
      const file = input.files[0];
      if (!file) return;

      // 文件大小验证
      if (file.size / 1024 / 1024 > 5) {
        message.error('图片大小不能超过5MB');
        return;
      }

      // 文件类型验证
      const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
      if (!validTypes.includes(file.type)) {
        message.error('只支持JPG、PNG、WebP、GIF格式的图片');
        return;
      }

      try {
        const formData = new FormData();
        formData.append('file', file);

        // 显示上传中提示
        const hide = message.loading('图片上传中...', 0);

        const response = await fileService.upload(formData, {
          needThumbnail: false,
          business: 'article-content'  // 使用字符串而不是对象，避免JSON字符串被用作路径
        });

        hide();

        if (response.success && response.data && response.data[0]) {
          const quill = quillRef.current.getEditor();
          const range = quill.getSelection(true);
          // 使用存储格式的URL（/OSS_FILE_PROXY/ 开头），保存时会直接存储到数据库
          const imageUrl = getStorageUrl(response.data[0].url);
          quill.insertEmbed(range.index, 'image', imageUrl);
          quill.setSelection(range.index + 1);
          message.success('图片上传成功');
        } else {
          message.error(response.error || '图片上传失败');
        }
      } catch (error) {
        console.error('图片上传失败:', error);
        message.error('图片上传失败，请重试');
      }
    };
  }, []);

  // Quill模块配置
  const modules = useMemo(() => ({
    toolbar: {
      container: [
        [{ 'header': [1, 2, 3, 4, 5, 6, false] }],
        ['bold', 'italic', 'underline', 'strike'],
        [{ 'list': 'ordered' }, { 'list': 'bullet' }],
        [{ 'indent': '-1' }, { 'indent': '+1' }],
        [{ 'color': [] }, { 'background': [] }],
        [{ 'align': [] }],
        ['link', 'image'],
        ['clean']
      ],
      handlers: {
        image: imageHandler
      }
    }
  }), [imageHandler]);

  // 支持的格式
  const formats = [
    'header', 'bold', 'italic', 'underline', 'strike',
    'list', 'bullet', 'indent', 'color', 'background',
    'align', 'link', 'image'
  ];

  // 内容清理和XSS防护
  const sanitizeContent = useCallback((content) => {
    if (!content) return '';
    
    return DOMPurify.sanitize(content, {
      ALLOWED_TAGS: [
        'p', 'br', 'strong', 'em', 'u', 's', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
        'ul', 'ol', 'li', 'a', 'img', 'blockquote', 'span'
      ],
      ALLOWED_ATTR: ['href', 'src', 'alt', 'title', 'class', 'style', 'target'],
      ALLOW_DATA_ATTR: false
    });
  }, []);

  // 处理内容变更
  const handleChange = useCallback((content) => {
    if (onChange) {
      // 清理内容后再传递给父组件
      const sanitizedContent = sanitizeContent(content);
      // 确保保存时使用存储格式的URL（/OSS_FILE_PROXY/ 开头）
      const storageContent = convertContentImageUrlsToStorage(sanitizedContent);
      onChange(storageContent);
    }
  }, [onChange, sanitizeContent]);

  // 清理显示的内容，并转换图片URL为展示格式
  const displayValue = useMemo(() => {
    const sanitized = sanitizeContent(value);
    // 展示时将存储格式的URL转换为展示格式（/api/proxy/file/ 开头）
    return convertContentImageUrls(sanitized);
  }, [value, sanitizeContent]);

  // 切换编辑模式
  const toggleMode = useCallback(() => {
    if (isHtmlMode) {
      // 从 HTML 模式切换到可视化模式，应用 HTML 内容
      const sanitized = sanitizeContent(htmlContent);
      const storageContent = convertContentImageUrlsToStorage(sanitized);
      onChange?.(storageContent);
      setIsHtmlMode(false);
    } else {
      // 从可视化模式切换到 HTML 模式
      setHtmlContent(displayValue);
      setIsHtmlMode(true);
    }
  }, [isHtmlMode, htmlContent, displayValue, onChange, sanitizeContent]);

  // HTML 模式下的内容变更
  const handleHtmlChange = useCallback((e) => {
    const newContent = e.target.value;
    setHtmlContent(newContent);
    // 实时同步到父组件
    const sanitized = sanitizeContent(newContent);
    const storageContent = convertContentImageUrlsToStorage(sanitized);
    onChange?.(storageContent);
  }, [onChange, sanitizeContent]);

  return (
    <div className="quill-editor-wrapper">
      {/* 模式切换按钮 */}
      {!readOnly && (
        <div className="editor-mode-toggle">
          <Space>
            <Button
              size="small"
              icon={isHtmlMode ? <EyeOutlined /> : <CodeOutlined />}
              onClick={toggleMode}
            >
              {isHtmlMode ? '可视化模式' : 'HTML 模式'}
            </Button>
          </Space>
        </div>
      )}

      {/* 可视化编辑器 */}
      {!isHtmlMode && (
        <ReactQuill
          ref={quillRef}
          theme="snow"
          value={displayValue}
          onChange={handleChange}
          modules={modules}
          formats={formats}
          placeholder={placeholder}
          readOnly={readOnly}
          style={{ height: `${height}px` }}
        />
      )}

      {/* HTML 源码编辑器 */}
      {isHtmlMode && (
        <textarea
          className="html-editor"
          value={htmlContent}
          onChange={handleHtmlChange}
          placeholder="请输入 HTML 代码..."
          style={{ height: `${height + 42}px` }}
        />
      )}

      <style jsx>{`
        .quill-editor-wrapper {
          margin-bottom: 50px;
          position: relative;
        }
        .editor-mode-toggle {
          position: absolute;
          top: -40px;
          right: 0;
          z-index: 10;
        }
        .quill-editor-wrapper .quill {
          background: white;
        }
        .quill-editor-wrapper .ql-container {
          min-height: ${height}px;
          font-size: 14px;
        }
        .quill-editor-wrapper .ql-editor {
          min-height: ${height}px;
        }
        .quill-editor-wrapper .ql-editor.ql-blank::before {
          font-style: normal;
          color: #bfbfbf;
        }
        .html-editor {
          width: 100%;
          padding: 12px;
          border: 1px solid #d9d9d9;
          border-radius: 2px;
          font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', 'Consolas', monospace;
          font-size: 13px;
          line-height: 1.6;
          resize: vertical;
          background: white;
          color: #333;
        }
        .html-editor:focus {
          outline: none;
          border-color: #40a9ff;
          box-shadow: 0 0 0 2px rgba(24, 144, 255, 0.2);
        }
      `}</style>
    </div>
  );
};

export default QuillEditor;
