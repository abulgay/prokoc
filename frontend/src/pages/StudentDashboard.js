import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Users, LogOut, BarChart3, BookOpen, ClipboardList, TrendingUp } from 'lucide-react';
import { toast } from 'sonner';

const StudentDashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [teacher, setTeacher] = useState(null);
  const [questionEntries, setQuestionEntries] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [resources, setResources] = useState([]);
  const [schedule, setSchedule] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.role !== 'student') {
      navigate('/login');
      return;
    }
    fetchData();
  }, [user, navigate]);

  const fetchData = async () => {
    try {
      const [teacherRes, entriesRes, assignmentsRes] = await Promise.all([
        api.get('/student/my-teacher'),
        api.get('/student/my-question-entries'),
        api.get('/student/my-assignments')
      ]);
      
      setTeacher(teacherRes.data);
      setQuestionEntries(entriesRes.data);
      setAssignments(assignmentsRes.data);
    } catch (error) {
      toast.error('Veri yüklenirken hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const handleCompleteAssignment = async (assignmentId) => {
    try {
      await api.put(`/student/assignment/${assignmentId}/complete`);
      toast.success('Ödev tamamlandı olarak işaretlendi');
      fetchData();
    } catch (error) {
      toast.error('İşlem başarısız');
    }
  };

  const calculateStats = () => {
    const totalQuestions = questionEntries.reduce((sum, e) => sum + e.total_questions, 0);
    const totalCorrect = questionEntries.reduce((sum, e) => sum + e.correct_answers, 0);
    const totalWrong = questionEntries.reduce((sum, e) => sum + e.wrong_answers, 0);
    const totalNet = questionEntries.reduce((sum, e) => sum + e.net_score, 0);
    
    return { totalQuestions, totalCorrect, totalWrong, totalNet };
  };

  const stats = calculateStats();

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
              <BookOpen className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-50">Öğrenci Paneli</h1>
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
        {!teacher ? (
          <Card className="glassmorphism p-12 text-center">
            <Users className="w-16 h-16 text-slate-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-slate-300 mb-2">Henüz Öğretmeniniz Yok</h3>
            <p className="text-slate-500">Admin tarafından size öğretmen atanmasını bekleyin.</p>
          </Card>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <Card className="glassmorphism p-6 card-hover" data-testid="stat-total-net">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-400 uppercase tracking-wider">Toplam Net</p>
                    <p className="text-3xl font-bold text-indigo-400 font-mono mt-2">{stats.totalNet.toFixed(2)}</p>
                  </div>
                  <TrendingUp className="w-10 h-10 text-indigo-400 opacity-50" />
                </div>
              </Card>

              <Card className="glassmorphism p-6 card-hover" data-testid="stat-correct">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-400 uppercase tracking-wider">Doğru</p>
                    <p className="text-3xl font-bold text-green-400 font-mono mt-2">{stats.totalCorrect}</p>
                  </div>
                  <BookOpen className="w-10 h-10 text-green-400 opacity-50" />
                </div>
              </Card>

              <Card className="glassmorphism p-6 card-hover" data-testid="stat-wrong">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-400 uppercase tracking-wider">Yanlış</p>
                    <p className="text-3xl font-bold text-red-400 font-mono mt-2">{stats.totalWrong}</p>
                  </div>
                  <BookOpen className="w-10 h-10 text-red-400 opacity-50" />
                </div>
              </Card>

              <Card className="glassmorphism p-6 card-hover" data-testid="stat-assignments">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-400 uppercase tracking-wider">Ödevler</p>
                    <p className="text-3xl font-bold text-amber-400 font-mono mt-2">{assignments.length}</p>
                  </div>
                  <ClipboardList className="w-10 h-10 text-amber-400 opacity-50" />
                </div>
              </Card>
            </div>

            <Tabs defaultValue="teacher" className="space-y-6">
              <TabsList className="bg-slate-900 border border-slate-800">
                <TabsTrigger value="teacher" data-testid="tab-teacher">Öğretmenim</TabsTrigger>
                <TabsTrigger value="entries" data-testid="tab-entries">Çözümlerim</TabsTrigger>
                <TabsTrigger value="assignments" data-testid="tab-assignments">Ödevlerim</TabsTrigger>
              </TabsList>

              <TabsContent value="teacher">
                <Card className="glassmorphism p-6">
                  <h2 className="text-xl font-bold text-slate-50 mb-6">Öğretmenim</h2>
                  <div className="flex items-center gap-4">
                    <div className="p-4 bg-blue-600 rounded-full">
                      <Users className="w-8 h-8 text-white" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-slate-50">{teacher.full_name}</h3>
                      <p className="text-slate-400">{teacher.email}</p>
                    </div>
                  </div>
                </Card>
              </TabsContent>

              <TabsContent value="entries">
                <Card className="glassmorphism p-6">
                  <h2 className="text-xl font-bold text-slate-50 mb-6">Son Çözümlerim</h2>
                  {questionEntries.length === 0 ? (
                    <p className="text-slate-400 text-center py-8">Henüz soru çözümü kaydı yok</p>
                  ) : (
                    <div className="space-y-4">
                      {questionEntries.slice(-10).reverse().map((entry, idx) => (
                        <div key={idx} className="glassmorphism p-4 rounded-lg" data-testid={`entry-${idx}`}>
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-3">
                              <span className="px-3 py-1 bg-indigo-600 rounded-full text-sm font-medium">{entry.exam_type}</span>
                              <span className="text-slate-300 font-medium">{entry.subject}</span>
                            </div>
                            <span className="text-2xl font-bold text-indigo-400 font-mono">{entry.net_score.toFixed(2)}</span>
                          </div>
                          <div className="flex gap-6 text-sm">
                            <span className="text-green-400">Doğru: {entry.correct_answers}</span>
                            <span className="text-red-400">Yanlış: {entry.wrong_answers}</span>
                            <span className="text-slate-500">Boş: {entry.empty_answers}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </Card>
              </TabsContent>

              <TabsContent value="assignments">
                <Card className="glassmorphism p-6">
                  <h2 className="text-xl font-bold text-slate-50 mb-6">Ödevlerim</h2>
                  {assignments.length === 0 ? (
                    <p className="text-slate-400 text-center py-8">Henüz ödev yok</p>
                  ) : (
                    <div className="space-y-4">
                      {assignments.map((assignment) => (
                        <div key={assignment.id} className="glassmorphism p-6 rounded-lg" data-testid={`assignment-${assignment.id}`}>
                          <div className="flex items-start justify-between mb-4">
                            <div className="flex-1">
                              <h3 className="text-lg font-semibold text-slate-50 mb-2">{assignment.title}</h3>
                              <p className="text-slate-400 mb-3">{assignment.description}</p>
                              <div className="flex gap-4 text-sm">
                                <span className="text-slate-500">Ders: {assignment.subject}</span>
                                <span className="text-slate-500">
                                  Son Tarih: {new Date(assignment.due_date).toLocaleDateString('tr-TR')}
                                </span>
                              </div>
                            </div>
                            <div className="flex flex-col items-end gap-2">
                              <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                                assignment.status === 'completed' 
                                  ? 'bg-green-500/20 text-green-400' 
                                  : 'bg-amber-500/20 text-amber-400'
                              }`}>
                                {assignment.status === 'completed' ? 'Tamamlandı' : 'Bekliyor'}
                              </span>
                              {assignment.status !== 'completed' && (
                                <Button
                                  size="sm"
                                  onClick={() => handleCompleteAssignment(assignment.id)}
                                  className="bg-green-600 hover:bg-green-500"
                                  data-testid={`complete-${assignment.id}`}
                                >
                                  Tamamla
                                </Button>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </Card>
              </TabsContent>
            </Tabs>
          </>
        )}
      </div>
    </div>
  );
};

export default StudentDashboard;
