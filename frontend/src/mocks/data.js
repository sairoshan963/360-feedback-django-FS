/**
 * Frontend mock data — mirrors Django API response shapes exactly.
 * Toggled by VITE_USE_MOCK=true in frontend/.env
 * Pages do NOT need to change — only api/*.js files check this flag.
 */

// ─── Helpers ─────────────────────────────────────────────────────────────────
export const delay = (data, ms = 350) =>
  new Promise((r) => setTimeout(() => r({ data }), ms));

// ─── Auth / Users ────────────────────────────────────────────────────────────

export const MOCK_USERS_BY_EMAIL = {
  'admin@gamyam.com':    { id: 'u-001', email: 'admin@gamyam.com',    first_name: 'Arjun',  last_name: 'Sharma',  job_title: 'CEO',                      role: 'SUPER_ADMIN', status: 'ACTIVE', department: 'Admin',            avatar_url: null },
  'hr@gamyam.com':       { id: 'u-002', email: 'hr@gamyam.com',       first_name: 'Priya',  last_name: 'Nair',    job_title: 'HR Manager',               role: 'HR_ADMIN',    status: 'ACTIVE', department: 'Human Resources',  avatar_url: null },
  'manager@gamyam.com':  { id: 'u-003', email: 'manager@gamyam.com',  first_name: 'Kiran',  last_name: 'Reddy',   job_title: 'Engineering Manager',      role: 'MANAGER',     status: 'ACTIVE', department: 'Engineering',      avatar_url: null },
  'employee@gamyam.com': { id: 'u-004', email: 'employee@gamyam.com', first_name: 'Divya',  last_name: 'Menon',   job_title: 'Senior Software Engineer', role: 'EMPLOYEE',    status: 'ACTIVE', department: 'Engineering',      avatar_url: null },
};

