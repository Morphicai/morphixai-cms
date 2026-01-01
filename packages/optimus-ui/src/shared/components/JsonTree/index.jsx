import React, { useEffect, useState, useRef } from "react";
import { isPlainObject, isFunction } from "lodash";
import { Tree } from "antd";
import JsonTreeNode from "./JsonTreeNode";

function isPrimitive(value) {
    return !Array.isArray(value) && !isPlainObject(value) && !isFunction(value)
}

let id = 0;

function loop(data, key, callback) {
    if (!Array.isArray(data)) {
        if (data.key === key) {
            return callback(data);
        } else {
            return loop(data.children, key, callback);
        }
    }
    for (let i = 0; i < data.length; i++) {
        if (data[i].key === key) {
            return callback(data[i], i, data);
        }
        if (data[i].children) {
            return loop(data[i].children, key, callback);
        }
    }
};

function transformTreeNodesToJsonData(treeNodes) {
    switch (treeNodes.type) {
        case 'array':
            return treeNodes.children?.map((treeNode) => {
                return transformTreeNodesToJsonData(treeNode);
            }) || [];

        case 'object':
            return treeNodes.children?.reduce((res, treeNode) =>
                ((res[treeNode.valueKey] = transformTreeNodesToJsonData(treeNode), res)), {});

        case 'primitive':
            return treeNodes.value;
        default:
            return;
    }
}

function getTreeJson(treeNodes) {
    return JSON.stringify(transformTreeNodesToJsonData(treeNodes));
}

function getTreeNode(key, value) {
    const nodeKey = String(id++);

    if (isPrimitive(value)) {
        return { key: nodeKey, value, valueKey: key, editable: true, type: 'primitive' };
    }
    if (Array.isArray(value)) {
        const children = value.map((v, i) => getTreeNode(String(i), v));
        return { key: nodeKey, isTypeNode: true, children, valueKey: key, type: 'array' };
    }
    if (isPlainObject(value)) {
        const keys = Object.keys(value)
        const children = keys.map(key => getTreeNode(key, value[key]));
        return { key: nodeKey, isTypeNode: true, children, valueKey: key, type: 'object' };
    }
}

function getTreeNodes(data) {
    if (Array.isArray(data)) {
        return getTreeNode('array', data)
    }
    if (isPlainObject(data)) {
        return getTreeNode('object', data)
    }
}

export default function JsonTree({ data, onChange }) {
    const oldData = useRef(null);
    const [treeNodes, setTreeNodes] = useState(null);
    const [editingNode, setEditingNode] = useState('');
    const [isTreeUnderEditing, setTreeUnderEditing] = useState(false);

    const addNode = async (nodeKey) => {
        loop(treeNodes, nodeKey, (item, key, arr) => {
            const newNodeKey = String(id++);
            const newNode = { key: newNodeKey, value: ' ', valueKey: ' ', editable: true, type: 'primitive' };
            arr.splice(key, 0, newNode);
            setEditingNode(newNodeKey);
            setTreeUnderEditing(true);
            rerender();
        });
    };

    const delNode = (nodeKey) => {
        loop(treeNodes, nodeKey, (item, index, arr) => {
            arr.splice(index, 1);
            rerenderAndChange();
        });
    };

    const editNode = (nodeKey, value, key) => {
        loop(treeNodes, nodeKey, (item, index, arr) => {
            key && (item['valueKey'] = key);
            item['value'] = value;
            rerenderAndChange();
        });
    }

    const rerender = () => {
        setTreeNodes([...treeNodes]);
    }

    const rerenderAndChange = () => {
        onChange ? onChange(getTreeJson(treeNodes[0])) : setTreeNodes([...treeNodes]);
    }

    useEffect(() => {
        if (oldData.current !== data) {
            oldData.current = data;
            let treeData;
            try {
                treeData = JSON.parse(data);
                setTreeNodes([getTreeNodes(treeData)]);
            } catch (error) {
                treeData = null;
            }
        }
    }, [data, setTreeNodes])

    const nodeRender = (nodeInfo) => {
        return <JsonTreeNode
            nodeInfo={nodeInfo}
            editingNode={editingNode}
            setEditingNode={setEditingNode}
            isTreeUnderEditing={isTreeUnderEditing}
            setTreeUnderEditing={setTreeUnderEditing}
            onAdd={addNode}
            onDelete={delNode}
            onEdit={editNode}
        />;
    };

    const dropNode = (info) => {
        const dropKey = info.node.key;
        const dragKey = info.dragNode.key;
        const dropPos = info.node.pos.split('-');
        const dropPosition = info.dropPosition - Number(dropPos[dropPos.length - 1]);
        const dragObj = loop(treeNodes, dragKey, (item, index, arr) => {
            arr.splice(index, 1);
            return item;
        });
        loop(treeNodes, dropKey, (item, key, arr) => {
            dropPosition > 0
                ? arr.splice(dropPosition, 0, dragObj)
                : arr.unshift(dragObj);
        });
        rerenderAndChange();
    }

    return (
        treeNodes
            ?
            <Tree
                draggable
                // showLine
                // showIcon
                defaultExpandAll
                autoExpandParent
                // switcherIcon={<DownOutlined />}
                treeData={treeNodes}
                titleRender={(node) => nodeRender(node)}
                onDrop={dropNode}
            >
                {treeNodes}
            </Tree>
            :
            null
    );
}
