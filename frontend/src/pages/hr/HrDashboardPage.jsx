import { useEffect, useState } from 'react';
import {
  Card, Row, Col, Select, Statistic, Table, Typography, Space,
  Progress, Empty, message, Tag,
} from 'antd';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, LabelList } from 'recharts';
import { listCycles } from '../../api/cycles';
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
  const [cycles,  setCycles]  = useState([]);
  const [cycleId, setCycleId] = useState('');
  const [dash,    setDash]    = useState(null);
  const [loading, setLoading] = useState(false);

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
    getHrDashboard(cycleId).then((r) => setDash(r.data.dashboard)).catch(() => message.error('Failed to load dashboard')).finally(() => setLoading(false));
  }, [cycleId]);

  const submissionCols = [
    { title: 'Reviewer Type', dataIndex: 'reviewer_type' },
    { title: 'Total',         dataIndex: 'total' },
    { title: 'Submitted',     dataIndex: 'submitted' },
    { title: 'Pending',       dataIndex: 'pending' },
    { title: 'Completion',    render: (_, r) => { const pct = r.total ? Math.round((r.submitted / r.total) * 100) : 0; return <Progress percent={pct} size="small" />; } },
  ];

  const deptScoreData = (dash?.department_scores || []).map((d) => ({ name: d.department || 'Unknown', avg: parseFloat(d.avg_overall || 0).toFixed(2) }));
  const currentCycle = cycles.find((c) => String(c.id) === cycleId);

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
                  <Tooltip content={<DeptTooltip />} cursor={{ fill: 'rgba(99,102,241,0.07)' }} />
                  <ReferenceLine y={3} stroke="#c4b5fd" strokeDasharray="5 4" label={{ value: 'Mid (3.0)', position: 'insideTopRight', fontSize: 11, fill: '#a78bfa' }} />
                  <Bar dataKey="avg" name="Avg Score" fill="url(#deptGrad)" radius={[8, 8, 0, 0]}>
                    <LabelList dataKey="avg" position="top" style={{ fontSize: 12, fill: '#4f46e5', fontWeight: 700 }} />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : <Empty description="Department scores available after cycle closes" />}
          </Card>
        </>
      )}
    </Space>
  );
}
