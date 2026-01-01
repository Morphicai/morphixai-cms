import { Input, Select, InputNumber, Switch } from "antd";
import UploadComponent from "../../../Upload";
import JsonTree from "../../../JsonTree";

export function CommonSelect({ options, render, ...props }) {
  return (
    <Select {...props}>
      <Select.Option key={"no_value"} value={""}>
        请选择
      </Select.Option>
      {options.map(({ label, value }) => {
        return (
          <Select.Option key={value} value={value}>
            {label}
          </Select.Option>
        );
      })}
    </Select>
  );
}

export function inputFactory(type, props) {
  switch (type) {
    case "options":
      return CommonSelect;
    case "image":
      return UploadComponent;
    case "number":
      return InputNumber;
    case "switch":
      return Switch;
    case "jsonTree":
      return JsonTree;
    default:
      return Input;
  }
}

export default function CommonInput({ type, value, render, ...props }) {
  const InputElement = inputFactory(type, value, props);
  if (type === "switch") {
    return <InputElement type={type} checked={value} {...props} />;
  }
  return <InputElement type={type} value={value} {...props} />;
}
