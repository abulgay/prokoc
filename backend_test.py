import requests
import sys
import json
from datetime import datetime

class StudentCoachingAPITester:
    def __init__(self, base_url="https://educoach-19.preview.emergentagent.com/api"):
        self.base_url = base_url
        self.admin_token = None
        self.teacher_token = None
        self.student_token = None
        self.tests_run = 0
        self.tests_passed = 0
        self.created_users = []
        self.created_matches = []

    def run_test(self, name, method, endpoint, expected_status, data=None, token=None):
        """Run a single API test"""
        url = f"{self.base_url}/{endpoint}"
        headers = {'Content-Type': 'application/json'}
        if token:
            headers['Authorization'] = f'Bearer {token}'

        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=headers)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=headers)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=headers)

            success = response.status_code == expected_status
            if success:
                self.tests_passed += 1
                print(f"✅ Passed - Status: {response.status_code}")
                try:
                    return True, response.json() if response.text else {}
                except:
                    return True, {}
            else:
                print(f"❌ Failed - Expected {expected_status}, got {response.status_code}")
                try:
                    print(f"   Response: {response.json()}")
                except:
                    print(f"   Response: {response.text}")
                return False, {}

        except Exception as e:
            print(f"❌ Failed - Error: {str(e)}")
            return False, {}

    def test_admin_login(self):
        """Test admin login with provided credentials"""
        print("\n=== Testing Admin Login ===")
        success, response = self.run_test(
            "Admin Login",
            "POST",
            "auth/login",
            200,
            data={"email": "admin@test.com", "password": "admin123"}
        )
        if success and 'token' in response:
            self.admin_token = response['token']
            print(f"Admin user: {response.get('user', {}).get('full_name', 'Unknown')}")
            return True
        return False

    def test_user_registration(self):
        """Test user registration for teacher and student"""
        print("\n=== Testing User Registration ===")
        
        # Register teacher
        teacher_email = f"teacher_{datetime.now().strftime('%H%M%S')}@test.com"
        success, response = self.run_test(
            "Teacher Registration",
            "POST",
            "auth/register",
            200,
            data={
                "email": teacher_email,
                "password": "teacher123",
                "full_name": "Test Teacher",
                "role": "teacher"
            }
        )
        if success:
            self.created_users.append({"id": response['id'], "role": "teacher", "email": teacher_email})
        
        # Register student
        student_email = f"student_{datetime.now().strftime('%H%M%S')}@test.com"
        success2, response2 = self.run_test(
            "Student Registration",
            "POST",
            "auth/register",
            200,
            data={
                "email": student_email,
                "password": "student123",
                "full_name": "Test Student",
                "role": "student"
            }
        )
        if success2:
            self.created_users.append({"id": response2['id'], "role": "student", "email": student_email})
        
        return success and success2

    def test_admin_operations(self):
        """Test admin panel operations"""
        print("\n=== Testing Admin Operations ===")
        
        if not self.admin_token:
            print("❌ No admin token available")
            return False
        
        # Get pending users
        success1, pending_users = self.run_test(
            "Get Pending Users",
            "GET",
            "admin/pending-users",
            200,
            token=self.admin_token
        )
        
        # Get teachers and students
        success2, teachers = self.run_test(
            "Get Teachers",
            "GET",
            "admin/teachers",
            200,
            token=self.admin_token
        )
        
        success3, students = self.run_test(
            "Get Students",
            "GET",
            "admin/students",
            200,
            token=self.admin_token
        )
        
        # Approve users if any pending
        if success1 and pending_users:
            for user in pending_users[:2]:  # Approve first 2 users
                success_approve, _ = self.run_test(
                    f"Approve User {user['full_name']}",
                    "PUT",
                    f"admin/approve-user/{user['id']}",
                    200,
                    token=self.admin_token
                )
        
        return success1 and success2 and success3

    def test_user_login_after_approval(self):
        """Test user login after admin approval"""
        print("\n=== Testing User Login After Approval ===")
        
        # Try to login with created users
        for user in self.created_users:
            if user['role'] == 'teacher':
                success, response = self.run_test(
                    f"Teacher Login ({user['email']})",
                    "POST",
                    "auth/login",
                    200,
                    data={"email": user['email'], "password": "teacher123"}
                )
                if success and 'token' in response:
                    self.teacher_token = response['token']
            
            elif user['role'] == 'student':
                success, response = self.run_test(
                    f"Student Login ({user['email']})",
                    "POST",
                    "auth/login",
                    200,
                    data={"email": user['email'], "password": "student123"}
                )
                if success and 'token' in response:
                    self.student_token = response['token']
        
        return self.teacher_token is not None and self.student_token is not None

    def test_student_teacher_matching(self):
        """Test student-teacher matching"""
        print("\n=== Testing Student-Teacher Matching ===")
        
        if not self.admin_token or len(self.created_users) < 2:
            print("❌ Missing admin token or users")
            return False
        
        teacher_id = None
        student_id = None
        
        for user in self.created_users:
            if user['role'] == 'teacher':
                teacher_id = user['id']
            elif user['role'] == 'student':
                student_id = user['id']
        
        if not teacher_id or not student_id:
            print("❌ Missing teacher or student ID")
            return False
        
        success, response = self.run_test(
            "Create Student-Teacher Match",
            "POST",
            "admin/match",
            200,
            data={
                "student_id": student_id,
                "teacher_id": teacher_id
            },
            token=self.admin_token
        )
        
        if success:
            self.created_matches.append({"student_id": student_id, "teacher_id": teacher_id})
        
        return success

    def test_teacher_operations(self):
        """Test teacher panel operations"""
        print("\n=== Testing Teacher Operations ===")
        
        if not self.teacher_token:
            print("❌ No teacher token available")
            return False
        
        # Get teacher's students
        success1, students = self.run_test(
            "Get Teacher Students",
            "GET",
            "teacher/students",
            200,
            token=self.teacher_token
        )
        
        # Create question entry if students exist
        if success1 and students:
            student_id = students[0]['id']
            success2, response = self.run_test(
                "Create Question Entry",
                "POST",
                "teacher/question-entry",
                200,
                data={
                    "student_id": student_id,
                    "exam_type": "TYT",
                    "subject": "Matematik",
                    "total_questions": 40,
                    "correct_answers": 30,
                    "wrong_answers": 8,
                    "empty_answers": 2,
                    "notes": "Test soru girişi"
                },
                token=self.teacher_token
            )
            
            # Get question entries
            success3, entries = self.run_test(
                "Get Student Question Entries",
                "GET",
                f"teacher/question-entries/{student_id}",
                200,
                token=self.teacher_token
            )
            
            return success1 and success2 and success3
        
        return success1

    def test_student_operations(self):
        """Test student panel operations"""
        print("\n=== Testing Student Operations ===")
        
        if not self.student_token:
            print("❌ No student token available")
            return False
        
        # Get student's teacher
        success1, teacher = self.run_test(
            "Get Student Teacher",
            "GET",
            "student/my-teacher",
            200,
            token=self.student_token
        )
        
        # Get student's question entries
        success2, entries = self.run_test(
            "Get My Question Entries",
            "GET",
            "student/my-question-entries",
            200,
            token=self.student_token
        )
        
        # Get student's assignments
        success3, assignments = self.run_test(
            "Get My Assignments",
            "GET",
            "student/my-assignments",
            200,
            token=self.student_token
        )
        
        return success1 and success2 and success3

    def test_net_calculation(self):
        """Test net score calculation formula: Net = Doğru - (Yanlış / 3)"""
        print("\n=== Testing Net Calculation ===")
        
        # Test case: 30 doğru, 9 yanlış = 30 - (9/3) = 30 - 3 = 27
        expected_net = 30 - (9 / 3)  # Should be 27
        
        if self.teacher_token and self.created_users:
            student_id = None
            for user in self.created_users:
                if user['role'] == 'student':
                    student_id = user['id']
                    break
            
            if student_id:
                success, response = self.run_test(
                    "Test Net Calculation",
                    "POST",
                    "teacher/question-entry",
                    200,
                    data={
                        "student_id": student_id,
                        "exam_type": "TYT",
                        "subject": "Matematik",
                        "total_questions": 40,
                        "correct_answers": 30,
                        "wrong_answers": 9,
                        "empty_answers": 1,
                        "notes": "Net hesaplama testi"
                    },
                    token=self.teacher_token
                )
                
                if success and 'net_score' in response:
                    calculated_net = response['net_score']
                    if abs(calculated_net - expected_net) < 0.01:  # Allow small floating point differences
                        print(f"✅ Net calculation correct: {calculated_net} (expected: {expected_net})")
                        return True
                    else:
                        print(f"❌ Net calculation wrong: {calculated_net} (expected: {expected_net})")
                        return False
        
        return False

    def test_notifications(self):
        """Test notification system"""
        print("\n=== Testing Notifications ===")
        
        tokens_to_test = [
            ("Admin", self.admin_token),
            ("Teacher", self.teacher_token),
            ("Student", self.student_token)
        ]
        
        success_count = 0
        for role, token in tokens_to_test:
            if token:
                success, notifications = self.run_test(
                    f"Get {role} Notifications",
                    "GET",
                    "notifications",
                    200,
                    token=token
                )
                if success:
                    success_count += 1
                    print(f"   {role} has {len(notifications)} notifications")
        
        return success_count > 0

    def test_existing_user_login(self):
        """Test login with existing test credentials"""
        print("\n=== Testing Existing User Login ===")
        
        # Test admin login
        success1, response1 = self.run_test(
            "Existing Admin Login",
            "POST",
            "auth/login",
            200,
            data={"email": "admin@test.com", "password": "admin123"}
        )
        if success1 and 'token' in response1:
            self.admin_token = response1['token']
        
        # Test teacher login
        success2, response2 = self.run_test(
            "Existing Teacher Login",
            "POST",
            "auth/login",
            200,
            data={"email": "teacher@test.com", "password": "teacher123"}
        )
        if success2 and 'token' in response2:
            self.teacher_token = response2['token']
        
        # Test student login
        success3, response3 = self.run_test(
            "Existing Student Login",
            "POST",
            "auth/login",
            200,
            data={"email": "student@test.com", "password": "student123"}
        )
        if success3 and 'token' in response3:
            self.student_token = response3['token']
        
        return success1 and success2 and success3

    def test_student_resource_progress_bug_fix(self):
        """Test the CRITICAL bug fix: Student resource progress flow"""
        print("\n=== CRITICAL TEST: Student Resource Progress Bug Fix ===")
        
        if not self.teacher_token or not self.student_token:
            print("❌ Missing teacher or student tokens")
            return False
        
        # Use the specific student ID mentioned in the review request
        student_id = "82fc3778-05be-4a25-8233-593978e03c15"
        
        print(f"🔍 Testing with student ID: {student_id}")
        
        # Step 1: Get existing resources for this student
        print("\n📋 Step 1: Get existing resources for student")
        success1, existing_resources = self.run_test(
            "Get Student Resources (Teacher View)",
            "GET",
            f"teacher/resources-with-topics/{student_id}",
            200,
            token=self.teacher_token
        )
        
        if not success1:
            print("❌ Failed to get existing resources")
            return False
        
        print(f"   Found {len(existing_resources)} existing resources")
        
        # Step 2: Create a new resource if none exist, or use existing one
        resource_id = None
        if existing_resources:
            resource_id = existing_resources[0]['id']
            print(f"   Using existing resource: {existing_resources[0]['resource_name']}")
        else:
            print("\n📝 Step 2: Creating new resource with topics")
            success2, response2 = self.run_test(
                "Create Resource with Topics",
                "POST",
                "teacher/resource-with-topics",
                200,
                data={
                    "student_id": student_id,
                    "resource_name": "Test Matematik Kaynağı",
                    "subject": "Matematik",
                    "topics": [
                        {"name": "Fonksiyonlar", "status": "not_started"},
                        {"name": "Türev", "status": "not_started"},
                        {"name": "İntegral", "status": "not_started"}
                    ]
                },
                token=self.teacher_token
            )
            
            if not success2:
                print("❌ Failed to create resource")
                return False
            
            # Get the created resource
            success_get, new_resources = self.run_test(
                "Get Newly Created Resource",
                "GET",
                f"teacher/resources-with-topics/{student_id}",
                200,
                token=self.teacher_token
            )
            
            if success_get and new_resources:
                resource_id = new_resources[-1]['id']  # Get the last created resource
        
        if not resource_id:
            print("❌ No resource ID available for testing")
            return False
        
        # Step 3: Update a topic status (THE CRITICAL BUG FIX TEST)
        print(f"\n🔄 Step 3: Update topic status (CRITICAL BUG FIX)")
        
        # Get current resource state
        success3, current_resources = self.run_test(
            "Get Current Resource State",
            "GET",
            f"teacher/resources-with-topics/{student_id}",
            200,
            token=self.teacher_token
        )
        
        if not success3 or not current_resources:
            print("❌ Failed to get current resource state")
            return False
        
        # Find the resource and a topic to update
        target_resource = None
        for resource in current_resources:
            if resource['id'] == resource_id:
                target_resource = resource
                break
        
        if not target_resource or not target_resource.get('topics'):
            print("❌ No topics found in resource")
            return False
        
        # Update the first topic's status
        topic_to_update = target_resource['topics'][0]['name']
        old_status = target_resource['topics'][0]['status']
        new_status = "in_progress" if old_status == "not_started" else "completed"
        
        print(f"   Updating topic '{topic_to_update}' from '{old_status}' to '{new_status}'")
        
        success4, response4 = self.run_test(
            "Update Topic Status",
            "PUT",
            f"teacher/resource-topic-status/{resource_id}?topic_name={topic_to_update}&status={new_status}",
            200,
            token=self.teacher_token
        )
        
        if not success4:
            print("❌ Failed to update topic status")
            return False
        
        # Step 4: Verify update via teacher endpoint
        print("\n✅ Step 4: Verify update via teacher endpoint")
        success5, updated_resources = self.run_test(
            "Verify Teacher View Updated",
            "GET",
            f"teacher/resources-with-topics/{student_id}",
            200,
            token=self.teacher_token
        )
        
        if not success5:
            print("❌ Failed to verify teacher view")
            return False
        
        # Check if the update was successful
        updated_resource = None
        for resource in updated_resources:
            if resource['id'] == resource_id:
                updated_resource = resource
                break
        
        if not updated_resource:
            print("❌ Updated resource not found")
            return False
        
        topic_updated = False
        for topic in updated_resource['topics']:
            if topic['name'] == topic_to_update and topic['status'] == new_status:
                topic_updated = True
                print(f"   ✅ Topic '{topic_to_update}' successfully updated to '{new_status}'")
                break
        
        if not topic_updated:
            print(f"❌ Topic '{topic_to_update}' was not updated correctly")
            return False
        
        # Step 5: CRITICAL - Verify student sees the updated status
        print("\n🎯 Step 5: CRITICAL - Verify student sees updated status")
        success6, student_resources = self.run_test(
            "Student View Resources (CRITICAL TEST)",
            "GET",
            "student/my-resources-with-topics",
            200,
            token=self.student_token
        )
        
        if not success6:
            print("❌ CRITICAL FAILURE: Student cannot access resources")
            return False
        
        # Find the updated resource in student view
        student_resource = None
        for resource in student_resources:
            if resource['id'] == resource_id:
                student_resource = resource
                break
        
        if not student_resource:
            print("❌ CRITICAL FAILURE: Student cannot see the updated resource")
            return False
        
        # Check if student sees the updated topic status
        student_topic_updated = False
        for topic in student_resource['topics']:
            if topic['name'] == topic_to_update and topic['status'] == new_status:
                student_topic_updated = True
                print(f"   ✅ CRITICAL SUCCESS: Student sees topic '{topic_to_update}' as '{new_status}'")
                break
        
        if not student_topic_updated:
            print(f"❌ CRITICAL FAILURE: Student does not see updated status for '{topic_to_update}'")
            print(f"   Expected: {new_status}")
            for topic in student_resource['topics']:
                if topic['name'] == topic_to_update:
                    print(f"   Actual: {topic['status']}")
                    break
            return False
        
        print("\n🎉 CRITICAL BUG FIX VERIFICATION SUCCESSFUL!")
        print("   ✅ Teacher can update topic status")
        print("   ✅ Student immediately sees updated status")
        print("   ✅ Data consistency maintained between teacher and student views")
        
        return True

    def test_admin_core_functions(self):
        """Test admin core functions as specified in review request"""
        print("\n=== Testing Admin Core Functions ===")
        
        if not self.admin_token:
            print("❌ No admin token available")
            return False
        
        # Test subjects
        success1, subjects = self.run_test(
            "Get Admin Subjects",
            "GET",
            "admin/subjects",
            200,
            token=self.admin_token
        )
        
        if success1:
            print(f"   Found {len(subjects)} subjects")
        
        # Test students
        success2, students = self.run_test(
            "Get Admin Students",
            "GET",
            "admin/students",
            200,
            token=self.admin_token
        )
        
        if success2:
            print(f"   Found {len(students)} students")
        
        # Test teachers
        success3, teachers = self.run_test(
            "Get Admin Teachers",
            "GET",
            "admin/teachers",
            200,
            token=self.admin_token
        )
        
        if success3:
            print(f"   Found {len(teachers)} teachers")
        
        # Test matches
        success4, matches = self.run_test(
            "Get Admin Matches",
            "GET",
            "admin/matches",
            200,
            token=self.admin_token
        )
        
        if success4:
            print(f"   Found {len(matches)} student-teacher matches")
        
        return success1 and success2 and success3 and success4

    def test_teacher_schedule_management(self):
        """Test teacher schedule management"""
        print("\n=== Testing Teacher Schedule Management ===")
        
        if not self.teacher_token:
            print("❌ No teacher token available")
            return False
        
        # Use the specific student ID
        student_id = "82fc3778-05be-4a25-8233-593978e03c15"
        
        # Create a weekly schedule
        from datetime import datetime, timedelta
        week_start = datetime.now().replace(hour=0, minute=0, second=0, microsecond=0)
        
        success1, response1 = self.run_test(
            "Create Weekly Schedule",
            "POST",
            "teacher/weekly-schedule",
            200,
            data={
                "student_id": student_id,
                "week_start_date": week_start.isoformat(),
                "schedule_items": [
                    {
                        "day": 1,
                        "start_time": "09:00",
                        "end_time": "10:00",
                        "subject": "Matematik",
                        "topic": "Fonksiyonlar",
                        "resource": "Test Kaynağı",
                        "activity_type": "study",
                        "notes": "Test çalışma planı"
                    }
                ]
            },
            token=self.teacher_token
        )
        
        # Get weekly schedules
        success2, schedules = self.run_test(
            "Get Weekly Schedules",
            "GET",
            f"teacher/weekly-schedules/{student_id}",
            200,
            token=self.teacher_token
        )
        
        if success2:
            print(f"   Found {len(schedules)} weekly schedules")
        
        return success1 and success2

    def test_authentication_authorization(self):
        """Test JWT token generation and role-based access"""
        print("\n=== Testing Authentication & Authorization ===")
        
        # Test JWT token generation for all roles
        tokens_valid = True
        
        if self.admin_token:
            success1, admin_profile = self.run_test(
                "Admin Token Validation",
                "GET",
                "auth/me",
                200,
                token=self.admin_token
            )
            if success1 and admin_profile.get('role') == 'admin':
                print("   ✅ Admin JWT token valid")
            else:
                tokens_valid = False
        
        if self.teacher_token:
            success2, teacher_profile = self.run_test(
                "Teacher Token Validation",
                "GET",
                "auth/me",
                200,
                token=self.teacher_token
            )
            if success2 and teacher_profile.get('role') == 'teacher':
                print("   ✅ Teacher JWT token valid")
            else:
                tokens_valid = False
        
        if self.student_token:
            success3, student_profile = self.run_test(
                "Student Token Validation",
                "GET",
                "auth/me",
                200,
                token=self.student_token
            )
            if success3 and student_profile.get('role') == 'student':
                print("   ✅ Student JWT token valid")
            else:
                tokens_valid = False
        
        # Test role-based access control
        # Student should NOT be able to access teacher endpoints
        success4, _ = self.run_test(
            "Student Access Teacher Endpoint (Should Fail)",
            "GET",
            "teacher/students",
            403,  # Should be forbidden
            token=self.student_token
        )
        
        if success4:
            print("   ✅ Role-based access control working (student blocked from teacher endpoint)")
        
        # Teacher should NOT be able to access admin endpoints
        success5, _ = self.run_test(
            "Teacher Access Admin Endpoint (Should Fail)",
            "GET",
            "admin/pending-users",
            403,  # Should be forbidden
            token=self.teacher_token
        )
        
        if success5:
            print("   ✅ Role-based access control working (teacher blocked from admin endpoint)")
        
        return tokens_valid and success4 and success5

