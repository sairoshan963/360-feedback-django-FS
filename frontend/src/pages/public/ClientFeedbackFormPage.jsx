import { useEffect, useState, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { Rate, Input, Button, Typography, Space, Avatar, Tag, Progress, Spin } from 'antd';
import {
  ArrowLeftOutlined, ArrowRightOutlined,
  CheckOutlined, SendOutlined, TeamOutlined, SafetyCertificateOutlined,
} from '@ant-design/icons';
import { getPublicForm, submitPublicForm } from '../../api/clientFeedback';

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;

// ── helpers ───────────────────────────────────────────────────────────────────

const AV_COLORS   = ['#1677ff', '#52c41a', '#fa8c16', '#eb2f96', '#722ed1', '#13c2c2'];
const avatarColor = (i) => AV_COLORS[i % AV_COLORS.length];
const displayName = (e) => e.display_name || `${e.first_name} ${e.last_name}`;
const initials    = (e) => {
  if (e.display_name) return e.display_name.slice(0, 2).toUpperCase();
  return `${(e.first_name || '')[0]}${(e.last_name || '')[0]}`.toUpperCase();
};
const STAR_LABELS = ['', 'Poor', 'Fair', 'Good', 'Very Good', 'Excellent'];
const initAns     = () => ({ rating: null, text: '', yesno: null });

function isAnswered(q, ans) {
  if (!q.is_required) return true;
  if (!ans) return false;
  if (q.type === 'RATING' || q.type === 'NPS')  return ans.rating !== null && ans.rating !== undefined;
  if (q.type === 'RATING_WITH_TEXT')             return ans.rating !== null && ans.rating !== undefined;
  if (q.type === 'YES_NO')                       return ans.yesno !== null && ans.yesno !== undefined;
  if (q.type === 'TEXT')                         return (ans.text || '').trim().length > 0;
  return true;
}

function initAnswers(form, empQuestions, teamQuestions) {
  const init = {};
  form.employees.forEach((e) => {
    init[e.id] = {};
    empQuestions.forEach((q) => { init[e.id][q.id] = initAns(); });
  });
  init.team = {};
  teamQuestions.forEach((q) => { init.team[q.id] = initAns(); });
  return init;
}

// ── widgets ───────────────────────────────────────────────────────────────────

function RatingWidget({ value, onChange }) {
  return (
    <div>
      <Rate value={value || 0} onChange={onChange} style={{ fontSize: 30, color: '#faad14' }} />
      {value > 0 && (
        <Tag color="gold" style={{ marginLeft: 10, borderRadius: 20, fontSize: 12 }}>
          {STAR_LABELS[value]}
        </Tag>
      )}
    </div>
  );
}

function RatingTextWidget({ ans, onChange }) {
  return (
    <Space direction="vertical" style={{ width: '100%' }} size={12}>
      <RatingWidget value={ans?.rating} onChange={(v) => onChange({ ...ans, rating: v })} />
      <TextArea
        value={ans?.text || ''}
        onChange={(e) => onChange({ ...ans, text: e.target.value })}
        rows={2} maxLength={500} showCount
        placeholder="Add a comment… (optional)"
        style={{ borderRadius: 8, fontSize: 14 }}
      />
    </Space>
  );
}

function YesNoWidget({ value, onChange }) {
  return (
    <Space size={12}>
      {[true, false].map((v) => (
        <button key={String(v)} onClick={() => onChange(v)}
          style={{
            minWidth: 100, height: 44, borderRadius: 8, border: '2px solid',
            borderColor: value === v ? (v ? '#52c41a' : '#ff4d4f') : '#e0e0e0',
            background:  value === v ? (v ? '#52c41a' : '#ff4d4f') : '#fff',
            color:       value === v ? '#fff' : '#555',
            fontWeight: 700, fontSize: 15, cursor: 'pointer', transition: 'all .15s',
            boxShadow:   value === v ? '0 2px 8px rgba(0,0,0,.15)' : 'none',
          }}
        >
          {v ? '✓  Yes' : '✗  No'}
        </button>
      ))}
    </Space>
  );
}

function NpsWidget({ value, onChange }) {
  const bg = (i) => value === i ? (i <= 6 ? '#ff4d4f' : i <= 8 ? '#faad14' : '#52c41a') : '#fff';
  const bc = (i) => value === i ? bg(i) : '#e0e0e0';
  return (
    <div>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        {[...Array(11)].map((_, i) => (
          <button key={i} onClick={() => onChange(i)}
            style={{
              width: 44, height: 44, borderRadius: 8,
              border: `2px solid ${bc(i)}`, background: bg(i),
              color: value === i ? '#fff' : '#444',
              fontWeight: 700, fontSize: 14, cursor: 'pointer', transition: 'all .15s',
              boxShadow: value === i ? '0 2px 8px rgba(0,0,0,.15)' : 'none',
            }}
          >{i}</button>
        ))}
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8, alignItems: 'center' }}>
        <Text type="secondary" style={{ fontSize: 11 }}>Not likely</Text>
        {value !== null && value !== undefined && (
          <Tag color={value <= 6 ? 'red' : value <= 8 ? 'orange' : 'green'} style={{ borderRadius: 20 }}>
            {value <= 6 ? 'Detractor' : value <= 8 ? 'Passive' : 'Promoter'} · {value}/10
          </Tag>
        )}
        <Text type="secondary" style={{ fontSize: 11 }}>Extremely likely</Text>
      </div>
    </div>
  );
}

