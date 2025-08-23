from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="AI Behavioral Nudge Engine",
    description="API for generating personalized behavioral nudges for investment learning",
    version="1.0.0"
)

# Health check endpoint
@app.get("/health")
async def health_check():
    return {"status": "ok", "service": "ai-behavioral-nudge-engine"}

# Pydantic models for request/response
class NudgeRequest(BaseModel):
    user_id: str
    context: dict
    
class NudgeResponse(BaseModel):
    nudge_type: str
    message: str
    priority: int

# Placeholder for nudge generation
@app.post("/nudge", response_model=NudgeResponse)
async def generate_nudge(request: NudgeRequest):
    logger.info("Generating nudge for user %s", request.user_id)
    # In a real implementation, this would use ML models to generate personalized nudges
    return NudgeResponse(
        nudge_type="encouragement",
        message="Keep up the great work on your investment journey!",
        priority=1
    )

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)