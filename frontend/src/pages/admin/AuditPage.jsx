import { useEffect, useState } from 'react';
import { Table, Card, Typography, Select, DatePicker, Button, Space, Tag, message } from 'antd';
import { ReloadOutlined } from '@ant-design/icons';
import { getAuditLogs } from '../../api/reports';
import usePageTitle from '../../hooks/usePageTitle';

const { Title } = Typography;
const { Option } = Select;
const { RangePicker } = DatePicker;

const ACTION_COLOR = {
  CREATE_CYCLE: 'blue', CLOSE_CYCLE: 'orange', RELEASE_RESULTS: 'green',
  SUBMIT_FEEDBACK: 'cyan', IDENTITY_ACCESS: 'red', OVERRIDE_ACTION: 'volcano',
  CREATE_USER: 'purple', IMPORT_ORG: 'geekblue', EXPORT_REPORT: 'gold',
};

export default function AuditPage() {
  usePageTitle('Audit Logs');
  const [logs,    setLogs]    = useState([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({ action_type: '', limit: 100 });

  const load = async () => {
    setLoading(true);
    try {
      const params = { limit: filters.limit };
      if (filters.action_type) params.action_type = filters.action_type;
      if (filters.from)        params.from         = filters.from;
      if (filters.to)          params.to           = filters.to;
      const res = await getAuditLogs(params);
      setLogs(res.data.logs || []);
    } catch { message.error('Failed to load audit logs'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const columns = [
    { title: 'Time',        dataIndex: 'created_at', render: (v) => new Date(v).toLocaleString(), width: 180 },
    { title: 'Action',      dataIndex: 'action_type', render: (v) => <Tag color={ACTION_COLOR[v] || 'default'}>{v.replace(/_/g, ' ')}</Tag> },
    { title: 'Entity',      dataIndex: 'entity_type' },
    { title: 'Actor',       render: (_, r) => r.actor_email ? `${r.actor_first_name} ${r.actor_last_name} (${r.actor_email})` : 'System' },
    { title: 'Details',     render: (_, r) => <span style={{ fontSize: 12, color: '#666' }}>{r.new_value ? JSON.stringify(r.new_value).slice(0, 80) : '—'}</span> },
    { title: 'IP',          dataIndex: 'ip_address', render: (v) => v || '—', width: 130 },
  ];

  return (
    <Card>
      <Space style={{ width: '100%', justifyContent: 'space-between', marginBottom: 16 }}>
        <Title level={4} style={{ margin: 0 }}>Audit Logs</Title>
        <Space wrap>
          <Select placeholder="Filter by action" allowClear style={{ width: 200 }}
            value={filters.action_type || undefined}
            onChange={(v) => setFilters((f) => ({ ...f, action_type: v || '' }))}>
            {['CREATE_CYCLE','CLOSE_CYCLE','RELEASE_RESULTS','SUBMIT_FEEDBACK','IDENTITY_ACCESS','OVERRIDE_ACTION','CREATE_USER','IMPORT_ORG','EXPORT_REPORT'].map((a) => (
              <Option key={a} value={a}>{a.replace(/_/g,' ')}</Option>
            ))}
          </Select>
          <RangePicker onChange={(_, strs) => setFilters((f) => ({ ...f, from: strs[0] || '', to: strs[1] || '' }))} />
          <Button type="primary" icon={<ReloadOutlined />} onClick={load}>Refresh</Button>
        </Space>
      </Space>
      <Table rowKey="id" columns={columns} dataSource={logs} loading={loading} pagination={{ pageSize: 20 }} scroll={{ x: 900 }} />
    </Card>
  );
}
