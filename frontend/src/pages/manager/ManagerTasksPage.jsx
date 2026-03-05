import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Table, Tag, Button, Typography, Space, message, Popconfirm, Input } from 'antd';
import { getMyTasks } from '../../api/tasks';
import { listCycles, getPendingApprovals, approveNomination, rejectNomination } from '../../api/cycles';
import usePageTitle from '../../hooks/usePageTitle';

const { Title } = Typography;

const STATUS_COLOR = { PENDING: 'default', DRAFT: 'blue', SUBMITTED: 'green', LOCKED: 'orange' };

export default function ManagerTasksPage() {
  usePageTitle('My Tasks');
  const navigate = useNavigate();
  const [tasks,   setTasks]   = useState([]);
  const [loading, setLoading] = useState(false);
  const [approvals,        setApprovals]        = useState([]);
  const [approvalsLoading, setApprovalsLoading] = useState(false);
  const [actionLoading,    setActionLoading]    = useState({});
  const [rejectNote,       setRejectNote]       = useState({});

  const loadApprovals = useCallback(() => {
    setApprovalsLoading(true);
    listCycles().then((res) => {
      const nomCycles = (res.data.cycles || []).filter((c) => c.state === 'NOMINATION');
      return Promise.all(nomCycles.map((c) =>
        getPendingApprovals(c.id).then((r) => (r.data.nominations || []).map((n) => ({ ...n, _cycleName: c.name }))).catch(() => [])
      ));
    }).then((arrays) => setApprovals(arrays.flat())).catch(() => {}).finally(() => setApprovalsLoading(false));
  }, []);

  useEffect(() => {
    setLoading(true);
    getMyTasks().then((r) => setTasks(r.data.tasks || [])).catch(() => message.error('Failed to load tasks')).finally(() => setLoading(false));
    loadApprovals();
  }, [loadApprovals]);

  const handleApprove = async (record) => {
    setActionLoading((prev) => ({ ...prev, [record.id]: 'approve' }));
    try {
      await approveNomination(record.cycle_id, record.id);
      message.success('Nomination approved');
      setApprovals((prev) => prev.filter((n) => n.id !== record.id));
    } catch (err) { message.error(err.response?.data?.message || 'Failed to approve'); }
    finally { setActionLoading((prev) => ({ ...prev, [record.id]: null })); }
  };

  const handleReject = async (record) => {
    setActionLoading((prev) => ({ ...prev, [record.id]: 'reject' }));
    try {
      await rejectNomination(record.cycle_id, record.id, rejectNote[record.id] || '');
      message.success('Nomination rejected');
      setApprovals((prev) => prev.filter((n) => n.id !== record.id));
    } catch (err) { message.error(err.response?.data?.message || 'Failed to reject'); }
    finally { setActionLoading((prev) => ({ ...prev, [record.id]: null })); }
  };

  const columns = [
    { title: 'Reviewee',     render: (_, r) => `${r.reviewee_first} ${r.reviewee_last}` },
    { title: 'Relationship', dataIndex: 'reviewer_type', render: (v) => <Tag color="blue">{v}</Tag> },
    { title: 'Cycle',        dataIndex: 'cycle_name' },
    { title: 'Status',       dataIndex: 'status', render: (v) => <Tag color={STATUS_COLOR[v]||'default'}>{v}</Tag> },
    {
      title: 'Action',
      render: (_, r) => ['SUBMITTED','LOCKED'].includes(r.status) ? <Tag color="green">Done</Tag> : (
        <Button type="primary" size="small" onClick={() => navigate(`/employee/tasks/${r.id}`)}>
          {r.status === 'DRAFT' ? 'Continue' : 'Start Review'}
        </Button>
      ),
    },
  ];

  const approvalColumns = [
    { title: 'Reviewee',       render: (_, r) => `${r.reviewee_first} ${r.reviewee_last}` },
    { title: 'Nominated Peer', render: (_, r) => `${r.peer_first} ${r.peer_last}` },
    { title: 'Cycle',          dataIndex: '_cycleName' },
    {
      title: 'Actions',
      render: (_, r) => (
        <Space size="small">
          <Button type="primary" size="small" loading={actionLoading[r.id]==='approve'} onClick={() => handleApprove(r)}>Approve</Button>
          <Popconfirm title="Reject nomination?" description={<Input.TextArea placeholder="Optional reason" rows={2} value={rejectNote[r.id]||''} onChange={(e) => setRejectNote((p) => ({...p,[r.id]:e.target.value}))} />} onConfirm={() => handleReject(r)} okText="Reject" okButtonProps={{ danger: true }}>
            <Button size="small" danger>Reject</Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const pending   = tasks.filter((t) => ['PENDING','DRAFT'].includes(t.status));
  const completed = tasks.filter((t) => ['SUBMITTED','LOCKED'].includes(t.status));

  return (
    <Space direction="vertical" size={16} style={{ width: '100%' }}>
      <Card><Title level={4} style={{ margin: 0 }}>My Review Tasks</Title></Card>

      {(approvalsLoading || approvals.length > 0) && (
        <Card title={`Pending Peer Nominations — Awaiting Your Approval (${approvals.length})`}>
          <Table rowKey="id" loading={approvalsLoading} dataSource={approvals} columns={approvalColumns} pagination={false} size="small" />
        </Card>
      )}

      <Card title={`Pending (${pending.length})`}>
        <Table rowKey="id" columns={columns} dataSource={pending} loading={loading} pagination={{ pageSize: 10 }} size="small" />
      </Card>

      {completed.length > 0 && (
        <Card title={`Completed (${completed.length})`}>
          <Table rowKey="id" columns={columns} dataSource={completed} pagination={{ pageSize: 5 }} size="small" />
        </Card>
      )}
    </Space>
  );
}
