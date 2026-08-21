import { useState } from 'react';
import { Button, Dropdown, Modal, Spin, message, Typography } from 'antd';
import { RobotOutlined } from '@ant-design/icons';
import { aiAssist } from '../../../apis/ai';

/**
 * 文章智能辅助入口：摘要 / 润色 / 续写。
 * 生成结果一律先预览，用户点"采纳"才落到表单——模型输出直接覆盖正文
 * 这种事故不能发生，宁可多点一下。
 */
const ACTIONS = {
  summary: { label: '生成摘要', apply: '写入摘要栏' },
  polish: { label: '润色正文', apply: '替换正文' },
  continue: { label: '续写正文', apply: '追加到正文' },
};

// 送给模型前把富文本标签剥掉:模型要的是文字,不是 <p> 汤
const htmlToText = (html) =>
  String(html || '')
    .replace(/<[^>]+>/g, '\n')
    .replace(/&nbsp;/g, ' ')
    .replace(/\n{2,}/g, '\n')
    .trim();

const AiAssistButton = ({ article, onChange }) => {
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState(null); // { action, result }

  const run = async (action) => {
    const text = htmlToText(article.content);
    if (!text) {
      message.warning('正文还是空的，先写点内容');
      return;
    }
    setLoading(true);
    try {
      const res = await aiAssist(action, text);
      if (res.success && res.data?.result) {
        setPreview({ action, result: res.data.result });
      } else {
        message.error(res.msg || '生成失败，请稍后重试');
      }
    } catch (e) {
      message.error(e?.msg || e?.message || '生成失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  const applyResult = () => {
    const { action, result } = preview;
    if (action === 'summary') {
      onChange('summary', result);
    } else if (action === 'polish') {
      // 富文本编辑器吃 HTML,按段落包 <p> 回去
      onChange('content', result.split(/\n+/).map((p) => `<p>${p}</p>`).join(''));
    } else {
      onChange('content', `${article.content || ''}${result.split(/\n+/).map((p) => `<p>${p}</p>`).join('')}`);
    }
    message.success('已采纳');
    setPreview(null);
  };

  const items = Object.entries(ACTIONS).map(([key, v]) => ({
    key,
    label: v.label,
    onClick: () => run(key),
  }));

  return (
    <>
      <Dropdown menu={{ items }} disabled={loading}>
        <Button icon={<RobotOutlined />} loading={loading} size="large">
          智能辅助
        </Button>
      </Dropdown>

      <Modal
        title={preview ? `${ACTIONS[preview.action].label} · 预览` : ''}
        open={!!preview}
        onOk={applyResult}
        okText={preview ? ACTIONS[preview.action].apply : '采纳'}
        cancelText="不用了"
        onCancel={() => setPreview(null)}
        width={640}
      >
        {preview && (
          <Typography.Paragraph style={{ whiteSpace: 'pre-wrap', maxHeight: 400, overflow: 'auto' }}>
            {preview.result}
          </Typography.Paragraph>
        )}
      </Modal>

      {loading && <Spin size="small" style={{ marginLeft: 8 }} />}
    </>
  );
};

export default AiAssistButton;
