# Investment Tools Hub

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Build Status](https://github.com/Beginnerinvestorhub/Tools/workflows/CI/badge.svg)](https://github.com/Beginnerinvestorhub/Tools/actions)
[![Coverage Status](https://coveralls.io/repos/github/Beginnerinvestorhub/Tools/badge.svg?branch=main)](https://coveralls.io/github/Beginnerinvestorhub/Tools?branch=main)

A comprehensive investment analysis platform designed to help beginner investors make informed decisions through risk assessment, portfolio simulation, and AI-powered behavioral nudges.

## 🚀 Quick Start

```bash
# Clone the repository
git clone https://github.com/Beginnerinvestorhub/Tools.git
cd Tools

# Install dependencies
pnpm install

# Set up environment variables
cp .env.example .env
# Edit .env with your configuration

# Start development environment
pnpm dev
```

## 📁 Project Structure

beginnerinvestorhub/tools
├── .env.example
├── .gitignore
├── package.json
├── pnpm-workspace.yaml
├── README.md
├── apps/
│   └── web/
│       ├── public/
│       │   └── favicon.ico
│       └── src/
│           ├── app/
│           │   ├── (tools)/
│           │   │   ├── risk-assessment/
│           │   │   │   ├── page.tsx
│           │   │   │   ├── loading.tsx
│           │   │   │   └── error.tsx
│           │   │   └── portfolio-simulation/
│           │   │       ├── page.tsx
│           │   │       ├── loading.tsx
│           │   │       └── error.tsx
│           │   ├── api/
│           │   │   └── auth/
│           │   │       └── [...nextauth].ts
│           │   ├── layout.tsx
│           │   ├── page.tsx
│           │   └── globals.css
│           ├── components/
│           │   ├── ui/
│           │   │   ├── button.tsx
│           │   │   └── card.tsx
│           │   └── common/
│           │       ├── Navigation.tsx
│           │       └── Footer.tsx
│           ├── hooks/
│           │   └── useRiskAssessment.ts
│           ├── lib/
│           │   └── utils.ts
│           ├── styles/
│           │   └── tailwind.css
│           └── types/
│               └── index.d.ts
│       ├── next.config.js
│       ├── package.json
│       ├── postcss.config.js
│       ├── tailwind.config.ts
│       └── tsconfig.json
├── packages/
│   ├── api-types/
│   │   └── src/
│   │       └── index.ts
│   │   └── package.json
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
