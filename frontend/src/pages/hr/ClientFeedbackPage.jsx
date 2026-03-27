import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Card, Button, Table, Tag, Space, Typography, Modal, Form,
  Input, InputNumber, Select, message, Popconfirm, Tooltip, Empty,
} from 'antd';
import {
  PlusOutlined, DeleteOutlined, StarOutlined,
  CopyOutlined, EyeOutlined, SendOutlined, ReloadOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import {
  listClientFeedbackRequests, createClientFeedbackRequest,
  deleteClientFeedbackRequest, listClientFeedbackTemplates,
  resendClientFeedbackRequest,
} from '../../api/clientFeedback';
import { listUsers } from '../../api/users';
import usePageTitle from '../../hooks/usePageTitle';

const { Title, Text } = Typography;
const STATUS_COLOR = { PENDING: 'processing', SUBMITTED: 'success', EXPIRED: 'default' };

function avgRating(answers) {
  if (!answers?.length) return null;
  const rated = answers.filter((a) => a.rating_value != null && a.question_type !== 'NPS');
  if (!rated.length) return null;
  const sum = rated.reduce((acc, a) => acc + a.rating_value, 0);
  return (sum / rated.length).toFixed(1);
}

export default function ClientFeedbackPage() {
  usePageTitle('Client Feedback');
  const navigate = useNavigate();

  const [items,     setItems]     = useState([]);
  const [loading,   setLoading]   = useState(false);
  const [open,      setOpen]      = useState(false);
  const [saving,    setSaving]    = useState(false);
  const [resending, setResending] = useState(null);
  const [users,     setUsers]     = useState([]);
  const [templates, setTemplates] = useState([]);
  const [form]                    = Form.useForm();

  const load = useCallback(async () => {
    setLoading(true);
    try { const r = await listClientFeedbackRequests(); setItems(r.data.requests || []); }
    catch { message.error('Failed to load requests'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    listUsers({}).then((r) => setUsers(r.data.users || [])).catch(() => {});
    listClientFeedbackTemplates().then((r) => setTemplates(r.data.templates || [])).catch(() => {});
  }, []);

  const handleCreate = async (values) => {
    setSaving(true);
    try {
      await createClientFeedbackRequest(values);
      message.success('Request created — email sent to client!');
      setOpen(false); form.resetFields(); load();
    } catch (e) { message.error(e?.response?.data?.detail || 'Failed to create request'); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    try { await deleteClientFeedbackRequest(id); message.success('Deleted'); load(); }
    catch (e) { message.error(e?.response?.data?.detail || 'Cannot delete submitted requests'); }
  };

  const handleResend = async (r) => {
    setResending(r.id);
    try {
      const extendDays = r.status === 'EXPIRED' ? 7 : undefined;
      await resendClientFeedbackRequest(r.id, extendDays ? { extend_days: extendDays } : {});
      message.success(extendDays ? 'Email resent — link extended by 7 days!' : 'Email resent to client!');
      load();
    } catch (e) { message.error(e?.response?.data?.detail || 'Failed to resend'); }
    finally { setResending(null); }
  };

  const copyLink = (req) => {
    navigator.clipboard.writeText(`${window.location.origin}/client-feedback/${req.token || ''}`)
      .then(() => message.success('Link copied!'));
  };

  const columns = [
    { title: 'Project', dataIndex: 'project_name', render: (v) => <Text strong>{v}</Text> },
    { title: 'Client', dataIndex: 'client_name', width: 140 },
    { title: 'Template', dataIndex: 'template_name', width: 160, render: (v) => <Tag color="blue">{v}</Tag> },
    { title: 'Status', dataIndex: 'status', width: 100, render: (v) => <Tag color={STATUS_COLOR[v]}>{v}</Tag> },
    { title: 'Team', width: 60, render: (_, r) => r.employees?.length || 0 },
    {
      title: 'Avg Rating', width: 100,
      render: (_, r) => {
        const avg = avgRating(r.answers);
        if (!avg) return <Text type="secondary" style={{ fontSize: 12 }}>—</Text>;
        const val = parseFloat(avg);
        const color = val >= 4.0 ? 'success' : val >= 3.0 ? 'warning' : 'error';
        return (
          <Tag color={color} style={{ fontWeight: 700, fontSize: 13, borderRadius: 20, padding: '2px 10px' }}>
            {avg} / 5
          </Tag>
        );
      },
    },
    { title: 'Expires', width: 110, render: (_, r) => <Text type="secondary">{dayjs(r.expires_at).format('DD MMM YYYY')}</Text> },
    {
      title: 'Actions', width: 150,
      render: (_, r) => (
        <Space size={4}>
          <Tooltip title="View responses">
            <Button size="small" icon={<EyeOutlined />} onClick={() => navigate(`/hr/client-feedback/${r.id}`)} />
          </Tooltip>
          {r.status !== 'SUBMITTED' && (
            <Tooltip title={r.status === 'EXPIRED' ? 'Resend & extend 7 days' : 'Resend email'}>
              <Button size="small" icon={<ReloadOutlined />}
                loading={resending === r.id}
                onClick={() => handleResend(r)} />
            </Tooltip>
          )}
          {r.status === 'PENDING' && (
            <Tooltip title="Copy link">
              <Button size="small" icon={<CopyOutlined />} onClick={() => copyLink(r)} />
            </Tooltip>
          )}
          {r.status !== 'SUBMITTED' && (
            <Tooltip title="Delete">
              <Popconfirm title="Delete this request?" onConfirm={() => handleDelete(r.id)} okText="Delete" cancelText="No" okButtonProps={{ danger: true }}>
                <Button size="small" danger icon={<DeleteOutlined />} />
              </Popconfirm>
            </Tooltip>
          )}
        </Space>
      ),
    },
  ];

  return (
    <div>
      <Card
        title={<Space align="center"><StarOutlined style={{ color: '#faad14', fontSize: 18 }} /><Title level={4} style={{ margin: 0 }}>Client Feedback Requests</Title></Space>}
        extra={<Button type="primary" icon={<PlusOutlined />} onClick={() => setOpen(true)}>New Request</Button>}
        style={{ borderRadius: 12 }}
      >
        <Text type="secondary" style={{ display: 'block', marginBottom: 16 }}>
          Send a feedback form to a client. They receive a unique link by email — no login needed.
        </Text>
        <Table rowKey="id" columns={columns} dataSource={items} loading={loading}
          pagination={{ pageSize: 20, showTotal: (t) => `${t} requests` }}
          scroll={{ x: 960 }} locale={{ emptyText: 'No requests yet.' }} />
      </Card>

      {/* Create Modal */}
      <Modal open={open} title={<Space><StarOutlined style={{ color: '#faad14' }} />New Feedback Request</Space>}
        onCancel={() => { setOpen(false); form.resetFields(); }} footer={null} width={560}>
        {templates.length === 0 ? (
          <Empty description={<span>No templates yet. <a href="/hr/client-feedback-templates">Create a template</a> first.</span>} style={{ padding: '24px 0' }} />
        ) : (
          <Form form={form} layout="vertical" onFinish={handleCreate} initialValues={{ expires_days: 7 }} style={{ marginTop: 12 }}>
            <Form.Item label="Project Name" name="project_name" rules={[{ required: true }]}>
              <Input placeholder="e.g. E-commerce Website Redesign" />
            </Form.Item>
            <Form.Item label="Client Name" name="client_name" rules={[{ required: true }]}>
              <Input placeholder="e.g. Ramesh Kumar" />
            </Form.Item>
            <Form.Item label="Client Email" name="client_email" rules={[{ required: true, type: 'email' }]}>
              <Input placeholder="e.g. ramesh@clientcompany.com" />
            </Form.Item>
            <Form.Item label="Feedback Template" name="template_id" rules={[{ required: true, message: 'Select a template' }]}>
              <Select placeholder="Select a template...">
                {templates.map((t) => (
                  <Select.Option key={t.id} value={t.id}>
                    <Space>{t.name}<Text type="secondary" style={{ fontSize: 12 }}>({t.question_count} questions)</Text></Space>
                  </Select.Option>
                ))}
              </Select>
            </Form.Item>
            <Form.Item label="Team Members" name="employee_ids" rules={[{ required: true, message: 'Select at least one employee' }]}>
              <Select mode="multiple" placeholder="Search employees..."
                filterOption={(input, opt) => opt.label.toLowerCase().includes(input.toLowerCase())}
                options={users.map((u) => ({ value: u.id, label: `${u.first_name} ${u.last_name} (${u.email})` }))} />
            </Form.Item>
            <Form.Item label="Link expires in (days)" name="expires_days">
              <InputNumber min={1} max={90} style={{ width: '100%' }} />
            </Form.Item>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 4 }}>
              <Button onClick={() => { setOpen(false); form.resetFields(); }}>Cancel</Button>
              <Button type="primary" htmlType="submit" loading={saving} icon={<SendOutlined />}>Send to Client</Button>
            </div>
          </Form>
        )}
      </Modal>
    </div>
  );
}
