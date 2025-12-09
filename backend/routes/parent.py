from fastapi import APIRouter, HTTPException, Depends
from typing import List
from datetime import datetime
from database import db
from models import UserResponse, UserRole
from utils import verify_token

router = APIRouter(prefix="/parent", tags=["parent"])

@router.get("/my-children", response_model=List[UserResponse])
async def get_my_children(payload: dict = Depends(verify_token)):
    if payload['role'] != UserRole.PARENT.value:
        raise HTTPException(status_code=403, detail="Parent access required")
    
    relations = await db.parent_student_relations.find({"parent_id": payload['user_id']}, {"_id": 0}).to_list(1000)
    student_ids = [r['student_id'] for r in relations]
    
    if not student_ids:
        return []
    
    students = await db.users.find({"id": {"$in": student_ids}}, {"_id": 0}).to_list(1000)
    return [UserResponse(
        id=s['id'],
        email=s['email'],
        full_name=s['full_name'],
        role=s['role'],
        approval_status=s['approval_status'],
        school=s.get('school'),
        grade=s.get('grade'),
        birth_date=s.get('birth_date'),
        phone=s.get('phone'),
        address=s.get('address'),
        created_at=datetime.fromisoformat(s['created_at'])
    ) for s in students]

@router.get("/child-resources/{student_id}")
async def get_child_resources(student_id: str, payload: dict = Depends(verify_token)):
    if payload['role'] != UserRole.PARENT.value:
        raise HTTPException(status_code=403, detail="Parent access required")
    
    relation = await db.parent_student_relations.find_one({
        "parent_id": payload['user_id'],
        "student_id": student_id
    }, {"_id": 0})
    
    if not relation:
        raise HTTPException(status_code=403, detail="Not authorized to view this student's data")
    
    resources = await db.resources_with_topics.find({"student_id": student_id}, {"_id": 0}).to_list(1000)
    return resources

@router.get("/child-question-entries/{student_id}")
async def get_child_question_entries(student_id: str, payload: dict = Depends(verify_token)):
    if payload['role'] != UserRole.PARENT.value:
        raise HTTPException(status_code=403, detail="Parent access required")
    
    relation = await db.parent_student_relations.find_one({
        "parent_id": payload['user_id'],
        "student_id": student_id
    }, {"_id": 0})
    
    if not relation:
        raise HTTPException(status_code=403, detail="Not authorized to view this student's data")
    
    entries = await db.question_entries.find({"student_id": student_id}, {"_id": 0}).to_list(1000)
    return entries

@router.get("/child-exam-analyses/{student_id}")
async def get_child_exam_analyses(student_id: str, payload: dict = Depends(verify_token)):
    if payload['role'] != UserRole.PARENT.value:
        raise HTTPException(status_code=403, detail="Parent access required")
    
    relation = await db.parent_student_relations.find_one({
        "parent_id": payload['user_id'],
        "student_id": student_id
    }, {"_id": 0})
    
    if not relation:
        raise HTTPException(status_code=403, detail="Not authorized to view this student's data")
    
    analyses = await db.exam_analyses.find({"student_id": student_id}, {"_id": 0}).to_list(1000)
    return analyses

@router.get("/child-weekly-schedules/{student_id}")
async def get_child_weekly_schedules(student_id: str, payload: dict = Depends(verify_token)):
    if payload['role'] != UserRole.PARENT.value:
        raise HTTPException(status_code=403, detail="Parent access required")
    
    relation = await db.parent_student_relations.find_one({
        "parent_id": payload['user_id'],
        "student_id": student_id
    }, {"_id": 0})
    
    if not relation:
        raise HTTPException(status_code=403, detail="Not authorized to view this student's data")
    
    schedules = await db.weekly_schedules.find(
        {"student_id": student_id},
        {"_id": 0}
    ).sort("week_start_date", -1).to_list(1000)
    return schedules

@router.get("/child-assignments/{student_id}")
async def get_child_assignments(student_id: str, payload: dict = Depends(verify_token)):
    if payload['role'] != UserRole.PARENT.value:
        raise HTTPException(status_code=403, detail="Parent access required")
    
    relation = await db.parent_student_relations.find_one({
        "parent_id": payload['user_id'],
        "student_id": student_id
    }, {"_id": 0})
    
    if not relation:
        raise HTTPException(status_code=403, detail="Not authorized to view this student's data")
    
    assignments = await db.assignments.find({"student_id": student_id}, {"_id": 0}).to_list(1000)
    return assignments
