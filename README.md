# InsureOS

## Deployment Instructions

### Frontend (Vercel)
1. Import this repository to Vercel.
2. **Crucial**: go to **Settings > General** and set **Root Directory** to `frontend`.
3. Add any environment variables if needed.
4. Deploy.

### Backend (Render/Railway)
1. Import this repository.
2. Set **Root Directory** to `backend`.
3. **Database**: You must use a cloud database (PostgreSQL/MySQL) instead of SQLite (`dev.db`).
   - Update `schema.prisma` provider if changing DB.
   - Set `DATABASE_URL` in environment variables.

## Project Structure
- `frontend/`: React + Vite + Tailwind CSS
- `backend/`: Node.js + Express + Prisma (SQLite local, requires change for prod)