export const USERS = [
  { id: 'u-001', email: 'admin@gamyam.com',    first_name: 'Arjun',   last_name: 'Sharma',     job_title: 'CEO',                           role: 'SUPER_ADMIN', status: 'ACTIVE', department: 'Admin',             avatar_url: null, manager_id: null },
  { id: 'u-002', email: 'hr@gamyam.com',       first_name: 'Priya',   last_name: 'Nair',       job_title: 'HR Manager',                    role: 'HR_ADMIN',    status: 'ACTIVE', department: 'Human Resources',   avatar_url: null, manager_id: null },
  { id: 'u-003', email: 'manager@gamyam.com',  first_name: 'Kiran',   last_name: 'Reddy',      job_title: 'Engineering Manager',           role: 'MANAGER',     status: 'ACTIVE', department: 'Engineering',       avatar_url: null, manager_id: null },
  { id: 'u-004', email: 'employee@gamyam.com', first_name: 'Divya',   last_name: 'Menon',      job_title: 'Senior Software Engineer',      role: 'EMPLOYEE',    status: 'ACTIVE', department: 'Engineering',       avatar_url: null, manager_id: 'u-003' },
  { id: 'u-005', email: 'rahul@gamyam.com',    first_name: 'Rahul',   last_name: 'Verma',      job_title: 'Software Engineer',             role: 'EMPLOYEE',    status: 'ACTIVE', department: 'Engineering',       avatar_url: null, manager_id: 'u-003' },
  { id: 'u-006', email: 'sneha@gamyam.com',    first_name: 'Sneha',   last_name: 'Pillai',     job_title: 'Frontend Engineer',             role: 'EMPLOYEE',    status: 'ACTIVE', department: 'Engineering',       avatar_url: null, manager_id: 'u-003' },
  { id: 'u-007', email: 'amit@gamyam.com',     first_name: 'Amit',    last_name: 'Joshi',      job_title: 'Product Manager',               role: 'MANAGER',     status: 'ACTIVE', department: 'Program Management',avatar_url: null, manager_id: null },
  { id: 'u-008', email: 'meera@gamyam.com',    first_name: 'Meera',   last_name: 'Iyer',       job_title: 'Product Designer',              role: 'EMPLOYEE',    status: 'ACTIVE', department: 'Program Management',avatar_url: null, manager_id: 'u-007' },
  { id: 'u-009', email: 'sanjay@gamyam.com',   first_name: 'Sanjay',  last_name: 'Kulkarni',   job_title: 'Operations Manager',            role: 'EMPLOYEE',    status: 'ACTIVE', department: 'Operations',        avatar_url: null, manager_id: 'u-007' },
  { id: 'u-010', email: 'ananya@gamyam.com',   first_name: 'Ananya',  last_name: 'Bose',       job_title: 'Marketing Analyst',             role: 'EMPLOYEE',    status: 'ACTIVE', department: 'Marketing',         avatar_url: null, manager_id: 'u-007' },
  { id: 'u-011', email: 'vikram@gamyam.com',   first_name: 'Vikram',  last_name: 'Singh',      job_title: 'Marketing Manager',             role: 'MANAGER',     status: 'ACTIVE', department: 'Marketing',         avatar_url: null, manager_id: null },
  { id: 'u-012', email: 'kavya@gamyam.com',    first_name: 'Kavya',   last_name: 'Rao',        job_title: 'Content Marketing Manager',     role: 'EMPLOYEE',    status: 'ACTIVE', department: 'Marketing',         avatar_url: null, manager_id: 'u-011' },
  { id: 'u-013', email: 'rohan@gamyam.com',    first_name: 'Rohan',   last_name: 'Das',        job_title: 'Business Analyst',              role: 'EMPLOYEE',    status: 'ACTIVE', department: 'Operations',        avatar_url: null, manager_id: 'u-011' },
  { id: 'u-014', email: 'ishaan@gamyam.com',   first_name: 'Ishaan',  last_name: 'Kapoor',     job_title: 'Data Analyst',                  role: 'EMPLOYEE',    status: 'ACTIVE', department: 'Operations',        avatar_url: null, manager_id: 'u-011' },
  { id: 'u-015', email: 'pooja@gamyam.com',    first_name: 'Pooja',   last_name: 'Chatterjee', job_title: 'Recruiter',                     role: 'EMPLOYEE',    status: 'ACTIVE', department: 'Human Resources',   avatar_url: null, manager_id: 'u-002' },
];

export const DEPARTMENTS = [
  { id: 'd-001', name: 'Admin' },
  { id: 'd-002', name: 'Human Resources' },
  { id: 'd-003', name: 'Engineering' },
  { id: 'd-004', name: 'Program Management' },
  { id: 'd-005', name: 'Operations' },
  { id: 'd-006', name: 'Marketing' },
];

// ─── Org Hierarchy ────────────────────────────────────────────────────────────
// Flat user list with manager_id — mirrors the Django GET /org/hierarchy/ response shape.

export const ORG_HIERARCHY = USERS.map((u) => ({
  id:         u.id,
  email:      u.email,
  first_name: u.first_name,
  last_name:  u.last_name,
  job_title:  u.job_title,
  role:       u.role,
  status:     u.status,
  department: u.department,
  avatar_url: u.avatar_url,
  manager_id: u.manager_id ?? null,
}));

// ─── Templates ────────────────────────────────────────────────────────────────

