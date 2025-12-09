from fastapi import APIRouter, HTTPException, Depends
from typing import List
from datetime import datetime, timedelta
from database import db
from models import (
    UserResponse, UserRole, QuestionEntryCreate, QuestionEntry,
    ExamAnalysisCreate, ExamAnalysis, ResourceTrackingCreate, ResourceTracking,
    AssignmentCreate, Assignment, StudyScheduleCreate, StudySchedule,
    WeeklyScheduleCreate, WeeklySchedule, ResourceWithTopicsCreate, ResourceWithTopics,
    Notification
)
from utils import verify_token, calculate_net

router = APIRouter(prefix="/teacher", tags=["teacher"])

@router.get("/students", response_model=List[UserResponse])
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

@router.post("/question-entry")
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

@router.get("/question-entries/{student_id}")
async def get_student_question_entries(student_id: str, payload: dict = Depends(verify_token)):
    if payload['role'] != UserRole.TEACHER.value:
        raise HTTPException(status_code=403, detail="Teacher access required")
    
    entries = await db.question_entries.find({"student_id": student_id, "teacher_id": payload['user_id']}, {"_id": 0}).to_list(1000)
    return entries

@router.post("/exam-analysis")
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

@router.get("/exam-analyses/{student_id}")
async def get_student_exam_analyses(student_id: str, payload: dict = Depends(verify_token)):
    if payload['role'] != UserRole.TEACHER.value:
        raise HTTPException(status_code=403, detail="Teacher access required")
    
    analyses = await db.exam_analyses.find({"student_id": student_id, "teacher_id": payload['user_id']}, {"_id": 0}).to_list(1000)
    return analyses

@router.get("/exam-analysis-summary/{student_id}")
async def get_exam_analysis_summary(student_id: str, payload: dict = Depends(verify_token)):
    if payload['role'] != UserRole.TEACHER.value:
        raise HTTPException(status_code=403, detail="Teacher access required")
    
    analyses = await db.exam_analyses.find({"student_id": student_id, "teacher_id": payload['user_id']}, {"_id": 0}).to_list(1000)
    
    if not analyses:
        return {"analyses": [], "summary": {}}
    
    summary = {
        "total_exams": len(analyses),
        "average_net": sum([a['total_net'] for a in analyses]) / len(analyses),
        "best_exam": max(analyses, key=lambda x: x['total_net']),
        "worst_exam": min(analyses, key=lambda x: x['total_net']),
        "subject_performance": {}
    }
    
    for analysis in analyses:
        for subject in analysis['subjects']:
            subject_name = subject['name']
            if subject_name not in summary['subject_performance']:
                summary['subject_performance'][subject_name] = {
                    'total_net': 0,
                    'count': 0,
                    'total_correct': 0,
                    'total_wrong': 0
                }
            summary['subject_performance'][subject_name]['total_net'] += subject.get('net', 0)
            summary['subject_performance'][subject_name]['count'] += 1
            summary['subject_performance'][subject_name]['total_correct'] += subject.get('correct', 0)
            summary['subject_performance'][subject_name]['total_wrong'] += subject.get('wrong', 0)
    
    for subject_name in summary['subject_performance']:
        perf = summary['subject_performance'][subject_name]
        perf['average_net'] = perf['total_net'] / perf['count'] if perf['count'] > 0 else 0
    
    return {"analyses": analyses, "summary": summary}

@router.post("/resource-tracking")
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

@router.get("/resource-tracking/{student_id}")
async def get_student_resource_tracking(student_id: str, payload: dict = Depends(verify_token)):
    if payload['role'] != UserRole.TEACHER.value:
        raise HTTPException(status_code=403, detail="Teacher access required")
    
    resources = await db.resource_tracking.find({"student_id": student_id, "teacher_id": payload['user_id']}, {"_id": 0}).to_list(1000)
    return resources

@router.post("/assignment")
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

@router.get("/assignments/{student_id}")
async def get_student_assignments(student_id: str, payload: dict = Depends(verify_token)):
    if payload['role'] != UserRole.TEACHER.value:
        raise HTTPException(status_code=403, detail="Teacher access required")
    
    assignments = await db.assignments.find({"student_id": student_id, "teacher_id": payload['user_id']}, {"_id": 0}).to_list(1000)
    return assignments

@router.post("/study-schedule")
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

@router.get("/study-schedule/{student_id}")
async def get_student_study_schedule(student_id: str, payload: dict = Depends(verify_token)):
    if payload['role'] != UserRole.TEACHER.value:
        raise HTTPException(status_code=403, detail="Teacher access required")
    
    schedules = await db.study_schedules.find({"student_id": student_id, "teacher_id": payload['user_id']}, {"_id": 0}).to_list(1000)
    return schedules

