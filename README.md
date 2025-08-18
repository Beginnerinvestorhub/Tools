# Investment Tools Hub

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

A full-stack investment analysis platform for beginner investors, featuring:
- Next.js + Tailwind CSS frontend
- Node.js/Express backend API
- Python FastAPI AI Behavioral Nudge Engine
- Firebase Authentication (RBAC)
- Stripe payments, newsletter signup, admin dashboard
- Dockerized for local dev and production deploy

---

## 🚀 Quick Start

### Development Setup

```bash
# Clone the repository
git clone https://github.com/Beginnerinvestorhub/Tools.git
cd Tools

# Install Node.js dependencies
pnpm install

# Set up Python services (each service has its own virtual environment)
cd tools/services/ai-behavioral-nudge-engine && python -m venv .venv && .\.venv\Scripts\activate && pip install -r requirements.txt && cd ../../..
cd tools/services/market-data-ingestion && python -m venv .venv && .\.venv\Scripts\activate && pip install -r requirements.txt && cd ../../..
cd tools/services/risk-calculation-engine && python -m venv .venv && .\.venv\Scripts\activate && pip install -r requirements.txt && cd ../../..

# Copy and configure environment variables
cp frontend/.env.example frontend/.env
cp backend/.env.example backend/.env
cp python-engine/.env.example python-engine/.env
# Edit each .env file with your keys/configs

# Start all services for development
docker-compose up --build
```

### Production Deployment

```bash
# Build and deploy production services
docker-compose -f docker-compose.prod.yml up --build -d

# Or use individual service commands
pnpm build
pnpm start
```

---

## 📁 Project Structure

```
Tools/
├── frontend/                    # Next.js app (UI, auth, dashboard, admin)
├── backend/                     # Node.js/Express API (auth, RBAC, Stripe)
├── python-engine/               # FastAPI AI Behavioral Nudge Engine
├── tools/
│   ├── services/
│   │   ├── shared/              # Consolidated Python dependencies
│   │   ├── ai-behavioral-nudge-engine/    # AI nudging service
│   │   ├── market-data-ingestion/         # Market data collection
│   │   └── risk-calculation-engine/       # Risk assessment service
│   └── packages/                # Shared TypeScript packages
├── nginx/                       # Production reverse proxy config
├── docker-compose.yml           # Development environment
├── docker-compose.prod.yml      # Production environment
└── README.md
```

---

## ⚙️ Environment Variables

Each service has its own `.env.example` file. Copy to `.env` and fill in the values:

### Frontend (`frontend/.env.example`)
- NEXT_PUBLIC_FIREBASE_API_KEY, ... (Firebase)
- NEXT_PUBLIC_API_BASE_URL (http://localhost:4000)
- NEXT_PUBLIC_GOOGLE_ANALYTICS_ID
- NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY

### Backend (`backend/.env.example`)
- PORT
- FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY
- JWT_SECRET
- ALLOWED_ORIGINS
- API_KEY_NUDGE_ENGINE
- STRIPE_SECRET_KEY
- FRONTEND_URL
- DATABASE_URL (PostgreSQL)

### Python Services
Each Python service inherits from `tools/services/shared/requirements.txt` and adds service-specific dependencies.

---

## 🖥️ Local Development

### Frontend & Backend
```bash
# Start development servers
pnpm dev

# Or individually
pnpm --filter frontend dev
pnpm --filter backend dev
```

### Python Services
Each Python service in the `tools/services/` directory has its own virtual environment:

```bash
# Example: AI Behavioral Nudge Engine
cd tools/services/ai-behavioral-nudge-engine
python -m venv .venv
.\.venv\Scripts\activate  # Windows
source .venv/bin/activate  # macOS/Linux
pip install -r requirements.txt
python src/api.py
```

### Database Setup
```bash
# Initialize Prisma database
cd backend
npx prisma generate
npx prisma db push
npx prisma db seed  # Optional: seed with test data
```

---

## 🛠️ Features

- **Authentication:** Firebase Auth (email/password, OAuth), role-based access (user, admin, premium)
- **Dashboard:** Main app UI, embedded legacy frontend, Stripe upgrade, newsletter signup
- **Profile/Onboarding:** User profile, risk tolerance, investment goals
- **Admin Panel:** User list, role management
- **AI Services:** 
  - Behavioral nudge engine with advanced AI orchestration
  - Market data ingestion and processing
  - Risk calculation and portfolio simulation
- **Stripe Integration:** Subscription checkout, backend session creation
- **Newsletter Signup:** API endpoint, ready for integration with Mailchimp/ConvertKit
- **SEO & Analytics:** Google Analytics, Open Graph/meta tags

---

## 🐳 Docker & Deployment

### Development
```bash
docker-compose up --build
```

### Production
```bash
# With SSL and Nginx reverse proxy
docker-compose -f docker-compose.prod.yml up --build -d

# Services available at:
# - Frontend: https://your-domain.com
# - Backend API: https://your-domain.com/api/
# - Python AI: https://your-domain.com/python-api/
# - Nudge Engine: https://your-domain.com/nudge-api/
# - Risk Engine: https://your-domain.com/risk-api/
```

### Production Requirements
- SSL certificates in `nginx/ssl/` directory
- Production environment files (`.env.production`)
- PostgreSQL and Redis instances
- Proper firewall and security configuration

---

## 🧪 Testing

```bash
# Frontend tests
pnpm --filter frontend test

# Backend tests  
pnpm --filter backend test

# Python service tests
cd tools/services/ai-behavioral-nudge-engine
pytest

cd tools/services/risk-calculation-engine
pytest
```

---

## 🔒 Security

- All secrets via `.env` files (never commit real keys)
- JWT for backend API, Firebase Admin SDK for token verification
- CORS configured via `ALLOWED_ORIGINS`
- Rate limiting on all API endpoints
- SSL/TLS encryption in production
- Security headers via Nginx

---

## 📄 CI/CD

GitHub Actions workflows in `.github/workflows/`:
- `ci.yml` - Continuous integration
- `codeql.yml` - Security analysis
- `eslint.yml` - Code quality checks

---

## 🤝 Contributing

1. Fork the repo & make a branch
2. Add/fix features, update docs
3. Run tests: `pnpm test`
4. Submit PR with clear description

### Development Guidelines

- Follow TypeScript best practices
- Use conventional commits
- Write tests for new features
- Update documentation as needed
- Ensure all CI checks pass

---

## 📚 API Documentation

- Backend API docs: `http://localhost:4000/api/docs`
- Python services have individual Swagger/OpenAPI docs
- Comprehensive Prisma schema documentation

---

## 🚀 Production Deployment Checklist

- [ ] SSL certificates configured
- [ ] Environment variables set for production
- [ ] Database migrations applied
- [ ] Redis cache configured
- [ ] Monitoring and logging set up
- [ ] Backup strategy implemented
- [ ] Security headers configured
- [ ] Rate limiting tuned for production load

---

## 📬 Support

For questions or support, open an issue or contact the maintainer.

---

**Note**: This is an educational project designed to help beginner investors. Always consult with qualified financial advisors before making investment decisions.
