from pydantic import BaseModel, Field, ConfigDict, EmailStr
from typing import List, Optional, Dict, Any
from datetime import datetime, timezone
import uuid
from enum import Enum

# Enums
class UserRole(str, Enum):
    ADMIN = "admin"
    TEACHER = "teacher"
    STUDENT = "student"
    PARENT = "parent"

class ApprovalStatus(str, Enum):
    PENDING = "pending"
    APPROVED = "approved"
    REJECTED = "rejected"

class ExamType(str, Enum):
    TYT = "TYT"
    AYT = "AYT"
    LGS = "LGS"
    KPSS = "KPSS"

# User Models
class User(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    email: EmailStr
    password: str
    full_name: str
    role: UserRole
    approval_status: ApprovalStatus = ApprovalStatus.PENDING
    school: Optional[str] = None
    grade: Optional[str] = None
    birth_date: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    goal: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class UserRegister(BaseModel):
    email: EmailStr
    password: str
    full_name: str
    role: UserRole
    school: Optional[str] = None
    grade: Optional[str] = None
    birth_date: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    goal: Optional[str] = None

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserResponse(BaseModel):
    id: str
    email: str
    full_name: str
    role: UserRole
    approval_status: ApprovalStatus
    school: Optional[str] = None
    grade: Optional[str] = None
    birth_date: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    goal: Optional[str] = None
    created_at: datetime

class UserUpdate(BaseModel):
    full_name: Optional[str] = None
    school: Optional[str] = None
    grade: Optional[str] = None
    birth_date: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    goal: Optional[str] = None

# Match Models
class StudentTeacherMatch(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    student_id: str
    teacher_id: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class ParentStudentRelation(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    parent_id: str
    student_id: str
    relation_type: str = "parent"
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

# Question Entry Models
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

# Exam Analysis Models
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

# Resource Tracking Models
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

# Assignment Models
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

# Study Schedule Models
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

# Notification Model
class Notification(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    title: str
    message: str
    type: str
    read: bool = False
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

# Subject and Topic Models
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

# Weekly Schedule Models
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

# Resource with Topics Models
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
