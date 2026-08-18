## CoGNIFIN-AI (AI-SecureFinance)

CoGNIFIN-AI is a financial tracking and analytics platform. It helps users monitor spending, set budgets, track goals, and get insights from a dedicated Machine Learning service.

## Features & Capabilities

- **Intelligent Dashboard**: Cash flow, savings rate, and expense comparisons in one view.
- **Budget & Goal Tracking**: Monthly category budgets and progress toward savings goals, with alerts when spending goes over budget.
- **Financial Insights Chat**: A custom Python ML engine reviews transaction history, flags unusual activity, and answers questions about the user's own numbers.
- **Document Upload**: Bank statements and spreadsheets (`.pdf` / `.xlsx`) can be uploaded; the backend extracts text and highlights.
- **Secure Authentication**: JWT-protected routes and a profile page for account details.

---

## Technology Stack

### Frontend
- **Framework**: React 18 & Vite
- **Typing**: TypeScript
- **State Management**: Zustand
- **Styling**: Tailwind CSS, Class Variance Authority (CVA)
- **Component Primitives**: Radix UI
- **Charts & Motion**: Recharts, Framer Motion
- **Icons**: Lucide React

### Backend (Core Server)
- **Runtime**: Node.js & Express.js
- **Database**: MySQL
- **Security**: JSON Web Tokens (JWT), bcrypt
- **Document Extractors**: `pdf-parse`, `xlsx`

### Machine Learning Service
- **Platform**: Python 3.10+
- **Server**: FastAPI & Uvicorn (port `8000`)
- **Libraries**: Pandas, NumPy, PyTorch, scikit-learn
- **Models**: LSTM spending prediction (`spending_lstm_model.pth`), statistical / ensemble anomaly detection

---

## Project Structure

```text
AI-SecureFinanace-PLatform/
├── frontend/                 # Vite + React client
├── src/                      # Express API
├── ml-service/               # FastAPI ML service
├── database/                 # SQL schema (init.sql)
├── deploy/                   # AWS Lightsail demo notes
├── docker-compose.yml        # One-box Docker demo stack
├── Dockerfile.api            # Node API image
├── server.js                 # API entrypoint
├── .env.example              # Env template (copy to .env; do not commit .env)
└── README.md
```

---

## Local development

1. Copy `.env.example` to `.env` and set MySQL plus JWT secrets.
2. Create tables (for example `node init-database.js` or run `database/init.sql`).
3. Start the three processes:

**API** (repo root, port `5000`):

```bash
npm install
npm run dev
```

**Frontend**:

```bash
cd frontend
npm install
npm run dev
```

**ML service** (port `8000`):

```bash
cd ml-service
pip install -r requirements.txt
pip install torch --index-url https://download.pytorch.org/whl/cpu
uvicorn api:app --host 127.0.0.1 --port 8000
```

Demo user after database init: `test@example.com` / `test123`

---

## AWS deployment (cheap demo)

The public demo runs on **one Amazon Lightsail Ubuntu instance** with **Docker Compose**. MySQL, the Node API, the Python ML service, and Nginx (frontend) all run on that VM. This avoids RDS, ECS, and a load balancer.

| Piece | Runs as |
|--------|---------|
| Website | `web` container (Nginx) |
| API | `api` container |
| ML | `ml` container |
| Database | `mysql` container |

Nginx serves the React build and proxies `/api` to Node and `/ml` to FastAPI.

**Why Lightsail:** one cheap always-on box. Use **4 GB RAM** so PyTorch does not run out of memory.

**Why Docker Compose:** one command starts the full stack with the same internal networking (`api` talks to `mysql` and `ml`).

**Why port 8080:** on the demo instance, host port **80** was already in use, so the site is published as `http://PUBLIC_IP:8080`. Open TCP **8080** in the Lightsail firewall.

### Short steps

1. Create a Lightsail Ubuntu instance (4 GB). Allow SSH and TCP **8080**.
2. Install Docker, clone the repo.
3. `cp .env.example .env` and set passwords. Never commit `.env`.
4. `docker compose up -d --build`
5. Open `http://YOUR_PUBLIC_IP:8080`

If port 80 is free, you can map `"80:80"` instead and use `http://YOUR_PUBLIC_IP`.

Full walkthrough: [deploy/README.md](deploy/README.md)