export const TEMPLATE_SECTIONS = [
  {
    id: 's-001', title: 'Communication & Collaboration', display_order: 1,
    questions: [
      { id: 'q-001', question_text: 'How clearly does this person communicate ideas to the team?', type: 'RATING', rating_scale_min: 1, rating_scale_max: 5, is_required: true,  display_order: 1 },
      { id: 'q-002', question_text: 'How well do they collaborate with colleagues across teams?',  type: 'RATING', rating_scale_min: 1, rating_scale_max: 5, is_required: true,  display_order: 2 },
      { id: 'q-003', question_text: 'Do they actively listen and incorporate feedback?',           type: 'RATING', rating_scale_min: 1, rating_scale_max: 5, is_required: true,  display_order: 3 },
    ],
  },
  {
    id: 's-002', title: 'Technical Skills & Delivery', display_order: 2,
    questions: [
      { id: 'q-004', question_text: 'How would you rate the quality of their technical work?',     type: 'RATING', rating_scale_min: 1, rating_scale_max: 5, is_required: true,  display_order: 1 },
      { id: 'q-005', question_text: 'Do they consistently meet deadlines and commitments?',        type: 'RATING', rating_scale_min: 1, rating_scale_max: 5, is_required: true,  display_order: 2 },
      { id: 'q-006', question_text: 'How well do they handle complex problem-solving situations?', type: 'RATING', rating_scale_min: 1, rating_scale_max: 5, is_required: true,  display_order: 3 },
    ],
  },
  {
    id: 's-003', title: 'Leadership & Initiative', display_order: 3,
    questions: [
      { id: 'q-007', question_text: 'Do they take ownership and lead initiatives proactively?',   type: 'RATING', rating_scale_min: 1, rating_scale_max: 5, is_required: true,  display_order: 1 },
      { id: 'q-008', question_text: 'How well do they mentor and support junior team members?',   type: 'RATING', rating_scale_min: 1, rating_scale_max: 5, is_required: false, display_order: 2 },
    ],
  },
  {
    id: 's-004', title: 'Open Feedback', display_order: 4,
    questions: [
      { id: 'q-009', question_text: "What are this person's greatest strengths?",       type: 'TEXT', is_required: true,  display_order: 1 },
      { id: 'q-010', question_text: 'What is one area where they could grow the most?', type: 'TEXT', is_required: false, display_order: 2 },
    ],
  },
];

export const TEMPLATES = [
  {
    id: 't-001',
    name: '360° Performance Review — Standard',
    description: 'Comprehensive 360 review covering communication, technical skills, and leadership.',
    is_active: true,
    created_at: '2024-10-01T08:00:00Z',
    creator_first_name: 'Priya',
    creator_last_name: 'Nair',
    section_count: 4,
    sections: TEMPLATE_SECTIONS,
  },
  {
    id: 't-002',
    name: 'Leadership Assessment — Managers Only',
    description: 'Focused assessment for manager-level employees.',
    is_active: true,
    created_at: '2024-11-15T08:00:00Z',
    creator_first_name: 'Priya',
    creator_last_name: 'Nair',
    section_count: 2,
    sections: [
      {
        id: 's-005', title: 'Strategic Thinking', display_order: 1,
        questions: [
          { id: 'q-011', question_text: 'How effectively does this manager set a clear direction?', type: 'RATING', rating_scale_min: 1, rating_scale_max: 5, is_required: true, display_order: 1 },
          { id: 'q-012', question_text: 'Do they make well-reasoned decisions under pressure?',    type: 'RATING', rating_scale_min: 1, rating_scale_max: 5, is_required: true, display_order: 2 },
        ],
      },
      {
        id: 's-006', title: 'Team Development', display_order: 2,
        questions: [
          { id: 'q-013', question_text: 'How actively do they develop their direct reports?',         type: 'RATING', rating_scale_min: 1, rating_scale_max: 5, is_required: true,  display_order: 1 },
          { id: 'q-014', question_text: 'Share a specific example of how they helped someone grow.',  type: 'TEXT',   is_required: false, display_order: 2 },
        ],
      },
    ],
  },
];

// ─── Cycles ────────────────────────────────────────────────────────────────────

