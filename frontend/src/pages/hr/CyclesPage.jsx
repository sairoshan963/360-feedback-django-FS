import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Table, Card, Button, Tag, Space, Typography, Select, message } from 'antd';
import { PlusOutlined, EyeOutlined } from '@ant-design/icons';
import { listCycles } from '../../api/cycles';
import usePageTitle from '../../hooks/usePageTitle';

const { Title } = Typography;
const { Option } = Select;

const STATE_COLOR = {
  DRAFT: 'default', NOMINATION: 'processing', FINALIZED: 'blue',
  ACTIVE: 'green', CLOSED: 'orange', RESULTS_RELEASED: 'purple', ARCHIVED: 'red',
};

export default function CyclesPage() {
  usePageTitle('Review Cycles');
  const [cycles,  setCycles]  = useState([]);
  const [loading, setLoading] = useState(false);
  const [state,   setState]   = useState('');
  const navigate = useNavigate();

  const load = async () => {
    setLoading(true);
    try {
      const res = await listCycles(state ? { state } : {});
      setCycles(res.data.cycles || []);
    } catch { message.error('Failed to load cycles'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [state]);

  const columns = [
    { title: 'Cycle Name', dataIndex: 'name' },
    {
      title: 'Quarter',
      render: (_, r) => r.quarter && r.quarter_year ? <Tag color="blue">{r.quarter} {r.quarter_year}</Tag> : '—',
    },
    { title: 'State', dataIndex: 'state', render: (v) => <Tag color={STATE_COLOR[v]}>{v.replace('_', ' ')}</Tag> },
    { title: 'Review Deadline', dataIndex: 'review_deadline', render: (v) => new Date(v).toLocaleDateString() },
    { title: 'Peer Enabled', dataIndex: 'peer_enabled', render: (v) => <Tag color={v ? 'green' : 'default'}>{v ? 'Yes' : 'No'}</Tag> },
    { title: 'Created',      dataIndex: 'created_at', render: (v) => new Date(v).toLocaleDateString() },
    {
      title: 'Actions',
      render: (_, r) => (
        <Button size="small" icon={<EyeOutlined />} onClick={() => navigate(`/hr/cycles/${r.id}`)}>View</Button>
      ),
    },
  ];

  return (
    <Card>
      <Space style={{ width: '100%', justifyContent: 'space-between', marginBottom: 16 }}>
        <Title level={4} style={{ margin: 0 }}>Review Cycles</Title>
        <Space>
          <Select placeholder="Filter by state" allowClear style={{ width: 180 }} value={state || undefined} onChange={(v) => setState(v || '')}>
            {['DRAFT','NOMINATION','FINALIZED','ACTIVE','CLOSED','RESULTS_RELEASED','ARCHIVED'].map((s) => (
              <Option key={s} value={s}>{s.replace('_', ' ')}</Option>
            ))}
          </Select>
          <Button type="primary" icon={<PlusOutlined />} onClick={() => navigate('/hr/cycles/new')}>New Cycle</Button>
        </Space>
      </Space>
      <Table rowKey="id" columns={columns} dataSource={cycles} loading={loading} pagination={{ pageSize: 10 }} />
    </Card>
  );
}
