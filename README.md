# Secure Score Ops — Azure Static Web App

Microsoft Defender Secure Score Implementation Assistant, deployed as an **Azure Static Web App** with **Azure Functions** backend.

## Architecture

```
securescore/
├── frontend/                   ← React + TypeScript + Vite + Tailwind
│   ├── src/
│   └── public/
│       └── staticwebapp.config.json
├── api/                        ← Azure Functions (serverless backend)
│   ├── generate/index.js       ← POST /api/generate
│   ├── script/index.js         ← POST /api/script
│   ├── health/index.js         ← GET  /api/health
│   ├── shared/gemini.js        ← Shared Gemini AI logic
│   └── package.json
├── .github/
│   └── workflows/
│       └── deploy.yml          ← Auto-deploy on git push
└── staticwebapp.config.json    ← SWA routing rules
```

---

## Deploy to Azure (Step-by-Step)

### Step 1 — Push code to GitHub

1. Go to **github.com** → click **New repository**
2. Name it `securescore-ops` → **Create repository**
3. Open a terminal in your project folder and run:

```bash
git init
git add .
git commit -m "initial commit"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/securescore-ops.git
git push -u origin main
```

### Step 2 — Create the Azure Static Web App

1. Go to **portal.azure.com**
2. Click **Create a resource** → search **Static Web App** → **Create**
3. Fill in:
   - **Resource Group**: Create new → `securescore-rg`
   - **Name**: `securescore-ops`
   - **Plan type**: **Free**
   - **Region**: East US 2 (or closest to you)
   - **Deployment source**: **GitHub**
4. Click **Sign in with GitHub** → authorise Azure
5. Select your **organisation**, **repository** (`securescore-ops`), **branch** (`main`)
6. **Build details**:
   - Build Preset: **Custom**
   - App location: `frontend`
   - Api location: `api`
   - Output location: `dist`
7. Click **Review + Create** → **Create**

Azure will automatically add the deploy token to your GitHub repo secrets and trigger the first deployment.

### Step 3 — Add your Gemini API key

1. In Azure portal → your Static Web App → **Settings → Environment variables**
2. Click **+ Add**:
   - Name: `GEMINI_API_KEY`
   - Value: `AIzaSy-your-key-here`
3. Click **Save**

### Step 4 — Done!

Wait ~2 minutes for the GitHub Action to complete, then go to:

`https://securescore-ops.azurestaticapps.net`

Share this URL with your team. Every `git push` to `main` auto-redeploys.

---

## Local Development

### Option A — With Azure SWA CLI (recommended, closest to production)

```bash
# Install SWA CLI globally (once)
npm install -g @azure/static-web-apps-cli

# Install dependencies
cd api && npm install
cd ../frontend && npm install

# Create api/.env for local dev
echo "GEMINI_API_KEY=AIzaSy-your-key" > api/.env

# Start everything (frontend + functions emulator)
swa start http://localhost:5173 --api-location api --run "cd frontend && npm run dev"
```

Open **http://localhost:4280**

### Option B — Quick frontend-only dev (no API calls)

```bash
cd frontend && npm install && npm run dev
```

Open **http://localhost:5173** (API calls will fail without functions running)

---

## Cost

| Resource | Cost |
|---|---|
| Azure Static Web App (Free tier) | **$0/month** |
| Azure Functions (included in SWA) | **$0/month** |
| Gemini 2.0 Flash API | **$0/month** (free tier) |
| **Total** | **$0/month** |

Free tier limits: 100GB bandwidth/month, 0.5GB storage, 2 custom domains.

---

## Automatic Deployments

Every `git push` to `main` triggers `.github/workflows/deploy.yml` which:
1. Installs frontend dependencies
2. Builds the React app
3. Installs API dependencies
4. Deploys everything to Azure

Pull requests automatically get **staging preview URLs** for testing before merging.
