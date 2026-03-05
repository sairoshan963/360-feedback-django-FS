import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Card, Row, Col, Select, Statistic, Table, Typography, Space,
  Tag, Empty, message, Avatar, Progress, Button,
} from 'antd';
import { UserOutlined } from '@ant-design/icons';
import { listCycles } from '../../api/cycles';
import { getManagerDashboard } from '../../api/reports';
import usePageTitle from '../../hooks/usePageTitle';

const { Title, Text } = Typography;
const { Option } = Select;

export default function ManagerDashboardPage() {
  usePageTitle('Manager Dashboard');
  const navigate = useNavigate();
  const [cycles,  setCycles]  = useState([]);
  const [cycleId, setCycleId] = useState('');
  const [dash,    setDash]    = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    listCycles().then((r) => {
      const list = (r.data.cycles || []).filter((c) => ['ACTIVE','CLOSED','RESULTS_RELEASED','ARCHIVED'].includes(c.state));
      setCycles(list);
      if (list.length > 0) setCycleId(String(list[0].id));
    }).catch(() => message.error('Failed to load cycles'));
  }, []);

  useEffect(() => {
    if (!cycleId) return;
    setLoading(true);
    getManagerDashboard(cycleId).then((r) => setDash(r.data.dashboard)).catch(() => message.error('Failed to load dashboard')).finally(() => setLoading(false));
  }, [cycleId]);

  const team = dash?.team || [];
  const withScores   = team.filter((r) => r.scores?.overall_score != null);
  const avgTeamScore = withScores.length ? (withScores.reduce((s, r) => s + parseFloat(r.scores.overall_score), 0) / withScores.length).toFixed(2) : '—';
  const totalSubmitted = team.reduce((s, r) => s + parseInt(r.task_completion?.submitted || 0, 10), 0);

  const teamCols = [
    { title: 'Employee', render: (_, r) => <Space><Avatar size="small" icon={<UserOutlined />} /><span>{r.first_name} {r.last_name}</span></Space> },
    { title: 'Dept', dataIndex: 'department', render: (v) => v || '—' },
    {
      title: 'Tasks',
      render: (_, r) => {
        const { total_tasks = 0, submitted = 0 } = r.task_completion || {};
        const pct = total_tasks ? Math.round((submitted / total_tasks) * 100) : 0;
        return <Space><Text>{submitted}/{total_tasks}</Text><Progress percent={pct} size="small" style={{ width: 80 }} showInfo={false} /></Space>;
      },
    },
    { title: 'Overall', render: (_, r) => r.scores?.overall_score != null ? <Tag color="blue">{parseFloat(r.scores.overall_score).toFixed(2)}</Tag> : <Text type="secondary">—</Text> },
    { title: 'Manager', render: (_, r) => r.scores?.manager_score != null ? parseFloat(r.scores.manager_score).toFixed(2) : '—' },
    { title: 'Peer',    render: (_, r) => r.scores?.peer_score    != null ? parseFloat(r.scores.peer_score).toFixed(2)    : '—' },
    { title: 'Actions', render: (_, r) => <Button size="small" type="link" onClick={() => navigate(`/reports/${cycleId}/${r.id}`)}>View Report</Button> },
  ];

  return (
    <Space direction="vertical" size={16} style={{ width: '100%' }}>
      <Card>
        <Space style={{ width: '100%', justifyContent: 'space-between' }}>
          <Title level={4} style={{ margin: 0 }}>Team Dashboard</Title>
          <Select style={{ width: 320 }} placeholder="Select a cycle" value={cycleId || undefined} onChange={setCycleId} loading={loading} showSearch optionFilterProp="children" filterOption={(i, o) => o?.children?.toLowerCase().includes(i.toLowerCase())}>
            {cycles.map((c) => <Option key={c.id} value={String(c.id)}>{c.name}</Option>)}
          </Select>
        </Space>
      </Card>

      {!dash && !loading && <Card><Empty description="Select a cycle to view your team dashboard" /></Card>}

      {dash && (
        <>
          <Row gutter={16}>
            <Col span={8}><Card loading={loading}><Statistic title="Direct Reports" value={team.length} /></Card></Col>
            <Col span={8}><Card loading={loading}><Statistic title="Reviews Submitted" value={totalSubmitted} /></Card></Col>
            <Col span={8}><Card loading={loading}><Statistic title="Avg Team Score" value={avgTeamScore} suffix={avgTeamScore !== '—' ? '/ 5' : ''} /></Card></Col>
          </Row>
          <Card title="Direct Reports" loading={loading}>
            {team.length > 0 ? <Table rowKey="id" columns={teamCols} dataSource={team} pagination={{ pageSize: 10 }} size="small" /> : <Empty description="No direct reports found in this cycle" />}
          </Card>
        </>
      )}
    </Space>
  );
}
