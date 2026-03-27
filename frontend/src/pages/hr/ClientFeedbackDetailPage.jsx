import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Card, Avatar, Tag, Typography, Space, Button, Spin,
  Rate, Divider, Empty, Descriptions,
} from 'antd';
import {
  ArrowLeftOutlined, UserOutlined, TeamOutlined,
  StarOutlined, EyeOutlined, EyeInvisibleOutlined,
  CheckCircleOutlined, PrinterOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { getClientFeedbackRequest } from '../../api/clientFeedback';
import usePageTitle from '../../hooks/usePageTitle';

const { Title, Text } = Typography;

const STATUS_COLOR = { PENDING: 'processing', SUBMITTED: 'success', EXPIRED: 'default' };
const AV_COLORS   = ['#1677ff', '#52c41a', '#fa8c16', '#eb2f96', '#722ed1', '#13c2c2'];
const avatarColor = (i) => AV_COLORS[i % AV_COLORS.length];
const displayName = (e) => e.display_name || `${e.first_name} ${e.last_name}`;
const initials    = (e) => {
  if (e.display_name) return e.display_name.slice(0, 2).toUpperCase();
  return `${(e.first_name || '')[0]}${(e.last_name || '')[0]}`.toUpperCase();
};

// ── answer renderer ───────────────────────────────────────────────────────────

function AnswerValue({ ans }) {
  if (!ans) return <Text type="secondary">—</Text>;
  if (ans.question_type === 'RATING' || ans.question_type === 'RATING_WITH_TEXT') {
    return (
      <Space direction="vertical" size={4}>
        <Rate disabled value={ans.rating_value || 0} style={{ fontSize: 18 }} />
        {ans.text_value && <Text type="secondary" style={{ fontSize: 13 }}>{ans.text_value}</Text>}
      </Space>
    );
  }
  if (ans.question_type === 'NPS') {
    const v = ans.rating_value;
    const color = v <= 6 ? '#ff4d4f' : v <= 8 ? '#faad14' : '#52c41a';
    const label = v <= 6 ? 'Detractor' : v <= 8 ? 'Passive' : 'Promoter';
    return (
      <Space>
        <span style={{ fontWeight: 800, fontSize: 22, color }}>{v}</span>
        <Text type="secondary" style={{ fontSize: 13 }}>/ 10</Text>
        <Tag color={v <= 6 ? 'red' : v <= 8 ? 'orange' : 'green'} style={{ borderRadius: 20 }}>{label}</Tag>
      </Space>
    );
  }
  if (ans.question_type === 'YES_NO') {
    return (
      <Tag color={ans.yes_no_value ? 'green' : 'red'} style={{ borderRadius: 20, fontSize: 13, padding: '2px 12px' }}>
        {ans.yes_no_value ? '✓  Yes' : '✗  No'}
      </Tag>
    );
  }
  if (ans.question_type === 'TEXT') {
    return <Text style={{ fontSize: 14 }}>{ans.text_value || '—'}</Text>;
  }
  return null;
}

// ── employee report card ──────────────────────────────────────────────────────

function EmployeeReportCard({ emp, index, empAnswers }) {
  const [open, setOpen] = useState(false);

  return (
    <Card
      style={{ borderRadius: 12, border: '1px solid #ebebeb', boxShadow: '0 1px 6px rgba(0,0,0,.04)' }}
      styles={{ body: { padding: 0 } }}
    >
      {/* header row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '18px 24px' }}>
        <Avatar size={52} style={{ background: avatarColor(index), fontSize: 18, fontWeight: 700, flexShrink: 0 }}>
          {initials(emp)}
        </Avatar>
        <div style={{ flex: 1 }}>
          <Text strong style={{ fontSize: 16 }}>{displayName(emp)}</Text>
          {emp.department && (
            <Text type="secondary" style={{ fontSize: 13, display: 'block' }}>{emp.department}</Text>
          )}
        </div>
        {empAnswers.length > 0 ? (
          <Button
            type={open ? 'default' : 'primary'}
            icon={open ? <EyeInvisibleOutlined /> : <EyeOutlined />}
            onClick={() => setOpen((o) => !o)}
            style={{ borderRadius: 8 }}
          >
            {open ? 'Hide Report' : 'View Report'}
          </Button>
        ) : (
          <Tag color="default" style={{ borderRadius: 20 }}>No responses yet</Tag>
        )}
      </div>

      {/* expanded answers */}
      {open && empAnswers.length > 0 && (
        <>
          <Divider style={{ margin: 0 }} />
          <div style={{ padding: '20px 24px', background: '#fafafa', borderRadius: '0 0 12px 12px' }}>
            <Space direction="vertical" style={{ width: '100%' }} size={16}>
              {empAnswers.map((a, i) => (
                <div key={i}>
                  <Text type="secondary" style={{ fontSize: 12, display: 'block', marginBottom: 6 }}>
                    {a.question_text}
                  </Text>
                  <AnswerValue ans={a} />
                  {i < empAnswers.length - 1 && <Divider style={{ margin: '16px 0 0' }} />}
                </div>
              ))}
            </Space>
          </div>
        </>
      )}
    </Card>
  );
}

// ── main page ─────────────────────────────────────────────────────────────────

export default function ClientFeedbackDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [req,     setReq]     = useState(null);
  const [loading, setLoading] = useState(true);
  usePageTitle('Feedback Report');

  useEffect(() => {
    getClientFeedbackRequest(id)
      .then((r) => setReq(r.data.request))
      .catch(() => navigate('/hr/client-feedback'))
      .finally(() => setLoading(false));
  }, [id, navigate]);

  if (loading) return (
    <div style={{ textAlign: 'center', padding: 64 }}><Spin size="large" /></div>
  );

  if (!req) return null;

  const perEmployee = req.answers?.filter((a) => a.applies_to === 'EACH_EMPLOYEE') || [];
  const teamOverall = req.answers?.filter((a) => a.applies_to === 'TEAM_OVERALL')  || [];

  return (
    <Space direction="vertical" size={16} style={{ width: '100%' }}>

      {/* ── top bar ── */}
      <Card styles={{ body: { padding: '16px 24px' } }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <Space align="center">
            <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/hr/client-feedback')}>
              Back
            </Button>
            <StarOutlined style={{ color: '#faad14', fontSize: 18 }} />
            <Title level={4} style={{ margin: 0 }}>Feedback Report</Title>
          </Space>
          <Space>
            {req.status === 'SUBMITTED' && (
              <Button icon={<PrinterOutlined />} onClick={() => window.print()}>Export PDF</Button>
            )}
            <Tag color={STATUS_COLOR[req.status]} style={{ fontSize: 13, padding: '3px 14px', borderRadius: 20 }}>
              {req.status}
            </Tag>
          </Space>
        </div>
      </Card>

      {/* ── request info ── */}
      <Card style={{ borderRadius: 12 }}>
        <Descriptions column={{ xs: 1, sm: 2, md: 3 }} size="small">
          <Descriptions.Item label="Project">
            <Text strong>{req.project_name}</Text>
          </Descriptions.Item>
          <Descriptions.Item label="Client">
            {req.client_name}
            <Text type="secondary" style={{ fontSize: 12, marginLeft: 6 }}>({req.client_email})</Text>
          </Descriptions.Item>
          <Descriptions.Item label="Template">
            <Tag color="blue">{req.template_name}</Tag>
          </Descriptions.Item>
          <Descriptions.Item label="Team Size">
            {req.employees?.length || 0} member{req.employees?.length !== 1 ? 's' : ''}
          </Descriptions.Item>
          <Descriptions.Item label="Submitted">
            {req.submitted_at ? dayjs(req.submitted_at).format('DD MMM YYYY, HH:mm') : '—'}
          </Descriptions.Item>
          <Descriptions.Item label="Expires">
            {dayjs(req.expires_at).format('DD MMM YYYY')}
          </Descriptions.Item>
        </Descriptions>
      </Card>

      {/* ── pending / expired state ── */}
      {req.status !== 'SUBMITTED' && (
        <Card style={{ borderRadius: 12, textAlign: 'center' }}>
          <Empty
            description={
              req.status === 'PENDING'
                ? 'The client has not submitted feedback yet.'
                : 'This feedback request has expired without a response.'
            }
          />
        </Card>
      )}

      {/* ── submitted: employee reports ── */}
      {req.status === 'SUBMITTED' && (
        <>
          {/* section label */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <UserOutlined style={{ color: '#1677ff' }} />
            <Text strong style={{ fontSize: 15 }}>Individual Feedback</Text>
            <Text type="secondary" style={{ fontSize: 13 }}>
              — click "View Report" to see each person's responses
            </Text>
          </div>

          {/* employee cards */}
          <Space direction="vertical" style={{ width: '100%' }} size={12}>
            {(req.employees || []).map((emp, i) => {
              const empAnswers = perEmployee.filter((a) => a.employee_name === displayName(emp));
              return (
                <EmployeeReportCard key={emp.id} emp={emp} index={i} empAnswers={empAnswers} />
              );
            })}
          </Space>

          {/* team overall */}
          {teamOverall.length > 0 && (
            <>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 8 }}>
                <TeamOutlined style={{ color: '#1677ff' }} />
                <Text strong style={{ fontSize: 15 }}>Team Overall</Text>
              </div>
              <Card style={{ borderRadius: 12, border: '1px solid #ebebeb', boxShadow: '0 1px 6px rgba(0,0,0,.04)' }}>
                <Space direction="vertical" style={{ width: '100%' }} size={16}>
                  {teamOverall.map((a, i) => (
                    <div key={i}>
                      <Text type="secondary" style={{ fontSize: 12, display: 'block', marginBottom: 6 }}>
                        {a.question_text}
                      </Text>
                      <AnswerValue ans={a} />
                      {i < teamOverall.length - 1 && <Divider style={{ margin: '16px 0 0' }} />}
                    </div>
                  ))}
                </Space>
              </Card>
            </>
          )}

          {/* submitted note */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'center', padding: '8px 0' }}>
            <CheckCircleOutlined style={{ color: '#52c41a' }} />
            <Text type="secondary" style={{ fontSize: 13 }}>
              Submitted by {req.client_name} on {dayjs(req.submitted_at).format('DD MMM YYYY [at] HH:mm')}
            </Text>
          </div>
        </>
      )}
    </Space>
  );
}
