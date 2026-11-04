# Deploying DzRent

Production runs as a Docker Compose stack on a single VM, fronted by **nginx** and
exposed through **Cloudflare Tunnel** (TLS terminated at Cloudflare).

```
Cloudflare ─tunnel─► nginx (loopback) ─► Docker containers
  dzrent-agence.rayanemelzi.dev → :4269 ─►  /api → backend:3001 · / → frontend:3002
  dzrent.rayanemelzi.dev        → :4242 ─►  client app (Phase 3 — parked placeholder)
```

The backend is **never a public hostname** — the agency frontend and its API share
one origin (`dzrent-agence.rayanemelzi.dev`); nginx routes `/api/*` to the backend
container internally (so: no CORS).

## Stack (`docker-compose.prod.yml`)

| Service                  | Image                                         | Exposure         |
| ------------------------ | --------------------------------------------- | ---------------- |
| `postgres`               | postgis/postgis:16                            | internal only    |
| `redis`                  | redis:7                                       | internal only    |
| `minio` (+ `minio-init`) | minio/minio                                   | internal only    |
| `backend`                | built from `apps/backend/Dockerfile`          | `127.0.0.1:3001` |
| `frontend`               | built from `apps/agency-dashboard/Dockerfile` | `127.0.0.1:3002` |

The backend entrypoint runs `prisma migrate deploy` on every boot. Reference data
(58 wilayas, categories, legal clauses, config) is seeded **once** (see below).

---

## A. Continuous deployment (GitHub Actions)

CD lives on the **`production`** branch. Every push runs
[`.github/workflows/deploy.yml`](../.github/workflows/deploy.yml): it ships a
`git archive` (tracked files only) over cloudflared-Access SSH, writes `.env` from
secrets, and runs `docker compose -f docker-compose.prod.yml up -d --build` on the
server. The image builds on the VM — no registry, no GitHub deploy key needed.

### 1. Repository secrets

Settings → Secrets and variables → Actions:

| Secret                                                             | Value                                                         |
| ------------------------------------------------------------------ | ------------------------------------------------------------- |
| `VM_HOST`                                                          | `nanovm.rayanemelzi.dev` (the Access SSH hostname)            |
| `VM_USER`                                                          | `deploy`                                                      |
| `VM_SSH_KEY`                                                       | private key authorised for `deploy` (the `id_rsa_nanovm` key) |
| `VM_APP_DIR`                                                       | `/home/deploy/dzrent`                                         |
| `CF_ACCESS_CLIENT_ID`                                              | Cloudflare Access service-token Client ID                     |
| `CF_ACCESS_CLIENT_SECRET`                                          | Cloudflare Access service-token Client Secret                 |
| `APP_SECRET` `JWT_SECRET` `JWT_REFRESH_SECRET` `GPS_INGEST_SECRET` | each `openssl rand -hex 32` (all different)                   |
| `POSTGRES_PASSWORD` `S3_SECRET_KEY`                                | strong passwords                                              |

### 2. Cloudflare Access service token (one-time)

The runner can't log in via a browser, so it uses a service token:

1. Zero Trust → **Access → Service Auth → Service Tokens** → create one; copy the
   Client ID/Secret into the `CF_ACCESS_*` secrets.
2. Open the Access application protecting the `nanovm.rayanemelzi.dev` SSH app →
   **Policies** → add a policy _Action: Service Auth_ including that token.

### 3. Deploy

Push to `production` (or run the workflow manually). The `deploy` user only needs
to be in the `docker` group (it already is).

---

## B. First-time / manual deploy

```bash
# from a machine with `ssh nanovmdep` configured, in the repo root:
git archive HEAD | gzip > /tmp/app.tar.gz
scp /tmp/app.tar.gz nanovmdep:/tmp/
ssh nanovmdep '
  set -e
  mkdir -p ~/dzrent && find ~/dzrent -mindepth 1 -maxdepth 1 -exec rm -rf {} +
  tar xzf /tmp/app.tar.gz -C ~/dzrent && cd ~/dzrent
  cp .env.prod.example .env   # then edit .env: fill every CHANGE_ME (openssl rand -hex 32)
  docker compose -f docker-compose.prod.yml up -d --build
'
# one-time reference-data seed (runs the compiled seed; ts-node isn't in the slim runtime):
ssh nanovmdep 'cd ~/dzrent && docker compose -f docker-compose.prod.yml exec -T backend node dist/prisma/seed.js'
```

---

## C. nginx (one-time, needs sudo)

The Cloudflare tunnel hostnames point to local ports `4269` / `4242`; nginx listens
there and proxies to the containers.

```bash
sudo cp ~/dzrent/deploy/nginx/dzrent.conf /etc/nginx/sites-available/dzrent.conf
sudo ln -sf /etc/nginx/sites-available/dzrent.conf /etc/nginx/sites-enabled/dzrent.conf
sudo nginx -t && sudo systemctl reload nginx
```

(The tunnel hostname → port mapping itself is configured in the Cloudflare Zero
Trust dashboard: `dzrent-agence.rayanemelzi.dev` → `http://localhost:4269`,
`dzrent.rayanemelzi.dev` → `http://localhost:4242`.)

---

## D. Verify

```bash
# on the VM (internal):
curl -s http://127.0.0.1:3001/api/v1/health        # {"database":"up","redis":"up"}
curl -sI http://127.0.0.1:3002                      # 200 (frontend)
# publicly:
curl -sI https://dzrent-agence.rayanemelzi.dev      # 200
```

Then open `https://dzrent-agence.rayanemelzi.dev`, log in with an Algerian mobile
number; with the console SMS provider the OTP is in the backend logs:
`docker compose -f docker-compose.prod.yml logs -f backend`.

## Operations

```bash
cd ~/dzrent
docker compose -f docker-compose.prod.yml ps            # status
docker compose -f docker-compose.prod.yml logs -f backend
docker compose -f docker-compose.prod.yml down          # stop (volumes persist)
docker compose -f docker-compose.prod.yml down -v       # stop + WIPE data
```
