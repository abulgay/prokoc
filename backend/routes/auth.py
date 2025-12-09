from fastapi import APIRouter, HTTPException, Depends
from datetime import datetime
from database import db
from models import UserRegister, UserLogin, UserResponse, User, ApprovalStatus, UserRole
from utils import pwd_context, create_access_token, verify_token

router = APIRouter(prefix="/auth", tags=["auth"])

@router.post("/register", response_model=UserResponse)
async def register(user_data: UserRegister):
    existing_user = await db.users.find_one({"email": user_data.email}, {"_id": 0})
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    hashed_password = pwd_context.hash(user_data.password)
    user = User(
        email=user_data.email,
        password=hashed_password,
        full_name=user_data.full_name,
        role=user_data.role,
        school=user_data.school,
        grade=user_data.grade,
        birth_date=user_data.birth_date,
        phone=user_data.phone,
        address=user_data.address
    )
    
    user_dict = user.model_dump()
    user_dict['created_at'] = user_dict['created_at'].isoformat()
    user_dict['updated_at'] = user_dict['updated_at'].isoformat()
    
    await db.users.insert_one(user_dict)
    return UserResponse(**user_dict)

@router.post("/login")
async def login(credentials: UserLogin):
    user = await db.users.find_one({"email": credentials.email}, {"_id": 0})
    if not user:
        raise HTTPException(status_code=400, detail="Invalid credentials")
    
    if not pwd_context.verify(credentials.password, user['password']):
        raise HTTPException(status_code=400, detail="Invalid credentials")
    
    if user['approval_status'] != ApprovalStatus.APPROVED.value:
        raise HTTPException(status_code=403, detail="Account pending approval")
    
    token = create_access_token({"user_id": user['id'], "role": user['role']})
    return {
        "token": token,
        "user": UserResponse(
            id=user['id'],
            email=user['email'],
            full_name=user['full_name'],
            role=user['role'],
            approval_status=user['approval_status'],
            created_at=datetime.fromisoformat(user['created_at'])
        )
    }

@router.get("/me", response_model=UserResponse)
async def get_current_user(payload: dict = Depends(verify_token)):
    user = await db.users.find_one({"id": payload['user_id']}, {"_id": 0})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return UserResponse(
        id=user['id'],
        email=user['email'],
        full_name=user['full_name'],
        role=user['role'],
        approval_status=user['approval_status'],
        created_at=datetime.fromisoformat(user['created_at'])
    )
