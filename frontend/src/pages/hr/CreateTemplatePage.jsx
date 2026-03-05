import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Card, Form, Input, Button, Space, Typography, Select, Switch,
  InputNumber, Divider, message,
} from 'antd';
import { PlusOutlined, DeleteOutlined, MinusCircleOutlined } from '@ant-design/icons';
import { createTemplate } from '../../api/cycles';
import usePageTitle from '../../hooks/usePageTitle';

const { Title, Text } = Typography;
const { Option } = Select;

const emptyQuestion = () => ({ key: Date.now() + Math.random(), question_text: '', type: 'RATING', rating_scale_min: 1, rating_scale_max: 5, is_required: true });
const emptySection  = () => ({ key: Date.now() + Math.random(), title: '', questions: [emptyQuestion()] });

export default function CreateTemplatePage() {
  usePageTitle('New Template');
  const navigate = useNavigate();
  const [name,     setName]     = useState('');
  const [sections, setSections] = useState([emptySection()]);
  const [saving,   setSaving]   = useState(false);

  const addSection    = () => setSections((s) => [...s, emptySection()]);
  const removeSection = (sKey) => setSections((s) => s.filter((sec) => sec.key !== sKey));
  const updateSection = (sKey, field, value) => setSections((s) => s.map((sec) => sec.key === sKey ? { ...sec, [field]: value } : sec));
  const addQuestion   = (sKey) => setSections((s) => s.map((sec) => sec.key === sKey ? { ...sec, questions: [...sec.questions, emptyQuestion()] } : sec));
  const removeQuestion= (sKey, qKey) => setSections((s) => s.map((sec) => sec.key === sKey ? { ...sec, questions: sec.questions.filter((q) => q.key !== qKey) } : sec));
  const updateQuestion= (sKey, qKey, field, value) => setSections((s) => s.map((sec) => sec.key === sKey ? { ...sec, questions: sec.questions.map((q) => q.key === qKey ? { ...q, [field]: value } : q) } : sec));

  const handleSave = async () => {
    if (!name.trim()) { message.error('Template name is required'); return; }
    for (const sec of sections) {
      if (!sec.title.trim()) { message.error('Every section needs a title'); return; }
      if (!sec.questions.length) { message.error(`Section "${sec.title}" needs at least one question`); return; }
      for (const q of sec.questions) {
        if (!q.question_text.trim()) { message.error('Every question needs text'); return; }
      }
    }
    const payload = {
      name: name.trim(),
      sections: sections.map((sec, si) => ({
        title: sec.title.trim(), display_order: si + 1,
        questions: sec.questions.map((q, qi) => ({
          question_text: q.question_text.trim(), type: q.type,
          rating_scale_min: q.type === 'RATING' ? q.rating_scale_min : null,
          rating_scale_max: q.type === 'RATING' ? q.rating_scale_max : null,
          is_required: q.is_required, display_order: qi + 1,
        })),
      })),
    };
    setSaving(true);
    try {
      await createTemplate(payload);
      message.success('Template created');
      navigate('/hr/templates');
    } catch (err) {
      message.error(err.response?.data?.message || 'Failed to create template');
    } finally { setSaving(false); }
  };

  return (
    <Space direction="vertical" size={16} style={{ width: '100%' }}>
      <Card>
        <Space style={{ width: '100%', justifyContent: 'space-between' }}>
          <Title level={4} style={{ margin: 0 }}>Create Feedback Template</Title>
          <Space>
            <Button onClick={() => navigate('/hr/templates')}>Cancel</Button>
            <Button type="primary" loading={saving} onClick={handleSave}>Save Template</Button>
          </Space>
        </Space>
      </Card>

      <Card title="Template Info">
        <Form layout="vertical" style={{ maxWidth: 500 }}>
          <Form.Item label="Template Name" required>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Annual 360 Review 2025" />
          </Form.Item>
        </Form>
      </Card>

      {sections.map((sec, si) => (
        <Card key={sec.key} title={
          <Space>
            <Text strong>Section {si + 1}</Text>
            {sections.length > 1 && <Button size="small" danger icon={<DeleteOutlined />} onClick={() => removeSection(sec.key)}>Remove Section</Button>}
          </Space>
        }>
          <Form layout="vertical">
            <Form.Item label="Section Title" required>
              <Input value={sec.title} onChange={(e) => updateSection(sec.key, 'title', e.target.value)} placeholder="e.g. Communication Skills" />
            </Form.Item>
          </Form>
          <Divider orientation="left" plain>Questions</Divider>
          {sec.questions.map((q, qi) => (
            <Card key={q.key} size="small" style={{ marginBottom: 12, background: '#fafafa' }}
              title={<Text type="secondary">Q{qi + 1}</Text>}
              extra={sec.questions.length > 1 && <Button type="text" danger size="small" icon={<MinusCircleOutlined />} onClick={() => removeQuestion(sec.key, q.key)} />}>
              <Form layout="vertical">
                <Form.Item label="Question Text" required style={{ marginBottom: 8 }}>
                  <Input.TextArea rows={2} value={q.question_text} onChange={(e) => updateQuestion(sec.key, q.key, 'question_text', e.target.value)} placeholder="e.g. How well does this person communicate?" />
                </Form.Item>
                <Space wrap>
                  <Form.Item label="Type" style={{ marginBottom: 0 }}>
                    <Select value={q.type} onChange={(v) => updateQuestion(sec.key, q.key, 'type', v)} style={{ width: 120 }}>
                      <Option value="RATING">Rating</Option>
                      <Option value="TEXT">Text</Option>
                    </Select>
                  </Form.Item>
                  {q.type === 'RATING' && (
                    <>
                      <Form.Item label="Min" style={{ marginBottom: 0 }}>
                        <InputNumber min={1} max={10} value={q.rating_scale_min} onChange={(v) => updateQuestion(sec.key, q.key, 'rating_scale_min', v)} style={{ width: 70 }} />
                      </Form.Item>
                      <Form.Item label="Max" style={{ marginBottom: 0 }}>
                        <InputNumber min={1} max={10} value={q.rating_scale_max} onChange={(v) => updateQuestion(sec.key, q.key, 'rating_scale_max', v)} style={{ width: 70 }} />
                      </Form.Item>
                    </>
                  )}
                  <Form.Item label="Required" style={{ marginBottom: 0 }}>
                    <Switch checked={q.is_required} onChange={(v) => updateQuestion(sec.key, q.key, 'is_required', v)} />
                  </Form.Item>
                </Space>
              </Form>
            </Card>
          ))}
          <Button type="dashed" icon={<PlusOutlined />} onClick={() => addQuestion(sec.key)} style={{ width: '100%' }}>Add Question</Button>
        </Card>
      ))}

      <Button type="dashed" icon={<PlusOutlined />} onClick={addSection} style={{ width: '100%' }} size="large">Add Section</Button>
    </Space>
  );
}
