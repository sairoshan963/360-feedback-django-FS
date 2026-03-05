import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Card, Descriptions, Tag, Button, Space, Typography, Table,
  Progress, Statistic, Row, Col, message, Popconfirm, Steps, Modal, Input,
  Form, InputNumber, Select, DatePicker,
} from 'antd';
import dayjs from 'dayjs';
import {
  getCycle, getCycleProgress, getParticipants,
  activateCycle, finalizeCycle, closeCycle, releaseCycle, archiveCycle, overrideCycle,
  getAllNominations, updateCycle, approveNomination, rejectNomination,
  getParticipantStatus, downloadParticipantExcel, getNominationStatus, downloadNominationExcel,
} from '../../api/cycles';
import useAuthStore from '../../store/authStore';
import usePageTitle from '../../hooks/usePageTitle';

const { Title } = Typography;

const STATE_COLOR = {
  DRAFT:'default', NOMINATION:'processing', FINALIZED:'blue',
  ACTIVE:'green', CLOSED:'orange', RESULTS_RELEASED:'purple', ARCHIVED:'red',
};

const STATE_STEP_WITH_NOMINATION    = { DRAFT:0, NOMINATION:1, FINALIZED:2, ACTIVE:3, CLOSED:4, RESULTS_RELEASED:5, ARCHIVED:6 };
const STATE_STEP_WITHOUT_NOMINATION = { DRAFT:0, FINALIZED:1, ACTIVE:2, CLOSED:3, RESULTS_RELEASED:4, ARCHIVED:5 };

