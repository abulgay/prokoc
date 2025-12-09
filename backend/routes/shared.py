from fastapi import APIRouter, HTTPException, Depends
from datetime import datetime
from database import db
from models import SubjectCreate, Subject, TopicCreate, Topic, UserRole
from utils import verify_token

router = APIRouter(tags=["shared"])

# Subjects
@router.post("/admin/subjects")
async def create_subject(subject_data: SubjectCreate, payload: dict = Depends(verify_token)):
    if payload['role'] != UserRole.ADMIN.value:
        raise HTTPException(status_code=403, detail="Admin access required")
    
    subject = Subject(name=subject_data.name, exam_type=subject_data.exam_type)
    subject_dict = subject.model_dump()
    subject_dict['created_at'] = subject_dict['created_at'].isoformat()
    await db.subjects.insert_one(subject_dict)
    return subject

@router.get("/admin/subjects")
async def get_subjects_admin(payload: dict = Depends(verify_token)):
    subjects = await db.subjects.find({}, {"_id": 0}).to_list(1000)
    return subjects

@router.get("/subjects")
async def get_all_subjects(payload: dict = Depends(verify_token)):
    subjects = await db.subjects.find({}, {"_id": 0}).to_list(1000)
    return subjects

# Topics
@router.post("/admin/topics")
async def create_topic(topic_data: TopicCreate, payload: dict = Depends(verify_token)):
    if payload['role'] != UserRole.ADMIN.value:
        raise HTTPException(status_code=403, detail="Admin access required")
    
    topic = Topic(subject_id=topic_data.subject_id, name=topic_data.name)
    topic_dict = topic.model_dump()
    topic_dict['created_at'] = topic_dict['created_at'].isoformat()
    await db.topics.insert_one(topic_dict)
    return topic

@router.get("/admin/topics/{subject_id}")
async def get_topics_by_subject_admin(subject_id: str, payload: dict = Depends(verify_token)):
    topics = await db.topics.find({"subject_id": subject_id}, {"_id": 0}).to_list(1000)
    return topics

@router.get("/topics/{subject_id}")
async def get_all_topics_by_subject(subject_id: str, payload: dict = Depends(verify_token)):
    topics = await db.topics.find({"subject_id": subject_id}, {"_id": 0}).to_list(1000)
    return topics

# Statistics
@router.get("/statistics/overview/{student_id}")
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

# Notifications
@router.get("/notifications")
async def get_notifications(payload: dict = Depends(verify_token)):
    notifications = await db.notifications.find({"user_id": payload['user_id']}, {"_id": 0}).sort("created_at", -1).to_list(100)
    return notifications

@router.put("/notifications/{notification_id}/read")
async def mark_notification_read(notification_id: str, payload: dict = Depends(verify_token)):
    result = await db.notifications.update_one(
        {"id": notification_id, "user_id": payload['user_id']},
        {"$set": {"read": True}}
    )
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Notification not found")
    
    return {"message": "Notification marked as read"}
