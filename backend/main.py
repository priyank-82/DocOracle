import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from routers import documents, chat
from models.schemas import HealthResponse

app = FastAPI(title="DocOracle API", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=os.environ.get("ALLOWED_ORIGINS", "*").split(","),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(documents.router)
app.include_router(chat.router)


@app.get("/api/health", response_model=HealthResponse)
def health_check():
    return HealthResponse()
