import { useState } from 'react';
import { Form, Select, Input, Button, Typography, message, Modal } from 'antd';
import { MessageOutlined, SendOutlined } from '@ant-design/icons';
import { useLocation } from 'react-router-dom';
import { submitSupportTicket } from '../../api/support';

const { Text } = Typography;
const { TextArea } = Input;

const TYPES = [
  { value: 'Bug',        label: '🐛  Bug — something is broken'  },
  { value: 'Suggestion', label: '💡  Suggestion — I have an idea' },
  { value: 'Other',      label: '📋  Other — general feedback'     },
];

export default function FeedbackModal({ open, onClose }) {
  const [form]    = Form.useForm();
  const location  = useLocation();
  const [sending, setSending] = useState(false);

  const handleSubmit = async (values) => {
    setSending(true);
    try {
      await submitSupportTicket({
        type:    values.type,
        message: values.message.trim(),
        page:    location.pathname,
      });
      message.success('Report sent — thank you!');
      form.resetFields();
      onClose();
    } catch {
      message.error('Failed to send report. Please try again.');
    } finally {
      setSending(false);
    }
  };

  return (
    <Modal
      open={open}
      onCancel={() => { onClose(); form.resetFields(); }}
      footer={null}
      title={
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 32, height: 32, borderRadius: 8,
            background: 'linear-gradient(135deg, #0f172a, #1e3a5f)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#fff', fontSize: 14,
          }}>
            <MessageOutlined />
          </div>
          <span>Report an Issue or Suggestion</span>
        </div>
      }
      width={460}
      styles={{ body: { paddingTop: 8 } }}
    >
      <Text type="secondary" style={{ display: 'block', marginBottom: 16, fontSize: 13 }}>
        Found a bug or have a suggestion? Let us know — it goes straight to the developer.
      </Text>

      <Form form={form} layout="vertical" onFinish={handleSubmit}>
        <Form.Item
          name="type"
          label="Type"
          rules={[{ required: true, message: 'Please select a type' }]}
          initialValue="Bug"
        >
          <Select size="large">
            {TYPES.map((t) => (
              <Select.Option key={t.value} value={t.value}>{t.label}</Select.Option>
            ))}
          </Select>
        </Form.Item>

        <Form.Item
          name="message"
          label="Describe the issue"
          rules={[
            { required: true, message: 'Please describe the issue' },
            { min: 10, message: 'Please add a bit more detail (min 10 characters)' },
          ]}
        >
          <TextArea
            rows={4}
            placeholder="What happened? What did you expect? Which page were you on?"
            showCount
            maxLength={1000}
            style={{ borderRadius: 8 }}
          />
        </Form.Item>

        <div style={{
          background: '#f8fafc', borderRadius: 8,
          padding: '8px 12px', marginBottom: 16,
          fontSize: 12, color: '#94a3b8',
        }}>
          📍 Current page: <strong style={{ color: '#64748b' }}>{location.pathname}</strong>
        </div>

        <Form.Item style={{ marginBottom: 0 }}>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
            <Button onClick={() => { onClose(); form.resetFields(); }}>Cancel</Button>
            <Button type="primary" htmlType="submit" icon={<SendOutlined />} loading={sending} style={{ borderRadius: 8 }}>
              Send Report
            </Button>
          </div>
        </Form.Item>
      </Form>
    </Modal>
  );
}
