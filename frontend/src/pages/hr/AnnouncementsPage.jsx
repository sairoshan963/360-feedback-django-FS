import { useEffect, useState, useCallback } from 'react';
import {
  Card, Button, Table, Tag, Space, Typography, Modal, Form,
  Input, Select, DatePicker, message, Popconfirm, Badge, Tooltip,
} from 'antd';
import {
  PlusOutlined, StopOutlined, DeleteOutlined,
  BellOutlined, InfoCircleOutlined, WarningOutlined, CheckCircleOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { getAllAnnouncements, createAnnouncement, deactivateAnnouncement, deleteAnnouncement } from '../../api/announcements';
import useAuthStore from '../../store/authStore';
import usePageTitle from '../../hooks/usePageTitle';

const { Title, Text } = Typography;
const { TextArea } = Input;

const TYPE_META = {
  info:    { color: 'blue',   icon: <InfoCircleOutlined />,  label: 'Info' },
  warning: { color: 'orange', icon: <WarningOutlined />,     label: 'Warning' },
  success: { color: 'green',  icon: <CheckCircleOutlined />, label: 'Success' },
};

export default function AnnouncementsPage() {
  usePageTitle('Announcements');
  const { user } = useAuthStore();
  const isSuperAdmin = user?.role === 'SUPER_ADMIN';

  const [items,   setItems]   = useState([]);
  const [loading, setLoading] = useState(false);
  const [open,    setOpen]    = useState(false);
  const [saving,  setSaving]  = useState(false);
  const [form]                = Form.useForm();

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getAllAnnouncements();
      setItems(res.data.announcements || []);
    } catch { message.error('Failed to load announcements'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleCreate = async (values) => {
    setSaving(true);
    try {
      await createAnnouncement({ message: values.message, type: values.type, expires_at: values.expires_at ? values.expires_at.toISOString() : null });
      message.success('Announcement posted');
      setOpen(false);
      form.resetFields();
      load();
    } catch { message.error('Failed to post announcement'); }
    finally { setSaving(false); }
  };

  const handleDeactivate = async (id) => {
    try { await deactivateAnnouncement(id); message.success('Announcement deactivated'); load(); }
    catch { message.error('Failed to deactivate'); }
  };

  const handleDelete = async (id) => {
    try { await deleteAnnouncement(id); message.success('Announcement deleted'); load(); }
    catch { message.error('Failed to delete'); }
  };

  const columns = [
    { title: 'Message', dataIndex: 'message', render: (text) => <Text style={{ maxWidth: 480, display: 'block' }}>{text}</Text> },
    { title: 'Type',   width: 110, render: (_, r) => { const m = TYPE_META[r.type]||TYPE_META.info; return <Tag color={m.color} icon={m.icon}>{m.label}</Tag>; } },
    { title: 'Status', width: 110, render: (_, r) => { const expired = r.expires_at && new Date(r.expires_at) < new Date(); return (!r.is_active||expired) ? <Badge status="default" text="Inactive" /> : <Badge status="processing" text="Active" />; } },
    { title: 'Expires', width: 160, render: (_, r) => r.expires_at ? <Text type="secondary">{dayjs(r.expires_at).format('DD MMM YYYY, HH:mm')}</Text> : <Text type="secondary">Never</Text> },
    { title: 'Posted by', dataIndex: 'created_by_name', width: 160, render: (v) => <Text type="secondary">{v || '—'}</Text> },
    { title: 'Posted at', width: 160, render: (_, r) => <Text type="secondary">{dayjs(r.created_at).format('DD MMM YYYY, HH:mm')}</Text> },
    {
      title: 'Actions', width: 120,
      render: (_, r) => {
        const expired = r.expires_at && new Date(r.expires_at) < new Date();
        const canDeactivate = r.is_active && !expired;
        return (
          <Space size={4}>
            {canDeactivate && (
              <Tooltip title="Deactivate">
                <Popconfirm title="Deactivate this announcement?" onConfirm={() => handleDeactivate(r.id)} okText="Yes" cancelText="No">
                  <Button size="small" icon={<StopOutlined />} />
                </Popconfirm>
              </Tooltip>
            )}
            {isSuperAdmin && (
              <Tooltip title="Delete permanently">
                <Popconfirm title="Permanently delete?" onConfirm={() => handleDelete(r.id)} okText="Delete" cancelText="No" okButtonProps={{ danger: true }}>
                  <Button size="small" danger icon={<DeleteOutlined />} />
                </Popconfirm>
              </Tooltip>
            )}
          </Space>
        );
      },
    },
  ];

  return (
    <div>
      <Card
        title={<Space align="center"><BellOutlined style={{ color: '#1677ff', fontSize: 18 }} /><Title level={4} style={{ margin: 0 }}>Announcements</Title></Space>}
        extra={<Button type="primary" icon={<PlusOutlined />} onClick={() => setOpen(true)}>Post Announcement</Button>}
        style={{ borderRadius: 12 }}
      >
        <Text type="secondary" style={{ display: 'block', marginBottom: 16 }}>
          Active announcements appear as a banner to all logged-in users. Users can dismiss them individually.
        </Text>
        <Table rowKey="id" columns={columns} dataSource={items} loading={loading} pagination={{ pageSize: 20, showTotal: (total) => `${total} announcements` }} scroll={{ x: 900 }} locale={{ emptyText: 'No announcements yet.' }} />
      </Card>

      <Modal open={open} title={<Space><BellOutlined style={{ color: '#1677ff' }} />New Announcement</Space>} onCancel={() => { setOpen(false); form.resetFields(); }} footer={null} width={520}>
        <Form form={form} layout="vertical" onFinish={handleCreate} initialValues={{ type: 'info' }} style={{ marginTop: 12 }}>
          <Form.Item label="Message" name="message" rules={[{ required: true, message: 'Please enter a message' }]}>
            <TextArea rows={3} maxLength={400} showCount placeholder="e.g. Nominations for Q2 2025 cycle are now open." style={{ borderRadius: 8 }} />
          </Form.Item>
          <Form.Item label="Type" name="type">
            <Select>
              <Select.Option value="info"><Space><InfoCircleOutlined style={{ color: '#1677ff' }} /> Info (blue)</Space></Select.Option>
              <Select.Option value="warning"><Space><WarningOutlined style={{ color: '#fa8c16' }} /> Warning (orange)</Space></Select.Option>
              <Select.Option value="success"><Space><CheckCircleOutlined style={{ color: '#52c41a' }} /> Success (green)</Space></Select.Option>
            </Select>
          </Form.Item>
          <Form.Item label="Expiry date (optional)" name="expires_at">
            <DatePicker showTime format="DD MMM YYYY HH:mm" disabledDate={(d) => d && d < dayjs().startOf('day')} style={{ width: '100%', borderRadius: 8 }} placeholder="Optional — leave blank for no expiry" />
          </Form.Item>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 4 }}>
            <Button onClick={() => { setOpen(false); form.resetFields(); }}>Cancel</Button>
            <Button type="primary" htmlType="submit" loading={saving} icon={<BellOutlined />}>Post</Button>
          </div>
        </Form>
      </Modal>
    </div>
  );
}
