# 🚀 DevOps Playground

A full-stack **Node.js + PostgreSQL** web application purpose-built for practicing real-world DevOps skills — from local development all the way to a fully automated CI/CD pipeline.

> **Why this project?** Instead of learning DevOps on abstract examples, you work with a real app that has users, authentication, database migrations, tests, and health-check endpoints — exactly what you'd encounter on the job.

---

## 📑 Table of Contents

- [Project Overview](#-project-overview)
- [Tech Stack](#-tech-stack)
- [Architecture](#-architecture)
- [Project Structure (What Already Exists)](#-project-structure-what-already-exists)
- [Getting Started Locally](#-getting-started-locally)
- [Deployment Guide](#-deployment-guide)
- [API Endpoints & Routes](#-api-endpoints--routes)
- [Testing](#-testing)
- [DevOps Roadmap — Files You Need to Create](#-devops-roadmap--files-you-need-to-create)
  - [Phase 1 — Environment & Configuration](#phase-1--environment--configuration)
  - [Phase 2 — Containerisation (Docker)](#phase-2--containerisation-docker)
  - [Phase 3 — Multi-Container Orchestration (Docker Compose)](#phase-3--multi-container-orchestration-docker-compose)
  - [Phase 4 — CI/CD Pipeline (Jenkins)](#phase-4--cicd-pipeline-jenkins)
  - [Phase 5 — Infrastructure as Code (Terraform) *(Optional)*](#phase-5--infrastructure-as-code-terraform-optional)
  - [Phase 6 — Configuration Management (Ansible) *(Optional)*](#phase-6--configuration-management-ansible-optional)
  - [Phase 7 — Kubernetes Deployment *(Optional)*](#phase-7--kubernetes-deployment-optional)
  - [Phase 8 — Monitoring & Observability *(Optional)*](#phase-8--monitoring--observability-optional)
- [Full File Checklist](#-full-file-checklist)
- [Demo Credentials](#-demo-credentials)
- [License](#-license)

---

## 🔎 Project Overview

DevOps Playground is a **project & task management** web app that lets users:

| Feature | Description |
|---------|-------------|
| **Register / Login** | JWT-based authentication with hashed passwords (bcrypt) |
| **Projects** | CRUD — create, view, edit, delete projects |
| **Tasks** | Nested under projects — track status (`todo`, `in-progress`, `done`) |
| **Notes / Incident Log** | Attach notes to projects (e.g. incident post-mortems) |
| **Admin Diagnostics** | Admin-only page showing hostname, uptime, app version, DB status |
| **Health & Readiness** | `/health`, `/ready`, `/version` endpoints for container orchestration |
| **LAN Legends** | In-browser networking puzzle — route packets, block malware (`/games/lan-legends`) |

---

## 🛠 Tech Stack

| Layer | Technology |
|-------|-----------|
| Runtime | Node.js |
| Framework | Express.js |
| View Engine | EJS (server-side rendered) |
| Database | PostgreSQL |
| Auth | JWT + bcryptjs |
| Testing | Jest + Supertest |
| Styling | Vanilla CSS (dark-mode, glassmorphism) |

---

## 🏗 Architecture

```
┌────────────────────────────────────────────────────────────────┐
│                        Browser / Client                        │
└──────────────────────────┬─────────────────────────────────────┘
                           │  HTTP
┌──────────────────────────▼─────────────────────────────────────┐
│                    Express.js  (app.js)                         │
│  ┌──────────┐  ┌────────────┐  ┌───────────┐  ┌────────────┐  │
│  │ Middleware│  │   Routes   │  │   Views   │  │   Config   │  │
│  │  (auth)  │  │ auth,proj, │  │  (EJS)    │  │ (env vars) │  │
│  │          │  │ tasks,notes│  │           │  │            │  │
│  │          │  │ health,    │  │           │  │            │  │
│  │          │  │ admin      │  │           │  │            │  │
│  └──────────┘  └─────┬──────┘  └───────────┘  └────────────┘  │
└──────────────────────┬─────────────────────────────────────────┘
                       │  SQL (pg)
┌──────────────────────▼─────────────────────────────────────────┐
│                    PostgreSQL Database                          │
│    users  │  projects  │  tasks  │  notes                      │
└────────────────────────────────────────────────────────────────┘
```

---

## 📂 Project Structure (What Already Exists)

```
devops-playground/
├── .env.example            # Template for environment variables
├── package.json            # Dependencies & npm scripts
├── src/
│   ├── server.js           # Entry point — starts the HTTP server
│   ├── app.js              # Express app setup (middleware, routes, error handling)
│   ├── config/
│   │   └── index.js        # Centralized config from env vars
│   ├── db/
│   │   ├── index.js        # PostgreSQL connection pool
│   │   ├── migrate.js      # Creates tables (users, projects, tasks, notes)
│   │   └── seed.js         # Populates demo data (admin + demo users, sample projects)
│   ├── middleware/
│   │   └── auth.js         # requireAuth & requireRole middleware
│   ├── routes/
│   │   ├── auth.js         # POST /auth/register, POST /auth/login, POST /auth/logout
│   │   ├── projects.js     # CRUD for projects
│   │   ├── tasks.js        # CRUD for tasks (nested under projects)
│   │   ├── notes.js        # Create/delete notes (nested under projects)
│   │   ├── health.js       # GET /health, /ready, /version
│   │   └── admin.js        # GET /admin/diagnostics (admin only)
│   ├── public/
│   │   └── styles.css      # Dark-mode UI styles
│   └── views/
│       ├── index.ejs           # Home / error page
│       ├── partials/
│       │   ├── header.ejs      # Navbar partial
│       │   └── footer.ejs      # Footer partial
│       ├── auth/
│       │   ├── login.ejs       # Login form
│       │   └── register.ejs    # Registration form
│       ├── projects/
│       │   ├── list.ejs        # All projects
│       │   ├── new.ejs         # New project form
│       │   ├── detail.ejs      # Project detail + tasks + notes
│       │   └── edit.ejs        # Edit project form
│       └── admin/
│           └── diagnostics.ejs # Admin diagnostics page
└── tests/
    ├── health.test.js      # Tests for /health, /ready, /version
    └── auth.test.js        # Tests for register, login, auth guard
```

---

## ⚡ Getting Started Locally

### Prerequisites

- **Node.js** ≥ 18
- **PostgreSQL** running locally (or via Docker — see Phase 3)

### Steps

```bash
# 1. Clone the repository
git clone https://github.com/TheMalikFaheem/devops-playground.git
cd devops-playground

# 2. Install dependencies
npm install

# 3. Create your .env file from the template
cp .env.example .env
# Edit .env with your local PostgreSQL credentials

# 4. Create the database (psql)
createdb devops_playground

# 5. Run migrations (creates tables)
npm run db:migrate

# 6. Seed demo data (optional but recommended)
npm run db:seed

# 7. Start the dev server (auto-restarts on file changes)
npm run dev

# 8. Open in browser
open http://localhost:3000
```

### Available NPM Scripts

| Script | Command | Description |
|--------|---------|-------------|
| `npm start` | `node src/server.js` | Start in production mode |
| `npm run dev` | `nodemon src/server.js` | Start with live-reload |
| `npm test` | `jest` | Run all tests |
| `npm run db:migrate` | `node src/db/migrate.js` | Create database tables |
| `npm run db:seed` | `node src/db/seed.js` | Insert demo data |

---

## 🚢 Deployment Guide

Full production deployment steps (VPS + systemd + Nginx, Render, Railway, env vars, and troubleshooting) are in **[DEPLOYMENT.md](./DEPLOYMENT.md)**.

Repository: [github.com/TheMalikFaheem/devops-playground](https://github.com/TheMalikFaheem/devops-playground)

Quick production start after DB is configured:

```bash
npm ci
npm run db:migrate
NODE_ENV=production npm start
```

---

## 🔗 API Endpoints & Routes

### Public (No Auth Required)

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/` | Home page |
| `GET` | `/games/lan-legends` | LAN Legends networking game |
| `GET` | `/health` | Returns `{ status: "ok" }` — liveness probe |
| `GET` | `/ready` | Returns `{ status: "ready", db: "ok" }` — readiness probe (checks DB) |
| `GET` | `/version` | Returns `{ version: "1.0.0" }` |
| `GET` | `/auth/login` | Login page |
| `GET` | `/auth/register` | Registration page |
| `POST` | `/auth/register` | Create account → sets JWT cookie → redirect `/projects` |
| `POST` | `/auth/login` | Authenticate → sets JWT cookie → redirect `/projects` |
| `POST` | `/auth/logout` | Clear JWT cookie → redirect `/` |

### Protected (Requires Login)

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/projects` | List all projects |
| `GET` | `/projects/new` | New project form |
| `POST` | `/projects` | Create a project |
| `GET` | `/projects/:id` | Project detail (tasks + notes) |
| `GET` | `/projects/:id/edit` | Edit project form |
| `POST` | `/projects/:id` | Update a project |
| `POST` | `/projects/:id/delete` | Delete a project |
| `POST` | `/projects/:projectId/tasks` | Create a task |
| `POST` | `/projects/:projectId/tasks/:taskId` | Update a task |
| `POST` | `/projects/:projectId/tasks/:taskId/delete` | Delete a task |
| `POST` | `/projects/:projectId/notes` | Create a note |
| `POST` | `/projects/:projectId/notes/:noteId/delete` | Delete a note |

### Admin Only

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/admin/diagnostics` | Hostname, uptime, env, app version, DB status |

---

## 🧪 Testing

Tests use **Jest** with **Supertest** and mock the database layer so no running PostgreSQL is needed.

```bash
npm test
```

**Existing tests:**
- `tests/health.test.js` — validates `/health`, `/ready`, `/version`
- `tests/auth.test.js` — validates register, login, and auth guards

---

## 🗺 DevOps Roadmap — Files You Need to Create

This is your step-by-step guide from zero DevOps to a fully automated CI/CD pipeline. Each phase builds on the previous one.

---

### Phase 1 — Environment & Configuration

> **Goal:** Ensure the app is production-aware and secrets are never hardcoded.

✅ **Already done:** `.env.example` exists, `src/config/index.js` reads all config from `process.env`.

**What you should verify:**
- [ ] Create your own `.env` from `.env.example` (it's `.gitignored`)
- [ ] Confirm the app starts without errors (`npm run dev`)
- [ ] Confirm tests pass (`npm test`)

**File to create:**

| File | Purpose |
|------|---------|
| `.gitignore` | Ensure `node_modules/`, `.env`, and `*.log` are ignored |

```gitignore
# .gitignore
node_modules/
.env
*.log
dist/
```

---

### Phase 2 — Containerisation (Docker)

> **Goal:** Package the application into a Docker image that runs anywhere.

**Files to create:**

| File | Purpose |
|------|---------|
| `Dockerfile` | Multi-stage build for the Node.js app |
| `.dockerignore` | Exclude unnecessary files from the Docker build context |

#### `Dockerfile`

```dockerfile
# ── Stage 1: Install dependencies ──────────────────────
FROM node:18-alpine AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

# ── Stage 2: Production image ──────────────────────────
FROM node:18-alpine
WORKDIR /app

# Create a non-root user for security
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

# Copy production dependencies and source code
COPY --from=deps /app/node_modules ./node_modules
COPY src/ ./src/
COPY package.json ./

# Switch to non-root user
USER appuser

# Expose the application port
EXPOSE 3000

# Health check (container orchestrators use this)
HEALTHCHECK --interval=30s --timeout=5s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://localhost:3000/health || exit 1

# Start the application
CMD ["node", "src/server.js"]
```

#### `.dockerignore`

```
node_modules
.env
.git
tests
*.md
.dockerignore
```

**Practice commands:**

```bash
# Build the image
docker build -t devops-playground:1.0.0 .

# Run the container (won't work fully without a DB yet — that's Phase 3)
docker run -p 3000:3000 --env-file .env devops-playground:1.0.0

# Verify the health endpoint
curl http://localhost:3000/health
```

---

### Phase 3 — Multi-Container Orchestration (Docker Compose)

> **Goal:** Run the app + PostgreSQL together with a single command.

**Files to create:**

| File | Purpose |
|------|---------|
| `docker-compose.yml` | Define `app` and `db` services |
| `docker-compose.override.yml` | *(Optional)* Dev overrides (mount source code, enable nodemon) |

#### `docker-compose.yml`

```yaml
version: "3.9"

services:
  db:
    image: postgres:16-alpine
    restart: unless-stopped
    environment:
      POSTGRES_DB: devops_playground
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
    ports:
      - "5432:5432"
    volumes:
      - pgdata:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 5s
      timeout: 3s
      retries: 5

  app:
    build: .
    restart: unless-stopped
    ports:
      - "3000:3000"
    environment:
      NODE_ENV: production
      PORT: 3000
      DB_HOST: db           # <-- Docker Compose service name
      DB_PORT: 5432
      DB_NAME: devops_playground
      DB_USER: postgres
      DB_PASSWORD: postgres
      JWT_SECRET: change-me-to-a-long-random-string
      APP_VERSION: 1.0.0
    depends_on:
      db:
        condition: service_healthy

volumes:
  pgdata:
```

#### `docker-compose.override.yml` *(Optional — for development)*

```yaml
version: "3.9"

services:
  app:
    build: .
    command: npx nodemon src/server.js
    volumes:
      - ./src:/app/src       # Live-reload on code changes
    environment:
      NODE_ENV: development
```

**Practice commands:**

```bash
# Start everything
docker compose up -d --build

# Run migrations inside the running container
docker compose exec app node src/db/migrate.js

# Seed demo data
docker compose exec app node src/db/seed.js

# Check logs
docker compose logs -f app

# Verify endpoints
curl http://localhost:3000/health
curl http://localhost:3000/ready

# Tear down
docker compose down -v    # -v removes the volume (fresh DB next time)
```

---

### Phase 4 — CI/CD Pipeline (Jenkins)

> **Goal:** Automate test → build → deploy on every commit — everything runs locally, no Docker Hub needed.

**Files to create:**

| File | Purpose |
|------|---------|
| `Jenkinsfile` | Declarative pipeline definition |

#### `Jenkinsfile`

```groovy
pipeline {
    agent any

    environment {
        IMAGE_NAME = 'devops-playground'
        IMAGE_TAG  = "${env.BUILD_NUMBER}"
    }

    stages {
        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('Install Dependencies') {
            steps {
                sh 'npm ci'
            }
        }

        stage('Run Tests') {
            steps {
                sh 'npm test'
            }
        }

        stage('Build Docker Image') {
            steps {
                echo "Building local Docker image: ${IMAGE_NAME}:${IMAGE_TAG}"
                sh "docker build -t ${IMAGE_NAME}:${IMAGE_TAG} ."
                sh "docker tag ${IMAGE_NAME}:${IMAGE_TAG} ${IMAGE_NAME}:latest"
            }
        }

        stage('Deploy Containers') {
            steps {
                echo 'Stopping any existing containers...'
                sh 'docker compose down || true'

                echo 'Starting app + database containers...'
                sh 'docker compose up -d --build'

                echo 'Waiting for database to be ready...'
                sh '''
                    for i in $(seq 1 30); do
                        docker compose exec -T db pg_isready -U postgres && break
                        echo "Waiting for DB... ($i/30)"
                        sleep 2
                    done
                '''
            }
        }

        stage('Run Migrations & Seed') {
            steps {
                echo 'Running database migrations...'
                sh 'docker compose exec -T app node src/db/migrate.js'

                echo 'Seeding demo data...'
                sh 'docker compose exec -T app node src/db/seed.js'
            }
        }

        stage('Verify Deployment') {
            steps {
                echo 'Verifying health endpoints...'
                sh '''
                    sleep 3
                    curl -f http://localhost:3000/health || exit 1
                    echo "\n✅ /health is OK"

                    curl -f http://localhost:3000/ready || exit 1
                    echo "\n✅ /ready is OK (DB connected)"

                    curl -f http://localhost:3000/version || exit 1
                    echo "\n✅ /version is OK"
                '''
            }
        }
    }

    post {
        success {
            echo '✅ Pipeline completed successfully! App is running at http://localhost:3000'
        }
        failure {
            echo '❌ Pipeline failed — stopping containers...'
            sh 'docker compose down || true'
        }
        always {
            cleanWs()
        }
    }
}
```

**What the pipeline does:**

```
 Checkout → Install Deps → Run Tests → Build Image (local) → Deploy via Docker Compose → Run Migrations → Verify Health
```

1. **Checkout** — pulls latest code from your repository
2. **Install Dependencies** — runs `npm ci` for a clean install
3. **Run Tests** — executes Jest test suite (fails fast if tests break)
4. **Build Docker Image** — builds `devops-playground:latest` locally (no push anywhere)
5. **Deploy Containers** — runs `docker compose up -d` to start app + PostgreSQL
6. **Run Migrations & Seed** — creates tables and inserts demo data
7. **Verify Deployment** — hits `/health`, `/ready`, `/version` to confirm everything works

**Jenkins Setup Checklist:**

- [ ] Install Jenkins locally (or via Docker: `docker run -p 8080:8080 -v /var/run/docker.sock:/var/run/docker.sock jenkins/jenkins:lts`)
- [ ] Install required plugins: **Pipeline**, **NodeJS**
- [ ] Ensure Docker is accessible from Jenkins (Jenkins user must be in the `docker` group)
- [ ] Create a "Pipeline" job pointing to your repo's `Jenkinsfile`
- [ ] Trigger a build and verify all stages pass
- [ ] After success, open `http://localhost:3000` to see the running app

---

### Phase 5 — Infrastructure as Code (Terraform) *(Optional)*

> **Goal:** Provision cloud infrastructure (e.g. an EC2 instance + RDS) automatically.

**Files to create:**

```
terraform/
├── main.tf              # Provider config and resource definitions
├── variables.tf         # Input variables (region, instance type, etc.)
├── outputs.tf           # Output values (public IP, DB endpoint)
├── terraform.tfvars     # Your variable values (gitignored)
└── .gitignore           # Ignore .terraform/, *.tfstate, *.tfvars
```

**What to define in `main.tf`:**
- AWS provider (or whichever cloud you use)
- VPC / Security Groups (allow ports 22, 3000, 5432)
- EC2 instance (to run Docker / Docker Compose)
- RDS PostgreSQL instance (managed database)

---

### Phase 6 — Configuration Management (Ansible) *(Optional)*

> **Goal:** Automate server setup — install Docker, deploy the app on provisioned machines.

**Files to create:**

```
ansible/
├── inventory.ini        # Target hosts (from Terraform outputs)
├── playbook.yml         # Main playbook
└── roles/
    └── app/
        ├── tasks/
        │   └── main.yml   # Install Docker, pull image, run docker-compose
        └── templates/
            └── docker-compose.yml.j2   # Templated compose file
```

**What the playbook should do:**
1. Install Docker and Docker Compose on the target server
2. Copy `docker-compose.yml` to the server
3. Pull the latest image from Docker Hub
4. Run `docker compose up -d`
5. Run migrations (`docker compose exec app node src/db/migrate.js`)

---

### Phase 7 — Kubernetes Deployment *(Optional)*

> **Goal:** Deploy on Kubernetes for scalability and self-healing.

**Files to create:**

```
k8s/
├── namespace.yml            # Dedicated namespace
├── app-deployment.yml       # App Deployment (replicas, health probes, env)
├── app-service.yml          # ClusterIP or LoadBalancer Service
├── db-statefulset.yml       # PostgreSQL StatefulSet with PVC
├── db-service.yml           # Headless Service for DB
├── configmap.yml            # Non-secret environment variables
├── secret.yml               # DB password, JWT_SECRET (base64-encoded)
└── ingress.yml              # (Optional) Ingress for domain routing
```

**Key Kubernetes concepts to practice:**
- **Liveness probe** → `GET /health` (the app already has this!)
- **Readiness probe** → `GET /ready` (checks DB connectivity!)
- **ConfigMaps** for `NODE_ENV`, `DB_HOST`, `APP_VERSION`
- **Secrets** for `DB_PASSWORD`, `JWT_SECRET`

---

### Phase 8 — Monitoring & Observability *(Optional)*

> **Goal:** Monitor the app in production with metrics, logs, and alerts.

**Files to create:**

```
monitoring/
├── prometheus.yml           # Prometheus scrape config
├── grafana/
│   └── dashboards/
│       └── app-dashboard.json  # Pre-built dashboard
└── docker-compose.monitoring.yml  # Prometheus + Grafana services
```

**What to add to the app:**
- A `/metrics` endpoint (using a library like `prom-client`)
- Expose request count, response time, error rate
- Grafana dashboards for visualization

---

## ✅ Full File Checklist

Here's every file you need to create as a DevOps engineer, in order:

| # | File | Phase | Priority |
|---|------|-------|----------|
| 1 | `.gitignore` | 1 — Environment | 🟢 Must |
| 2 | `Dockerfile` | 2 — Docker | 🟢 Must |
| 3 | `.dockerignore` | 2 — Docker | 🟢 Must |
| 4 | `docker-compose.yml` | 3 — Compose | 🟢 Must |
| 5 | `docker-compose.override.yml` | 3 — Compose | 🟡 Recommended |
| 6 | `Jenkinsfile` | 4 — CI/CD | 🟢 Must |
| 7 | `terraform/main.tf` | 5 — IaC | 🔵 Optional |
| 8 | `terraform/variables.tf` | 5 — IaC | 🔵 Optional |
| 9 | `terraform/outputs.tf` | 5 — IaC | 🔵 Optional |
| 10 | `ansible/playbook.yml` | 6 — Config Mgmt | 🔵 Optional |
| 11 | `ansible/inventory.ini` | 6 — Config Mgmt | 🔵 Optional |
| 12 | `k8s/app-deployment.yml` | 7 — Kubernetes | 🔵 Optional |
| 13 | `k8s/app-service.yml` | 7 — Kubernetes | 🔵 Optional |
| 14 | `k8s/db-statefulset.yml` | 7 — Kubernetes | 🔵 Optional |
| 15 | `k8s/secret.yml` | 7 — Kubernetes | 🔵 Optional |
| 16 | `monitoring/prometheus.yml` | 8 — Monitoring | 🔵 Optional |
| 17 | `monitoring/docker-compose.monitoring.yml` | 8 — Monitoring | 🔵 Optional |

---

## 🔑 Demo Credentials

After running `npm run db:seed`:

| Role | Email | Password |
|------|-------|----------|
| Admin | `admin@example.com` | `Admin123!` |
| User | `demo@example.com` | `Demo123!` |

> ⚠️ **Change these immediately in any non-local environment!**

---

## 📜 License

MIT
# ToolNest