function AnswerInput({ q, ans, onChange }) {
  const a = ans || initAns();
  if (q.type === 'RATING')           return <RatingWidget value={a.rating} onChange={(v) => onChange({ ...a, rating: v })} />;
  if (q.type === 'RATING_WITH_TEXT') return <RatingTextWidget ans={a} onChange={onChange} />;
  if (q.type === 'TEXT')             return <TextArea value={a.text} onChange={(e) => onChange({ ...a, text: e.target.value })} rows={4} maxLength={1000} showCount placeholder="Your answer…" style={{ borderRadius: 8, fontSize: 14 }} />;
  if (q.type === 'YES_NO')           return <YesNoWidget value={a.yesno} onChange={(v) => onChange({ ...a, yesno: v })} />;
  if (q.type === 'NPS')              return <NpsWidget value={a.rating} onChange={(v) => onChange({ ...a, rating: v })} />;
  return null;
}

// ── question card ─────────────────────────────────────────────────────────────

function QuestionCard({ q, qi, done, children }) {
  return (
    <div style={{
      background: '#fff', borderRadius: 12, padding: '22px 24px',
      border: `1.5px solid ${done ? '#b7eb8f' : '#ebebeb'}`,
      boxShadow: '0 1px 6px rgba(0,0,0,.04)', transition: 'border-color .2s',
    }}>
      <div style={{ marginBottom: 16 }}>
        <Text style={{ fontSize: 15, fontWeight: 600, color: '#111' }}>
          {qi + 1}. {q.question_text}
          {q.is_required && <span style={{ color: '#ff4d4f', marginLeft: 3 }}>*</span>}
        </Text>
        {q.helper_text && (
          <Text type="secondary" style={{ fontSize: 12, display: 'block', marginTop: 4 }}>
            {q.helper_text}
          </Text>
        )}
      </div>
      {children}
      {done && (
        <div style={{ marginTop: 12, display: 'flex', alignItems: 'center', gap: 5 }}>
          <CheckOutlined style={{ color: '#52c41a', fontSize: 11 }} />
          <Text style={{ fontSize: 11, color: '#52c41a', fontWeight: 500 }}>Answered</Text>
        </div>
      )}
    </div>
  );
}

// ── top bar ───────────────────────────────────────────────────────────────────

function TopBar({ project, pct }) {
  return (
    <div style={{ position: 'sticky', top: 0, zIndex: 100, background: '#fff', borderBottom: '1px solid #ebebeb', boxShadow: '0 2px 8px rgba(0,0,0,.06)' }}>
      <div style={{ maxWidth: 640, margin: '0 auto', padding: '12px 24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, marginBottom: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <img src="/gamyam360.png" alt="Gamyam" style={{ width: 40, height: 40, objectFit: 'contain' }} />
            <div style={{ fontWeight: 800, fontSize: 16, color: '#1a1a1a', letterSpacing: '-0.3px' }}>Gamyam</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 11, color: '#8c8c8c' }}>Feedback for</div>
            <div style={{ fontWeight: 700, fontSize: 13, color: '#1a1a1a' }}>{project}</div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Progress percent={pct} showInfo={false} size="small"
            strokeColor={pct === 100 ? '#52c41a' : '#1677ff'}
            trailColor="#e8e8e8" style={{ margin: 0, flex: 1 }} />
          <Text style={{ fontSize: 12, fontWeight: 700, color: pct === 100 ? '#52c41a' : '#1677ff', minWidth: 36, textAlign: 'right' }}>
            {pct}%
          </Text>
        </div>
      </div>
    </div>
  );
}

