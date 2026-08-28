from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers import chat, scan, billing
from routers import trial, queue, auth, notifications
from routers import accounts
from database import engine
import models
from routers import score
# ...
app.include_router(score.router, prefix="/api/score", tags=["score"])

models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="The Executive API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(chat.router, prefix="/api/chat", tags=["chat"])
app.include_router(scan.router, prefix="/api/scan", tags=["scan"])
app.include_router(trial.router, prefix="/api/trial", tags=["trial"])
app.include_router(queue.router, prefix="/api/queue", tags=["queue"])
app.include_router(billing.router, prefix="/api/billing", tags=["billing"])
app.include_router(auth.router, prefix="/api/auth", tags=["auth"])
app.include_router(notifications.router, prefix="/api/notifications", tags=["notifications"])
app.include_router(accounts.router, prefix="/api/accounts", tags=["accounts"])

@app.get("/")
def root():
    return {"status": "The Executive is in session."}