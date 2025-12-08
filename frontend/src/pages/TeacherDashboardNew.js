import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useStudentSelection } from '../context/StudentSelectionContext';
import api from '../utils/api';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { 
  Users, 
  LogOut, 
  BarChart3, 
  Calendar,
  BookOpen,
  Plus,
  Lightbulb,
  FileText
} from 'lucide-react';
import { toast } from 'sonner';

// Import sub-components
import WeeklyScheduleManager from '../components/teacher/WeeklyScheduleManager';
import ResourceManager from '../components/teacher/ResourceManager';
import QuestionEntryForm from '../components/teacher/QuestionEntryForm';
import ExamAnalysisManager from '../components/teacher/ExamAnalysisManager';

const TeacherDashboardNew = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { selectedStudent, setSelectedStudent } = useStudentSelection();
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.role !== 'teacher') {
      navigate('/login');
      return;
    }
    fetchStudents();
  }, [user, navigate]);

  const fetchStudents = async () => {
    try {
      const response = await api.get('/teacher/students');
      setStudents(response.data);
      if (response.data.length > 0 && !selectedStudent) {
        setSelectedStudent(response.data[0]);
      }
    } catch (error) {
      toast.error('Öğrenciler yüklenemedi');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-slate-400">Yükleniyor...</div>
      </div>
    );
  }

  if (students.length === 0) {
    return (
      <div className="min-h-screen bg-slate-950">
        <nav className="glassmorphism border-b border-slate-800 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-indigo-600 rounded-lg">
                <Users className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-slate-50">Öğretmen Paneli</h1>
                <p className="text-sm text-slate-400">{user?.full_name}</p>
              </div>
            </div>
            <Button onClick={logout} variant="outline" className="border-slate-700">
              <LogOut className="w-5 h-5 mr-2" />
              Çıkış
            </Button>
          </div>
        </nav>
        
        <div className="p-6 max-w-7xl mx-auto">
          <Card className="glassmorphism p-12 text-center">
            <Users className="w-16 h-16 text-slate-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-slate-300 mb-2">Henüz Öğrenciniz Yok</h3>
            <p className="text-slate-500">Admin tarafından size öğrenci atanmasını bekleyin.</p>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950">
      {/* Top Navigation */}
      <nav className="glassmorphism border-b border-slate-800 px-6 py-4 sticky top-0 z-50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-indigo-600 rounded-lg">
                <Users className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-slate-50">Öğretmen Paneli</h1>
                <p className="text-sm text-slate-400">{user?.full_name}</p>
              </div>
            </div>

            {/* Global Student Selector */}
            <div className="flex items-center gap-3 ml-8">
              <span className="text-sm text-slate-400 uppercase tracking-wider">Öğrenci:</span>
              <Select 
                value={selectedStudent?.id} 
                onValueChange={(value) => {
                  const student = students.find(s => s.id === value);
                  setSelectedStudent(student);
                }}
              >
                <SelectTrigger className="w-64 bg-slate-900 border-slate-700 text-slate-100" data-testid="global-student-select">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-900 border-slate-800">
                  {students.map((student) => (
                    <SelectItem key={student.id} value={student.id}>
                      {student.full_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <Button
              onClick={() => navigate('/statistics' + (selectedStudent ? `?student_id=${selectedStudent.id}` : ''))}
              variant="ghost"
              className="text-slate-300 hover:text-slate-100"
            >
              <BarChart3 className="w-5 h-5 mr-2" />
              İstatistikler
            </Button>
            <Button
              onClick={logout}
              variant="outline"
              className="border-slate-700 text-slate-300 hover:text-slate-100"
            >
              <LogOut className="w-5 h-5 mr-2" />
              Çıkış
            </Button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="p-6 max-w-7xl mx-auto">
        {!selectedStudent ? (
          <Card className="glassmorphism p-8 text-center">
            <p className="text-slate-400">Lütfen bir öğrenci seçin</p>
          </Card>
        ) : (
          <Tabs defaultValue="schedule" className="space-y-6">
            <TabsList className="bg-slate-900 border border-slate-800">
              <TabsTrigger value="schedule" data-testid="tab-schedule">
                <Calendar className="w-4 h-4 mr-2" />
                Haftalık Program
              </TabsTrigger>
              <TabsTrigger value="questions" data-testid="tab-questions">
                <BookOpen className="w-4 h-4 mr-2" />
                Soru Girişi
              </TabsTrigger>
              <TabsTrigger value="exam-analysis" data-testid="tab-exam-analysis">
                <Plus className="w-4 h-4 mr-2" />
                Deneme Analizi
              </TabsTrigger>
              <TabsTrigger value="resources" data-testid="tab-resources">
                <FileText className="w-4 h-4 mr-2" />
                Kaynak Takibi
              </TabsTrigger>
            </TabsList>

            <TabsContent value="schedule">
              <WeeklyScheduleManager studentId={selectedStudent.id} />
            </TabsContent>

            <TabsContent value="questions">
              <QuestionEntryForm studentId={selectedStudent.id} />
            </TabsContent>

            <TabsContent value="resources">
              <ResourceManager studentId={selectedStudent.id} />
            </TabsContent>
          </Tabs>
        )}
      </div>
    </div>
  );
};

export default TeacherDashboardNew;
