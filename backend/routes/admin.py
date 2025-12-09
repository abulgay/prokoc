from fastapi import APIRouter, HTTPException, Depends
from typing import List
from datetime import datetime, timezone
from database import db
from models import UserResponse, UserRole, ApprovalStatus, StudentTeacherMatch, Notification
from utils import verify_token

router = APIRouter(prefix="/admin", tags=["admin"])

@router.get("/pending-users", response_model=List[UserResponse])
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

@router.put("/approve-user/{user_id}")
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

@router.put("/reject-user/{user_id}")
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

@router.get("/teachers", response_model=List[UserResponse])
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

@router.get("/students", response_model=List[UserResponse])
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

@router.post("/match")
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

@router.get("/matches")
async def get_all_matches(payload: dict = Depends(verify_token)):
    if payload['role'] != UserRole.ADMIN.value:
        raise HTTPException(status_code=403, detail="Admin access required")
    
    matches = await db.matches.find({}, {"_id": 0}).to_list(1000)
    return matches

@router.get("/reports")
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
