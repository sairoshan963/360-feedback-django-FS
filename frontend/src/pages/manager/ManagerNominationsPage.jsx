import { useEffect, useState, useCallback } from 'react';
import {
  Card, Select, Table, Button, Tag, Typography, Space, Input,
  message, Skeleton, Empty, Popconfirm,
} from 'antd';
import { CheckOutlined, CloseOutlined } from '@ant-design/icons';
import { listCycles, getPendingApprovals, approveNomination, rejectNomination } from '../../api/cycles';
import usePageTitle from '../../hooks/usePageTitle';

const { Title, Text } = Typography;
const { Option } = Select;

export default function ManagerNominationsPage() {
  usePageTitle('Nomination Approvals');

  const [cycles,       setCycles]       = useState([]);
  const [cycleId,      setCycleId]      = useState('');
  const [nominations,  setNominations]  = useState([]);
  const [loading,      setLoading]      = useState(false);
  const [actionLoading, setActionLoading] = useState({});
  const [rejectNote,   setRejectNote]   = useState({});
  const [search,       setSearch]       = useState('');

  useEffect(() => {
    listCycles().then((r) => {
      const active = (r.data.cycles || []).filter((c) =>
        ['NOMINATION', 'FINALIZED', 'ACTIVE'].includes(c.state)
      );
      setCycles(active);
      const nom = active.find((c) => c.state === 'NOMINATION');
      if (nom) setCycleId(String(nom.id));
      else if (active.length > 0) setCycleId(String(active[0].id));
    }).catch(() => message.error('Failed to load cycles'));
  }, []);

  const loadNominations = useCallback(() => {
    if (!cycleId) return;
    setLoading(true);
    getPendingApprovals(cycleId)
      .then((r) => setNominations(r.data.nominations || []))
      .catch(() => message.error('Failed to load nominations'))
      .finally(() => setLoading(false));
  }, [cycleId]);

  useEffect(() => { loadNominations(); }, [loadNominations]);

  const handleApprove = async (nom) => {
    setActionLoading((p) => ({ ...p, [nom.id]: 'approve' }));
    try {
      await approveNomination(nom.cycle_id, nom.id);
      message.success('Nomination approved');
      setNominations((prev) => prev.filter((n) => n.id !== nom.id));
    } catch (err) {
      message.error(err.response?.data?.message || 'Failed to approve');
    } finally {
      setActionLoading((p) => ({ ...p, [nom.id]: null }));
    }
  };

  const handleReject = async (nom) => {
    setActionLoading((p) => ({ ...p, [nom.id]: 'reject' }));
    try {
      await rejectNomination(nom.cycle_id, nom.id, rejectNote[nom.id] || '');
      message.success('Nomination rejected');
      setNominations((prev) => prev.filter((n) => n.id !== nom.id));
    } catch (err) {
      message.error(err.response?.data?.message || 'Failed to reject');
    } finally {
      setActionLoading((p) => ({ ...p, [nom.id]: null }));
    }
  };

  const filtered = nominations.filter((n) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      `${n.reviewee_first} ${n.reviewee_last}`.toLowerCase().includes(q) ||
      `${n.peer_first} ${n.peer_last}`.toLowerCase().includes(q) ||
      n.peer_email?.toLowerCase().includes(q)
    );
  });

  const columns = [
    {
      title: 'Reviewee (Who nominated)',
      render: (_, r) => (
        <div>
          <div style={{ fontWeight: 500 }}>{r.reviewee_first} {r.reviewee_last}</div>
        </div>
      ),
    },
    {
      title: 'Nominated Peer',
      render: (_, r) => (
        <div>
          <div style={{ fontWeight: 500 }}>{r.peer_first} {r.peer_last}</div>
          <Text type="secondary" style={{ fontSize: 12 }}>{r.peer_email}</Text>
        </div>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      width: 110,
      render: (v) => <Tag color="warning">{v}</Tag>,
    },
    {
      title: 'Rejection Note',
      width: 220,
      render: (_, r) => (
        <Input
          size="small"
          placeholder="Optional reason for rejection…"
          value={rejectNote[r.id] || ''}
          onChange={(e) => setRejectNote((p) => ({ ...p, [r.id]: e.target.value }))}
          style={{ width: 200 }}
        />
      ),
    },
    {
      title: 'Action',
      width: 160,
      render: (_, r) => (
        <Space size="small">
          <Button
            type="primary" size="small" icon={<CheckOutlined />}
            loading={actionLoading[r.id] === 'approve'}
            onClick={() => handleApprove(r)}
          >
            Approve
          </Button>
          <Popconfirm
            title="Reject this nomination?"
            description="The employee may need to re-nominate."
            onConfirm={() => handleReject(r)}
            okText="Reject" okButtonProps={{ danger: true }}
          >
            <Button
              danger size="small" icon={<CloseOutlined />}
              loading={actionLoading[r.id] === 'reject'}
            >
              Reject
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const pendingCount  = nominations.length;
  const selectedCycle = cycles.find((c) => String(c.id) === cycleId);

  return (
    <Space direction="vertical" size={16} style={{ width: '100%' }}>
      <Card>
        <Space style={{ width: '100%', justifyContent: 'space-between' }}>
          <div>
            <Title level={4} style={{ margin: 0 }}>Nomination Approvals</Title>
            <Text type="secondary">Review and approve peer nominations from your team</Text>
          </div>
          <Select
            style={{ width: 320 }} placeholder="Select cycle" value={cycleId || undefined}
            onChange={(v) => { setCycleId(v); setSearch(''); }}
            showSearch optionFilterProp="children"
          >
            {cycles.map((c) => <Option key={c.id} value={String(c.id)}>{c.name}</Option>)}
          </Select>
        </Space>
      </Card>

      {cycleId && (
        <Card
          title={
            <Space>
              <span>Pending Nominations</span>
              {pendingCount > 0
                ? <Tag color="warning">{pendingCount} awaiting approval</Tag>
                : <Tag color="success">All approved</Tag>}
              {selectedCycle && <Tag color="processing">{selectedCycle.state}</Tag>}
            </Space>
          }
          extra={
            pendingCount > 0 && (
              <Input.Search
                placeholder="Search by name or email…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                allowClear style={{ width: 260 }}
              />
            )
          }
        >
          {loading ? (
            <Skeleton active paragraph={{ rows: 5 }} />
          ) : nominations.length === 0 ? (
            <Empty description="No pending nominations — all have been reviewed!" />
          ) : (
            <Table
              rowKey="id"
              columns={columns}
              dataSource={filtered}
              pagination={{ pageSize: 15 }}
              size="small"
            />
          )}
        </Card>
      )}

      {!cycleId && (
        <Card>
          <Empty description="No active cycles with pending nominations" />
        </Card>
      )}
    </Space>
  );
}
