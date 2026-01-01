import { useState, useImperativeHandle, forwardRef } from "react";
import { Input, Form, Select } from "antd";
import DocInput from "./createDocumentTypeFactory";
import { TYPES, IS_EMPTY } from "../../config/documentTypes";
import JsonTree from "../../../../shared/components/JsonTree";

import "react-quill/dist/quill.snow.css";

const { Option } = Select;

function createTypeValue(type) {
  return TYPES.find((item) => item.value === type) || TYPES[0];
}

export default forwardRef(
  ({ type: modalType, data = {}, formItemProps = {} }, ref) => {
    const {
      id = IS_EMPTY,
      docKey,
      source,
      type,
      content,
      description,
      showOnMenu,
    } = data;
    const [curType, changeType] = useState(createTypeValue(type));
    const [jsonData, changeJsonData] = useState(content);
    const [form] = Form.useForm();
    const isEdit = modalType === "edit";

    const initialValues = {
      id,
      docKey,
      source,
      type: type || curType.value,
      content,
      description,
      showOnMenu,
    };

    console.log('📝 Form 初始化 - data:', data, 'showOnMenu:', showOnMenu);

    useImperativeHandle(ref, () => ({ form }));
    return (
      <Form
        form={form}
        name="basic"
        labelCol={formItemProps.labelCol || 8}
        wrapperCol={formItemProps.wrapperCol || 16}
        initialValues={initialValues}
        autoComplete="off"
        onValuesChange={(value) => {
          console.log('📝 Form onValuesChange:', value);
          if (value?.type) {
            const newType = createTypeValue(value?.type);
            console.log('📝 切换类型到:', value?.type, '对象:', newType);
            changeType(newType);
          }
          if (value?.content !== undefined) {
            changeJsonData(value?.content);
          }
        }}
      >
        <Form.Item hidden={true} label="ID" name="id">
          <Input disabled readOnly />
        </Form.Item>
        <Form.Item label="key" name="docKey">
          <Input disabled={isEdit} placeholder="请输入key" />
        </Form.Item>
        <Form.Item label="来源" name="source">
          <Input disabled={isEdit} placeholder="请输入页面来源" />
        </Form.Item>
        <Form.Item label="类型" name="type">
          <Select placeholder="请选择类型" disabled={isEdit}>
            {TYPES.map(({ value, label }, index) => {
              return (
                <Option
                  key={index}
                  value={value}
                  selected={index === 0}
                >
                  {label}
                </Option>
              );
            })}
          </Select>
        </Form.Item>
        <Form.Item label="描述" name="description">
          <Input placeholder="介绍当前文案中心的用途" disabled={isEdit} />
        </Form.Item>
        <Form.Item hidden={true} name="showOnMenu">
          <Input />
        </Form.Item>
        <Form.Item label="内容" name="content">
          <DocInput type={curType} />
        </Form.Item>

        {
          curType.value === 'json'
            ?
            <Form.Item label="JSON预览">
              <JsonTree data={jsonData} />
            </Form.Item>
            :
            null
        }
      </Form>
    );
  },
);
