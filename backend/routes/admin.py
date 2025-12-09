from fastapi import APIRouter, HTTPException, Depends
from typing import List
from datetime import datetime, timezone
from database import db
from models import (
    UserResponse, UserRole, ApprovalStatus, StudentTeacherMatch, 
    Notification, User, UserRegister, UserUpdate, ParentStudentRelation
)
from utils import verify_token, pwd_context

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

# User Management Endpoints
@router.post("/users", response_model=UserResponse)
async def create_user(
    user_data: UserRegister, 
    payload: dict = Depends(verify_token),
    parent_id: str = None,
    student_id: str = None
):
    if payload['role'] != UserRole.ADMIN.value:
        raise HTTPException(status_code=403, detail="Admin access required")
    
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
        address=user_data.address,
        goal=user_data.goal,
        approval_status=ApprovalStatus.APPROVED
    )
    
    user_dict = user.model_dump()
    user_dict['created_at'] = user_dict['created_at'].isoformat()
    user_dict['updated_at'] = user_dict['updated_at'].isoformat()
    
    await db.users.insert_one(user_dict)
    return UserResponse(**user_dict)

@router.put("/users/{user_id}", response_model=UserResponse)
async def update_user(user_id: str, user_data: UserUpdate, payload: dict = Depends(verify_token)):
    if payload['role'] != UserRole.ADMIN.value:
        raise HTTPException(status_code=403, detail="Admin access required")
    
    update_data = {k: v for k, v in user_data.model_dump().items() if v is not None}
    if not update_data:
        raise HTTPException(status_code=400, detail="No data to update")
    
    update_data['updated_at'] = datetime.now(timezone.utc).isoformat()
    
    result = await db.users.update_one(
        {"id": user_id},
        {"$set": update_data}
    )
    if result.modified_count == 0:
        user = await db.users.find_one({"id": user_id}, {"_id": 0})
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
    
    updated_user = await db.users.find_one({"id": user_id}, {"_id": 0})
    return UserResponse(
        id=updated_user['id'],
        email=updated_user['email'],
        full_name=updated_user['full_name'],
        role=updated_user['role'],
        approval_status=updated_user['approval_status'],
        school=updated_user.get('school'),
        grade=updated_user.get('grade'),
        birth_date=updated_user.get('birth_date'),
        phone=updated_user.get('phone'),
        address=updated_user.get('address'),
        created_at=datetime.fromisoformat(updated_user['created_at'])
    )

@router.delete("/users/{user_id}")
async def delete_user(user_id: str, payload: dict = Depends(verify_token)):
    if payload['role'] != UserRole.ADMIN.value:
        raise HTTPException(status_code=403, detail="Admin access required")
    
    result = await db.users.delete_one({"id": user_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="User not found")
    
    await db.matches.delete_many({"$or": [{"student_id": user_id}, {"teacher_id": user_id}]})
    await db.parent_student_relations.delete_many({"$or": [{"parent_id": user_id}, {"student_id": user_id}]})
    
    return {"message": "User deleted successfully"}

@router.get("/parents", response_model=List[UserResponse])
async def get_all_parents(payload: dict = Depends(verify_token)):
    if payload['role'] != UserRole.ADMIN.value:
        raise HTTPException(status_code=403, detail="Admin access required")
    
    parents = await db.users.find({"role": UserRole.PARENT.value, "approval_status": ApprovalStatus.APPROVED.value}, {"_id": 0}).to_list(1000)
    return [UserResponse(
        id=p['id'],
        email=p['email'],
        full_name=p['full_name'],
        role=p['role'],
        approval_status=p['approval_status'],
        school=p.get('school'),
        grade=p.get('grade'),
        birth_date=p.get('birth_date'),
        phone=p.get('phone'),
        address=p.get('address'),
        created_at=datetime.fromisoformat(p['created_at'])
    ) for p in parents]

# Parent-Student Relation Endpoints
@router.post("/parent-student-relation")
async def create_parent_student_relation(relation_data: ParentStudentRelation, payload: dict = Depends(verify_token)):
    if payload['role'] != UserRole.ADMIN.value:
        raise HTTPException(status_code=403, detail="Admin access required")
    
    parent = await db.users.find_one({"id": relation_data.parent_id, "role": UserRole.PARENT.value}, {"_id": 0})
    if not parent:
        raise HTTPException(status_code=404, detail="Parent not found")
    
    student = await db.users.find_one({"id": relation_data.student_id, "role": UserRole.STUDENT.value}, {"_id": 0})
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    
    existing = await db.parent_student_relations.find_one({
        "parent_id": relation_data.parent_id,
        "student_id": relation_data.student_id
    }, {"_id": 0})
    if existing:
        raise HTTPException(status_code=400, detail="Relation already exists")
    
    relation_dict = relation_data.model_dump()
    relation_dict['created_at'] = relation_dict['created_at'].isoformat()
    await db.parent_student_relations.insert_one(relation_dict)
    
    parent_notif = Notification(
        user_id=relation_data.parent_id,
        title="Öğrenci İlişkisi Eklendi",
        message=f"{student['full_name']} ile veli-öğrenci ilişkisi kuruldu.",
        type="relation"
    )
    student_notif = Notification(
        user_id=relation_data.student_id,
        title="Veli İlişkisi Eklendi",
        message=f"{parent['full_name']} veliniz olarak eklendi.",
        type="relation"
    )
    
    parent_notif_dict = parent_notif.model_dump()
    parent_notif_dict['created_at'] = parent_notif_dict['created_at'].isoformat()
    student_notif_dict = student_notif.model_dump()
    student_notif_dict['created_at'] = student_notif_dict['created_at'].isoformat()
    
    await db.notifications.insert_one(parent_notif_dict)
    await db.notifications.insert_one(student_notif_dict)
    
    return {"message": "Relation created successfully"}

@router.get("/parent-student-relations")
async def get_all_parent_student_relations(payload: dict = Depends(verify_token)):
    if payload['role'] != UserRole.ADMIN.value:
        raise HTTPException(status_code=403, detail="Admin access required")
    
    relations = await db.parent_student_relations.find({}, {"_id": 0}).to_list(1000)
    return relations

@router.delete("/parent-student-relation/{relation_id}")
async def delete_parent_student_relation(relation_id: str, payload: dict = Depends(verify_token)):
    if payload['role'] != UserRole.ADMIN.value:
        raise HTTPException(status_code=403, detail="Admin access required")
    
    result = await db.parent_student_relations.delete_one({"id": relation_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Relation not found")
    
    return {"message": "Relation deleted successfully"}

