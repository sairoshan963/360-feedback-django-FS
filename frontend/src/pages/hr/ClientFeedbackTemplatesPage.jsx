import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Table, Button, Typography, Space, Tag, Collapse, message, Popconfirm } from 'antd';
import { PlusOutlined, DeleteOutlined, EditOutlined, FileTextOutlined } from '@ant-design/icons';
import {
  listClientFeedbackTemplates,
  deleteClientFeedbackTemplate,
} from '../../api/clientFeedback';
import usePageTitle from '../../hooks/usePageTitle';

const { Title, Text } = Typography;

const TYPE_COLOR = {
  RATING:           'blue',
  TEXT:             'green',
  RATING_WITH_TEXT: 'purple',
  YES_NO:           'orange',
  NPS:              'cyan',
};

export default function ClientFeedbackTemplatesPage() {
  usePageTitle('Client Feedback Templates');
  const navigate = useNavigate();

  const [templates, setTemplates] = useState([]);
  const [loading,   setLoading]   = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const res = await listClientFeedbackTemplates();
      setTemplates(res.data.templates || []);
    } catch { message.error('Failed to load templates'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const handleDelete = async (id) => {
    try {
      await deleteClientFeedbackTemplate(id);
      message.success('Template deleted');
      setTemplates((prev) => prev.filter((t) => t.id !== id));
    } catch (e) {
      message.error(e?.response?.data?.detail || 'Cannot delete a template that is in use');
    }
  };

  const columns = [
    { title: 'Name', dataIndex: 'name', render: (v) => <Text strong>{v}</Text> },
    { title: 'Description', dataIndex: 'description', render: (v) => <Text type="secondary">{v || '—'}</Text> },
    {
      title: 'Sections', width: 100,
      render: (_, r) => <Tag>{r.sections?.length || 0} sections</Tag>,
    },
    {
      title: 'Questions', width: 100,
      render: (_, r) => <Tag>{r.question_count || 0} questions</Tag>,
    },
    {
      title: 'Created', width: 130,
      render: (_, r) => new Date(r.created_at).toLocaleDateString(),
    },
    {
      title: 'Actions', width: 120,
      render: (_, r) => (
        <Space size="small">
          <Button size="small" icon={<EditOutlined />} onClick={() => navigate(`/hr/client-feedback-templates/${r.id}/edit`)}>Edit</Button>
          <Popconfirm
            title="Delete this template?"
            description="Templates used in existing requests cannot be deleted."
            onConfirm={() => handleDelete(r.id)}
            okText="Delete" okButtonProps={{ danger: true }}
          >
            <Button size="small" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const expandedRowRender = (record) => (
    <Collapse size="small" ghost>
      {(record.sections || []).map((sec) => (
        <Collapse.Panel key={sec.id}
          header={<Text strong>{sec.title}</Text>}
        >
          <Table size="small" pagination={false} rowKey="id"
            dataSource={sec.questions || []}
            columns={[
              { title: 'Question', dataIndex: 'question_text' },
              { title: 'Type', dataIndex: 'type', width: 160, render: (v) => <Tag color={TYPE_COLOR[v]}>{v.replace('_', ' ')}</Tag> },
              { title: 'Applies To', dataIndex: 'applies_to', width: 150, render: (v) => <Tag>{v === 'EACH_EMPLOYEE' ? 'Each Employee' : 'Team Overall'}</Tag> },
              { title: 'Required', dataIndex: 'is_required', width: 90, render: (v) => v ? 'Yes' : 'No' },
            ]}
          />
        </Collapse.Panel>
      ))}
    </Collapse>
  );

  return (
    <Card>
      <Space style={{ width: '100%', justifyContent: 'space-between', marginBottom: 16 }}>
        <Space align="center">
          <FileTextOutlined style={{ color: '#1677ff', fontSize: 18 }} />
          <Title level={4} style={{ margin: 0 }}>Client Feedback Templates</Title>
        </Space>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => navigate('/hr/client-feedback-templates/new')}>
          New Template
        </Button>
      </Space>
      <Table
        rowKey="id" columns={columns} dataSource={templates} loading={loading}
        pagination={{ pageSize: 20, showTotal: (t) => `${t} templates` }}
        expandable={{ expandedRowRender }}
        locale={{ emptyText: 'No templates yet. Create one to get started.' }}
      />
    </Card>
  );
}
