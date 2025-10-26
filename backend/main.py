from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
async def root():
    return {"message": "StudyPulse API is running!"}

@app.get("/api/")
async def api_root():
    return {"message": "API endpoints are working!"}

@app.get("/api/test")
async def test():
    return {"status": "success", "message": "Test endpoint works"}

@app.post("/api/login")
async def login_test():
    return {"success": True, "message": "Login endpoint placeholder", "token": "test-token"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
