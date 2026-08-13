# Deploying to Hostinger Shared Hosting (Premium / Business)

This guide deploys the **whole app on one domain** so the Node backend serves the
React frontend + the `/api` routes + `/uploads` images from the same origin.

```
yourdomain.com/            -> React app (built frontend)
yourdomain.com/api/*       -> Express API
yourdomain.com/uploads/*   -> uploaded images
```

This avoids CORS entirely. (Your current git remote is GitLab; Hostinger's Git tool
supports GitHub **and** GitLab, so either works. See "Switch to GitHub" at the end.)

---

## Prerequisites

- Hostinger **Premium / Business** plan (has the Node.js feature + SSH).
- Your domain added to hPanel and pointing to Hostinger.
- SSH access enabled (hPanel → Advanced → SSH Access).

## 0. Commit the hosting changes locally first

```bash
git add -A
git commit -m "Configure for Hostinger same-origin hosting"
git push
```

---

## 1. Create the MySQL database

hPanel → **Databases → MySQL Databases**:

1. **Create a new database** → note the full name, e.g. `u123456789_catalogue`.
2. **Create a database user** → e.g. `u123456789_catuser`, set a strong password.
3. **Add user to the database** with **all privileges**.

You'll paste these into `backend/.env` on the server (Step 4). On Hostinger the
DB host is always `localhost`.

> The tables are created automatically by `initDb.js` on first boot, so you do
> **not** need to import `schema.sql` manually. (It is MariaDB-compatible if you
> prefer to import it via phpMyAdmin anyway.)

---

## 2. Create the Node.js application

hPanel → **Advanced → Node.js → Create Node.js app**:

| Field | Value |
|---|---|
| Node.js version | **20.x** (or 18.x) |
| Application root | `domains/<yourdomain>/app` (a fresh folder) |
| Application URL | **your main domain** (so `/` serves the frontend) |
| Application startup file | `app.js` |

Click **Create**. Hostinger creates the folder and a placeholder `app.js`.

---

## 3. Deploy the code with Git (GitHub or GitLab)

### Option A — Hostinger Git tool (recommended, "configure GitHub")

hPanel → **Advanced → Git**:

1. **Connect** → choose **GitHub** (or GitLab) → authorize.
2. Select your repository and branch (`main`).
3. Set the **deployment path** to the app root from Step 2, e.g.
   `domains/<yourdomain>/app`.
4. Click **Pull / Deploy**.

> If your repo is on GitLab today and you want GitHub: mirror it first
> (see "Switch to GitHub" below), then connect GitHub here.

### Option B — Clone over SSH (more control)

In hPanel → **SSH Access** note your SSH details, then on your machine:

```bash
ssh u123456789@yourdomain.com
cd domains/<yourdomain>/app
git clone https://github.com/<you>/digital-catalogue.git tmp
shopt -s dotglob && mv tmp/* tmp/.* . 2>/dev/null; rmdir tmp
```

---

## 4. Build the frontend + configure the backend (over SSH)

SSH into the server:

```bash
ssh u123456789@yourdomain.com
cd domains/<yourdomain>/app

# --- Backend deps ---
cd backend
cp .env.example .env
nano .env        # fill in DB + JWT_SECRET (Step 1 values); DB_HOST=localhost
npm install

# --- Frontend build (same-origin: VITE_API_BASE is empty in .env.production) ---
cd ../frontend
npm install
npm run build    # creates frontend/dist, which the backend serves

cd ..
```

> **No SSH?** Build `frontend/` locally (`npm install && npm run build`) and
> upload the resulting `frontend/dist/` folder via **hPanel → File Manager**
> (or FTP) so it sits next to `backend/`.

---

## 5. Restart the Node app

hPanel → **Advanced → Node.js** → your app → **Restart** (also click **Run NPM
Install** there once if you didn't via SSH).

Open `https://yourdomain.com/api/health` → you should see
`{"status":"healthy","mysql":"connected",...}`.
Then open `https://yourdomain.com/` → the catalogue loads.

Default admin login (seeded on first boot):
**admin@brand.com / password123** — change it immediately after first login.

---

## 6. Redeploying after future changes

1. `git push` your changes (GitHub/GitLab).
2. hPanel → **Git → Pull** (or `git pull` over SSH).
3. Rebuild if the frontend changed:
   ```bash
   cd domains/<yourdomain>/app/frontend && npm run build
   ```
4. hPanel → **Node.js → Restart**.

---

## Optional: auto-deploy with GitHub Actions

For hands-off deploys on every push, add `.github/workflows/deploy.yml` with an
SSH/FTP step. It must (a) build `frontend/dist`, (b) upload files via SSH/FTP to
the app root, (c) optionally trigger a restart. This needs repository secrets
(`HOST`, `USER`, `SSH_KEY`, `APP_PATH`). Only set this up once the manual flow
above is working — the manual Hostinger Git pull is simpler to start with.

---

## Switch your remote from GitLab to GitHub

```bash
# create an empty repo on GitHub first (no README), then:
git remote set-url origin https://github.com/<you>/digital-catalogue.git
git push -u origin main
```

---

## Troubleshooting

- **App shows 502 / "Application not responding"** → startup file must be `app.js`
  inside the app root, and the app root must be the `backend/`-containing folder
  (i.e. the repo root, so that `app.js` = `backend/app.js`). Check hPanel Node.js logs.
- **`Frontend build not found` 404** → you didn't run `npm run build` in
  `frontend/`, or `frontend/dist` isn't next to `backend/`.
- **DB errors** → confirm `DB_HOST=localhost` and that the DB user has privileges.
- **Images don't upload** → the `backend/uploads/` folder must be writable
  (chmod 755; created automatically on first upload).
- **Refresh on `/admin/products` gives 404** → the app wasn't assigned to the main
  domain, or a stale `.htaccess`/`public_html` is intercepting; ensure the Node app
  URL is your domain root.
- **CORS error** → you split frontend/backend onto different domains; set
  `CORS_ORIGIN=https://frontenddomain.com` in `backend/.env` and rebuild.
