import React, { useState, useEffect, useRef, forwardRef } from 'react';
import { Input, Popconfirm } from 'antd';
import { EditOutlined, CheckOutlined, PlusOutlined, DeleteOutlined } from '@ant-design/icons';

const TypeDisplay = (type, children) => {
    switch (type) {
        case 'array':
            return `[${children.length}]`;

        case 'object':
            return `{${children.length}}`;

        default:
            return null;
    }
};

const SuffixIpnut = forwardRef(({addonBefore, ...props}, ref) => {
    return <span className='ant-input-wrapper ant-input-group'>
        <span className='ant-input-group-addon'>{addonBefore}</span>
        <Input
           {...props}
           ref={ref}
        />
    </span>
})

const JsonTreeNode = (props) => {
    const {
        onEdit = () => {},
        nodeInfo: { valueKey, value, key, editable, type, children },
        onAdd,
        onDelete,
        setCurrentSelectNode = () => {},
        isTreeUnderEditing = false,
        setTreeUnderEditing = () => {},
        editingNode,
        setEditingNode,
    } = props;

    const [isCurrentNodeEditable, setCurrentNodeEditable] = useState(false);
    const [nodeKeyText, setNodeKeyText] = useState(valueKey);
    const [nodeValueText, setNodeValueText] = useState(value);
    const nodeInputRef = useRef(null);
    const nodeKeyInputRef = useRef(null);

    useEffect(() => {
        document.addEventListener(
            'click',
            (event) => {
                const targetClassName = event.target.className;
                if (
                    targetClassName &&
                    typeof targetClassName === 'string' &&
                    !targetClassName.includes('nodeInput')
                ) {
                    setCurrentNodeEditable(false);
                    setTreeUnderEditing(false);
                    setEditingNode('');
                }
            },
            true,
        );
    }, [setTreeUnderEditing, setEditingNode]);

    useEffect(() => {
        if (editingNode) {
            setCurrentNodeEditable(key === editingNode);
        }
    }, [editingNode, key]);

    const addNewMenuNode = () => {
        onAdd(key);
    };

    const edit = () => {
        setEditingNode(key);
        setTreeUnderEditing(true);
    };

    const nodeChange = (event) => {
        setNodeValueText(event.target.value);
    };

    const nodeKeyChange = (event) => {
        setNodeKeyText(event.target.value.trim());
    };

    const saveNode = () => {
        onEdit(key, nodeValueText, nodeKeyText, valueKey.trim());
        setNodeValueText(nodeValueText.trim());
        setNodeKeyText(nodeKeyText.trim());
        setCurrentNodeEditable(false);
        setTreeUnderEditing(false);
        setCurrentSelectNode(key);
        setEditingNode('');
    };

    document.onkeydown = (e) => {
        const event = e || window.event;
        if (isCurrentNodeEditable && event.code === 'Enter') {
            saveNode();
        }
    };

    const deleteMenuNode = () => {
        onDelete(key);
    };

    return (
        <>
            {!isCurrentNodeEditable ? (
                <>
                    <span className={`nodeText ${type !== 'primitive' && 'cl-666'}`}>
                        {nodeKeyText} {TypeDisplay(type, children)}
                    </span>
                    {nodeKeyText && nodeValueText && '：'}
                    <span className="nodeText mr-10">
                        {nodeValueText}
                    </span>
                    {!isTreeUnderEditing && editable && (
                        <EditOutlined className="iconGap" onClick={edit} />
                    )}
                    {!isTreeUnderEditing && editable &&  <PlusOutlined className="iconGap" onClick={addNewMenuNode} />}
                    {!isTreeUnderEditing && editable && (
                        <Popconfirm
                            title={`Are you sure you want to delete menu "${nodeValueText}"?`}
                            onConfirm={deleteMenuNode}
                            okText="Yes"
                            cancelText="Cancel"
                        >
                            {!isTreeUnderEditing && <DeleteOutlined />}
                        </Popconfirm>
                    )}
                </>
            ) : (
                <>
                    {nodeKeyText && (<SuffixIpnut
                        addonBefore="key:"
                        className="nodeInput"
                        value={nodeKeyText.trim()}
                        size="small"
                        onChange={nodeKeyChange}
                        ref={nodeKeyInputRef}
                        placeholder={'请输入key'}
                    />)}
                    <SuffixIpnut
                        addonBefore='value:'
                        className="nodeInput"
                        value={nodeValueText.trim()}
                        size="small"
                        onChange={nodeChange}
                        ref={nodeInputRef}
                        placeholder={'请输入value'}
                    />
                    <CheckOutlined className="saveNode" onClick={saveNode} />
                </>
            )}
        </>
    );
};

export default JsonTreeNode;
