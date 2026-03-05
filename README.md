# Gamyam 360° Feedback System — Django

A completely independent rebuild of the 360° Feedback platform using Django + DRF.
Same features, same business logic — different tech stack.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Backend | Django 6, Django REST Framework |
| Auth | JWT (simplejwt) + Google OAuth (allauth) |
| Database | PostgreSQL 16 |
| Background Jobs | Celery + Celery Beat + Redis |
| Frontend | React + Vite (separate folder) |
| Deploy | Docker + Docker Compose |

---

## Quick Start (Docker — fully standalone)

```bash
cd 360_Django
cp backend/.env.example backend/.env   # fill in your values
docker compose up --build
```

App is running at:
- Frontend → http://localhost:5173
- Backend API → http://localhost:8000
- Swagger Docs → http://localhost:8000/api/docs/
- Django Admin → http://localhost:8000/admin/

---

## Quick Start (Local Dev)

```bash
cd backend
python3 -m venv venv && source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env     # set DB_HOST=localhost, fill in DB_PASSWORD
python manage.py migrate
python manage.py createsuperuser
python manage.py runserver
```

---

## Project Structure

```
360_Django/
├── backend/
│   ├── apps/
│   │   ├── users/               # User model, departments, org hierarchy
│   │   ├── auth_app/            # Login, JWT, Google OAuth, password reset
│   │   ├── review_cycles/       # Cycles, templates, state machine
│   │   ├── reviewer_workflow/   # Nominations, task assignment
│   │   ├── feedback/            # Submission, aggregation, reports
│   │   ├── dashboard/           # Role-based stats
│   │   ├── notifications/       # In-app notifications
│   │   ├── audit/               # Audit log
│   │   ├── announcements/       # HR notice board
│   │   └── support/             # Bug/issue reports
│   ├── config/
│   │   ├── settings/
│   │   │   ├── base.py          # Shared settings
│   │   │   ├── local.py         # Development
│   │   │   └── production.py    # Production
│   │   ├── urls.py              # Root URL config
│   │   └── celery.py            # Celery + Beat schedule
│   ├── shared/
│   │   ├── permissions.py       # IsHRAdmin, IsManager, IsSuperAdmin
│   │   ├── exceptions.py        # Custom error responses
│   │   └── email.py             # Email helpers
│   └── requirements.txt
├── frontend/                    # React app
└── docker-compose.yml
```

---

## Roles

| Role | Access |
|---|---|
| `SUPER_ADMIN` | Everything |
| `HR_ADMIN` | Cycles, templates, reports, announcements |
| `MANAGER` | Team tasks, nominations, direct report results |
| `EMPLOYEE` | Submit feedback, nominate peers, own report |

---

## API Endpoints

| Base | Description |
|---|---|
| `/api/v1/auth/` | Login, logout, Google OAuth, password reset |
| `/api/v1/users/` | User + org management |
| `/api/v1/cycles/` | Review cycles + templates |
| `/api/v1/tasks/` | Reviewer tasks + nominations |
| `/api/v1/feedback/` | Submit feedback + reports |
| `/api/v1/dashboard/` | Role-based dashboard stats |
| `/api/v1/notifications/` | In-app notifications |
| `/api/v1/audit/` | Audit logs (Super Admin) |
| `/api/v1/announcements/` | HR announcements |
| `/api/v1/support/` | Support tickets |
| `/api/docs/` | Swagger UI |
| `/health/` | Health check |
| `/admin/` | Django Admin |
