# Investment Tools Hub

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

A full-stack investment analysis platform for beginner investors, featuring:
- Next.js + Tailwind CSS frontend
- Node.js/Express backend API
- Python FastAPI AI Behavioral Nudge Engine
- Firebase Authentication (RBAC)
- Stripe payments, newsletter signup, admin dashboard
- Dockerized for local dev and deploy

---

## 🚀 Quick Start

```bash
# Clone the repository
git clone https://github.com/Beginnerinvestorhub/Tools.git
cd Tools

# Install dependencies (from root)
cd frontend && npm install && cd ../backend && npm install && cd ../python-engine && pip install -r requirements.txt

# Copy and configure environment variables
cp frontend/.env.example frontend/.env
cp backend/.env.example backend/.env
cp python-engine/.env.example python-engine/.env
# Edit each .env file with your keys/configs

# Start all services (from root)
docker-compose up --build
```

---

## 📁 Project Structure

```
Tools/
├── frontend/         # Next.js app (UI, auth, dashboard, admin, onboarding, Stripe, newsletter)
├── backend/          # Node.js/Express API (auth, RBAC, Stripe, newsletter, admin)
├── python-engine/    # FastAPI AI Behavioral Nudge Engine
├── docker-compose.yml
├── README.md
└── ...
```

---

## ⚙️ Environment Variables

Each service has its own `.env.example` file. Copy to `.env` and fill in the values:

### Frontend (`frontend/.env.example`)
- NEXT_PUBLIC_FIREBASE_API_KEY, ... (Firebase)
- NEXT_PUBLIC_API_BASE_URL (http://localhost:4000)
- NEXT_PUBLIC_GOOGLE_ANALYTICS_ID
- NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
- NUDGE_ENGINE_API_KEY

### Backend (`backend/.env.example`)
- PORT
- FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY
- JWT_SECRET
- ALLOWED_ORIGINS
- API_KEY_NUDGE_ENGINE
- STRIPE_SECRET_KEY
- FRONTEND_URL

### Python Engine (`python-engine/.env.example`)
- OPENAI_API_KEY, ...

---

## 🖥️ Local Development

- Run `docker-compose up --build` from the root to start all services.
- Frontend: http://localhost:3000
- Backend API: http://localhost:4000
- Python Engine: http://localhost:8000

---

## 🛠️ Features
- **Authentication:** Firebase Auth (email/password, OAuth), role-based access (user, admin, paiduser)
- **Dashboard:** Main app UI, embedded legacy frontend, Stripe upgrade, newsletter signup
- **Profile/Onboarding:** User profile, risk tolerance, investment goals
- **Admin Panel:** User list, role management
- **AI Nudge Engine:** Chat widget, Python FastAPI microservice
- **Stripe Integration:** Subscription checkout, backend session creation
- **Newsletter Signup:** API endpoint, ready for integration with Mailchimp/ConvertKit
- **SEO & Analytics:** Google Analytics, Open Graph/meta tags

---

## 🐳 Docker & Deployment
- Each service has a `Dockerfile`
- `docker-compose.yml` orchestrates local dev
- For production, deploy each service to AWS/GCP/Azure or use ECS/Amplify/Heroku

---

## 🧪 Testing
- Frontend: `npm run test` (Jest, React Testing Library)
- Backend: `npm run test` (Jest, Supertest)
- Python Engine: `pytest`

---

## 🔒 Security
- All secrets via `.env` files (never commit real keys)
- JWT for backend API, Firebase Admin SDK for token verification
- CORS configured via `ALLOWED_ORIGINS`

---

## 📄 CI/CD
- Recommended: GitHub Actions, AWS CodePipeline, or similar
- Example workflows in `.github/workflows/`

---

## 🤝 Contributing
1. Fork the repo & make a branch
2. Add/fix features, update docs
3. PR with clear description

---

## 📬 Support
For questions or support, open an issue or contact the maintainer.
│   ├── ui/
│   │   └── src/
│   │       └── index.ts
│   │   └── package.json
│   └── utils/
│       └── src/
│           └── formatters.ts
│       └── package.json
├── services/
│   ├── backend-api/
│   │   ├── src/
│   │   │   ├── controllers/
│   │   │   │   ├── authController.ts
│   │   │   │   ├── riskAssessmentController.ts
│   │   │   │   └── simulationController.ts
│   │   │   ├── models/
│   │   │   │   ├── userModel.ts
│   │   │   │   ├── riskProfileModel.ts
│   │   │   │   ├── simulationModel.ts
│   │   │   │   └── marketDataModel.ts
│   │   │   ├── routes/
│   │   │   │   ├── authRoutes.ts
│   │   │   │   ├── riskAssessmentRoutes.ts
│   │   │   │   └── simulationRoutes.ts
│   │   │   ├── services/
│   │   │   │   ├── authService.ts
│   │   │   │   ├── riskEngineService.ts
│   │   │   │   └── dbService.ts
│   │   │   ├── app.ts
│   │   │   └── server.ts
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   └── nodemon.json
│   ├── market-data-ingestion/
│   │   ├── src/
│   │   │   ├── data_fetcher.py
│   │   │   ├── data_processor.py
│   │   │   ├── db_loader.py
│   │   │   ├── main.py
│   │   │   └── config.py
│   │   ├── requirements.txt
│   │   └── Dockerfile
│   └── risk-calculation-engine/
│       ├── src/
│       │   ├── risk_assessment_engine.py
│       │   ├── portfolio_simulator.py
│       │   ├── correlations.py
│       │   ├── api.py
│       │   └── config.py
│       ├── requirements.txt
│       └── Dockerfile
│   └── ai-behavioral-nudge-engine/
│       ├── src/
│       │   ├── data_collector.py
│       │   ├── bias_detector.py
│       │   ├── nudge_generator.py
│       │   ├── api.py
│       │   └── config.py
│       ├── requirements.txt
│       └── Dockerfile


## 🛠️ Technologies

- **Frontend**: Next.js 14, React, TypeScript, Tailwind CSS
- **Backend**: Node.js, Express, TypeScript
- **Data Services**: Python, FastAPI
- **Database**: PostgreSQL (assumed)
- **Package Management**: pnpm
- **Authentication**: NextAuth.js

## 🔧 Development

### Prerequisites

- Node.js 18+
- pnpm 8+
- Python 3.9+
- Docker (for services)

### Running the Development Environment

1. **Start the web application**:
   ```bash
   cd apps/web
   pnpm dev
   ```

2. **Start the backend API**:
   ```bash
   cd services/backend-api
   pnpm dev
   ```

3. **Start Python services**:
   ```bash
   # Market data ingestion
   cd services/market-data-ingestion
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   pip install -r requirements.txt
   python src/main.py

   # Risk calculation engine
   cd services/risk-calculation-engine
   python -m venv venv
   source venv/bin/activate
   pip install -r requirements.txt
   python src/api.py
   ```

### Using Docker

```bash
# Build and run all services
docker-compose up --build

# Run specific service
docker-compose up market-data-ingestion
```

## 📖 Features

### Risk Assessment Tool
- Comprehensive risk profiling questionnaire
- Dynamic risk scoring algorithm
- Personalized investment recommendations

### Portfolio Simulation
- Monte Carlo simulation engine
- Historical backtesting capabilities
- Scenario analysis and stress testing

### AI Behavioral Nudges
- Behavioral bias detection
- Personalized nudge recommendations
- Investment decision support

## 📚 Documentation

- [Web Application Setup](./apps/web/README.md)
- [Backend API Documentation](./services/backend-api/README.md)
- [Market Data Ingestion](./services/market-data-ingestion/README.md)
- [Risk Calculation Engine](./services/risk-calculation-engine/README.md)
- [AI Behavioral Nudge Engine](./services/ai-behavioral-nudge-engine/README.md)

## 🧪 Testing

```bash
# Run all tests
pnpm test

# Run tests for specific package
pnpm test:web
pnpm test:api
```

## 🚀 Deployment

### Production Build

```bash
# Build all packages
pnpm build

# Deploy web application
cd apps/web
pnpm build
pnpm start
```

### Docker Deployment

```bash
# Build production images
docker-compose -f docker-compose.prod.yml build

# Deploy to production
docker-compose -f docker-compose.prod.yml up -d
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines

- Follow TypeScript best practices
- Use conventional commits
- Write tests for new features
- Update documentation as needed
- Ensure all CI checks pass

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [Next.js](https://nextjs.org/) for the web framework
- [Tailwind CSS](https://tailwindcss.com/) for styling
- [FastAPI](https://fastapi.tiangolo.com/) for Python services
- Investment data providers and APIs

## 📞 Support

For questions and support:
- Create an issue in this repository
- Join our Discord community
- Email: support@beginnerinvestorhub.com

---

**Note**: This is an educational project designed to help beginner investors. Always consult with qualified financial advisors before making investment decisions.
