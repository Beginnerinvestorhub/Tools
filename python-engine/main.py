from fastapi import FastAPI, Request, HTTPException
from dotenv import load_dotenv

load_dotenv()

app = FastAPI()

@app.get("/health")
def health():
    return {"status": "ok"}

@app.post("/nudge")
async def nudge(request: Request):
    data = await request.json()
    # Placeholder: integrate OpenAI or behavioral nudge logic
    user_id = data.get("user_id")
    context = data.get("context")
    if not user_id or not context:
        raise HTTPException(status_code=400, detail="Missing user_id or context")
    # Simulate nudge
    return {"nudge": f"Here's a helpful nudge for user {user_id}."}
