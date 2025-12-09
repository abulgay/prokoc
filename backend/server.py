from fastapi import FastAPI, APIRouter
from starlette.middleware.cors import CORSMiddleware
import logging
from config import CORS_ORIGINS
from database import close_db_connection
from routes import auth, admin, teacher, student, shared

# Create the main app without a prefix
app = FastAPI()

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Include all route modules
api_router.include_router(auth.router)
api_router.include_router(admin.router)
api_router.include_router(teacher.router)
api_router.include_router(student.router)
api_router.include_router(shared.router)

# Include the router in the main app
app.include_router(api_router)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=CORS_ORIGINS,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_event():
    await close_db_connection()
