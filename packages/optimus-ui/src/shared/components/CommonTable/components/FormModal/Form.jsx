import {
    useImperativeHandle,
    forwardRef,
    useCallback,
    useMemo,
    Fragment,
} from "react";
import { Form, Input } from "antd";
import CommonInput from "../CommonInput";
import JsonTree from "../../../JsonTree";

function formatValue(type, val) {
    switch (type) {
        case "number":
            return Number(val);
        default:
            return val;
    }
}

export default forwardRef(({ columns = [], data = {} }, ref) => {
    const [form] = Form.useForm();
    useImperativeHandle(ref, () => ({ form }));

    const aliasMap = useMemo(() => {
        return {};
    }, []);
    const syncAliasColumn = useCallback(
        (changed) => {
            for (var i in changed) {
                if (aliasMap[i]) {
                    form.setFieldsValue(aliasMap[i], changed[i]);
                }
            }
        },
        [form, aliasMap],
    );

    return (
        <Form
            form={form}
            name="basic"
            labelCol={{ span: 4 }}
            wrapperCol={{ span: 20 }}
            style={{ padding: "20px 0" }}
            autoComplete="off"
            onValuesChange={syncAliasColumn}
        >
            {columns.map(
                ({
                    label = "",
                    key = "",
                    canEdit = true,
                    type = "string",
                    alias = "",
                    showJsonTree = false,
                    options = [],
                    ...otherProps
                }) => {
                    alias && (aliasMap[key] = alias);
                    let initValue = formatValue(
                        type,
                        data?.[key] || data?.[alias],
                    );
                    return (
                        <Fragment key={key}>
                            <Form.Item
                                hidden={!canEdit}
                                key={key}
                                label={label}
                                name={key}
                                initialValue={initValue}
                            >
                                <CommonInput
                                    options={options}
                                    type={type}
                                    placeholder=""
                                    {...otherProps}
                                />
                            </Form.Item>
                            {alias && (
                                // TODO 这里暂时只支持String
                                <Form.Item
                                    hidden={true}
                                    key={alias}
                                    label={label}
                                    name={alias}
                                    initialValue={initValue}
                                >
                                    <Input type="hidden" placeholder="" />
                                </Form.Item>
                            )}
                            {showJsonTree && (

                            // TODO JsonTree先放这边，后续考虑根据表单数据联动问题，重新规划
                                <JsonTree
                                    data={initValue}
                                />
                            )}
                        </Fragment>
                    );
                },
            )}
        </Form>
    );
});