@router.post("/weekly-schedule")
async def create_weekly_schedule(schedule_data: WeeklyScheduleCreate, payload: dict = Depends(verify_token)):
    if payload['role'] != UserRole.TEACHER.value:
        raise HTTPException(status_code=403, detail="Teacher access required")
    
    schedule = WeeklySchedule(
        student_id=schedule_data.student_id,
        teacher_id=payload['user_id'],
        week_start_date=schedule_data.week_start_date,
        week_end_date=schedule_data.week_start_date + timedelta(days=6),
        schedule_items=schedule_data.schedule_items
    )
    
    schedule_dict = schedule.model_dump()
    schedule_dict['week_start_date'] = schedule_dict['week_start_date'].isoformat()
    schedule_dict['week_end_date'] = schedule_dict['week_end_date'].isoformat()
    schedule_dict['created_at'] = schedule_dict['created_at'].isoformat()
    await db.weekly_schedules.insert_one(schedule_dict)
    
    return {"message": "Weekly schedule created successfully"}

@router.get("/weekly-schedules/{student_id}")
async def get_student_weekly_schedules(student_id: str, payload: dict = Depends(verify_token)):
    if payload['role'] != UserRole.TEACHER.value:
        raise HTTPException(status_code=403, detail="Teacher access required")
    
    schedules = await db.weekly_schedules.find(
        {"student_id": student_id, "teacher_id": payload['user_id']},
        {"_id": 0}
    ).sort("week_start_date", -1).to_list(1000)
    return schedules

@router.get("/suggested-schedule/{student_id}")
async def get_suggested_schedule(student_id: str, payload: dict = Depends(verify_token)):
    if payload['role'] != UserRole.TEACHER.value:
        raise HTTPException(status_code=403, detail="Teacher access required")
    
    entries = await db.question_entries.find({"student_id": student_id}, {"_id": 0}).to_list(1000)
    
    subject_performance = {}
    for entry in entries:
        subject = entry['subject']
        if subject not in subject_performance:
            subject_performance[subject] = {'correct': 0, 'wrong': 0, 'net': 0, 'count': 0}
        subject_performance[subject]['correct'] += entry['correct_answers']
        subject_performance[subject]['wrong'] += entry['wrong_answers']
        subject_performance[subject]['net'] += entry['net_score']
        subject_performance[subject]['count'] += 1
    
    suggested_items = []
    day = 1
    for subject, perf in sorted(subject_performance.items(), key=lambda x: x[1]['net'] / x[1]['count'] if x[1]['count'] > 0 else 0):
        avg_net = perf['net'] / perf['count'] if perf['count'] > 0 else 0
        
        if avg_net < 20:
            duration = 3
        elif avg_net < 30:
            duration = 2
        else:
            duration = 1
        
        start_hour = 9 + (day - 1) * 3
        suggested_items.append({
            'day': day,
            'start_time': f"{start_hour:02d}:00",
            'end_time': f"{start_hour + duration:02d}:00",
            'subject': subject,
            'topic': 'Zayıf Konular',
            'resource': 'Önerilen Kaynak',
            'activity_type': 'study',
            'notes': f'Ortalama net: {avg_net:.2f} - İyileştirme gerekiyor'
        })
        day += 1
        if day > 7:
            break
    
    return {
        "suggested_items": suggested_items,
        "analysis": subject_performance
    }

@router.post("/resource-with-topics")
async def create_resource_with_topics(resource_data: ResourceWithTopicsCreate, payload: dict = Depends(verify_token)):
    if payload['role'] != UserRole.TEACHER.value:
        raise HTTPException(status_code=403, detail="Teacher access required")
    
    resource = ResourceWithTopics(
        student_id=resource_data.student_id,
        teacher_id=payload['user_id'],
        resource_name=resource_data.resource_name,
        subject=resource_data.subject,
        topics=resource_data.topics
    )
    
    resource_dict = resource.model_dump()
    resource_dict['created_at'] = resource_dict['created_at'].isoformat()
    await db.resources_with_topics.insert_one(resource_dict)
    
    return {"message": "Resource created successfully"}

@router.get("/resources-with-topics/{student_id}")
async def get_student_resources_with_topics(student_id: str, payload: dict = Depends(verify_token)):
    if payload['role'] != UserRole.TEACHER.value:
        raise HTTPException(status_code=403, detail="Teacher access required")
    
    resources = await db.resources_with_topics.find(
        {"student_id": student_id, "teacher_id": payload['user_id']},
        {"_id": 0}
    ).to_list(1000)
    return resources

@router.put("/resource-topic-status/{resource_id}")
async def update_resource_topic_status(resource_id: str, topic_name: str, status: str, payload: dict = Depends(verify_token)):
    if payload['role'] != UserRole.TEACHER.value:
        raise HTTPException(status_code=403, detail="Teacher access required")
    
    resource = await db.resources_with_topics.find_one({"id": resource_id}, {"_id": 0})
    if not resource:
        raise HTTPException(status_code=404, detail="Resource not found")
    
    for topic in resource['topics']:
        if topic['name'] == topic_name:
            topic['status'] = status
            break
    
    await db.resources_with_topics.update_one(
        {"id": resource_id},
        {"$set": {"topics": resource['topics']}}
    )
    
    return {"message": "Topic status updated"}
