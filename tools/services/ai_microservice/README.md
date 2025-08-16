# AI Behavioral Nudge System

FastAPI microservice for personalized learning recommendations and behavioral nudges.

## Quick Start

1. Install dependencies:
```bash
pip install -r requirements.txt
```

2. Set DATABASE_URL environment variable

3. Start the service:
```bash
python start.py
```

## API Endpoints

- `GET /health` - Health check
- `GET /nudge/recommend-path?user_id={id}` - Get personalized recommendations

## Features

- Rule-based content recommendations
- Behavioral analysis and nudging
- User progress tracking
- Personalized messaging based on learning style and risk profile