export default function CycleDetailPage() {
  usePageTitle('Cycle Details');
  const { id }   = useParams();
  const navigate = useNavigate();
  const user     = useAuthStore((s) => s.user);

  const [cycle,             setCycle]             = useState(null);
  const [progress,          setProgress]          = useState([]);
  const [participants,      setParticipants]      = useState([]);
  const [participantStatus, setParticipantStatus] = useState([]);
  const [nominationStatus,  setNominationStatus]  = useState([]);
  const [nominations,       setNominations]       = useState([]);
  const [loading,           setLoading]           = useState(false);
  const [downloading,       setDownloading]       = useState({ pending: false, done: false });
  const [downloadingNom,    setDownloadingNom]    = useState(false);
  const [overrideModal,     setOverrideModal]     = useState(false);
  const [overrideReason,    setOverrideReason]    = useState('');
  const [overrideState,     setOverrideState]     = useState('');
  const [editModal,         setEditModal]         = useState(false);
  const [participantSearch, setParticipantSearch] = useState('');
  const [statusSearch,      setStatusSearch]      = useState('');
  const [editForm]   = Form.useForm();
  const [nomActionLoading, setNomActionLoading] = useState({});
  const [rejectNote,       setRejectNote]       = useState({});

  const handleNomApprove = async (nom) => {
    setNomActionLoading((p) => ({ ...p, [nom.id]: 'approve' }));
    try {
      await approveNomination(nom.cycle_id, nom.id);
      message.success('Nomination approved');
      setNominations((prev) => prev.map((n) => n.id === nom.id ? { ...n, status: 'APPROVED' } : n));
    } catch (err) {
      message.error(err.response?.data?.message || 'Failed to approve');
    } finally {
      setNomActionLoading((p) => ({ ...p, [nom.id]: null }));
    }
  };

  const handleNomReject = async (nom) => {
    setNomActionLoading((p) => ({ ...p, [nom.id]: 'reject' }));
    try {
      await rejectNomination(nom.cycle_id, nom.id, rejectNote[nom.id] || '');
      message.success('Nomination rejected');
      setNominations((prev) => prev.map((n) => n.id === nom.id ? { ...n, status: 'REJECTED' } : n));
    } catch (err) {
      message.error(err.response?.data?.message || 'Failed to reject');
    } finally {
      setNomActionLoading((p) => ({ ...p, [nom.id]: null }));
    }
  };

  const load = async () => {
    setLoading(true);
    try {
      const [cRes, pRes, parRes] = await Promise.all([getCycle(id), getCycleProgress(id), getParticipants(id)]);
      const cycleData = cRes.data.cycle;
      setCycle(cycleData);
      setProgress(pRes.data.progress || []);
      setParticipants(parRes.data.participants || []);

      if (['SUPER_ADMIN','HR_ADMIN'].includes(user?.role) && cycleData.peer_enabled && cycleData.state === 'NOMINATION') {
        try { const r = await getNominationStatus(id); setNominationStatus(r.data.participants || []); } catch {}
      } else { setNominationStatus([]); }

      if (['SUPER_ADMIN','HR_ADMIN'].includes(user?.role) && !['DRAFT','NOMINATION','FINALIZED'].includes(cycleData.state)) {
        try { const r = await getParticipantStatus(id); setParticipantStatus(r.data.participants || []); } catch {}
      }

      if (['SUPER_ADMIN','HR_ADMIN'].includes(user?.role)) {
        const NOMINATION_STATES = ['NOMINATION','FINALIZED','ACTIVE','CLOSED','RESULTS_RELEASED','ARCHIVED'];
        if (NOMINATION_STATES.includes(cycleData.state)) {
          try { const r = await getAllNominations(id); setNominations(r.data.nominations || []); } catch {}
        }
      }
    } catch { message.error('Failed to load cycle'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [id]);

  const transition = async (fn, label) => {
    try { await fn(id); message.success(`${label} successful`); load(); }
    catch (err) { message.error(err.response?.data?.message || `${label} failed`); }
  };

  const handleOverride = async () => {
    if (!overrideReason.trim()) { message.error('Reason required'); return; }
    try {
      await overrideCycle(id, { target_state: overrideState, reason: overrideReason });
      message.success('Override applied');
      setOverrideModal(false);
      load();
    } catch (err) { message.error(err.response?.data?.message || 'Override failed'); }
  };

  const openEditModal = () => {
    editForm.setFieldsValue({
      name:                cycle.name,
      review_deadline:     cycle.review_deadline ? dayjs(cycle.review_deadline) : null,
      nomination_deadline: cycle.nomination_deadline ? dayjs(cycle.nomination_deadline) : null,
      peer_min_count:      cycle.peer_min_count,
      peer_max_count:      cycle.peer_max_count,
      peer_threshold:      cycle.peer_threshold ?? 3,
      quarter:             cycle.quarter || undefined,
      quarter_year:        cycle.quarter_year || undefined,
    });
    setEditModal(true);
  };

  const handleEditSave = async () => {
    try {
      const values = await editForm.validateFields();
      if (values.review_deadline) values.review_deadline = values.review_deadline.toISOString();
      if (values.nomination_deadline) values.nomination_deadline = values.nomination_deadline.toISOString();
      else delete values.nomination_deadline;
      await updateCycle(id, values);
      message.success('Cycle updated');
      setEditModal(false);
      load();
    } catch (err) {
      if (err?.errorFields) return;
      message.error(err.response?.data?.message || 'Update failed');
    }
  };

  const handleDownloadNominations = async () => {
    setDownloadingNom(true);
    try {
      const res = await downloadNominationExcel(id);
      const url = window.URL.createObjectURL(new Blob([res.data]));
      Object.assign(document.createElement('a'), { href: url, download: `nominations-${cycle.name.replace(/\s+/g,'_')}.xlsx` }).click();
      window.URL.revokeObjectURL(url);
    } catch { message.error('Failed to download'); }
    finally { setDownloadingNom(false); }
  };

  const handleDownload = async (type) => {
    setDownloading((d) => ({ ...d, [type]: true }));
    try {
      const res = await downloadParticipantExcel(id, type);
      const label = type === 'done' ? 'completed' : 'pending';
      const url = window.URL.createObjectURL(new Blob([res.data]));
      Object.assign(document.createElement('a'), { href: url, download: `${label}-${cycle.name.replace(/\s+/g,'_')}.xlsx` }).click();
      window.URL.revokeObjectURL(url);
    } catch { message.error('Failed to download'); }
    finally { setDownloading((d) => ({ ...d, [type]: false })); }
  };

  if (!cycle) return null;

  const totalTasks     = progress.reduce((s, r) => s + parseInt(r.total, 10), 0);
  const submittedTasks = progress.reduce((s, r) => s + parseInt(r.submitted, 10) + parseInt(r.locked, 10), 0);
  const pct            = totalTasks ? Math.round((submittedTasks / totalTasks) * 100) : 0;

  const progressCols = [
    { title: 'Reviewer Type', dataIndex: 'reviewer_type' },
    { title: 'Total',     dataIndex: 'total',     width: 80 },
    { title: 'Submitted', dataIndex: 'submitted', width: 90, render: (v) => <Tag color={parseInt(v,10)>0?'success':'default'}>{v}</Tag> },
    { title: 'Locked',    dataIndex: 'locked',    width: 80, render: (v) => <Tag color={parseInt(v,10)>0?'warning':'default'}>{v}</Tag> },
    { title: 'Pending',   width: 80, render: (_, r) => { const p = parseInt(r.total,10)-parseInt(r.submitted,10)-parseInt(r.locked,10); return <Tag color={p>0?'error':'default'}>{p}</Tag>; } },
  ];

  return (
    <Space direction="vertical" size={16} style={{ width: '100%' }}>
      <Card loading={loading}>
        <Space style={{ width: '100%', justifyContent: 'space-between' }}>
          <div>
            <Title level={4} style={{ margin: 0 }}>{cycle.name}</Title>
            <Tag color={STATE_COLOR[cycle.state]} style={{ marginTop: 4 }}>{cycle.state.replace('_', ' ')}</Tag>
          </div>
          <Space wrap>
            {cycle.state === 'DRAFT' && <Button onClick={openEditModal}>Edit</Button>}
            {cycle.state === 'DRAFT' && (
              <Popconfirm title="Activate this cycle?" onConfirm={() => transition(activateCycle, 'Activate')}>
                <Button type="primary">Activate</Button>
              </Popconfirm>
            )}
            {cycle.state === 'NOMINATION' && (
              nominations.some((n) => n.status === 'PENDING') ? (
                <Button type="primary" disabled>Finalize (pending nominations)</Button>
              ) : (
                <Popconfirm title="Finalize and start collecting feedback?" onConfirm={() => transition(finalizeCycle, 'Finalize')}>
                  <Button type="primary">Finalize</Button>
                </Popconfirm>
              )
            )}
            {cycle.state === 'ACTIVE' && (
              <Popconfirm title="Close this cycle?" onConfirm={() => transition(closeCycle, 'Close')}>
                <Button danger>Close Cycle</Button>
              </Popconfirm>
            )}
            {cycle.state === 'CLOSED' && (
              <Popconfirm title="Release results to participants?" onConfirm={() => transition(releaseCycle, 'Release')}>
                <Button type="primary">Release Results</Button>
              </Popconfirm>
            )}
            {cycle.state === 'RESULTS_RELEASED' && (
              <Popconfirm title="Archive this cycle?" onConfirm={() => transition(archiveCycle, 'Archive')}>
                <Button>Archive</Button>
              </Popconfirm>
            )}
            {user?.role === 'SUPER_ADMIN' && <Button danger onClick={() => setOverrideModal(true)}>Override State</Button>}
          </Space>
        </Space>

        {(() => {
          const hasPeer    = cycle.peer_enabled;
          const stepMap    = hasPeer ? STATE_STEP_WITH_NOMINATION : STATE_STEP_WITHOUT_NOMINATION;
          const stepLabels = hasPeer
            ? ['DRAFT','NOMINATION','FINALIZED','ACTIVE','CLOSED','RELEASED','ARCHIVED']
            : ['DRAFT','FINALIZED','ACTIVE','CLOSED','RELEASED','ARCHIVED'];
          return (
            <Steps current={stepMap[cycle.state] ?? 0} size="small" style={{ marginTop: 24 }}
              items={stepLabels.map((s) => ({ title: s }))} />
          );
        })()}
      </Card>

      <Row gutter={16}>
        <Col span={6}><Card><Statistic title="Participants" value={participants.length} /></Card></Col>
        <Col span={6}><Card><Statistic title="Total Tasks"  value={totalTasks} /></Card></Col>
        <Col span={6}><Card><Statistic title="Submitted"    value={submittedTasks} /></Card></Col>
        <Col span={6}>
          <Card><div style={{ textAlign: 'center' }}>
            <div style={{ color: '#666', marginBottom: 4 }}>Completion</div>
            <Progress type="circle" percent={pct} size={80} />
          </div></Card>
        </Col>
      </Row>

      <Card title="Cycle Details">
        <Descriptions column={2} size="small">
          {cycle.quarter && <Descriptions.Item label="Quarter"><Tag color="blue">{cycle.quarter} {cycle.quarter_year}</Tag></Descriptions.Item>}
          <Descriptions.Item label="Template">{cycle.template_name}</Descriptions.Item>
          <Descriptions.Item label="Peer Enabled">{cycle.peer_enabled ? 'Yes' : 'No'}</Descriptions.Item>
          {cycle.peer_enabled && <>
            <Descriptions.Item label="Peer Min">{cycle.peer_min_count}</Descriptions.Item>
            <Descriptions.Item label="Peer Max">{cycle.peer_max_count}</Descriptions.Item>
          </>}
          {cycle.nomination_deadline && <Descriptions.Item label="Nomination Deadline">{new Date(cycle.nomination_deadline).toLocaleString()}</Descriptions.Item>}
          <Descriptions.Item label="Review Deadline">{new Date(cycle.review_deadline).toLocaleString()}</Descriptions.Item>
        </Descriptions>
      </Card>

      {progress.length > 0 && (
        <Card title="Submission Progress by Reviewer Type">
          <Table rowKey="reviewer_type" columns={progressCols} dataSource={progress} pagination={false} size="small" />
        </Card>
      )}

      {nominationStatus.length > 0 && (() => {
        const notStarted = nominationStatus.filter((p) => p.status === 'NOT_STARTED').length;
        const done       = nominationStatus.filter((p) => p.status === 'DONE').length;
        return (
          <Card title="Nomination Status by Person" extra={
            <Space>
              <Tag color="success">{done} Done</Tag>
              {notStarted > 0 && <Tag color="error">{notStarted} Not Started</Tag>}
              <Button loading={downloadingNom} onClick={handleDownloadNominations}>Download Excel</Button>
            </Space>
          }>
            <Table rowKey="user_id" size="small" pagination={{ pageSize: 15 }} dataSource={nominationStatus}
              columns={[
                { title: 'Name',     render: (_, r) => `${r.first_name} ${r.last_name}` },
                { title: 'Email',    dataIndex: 'email' },
                { title: 'Dept',     dataIndex: 'department', render: (v) => v || '—' },
                { title: 'Nominated', dataIndex: 'nominated', width: 90, render: (v, r) => `${v} / ${r.min_required}` },
                { title: 'Approved', dataIndex: 'approved',  width: 85, render: (v) => <Tag color={parseInt(v,10)>0?'success':'default'}>{v}</Tag> },
                { title: 'Status',   dataIndex: 'status',   width: 120, render: (v) => {
                  if (v === 'DONE')       return <Tag color="success">Done</Tag>;
                  if (v === 'INCOMPLETE') return <Tag color="warning">Incomplete</Tag>;
                  return <Tag color="error">Not Started</Tag>;
                }},
              ]}
            />
          </Card>
        );
      })()}

      {participantStatus.length > 0 && (
        <Card title="Submission Status by Person" extra={
          <Space>
            <Button danger loading={downloading.pending} onClick={() => handleDownload('pending')}>Download Pending</Button>
            <Button style={{ color: '#52c41a', borderColor: '#52c41a' }} loading={downloading.done} onClick={() => handleDownload('done')}>Download Completed</Button>
          </Space>
        }>
          <Input.Search placeholder="Search…" value={statusSearch} onChange={(e) => setStatusSearch(e.target.value)} allowClear style={{ marginBottom: 12, maxWidth: 320 }} />
          <Table rowKey="user_id" size="small" pagination={{ pageSize: 15 }}
            dataSource={participantStatus.filter((p) => !statusSearch || `${p.first_name} ${p.last_name} ${p.email}`.toLowerCase().includes(statusSearch.toLowerCase()))}
            columns={[
              { title: 'Name',      render: (_, r) => `${r.first_name} ${r.last_name}` },
              { title: 'Email',     dataIndex: 'email' },
              { title: 'Dept',      dataIndex: 'department', render: (v) => v || '—' },
              { title: 'Submitted', dataIndex: 'submitted', width: 85, render: (v) => <Tag color={parseInt(v,10)>0?'success':'default'}>{v}</Tag> },
              { title: 'Status',    dataIndex: 'overall', width: 130, render: (v) => {
                if (v==='COMPLETED') return <Tag color="success">Completed</Tag>;
                if (v==='PARTIAL')   return <Tag color="warning">Partial</Tag>;
                if (v==='MISSED')    return <Tag color="error">Missed</Tag>;
                return <Tag color="processing">Pending</Tag>;
              }},
            ]}
          />
        </Card>
      )}

      {/* Participants */}
      <Card title={`Participants (${participants.length})`}>
        <Input.Search placeholder="Search by name or email…" value={participantSearch} onChange={(e) => setParticipantSearch(e.target.value)} allowClear style={{ marginBottom: 12, maxWidth: 320 }} />
        <Table rowKey="id" size="small" pagination={{ pageSize: 10 }}
          dataSource={participantSearch ? participants.filter((p) => `${p.first_name} ${p.last_name} ${p.email}`.toLowerCase().includes(participantSearch.toLowerCase())) : participants}
          columns={[
            { title: 'Name',  render: (_, r) => `${r.first_name} ${r.last_name}` },
            { title: 'Email', dataIndex: 'email' },
            { title: 'Dept',  dataIndex: 'department', render: (v) => v || '—' },
            { title: 'Report', render: (_, r) => ['RESULTS_RELEASED','ARCHIVED'].includes(cycle.state)
              ? <Button size="small" type="link" onClick={() => navigate(`/reports/${cycle.id}/${r.id}`)}>View</Button> : null },
          ]}
        />
      </Card>

      {/* Nominations */}
      {nominations.length > 0 && (() => {
        const pending  = nominations.filter((n) => n.status === 'PENDING');
        const resolved = nominations.filter((n) => n.status !== 'PENDING');
        return (
          <>
            {pending.length > 0 && user?.role === 'SUPER_ADMIN' && (
              <Card title={`Escalated Nominations — Awaiting Approval (${pending.length})`}>
                <Table rowKey="id" size="small" pagination={false} dataSource={pending}
                  columns={[
                    { title: 'Reviewee',       render: (_, r) => `${r.reviewee_first} ${r.reviewee_last}` },
                    { title: 'Nominated Peer', render: (_, r) => `${r.peer_first} ${r.peer_last}` },
                    { title: 'Action', render: (_, r) => (
                      <Space size="small">
                        <Button type="primary" size="small" loading={nomActionLoading[r.id]==='approve'} onClick={() => handleNomApprove(r)}>Approve</Button>
                        <Popconfirm title="Reject nomination?" onConfirm={() => handleNomReject(r)} okText="Reject" okButtonProps={{ danger: true }}>
                          <Button size="small" danger>Reject</Button>
                        </Popconfirm>
                      </Space>
                    )},
                  ]}
                />
              </Card>
            )}
            {resolved.length > 0 && (
              <Card title={`All Peer Nominations (${resolved.length})`}>
                <Table rowKey="id" size="small" pagination={{ pageSize: 10 }} dataSource={resolved}
                  columns={[
                    { title: 'Reviewee',       render: (_, r) => `${r.reviewee_first} ${r.reviewee_last}` },
                    { title: 'Nominated Peer', render: (_, r) => `${r.peer_first} ${r.peer_last}` },
                    { title: 'Status', dataIndex: 'status', render: (v) => <Tag color={v==='APPROVED'?'green':'red'}>{v}</Tag> },
                  ]}
                />
              </Card>
            )}
          </>
        );
      })()}

      {/* Override Modal */}
      <Modal title="Override Cycle State (Super Admin)" open={overrideModal} onOk={handleOverride} onCancel={() => setOverrideModal(false)} okText="Apply Override" okButtonProps={{ danger: true }}>
        <Space direction="vertical" style={{ width: '100%' }}>
          <div>Target State:</div>
          <Select style={{ width: '100%' }} placeholder="— select state —" value={overrideState || undefined} onChange={setOverrideState}
            options={['DRAFT','NOMINATION','ACTIVE','CLOSED','RESULTS_RELEASED','ARCHIVED'].map((s) => ({ value: s, label: s }))} />
          <div>Reason (required):</div>
          <Input.TextArea rows={3} value={overrideReason} onChange={(e) => setOverrideReason(e.target.value)} placeholder="Explain why this override is needed..." />
        </Space>
      </Modal>

      {/* Edit Modal */}
      <Modal title="Edit Cycle" open={editModal} onOk={handleEditSave} onCancel={() => setEditModal(false)} okText="Save Changes">
        <Form form={editForm} layout="vertical">
          <Form.Item name="name" label="Cycle Name" rules={[{ required: true }]}><Input /></Form.Item>
          <Space wrap>
            <Form.Item name="quarter" label="Quarter">
              <Select style={{ width: 120 }} placeholder="None" allowClear options={['Q1','Q2','Q3','Q4'].map((v) => ({ value: v, label: v }))} />
            </Form.Item>
            <Form.Item name="quarter_year" label="Year">
              <InputNumber placeholder="2025" min={2020} max={2035} style={{ width: 120 }} />
            </Form.Item>
          </Space>
          <Form.Item name="review_deadline" label="Review Deadline" rules={[{ required: true }]}>
            <DatePicker showTime style={{ width: '100%' }} />
          </Form.Item>
          {cycle?.peer_enabled && (
            <>
              <Form.Item name="nomination_deadline" label="Nomination Deadline (optional)">
                <DatePicker showTime style={{ width: '100%' }} />
              </Form.Item>
              <Space style={{ width: '100%' }}>
                <Form.Item name="peer_min_count" label="Min Peers" style={{ flex: 1 }}><InputNumber min={1} style={{ width: '100%' }} /></Form.Item>
                <Form.Item name="peer_max_count" label="Max Peers" style={{ flex: 1 }}><InputNumber min={1} style={{ width: '100%' }} /></Form.Item>
                <Form.Item name="peer_threshold" label="Anon Threshold" style={{ flex: 1 }}><InputNumber min={1} style={{ width: '100%' }} /></Form.Item>
              </Space>
            </>
          )}
        </Form>
      </Modal>
    </Space>
  );
}