export const CYCLES = [
  {
    id: 'c-001', name: 'Annual 360 Review — 2024',
    description: 'Full company 360 review covering all departments.',
    state: 'RESULTS_RELEASED', peer_enabled: true,
    peer_min_count: 2, peer_max_count: 5,
    peer_anonymity: 'ANONYMOUS', manager_anonymity: 'TRANSPARENT', self_anonymity: 'TRANSPARENT',
    nomination_deadline: '2024-11-10T00:00:00Z', review_deadline: '2024-12-15T00:00:00Z',
    results_released_at: '2024-12-20T00:00:00Z', created_at: '2024-10-15T08:00:00Z',
    template_name: '360° Performance Review — Standard', template_id: 't-001',
    quarter: 'Q4', quarter_year: 2024,
    creator_first_name: 'Priya', creator_last_name: 'Nair',
  },
  {
    id: 'c-002', name: 'H1 2025 Performance Review',
    description: 'Mid-year review for all employees.',
    state: 'ACTIVE', peer_enabled: true,
    peer_min_count: 2, peer_max_count: 4,
    peer_anonymity: 'ANONYMOUS', manager_anonymity: 'TRANSPARENT', self_anonymity: 'TRANSPARENT',
    nomination_deadline: '2025-02-01T00:00:00Z', review_deadline: '2025-03-31T00:00:00Z',
    results_released_at: null, created_at: '2025-01-10T08:00:00Z',
    template_name: '360° Performance Review — Standard', template_id: 't-001',
    quarter: 'Q1', quarter_year: 2025,
    creator_first_name: 'Priya', creator_last_name: 'Nair',
  },
  {
    id: 'c-003', name: 'Q3 2025 Pulse Check',
    description: 'Lightweight quarterly check-in.',
    state: 'NOMINATION', peer_enabled: true,
    peer_min_count: 2, peer_max_count: 3,
    peer_anonymity: 'SEMI_ANONYMOUS', manager_anonymity: 'TRANSPARENT', self_anonymity: 'TRANSPARENT',
    nomination_deadline: '2025-07-15T00:00:00Z', review_deadline: '2025-08-10T00:00:00Z',
    results_released_at: null, created_at: '2025-06-01T08:00:00Z',
    template_name: '360° Performance Review — Standard', template_id: 't-001',
    quarter: 'Q3', quarter_year: 2025,
    creator_first_name: 'Priya', creator_last_name: 'Nair',
  },
  {
    id: 'c-004', name: 'Manager Leadership Review — Q4 2025',
    description: 'Leadership assessment for all managers.',
    state: 'DRAFT', peer_enabled: false,
    peer_min_count: null, peer_max_count: null,
    peer_anonymity: 'ANONYMOUS', manager_anonymity: 'ANONYMOUS', self_anonymity: 'TRANSPARENT',
    nomination_deadline: null, review_deadline: '2025-12-20T00:00:00Z',
    results_released_at: null, created_at: '2025-09-01T08:00:00Z',
    template_name: 'Leadership Assessment — Managers Only', template_id: 't-002',
    quarter: null, quarter_year: null,
    creator_first_name: 'Priya', creator_last_name: 'Nair',
  },
];

export const CYCLE_PARTICIPANTS = {
  'c-001': USERS.filter((u) => ['EMPLOYEE', 'MANAGER'].includes(u.role)),
  'c-002': USERS.filter((u) => ['EMPLOYEE', 'MANAGER'].includes(u.role)),
  'c-003': USERS.filter((u) => ['EMPLOYEE', 'MANAGER'].includes(u.role)),
  'c-004': USERS.filter((u) => u.role === 'MANAGER'),
};

export const CYCLE_PROGRESS = {
  'c-001': [
    { reviewer_type: 'SELF',    total: '12', submitted: '12', locked: '0', pending: '0' },
    { reviewer_type: 'MANAGER', total: '9',  submitted: '9',  locked: '0', pending: '0' },
    { reviewer_type: 'PEER',    total: '28', submitted: '26', locked: '0', pending: '2' },
  ],
  'c-002': [
    { reviewer_type: 'SELF',    total: '12', submitted: '7',  locked: '0', pending: '5' },
    { reviewer_type: 'MANAGER', total: '9',  submitted: '5',  locked: '0', pending: '4' },
    { reviewer_type: 'PEER',    total: '24', submitted: '11', locked: '0', pending: '13' },
  ],
  'c-003': [
    { reviewer_type: 'SELF',    total: '12', submitted: '0', locked: '0', pending: '12' },
    { reviewer_type: 'MANAGER', total: '9',  submitted: '0', locked: '0', pending: '9' },
    { reviewer_type: 'PEER',    total: '0',  submitted: '0', locked: '0', pending: '0' },
  ],
};

