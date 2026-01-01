import { useState } from 'react';
import { Card, Select, Space, Typography, Divider } from 'antd';
import DocInput from './createDocumentTypeFactory';
import { TYPES } from '../../config/documentTypes';

const { Title, Text } = Typography;
const { Option } = Select;

/**
 * 编辑器演示组件
 * 用于测试不同类型的编辑器
 */
export default function EditorDemo() {
  const [selectedType, setSelectedType] = useState(TYPES[0]);
  const [value, setValue] = useState('');

  const handleTypeChange = (typeValue) => {
    const type = TYPES.find(t => t.value === typeValue);
    setSelectedType(type);
    setValue(''); // 清空值
  };

  const handleValueChange = (newValue) => {
    setValue(newValue);
    console.log('📝 值变化:', newValue);
  };

  return (
    <div style={{ padding: 24 }}>
      <Title level={2}>文档编辑器演示</Title>
      <Text type="secondary">
        选择不同的文档类型来测试相应的编辑器组件
      </Text>
      
      <Divider />
      
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        <Card title="类型选择" size="small">
          <Select
            value={selectedType.value}
            onChange={handleTypeChange}
            style={{ width: 200 }}
            placeholder="选择文档类型"
          >
            {TYPES.map(type => (
              <Option key={type.value} value={type.value}>
                {type.label}
              </Option>
            ))}
          </Select>
        </Card>

        <Card 
          title={`${selectedType.label} 编辑器`} 
          extra={<Text code>{selectedType.value}</Text>}
        >
          <DocInput
            type={selectedType}
            value={value}
            onChange={handleValueChange}
          />
        </Card>

        <Card title="当前值" size="small">
          <Text code style={{ wordBreak: 'break-all' }}>
            {JSON.stringify(value, null, 2)}
          </Text>
        </Card>
      </Space>
    </div>
  );
}