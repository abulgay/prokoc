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
  const [weeklySchedules, setWeeklySchedules] = useState([]);
  const [selectedWeek, setSelectedWeek] = useState(null);
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
      const [teacherRes, entriesRes, assignmentsRes, resourcesRes, weeklyRes] = await Promise.all([
        api.get('/student/my-teacher'),
        api.get('/student/my-question-entries'),
        api.get('/student/my-assignments'),
        api.get('/student/my-resources-with-topics'),
        api.get('/student/my-weekly-schedules')
      ]);
      
      setTeacher(teacherRes.data);
      setQuestionEntries(entriesRes.data);
      setAssignments(assignmentsRes.data);
      setResources(resourcesRes.data);
      setWeeklySchedules(weeklyRes.data);
      if (weeklyRes.data.length > 0) {
        setSelectedWeek(weeklyRes.data[0]);
      }
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
                <TabsTrigger value="program" data-testid="tab-program">Haftalık Programım</TabsTrigger>
                <TabsTrigger value="entries" data-testid="tab-entries">Çözümlerim</TabsTrigger>
                <TabsTrigger value="assignments" data-testid="tab-assignments">Ödevlerim</TabsTrigger>
                <TabsTrigger value="resources" data-testid="tab-resources">Kaynaklarım</TabsTrigger>
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

              <TabsContent value="program">
                <Card className="glassmorphism p-6">
                  <div className="mb-6">
                    <h2 className="text-xl font-bold text-slate-50 mb-2">Haftalık Çalışma Programım</h2>
                    {selectedWeek && (
                      <p className="text-slate-400">
                        {new Date(selectedWeek.week_start_date).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long' })} - {' '}
                        {new Date(selectedWeek.week_end_date).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })}
                      </p>
                    )}
                  </div>

                  {weeklySchedules.length === 0 ? (
                    <div className="text-center py-12">
                      <Calendar className="w-16 h-16 text-slate-600 mx-auto mb-4" />
                      <p className="text-slate-400">Henüz haftalık program oluşturulmamış</p>
                    </div>
                  ) : (
                    <>
                      {/* Week Selector */}
                      {weeklySchedules.length > 1 && (
                        <div className="mb-6 flex gap-2 flex-wrap">
                          {weeklySchedules.map((week, idx) => (
                            <Button
                              key={idx}
                              onClick={() => setSelectedWeek(week)}
                              variant={selectedWeek?.id === week.id ? 'default' : 'outline'}
                              size="sm"
                              className={selectedWeek?.id === week.id ? 'bg-indigo-600' : 'border-slate-700 text-slate-300'}
                            >
                              {new Date(week.week_start_date).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' })}
                            </Button>
                          ))}
                        </div>
                      )}

                      {/* Program Table */}
                      {selectedWeek && (
                        <div className="overflow-x-auto">
                          <table className="w-full border-collapse">
                            <thead>
                              <tr className="border-b-2 border-slate-700">
                                <th className="text-left py-3 px-4 text-slate-300 font-semibold">Gün</th>
                                <th className="text-left py-3 px-4 text-slate-300 font-semibold">Saat</th>
                                <th className="text-left py-3 px-4 text-slate-300 font-semibold">Ders</th>
                                <th className="text-left py-3 px-4 text-slate-300 font-semibold">Konu</th>
                                <th className="text-left py-3 px-4 text-slate-300 font-semibold">Kaynak</th>
                                <th className="text-left py-3 px-4 text-slate-300 font-semibold">Aktivite</th>
                              </tr>
                            </thead>
                            <tbody>
                              {(() => {
                                const daysOfWeek = ['Pazar', 'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi'];
                                const itemsByDay = {};
                                [1, 2, 3, 4, 5, 6, 0].forEach(day => {
                                  itemsByDay[day] = selectedWeek.schedule_items.filter(item => item.day === day)
                                    .sort((a, b) => a.start_time.localeCompare(b.start_time));
                                });
                                
                                return [1, 2, 3, 4, 5, 6, 0].map(day => (
                                  <React.Fragment key={day}>
                                    {itemsByDay[day].length > 0 ? (
                                      itemsByDay[day].map((item, idx) => (
                                        <tr key={`${day}-${idx}`} className="border-b border-slate-800/50 hover:bg-slate-900/30">
                                          {idx === 0 && (
                                            <td rowSpan={itemsByDay[day].length} className="py-4 px-4 font-medium text-slate-100 border-r border-slate-800">
                                              {daysOfWeek[day]}
                                            </td>
                                          )}
                                          <td className="py-3 px-4 text-slate-300 font-mono text-sm">
                                            {item.start_time} - {item.end_time}
                                          </td>
                                          <td className="py-3 px-4 text-slate-100">{item.subject}</td>
                                          <td className="py-3 px-4 text-slate-300 text-sm">{item.topic || '-'}</td>
                                          <td className="py-3 px-4 text-slate-300 text-sm">{item.resource || '-'}</td>
                                          <td className="py-3 px-4">
                                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                                              item.activity_type === 'break' ? 'bg-amber-500/20 text-amber-400' :
                                              item.activity_type === 'free' ? 'bg-slate-500/20 text-slate-400' :
                                              item.activity_type === 'test' ? 'bg-red-500/20 text-red-400' :
                                              'bg-indigo-500/20 text-indigo-400'
                                            }`}>
                                              {item.activity_type === 'study' ? 'Konu Çalışma' :
                                               item.activity_type === 'practice' ? 'Soru Çözme' :
                                               item.activity_type === 'test' ? 'Deneme' :
                                               item.activity_type === 'review' ? 'Tekrar' :
                                               item.activity_type === 'break' ? 'Dinlenme' : 'Boş Zaman'}
                                            </span>
                                          </td>
                                        </tr>
                                      ))
                                    ) : (
                                      <tr className="border-b border-slate-800/50">
                                        <td className="py-4 px-4 font-medium text-slate-100 border-r border-slate-800">{daysOfWeek[day]}</td>
                                        <td colSpan={5} className="py-4 px-4 text-center text-slate-500 italic">Boş gün</td>
                                      </tr>
                                    )}
                                  </React.Fragment>
                                ));
                              })()}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </>
                  )}
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

              <TabsContent value="resources">
                <Card className="glassmorphism p-6">
                  <h2 className="text-xl font-bold text-slate-50 mb-6">Kaynak Takibi</h2>
                  {resources.length === 0 ? (
                    <p className="text-slate-400 text-center py-8">Henüz kaynak kaydı yok</p>
                  ) : (
                    <div className="space-y-4">
                      {resources.map((resource, idx) => (
                        <div key={idx} className="glassmorphism p-6 rounded-lg" data-testid={`resource-${idx}`}>
                          <div className="flex items-start justify-between mb-3">
                            <div>
                              <h3 className="text-lg font-semibold text-slate-50 mb-1">{resource.resource_name}</h3>
                              <p className="text-sm text-slate-400">{resource.subject} - {resource.topic}</p>
                            </div>
                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                              resource.status === 'completed' 
                                ? 'bg-green-500/20 text-green-400' 
                                : resource.status === 'in_progress'
                                ? 'bg-amber-500/20 text-amber-400'
                                : 'bg-slate-500/20 text-slate-400'
                            }`}>
                              {resource.status === 'completed' ? 'Tamamlandı' : resource.status === 'in_progress' ? 'Devam Ediyor' : 'Başlanmadı'}
                            </span>
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