// ─── Nominations ─────────────────────────────────────────────────────────────

export const MY_NOMINATIONS = [
  { peer_id: 'u-005', first_name: 'Rahul', last_name: 'Verma',  email: 'rahul@gamyam.com', status: 'APPROVED', rejection_note: null },
  { peer_id: 'u-006', first_name: 'Sneha', last_name: 'Pillai', email: 'sneha@gamyam.com', status: 'PENDING',  rejection_note: null },
  { peer_id: 'u-008', first_name: 'Meera', last_name: 'Iyer',   email: 'meera@gamyam.com', status: 'PENDING',  rejection_note: null },
];

export const ALL_NOMINATIONS = [
  { id: 'nom-001', reviewee_id: 'u-004', peer_id: 'u-005', reviewee_first: 'Divya',  reviewee_last: 'Menon',    peer_first: 'Rahul',  peer_last: 'Verma',    status: 'APPROVED', cycle_id: 'c-003' },
  { id: 'nom-002', reviewee_id: 'u-004', peer_id: 'u-006', reviewee_first: 'Divya',  reviewee_last: 'Menon',    peer_first: 'Sneha',  peer_last: 'Pillai',   status: 'PENDING',  cycle_id: 'c-003' },
  { id: 'nom-003', reviewee_id: 'u-005', peer_id: 'u-004', reviewee_first: 'Rahul',  reviewee_last: 'Verma',    peer_first: 'Divya',  peer_last: 'Menon',    status: 'PENDING',  cycle_id: 'c-003' },
  { id: 'nom-004', reviewee_id: 'u-005', peer_id: 'u-006', reviewee_first: 'Rahul',  reviewee_last: 'Verma',    peer_first: 'Sneha',  peer_last: 'Pillai',   status: 'PENDING',  cycle_id: 'c-003' },
  { id: 'nom-005', reviewee_id: 'u-006', peer_id: 'u-004', reviewee_first: 'Sneha',  reviewee_last: 'Pillai',   peer_first: 'Divya',  peer_last: 'Menon',    status: 'PENDING',  cycle_id: 'c-003' },
  { id: 'nom-006', reviewee_id: 'u-008', peer_id: 'u-009', reviewee_first: 'Meera',  reviewee_last: 'Iyer',     peer_first: 'Sanjay', peer_last: 'Kulkarni', status: 'PENDING',  cycle_id: 'c-003' },
];

// ─── Reviewer Tasks ───────────────────────────────────────────────────────────

export const MY_TASKS = [
  {
    id: 'rt-001', cycle_id: 'c-002', cycle_name: 'H1 2025 Performance Review', cycle_state: 'ACTIVE',
    reviewer_type: 'SELF', reviewee_id: 'u-004', reviewee_first: 'Divya', reviewee_last: 'Menon',
    reviewer_id: 'u-004', status: 'PENDING', review_deadline: '2025-03-31T00:00:00Z',
    template: { id: 't-001', name: '360° Performance Review — Standard', sections: TEMPLATE_SECTIONS },
    draft_answers: [], submitted_answers: [],
  },
  {
    id: 'rt-002', cycle_id: 'c-002', cycle_name: 'H1 2025 Performance Review', cycle_state: 'ACTIVE',
    reviewer_type: 'PEER', reviewee_id: 'u-005', reviewee_first: 'Rahul', reviewee_last: 'Verma',
    reviewer_id: 'u-004', status: 'DRAFT', review_deadline: '2025-03-31T00:00:00Z',
    template: { id: 't-001', name: '360° Performance Review — Standard', sections: TEMPLATE_SECTIONS },
    draft_answers: [{ question_id: 'q-001', rating_value: 4, text_value: null }], submitted_answers: [],
  },
  {
    id: 'rt-003', cycle_id: 'c-001', cycle_name: 'Annual 360 Review — 2024', cycle_state: 'RESULTS_RELEASED',
    reviewer_type: 'SELF', reviewee_id: 'u-004', reviewee_first: 'Divya', reviewee_last: 'Menon',
    reviewer_id: 'u-004', status: 'SUBMITTED', review_deadline: '2024-12-15T00:00:00Z',
    template: { id: 't-001', name: '360° Performance Review — Standard', sections: TEMPLATE_SECTIONS },
    draft_answers: [],
    submitted_answers: [
      { question_id: 'q-001', rating_value: 4, text_value: null },
      { question_id: 'q-002', rating_value: 5, text_value: null },
      { question_id: 'q-009', rating_value: null, text_value: 'Strong ownership mindset.' },
    ],
  },
];

