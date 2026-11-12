import uvicorn
import os
import sys

# Ensure current directory is on python path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.config import settings

if __name__ == "__main__":
    print(f"============================================================")
    print(f"  GLAFIT Smart AI E-Bike Inspection Engine")
    print(f"  Japanese EV Fleet Damage Inspection System (FastAPI)")
    print(f"  Port: {settings.PORT} | Host: {settings.HOST}")
    print(f"============================================================")
    uvicorn.run("app.main:app", host=settings.HOST, port=settings.PORT, reload=False)
