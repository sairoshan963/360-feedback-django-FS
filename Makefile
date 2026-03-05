# ─── Gamyam 360° Feedback — Django Stack ─────────────────────────────────────
# Usage:
#   make up          → start all services (build if needed)
#   make down        → stop all services
#   make logs        → tail all container logs
#   make migrate     → run migrations inside running backend container
#   make shell       → open Django shell inside backend container
#   make test        → run all pytest tests (local venv, no Docker needed)
#   make superadmin  → create superadmin inside running backend container
#   make seed        → seed demo users, departments, org hierarchy, template
#   make seed-cycle  → create a live NOMINATION demo cycle (10-min window)
#   make seed-demo   → create 4 demo cycles covering all lifecycle states

COMPOSE  = docker compose
BACKEND  = $(COMPOSE) exec backend

# ─── Docker commands ──────────────────────────────────────────────────────────

.PHONY: up
up:
	$(COMPOSE) up -d --build

.PHONY: up-logs
up-logs:
	$(COMPOSE) up --build

.PHONY: down
down:
	$(COMPOSE) down

.PHONY: restart
restart:
	$(COMPOSE) restart

.PHONY: logs
logs:
	$(COMPOSE) logs -f

.PHONY: logs-backend
logs-backend:
	$(COMPOSE) logs -f backend

.PHONY: ps
ps:
	$(COMPOSE) ps

# ─── Django management ────────────────────────────────────────────────────────

.PHONY: migrate
migrate:
	$(BACKEND) python manage.py migrate

.PHONY: makemigrations
makemigrations:
	$(BACKEND) python manage.py makemigrations

.PHONY: superadmin
superadmin:
	$(BACKEND) python manage.py init_superadmin

.PHONY: seed
seed:
	$(BACKEND) python manage.py seed_users

.PHONY: seed-cycle
seed-cycle:
	$(BACKEND) python manage.py seed_cycle

.PHONY: seed-demo
seed-demo:
	$(BACKEND) python manage.py seed_demo

.PHONY: shell
shell:
	$(BACKEND) python manage.py shell

.PHONY: collectstatic
collectstatic:
	$(BACKEND) python manage.py collectstatic --noinput

# ─── Local development (no Docker) ───────────────────────────────────────────

.PHONY: dev
dev:
	cd backend && source venv/bin/activate && python manage.py runserver

.PHONY: test
test:
	cd backend && source venv/bin/activate && python -m pytest apps/ -v

.PHONY: test-fast
test-fast:
	cd backend && source venv/bin/activate && python -m pytest apps/ -x -q

# ─── Database helpers ─────────────────────────────────────────────────────────

.PHONY: db-shell
db-shell:
	$(COMPOSE) exec db psql -U gamyam_user -d gamyam_360_django

.PHONY: db-backup
db-backup:
	$(COMPOSE) exec db pg_dump -U gamyam_user gamyam_360_django > backup_$$(date +%Y%m%d_%H%M%S).sql

# ─── Clean ────────────────────────────────────────────────────────────────────

.PHONY: clean
clean:
	$(COMPOSE) down -v --remove-orphans

.PHONY: clean-pycache
clean-pycache:
	find backend -type d -name __pycache__ -exec rm -rf {} + 2>/dev/null; true
