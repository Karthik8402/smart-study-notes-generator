# 🚂 Railway Deployment Guide

Deploy Smart Study Notes Generator to Railway in minutes!

## Files Created

| File | Location | Purpose |
|------|----------|---------|
| `railway.toml` | `backend/` | Railway config for Python backend |
| `railway.toml` | `frontend/` | Railway config for React frontend |
| `Dockerfile` | `backend/` | Docker build for better ML support |
| `.dockerignore` | `backend/` | Exclude unnecessary files |

---

## 🚀 Quick Deploy Steps

### Option 1: Deploy via Railway Dashboard (Easiest)

1. **Push to GitHub** (if not already done)
   ```bash
   git add .
   git commit -m "Add Railway deployment config"
   git push origin main
   ```

2. **Go to Railway**: https://railway.app
   - Sign up with GitHub

3. **Deploy Backend**:
   - Click **"New Project"** → **"Deploy from GitHub repo"**
   - Select your repository
   - Click on the project → **Settings** → Set **Root Directory** to `backend`
   - Go to **Variables** tab and add:
     ```
     MONGODB_URL=your_mongodb_connection_string
     GROQ_API_KEY=your_groq_api_key
     SECRET_KEY=your_random_secret_key
     DATABASE_NAME=smart_study_notes
     CHROMA_PERSIST_DIRECTORY=./chroma_db
     UPLOAD_DIRECTORY=./uploads
     DEBUG=False
     ```
   - Railway will auto-deploy!

4. **Deploy Frontend**:
   - Click **"New Project"** → **"Deploy from GitHub repo"**
   - Select the same repository
   - Set **Root Directory** to `frontend`
   - Add variable:
     ```
     VITE_API_URL=https://your-backend-name.railway.app
     ```

5. **Get Your URLs**:
   - Backend: `https://your-backend.railway.app`
   - Frontend: `https://your-frontend.railway.app`

---

### Option 2: Deploy via Railway CLI

```bash
# Install Railway CLI
npm install -g @railway/cli

# Login to Railway
railway login

# Deploy Backend
cd backend
railway init
railway link  # Select your project
railway up

# Deploy Frontend (in new terminal)
cd ../frontend
railway init
railway link  # Select your project
railway up
```

---

## ⚙️ Environment Variables

### Backend (Required)
| Variable | Description |
|----------|-------------|
| `MONGODB_URL` | MongoDB Atlas connection string |
| `GROQ_API_KEY` | Get free at https://console.groq.com |
| `SECRET_KEY` | Random string for JWT tokens |
| `DATABASE_NAME` | `smart_study_notes` |

### Backend (Optional - Google Integration)
| Variable | Description |
|----------|-------------|
| `GOOGLE_CREDENTIALS_JSON` | Base64-encoded Google OAuth credentials |

### Frontend (Required)
| Variable | Description |
|----------|-------------|
| `VITE_API_URL` | Your backend Railway URL |

---

## 🔐 Google Credentials Setup (For Calendar & Drive)

To enable Google Calendar and Drive integration on Railway:

### Step 1: Get your credentials.json
- Go to [Google Cloud Console](https://console.cloud.google.com)
- Create a project → Enable Calendar & Drive APIs
- Create OAuth 2.0 credentials → Download `credentials.json`

### Step 2: Convert to Base64
Run this command on your local machine:

**Windows (PowerShell):**
```powershell
[Convert]::ToBase64String([IO.File]::ReadAllBytes("backend\app\mcp\servers\credentials.json"))
```

**macOS/Linux:**
```bash
base64 -w 0 backend/app/mcp/servers/credentials.json
```

### Step 3: Add to Railway
- Copy the base64 output
- In Railway → Backend service → Variables
- Add: `GOOGLE_CREDENTIALS_JSON` = (paste the base64 string)

---

## 🔧 Troubleshooting

### Build Fails
- Check if `requirements.txt` has all dependencies
- Ensure Python version is 3.11 in settings

### Memory Issues
- Railway provides more memory than Render
- If still failing, remove `sentence-transformers` temporarily

### Frontend can't connect to Backend
- Make sure `VITE_API_URL` is set correctly
- Check CORS settings in `main.py` (already configured for `*`)

---

## 💰 Railway Pricing

- **Free Tier**: $5 free credits/month (enough for development)
- **Starter**: $5/month per service (for production)
- **Pro**: More resources for heavy ML workloads

---

## 📝 Notes

- Railway auto-detects `Dockerfile` and uses it for builds
- Data in `uploads/` and `chroma_db/` is ephemeral (resets on redeploy)
- For persistent storage, use Railway's Volume feature or external storage
