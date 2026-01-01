import { Input } from 'antd';

const { TextArea } = Input;

/**
 * 代码编辑器组件
 * 为JSON和代码类型提供更好的编辑体验
 */
export default function CodeEditor({
  value,
  onChange,
  type = 'code',
  placeholder = '请输入代码...',
  ...otherProps
}) {

  const getLanguageHint = (type) => {
    switch (type) {
      case 'json':
        return 'JSON格式';
      case 'code':
        return '代码';
      case 'html':
        return 'HTML代码';
      default:
        return '代码';
    }
  };

  const validateJSON = (text) => {
    if (type === 'json' && text.trim()) {
      try {
        JSON.parse(text);
        return true;
      } catch (e) {
        return false;
      }
    }
    return true;
  };

  const handleChange = (e) => {
    const newValue = e.target.value;
    onChange(newValue);
  };

  const isValidJSON = validateJSON(value);

  return (
    <div>
      <div style={{
        marginBottom: 8,
        fontSize: 12,
        opacity: 0.65,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <span>{getLanguageHint(type)}</span>
        {type === 'json' && value && (
          <span style={{
            color: isValidJSON ? '#52c41a' : '#ff4d4f',
            fontSize: 11
          }}>
            {isValidJSON ? '✓ JSON格式正确' : '✗ JSON格式错误'}
          </span>
        )}
      </div>
      <TextArea
        value={value}
        onChange={handleChange}
        placeholder={placeholder}
        rows={12}
        style={{
          fontFamily: 'Monaco, Menlo, "Ubuntu Mono", Consolas, monospace',
          fontSize: 13,
          lineHeight: 1.5,
          border: type === 'json' && !isValidJSON ? '1px solid #ff4d4f' : undefined
        }}
        {...otherProps}
      />
      {type === 'json' && value && (
        <div style={{
          marginTop: 4,
          fontSize: 11,
          opacity: 0.65
        }}>
          字符数: {value.length} | 行数: {value.split('\n').length}
        </div>
      )}
    </div>
  );
}