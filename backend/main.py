from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

# CORS 設定
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
async def root():
    return {"message": "API is working!"}

@app.get("/api/")
async def api_root():
    return {"status": "success", "endpoints": ["/", "/api/", "/api/test"]}

@app.get("/api/test")
async def test():
    return {"test": "ok"}

@app.post("/api/login")
async def login():
    return {"success": True, "token": "test-token-123"}
