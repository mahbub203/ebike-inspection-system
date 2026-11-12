from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .config import settings
from .api import router

app = FastAPI(
    title="GLAFIT AI Bike Damage Inspection API",
    description="Production-grade AI Damage Inspection and Pre-Rental Verification Engine for Glafit Bangladesh Electric Mobility fleets.",
    version="2.4.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all in development; production uses settings.CORS_ORIGINS
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include Router
app.include_router(router)

@app.get("/")
def root():
    return {
        "service": "GLAFIT Smart AI Inspector API",
        "status": "online",
        "documentation": "/docs",
        "version": "2.4.0",
        "organization": "GLAFIT Bangladesh Fleet Services"
    }
