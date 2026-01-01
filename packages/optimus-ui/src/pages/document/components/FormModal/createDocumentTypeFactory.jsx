import { Input, InputNumber } from "antd";
import ReactQuill from "react-quill";
import { SketchPicker } from "react-color";
import CodeEditor from "./CodeEditor";
import ImageEditor from "./ImageEditor";
import UrlEditor from "./UrlEditor";
import RichTextEditor from "./RichTextEditor";
import SwiperEditor from "./SwiperEditor";

// HTML 编辑器配置 - 更完整的工具栏
const htmlModules = {
  toolbar: [
    [{ 'header': [1, 2, 3, 4, 5, 6, false] }],
    ['bold', 'italic', 'underline', 'strike', 'blockquote'],
    [{ 'list': 'ordered' }, { 'list': 'bullet' }, { 'indent': '-1' }, { 'indent': '+1' }],
    [{ 'color': [] }, { 'background': [] }],
    [{ 'align': [] }],
    ['link', 'image', 'video'],
    ['code-block'],
    ['clean']
  ],
};

const quillFormats = [
  'header',
  'bold', 'italic', 'underline', 'strike', 'blockquote',
  'list', 'bullet', 'indent',
  'color', 'background',
  'align',
  'link', 'image', 'video',
  'code-block'
];

function createComponentFactory(type) {
  switch (type) {
    case "richText":
      return ReactQuill;
    case "html":
      return ReactQuill;
    case "color":
      return SketchPicker;
    case "image":
      return ImageEditor;
    case "swiper":
      return SwiperEditor;
    case "json":
    case "code":
      return CodeEditor;
    case "number":
      return InputNumber;
    case "url":
      return UrlEditor;
    case "string":
    case "text":
    default:
      return Input;
  }
}

export default function DocInput({ type, value, onChange, ...otherProps }) {
  const typeValue = type?.value;
  console.log('🎨 DocInput 渲染 - 类型:', typeValue, '值:', value?.substring?.(0, 50));
  const Component = createComponentFactory(typeValue);
  console.log('🎨 DocInput - 组件:', Component.displayName || Component.name || 'Unknown');

  // 富文本编辑器配置 - 使用支持 HTML 模式切换的编辑器
  if (typeValue === 'richText') {
    return (
      <div style={{ minHeight: '240px', paddingTop: '40px' }}>
        <RichTextEditor
          value={value || ''}
          onChange={onChange}
          placeholder="请输入富文本内容..."
          {...otherProps}
        />
      </div>
    );
  }

  // HTML 编辑器配置 - 更强大的功能
  if (typeValue === 'html') {
    return (
      <div style={{ minHeight: '250px' }}>
        <Component
          value={value || ''}
          onChange={onChange}
          modules={htmlModules}
          formats={quillFormats}
          theme="snow"
          placeholder="请输入HTML内容..."
          style={{ height: '220px' }}
        />
      </div>
    );
  }

  // 颜色选择器
  if (typeValue === 'color') {
    const handleColorChange = (color) => {
      onChange(color.hex);
    };
    return (
      <div>
        <Component
          color={value || '#ffffff'}
          onChange={handleColorChange}
          {...otherProps}
        />
      </div>
    );
  }

  // 图片上传组件
  if (typeValue === 'image') {
    return (
      <div>
        <Component
          value={value}
          onChange={onChange}
          maxCount={1}
          multiple={false}
          {...otherProps}
        />
      </div>
    );
  }

  // 轮播图组件
  if (typeValue === 'swiper') {
    return (
      <div>
        <Component
          value={value}
          onChange={onChange}
          {...otherProps}
        />
      </div>
    );
  }

  // JSON 和代码编辑器
  if (['json', 'code'].includes(typeValue)) {
    return (
      <Component
        value={value}
        onChange={onChange}
        type={typeValue}
        placeholder={`请输入${type?.label || ''}内容...`}
        {...otherProps}
      />
    );
  }

  // 数字输入
  if (typeValue === 'number') {
    return (
      <Component
        value={value}
        onChange={onChange}
        {...otherProps}
        placeholder={`请输入${type?.label || ''}...`}
        style={{ width: '100%' }}
      />
    );
  }

  // URL 输入
  if (typeValue === 'url') {
    return (
      <div>
        <Component
          value={value}
          onChange={onChange}
          {...otherProps}
        />
      </div>
    );
  }

  // 默认文本输入
  return (
    <Component
      value={value}
      onChange={onChange}
      {...otherProps}
      placeholder={`请输入${type?.label || ''}内容...`}
    />
  );
}
