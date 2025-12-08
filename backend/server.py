from fastapi import FastAPI, APIRouter, HTTPException, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict, EmailStr
from typing import List, Optional, Dict, Any
import uuid
from datetime import datetime, timezone, timedelta
import jwt
from passlib.context import CryptContext
from enum import Enum

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Security
SECRET_KEY = os.environ.get('JWT_SECRET_KEY', 'your-secret-key-change-in-production')
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_DAYS = 30

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
security = HTTPBearer()

# Create the main app without a prefix
app = FastAPI()

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Enums
class UserRole(str, Enum):
    ADMIN = "admin"
    TEACHER = "teacher"
    STUDENT = "student"

class ApprovalStatus(str, Enum):
    PENDING = "pending"
    APPROVED = "approved"
    REJECTED = "rejected"

class ExamType(str, Enum):
    TYT = "TYT"
    AYT = "AYT"
    LGS = "LGS"
    KPSS = "KPSS"

# Models
class User(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    email: EmailStr
    password: str
    full_name: str
    role: UserRole
    approval_status: ApprovalStatus = ApprovalStatus.PENDING
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class UserRegister(BaseModel):
    email: EmailStr
    password: str
    full_name: str
    role: UserRole

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserResponse(BaseModel):
    id: str
    email: str
    full_name: str
    role: UserRole
    approval_status: ApprovalStatus
    created_at: datetime

class StudentTeacherMatch(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    student_id: str
    teacher_id: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class QuestionEntry(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    student_id: str
    teacher_id: str
    exam_type: ExamType
    subject: str
    total_questions: int
    correct_answers: int
    wrong_answers: int
    empty_answers: int = 0
    net_score: float
    date: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    notes: Optional[str] = None

class QuestionEntryCreate(BaseModel):
    student_id: str
    exam_type: ExamType
    subject: str
    total_questions: int
    correct_answers: int
    wrong_answers: int
    empty_answers: int = 0
    notes: Optional[str] = None

class ExamAnalysis(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    student_id: str
    teacher_id: str
    exam_type: ExamType
    exam_name: str
    exam_date: datetime
    subjects: List[Dict[str, Any]]
    total_net: float
    notes: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class ExamAnalysisCreate(BaseModel):
    student_id: str
    exam_type: ExamType
    exam_name: str
    exam_date: datetime
    subjects: List[Dict[str, Any]]
    notes: Optional[str] = None

class ResourceTracking(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    student_id: str
    teacher_id: str
    resource_name: str
    subject: str
    topic: str
    status: str
    completed_date: Optional[datetime] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class ResourceTrackingCreate(BaseModel):
    student_id: str
    resource_name: str
    subject: str
    topic: str
    status: str
    completed_date: Optional[datetime] = None

class Assignment(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    student_id: str
    teacher_id: str
    title: str
    description: str
    subject: str
    due_date: datetime
    status: str = "pending"
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class AssignmentCreate(BaseModel):
    student_id: str
    title: str
    description: str
    subject: str
    due_date: datetime

class StudySchedule(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    student_id: str
    teacher_id: str
    day_of_week: int
    start_time: str
    end_time: str
    subject: str
    topic: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class StudyScheduleCreate(BaseModel):
    student_id: str
    day_of_week: int
    start_time: str
    end_time: str
    subject: str
    topic: str

class Notification(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    title: str
    message: str
    type: str
    read: bool = False
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class Subject(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    exam_type: ExamType
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class SubjectCreate(BaseModel):
    name: str
    exam_type: ExamType

class Topic(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    subject_id: str
    name: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class TopicCreate(BaseModel):
    subject_id: str
    name: str

class WeeklySchedule(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    student_id: str
    teacher_id: str
    week_start_date: datetime
    week_end_date: datetime
    schedule_items: List[Dict[str, Any]]
    is_suggested: bool = False
    is_active: bool = True
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class WeeklyScheduleCreate(BaseModel):
    student_id: str
    week_start_date: datetime
    schedule_items: List[Dict[str, Any]]

class ScheduleItem(BaseModel):
    day: int
    start_time: str
    end_time: str
    subject: str
    topic: Optional[str] = None
    resource: Optional[str] = None
    activity_type: str
    notes: Optional[str] = None

class ResourceWithTopics(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    student_id: str
    teacher_id: str
    resource_name: str
    subject: str
    topics: List[Dict[str, Any]]
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class ResourceWithTopicsCreate(BaseModel):
    student_id: str
    resource_name: str
    subject: str
    topics: List[Dict[str, Any]]

# Utility Functions
def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + timedelta(days=ACCESS_TOKEN_EXPIRE_DAYS)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def verify_token(credentials: HTTPAuthorizationCredentials = Depends(security)):
    try:
        token = credentials.credentials
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token has expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")

def calculate_net(correct: int, wrong: int) -> float:
    return correct - (wrong / 3)

# Auth Routes
@api_router.post("/auth/register", response_model=UserResponse)
async def register(user_data: UserRegister):
    existing_user = await db.users.find_one({"email": user_data.email}, {"_id": 0})
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    hashed_password = pwd_context.hash(user_data.password)
    user = User(
        email=user_data.email,
        password=hashed_password,
        full_name=user_data.full_name,
        role=user_data.role
    )
    
    user_dict = user.model_dump()
    user_dict['created_at'] = user_dict['created_at'].isoformat()
    user_dict['updated_at'] = user_dict['updated_at'].isoformat()
    
    await db.users.insert_one(user_dict)
    return UserResponse(**user_dict)

@api_router.post("/auth/login")
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

@api_router.get("/auth/me", response_model=UserResponse)
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

# Admin Routes
@api_router.get("/admin/pending-users", response_model=List[UserResponse])
async def get_pending_users(payload: dict = Depends(verify_token)):
    if payload['role'] != UserRole.ADMIN.value:
        raise HTTPException(status_code=403, detail="Admin access required")
    
    users = await db.users.find({"approval_status": ApprovalStatus.PENDING.value}, {"_id": 0}).to_list(1000)
    return [UserResponse(
        id=u['id'],
        email=u['email'],
        full_name=u['full_name'],
        role=u['role'],
        approval_status=u['approval_status'],
        created_at=datetime.fromisoformat(u['created_at'])
    ) for u in users]

@api_router.put("/admin/approve-user/{user_id}")
async def approve_user(user_id: str, payload: dict = Depends(verify_token)):
    if payload['role'] != UserRole.ADMIN.value:
        raise HTTPException(status_code=403, detail="Admin access required")
    
    result = await db.users.update_one(
        {"id": user_id},
        {"$set": {"approval_status": ApprovalStatus.APPROVED.value, "updated_at": datetime.now(timezone.utc).isoformat()}}
    )
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="User not found")
    
    user = await db.users.find_one({"id": user_id}, {"_id": 0})
    notification = Notification(
        user_id=user_id,
        title="Hesabınız Onaylandı",
        message=f"Hoş geldiniz {user['full_name']}! Hesabınız onaylandı ve sisteme giriş yapabilirsiniz.",
        type="approval"
    )
    notif_dict = notification.model_dump()
    notif_dict['created_at'] = notif_dict['created_at'].isoformat()
    await db.notifications.insert_one(notif_dict)
    
    return {"message": "User approved successfully"}

@api_router.put("/admin/reject-user/{user_id}")
async def reject_user(user_id: str, payload: dict = Depends(verify_token)):
    if payload['role'] != UserRole.ADMIN.value:
        raise HTTPException(status_code=403, detail="Admin access required")
    
    result = await db.users.update_one(
        {"id": user_id},
        {"$set": {"approval_status": ApprovalStatus.REJECTED.value, "updated_at": datetime.now(timezone.utc).isoformat()}}
    )
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="User not found")
    
    return {"message": "User rejected successfully"}

@api_router.get("/admin/teachers", response_model=List[UserResponse])
async def get_all_teachers(payload: dict = Depends(verify_token)):
    if payload['role'] != UserRole.ADMIN.value:
        raise HTTPException(status_code=403, detail="Admin access required")
    
    teachers = await db.users.find({"role": UserRole.TEACHER.value, "approval_status": ApprovalStatus.APPROVED.value}, {"_id": 0}).to_list(1000)
    return [UserResponse(
        id=t['id'],
        email=t['email'],
        full_name=t['full_name'],
        role=t['role'],
        approval_status=t['approval_status'],
        created_at=datetime.fromisoformat(t['created_at'])
    ) for t in teachers]

@api_router.get("/admin/students", response_model=List[UserResponse])
async def get_all_students(payload: dict = Depends(verify_token)):
    if payload['role'] != UserRole.ADMIN.value:
        raise HTTPException(status_code=403, detail="Admin access required")
    
    students = await db.users.find({"role": UserRole.STUDENT.value, "approval_status": ApprovalStatus.APPROVED.value}, {"_id": 0}).to_list(1000)
    return [UserResponse(
        id=s['id'],
        email=s['email'],
        full_name=s['full_name'],
        role=s['role'],
        approval_status=s['approval_status'],
        created_at=datetime.fromisoformat(s['created_at'])
    ) for s in students]

@api_router.post("/admin/match")
async def create_student_teacher_match(match_data: StudentTeacherMatch, payload: dict = Depends(verify_token)):
    if payload['role'] != UserRole.ADMIN.value:
        raise HTTPException(status_code=403, detail="Admin access required")
    
    match_dict = match_data.model_dump()
    match_dict['created_at'] = match_dict['created_at'].isoformat()
    await db.matches.insert_one(match_dict)
    
    student = await db.users.find_one({"id": match_data.student_id}, {"_id": 0})
    teacher = await db.users.find_one({"id": match_data.teacher_id}, {"_id": 0})
    
    student_notif = Notification(
        user_id=match_data.student_id,
        title="Yeni Öğretmen Ataması",
        message=f"{teacher['full_name']} size öğretmen olarak atandı.",
        type="assignment"
    )
    teacher_notif = Notification(
        user_id=match_data.teacher_id,
        title="Yeni Öğrenci Ataması",
        message=f"{student['full_name']} size öğrenci olarak atandı.",
        type="assignment"
    )
    
    student_notif_dict = student_notif.model_dump()
    student_notif_dict['created_at'] = student_notif_dict['created_at'].isoformat()
    teacher_notif_dict = teacher_notif.model_dump()
    teacher_notif_dict['created_at'] = teacher_notif_dict['created_at'].isoformat()
    
    await db.notifications.insert_one(student_notif_dict)
    await db.notifications.insert_one(teacher_notif_dict)
    
    return {"message": "Match created successfully"}

@api_router.get("/admin/matches")
async def get_all_matches(payload: dict = Depends(verify_token)):
    if payload['role'] != UserRole.ADMIN.value:
        raise HTTPException(status_code=403, detail="Admin access required")
    
    matches = await db.matches.find({}, {"_id": 0}).to_list(1000)
    return matches

@api_router.get("/admin/reports")
async def get_admin_reports(payload: dict = Depends(verify_token)):
    if payload['role'] != UserRole.ADMIN.value:
        raise HTTPException(status_code=403, detail="Admin access required")
    
    matches = await db.matches.find({}, {"_id": 0}).to_list(1000)
    reports = []
    
    for match in matches:
        student = await db.users.find_one({"id": match['student_id']}, {"_id": 0})
        teacher = await db.users.find_one({"id": match['teacher_id']}, {"_id": 0})
        
        question_entries = await db.question_entries.find({"student_id": match['student_id'], "teacher_id": match['teacher_id']}, {"_id": 0}).to_list(1000)
        assignments = await db.assignments.find({"student_id": match['student_id'], "teacher_id": match['teacher_id']}, {"_id": 0}).to_list(1000)
        
        reports.append({
            "student": student,
            "teacher": teacher,
            "total_question_entries": len(question_entries),
            "total_assignments": len(assignments),
            "completed_assignments": len([a for a in assignments if a['status'] == 'completed'])
        })
    
    return reports

# Teacher Routes
@api_router.get("/teacher/students", response_model=List[UserResponse])
async def get_teacher_students(payload: dict = Depends(verify_token)):
    if payload['role'] != UserRole.TEACHER.value:
        raise HTTPException(status_code=403, detail="Teacher access required")
    
    matches = await db.matches.find({"teacher_id": payload['user_id']}, {"_id": 0}).to_list(1000)
    student_ids = [m['student_id'] for m in matches]
    
    students = await db.users.find({"id": {"$in": student_ids}}, {"_id": 0}).to_list(1000)
    return [UserResponse(
        id=s['id'],
        email=s['email'],
        full_name=s['full_name'],
        role=s['role'],
        approval_status=s['approval_status'],
        created_at=datetime.fromisoformat(s['created_at'])
    ) for s in students]

@api_router.post("/teacher/question-entry")
async def create_question_entry(entry_data: QuestionEntryCreate, payload: dict = Depends(verify_token)):
    if payload['role'] != UserRole.TEACHER.value:
        raise HTTPException(status_code=403, detail="Teacher access required")
    
    net_score = calculate_net(entry_data.correct_answers, entry_data.wrong_answers)
    
    entry = QuestionEntry(
        student_id=entry_data.student_id,
        teacher_id=payload['user_id'],
        exam_type=entry_data.exam_type,
        subject=entry_data.subject,
        total_questions=entry_data.total_questions,
        correct_answers=entry_data.correct_answers,
        wrong_answers=entry_data.wrong_answers,
        empty_answers=entry_data.empty_answers,
        net_score=net_score,
        notes=entry_data.notes
    )
    
    entry_dict = entry.model_dump()
    entry_dict['date'] = entry_dict['date'].isoformat()
    await db.question_entries.insert_one(entry_dict)
    
    return {"message": "Question entry created successfully", "net_score": net_score}

@api_router.get("/teacher/question-entries/{student_id}")
async def get_student_question_entries(student_id: str, payload: dict = Depends(verify_token)):
    if payload['role'] != UserRole.TEACHER.value:
        raise HTTPException(status_code=403, detail="Teacher access required")
    
    entries = await db.question_entries.find({"student_id": student_id, "teacher_id": payload['user_id']}, {"_id": 0}).to_list(1000)
    return entries

@api_router.post("/teacher/exam-analysis")
async def create_exam_analysis(analysis_data: ExamAnalysisCreate, payload: dict = Depends(verify_token)):
    if payload['role'] != UserRole.TEACHER.value:
        raise HTTPException(status_code=403, detail="Teacher access required")
    
    total_net = sum([s.get('net', 0) for s in analysis_data.subjects])
    
    analysis = ExamAnalysis(
        student_id=analysis_data.student_id,
        teacher_id=payload['user_id'],
        exam_type=analysis_data.exam_type,
        exam_name=analysis_data.exam_name,
        exam_date=analysis_data.exam_date,
        subjects=analysis_data.subjects,
        total_net=total_net,
        notes=analysis_data.notes
    )
    
    analysis_dict = analysis.model_dump()
    analysis_dict['exam_date'] = analysis_dict['exam_date'].isoformat()
    analysis_dict['created_at'] = analysis_dict['created_at'].isoformat()
    await db.exam_analyses.insert_one(analysis_dict)
    
    return {"message": "Exam analysis created successfully", "total_net": total_net}

@api_router.get("/teacher/exam-analyses/{student_id}")
async def get_student_exam_analyses(student_id: str, payload: dict = Depends(verify_token)):
    if payload['role'] != UserRole.TEACHER.value:
        raise HTTPException(status_code=403, detail="Teacher access required")
    
    analyses = await db.exam_analyses.find({"student_id": student_id, "teacher_id": payload['user_id']}, {"_id": 0}).to_list(1000)
    return analyses

@api_router.post("/teacher/resource-tracking")
async def create_resource_tracking(resource_data: ResourceTrackingCreate, payload: dict = Depends(verify_token)):
    if payload['role'] != UserRole.TEACHER.value:
        raise HTTPException(status_code=403, detail="Teacher access required")
    
    resource = ResourceTracking(
        student_id=resource_data.student_id,
        teacher_id=payload['user_id'],
        resource_name=resource_data.resource_name,
        subject=resource_data.subject,
        topic=resource_data.topic,
        status=resource_data.status,
        completed_date=resource_data.completed_date
    )
    
    resource_dict = resource.model_dump()
    resource_dict['created_at'] = resource_dict['created_at'].isoformat()
    if resource_dict['completed_date']:
        resource_dict['completed_date'] = resource_dict['completed_date'].isoformat()
    await db.resource_tracking.insert_one(resource_dict)
    
    return {"message": "Resource tracking created successfully"}

@api_router.get("/teacher/resource-tracking/{student_id}")
async def get_student_resource_tracking(student_id: str, payload: dict = Depends(verify_token)):
    if payload['role'] != UserRole.TEACHER.value:
        raise HTTPException(status_code=403, detail="Teacher access required")
    
    resources = await db.resource_tracking.find({"student_id": student_id, "teacher_id": payload['user_id']}, {"_id": 0}).to_list(1000)
    return resources

@api_router.post("/teacher/assignment")
async def create_assignment(assignment_data: AssignmentCreate, payload: dict = Depends(verify_token)):
    if payload['role'] != UserRole.TEACHER.value:
        raise HTTPException(status_code=403, detail="Teacher access required")
    
    assignment = Assignment(
        student_id=assignment_data.student_id,
        teacher_id=payload['user_id'],
        title=assignment_data.title,
        description=assignment_data.description,
        subject=assignment_data.subject,
        due_date=assignment_data.due_date
    )
    
    assignment_dict = assignment.model_dump()
    assignment_dict['due_date'] = assignment_dict['due_date'].isoformat()
    assignment_dict['created_at'] = assignment_dict['created_at'].isoformat()
    await db.assignments.insert_one(assignment_dict)
    
    notification = Notification(
        user_id=assignment_data.student_id,
        title="Yeni Ödev",
        message=f"Yeni ödeviniz var: {assignment_data.title}",
        type="assignment"
    )
    notif_dict = notification.model_dump()
    notif_dict['created_at'] = notif_dict['created_at'].isoformat()
    await db.notifications.insert_one(notif_dict)
    
    return {"message": "Assignment created successfully"}

@api_router.get("/teacher/assignments/{student_id}")
async def get_student_assignments(student_id: str, payload: dict = Depends(verify_token)):
    if payload['role'] != UserRole.TEACHER.value:
        raise HTTPException(status_code=403, detail="Teacher access required")
    
    assignments = await db.assignments.find({"student_id": student_id, "teacher_id": payload['user_id']}, {"_id": 0}).to_list(1000)
    return assignments

@api_router.post("/teacher/study-schedule")
async def create_study_schedule(schedule_data: StudyScheduleCreate, payload: dict = Depends(verify_token)):
    if payload['role'] != UserRole.TEACHER.value:
        raise HTTPException(status_code=403, detail="Teacher access required")
    
    schedule = StudySchedule(
        student_id=schedule_data.student_id,
        teacher_id=payload['user_id'],
        day_of_week=schedule_data.day_of_week,
        start_time=schedule_data.start_time,
        end_time=schedule_data.end_time,
        subject=schedule_data.subject,
        topic=schedule_data.topic
    )
    
    schedule_dict = schedule.model_dump()
    schedule_dict['created_at'] = schedule_dict['created_at'].isoformat()
    await db.study_schedules.insert_one(schedule_dict)
    
    return {"message": "Study schedule created successfully"}

@api_router.get("/teacher/study-schedule/{student_id}")
async def get_student_study_schedule(student_id: str, payload: dict = Depends(verify_token)):
    if payload['role'] != UserRole.TEACHER.value:
        raise HTTPException(status_code=403, detail="Teacher access required")
    
    schedules = await db.study_schedules.find({"student_id": student_id, "teacher_id": payload['user_id']}, {"_id": 0}).to_list(1000)
    return schedules

# Student Routes
@api_router.get("/student/my-teacher")
async def get_student_teacher(payload: dict = Depends(verify_token)):
    if payload['role'] != UserRole.STUDENT.value:
        raise HTTPException(status_code=403, detail="Student access required")
    
    match = await db.matches.find_one({"student_id": payload['user_id']}, {"_id": 0})
    if not match:
        return None
    
    teacher = await db.users.find_one({"id": match['teacher_id']}, {"_id": 0})
    return UserResponse(
        id=teacher['id'],
        email=teacher['email'],
        full_name=teacher['full_name'],
        role=teacher['role'],
        approval_status=teacher['approval_status'],
        created_at=datetime.fromisoformat(teacher['created_at'])
    )

@api_router.get("/student/my-question-entries")
async def get_my_question_entries(payload: dict = Depends(verify_token)):
    if payload['role'] != UserRole.STUDENT.value:
        raise HTTPException(status_code=403, detail="Student access required")
    
    entries = await db.question_entries.find({"student_id": payload['user_id']}, {"_id": 0}).to_list(1000)
    return entries

@api_router.get("/student/my-exam-analyses")
async def get_my_exam_analyses(payload: dict = Depends(verify_token)):
    if payload['role'] != UserRole.STUDENT.value:
        raise HTTPException(status_code=403, detail="Student access required")
    
    analyses = await db.exam_analyses.find({"student_id": payload['user_id']}, {"_id": 0}).to_list(1000)
    return analyses

@api_router.get("/student/my-resource-tracking")
async def get_my_resource_tracking(payload: dict = Depends(verify_token)):
    if payload['role'] != UserRole.STUDENT.value:
        raise HTTPException(status_code=403, detail="Student access required")
    
    resources = await db.resource_tracking.find({"student_id": payload['user_id']}, {"_id": 0}).to_list(1000)
    return resources

@api_router.get("/student/my-assignments")
async def get_my_assignments(payload: dict = Depends(verify_token)):
    if payload['role'] != UserRole.STUDENT.value:
        raise HTTPException(status_code=403, detail="Student access required")
    
    assignments = await db.assignments.find({"student_id": payload['user_id']}, {"_id": 0}).to_list(1000)
    return assignments

@api_router.put("/student/assignment/{assignment_id}/complete")
async def complete_assignment(assignment_id: str, payload: dict = Depends(verify_token)):
    if payload['role'] != UserRole.STUDENT.value:
        raise HTTPException(status_code=403, detail="Student access required")
    
    result = await db.assignments.update_one(
        {"id": assignment_id, "student_id": payload['user_id']},
        {"$set": {"status": "completed"}}
    )
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Assignment not found")
    
    return {"message": "Assignment completed successfully"}

@api_router.get("/student/my-study-schedule")
async def get_my_study_schedule(payload: dict = Depends(verify_token)):
    if payload['role'] != UserRole.STUDENT.value:
        raise HTTPException(status_code=403, detail="Student access required")
    
    schedules = await db.study_schedules.find({"student_id": payload['user_id']}, {"_id": 0}).to_list(1000)
    return schedules

# Statistics Routes (Shared)
@api_router.get("/statistics/overview/{student_id}")
async def get_statistics_overview(student_id: str, payload: dict = Depends(verify_token)):
    entries = await db.question_entries.find({"student_id": student_id}, {"_id": 0}).to_list(1000)
    analyses = await db.exam_analyses.find({"student_id": student_id}, {"_id": 0}).to_list(1000)
    
    total_questions = sum([e['total_questions'] for e in entries])
    total_correct = sum([e['correct_answers'] for e in entries])
    total_wrong = sum([e['wrong_answers'] for e in entries])
    total_net = sum([e['net_score'] for e in entries])
    
    subject_stats = {}
    for entry in entries:
        subject = entry['subject']
        if subject not in subject_stats:
            subject_stats[subject] = {'correct': 0, 'wrong': 0, 'net': 0, 'count': 0}
        subject_stats[subject]['correct'] += entry['correct_answers']
        subject_stats[subject]['wrong'] += entry['wrong_answers']
        subject_stats[subject]['net'] += entry['net_score']
        subject_stats[subject]['count'] += 1
    
    return {
        "total_questions": total_questions,
        "total_correct": total_correct,
        "total_wrong": total_wrong,
        "total_net": total_net,
        "subject_stats": subject_stats,
        "recent_entries": entries[-10:] if entries else [],
        "exam_analyses_count": len(analyses)
    }

# Notification Routes
@api_router.get("/notifications")
async def get_notifications(payload: dict = Depends(verify_token)):
    notifications = await db.notifications.find({"user_id": payload['user_id']}, {"_id": 0}).sort("created_at", -1).to_list(100)
    return notifications

@api_router.put("/notifications/{notification_id}/read")
async def mark_notification_read(notification_id: str, payload: dict = Depends(verify_token)):
    result = await db.notifications.update_one(
        {"id": notification_id, "user_id": payload['user_id']},
        {"$set": {"read": True}}
    )
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Notification not found")
    
    return {"message": "Notification marked as read"}

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
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
async def shutdown_db_client():
    client.close()
