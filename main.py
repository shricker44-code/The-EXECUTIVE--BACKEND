from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers import chat, scan

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

@app.get("/")
def root():
    return {"status": "The Executive is in session."}
