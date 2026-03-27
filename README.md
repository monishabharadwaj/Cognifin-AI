## CoGNIFIN-AI (AI-SecureFinance)

## CoGNIFIN-AI is a comprehensive, production-ready financial tracking and analytics platform. Engineered with a scalable microservices-inspired architecture, this platform empowers users to effortlessly monitor their spending habits, enforce proactive budgeting, track long-term financial goals, and glean intelligent insights through natively integrated Machine Learning operations.

## Features & Capabilities

- **Intelligent Dashboard**: A unified, split-pane dashboard seamlessly surfacing Cash Flow trajectories, automated Savings Rate calculations, and Expense comparisons in real-time.
- **Proactive Budget & Goal Tracking**: Users can allocate precise monthly boundaries across diverse spending categories while simultaneously charting cumulative progress against target savings milestones (e.g., House Downpayments, Vacations). Alerts strictly surface only during mathematically detected over-expenditures.
- **Data-Driven Semantic Conversational Agent (Financial Insights)**: A completely custom Python ML-engine processes raw transaction histories continuously, identifying anomalous activity (LSTMs) and offering users an interactive chat proxy capable of retrieving ad-hoc proportional metric breakdowns on their finances securely without hallucinations.
- **Automated Document Intelligence**: Users can natively upload unstructured Bank Statements or financial spreadsheets (`.pdf` / `.xlsx`). The backend leverages file stream ingestion to feed robust textual summaries exactly identifying the document's central highlights instantaneously.
- **Secure Authentication & Profiling**: Fully gated routing powered by cryptographically protected JWTs ensures user payloads remain completely abstracted. A flexible Profile registry ensures the end-user has granular access over their identifying fields.

---

## Technology Stack

The platform is strictly typed and modularized using advanced architectural patterns spanning three deeply integrated layers.

### Frontend
- **Framework**: React 18 & Vite
- **Typing**: TypeScript
- **State Management**: Zustand (Scalable, asynchronous store hooks)
- **Styling**: Tailwind CSS, Class Variance Authority (CVA)
- **Component Primitives**: Radix UI (Headless accessible interfaces)
- **Motions & Visualizations**: Framer Motion (Route animators), Recharts (SVG metric rendering)
- **Icons**: Lucide React

### Backend (Core Server)
- **Runtime**: Node.js & Express.js
- **Database**: MySQL (Relational storage layer utilizing atomic parameterized queries bridging `users`, `budgets`, and `financial_goals`)
- **Transport**: Axios & Native REST
- **Security**: JSON Web Tokens (JWT), bcrypt.js (Password hashing)
- **Document Extractors**: `pdf-parse`, `xlsx`

### Machine Learning Service & Models
- **Platform**: Python 3.10+
- **Server**: FastAPI & Uvicorn (Hosting port `8000`)
- **Data Engineering**: Pandas, NumPy
- **Neural Layer**: PyTorch, scikit-learn

#### Core AI/ML Implementations
The platform leverages a hybrid intelligence approach combining deterministic statistical engines with Deep Learning inference to evaluate financial health securely:

1. **Sequential Deep Learning (LSTM predictive modeling)**: 
   The platform integrates a custom **Long Short-Term Memory (LSTM)** neural network built on PyTorch (`spending_lstm_model.pth`). Before inference, time-series transaction histories are pre-processed and normalized strictly using `scikit-learn` (`scaler.save`). The LSTM architecture excels at mapping sequential historical dependencies, mathematically projecting the user's anticipated end-of-month cash flow and categorized spending drifts based on recurring payment cycles.
   
2. **Heuristic Natural Language Processing (NLP)**: 
   Instead of relying on broad, potentially hallucinating third-party LLMs, the central `FinancialAIEngine` (`ai_financial_engine.py`) operates via zero-shot heuristic semantic routing. It processes user chat inputs through localized tokenization (e.g., extracting temporal markers, intent verbs like "reduce", and categorical nouns). The engine cross-references these semantic tokens instantly against the user's isolated array geometries, generating deterministic, exact-integer responses safely.

3. **Statistical Anomaly Detection Engine**: 
   The backend continuously fires transaction payloads through a multi-variate statistical evaluation loop calculating mean regressions and standard deviation thresholds. When the engine detects geometric deviations (i.e. `max_spend > baseline_average * 3`) or distinct Week-Over-Week (`WoW`) trajectory differentials stretching beyond `200%`, it trips the Anomaly Pipeline. This directly pipes `High Risk` markers explicitly onto the React DOM notifying the user without manual spreadsheet reviews.

---

## Complete Project Structure

```text
c:\Users\Hp\OneDrive\Desktop\AI-SecureFinanace-PLatform\
│
├── frontend/                                   # Client-side React application
│   ├── public/                                 # Static assets overrides
│   ├── src/                                    # Application root logic
│   │   ├── components/                         # Granular UI elements and Layout wrappers
│   │   │   ├── charts/                         # Recharts wrapper primitives
│   │   │   ├── dashboard/                      # Granular cards built for the overview page
│   │   │   ├── layout/                         # Core AppSidebar and Navbar wrappers
│   │   │   └── ui/                             # Tailwind-driven base UI toolkit
│   │   ├── hooks/                              # Custom React hook utilities (e.g. useToast)
│   │   ├── pages/                              # Top-level route pages (Login, Dashboard, Profile, etc.)
│   │   ├── services/                           # API Axios interface controllers
│   │   ├── stores/                             # Zustand state implementations (Auth & Finance context)
│   │   ├── types/                              # TypeScript interface definitions 
│   │   └── utils/                              # Formatters (Currencies, Dates, Case handling)
│   ├── tailwind.config.ts                      # Tailwind CSS variable declarations and keyframes
│   └── package.json                            # Frontend Node dependencies 
│
├── src/                                        # Backend Express.js Server application
│   ├── ai/                                     # Proxies coordinating with the Python ML-Service
│   ├── analytics/                              # Aggregation scripts calculating summary payload structures
│   ├── auth/                                   # JWT issuance, Registration, and User Profile logic
│   ├── config/                                 # Environmental and database thread pooling configurations
│   ├── finance/                                # Strict CRUD controllers for Budgets and Goals
│   ├── middleware/                             # Authorization gating guards
│   ├── models/                                 # SQL Data-Access Object Models
│   └── utils/                                  # Global logger modules
│
├── ml-service/                                 # Dedicated AI Analytics Platform
│   └── ai_financial_engine.py                  # Core logic powering intelligent insights and PDF parsing
│
├── database/                                   # Supplemental SQL schema definitions
├── server.js                                   # Main Node server entrypoint script
├── .env                                        # Environment configurations (Ports, Keys, Database Strings)
└── README.md                                   # Project topology execution guide
```

---

## Configuration & Usage Details

1. **MySQL Database Requirements**: Ensure your SQL driver is actively running, and you have invoked the native `.sql` schemas ensuring `budgets`, `users`, `financial_goals`, and `transactions` tables are formally verified. 
2. **Node Execution**: Run `npm install` within the root and `frontend/` directories securely. Execute the Node REST server over standard port configurations (e.g., `5000`) tracking `.env` credentials. 
3. **ML-Service Startup**: The Python API backend acts identically as a required microservice. Use `uvicorn ai_financial_engine:app --reload` mapped to `127.0.0.1:8000` to instantiate the ML capabilities.
4. **React Dev Server**: Boot via `npm run dev` to access the finalized application seamlessly.
