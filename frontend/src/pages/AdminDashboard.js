import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { 
  Users, 
  CheckCircle, 
  XCircle, 
  LogOut,
  UserCheck,
  UserPlus,
  Link2,
  BarChart3,
  Bell
} from 'lucide-react';
import { toast } from 'sonner';

const AdminDashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [pendingUsers, setPendingUsers] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [students, setStudents] = useState([]);
  const [matches, setMatches] = useState([]);
  const [reports, setReports] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedStudent, setSelectedStudent] = useState('');
  const [selectedTeacher, setSelectedTeacher] = useState('');
  const [subjects, setSubjects] = useState([]);
  const [newSubject, setNewSubject] = useState({ name: '', exam_type: 'TYT' });
  const [selectedSubjectForTopic, setSelectedSubjectForTopic] = useState('');
  const [newTopicName, setNewTopicName] = useState('');
  const [subjectTopics, setSubjectTopics] = useState({});

  useEffect(() => {
    if (user?.role !== 'admin') {
      navigate('/login');
      return;
    }
    fetchData();
  }, [user, navigate]);

  const fetchData = async () => {
    try {
      const [pendingRes, teachersRes, studentsRes, matchesRes, reportsRes, notifsRes] = await Promise.all([
        api.get('/admin/pending-users'),
        api.get('/admin/teachers'),
        api.get('/admin/students'),
        api.get('/admin/matches'),
        api.get('/admin/reports'),
        api.get('/notifications')
      ]);
      
      setPendingUsers(pendingRes.data);
      setTeachers(teachersRes.data);
      setStudents(studentsRes.data);
      setMatches(matchesRes.data);
      setReports(reportsRes.data);
      setNotifications(notifsRes.data);
    } catch (error) {
      toast.error('Veri yüklenirken hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (userId) => {
    try {
      await api.put(`/admin/approve-user/${userId}`);
      toast.success('Kullanıcı onaylandı');
      fetchData();
    } catch (error) {
      toast.error('Onaylama başarısız');
    }
  };

  const handleReject = async (userId) => {
    try {
      await api.put(`/admin/reject-user/${userId}`);
      toast.success('Kullanıcı reddedildi');
      fetchData();
    } catch (error) {
      toast.error('Reddetme başarısız');
    }
  };

  const handleMatch = async () => {
    if (!selectedStudent || !selectedTeacher) {
      toast.error('Lütfen öğrenci ve öğretmen seçin');
      return;
    }

    try {
      await api.post('/admin/match', {
        student_id: selectedStudent,
        teacher_id: selectedTeacher
      });
      toast.success('Eşleştirme başarılı');
      setSelectedStudent('');
      setSelectedTeacher('');
      fetchData();
    } catch (error) {
      toast.error('Eşleştirme başarısız');
    }
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
              <h1 className="text-xl font-bold text-slate-50">Admin Panel</h1>
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
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="glassmorphism p-6 card-hover" data-testid="stat-pending">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-400 uppercase tracking-wider">Bekleyen</p>
                <p className="text-3xl font-bold text-amber-400 font-mono mt-2">{pendingUsers.length}</p>
              </div>
              <UserCheck className="w-10 h-10 text-amber-400 opacity-50" />
            </div>
          </Card>

          <Card className="glassmorphism p-6 card-hover" data-testid="stat-teachers">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-400 uppercase tracking-wider">Öğretmenler</p>
                <p className="text-3xl font-bold text-blue-400 font-mono mt-2">{teachers.length}</p>
              </div>
              <Users className="w-10 h-10 text-blue-400 opacity-50" />
            </div>
          </Card>

          <Card className="glassmorphism p-6 card-hover" data-testid="stat-students">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-400 uppercase tracking-wider">Öğrenciler</p>
                <p className="text-3xl font-bold text-green-400 font-mono mt-2">{students.length}</p>
              </div>
              <UserPlus className="w-10 h-10 text-green-400 opacity-50" />
            </div>
          </Card>

          <Card className="glassmorphism p-6 card-hover" data-testid="stat-matches">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-400 uppercase tracking-wider">Eşleşmeler</p>
                <p className="text-3xl font-bold text-indigo-400 font-mono mt-2">{matches.length}</p>
              </div>
              <Link2 className="w-10 h-10 text-indigo-400 opacity-50" />
            </div>
          </Card>
        </div>

        <Tabs defaultValue="pending" className="space-y-6">
          <TabsList className="bg-slate-900 border border-slate-800">
            <TabsTrigger value="pending" data-testid="tab-pending">Onay Bekleyenler</TabsTrigger>
            <TabsTrigger value="match" data-testid="tab-match">Eşleştirme</TabsTrigger>
            <TabsTrigger value="subjects" data-testid="tab-subjects">Ders/Konu Yönetimi</TabsTrigger>
            <TabsTrigger value="reports" data-testid="tab-reports">Raporlar</TabsTrigger>
          </TabsList>

          <TabsContent value="pending">
            <Card className="glassmorphism p-6">
              <h2 className="text-xl font-bold text-slate-50 mb-4">Onay Bekleyen Kullanıcılar</h2>
              {pendingUsers.length === 0 ? (
                <p className="text-slate-400 text-center py-8" data-testid="no-pending">Bekleyen kullanıcı yok</p>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-slate-800">
                        <TableHead className="text-slate-300">Ad Soyad</TableHead>
                        <TableHead className="text-slate-300">Email</TableHead>
                        <TableHead className="text-slate-300">Rol</TableHead>
                        <TableHead className="text-slate-300 text-right">İşlemler</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {pendingUsers.map((user) => (
                        <TableRow key={user.id} className="border-slate-800" data-testid={`pending-user-${user.id}`}>
                          <TableCell className="text-slate-100">{user.full_name}</TableCell>
                          <TableCell className="text-slate-300">{user.email}</TableCell>
                          <TableCell>
                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                              user.role === 'teacher' ? 'bg-blue-500/20 text-blue-400' : 'bg-green-500/20 text-green-400'
                            }`}>
                              {user.role === 'teacher' ? 'Öğretmen' : 'Öğrenci'}
                            </span>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex gap-2 justify-end">
                              <Button
                                size="sm"
                                onClick={() => handleApprove(user.id)}
                                className="bg-green-600 hover:bg-green-500"
                                data-testid={`approve-${user.id}`}
                              >
                                <CheckCircle className="w-4 h-4 mr-1" />
                                Onayla
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => handleReject(user.id)}
                                data-testid={`reject-${user.id}`}
                              >
                                <XCircle className="w-4 h-4 mr-1" />
                                Reddet
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </Card>
          </TabsContent>

          <TabsContent value="match">
            <Card className="glassmorphism p-6">
              <h2 className="text-xl font-bold text-slate-50 mb-6">Öğrenci-Öğretmen Eşleştirme</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div className="space-y-2">
                  <label className="text-sm text-slate-300">Öğrenci Seç</label>
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
                  <label className="text-sm text-slate-300">Öğretmen Seç</label>
                  <Select value={selectedTeacher} onValueChange={setSelectedTeacher}>
                    <SelectTrigger className="bg-slate-900 border-slate-800 text-slate-100" data-testid="select-teacher">
                      <SelectValue placeholder="Öğretmen seçin" />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-900 border-slate-800">
                      {teachers.map((teacher) => (
                        <SelectItem key={teacher.id} value={teacher.id}>
                          {teacher.full_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Button
                onClick={handleMatch}
                className="w-full bg-indigo-600 hover:bg-indigo-500 glow-button"
                data-testid="create-match-button"
              >
                <Link2 className="w-5 h-5 mr-2" />
                Eşleştir
              </Button>

              <div className="mt-8">
                <h3 className="text-lg font-semibold text-slate-50 mb-4">Mevcut Eşleşmeler</h3>
                {matches.length === 0 ? (
                  <p className="text-slate-400 text-center py-4">Henüz eşleşme yok</p>
                ) : (
                  <div className="space-y-3">
                    {matches.map((match, idx) => {
                      const student = students.find(s => s.id === match.student_id);
                      const teacher = teachers.find(t => t.id === match.teacher_id);
                      return (
                        <div key={idx} className="glassmorphism p-4 rounded-lg flex items-center justify-between" data-testid={`match-${idx}`}>
                          <div className="flex items-center gap-4">
                            <div className="text-slate-100">{student?.full_name}</div>
                            <div className="text-slate-500">→</div>
                            <div className="text-slate-100">{teacher?.full_name}</div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="reports">
            <Card className="glassmorphism p-6">
              <h2 className="text-xl font-bold text-slate-50 mb-4">Çalışma Raporları</h2>
              {reports.length === 0 ? (
                <p className="text-slate-400 text-center py-8">Henüz rapor yok</p>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-slate-800">
                        <TableHead className="text-slate-300">Öğrenci</TableHead>
                        <TableHead className="text-slate-300">Öğretmen</TableHead>
                        <TableHead className="text-slate-300">Soru Girişleri</TableHead>
                        <TableHead className="text-slate-300">Toplam Ödevler</TableHead>
                        <TableHead className="text-slate-300">Tamamlanan</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {reports.map((report, idx) => (
                        <TableRow key={idx} className="border-slate-800">
                          <TableCell className="text-slate-100">{report.student?.full_name}</TableCell>
                          <TableCell className="text-slate-300">{report.teacher?.full_name}</TableCell>
                          <TableCell className="text-slate-100 font-mono">{report.total_question_entries}</TableCell>
                          <TableCell className="text-slate-100 font-mono">{report.total_assignments}</TableCell>
                          <TableCell className="text-slate-100 font-mono">{report.completed_assignments}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default AdminDashboard;