// ─── My Report ────────────────────────────────────────────────────────────────

export const MY_REPORT = {
  'c-001': {
    cycle_id: 'c-001', reviewee: { id: 'u-004' },
    overall_score: 3.92, self_score: 4.30, manager_score: 3.80, peer_score: 3.75,
    sections: [
      {
        reviewer_type: 'SELF',
        identity: { first_name: 'Divya', last_name: 'Menon', email: 'employee@gamyam.com' },
        answers: [
          { question_id: 'q-001', question_text: 'How clearly does this person communicate ideas to the team?', rating_value: 4,    text_value: null },
          { question_id: 'q-002', question_text: 'How well do they collaborate with colleagues across teams?',  rating_value: 5,    text_value: null },
          { question_id: 'q-004', question_text: 'How would you rate the quality of their technical work?',    rating_value: 5,    text_value: null },
          { question_id: 'q-009', question_text: "What are this person's greatest strengths?",                 rating_value: null, text_value: 'Strong ownership mindset and ability to break down complex problems.' },
        ],
      },
      {
        reviewer_type: 'MANAGER',
        identity: { first_name: 'Kiran', last_name: 'Reddy' },
        answers: [
          { question_id: 'q-001', question_text: 'How clearly does this person communicate ideas to the team?', rating_value: 4,    text_value: null },
          { question_id: 'q-002', question_text: 'How well do they collaborate with colleagues across teams?',  rating_value: 4,    text_value: null },
          { question_id: 'q-004', question_text: 'How would you rate the quality of their technical work?',    rating_value: 4,    text_value: null },
          { question_id: 'q-009', question_text: "What are this person's greatest strengths?",                 rating_value: null, text_value: 'Reliable team member who consistently delivers quality work.' },
        ],
      },
      {
        reviewer_type: 'PEER',
        answers: [
          { question_id: 'q-001', question_text: 'How clearly does this person communicate ideas to the team?', rating_value: 4,    text_value: null },
          { question_id: 'q-002', question_text: 'How well do they collaborate with colleagues across teams?',  rating_value: 4,    text_value: null },
          { question_id: 'q-009', question_text: "What are this person's greatest strengths?",                 rating_value: null, text_value: 'Always willing to help and a great collaborator.' },
        ],
      },
    ],
  },
};

// ─── HR Dashboard ─────────────────────────────────────────────────────────────

