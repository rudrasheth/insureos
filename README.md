# InsureOS

## Deployment Instructions

### Frontend (Vercel)
1. Import this repository to Vercel.
2. **Crucial**: go to **Settings > General** and set **Root Directory** to `frontend`.
3. Add any environment variables if needed.
4. Deploy.

### Backend (Recommended: Railway)
Railway is better for Node.js/Express because it keeps the server running (unlike Vercel's serverless functions which can sleep/crash).

1.  **Sign up** at [Railway.app](https://railway.app).
2.  **New Project** -> **Deploy from GitHub repo**.
3.  Select your repo (`insureos`).
4.  **Important**: Click **Settings** -> **General** -> **Root Directory** and set it to `/backend`.
5.  **Variables**: Go to the **Variables** tab and add:
    *   `MONGO_URI`: `(Your MongoDB connection string)`
    *   `JWT_SECRET`: `insureos-secure-jwt-secret-key-2024`
    *   `PORT`: `4001` (Optional, Railway sets one automatically)
    *   `SMTP_USER` / `SMTP_PASS` (If you want emails)
6.  Click **Deploy**.

### Backend (Alternative: Vercel)
*Note: Vercel is optimized for Frontends. Backends may face "Cold Start" or "Timeout" 500 errors.*
1. Import repo.
2. Set Root Directory to `backend`.
3. Add Environment Variables.
4. Deploy.

## Project Structure
- `frontend/`: React + Vite + Tailwind CSS
- `backend/`: Node.js + Express + Prisma (SQLite local, requires change for prod)
