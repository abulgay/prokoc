import requests
import sys
import json
from datetime import datetime

class StudentCoachingAPITester:
    def __init__(self, base_url="https://studyplan-hub-8.preview.emergentagent.com/api"):
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

def main():
    print("🚀 Starting Student Coaching Platform API Tests")
    print("=" * 60)
    
    tester = StudentCoachingAPITester()
    
    # Test sequence
    tests = [
        ("Admin Login", tester.test_admin_login),
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
    
    for test_name, test_func in tests:
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
    
    if failed_tests:
        print(f"❌ Failed test categories: {', '.join(failed_tests)}")
        return 1
    else:
        print("✅ All test categories completed successfully!")
        return 0

if __name__ == "__main__":
    sys.exit(main())