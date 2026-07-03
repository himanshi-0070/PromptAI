# Production Deployment Guide — PromptAI Workspace

This guide explains how to deploy PromptAI as a secure, production-ready SaaS application on **Vercel** (Frontend), **Render** (Backend), and **MongoDB Atlas** (Database).

---

## 📋 Prerequisites
1. **Google Cloud Console Account**: For setting up Google OAuth Client Credentials.
2. **MongoDB Atlas Account**: For hosting a managed database cluster.
3. **Google Gemini API Key**: For AI code generation capabilities.
4. **Vercel Account**: For hosting the React SPA.
5. **Render Account**: For running the Express API server container.

---

## 🗄️ 1. MongoDB Atlas Database Setup
1. Log in to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas).
2. Click **Create Database** and provision a free **M0 Shared Cluster**.
3. Create a database user credential (remember the username and password).
4. Under **Network Access**, add `0.0.0.0/0` to allow the backend server (on Render) to connect.
5. Copy the connection string format:
   `mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/promptai?retryWrites=true&w=majority`

---

## 🔑 2. Google OAuth Credentials Setup
1. Open the [Google Cloud Console](https://console.cloud.google.com/).
2. Select or create a project. Go to **APIs & Services** > **Credentials**.
3. Click **Create Credentials** > **OAuth Client ID**.
4. Configure the OAuth Consent Screen:
   * Select **External**, input app details, and set scope permissions.
5. In client configuration:
   * **Application type**: Web Application.
   * **Authorized JavaScript origins**:
     * Add local development: `http://localhost:5173`
     * Add Vercel production: `https://your-app-name.vercel.app`
6. Copy the generated **Client ID** (e.g. `xxxx.apps.googleusercontent.com`).

---

## ⚡ 3. Backend Deployment on Render
1. Log in to [Render](https://render.com/).
2. Click **New +** > **Web Service**.
3. Connect your project Git repository.
4. Configure the service:
   * **Name**: `promptai-api`
   * **Environment**: `Node`
   * **Region**: Choose closest to your database cluster.
   * **Build Command**: `cd server && npm install`
   * **Start Command**: `cd server && node server.js`
   * **Instance Type**: Free/Starter tier.
5. Open **Environment Variables** and add:
   * `NODE_ENV` = `production`
   * `PORT` = `10000` (Render handles port routing automatically)
   * `MONGO_URI` = `your-mongodb-atlas-uri`
   * `GEMINI_API_KEY` = `your-google-gemini-api-key`
   * `GEMINI_MODEL` = `gemini-2.5-flash`
   * `JWT_SECRET` = `generate-long-random-string`
   * `CLIENT_URL` = `https://your-app-name.vercel.app`
6. Deploy the service and copy the Render URL (e.g. `https://promptai-api.onrender.com`).

---

## 📐 4. Frontend Deployment on Vercel
1. Log in to [Vercel](https://vercel.com).
2. Click **Add New** > **Project** and select your Git repository.
3. Configure the build parameters:
   * **Framework Preset**: `Vite` (or Other)
   * **Root Directory**: `client`
   * **Build Command**: `npm run build`
   * **Output Directory**: `dist`
4. Expand **Environment Variables** and add:
   * `VITE_GOOGLE_CLIENT_ID` = `your-google-client-id`
5. Go to Vercel project settings and add a **Rewrites** rules configuration in a `vercel.json` file to route API traffic:
   ```json
   {
     "rewrites": [
       { "source": "/api/(.*)", "destination": "https://promptai-api.onrender.com/api/$1" }
     ]
   }
   ```
6. Click **Deploy**.

---

## 🛠️ Troubleshooting & Known Issues

### 1. Google Client script not loaded / login failing
* Check that you added the production Vercel domain inside Google OAuth console under **Authorized JavaScript origins**.

### 2. Cookies not persisting in Production
* Since frontend and backend run on different domains, verify CORS credentials headers options are enabled and the Render domain has CORS configuration mapped correctly to the Vercel URL.

### 3. Git binary missing errors
* In case the hosting cloud runner doesn't have Git installed, configure a custom Docker deployment container on Render containing the `git` package.
