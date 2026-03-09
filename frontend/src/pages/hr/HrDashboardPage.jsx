import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Card, Row, Col, Select, Statistic, Table, Typography, Space,
  Progress, Empty, message, Tag, Button, Input, Tooltip,
} from 'antd';
import { EyeOutlined, LockOutlined } from '@ant-design/icons';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartTooltip, ResponsiveContainer, ReferenceLine, LabelList } from 'recharts';
import { listCycles, getParticipants } from '../../api/cycles';
import { getHrDashboard } from '../../api/reports';
import usePageTitle from '../../hooks/usePageTitle';

const { Title } = Typography;
const { Option } = Select;

const STATE_COLOR = {
  DRAFT: 'default', NOMINATION: 'processing', FINALIZED: 'blue',
  ACTIVE: 'green', CLOSED: 'orange', RESULTS_RELEASED: 'purple', ARCHIVED: 'red',
};

const DeptTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: 'linear-gradient(135deg,#1e1b4b 0%,#312e81 100%)', borderRadius: 10, padding: '12px 18px', boxShadow: '0 8px 28px rgba(79,70,229,0.35)', minWidth: 155, color: '#fff' }}>
      <p style={{ margin: 0, fontSize: 12, opacity: 0.75, fontWeight: 500 }}>{label}</p>
      <p style={{ margin: '4px 0 0', fontSize: 22, fontWeight: 700, lineHeight: 1.2 }}>
        {payload[0].value}<span style={{ fontSize: 12, fontWeight: 400, opacity: 0.65 }}> / 5.00</span>
      </p>
    </div>
  );
};