export const HR_DASHBOARD = {
  'c-001': {
    cycle_id: 'c-001', cycle_name: 'Annual 360 Review — 2024', cycle_state: 'RESULTS_RELEASED',
    participation_rate: 94,
    submission_stats: [
      { reviewer_type: 'SELF',    total: '12', submitted: '12', locked: '0', pending: '0' },
      { reviewer_type: 'MANAGER', total: '9',  submitted: '9',  locked: '0', pending: '0' },
      { reviewer_type: 'PEER',    total: '28', submitted: '26', locked: '0', pending: '2' },
    ],
    nomination_stats: { total: 12, complete: 11, incomplete: 1 },
    department_scores: [
      { department: 'Engineering',        avg_overall: '3.95', avg_peer: '3.80', avg_manager: '4.10', participant_count: '4' },
      { department: 'Program Management', avg_overall: '4.20', avg_peer: '4.15', avg_manager: '4.25', participant_count: '2' },
      { department: 'Operations',         avg_overall: '3.82', avg_peer: '3.70', avg_manager: '3.95', participant_count: '3' },
      { department: 'Marketing',          avg_overall: '3.75', avg_peer: '3.60', avg_manager: '3.90', participant_count: '3' },
      { department: 'Human Resources',    avg_overall: '4.10', avg_peer: '4.00', avg_manager: '4.20', participant_count: '2' },
    ],
  },
  'c-002': {
    cycle_id: 'c-002', cycle_name: 'H1 2025 Performance Review', cycle_state: 'ACTIVE',
    participation_rate: 48,
    submission_stats: [
      { reviewer_type: 'SELF',    total: '12', submitted: '7',  locked: '0', pending: '5' },
      { reviewer_type: 'MANAGER', total: '9',  submitted: '5',  locked: '0', pending: '4' },
      { reviewer_type: 'PEER',    total: '24', submitted: '11', locked: '0', pending: '13' },
    ],
    nomination_stats: { total: 12, complete: 12, incomplete: 0 },
    department_scores: [],
  },
};

export const SUMMARY_STATS = {
  total_users: 15, active_cycles: 2, pending_tasks: 22, released_cycles: 1,
};

// ─── Manager Dashboard ────────────────────────────────────────────────────────

export const MANAGER_DASHBOARD = {
  'c-001': {
    cycle_id: 'c-001', cycle_name: 'Annual 360 Review — 2024', cycle_state: 'RESULTS_RELEASED',
    team: [
      { id: 'u-004', first_name: 'Divya', last_name: 'Menon',  email: 'employee@gamyam.com', department: 'Engineering',
        task_completion: { total_tasks: 10, submitted: 10 }, scores: { overall_score: '3.92', self_score: '4.30', manager_score: '3.80', peer_score: '3.75' } },
      { id: 'u-005', first_name: 'Rahul', last_name: 'Verma',  email: 'rahul@gamyam.com',    department: 'Engineering',
        task_completion: { total_tasks: 10, submitted: 10 }, scores: { overall_score: '4.15', self_score: '4.00', manager_score: '4.20', peer_score: '4.05' } },
      { id: 'u-006', first_name: 'Sneha', last_name: 'Pillai', email: 'sneha@gamyam.com',    department: 'Engineering',
        task_completion: { total_tasks: 10, submitted: 10 }, scores: { overall_score: '3.68', self_score: '3.50', manager_score: '3.80', peer_score: '3.55' } },
    ],
  },
  'c-002': {
    cycle_id: 'c-002', cycle_name: 'H1 2025 Performance Review', cycle_state: 'ACTIVE',
    team: [
      { id: 'u-004', first_name: 'Divya', last_name: 'Menon',  email: 'employee@gamyam.com', department: 'Engineering', task_completion: { total_tasks: 10, submitted: 4 }, scores: null },
      { id: 'u-005', first_name: 'Rahul', last_name: 'Verma',  email: 'rahul@gamyam.com',    department: 'Engineering', task_completion: { total_tasks: 10, submitted: 6 }, scores: null },
      { id: 'u-006', first_name: 'Sneha', last_name: 'Pillai', email: 'sneha@gamyam.com',    department: 'Engineering', task_completion: { total_tasks: 10, submitted: 2 }, scores: null },
    ],
  },
};

// ─── Notifications ────────────────────────────────────────────────────────────

