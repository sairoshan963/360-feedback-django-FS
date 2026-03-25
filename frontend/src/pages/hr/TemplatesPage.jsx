import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Table, Button, Typography, Space, Tag, Collapse, message, Popconfirm } from 'antd';
import { PlusOutlined, DeleteOutlined } from '@ant-design/icons';
import { listTemplates, getTemplate, deleteTemplate } from '../../api/cycles';
import usePageTitle from '../../hooks/usePageTitle';

const { Title, Text } = Typography;
const { Panel } = Collapse;

export default function TemplatesPage() {
  usePageTitle('Templates');
  const navigate = useNavigate();
  const [templates, setTemplates] = useState([]);
  const [loading,   setLoading]   = useState(false);
  const [expanded,  setExpanded]  = useState({});

  const load = async () => {
    setLoading(true);
    try {
      const res = await listTemplates();
      setTemplates(res.data.templates || []);
    } catch { message.error('Failed to load templates'); }
    finally { setLoading(false); }
  };

  const handleDelete = async (id) => {
    try {
      await deleteTemplate(id);
      message.success('Template deleted');
      setTemplates((prev) => prev.filter((t) => t.id !== id));
    } catch (err) {
      message.error(err.response?.data?.message || 'Failed to delete template');
    }
  };

  useEffect(() => { load(); }, []);

  const loadDetail = async (id) => {
    if (expanded[id]) return;
    try {
      const res = await getTemplate(id);
      setExpanded((prev) => ({ ...prev, [id]: res.data.template }));
    } catch { message.error('Failed to load template details'); }
  };

  const columns = [
    { title: 'Name',     dataIndex: 'name', render: (v) => <Text strong>{v}</Text> },
    { title: 'Sections', dataIndex: 'section_count', render: (v) => <Tag>{v ?? '—'} sections</Tag> },
    { title: 'Created',  dataIndex: 'created_at', render: (v) => new Date(v).toLocaleDateString() },
    {
      title: 'Actions',
      render: (_, r) => (
        <Space size="small">
          <Button size="small" onClick={() => navigate(`/hr/templates/${r.id}/edit`)}>Edit</Button>
          <Popconfirm
            title="Delete this template?"
            description="This will fail if the template is used by any cycle."
            onConfirm={() => handleDelete(r.id)}
            okText="Delete"
            okButtonProps={{ danger: true }}
          >
            <Button size="small" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const expandedRowRender = (record) => {
    const tmpl = expanded[record.id];
    if (!tmpl) return <Text type="secondary">Loading…</Text>;
    return (
      <Collapse size="small" ghost>
        {(tmpl.sections || []).map((sec) => (
          <Panel key={sec.id} header={<span><Text strong>{sec.title}</Text>{sec.description && <Text type="secondary"> — {sec.description}</Text>}</span>}>
            <Table size="small" pagination={false} rowKey="id" dataSource={sec.questions || []}
              columns={[
                { title: 'Question', dataIndex: 'question_text' },
                { title: 'Type',     dataIndex: 'type', render: (v) => <Tag>{v}</Tag> },
                { title: 'Required', dataIndex: 'is_required', render: (v) => v ? 'Yes' : 'No' },
              ]}
            />
          </Panel>
        ))}
      </Collapse>
    );
  };

  return (
    <Card>
      <Space style={{ width: '100%', justifyContent: 'space-between', marginBottom: 16 }}>
        <Title level={4} style={{ margin: 0 }}>Feedback Templates</Title>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => navigate('/hr/templates/new')}>New Template</Button>
      </Space>
      <Table rowKey="id" columns={columns} dataSource={templates} loading={loading} pagination={{ pageSize: 20, showTotal: (total) => `${total} templates` }}
        expandable={{ expandedRowRender, onExpand: (exp, record) => { if (exp) loadDetail(record.id); } }}
      />
    </Card>
  );
}