// ── footer ────────────────────────────────────────────────────────────────────

function Footer() {
  return (
    <div style={{ borderTop: '1px solid #ebebeb', background: '#fff', padding: '14px 24px' }}>
      <div style={{ maxWidth: 640, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
        <Text type="secondary" style={{ fontSize: 12 }}>© {new Date().getFullYear()} Gamyam</Text>
        <Text type="secondary" style={{ fontSize: 11 }}>
          Your responses are strictly confidential and used only to improve our services.
        </Text>
      </div>
    </div>
  );
}

// ── person view ───────────────────────────────────────────────────────────────

function PersonView({ emp, step, questions, answers, onChange }) {
  const allDone = questions.every((q) => isAnswered(q, (answers[emp.id] || {})[q.id]));
  return (
    <>
      <div style={{
        background: '#fff', borderRadius: 14, padding: '24px 28px',
        border: '1px solid #ebebeb', boxShadow: '0 2px 12px rgba(0,0,0,.05)',
        marginBottom: 16, display: 'flex', alignItems: 'center', gap: 20,
      }}>
        <Avatar size={64} style={{ background: avatarColor(step), fontSize: 22, fontWeight: 700, flexShrink: 0 }}>
          {initials(emp)}
        </Avatar>
        <div style={{ flex: 1 }}>
          <Title level={4} style={{ margin: '0 0 2px' }}>{displayName(emp)}</Title>
          <Text type="secondary" style={{ fontSize: 14 }}>{emp.department}</Text>
        </div>
        {allDone && (
          <Tag color="success" style={{ borderRadius: 20, fontSize: 12 }}>
            <CheckOutlined style={{ marginRight: 4 }} />Done
          </Tag>
        )}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {questions.map((q, qi) => {
          const ans  = (answers[emp.id] || {})[q.id] || initAns();
          const done = isAnswered(q, ans);
          return (
            <QuestionCard key={q.id} q={q} qi={qi} done={done}>
              <AnswerInput q={q} ans={ans} onChange={(a) => onChange(emp.id, q.id, a)} />
            </QuestionCard>
          );
        })}
      </div>
    </>
  );
}

// ── team view ─────────────────────────────────────────────────────────────────

function TeamView({ questions, answers, onChange }) {
  return (
    <>
      <div style={{
        background: '#fff', borderRadius: 14, padding: '24px 28px',
        border: '1px solid #ebebeb', boxShadow: '0 2px 12px rgba(0,0,0,.05)',
        marginBottom: 16, display: 'flex', alignItems: 'center', gap: 20,
      }}>
        <Avatar size={64} icon={<TeamOutlined />} style={{ background: '#1677ff', fontSize: 26, flexShrink: 0 }} />
        <div>
          <Title level={4} style={{ margin: '0 0 2px' }}>Team Overall</Title>
          <Text type="secondary" style={{ fontSize: 14 }}>Share your overall experience with the team</Text>
        </div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {questions.map((q, qi) => {
          const ans  = (answers.team || {})[q.id] || initAns();
          const done = isAnswered(q, ans);
          return (
            <QuestionCard key={q.id} q={q} qi={qi} done={done}>
              <AnswerInput q={q} ans={ans} onChange={(a) => onChange(q.id, a)} />
            </QuestionCard>
          );
        })}
      </div>
    </>
  );
}

// ── main ──────────────────────────────────────────────────────────────────────

export default function ClientFeedbackFormPage() {
  const { token } = useParams();

  const [formData,   setFormData]   = useState(null);
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState(null);
  const [submitted,  setSubmitted]  = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [answers,    setAnswers]    = useState({});
  const [step,       setStep]       = useState(0);

  const empQuestions  = useMemo(() => formData ? formData.sections.flatMap((s) => s.questions.filter((q) => q.applies_to === 'EACH_EMPLOYEE')) : [], [formData]);
  const teamQuestions = useMemo(() => formData ? formData.sections.flatMap((s) => s.questions.filter((q) => q.applies_to === 'TEAM_OVERALL'))  : [], [formData]);
  const totalSteps    = (formData?.employees?.length || 0) + (teamQuestions.length > 0 ? 1 : 0);
  const isTeamStep    = formData && step === formData.employees.length;
  const emp           = formData && !isTeamStep ? formData.employees[step] : null;

  useEffect(() => {
    getPublicForm(token)
      .then((data) => {
        if (!data.success) { setError(data.detail || 'Invalid feedback link.'); return; }
        const f = data.form;
        setFormData(f);
        if (f.status === 'SUBMITTED') { setSubmitted(true); return; }
        if (f.status === 'EXPIRED')   { setError('This feedback link has expired.'); return; }
        const eq = f.sections.flatMap((s) => s.questions.filter((q) => q.applies_to === 'EACH_EMPLOYEE'));
        const tq = f.sections.flatMap((s) => s.questions.filter((q) => q.applies_to === 'TEAM_OVERALL'));
        setAnswers(initAnswers(f, eq, tq));
      })
      .catch(() => setError('Could not load the form. Please check the link.'))
      .finally(() => setLoading(false));
  }, [token]);

  const setEmpAns  = (empId, qId, ans) =>
    setAnswers((p) => ({ ...p, [empId]: { ...(p[empId] || {}), [qId]: ans } }));
  const setTeamAns = (qId, ans) =>
    setAnswers((p) => ({ ...p, team: { ...(p.team || {}), [qId]: ans } }));

  const pct = useMemo(() => {
    if (!formData) return 0;
    let done = 0, total = 0;
    formData.employees.forEach((e) => empQuestions.filter((q) => q.is_required).forEach((q) => {
      total++;
      if (isAnswered(q, (answers[e.id] || {})[q.id])) done++;
    }));
    teamQuestions.filter((q) => q.is_required).forEach((q) => {
      total++;
      if (isAnswered(q, (answers.team || {})[q.id])) done++;
    });
    return total === 0 ? 100 : Math.round((done / total) * 100);
  }, [formData, answers, empQuestions, teamQuestions]);

  const allDone = pct === 100;

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const answersList = [];
      formData.employees.forEach((e) => {
        empQuestions.forEach((q) => {
          const a = (answers[e.id] || {})[q.id] || initAns();
          answersList.push({ question_id: q.id, employee_id: e.id, rating_value: a.rating ?? null, text_value: a.text || '', yes_no_value: a.yesno ?? null });
        });
      });
      teamQuestions.forEach((q) => {
        const a = (answers.team || {})[q.id] || initAns();
        answersList.push({ question_id: q.id, employee_id: null, rating_value: a.rating ?? null, text_value: a.text || '', yes_no_value: a.yesno ?? null });
      });
      const result = await submitPublicForm(token, { answers: answersList });
      if (result.success) setSubmitted(true);
      else setError(result.detail || 'Submission failed. Please try again.');
    } catch { setError('Submission failed. Please try again.'); }
    finally { setSubmitting(false); }
  };

  // ── states ──

  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#f5f7fa', gap: 16 }}>
      <Spin size="large" />
      <Text type="secondary">Loading your feedback form…</Text>
    </div>
  );

  if (error) return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#f5f7fa', padding: 24 }}>
      <div style={{ textAlign: 'center', maxWidth: 400 }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>🔗</div>
        <Title level={4} style={{ color: '#ff4d4f' }}>Form Unavailable</Title>
        <Text type="secondary">{error}</Text>
      </div>
    </div>
  );

  if (submitted) return (
    <div style={{ minHeight: '100vh', background: '#f5f7fa', display: 'flex', flexDirection: 'column' }}>
      <TopBar project={formData?.project_name} pct={100} />
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
        <div style={{ textAlign: 'center', maxWidth: 440 }}>
          <div style={{ width: 80, height: 80, borderRadius: '50%', background: '#f6ffed', border: '2px solid #b7eb8f', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
            <CheckOutlined style={{ fontSize: 36, color: '#52c41a' }} />
          </div>
          <Title level={3} style={{ margin: '0 0 8px' }}>Thank you, {formData?.client_name}!</Title>
          <Paragraph type="secondary" style={{ fontSize: 15, margin: '0 0 12px' }}>
            Your feedback for <strong>{formData?.project_name}</strong> has been received.
            Gamyam appreciates the time you've taken to share your experience.
          </Paragraph>
          <Text type="secondary" style={{ fontSize: 12 }}>
            Your responses are strictly confidential and used only to improve our services.
          </Text>
        </div>
      </div>
      <Footer />
    </div>
  );

  // ── form ──

  return (
    <div style={{ minHeight: '100vh', background: '#f5f7fa', display: 'flex', flexDirection: 'column' }}>

      <TopBar project={formData.project_name} pct={pct} />

      <div style={{ flex: 1, maxWidth: 640, width: '100%', margin: '0 auto', padding: '28px 16px 60px' }}>

        {/* step dots */}
        <div style={{ marginBottom: 28, textAlign: 'center' }}>
          <div style={{ display: 'inline-flex', gap: 6, alignItems: 'center', flexWrap: 'wrap', justifyContent: 'center' }}>
            {formData.employees.map((e, i) => {
              const done    = empQuestions.every((q) => isAnswered(q, (answers[e.id] || {})[q.id]));
              const current = i === step && !isTeamStep;
              return (
                <div key={e.id} onClick={() => setStep(i)} title={displayName(e)}
                  style={{ width: current ? 28 : 10, height: 10, borderRadius: 10, background: done ? '#52c41a' : current ? '#1677ff' : '#d9d9d9', cursor: 'pointer', transition: 'all .25s' }}
                />
              );
            })}
            {teamQuestions.length > 0 && (
              <div onClick={() => setStep(formData.employees.length)} title="Team Overall"
                style={{ width: isTeamStep ? 28 : 10, height: 10, borderRadius: 10, background: isTeamStep ? '#1677ff' : teamQuestions.every((q) => isAnswered(q, (answers.team || {})[q.id])) ? '#52c41a' : '#d9d9d9', cursor: 'pointer', transition: 'all .25s' }}
              />
            )}
          </div>
          <Text type="secondary" style={{ fontSize: 11, display: 'block', marginTop: 6 }}>
            {isTeamStep
              ? `Team Overall  ·  ${step + 1} of ${totalSteps}`
              : `Person ${step + 1} of ${formData.employees.length}${teamQuestions.length > 0 ? '  ·  then Team Overall' : ''}`}
          </Text>
        </div>

        {/* content */}
        {!isTeamStep
          ? <PersonView emp={emp} step={step} questions={empQuestions} answers={answers} onChange={setEmpAns} />
          : <TeamView questions={teamQuestions} answers={answers} onChange={setTeamAns} />
        }

        {/* navigation */}
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 24, alignItems: 'center' }}>
          <Button size="large" icon={<ArrowLeftOutlined />}
            onClick={() => setStep((s) => s - 1)} disabled={step === 0}
            style={{ borderRadius: 10, minWidth: 100 }}>
            Back
          </Button>

          <Space size={5}>
            {formData.employees.map((e, i) => {
              const done    = empQuestions.every((q) => isAnswered(q, (answers[e.id] || {})[q.id]));
              const current = i === step && !isTeamStep;
              return (
                <Avatar key={e.id} size={28} onClick={() => setStep(i)}
                  style={{ background: current ? avatarColor(i) : done ? '#52c41a' : '#e8e8e8', fontSize: 10, fontWeight: 700, cursor: 'pointer', outline: current ? `3px solid ${avatarColor(i)}` : 'none', outlineOffset: 2, transition: 'all .2s' }}>
                  {done && !current ? <CheckOutlined style={{ fontSize: 10 }} /> : initials(e)}
                </Avatar>
              );
            })}
            {teamQuestions.length > 0 && (
              <Avatar size={28} icon={<TeamOutlined style={{ fontSize: 12 }} />}
                onClick={() => setStep(formData.employees.length)}
                style={{ background: isTeamStep ? '#1677ff' : teamQuestions.every((q) => isAnswered(q, (answers.team || {})[q.id])) ? '#52c41a' : '#e8e8e8', cursor: 'pointer', outline: isTeamStep ? '3px solid #1677ff' : 'none', outlineOffset: 2, transition: 'all .2s' }}
              />
            )}
          </Space>

          {isTeamStep ? (
            <Button type="primary" size="large" icon={<SendOutlined />}
              disabled={!allDone} loading={submitting} onClick={handleSubmit}
              style={{ borderRadius: 10, minWidth: 160, height: 44, boxShadow: allDone ? '0 4px 14px rgba(22,119,255,.4)' : 'none' }}>
              Submit Feedback
            </Button>
          ) : (
            <Button type="primary" size="large" onClick={() => setStep((s) => s + 1)}
              style={{ borderRadius: 10, minWidth: 140, height: 44 }}>
              {step === formData.employees.length - 1
                ? <><TeamOutlined style={{ marginRight: 6 }} />Team Overall</>
                : <>Next: {displayName(formData.employees[step + 1])} <ArrowRightOutlined style={{ fontSize: 11, marginLeft: 4 }} /></>
              }
            </Button>
          )}
        </div>

        {isTeamStep && !allDone && (
          <Text type="secondary" style={{ fontSize: 12, display: 'block', textAlign: 'center', marginTop: 14 }}>
            Complete all required questions for every team member to enable submit.
          </Text>
        )}
      </div>

      <Footer />
    </div>
  );
}
