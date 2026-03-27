import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Card, Form, Input, Button, Space, Typography, Select, Switch,
  Divider, message,
} from 'antd';
import { PlusOutlined, DeleteOutlined, MinusCircleOutlined } from '@ant-design/icons';
import { createClientFeedbackTemplate } from '../../api/clientFeedback';
import usePageTitle from '../../hooks/usePageTitle';

const { Title, Text } = Typography;
const { Option } = Select;

const emptyQuestion = () => ({
  key:          Date.now() + Math.random(),
  question_text: '',
  type:         'RATING',
  applies_to:   'EACH_EMPLOYEE',
  helper_text:  '',
  is_required:  true,
});
const emptySection = () => ({ key: Date.now() + Math.random(), title: '', questions: [emptyQuestion()] });

export default function CreateClientFeedbackTemplatePage() {
  usePageTitle('New Client Feedback Template');
  const navigate = useNavigate();
  const [name,        setName]        = useState('');
  const [description, setDescription] = useState('');
  const [sections,    setSections]    = useState([emptySection()]);
  const [saving,      setSaving]      = useState(false);

  const addSection     = () => setSections((s) => [...s, emptySection()]);
  const removeSection  = (sKey) => setSections((s) => s.filter((sec) => sec.key !== sKey));
  const updateSection  = (sKey, field, value) =>
    setSections((s) => s.map((sec) => sec.key === sKey ? { ...sec, [field]: value } : sec));
  const addQuestion    = (sKey) =>
    setSections((s) => s.map((sec) => sec.key === sKey ? { ...sec, questions: [...sec.questions, emptyQuestion()] } : sec));
  const removeQuestion = (sKey, qKey) =>
    setSections((s) => s.map((sec) => sec.key === sKey ? { ...sec, questions: sec.questions.filter((q) => q.key !== qKey) } : sec));
  const updateQuestion = (sKey, qKey, field, value) =>
    setSections((s) => s.map((sec) => sec.key === sKey
      ? { ...sec, questions: sec.questions.map((q) => q.key === qKey ? { ...q, [field]: value } : q) }
      : sec));

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
      name:        name.trim(),
      description: description.trim(),
      sections: sections.map((sec, si) => ({
        title:         sec.title.trim(),
        display_order: si + 1,
        questions: sec.questions.map((q, qi) => ({
          question_text: q.question_text.trim(),
          type:          q.type,
          applies_to:    q.applies_to,
          helper_text:   q.helper_text.trim(),
          is_required:   q.is_required,
          display_order: qi + 1,
        })),
      })),
    };
    setSaving(true);
    try {
      await createClientFeedbackTemplate(payload);
      message.success('Template created');
      navigate('/hr/client-feedback-templates');
    } catch (err) {
      message.error(err.response?.data?.detail || 'Failed to create template');
    } finally { setSaving(false); }
  };

  return (
    <Space direction="vertical" size={16} style={{ width: '100%' }}>
      <Card>
        <Space style={{ width: '100%', justifyContent: 'space-between' }}>
          <Title level={4} style={{ margin: 0 }}>Create Client Feedback Template</Title>
          <Space>
            <Button onClick={() => navigate('/hr/client-feedback-templates')}>Cancel</Button>
            <Button type="primary" loading={saving} onClick={handleSave}>Save Template</Button>
          </Space>
        </Space>
      </Card>

      <Card title="Template Info">
        <Form layout="vertical" style={{ maxWidth: 560 }}>
          <Form.Item label="Template Name" required>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Project Delivery Feedback" />
          </Form.Item>
          <Form.Item label="Description">
            <Input.TextArea rows={2} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Brief description of when to use this template" />
          </Form.Item>
        </Form>
      </Card>

      {sections.map((sec, si) => (
        <Card key={sec.key} title={
          <Space>
            <Text strong>Section {si + 1}</Text>
            {sections.length > 1 && (
              <Button size="small" danger icon={<DeleteOutlined />} onClick={() => removeSection(sec.key)}>
                Remove Section
              </Button>
            )}
          </Space>
        }>
          <Form layout="vertical">
            <Form.Item label="Section Title" required>
              <Input
                value={sec.title}
                onChange={(e) => updateSection(sec.key, 'title', e.target.value)}
                placeholder="e.g. Communication & Collaboration"
              />
            </Form.Item>
          </Form>

          <Divider orientation="left" plain>Questions</Divider>

          {sec.questions.map((q, qi) => (
            <Card key={q.key} size="small" style={{ marginBottom: 12, background: '#fafafa' }}
              title={<Text type="secondary">Q{qi + 1}</Text>}
              extra={sec.questions.length > 1 && (
                <Button type="text" danger size="small" icon={<MinusCircleOutlined />}
                  onClick={() => removeQuestion(sec.key, q.key)} />
              )}>
              <Form layout="vertical">
                <Form.Item label="Question Text" required style={{ marginBottom: 8 }}>
                  <Input.TextArea
                    rows={2}
                    value={q.question_text}
                    onChange={(e) => updateQuestion(sec.key, q.key, 'question_text', e.target.value)}
                    placeholder="e.g. How well did the team communicate project updates?"
                  />
                </Form.Item>
                <Form.Item label="Helper Text (optional)" style={{ marginBottom: 8 }}>
                  <Input
                    value={q.helper_text}
                    onChange={(e) => updateQuestion(sec.key, q.key, 'helper_text', e.target.value)}
                    placeholder="Additional guidance for the client"
                  />
                </Form.Item>
                <Space wrap>
                  <Form.Item label="Type" style={{ marginBottom: 0 }}>
                    <Select value={q.type} onChange={(v) => updateQuestion(sec.key, q.key, 'type', v)} style={{ width: 170 }}>
                      <Option value="RATING">Rating (1–5 stars)</Option>
                      <Option value="RATING_WITH_TEXT">Rating + Comment</Option>
                      <Option value="TEXT">Text answer</Option>
                      <Option value="YES_NO">Yes / No</Option>
                      <Option value="NPS">NPS (0–10)</Option>
                    </Select>
                  </Form.Item>
                  <Form.Item label="Applies To" style={{ marginBottom: 0 }}>
                    <Select value={q.applies_to} onChange={(v) => updateQuestion(sec.key, q.key, 'applies_to', v)} style={{ width: 160 }}>
                      <Option value="EACH_EMPLOYEE">Each Employee</Option>
                      <Option value="TEAM_OVERALL">Team Overall</Option>
                    </Select>
                  </Form.Item>
                  <Form.Item label="Required" style={{ marginBottom: 0 }}>
                    <Switch checked={q.is_required} onChange={(v) => updateQuestion(sec.key, q.key, 'is_required', v)} />
                  </Form.Item>
                </Space>
              </Form>
            </Card>
          ))}

          <Button type="dashed" icon={<PlusOutlined />} onClick={() => addQuestion(sec.key)} style={{ width: '100%' }}>
            Add Question
          </Button>
        </Card>
      ))}

      <Button type="dashed" icon={<PlusOutlined />} onClick={addSection} style={{ width: '100%' }} size="large">
        Add Section
      </Button>
    </Space>
  );
}
