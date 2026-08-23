from fastapi import FastAPI

app = FastAPI(
    title = "Urban Heat Action Agent",
    description = "AI-Powered urban heat analysis using the Fortyguared API",
    version = "1.0.0"
)

@app.get("/")
def root():
    return{
        "message": "Urban Heat Action Agent API is running"
    }

@app.get("/health")
def health():
    return{
        "status": "healthy"
    }