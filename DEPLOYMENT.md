# Deployment Guide — DevOps Playground

This guide covers running **DevOps Playground** (including **LAN Legends** at `/games/lan-legends`) in production and common hosting options.

Repository: [https://github.com/TheMalikFaheem/devops-playground](https://github.com/TheMalikFaheem/devops-playground)

---

## Prerequisites

| Requirement | Version |
|-------------|---------|
| Node.js | ≥ 18 |
| PostgreSQL | ≥ 13 |
| Git | any recent |

---

## 1. Clone and configure

```bash
git clone https://github.com/TheMalikFaheem/devops-playground.git
cd devops-playground
npm ci
cp .env.example .env
```

Edit `.env` for production:

```env
PORT=3000
NODE_ENV=production

DB_HOST=your-db-host
DB_PORT=5432
DB_NAME=devops_playground
DB_USER=your_db_user
DB_PASSWORD=your_strong_password

JWT_SECRET=use-a-long-random-string-at-least-32-chars
APP_VERSION=1.0.0
```

Generate a strong `JWT_SECRET`:

```bash
openssl rand -base64 48
```

---

## 2. Fresh VPS setup (Ubuntu/Debian as root)

If `npm run db:migrate` fails with an empty or connection error, PostgreSQL is usually **not installed**, **not running**, or **`.env` still has defaults**.

### 2.1 Install PostgreSQL

```bash
apt update
apt install -y postgresql postgresql-contrib
systemctl enable postgresql
systemctl start postgresql
systemctl status postgresql
```

### 2.2 Create database and user

```bash
sudo -u postgres psql <<'SQL'
CREATE USER devops_app WITH PASSWORD 'CHANGE_THIS_STRONG_PASSWORD';
CREATE DATABASE devops_playground OWNER devops_app;
GRANT ALL PRIVILEGES ON DATABASE devops_playground TO devops_app;
SQL
```

Replace `CHANGE_THIS_STRONG_PASSWORD` with a real password.

### 2.3 Configure `.env` on the server

```bash
cd ~/devops-playground   # or your clone path
nano .env
```

Use these values (match the user/password you created):

```env
PORT=3000
NODE_ENV=production

DB_HOST=127.0.0.1
DB_PORT=5432
DB_NAME=devops_playground
DB_USER=devops_app
DB_PASSWORD=CHANGE_THIS_STRONG_PASSWORD

JWT_SECRET=paste-output-of-openssl-rand-base64-48
APP_VERSION=1.0.0
```

Generate JWT secret:

```bash
openssl rand -base64 48
```

### 2.4 Test database connection

```bash
PGPASSWORD='CHANGE_THIS_STRONG_PASSWORD' psql -h 127.0.0.1 -U devops_app -d devops_playground -c 'SELECT 1'
```

If that works, migrate and seed:

```bash
npm run db:migrate
npm run db:seed
```

### 2.5 Run for production (not `npm run dev`)

```bash
npm start
```

Access from your machine: `http://YOUR_SERVER_IP:3000` (open port 3000 in firewall/security group if needed).

For a permanent service, use **systemd** (section 4 below) and **Nginx** on port 80/443 instead of exposing 3000 publicly.

### 2.6 Stop anything on port 3000

```bash
lsof -ti :3000 | xargs kill -9
```

---

## 3. Database setup (if Postgres already exists)

Create the database (on your PostgreSQL server):

```bash
createdb devops_playground
# Or via psql:
# CREATE DATABASE devops_playground;
```

Run migrations and optional seed:

```bash
npm run db:migrate
npm run db:seed   # optional — demo users/projects
```

---

## 4. Run locally (production mode)

```bash
npm start
```

Open `http://localhost:3000`. Health checks:

- Liveness: `GET /health`
- Readiness (includes DB): `GET /ready`
- Version: `GET /version`

### Stop a process on port 3000

If something is already bound to port 3000:

**macOS / Linux:**

```bash
lsof -ti :3000 | xargs kill -9
```

**Or change the port** in `.env`:

```env
PORT=3001
```

---

## 5. Deploy on a Linux VPS (systemd + Nginx)

### 5.1 Install app on the server

```bash
sudo apt update && sudo apt install -y nodejs npm postgresql nginx
# Prefer Node 18+ via nvm or NodeSource if distro packages are old

sudo mkdir -p /var/www/devops-playground
sudo chown $USER:$USER /var/www/devops-playground
cd /var/www/devops-playground
git clone https://github.com/TheMalikFaheem/devops-playground.git .
npm ci
cp .env.example .env
# Edit .env with production values
npm run db:migrate
```

### 5.2 systemd service

Create `/etc/systemd/system/devops-playground.service`:

```ini
[Unit]
Description=DevOps Playground Node App
After=network.target postgresql.service

[Service]
Type=simple
User=www-data
WorkingDirectory=/var/www/devops-playground
Environment=NODE_ENV=production
ExecStart=/usr/bin/node src/server.js
Restart=on-failure
RestartSec=5

[Install]
WantedBy=multi-user.target
```

Enable and start:

```bash
sudo systemctl daemon-reload
sudo systemctl enable devops-playground
sudo systemctl start devops-playground
sudo systemctl status devops-playground
```

### 5.3 Nginx reverse proxy

`/etc/nginx/sites-available/devops-playground`:

```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

```bash
sudo ln -s /etc/nginx/sites-available/devops-playground /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
```

Add TLS with [Certbot](https://certbot.eff.org/) when your domain points at the server.

---

## 6. Deploy on Render (PaaS)

1. Create a **PostgreSQL** instance on Render and note the internal connection URL.
2. Create a **Web Service** connected to `TheMalikFaheem/devops-playground`.
3. Settings:
   - **Build command:** `npm ci`
   - **Start command:** `npm start`
   - **Health check path:** `/health`
4. Environment variables (map from your DB URL):

   | Key | Example |
   |-----|---------|
   | `NODE_ENV` | `production` |
   | `PORT` | `3000` (Render sets this automatically; app reads `process.env.PORT`) |
   | `DB_HOST` | from Render Postgres |
   | `DB_PORT` | `5432` |
   | `DB_NAME` | database name |
   | `DB_USER` | user |
   | `DB_PASSWORD` | password |
   | `JWT_SECRET` | long random string |

5. **Deploy hook / shell** (one-time after first deploy):

   ```bash
   npm run db:migrate
   npm run db:seed
   ```

---

## 7. Deploy on Railway

1. New project → **Deploy from GitHub** → select `devops-playground`.
2. Add **PostgreSQL** plugin; Railway injects `DATABASE_URL` — map it to your app’s vars or extend `src/config/index.js` to parse `DATABASE_URL` if you add that support later.
3. Set `JWT_SECRET`, `NODE_ENV=production`, and DB variables to match Railway’s Postgres credentials.
4. Start command: `npm start`
5. Run migrations via Railway shell: `npm run db:migrate`

---

## 8. Production checklist

- [ ] `NODE_ENV=production`
- [ ] Strong, unique `JWT_SECRET` (never commit `.env`)
- [ ] PostgreSQL reachable from the app host
- [ ] `npm run db:migrate` completed
- [ ] `/health` and `/ready` return 200 (use `/ready` for orchestrator readiness)
- [ ] HTTPS terminated at reverse proxy or platform
- [ ] Firewall: only expose 80/443 publicly; keep Postgres private
- [ ] Remove or avoid `db:seed` in production if you do not want demo accounts

---

## 9. Verify deployment

```bash
curl -s https://your-domain.com/health
curl -s https://your-domain.com/ready
curl -s https://your-domain.com/version
```

In the browser:

- Home: `/`
- LAN Legends: `/games/lan-legends`

---

## 10. Troubleshooting

| Issue | Fix |
|-------|-----|
| `EADDRINUSE` port 3000 | Kill old process: `lsof -ti :3000 \| xargs kill -9` or set `PORT` in `.env` |
| Database connection failed on startup | Check `DB_*` vars, Postgres running, security groups/firewall |
| `/ready` returns non-200 | DB unreachable — fix credentials or network |
| 502 from Nginx | App not running — `systemctl status devops-playground` and app logs |
| Static game assets 404 | Ensure `src/public/` is deployed; Express serves `/games/lan-legends/*.js` from `public` |

---

## 11. Updating a live deployment

```bash
cd /var/www/devops-playground
git pull origin main
npm ci
npm run db:migrate
sudo systemctl restart devops-playground
```

For PaaS platforms, push to `main` and let the platform rebuild, then run migrations in the shell if schema changed.
