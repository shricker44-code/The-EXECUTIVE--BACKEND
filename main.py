from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers import chat, scan
from routers import trial, queue, auth
from database import engine
import models

models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="The Executive API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(chat.router, prefix="/api/chat", tags=["chat"])
app.include_router(scan.router, prefix="/api/scan", tags=["scan"])
app.include_router(trial.router, prefix="/api/trial", tags=["trial"])
app.include_router(queue.router, prefix="/api/queue", tags=["queue"])
app.include_router(auth.router, prefix="/api/auth", tags=["auth"])

@app.get("/")
def root():
    return {"status": "The Executive is in session."}
