import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Card, Result, Spin, message } from 'antd';
import { formApi } from '../../apis/form';
import SchemaFormRenderer from './components/SchemaFormRenderer';

/**
 * 公开填报页(#/f/:slug):免登录,用和管理端预览完全相同的渲染器。
 * 服务端只认启用的定义,这里拿到 404 就统一按"不存在"处理。
 */
const FillPage = () => {
  const { slug } = useParams();
  const [state, setState] = useState({ status: 'loading' }); // loading|ready|missing|done
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    formApi.getPublic(slug).then((res) => {
      if (res.success && res.data?.schema) setState({ status: 'ready', form: res.data });
      else setState({ status: 'missing' });
    }).catch(() => setState({ status: 'missing' }));
  }, [slug]);

  const handleSubmit = async (data) => {
    setSubmitting(true);
    const res = await formApi.submitPublic(slug, data);
    setSubmitting(false);
    if (res.success) setState((s) => ({ ...s, status: 'done' }));
    else message.error(res.msg || '提交失败，请检查填写内容');
  };

  if (state.status === 'loading') {
    return <div style={{ textAlign: 'center', padding: '120px 0' }}><Spin size="large" /></div>;
  }
  if (state.status === 'missing') {
    return <Result status="404" title="表单不存在或已停止收集" />;
  }
  if (state.status === 'done') {
    return <Result status="success" title="提交成功" subTitle="感谢你的填写。" />;
  }
  return (
    <div style={{ maxWidth: 640, margin: '40px auto', padding: '0 16px' }}>
      <Card title={state.form.schema?.title || state.form.name}>
        <SchemaFormRenderer schema={state.form.schema} submitting={submitting} onSubmit={handleSubmit} />
      </Card>
    </div>
  );
};

export default FillPage;
