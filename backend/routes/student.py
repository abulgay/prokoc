from fastapi import APIRouter, HTTPException, Depends
from datetime import datetime
from database import db
from models import UserResponse, UserRole
from utils import verify_token

router = APIRouter(prefix="/student", tags=["student"])

@router.get("/my-teacher")
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

@router.get("/my-question-entries")
async def get_my_question_entries(payload: dict = Depends(verify_token)):
    if payload['role'] != UserRole.STUDENT.value:
        raise HTTPException(status_code=403, detail="Student access required")
    
    entries = await db.question_entries.find({"student_id": payload['user_id']}, {"_id": 0}).to_list(1000)
    return entries

@router.get("/my-exam-analyses")
async def get_my_exam_analyses(payload: dict = Depends(verify_token)):
    if payload['role'] != UserRole.STUDENT.value:
        raise HTTPException(status_code=403, detail="Student access required")
    
    analyses = await db.exam_analyses.find({"student_id": payload['user_id']}, {"_id": 0}).to_list(1000)
    return analyses

@router.get("/my-resource-tracking")
async def get_my_resource_tracking(payload: dict = Depends(verify_token)):
    if payload['role'] != UserRole.STUDENT.value:
        raise HTTPException(status_code=403, detail="Student access required")
    
    resources = await db.resource_tracking.find({"student_id": payload['user_id']}, {"_id": 0}).to_list(1000)
    return resources

@router.get("/my-assignments")
async def get_my_assignments(payload: dict = Depends(verify_token)):
    if payload['role'] != UserRole.STUDENT.value:
        raise HTTPException(status_code=403, detail="Student access required")
    
    assignments = await db.assignments.find({"student_id": payload['user_id']}, {"_id": 0}).to_list(1000)
    return assignments

@router.put("/assignment/{assignment_id}/complete")
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

@router.get("/my-study-schedule")
async def get_my_study_schedule(payload: dict = Depends(verify_token)):
    if payload['role'] != UserRole.STUDENT.value:
        raise HTTPException(status_code=403, detail="Student access required")
    
    schedules = await db.study_schedules.find({"student_id": payload['user_id']}, {"_id": 0}).to_list(1000)
    return schedules

@router.get("/my-weekly-schedules")
async def get_my_weekly_schedules(payload: dict = Depends(verify_token)):
    if payload['role'] != UserRole.STUDENT.value:
        raise HTTPException(status_code=403, detail="Student access required")
    
    schedules = await db.weekly_schedules.find(
        {"student_id": payload['user_id']},
        {"_id": 0}
    ).sort("week_start_date", -1).to_list(1000)
    return schedules

@router.get("/my-resources-with-topics")
async def get_my_resources_with_topics(payload: dict = Depends(verify_token)):
    if payload['role'] != UserRole.STUDENT.value:
        raise HTTPException(status_code=403, detail="Student access required")
    
    resources = await db.resources_with_topics.find(
        {"student_id": payload['user_id']},
        {"_id": 0}
    ).to_list(1000)
    return resources
