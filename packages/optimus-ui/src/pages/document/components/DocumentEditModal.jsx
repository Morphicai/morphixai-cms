import { useState, useEffect, useRef } from 'react';
import { Modal, message, Spin } from 'antd';
import DocumentService from '../../../services/DocumentService';
import Form from './FormModal/Form';
import createDocumentParams from '../helps/createDocumentParams';

/**
 * 文档编辑弹窗 - 根据 docKey 自动加载
 * 复用 /edit-doc/:id 路由中使用的 Form 组件
 * 
 * @param {boolean} open - 是否显示弹窗
 * @param {string} docKey - 文档标识符
 * @param {function} onOk - 保存成功回调
 * @param {function} onCancel - 取消回调
 */
const DocumentEditModal = ({ open, docKey, onOk, onCancel }) => {
  const [loading, setLoading] = useState(false);
  const [documentData, setDocumentData] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const formRef = useRef();

  // 根据 docKey 加载文档数据
  useEffect(() => {
    const loadDocument = async () => {
      setLoading(true);
      try {
        console.log('📥 [DocumentEditModal] 加载文档:', docKey);
        
        const response = await DocumentService.list({
          docKey,
          pageSize: 1,
          current: 1,
        });

        if (response.success && response.data && response.data.length > 0) {
          const doc = response.data[0];
          console.log('✅ [DocumentEditModal] 文档加载成功:', doc);
          setDocumentData(doc);
        } else {
          message.warning(`未找到文档: ${docKey}`);
          onCancel();
        }
      } catch (error) {
        console.error('❌ [DocumentEditModal] 加载文档失败:', error);
        message.error('加载文档失败');
        onCancel();
      } finally {
        setLoading(false);
      }
    };

    if (open && docKey) {
      loadDocument();
    }
  }, [open, docKey, onCancel]);



  // 处理保存
  const handleOk = async () => {
    if (!formRef.current?.form) {
      message.error('表单未初始化');
      return;
    }

    try {
      const values = await formRef.current.form.validateFields();
      console.log('📤 [DocumentEditModal] 提交表单:', values);

      setSubmitting(true);
      
      // 使用与 Edit.jsx 相同的参数处理方式
      const params = createDocumentParams(values);
      await DocumentService.update(params);
      
      message.success('保存成功');
      
      // 触发回调
      if (onOk) {
        onOk(values);
      }
      
      // 重置状态
      setDocumentData(null);
    } catch (error) {
      console.error('❌ [DocumentEditModal] 保存失败:', error);
      
      // 如果是表单验证错误，不显示错误消息
      if (!error.errorFields) {
        message.error('保存失败');
      }
    } finally {
      setSubmitting(false);
    }
  };

  // 处理取消
  const handleCancel = () => {
    setDocumentData(null);
    onCancel();
  };

  return (
    <Modal
      title={documentData?.description || '编辑文档'}
      open={open}
      onOk={handleOk}
      onCancel={handleCancel}
      confirmLoading={submitting}
      width="50vw"
      destroyOnClose
      maskClosable={false}
    >
      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px 0' }}>
          <Spin tip="加载中..." />
        </div>
      ) : documentData ? (
        <Form
          ref={formRef}
          type="edit"
          data={documentData}
          formItemProps={{
            labelCol: 6,
            wrapperCol: 18,
          }}
        />
      ) : null}
    </Modal>
  );
};

export default DocumentEditModal;
