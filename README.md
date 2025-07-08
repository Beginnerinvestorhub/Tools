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

```
Tools/
├── apps/
│   └── web/                    # Next.js web application
├── packages/
│   ├── api-types/              # Shared TypeScript types
│   ├── ui/                     # Shared UI components
│   └── utils/                  # Shared utility functions
├── services/
│   ├── backend-api/            # Node.js/Express API server
│   ├── market-data-ingestion/  # Python data fetching service
│   ├── risk-calculation-engine/ # Python risk analysis engine
│   └── ai-behavioral-nudge-engine/ # AI-powered behavioral analysis
└── ...
```

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
