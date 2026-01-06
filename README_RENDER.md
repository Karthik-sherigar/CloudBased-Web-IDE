# 🚀 Deploying to Render.com (Free Tier)

This guide provides step-by-step instructions on how to deploy the Cloud-Based Web IDE to Render for free.

## 📝 Overview
Render allows you to deploy Dockerized applications. Since our project has both a **Frontend** (Client) and a **Backend** (Server), we will deploy them as two separate **Web Services**.

---

## 1️⃣ Deploying the Backend (Server)

1.  **Log in** to your [Render Dashboard](https://dashboard.render.com/).
2.  Click **New +** and select **Web Service**.
3.  Connect your GitHub repository.
4.  **Configure the Service**:
    *   **Name**: `cloud-ide-server`
    *   **Root Directory**: `server`
    *   **Runtime**: `Docker`
5.  **Environment Variables**:
    *   Add a variable: `PORT` = `10000` (Render's default)
6.  Click **Create Web Service**.

> [!IMPORTANT]
> Once the server is deployed, copy its **URL** (e.g., `https://cloud-ide-server.onrender.com`). You will need this for the frontend.

---

## 2️⃣ Deploying the Frontend (Client) as a Static Site

Deploying the frontend as a **Static Site** is faster and completely free on Render.

1.  Click **New +** and select **Static Site**.
2.  Connect the same GitHub repository.
3.  **Configure the Service**:
    *   **Name**: `cloud-ide-client`
    *   **Root Directory**: `client`
    *   **Build Command**: `npm install && npm run build`
    *   **Publish Directory**: `dist`
4.  **Environment Variables**:
    *   Add a variable: `VITE_SERVER_URL` = `[YOUR_SERVER_URL]` (e.g., `https://cloud-ide-server.onrender.com`)
5.  Click **Create Static Site**.

> [!TIP]
> Static sites are served via a global CDN, making your frontend load much faster than if it were in a container!

---

## ⚠️ Free Tier Limitations

*   **Spin Down**: Render's free services spin down after 15 minutes of inactivity. When you first visit the site, it might take ~60 seconds to start.
*   **Memory**: The free tier has limited RAM. Large projects might hit limits.
*   **No Persistent Disk**: On the free tier, files created in the `/user` directory will be **deleted** when the server restarts or spins down.

---

## 💡 Pro Tip
You can use [UptimeRobot](https://uptimerobot.com/) or a similar service to ping your Render URL every 14 minutes to keep it from spinning down!