def main():
    print("🚀 Starting Student Coaching Platform API Tests")
    print("🎯 Focus: Recently Fixed Student Resource Progress Bug")
    print("=" * 60)
    
    tester = StudentCoachingAPITester()
    
    # Priority test sequence based on review request
    priority_tests = [
        ("Existing User Login", tester.test_existing_user_login),
        ("CRITICAL: Student Resource Progress Bug Fix", tester.test_student_resource_progress_bug_fix),
        ("Admin Core Functions", tester.test_admin_core_functions),
        ("Teacher Schedule Management", tester.test_teacher_schedule_management),
        ("Authentication & Authorization", tester.test_authentication_authorization),
    ]
    
    # Additional comprehensive tests
    additional_tests = [
        ("User Registration", tester.test_user_registration),
        ("Admin Operations", tester.test_admin_operations),
        ("User Login After Approval", tester.test_user_login_after_approval),
        ("Student-Teacher Matching", tester.test_student_teacher_matching),
        ("Teacher Operations", tester.test_teacher_operations),
        ("Student Operations", tester.test_student_operations),
        ("Net Calculation", tester.test_net_calculation),
        ("Notifications", tester.test_notifications)
    ]
    
    failed_tests = []
    critical_failed = False
    
    print("\n🔥 PRIORITY TESTS (Based on Review Request)")
    print("=" * 60)
    
    for test_name, test_func in priority_tests:
        try:
            result = test_func()
            if not result:
                failed_tests.append(test_name)
                if "CRITICAL" in test_name:
                    critical_failed = True
        except Exception as e:
            print(f"❌ {test_name} failed with exception: {str(e)}")
            failed_tests.append(test_name)
            if "CRITICAL" in test_name:
                critical_failed = True
    
    print("\n📋 ADDITIONAL COMPREHENSIVE TESTS")
    print("=" * 60)
    
    for test_name, test_func in additional_tests:
        try:
            result = test_func()
            if not result:
                failed_tests.append(test_name)
        except Exception as e:
            print(f"❌ {test_name} failed with exception: {str(e)}")
            failed_tests.append(test_name)
    
    # Print final results
    print("\n" + "=" * 60)
    print(f"📊 Test Results: {tester.tests_passed}/{tester.tests_run} tests passed")
    
    if critical_failed:
        print("🚨 CRITICAL FAILURE: Student Resource Progress Bug Fix Failed!")
        print("   This was the main user-reported issue that needed verification.")
    
    if failed_tests:
        print(f"❌ Failed test categories: {', '.join(failed_tests)}")
        return 1
    else:
        print("✅ All test categories completed successfully!")
        if not critical_failed:
            print("🎉 CRITICAL BUG FIX VERIFIED SUCCESSFULLY!")
        return 0

if __name__ == "__main__":
    sys.exit(main())