import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Users, LogOut, BarChart3, BookOpen, ClipboardList, TrendingUp, Calendar } from 'lucide-react';
import { toast } from 'sonner';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';

const ParentDashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [children, setChildren] = useState([]);
  const [selectedChild, setSelectedChild] = useState(null);
  const [childResources, setChildResources] = useState([]);
  const [childEntries, setChildEntries] = useState([]);
  const [childAssignments, setChildAssignments] = useState([]);
  const [childSchedules, setChildSchedules] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.role !== 'parent') {
      navigate('/login');
      return;
    }
    fetchChildren();
  }, [user, navigate]);

  useEffect(() => {
    if (selectedChild) {
      fetchChildData(selectedChild.id);
    }
  }, [selectedChild]);

  const fetchChildren = async () => {
    try {
      const response = await api.get('/parent/my-children');
      setChildren(response.data);
      if (response.data.length > 0) {
        setSelectedChild(response.data[0]);
      }
    } catch (error) {
      toast.error('Veri yüklenirken hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const fetchChildData = async (childId) => {
    try {
      const [resourcesRes, entriesRes, assignmentsRes, schedulesRes] = await Promise.all([
        api.get(`/parent/child-resources/${childId}`),
        api.get(`/parent/child-question-entries/${childId}`),
        api.get(`/parent/child-assignments/${childId}`),
        api.get(`/parent/child-weekly-schedules/${childId}`)
      ]);

      setChildResources(resourcesRes.data);
      setChildEntries(entriesRes.data);
      setChildAssignments(assignmentsRes.data);
      setChildSchedules(schedulesRes.data);
    } catch (error) {
      toast.error('Çocuk verileri yüklenirken hata oluştu');
    }
  };

  const calculateStats = () => {
    const totalQuestions = childEntries.reduce((sum, e) => sum + e.total_questions, 0);
    const totalCorrect = childEntries.reduce((sum, e) => sum + e.correct_answers, 0);
    const totalWrong = childEntries.reduce((sum, e) => sum + e.wrong_answers, 0);
    const totalNet = childEntries.reduce((sum, e) => sum + e.net_score, 0);

    return { totalQuestions, totalCorrect, totalWrong, totalNet };
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-slate-400">Yükleniyor...</div>
      </div>
    );
  }

  if (children.length === 0) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <Card className="glassmorphism p-12 text-center max-w-md">
          <Users className="w-16 h-16 text-slate-600 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-slate-300 mb-2">Henüz Öğrenci Ataması Yok</h3>
          <p className="text-slate-500">
            Admin tarafından size öğrenci (çocuğunuz) atanmasını bekleyin.
          </p>
        </Card>
      </div>
    );
  }

  const stats = calculateStats();

  return (
    <div className="min-h-screen bg-slate-950">
      <nav className="glassmorphism border-b border-slate-800 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-600 rounded-lg">
              <Users className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-50">Veli Paneli</h1>
              <p className="text-sm text-slate-400">{user?.full_name}</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            {children.length > 1 && (
              <Select
                value={selectedChild?.id}
                onValueChange={(value) => {
                  const child = children.find(c => c.id === value);
                  setSelectedChild(child);
                }}
              >
                <SelectTrigger className="w-[200px] bg-slate-900 border-slate-700 text-slate-100">
                  <SelectValue placeholder="Öğrenci Seç" />
                </SelectTrigger>
                <SelectContent className="bg-slate-900 border-slate-800">
                  {children.map((child) => (
                    <SelectItem key={child.id} value={child.id}>
                      {child.full_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
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

      <div className="p-6 max-w-7xl mx-auto">
        {selectedChild && (
          <>
            <div className="mb-6 glassmorphism p-4 rounded-lg">
              <h2 className="text-lg font-semibold text-slate-50 mb-2">
                {selectedChild.full_name}'in İlerlemesi
              </h2>
              <div className="flex gap-4 text-sm text-slate-400">
                {selectedChild.school && <span>🏫 {selectedChild.school}</span>}
                {selectedChild.grade && <span>📚 {selectedChild.grade}</span>}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <Card className="glassmorphism p-6 card-hover">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-400 uppercase tracking-wider">Toplam Net</p>
                    <p className="text-3xl font-bold text-indigo-400 font-mono mt-2">
                      {stats.totalNet.toFixed(2)}
                    </p>
                  </div>
                  <TrendingUp className="w-10 h-10 text-indigo-400 opacity-50" />
                </div>
              </Card>

              <Card className="glassmorphism p-6 card-hover">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-400 uppercase tracking-wider">Doğru</p>
                    <p className="text-3xl font-bold text-green-400 font-mono mt-2">
                      {stats.totalCorrect}
                    </p>
                  </div>
                  <BookOpen className="w-10 h-10 text-green-400 opacity-50" />
                </div>
              </Card>

              <Card className="glassmorphism p-6 card-hover">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-400 uppercase tracking-wider">Yanlış</p>
                    <p className="text-3xl font-bold text-red-400 font-mono mt-2">
                      {stats.totalWrong}
                    </p>
                  </div>
                  <BookOpen className="w-10 h-10 text-red-400 opacity-50" />
                </div>
              </Card>

              <Card className="glassmorphism p-6 card-hover">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-400 uppercase tracking-wider">Ödevler</p>
                    <p className="text-3xl font-bold text-amber-400 font-mono mt-2">
                      {childAssignments.length}
                    </p>
                  </div>
                  <ClipboardList className="w-10 h-10 text-amber-400 opacity-50" />
                </div>
              </Card>
            </div>

            <Tabs defaultValue="resources" className="space-y-6">
              <TabsList className="bg-slate-900 border border-slate-800">
                <TabsTrigger value="resources">Kaynaklar</TabsTrigger>
                <TabsTrigger value="schedule">Haftalık Program</TabsTrigger>
                <TabsTrigger value="entries">Soru Çözümleri</TabsTrigger>
                <TabsTrigger value="assignments">Ödevler</TabsTrigger>
              </TabsList>

              <TabsContent value="resources">
                <Card className="glassmorphism p-6">
                  <h2 className="text-xl font-bold text-slate-50 mb-6">Kaynak Takibi</h2>
                  {childResources.length === 0 ? (
                    <p className="text-slate-400 text-center py-8">Henüz kaynak kaydı yok</p>
                  ) : (
                    <div className="space-y-6">
                      {childResources.map((resource, idx) => {
                        const totalTopics = resource.topics?.length || 0;
                        const completedTopics = resource.topics?.filter(t => t.status === 'completed').length || 0;
                        const progressPercentage = totalTopics > 0 ? Math.round((completedTopics / totalTopics) * 100) : 0;

                        return (
                          <div key={idx} className="glassmorphism p-6 rounded-lg">
                            <div className="flex items-start justify-between mb-4">
                              <div className="flex-1">
                                <h3 className="text-lg font-semibold text-slate-50 mb-1">
                                  {resource.resource_name}
                                </h3>
                                <p className="text-sm text-slate-400 mb-2">{resource.subject}</p>

                                <div className="mt-3">
                                  <div className="flex justify-between items-center mb-2">
                                    <span className="text-xs text-slate-400">İlerleme</span>
                                    <span className="text-xs font-semibold text-indigo-400">
                                      {progressPercentage}%
                                    </span>
                                  </div>
                                  <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                                    <div
                                      className="bg-gradient-to-r from-indigo-600 to-indigo-400 h-full transition-all duration-500"
                                      style={{ width: `${progressPercentage}%` }}
                                    />
                                  </div>
                                </div>

                                <div className="flex gap-4 mt-3 text-xs">
                                  <span className="text-green-400">
                                    ✓ {completedTopics} Tamamlandı
                                  </span>
                                  <span className="text-amber-400">
                                    ⟳{' '}
                                    {resource.topics?.filter(t => t.status === 'in_progress').length || 0}{' '}
                                    Devam Ediyor
                                  </span>
                                </div>
                              </div>
                            </div>

                            {resource.topics && resource.topics.length > 0 && (
                              <div className="mt-4 pt-4 border-t border-slate-800">
                                <p className="text-xs text-slate-400 mb-3 uppercase tracking-wider">
                                  Konular
                                </p>
                                <div className="space-y-2">
                                  {resource.topics.map((topic, topicIdx) => (
                                    <div
                                      key={topicIdx}
                                      className="flex items-center justify-between p-2 rounded bg-slate-900/30"
                                    >
                                      <span className="text-sm text-slate-300">{topic.name}</span>
                                      <span
                                        className={`px-2 py-1 rounded-full text-xs font-medium ${
                                          topic.status === 'completed'
                                            ? 'bg-green-500/20 text-green-400'
                                            : topic.status === 'in_progress'
                                            ? 'bg-amber-500/20 text-amber-400'
                                            : 'bg-slate-700/20 text-slate-400'
                                        }`}
                                      >
                                        {topic.status === 'completed'
                                          ? '✓ Tamamlandı'
                                          : topic.status === 'in_progress'
                                          ? '⟳ Devam Ediyor'
                                          : '○ Başlanmadı'}
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </Card>
              </TabsContent>

              <TabsContent value="schedule">
                <Card className="glassmorphism p-6">
                  <h2 className="text-xl font-bold text-slate-50 mb-6">Haftalık Çalışma Programı</h2>
                  {childSchedules.length === 0 ? (
                    <div className="text-center py-12">
                      <Calendar className="w-16 h-16 text-slate-600 mx-auto mb-4" />
                      <p className="text-slate-400">Henüz haftalık program oluşturulmamış</p>
                    </div>
                  ) : (
                    <div className="text-slate-300">
                      <p className="mb-4">
                        Toplam {childSchedules.length} haftalık program bulundu.
                      </p>
                      <p className="text-sm text-slate-500">
                        Program detayları öğrenci panelinde görüntülenebilir.
                      </p>
                    </div>
                  )}
                </Card>
              </TabsContent>

              <TabsContent value="entries">
                <Card className="glassmorphism p-6">
                  <h2 className="text-xl font-bold text-slate-50 mb-6">Son Soru Çözümleri</h2>
                  {childEntries.length === 0 ? (
                    <p className="text-slate-400 text-center py-8">Henüz soru çözümü kaydı yok</p>
                  ) : (
                    <div className="space-y-4">
                      {childEntries.slice(-10).reverse().map((entry, idx) => (
                        <div key={idx} className="glassmorphism p-4 rounded-lg">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-3">
                              <span className="px-3 py-1 bg-indigo-600 rounded-full text-sm font-medium">
                                {entry.exam_type}
                              </span>
                              <span className="text-slate-300 font-medium">{entry.subject}</span>
                            </div>
                            <span className="text-2xl font-bold text-indigo-400 font-mono">
                              {entry.net_score.toFixed(2)}
                            </span>
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
                  <h2 className="text-xl font-bold text-slate-50 mb-6">Ödevler</h2>
                  {childAssignments.length === 0 ? (
                    <p className="text-slate-400 text-center py-8">Henüz ödev yok</p>
                  ) : (
                    <div className="space-y-4">
                      {childAssignments.map((assignment) => (
                        <div key={assignment.id} className="glassmorphism p-6 rounded-lg">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <h3 className="text-lg font-semibold text-slate-50 mb-2">
                                {assignment.title}
                              </h3>
                              <p className="text-slate-400 mb-3">{assignment.description}</p>
                              <div className="flex gap-4 text-sm">
                                <span className="text-slate-500">Ders: {assignment.subject}</span>
                                <span className="text-slate-500">
                                  Son Tarih: {new Date(assignment.due_date).toLocaleDateString('tr-TR')}
                                </span>
                              </div>
                            </div>
                            <span
                              className={`px-3 py-1 rounded-full text-xs font-medium ${
                                assignment.status === 'completed'
                                  ? 'bg-green-500/20 text-green-400'
                                  : 'bg-amber-500/20 text-amber-400'
                              }`}
                            >
                              {assignment.status === 'completed' ? 'Tamamlandı' : 'Bekliyor'}
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

export default ParentDashboard;