export default function HrDashboardPage() {
  usePageTitle('HR Dashboard');
  const navigate = useNavigate();

  const [cycles,        setCycles]        = useState([]);
  const [cycleId,       setCycleId]       = useState('');
  const [dash,          setDash]          = useState(null);
  const [participants,  setParticipants]  = useState([]);
  const [loading,       setLoading]       = useState(false);
  const [partSearch,    setPartSearch]    = useState('');

  useEffect(() => {
    listCycles().then((r) => {
      const list = r.data.cycles || [];
      setCycles(list);
      if (list.length > 0) setCycleId(String(list[0].id));
    }).catch(() => message.error('Failed to load cycles'));
  }, []);

  useEffect(() => {
    if (!cycleId) return;
    setLoading(true);
    setParticipants([]);
    Promise.all([
      getHrDashboard(cycleId),
      getParticipants(cycleId),
    ]).then(([dashRes, partRes]) => {
      setDash(dashRes.data.dashboard);
      setParticipants(partRes.data.participants || []);
    }).catch(() => message.error('Failed to load dashboard')).finally(() => setLoading(false));
  }, [cycleId]);

  const submissionCols = [
    { title: 'Reviewer Type', dataIndex: 'reviewer_type' },
    { title: 'Total',         dataIndex: 'total' },
    { title: 'Submitted',     dataIndex: 'submitted' },
    { title: 'Pending',       dataIndex: 'pending' },
    { title: 'Completion',    render: (_, r) => { const pct = r.total ? Math.round((r.submitted / r.total) * 100) : 0; return <Progress percent={pct} size="small" />; } },
  ];

  const deptScoreData = (dash?.department_scores || []).map((d) => ({ name: d.department || 'Unknown', avg: parseFloat(d.avg_overall || 0).toFixed(2) }));
  const currentCycle  = cycles.find((c) => String(c.id) === cycleId);
  const resultsOut    = ['RESULTS_RELEASED', 'ARCHIVED'].includes(currentCycle?.state);

  const filteredParticipants = partSearch.trim()
    ? participants.filter((p) =>
        `${p.first_name} ${p.last_name} ${p.email}`.toLowerCase()
          .includes(partSearch.toLowerCase()))
    : participants;

  return (
    <Space direction="vertical" size={16} style={{ width: '100%' }}>
      <Card>
        <Space style={{ width: '100%', justifyContent: 'space-between' }}>
          <Space align="center">
            <Title level={4} style={{ margin: 0 }}>HR Dashboard</Title>
            {currentCycle && <Tag color={STATE_COLOR[currentCycle.state]}>{currentCycle.state.replace('_',' ')}</Tag>}
          </Space>
          <Select style={{ width: 320 }} placeholder="Select a cycle" value={cycleId || undefined} onChange={setCycleId} loading={loading} showSearch optionFilterProp="children" filterOption={(i, o) => o?.children?.toLowerCase().includes(i.toLowerCase())}>
            {cycles.map((c) => <Option key={c.id} value={String(c.id)}>{c.name}</Option>)}
          </Select>
        </Space>
      </Card>

      {!dash && !loading && <Card><Empty description="Select a cycle to view dashboard" /></Card>}

      {dash && (
        <>
          <Row gutter={16}>
            <Col span={6}><Card loading={loading}><Statistic title="Total Participants" value={dash.submission_stats?.reduce((s, r) => s + parseInt(r.total||0), 0) ?? 0} /></Card></Col>
            <Col span={6}><Card loading={loading}><Statistic title="Submitted Tasks"    value={dash.submission_stats?.reduce((s, r) => s + parseInt(r.submitted||0), 0) ?? 0} /></Card></Col>
            <Col span={6}><Card loading={loading}><Statistic title="Incomplete Nominations" value={dash.nomination_stats?.incomplete ?? '—'} /></Card></Col>
            <Col span={6}><Card loading={loading}><Statistic title="Complete Nominations"   value={dash.nomination_stats?.complete ?? '—'} /></Card></Col>
          </Row>

          <Card title="Submission Breakdown by Reviewer Type" loading={loading}>
            {(dash.submission_stats||[]).length > 0
              ? <Table rowKey="reviewer_type" columns={submissionCols} dataSource={dash.submission_stats} pagination={false} size="small" />
              : <Empty description="No submission data yet" />}
          </Card>

          <Card title="Average Score by Department" loading={loading} style={{ borderRadius: 12 }} styles={{ body: { background: '#fafbff', borderRadius: '0 0 12px 12px', padding: '24px 16px 16px' } }}>
            {deptScoreData.length > 0 ? (
              <ResponsiveContainer width="100%" height={380}>
                <BarChart data={deptScoreData} margin={{ top: 32, right: 24, left: 0, bottom: 80 }} barSize={52}>
                  <defs>
                    <linearGradient id="deptGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%"   stopColor="#818cf8" stopOpacity={1} />
                      <stop offset="100%" stopColor="#4f46e5" stopOpacity={0.9} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke="#ede9fe" strokeDasharray="4 4" vertical={false} />
                  <XAxis dataKey="name" angle={-35} textAnchor="end" interval={0} tick={{ fontSize: 12, fill: '#6b7280' }} axisLine={false} tickLine={false} />
                  <YAxis domain={[0, 5]} tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} tickFormatter={(v) => v.toFixed(1)} width={36} />
                  <RechartTooltip content={<DeptTooltip />} cursor={{ fill: 'rgba(99,102,241,0.07)' }} />
                  <ReferenceLine y={3} stroke="#c4b5fd" strokeDasharray="5 4" label={{ value: 'Mid (3.0)', position: 'insideTopRight', fontSize: 11, fill: '#a78bfa' }} />
                  <Bar dataKey="avg" name="Avg Score" fill="url(#deptGrad)" radius={[8, 8, 0, 0]}>
                    <LabelList dataKey="avg" position="top" style={{ fontSize: 12, fill: '#4f46e5', fontWeight: 700 }} />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : <Empty description="Department scores available after cycle closes" />}
          </Card>

          {/* Participants & Reports */}
          <Card
            title={
              <Space>
                <span>Participants & Reports</span>
                <Tag color={resultsOut ? 'purple' : 'default'}>
                  {filteredParticipants.length} people
                </Tag>
                {resultsOut
                  ? <Tag color="success">Reports Available</Tag>
                  : <Tag color="warning">Results not yet released</Tag>}
              </Space>
            }
            loading={loading}
            extra={
              <Input.Search
                placeholder="Search by name or email…"
                value={partSearch}
                onChange={(e) => setPartSearch(e.target.value)}
                allowClear
                style={{ width: 260 }}
              />
            }
          >
            {participants.length === 0 && !loading
              ? <Empty description="No participants yet" />
              : (
                <Table
                  rowKey="id"
                  size="small"
                  pagination={{ pageSize: 10, showSizeChanger: true, showTotal: (t) => `${t} participants` }}
                  dataSource={filteredParticipants}
                  columns={[
                    {
                      title: 'Name',
                      render: (_, r) => [r.first_name, r.middle_name, r.last_name].filter(Boolean).join(' '),
                      sorter: (a, b) => `${a.last_name}${a.first_name}`.localeCompare(`${b.last_name}${b.first_name}`),
                    },
                    { title: 'Email',      dataIndex: 'email' },
                    { title: 'Department', dataIndex: 'department', render: (v) => v || '—' },
                    { title: 'Role',       dataIndex: 'role', render: (v) => <Tag>{v?.replace('_', ' ')}</Tag> },
                    {
                      title: 'Report',
                      width: 140,
                      render: (_, r) => resultsOut ? (
                        <Button
                          size="small"
                          type="primary"
                          icon={<EyeOutlined />}
                          onClick={() => navigate(`/reports/${cycleId}/${r.id}`)}
                        >
                          View Report
                        </Button>
                      ) : (
                        <Tooltip title="Reports will be available once results are released">
                          <Button size="small" icon={<LockOutlined />} disabled>
                            Not Released
                          </Button>
                        </Tooltip>
                      ),
                    },
                  ]}
                />
              )
            }
          </Card>
        </>
      )}
    </Space>
  );
}