export const NOTIFICATIONS = [
  { id: 'n-001', type: 'deadline', title: 'Review Deadline Approaching', message: 'You have 2 pending reviews due in 2 days',  link: '/employee/tasks',  is_read: false, created_at: '2025-02-20T10:00:00Z' },
  { id: 'n-002', type: 'info',     title: 'Cycle Started',               message: 'H1 2025 Performance Review is now active',   link: '/employee/tasks',  is_read: false, created_at: '2025-02-15T09:00:00Z' },
  { id: 'n-003', type: 'success',  title: 'Results Available',           message: 'Your Q4 2024 feedback results are ready',    link: '/employee/report', is_read: true,  created_at: '2024-12-20T10:00:00Z' },
  { id: 'n-004', type: 'warning',  title: 'Team Pending Reviews',        message: '5 team members have not submitted reviews',  link: '/manager/dashboard', is_read: false, created_at: '2025-02-19T14:00:00Z' },
];

// ─── Announcements ────────────────────────────────────────────────────────────

export const ANNOUNCEMENTS = [
  { id: 'ann-001', message: 'H1 2025 Performance Review is now open. Please complete your self-review by March 31st.', type: 'info',    is_active: true,  expires_at: '2025-03-31T23:59:00Z', created_at: '2025-02-01T08:00:00Z' },
  { id: 'ann-002', message: 'System maintenance scheduled for Sunday 2am–4am. Please save your work beforehand.',     type: 'warning', is_active: true,  expires_at: null,                    created_at: '2025-02-18T10:00:00Z' },
  { id: 'ann-003', message: 'Q4 2024 results are now released. Check your personal report page.',                     type: 'success', is_active: false, expires_at: null,                    created_at: '2024-12-20T10:00:00Z' },
];

// ─── Audit Logs ───────────────────────────────────────────────────────────────

export const AUDIT_LOGS = [
  { id: 'al-001', action_type: 'CREATE_CYCLE',    entity_type: 'review_cycle',  actor_email: 'hr@gamyam.com',      actor_first_name: 'Priya',  actor_last_name: 'Nair',   ip_address: '192.168.1.10', new_value: { name: 'H1 2025 Performance Review' },              created_at: '2025-01-10T08:30:00Z' },
  { id: 'al-002', action_type: 'CREATE_USER',     entity_type: 'users',         actor_email: 'admin@gamyam.com',   actor_first_name: 'Arjun',  actor_last_name: 'Sharma', ip_address: '192.168.1.5',  new_value: { email: 'pooja@gamyam.com' },                        created_at: '2025-01-05T14:30:00Z' },
  { id: 'al-003', action_type: 'SUBMIT_FEEDBACK', entity_type: 'reviewer_task', actor_email: 'employee@gamyam.com',actor_first_name: 'Divya',  actor_last_name: 'Menon',  ip_address: '192.168.1.42', new_value: { response_id: 'r-001' },                             created_at: '2025-02-10T14:22:00Z' },
  { id: 'al-004', action_type: 'RELEASE_RESULTS', entity_type: 'review_cycle',  actor_email: 'hr@gamyam.com',      actor_first_name: 'Priya',  actor_last_name: 'Nair',   ip_address: '192.168.1.10', new_value: { cycle: 'Annual 360 Review — 2024' },                created_at: '2024-12-20T10:00:00Z' },
  { id: 'al-005', action_type: 'EXPORT_REPORT',   entity_type: 'report',        actor_email: 'manager@gamyam.com', actor_first_name: 'Kiran',  actor_last_name: 'Reddy',  ip_address: '192.168.1.30', new_value: { reviewee_id: 'u-004', viewer_role: 'MANAGER' },      created_at: '2024-12-21T10:30:00Z' },
  { id: 'al-006', action_type: 'OVERRIDE_ACTION', entity_type: 'review_cycle',  actor_email: 'admin@gamyam.com',   actor_first_name: 'Arjun',  actor_last_name: 'Sharma', ip_address: '192.168.1.5',  new_value: { reason: 'Fixing accidental state', target: 'ACTIVE' }, created_at: '2025-01-20T16:10:00Z' },
];
