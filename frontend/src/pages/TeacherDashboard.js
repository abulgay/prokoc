import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Textarea } from '../components/ui/textarea';
import { Users, LogOut, BarChart3, BookOpen, ClipboardList, Calendar, FileText } from 'lucide-react';
import { toast } from 'sonner';

const TeacherDashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [students, setStudents] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState('');
  const [loading, setLoading] = useState(true);

  const [questionForm, setQuestionForm] = useState({
    exam_type: 'TYT',
    subject: '',
    total_questions: '',
    correct_answers: '',
    wrong_answers: '',
    empty_answers: '',
    notes: ''
  });

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
    } catch (error) {
      toast.error('Öğrenciler yüklenemedi');
    } finally {
      setLoading(false);
    }
  };

  const handleQuestionSubmit = async (e) => {
    e.preventDefault();
    if (!selectedStudent) {
      toast.error('Lütfen öğrenci seçin');
      return;
    }

    try {
      await api.post('/teacher/question-entry', {
        ...questionForm,
        student_id: selectedStudent,
        total_questions: parseInt(questionForm.total_questions),
        correct_answers: parseInt(questionForm.correct_answers),
        wrong_answers: parseInt(questionForm.wrong_answers),
        empty_answers: parseInt(questionForm.empty_answers || 0)
      });
      toast.success('Soru girişi başarılı');
      setQuestionForm({
        exam_type: 'TYT',
        subject: '',
        total_questions: '',
        correct_answers: '',
        wrong_answers: '',
        empty_answers: '',
        notes: ''
      });
    } catch (error) {
      toast.error('Soru girişi başarısız');
    }
  };

  const subjects = {
    TYT: ['Türkçe', 'Matematik', 'Fen Bilimleri', 'Sosyal Bilimler'],
    AYT: ['Matematik', 'Fizik', 'Kimya', 'Biyoloji', 'Edebiyat', 'Tarih', 'Coğrafya']
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-slate-400">Yükleniyor...</div>
      </div>
    );
  }

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
          <div className="flex items-center gap-4">
            <Button
              onClick={() => navigate('/statistics')}
              variant="ghost"
              className="text-slate-300 hover:text-slate-100"
              data-testid="statistics-button"
            >
              <BarChart3 className="w-5 h-5 mr-2" />
              İstatistikler
            </Button>
            <Button
              onClick={logout}
              variant="outline"
              className="border-slate-700 text-slate-300 hover:text-slate-100"
              data-testid="logout-button"
            >
              <LogOut className="w-5 h-5 mr-2" />
              Çıkış
            </Button>
          </div>
        </div>
      </nav>

      <div className="p-6 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="glassmorphism p-6 card-hover" data-testid="stat-students">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-400 uppercase tracking-wider">Öğrencilerim</p>
                <p className="text-3xl font-bold text-green-400 font-mono mt-2">{students.length}</p>
              </div>
              <Users className="w-10 h-10 text-green-400 opacity-50" />
            </div>
          </Card>
        </div>

        {students.length === 0 ? (
          <Card className="glassmorphism p-12 text-center">
            <Users className="w-16 h-16 text-slate-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-slate-300 mb-2">Henüz Öğrenciniz Yok</h3>
            <p className="text-slate-500">Admin tarafından size öğrenci atanmasını bekleyin.</p>
          </Card>
        ) : (
          <Tabs defaultValue="questions" className="space-y-6">
            <TabsList className="bg-slate-900 border border-slate-800">
              <TabsTrigger value="questions" data-testid="tab-questions">
                <BookOpen className="w-4 h-4 mr-2" />
                Soru Girişi
              </TabsTrigger>
              <TabsTrigger value="assignments" data-testid="tab-assignments">
                <ClipboardList className="w-4 h-4 mr-2" />
                Ödevler
              </TabsTrigger>
              <TabsTrigger value="resources" data-testid="tab-resources">
                <FileText className="w-4 h-4 mr-2" />
                Kaynak Takibi
              </TabsTrigger>
              <TabsTrigger value="schedule" data-testid="tab-schedule">
                <Calendar className="w-4 h-4 mr-2" />
                Ders Programı
              </TabsTrigger>
              <TabsTrigger value="students" data-testid="tab-students">
                <Users className="w-4 h-4 mr-2" />
                Öğrencilerim
              </TabsTrigger>
            </TabsList>

            <TabsContent value="questions">
              <Card className="glassmorphism p-6">
                <h2 className="text-xl font-bold text-slate-50 mb-6">Soru Çözüm Takibi</h2>
                
                <form onSubmit={handleQuestionSubmit} className="space-y-6" data-testid="question-form">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label className="text-slate-300">Öğrenci Seç</Label>
                      <Select value={selectedStudent} onValueChange={setSelectedStudent}>
                        <SelectTrigger className="bg-slate-900 border-slate-800 text-slate-100" data-testid="select-student">
                          <SelectValue placeholder="Öğrenci seçin" />
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

                    <div className="space-y-2">
                      <Label className="text-slate-300">Sınav Türü</Label>
                      <Select value={questionForm.exam_type} onValueChange={(value) => setQuestionForm({...questionForm, exam_type: value})}>
                        <SelectTrigger className="bg-slate-900 border-slate-800 text-slate-100">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-slate-900 border-slate-800">
                          <SelectItem value="TYT">TYT</SelectItem>
                          <SelectItem value="AYT">AYT</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-slate-300">Ders</Label>
                      <Select value={questionForm.subject} onValueChange={(value) => setQuestionForm({...questionForm, subject: value})}>
                        <SelectTrigger className="bg-slate-900 border-slate-800 text-slate-100">
                          <SelectValue placeholder="Ders seçin" />
                        </SelectTrigger>
                        <SelectContent className="bg-slate-900 border-slate-800">
                          {subjects[questionForm.exam_type]?.map((subject) => (
                            <SelectItem key={subject} value={subject}>{subject}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-slate-300">Toplam Soru</Label>
                      <Input
                        type="number"
                        value={questionForm.total_questions}
                        onChange={(e) => setQuestionForm({...questionForm, total_questions: e.target.value})}
                        className="bg-slate-900 border-slate-800 text-slate-100"
                        required
                        data-testid="total-questions-input"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label className="text-slate-300">Doğru</Label>
                      <Input
                        type="number"
                        value={questionForm.correct_answers}
                        onChange={(e) => setQuestionForm({...questionForm, correct_answers: e.target.value})}
                        className="bg-slate-900 border-slate-800 text-slate-100"
                        required
                        data-testid="correct-answers-input"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label className="text-slate-300">Yanlış</Label>
                      <Input
                        type="number"
                        value={questionForm.wrong_answers}
                        onChange={(e) => setQuestionForm({...questionForm, wrong_answers: e.target.value})}
                        className="bg-slate-900 border-slate-800 text-slate-100"
                        required
                        data-testid="wrong-answers-input"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-slate-300">Notlar (Opsiyonel)</Label>
                    <Textarea
                      value={questionForm.notes}
                      onChange={(e) => setQuestionForm({...questionForm, notes: e.target.value})}
                      className="bg-slate-900 border-slate-800 text-slate-100"
                      rows={3}
                    />
                  </div>

                  <Button
                    type="submit"
                    className="w-full bg-indigo-600 hover:bg-indigo-500 glow-button"
                    data-testid="submit-question-button"
                  >
                    <BookOpen className="w-5 h-5 mr-2" />
                    Kaydet ve Net Hesapla
                  </Button>
                </form>
              </Card>
            </TabsContent>

            <TabsContent value="students">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {students.map((student) => (
                  <Card key={student.id} className="glassmorphism p-6 card-hover" data-testid={`student-card-${student.id}`}>
                    <div className="flex items-center gap-4 mb-4">
                      <div className="p-3 bg-green-600 rounded-full">
                        <Users className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-slate-50">{student.full_name}</h3>
                        <p className="text-sm text-slate-400">{student.email}</p>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </TabsContent>
          </Tabs>
        )}
      </div>
    </div>
  );
};

export default TeacherDashboard;
