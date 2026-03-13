# FinanceAI - Smart Money Manager

An AI-powered personal finance platform that helps you manage your money smarter with advanced analytics, spending predictions, and intelligent insights.

## Features

- **Smart Dashboard**: Real-time financial overview with AI-powered insights
- **Transaction Management**: Track and categorize expenses with AI anomaly detection
- **Budget Planning**: Intelligent budget recommendations and tracking
- **Goal Setting**: Set and monitor financial goals with AI assistance
- **Trip Planning**: AI-powered travel budget planning and optimization
- **AI Advisor**: Chat with your personal financial assistant
- **Advanced Analytics**: Comprehensive financial health analysis

## Tech Stack

- **Frontend**: React 18, TypeScript, Vite
- **UI Framework**: TailwindCSS, Shadcn UI
- **Charts**: Recharts
- **State Management**: Zustand
- **API Client**: Axios
- **Backend**: Node.js, Express, MySQL
- **ML Service**: Python FastAPI

## Getting Started

### Prerequisites

- Node.js 18+
- MySQL database
- Python 3.8+ (for ML service)

### Installation

1. Clone the repository
```bash
git clone <repository-url>
cd financeai-frontend
```

2. Install dependencies
```bash
npm install
```

3. Start the development server
```bash
npm run dev
```

4. Open your browser and navigate to `http://localhost:5173`

### Environment Variables

Create a `.env` file in the root directory:

```env
VITE_API_BASE_URL=http://localhost:5000/api
VITE_ML_SERVICE_URL=http://localhost:8000
```

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint
- `npm run test` - Run tests

## Project Structure

```
src/
├── components/     # Reusable UI components
├── pages/         # Page components
├── services/      # API services
├── types/         # TypeScript type definitions
├── hooks/         # Custom React hooks
├── utils/         # Utility functions
└── stores/        # State management
```

## API Integration

The frontend integrates with two backend services:

1. **Main API** (Node.js/Express): `http://localhost:5000/api`
2. **ML Service** (Python FastAPI): `http://localhost:8000`

Both services use JWT authentication with tokens stored securely in localStorage.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License.
