import { useCallback, useState } from "react";
import { Row, Col, Button, Table, Modal, message } from "antd";
import useTable from "../../../shared/hooks/useTable";
import * as documentApi from "../../../apis/document";
import DocumentModal from "../components/DocumentModal";
import DocumentActionButtons from "../components/DocumentActionButtons";
import createDocumentParams from "../helps/createDocumentParams";
import { TABLE_COLUMNS } from "../config/documentTypes";
import useMount from "../../../shared/hooks/useMount";

export default function Document() {
  // Modal 状态管理
  const [modalVisible, setModalVisible] = useState(false);
  const [modalMode, setModalMode] = useState('create'); // 'create' | 'edit'
  const [editingData, setEditingData] = useState({});

  /**
   * 获取文案中心列表
   */
  const fetchDocumentList = async (params = {}, pageNo, pageSize) => {
    const {
      data: { list = [], total = 0 },
      code,
      msg,
    } = await documentApi.getDocumentList({ page: pageNo, size: pageSize });
    if (code === 200) {
      return {
        success: true,
        data: list,
        total,
      };
    }
    return {
      success: false,
      data: [],
      total: 0,
      message: msg,
    };
  };

  const { search, loading, reload, tableProps } = useTable({
    pageSize: 10,
    request: fetchDocumentList,
  });

  /**
   * 根据 ID 删除一条文案中心
   */
  const removeDocument = useCallback(
    (id) => () => {
      Modal.confirm({
        content: "是否确认删除",
        cancelText: "取消",
        okText: "确定",
        onOk: async () => {
          const res = await documentApi.deleteDocument(id);
          if (res.code === 200) {
            message.success("删除成功");
          }
          reload();
        },
      });
    },
    [reload],
  );

  /**
   * 打开创建弹窗
   */
  const handleCreate = () => {
    setModalMode('create');
    setEditingData({});
    setModalVisible(true);
  };

  /**
   * 打开编辑弹窗
   */
  const handleEdit = (document) => {
    setModalMode('edit');
    setEditingData(document);
    setModalVisible(true);
  };

  /**
   * 处理弹窗提交
   */
  const handleModalOk = async (values) => {
    const params = createDocumentParams(values);

    if (modalMode === 'create') {
      const res = await documentApi.addDocument(params);
      if (res.code === 200) {
        message.success("创建成功");
        setModalVisible(false);
        reload();
      } else {
        message.error("创建失败！" + res.msg);
        throw new Error(res.msg);
      }
    } else {
      const res = await documentApi.updateDocumentById(params);
      if (res.code === 200) {
        message.success("更新成功");
        setModalVisible(false);
        reload();
      } else {
        message.error("更新失败！" + res.msg);
        throw new Error(res.msg);
      }
    }
  };

  /**
   * 处理弹窗取消
   */
  const handleModalCancel = () => {
    setModalVisible(false);
    setEditingData({});
  };

  /**
   * 创建 Table 列头数据
   */
  const createColumns = () => {
    return [
      ...TABLE_COLUMNS,
      {
        title: "操作",
        dataIndex: "id",
        key: "action",
        render: (id, doc) => (
          <DocumentActionButtons
            onEdit={() => handleEdit(doc)}
            onDelete={removeDocument(id)}
          />
        ),
      },
    ];
  };

  useMount(() => {
    search();
  }, []);

  return (
    <div>
      <Row>
        <Col span={24}>
          <Button
            type="primary"
            onClick={handleCreate}
          >
            新增
          </Button>
        </Col>
      </Row>
      <br />
      <Table
        rowKey="id"
        columns={createColumns()}
        loading={loading}
        {...tableProps}
      />

      {/* 使用新的标准 Modal 组件 */}
      <DocumentModal
        open={modalVisible}
        mode={modalMode}
        initialData={editingData}
        onOk={handleModalOk}
        onCancel={handleModalCancel}
      />
    </div>
  );
}
