import { useEffect, useState, useCallback } from 'react';
import {
  Card, Select, Table, Button, Typography, Space, Tag, Transfer,
  message, Skeleton, Empty, Alert, Tooltip,
} from 'antd';
import { EditOutlined, CheckCircleOutlined, ClockCircleOutlined, CloseCircleOutlined, TeamOutlined } from '@ant-design/icons';
import { getMyCycles, getParticipants, getMyNominations, submitNominations } from '../../api/cycles';
import useAuthStore from '../../store/authStore';
import usePageTitle from '../../hooks/usePageTitle';
import ErrorCard from '../../components/shared/ErrorCard';

const { Title, Text } = Typography;
const { Option } = Select;

const STATUS_CONFIG = {
  APPROVED: { color: 'success', icon: <CheckCircleOutlined />, label: 'Approved' },
  PENDING:  { color: 'warning', icon: <ClockCircleOutlined />, label: 'Pending Approval' },
  REJECTED: { color: 'error',   icon: <CloseCircleOutlined />, label: 'Rejected' },
};

export default function NominationsPage() {
  usePageTitle('My Nominations');
  const currentUser = useAuthStore((s) => s.user);

  const [cycles,      setCycles]      = useState([]);
  const [cycleId,     setCycleId]     = useState('');
  const [cycle,       setCycle]       = useState(null);
  const [nominations, setNominations] = useState([]);
  const [allUsers,    setAllUsers]    = useState([]);
  const [selected,    setSelected]    = useState([]);
  const [loading,      setLoading]      = useState(false);
  const [saving,       setSaving]       = useState(false);
  const [editing,      setEditing]      = useState(false);
  const [cyclesError,  setCyclesError]  = useState(false);
  const [cycleError,   setCycleError]   = useState(false);

  const loadCycles = useCallback(() => {
    setCyclesError(false);
    getMyCycles().then((res) => {
      const all = res.data.cycles || [];
      setCycles(all);
      const active = all.find((c) => c.state === 'NOMINATION');
      if (active) setCycleId(String(active.id));
      else if (all.length > 0) setCycleId(String(all[0].id));
    }).catch(() => setCyclesError(true));
  }, []);

  const loadCycleData = useCallback((id, allCycles) => {
    if (!id) return;
    const c = allCycles.find((c) => String(c.id) === id);
    setCycle(c || null);
    setAllUsers([]);
    setEditing(false);
    setCycleError(false);
    setLoading(true);
    Promise.all([getParticipants(id), getMyNominations(id)])
      .then(([pRes, nRes]) => {
        setAllUsers(pRes.data.participants || []);
        const noms = nRes.data.nominations || [];
        setNominations(noms);
        setSelected(noms.map((n) => String(n.peer_id)));
        if (noms.length === 0) setEditing(true);
      }).catch(() => setCycleError(true)).finally(() => setLoading(false));
  }, []);

  useEffect(() => { loadCycles(); }, [loadCycles]);

  useEffect(() => {
    if (cycleId) loadCycleData(cycleId, cycles);
  }, [cycleId, cycles, loadCycleData]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSave = async () => {
    if (!cycleId) return;
    if (selected.length < (cycle?.peer_min_count || 1)) {
      message.error(`Please nominate at least ${cycle.peer_min_count} peer(s)`);
      return;
    }
    setSaving(true);
    try {
      const nRes = await submitNominations(cycleId, selected);
      const noms = nRes.data.nominations || [];
      setNominations(noms);
      setSelected(noms.map((n) => String(n.peer_id)));
      setEditing(false);
      message.success('Nominations submitted successfully');
    } catch (err) {
      message.error(err.response?.data?.message || err.response?.data?.detail || 'Failed to save nominations');
    } finally { setSaving(false); }
  };

  const transferData = allUsers
    .filter((u) => String(u.id) !== String(currentUser?.id))
    .map((u) => ({
      key:         String(u.id),
      title:       `${u.first_name} ${u.last_name}`,
      description: `${u.email} · ${u.role?.replace('_', ' ')}`,
    }));

  const isNominationOpen = cycle?.state === 'NOMINATION';
  const isFinalized      = ['FINALIZED','ACTIVE','CLOSED','RESULTS_RELEASED','ARCHIVED'].includes(cycle?.state);
  const hasSubmitted     = nominations.length > 0;
  const approvedCount    = nominations.filter((n) => n.status === 'APPROVED').length;
  const rejectedCount    = nominations.filter((n) => n.status === 'REJECTED').length;
  const pendingCount     = nominations.filter((n) => n.status === 'PENDING').length;

  const statusCols = [
    { title: 'Peer Reviewer',  render: (_, r) => <span style={{ fontWeight: 500 }}>{r.first_name} {r.last_name}</span> },
    { title: 'Email',          dataIndex: 'email', render: (v) => <Text type="secondary">{v}</Text> },
    { title: 'Approval Status', dataIndex: 'status', width: 160, render: (status) => {
      const cfg = STATUS_CONFIG[status] || { color: 'default', icon: null, label: status };
      return <Tag color={cfg.color} icon={cfg.icon}>{cfg.label}</Tag>;
    }},
    { title: 'Note', dataIndex: 'rejection_note', render: (note, r) =>
      r.status === 'REJECTED' && note
        ? <Tooltip title={note}><Text type="danger" style={{ cursor: 'help' }}>"{note}"</Text></Tooltip>
        : '—',
    },
  ];

  return (
    <Space direction="vertical" size={16} style={{ width: '100%' }}>
      <Card>
        <Space style={{ width: '100%', justifyContent: 'space-between' }}>
          <Title level={4} style={{ margin: 0 }}>Peer Nominations</Title>
          <Select style={{ width: 320 }} placeholder="Search or select a cycle…" value={cycleId || undefined} onChange={(v) => setCycleId(v)} showSearch optionFilterProp="children" filterOption={(input, option) => option?.children?.toLowerCase().includes(input.toLowerCase())}>
            {cycles.map((c) => <Option key={c.id} value={String(c.id)}>{c.name}</Option>)}
          </Select>
        </Space>
      </Card>

      {cyclesError && <ErrorCard message="Could not load your cycles. Please try again." onRetry={loadCycles} />}

      {!cyclesError && !cycleId && cycles.length === 0 && (
        <Card style={{ textAlign: 'center', padding: '40px 0' }}>
          <Empty image={<TeamOutlined style={{ fontSize: 52, color: '#cbd5e1' }} />} imageStyle={{ height: 60 }}
            description={<Space direction="vertical" size={2}><Text strong>No active cycles</Text><Text type="secondary">You have not been added to any review cycle yet.</Text></Space>} />
        </Card>
      )}

      {!cyclesError && !cycleId && cycles.length > 0 && (
        <Card><Empty description="Select a cycle to manage your peer nominations" /></Card>
      )}

      {cycleId && loading && <Card><Skeleton active paragraph={{ rows: 6 }} /></Card>}

      {cycleId && !loading && cycleError && <ErrorCard message="Could not load nomination data for this cycle." onRetry={() => loadCycleData(cycleId, cycles)} />}

      {cycle && !loading && !cycleError && (
        <>
          <Card size="small">
            <Space wrap>
              <Text type="secondary">Cycle State:</Text>
              <Tag color={isNominationOpen ? 'processing' : 'default'}>{cycle.state.replace('_', ' ')}</Tag>
              {cycle.peer_min_count && (
                <Text type="secondary">Min peers: <Text strong>{cycle.peer_min_count}</Text> · Max: <Text strong>{cycle.peer_max_count}</Text></Text>
              )}
              {hasSubmitted && isNominationOpen && (
                <Space size={4}>
                  <Tag color="success">{approvedCount} Approved</Tag>
                  {pendingCount > 0 && <Tag color="warning">{pendingCount} Pending</Tag>}
                  {rejectedCount > 0 && <Tag color="error">{rejectedCount} Rejected</Tag>}
                </Space>
              )}
            </Space>
          </Card>

          {isNominationOpen && (
            <>
              {rejectedCount > 0 && approvedCount + pendingCount < cycle.peer_min_count && (
                <Alert type="warning" showIcon message="Action Required"
                  description={`${rejectedCount} nomination(s) were rejected and you now have fewer than the required minimum of ${cycle.peer_min_count} peers. Please edit your nominations and add replacements.`} />
              )}

              {hasSubmitted && !editing && (
                <Card title="My Nominated Peers" extra={<Button icon={<EditOutlined />} onClick={() => setEditing(true)}>Edit Nominations</Button>}>
                  <Text type="secondary" style={{ display: 'block', marginBottom: 12 }}>Your nominations are submitted. The status updates as your manager reviews them.</Text>
                  <Table rowKey="peer_id" size="small" pagination={false} dataSource={nominations} columns={statusCols} />
                </Card>
              )}

              {(!hasSubmitted || editing) && (
                <Card title={editing && hasSubmitted ? 'Edit Peer Nominations' : 'Select Peer Reviewers'}
                  extra={<Space>
                    {editing && hasSubmitted && (<Button onClick={() => { setEditing(false); setSelected(nominations.map((n) => String(n.peer_id))); }}>Cancel</Button>)}
                    <Button type="primary" loading={saving} onClick={handleSave}>{hasSubmitted ? 'Update Nominations' : 'Submit Nominations'}</Button>
                  </Space>}>
                  <Text type="secondary" style={{ display: 'block', marginBottom: 16 }}>
                    Move colleagues to the right to nominate them as peer reviewers. Min <strong>{cycle.peer_min_count}</strong>, max <strong>{cycle.peer_max_count}</strong>.
                    {selected.length >= cycle.peer_max_count && <Text type="warning"> Maximum reached — remove one to add another.</Text>}
                  </Text>
                  <Transfer dataSource={transferData} showSearch
                    filterOption={(val, item) => item.title.toLowerCase().includes(val.toLowerCase()) || item.description.toLowerCase().includes(val.toLowerCase())}
                    targetKeys={selected}
                    onChange={(nextKeys) => { if (nextKeys.length <= cycle.peer_max_count) setSelected(nextKeys); else message.warning(`Maximum ${cycle.peer_max_count} peers allowed`); }}
                    render={(item) => <div><div>{item.title}</div><div style={{ fontSize: 11, color: '#999' }}>{item.description}</div></div>}
                    listStyle={{ width: '45%', height: 440 }}
                    style={{ width: '100%' }}
                    titles={['All Employees', `My Nominees (${selected.length}/${cycle.peer_max_count})`]} />
                </Card>
              )}
            </>
          )}

          {isFinalized && (
            <Card title={`My Peer Reviewers (${approvedCount} approved)`}>
              {nominations.length > 0 ? (
                <Table rowKey="peer_id" size="small" pagination={false} dataSource={nominations} columns={statusCols} />
              ) : (
                <Empty description="No nominations were submitted for this cycle" />
              )}
            </Card>
          )}

          {!isNominationOpen && !isFinalized && (
            <Card><Empty description={`Nominations are not open yet (cycle is in ${cycle.state} state)`} /></Card>
          )}
        </>
      )}
    </Space>
  );
}
