import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import { exportToPDF } from '../utils/pdfExport';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { ArrowLeft, Download, TrendingUp, Target, BookOpen, Award } from 'lucide-react';
import { toast } from 'sonner';

const StatisticsPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const studentIdParam = searchParams.get('student_id');
  
  const [students, setStudents] = useState([]);
  const [selectedStudentId, setSelectedStudentId] = useState(studentIdParam || '');
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.role === 'teacher' || user?.role === 'admin') {
      fetchStudents();
    } else if (user?.role === 'student') {
      setSelectedStudentId(user.id);
    }
  }, [user]);

  useEffect(() => {
    if (selectedStudentId) {
      fetchStatistics(selectedStudentId);
    }
  }, [selectedStudentId]);

  const fetchStudents = async () => {
    try {
      const endpoint = user.role === 'admin' ? '/admin/students' : '/teacher/students';
      const response = await api.get(endpoint);
      setStudents(response.data);
      if (response.data.length > 0 && !selectedStudentId) {
        setSelectedStudentId(response.data[0].id);
      }
    } catch (error) {
      toast.error('Öğrenciler yüklenemedi');
    }
  };

  const fetchStatistics = async (studentId) => {
    try {
      setLoading(true);
      const response = await api.get(`/statistics/overview/${studentId}`);
      setStats(response.data);
    } catch (error) {
      toast.error('İstatistikler yüklenemedi');
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    if (user.role === 'admin') navigate('/admin');
    else if (user.role === 'teacher') navigate('/teacher');
    else navigate('/student');
  };

  const handleExportPDF = () => {
    exportToPDF('statistics-content', 'istatistikler.pdf');
    toast.success('PDF indiriliyor...');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-slate-400">Yükleniyor...</div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-slate-400">Veri bulunamadı</div>
      </div>
    );
  }

  // Prepare chart data
  const subjectData = Object.entries(stats.subject_stats || {}).map(([subject, data]) => ({
    subject,
    net: parseFloat(data.net.toFixed(2)),
    correct: data.correct,
    wrong: data.wrong,
    count: data.count
  }));

  const recentEntriesData = (stats.recent_entries || []).slice(-10).map((entry, idx) => ({
    name: `${idx + 1}`,
    net: parseFloat(entry.net_score.toFixed(2)),
    subject: entry.subject,
    date: new Date(entry.date).toLocaleDateString('tr-TR', { month: 'short', day: 'numeric' })
  }));

  const performanceData = subjectData.map(s => ({
    subject: s.subject,
    value: s.correct,
    name: s.subject
  }));

  const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];

  return (
    <div className="min-h-screen bg-slate-950">
      <nav className="glassmorphism border-b border-slate-800 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              onClick={handleBack}
              variant="ghost"
              className="text-slate-300 hover:text-slate-100"
              data-testid="back-button"
            >
              <ArrowLeft className="w-5 h-5 mr-2" />
              Geri
            </Button>
            {(user?.role === 'teacher' || user?.role === 'admin') && students.length > 0 && (
              <Select value={selectedStudentId} onValueChange={setSelectedStudentId}>
                <SelectTrigger className="w-64 bg-slate-900 border-slate-800 text-slate-100" data-testid="select-student-stats">
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
            )}
          </div>
          <Button
            onClick={handleExportPDF}
            className="bg-indigo-600 hover:bg-indigo-500 glow-button"
            data-testid="export-pdf-button"
          >
            <Download className="w-5 h-5 mr-2" />
            PDF İndir
          </Button>
        </div>
      </nav>

      <div className="p-6 max-w-7xl mx-auto" id="statistics-content">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-50 mb-2 tracking-tight">Detaylı İstatistikler</h1>
          <p className="text-slate-400">Performans analizi ve gelişim takibi</p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="glassmorphism p-6 card-hover stat-card" data-testid="stat-total-net">
            <div className="flex items-center justify-between mb-2">
              <div>
                <p className="text-xs text-slate-400 uppercase tracking-widest mb-2">TOPLAM NET</p>
                <p className="text-4xl font-bold text-indigo-400 font-mono">{stats.total_net.toFixed(2)}</p>
              </div>
              <TrendingUp className="w-12 h-12 text-indigo-400 opacity-30" />
            </div>
          </Card>

          <Card className="glassmorphism p-6 card-hover stat-card" data-testid="stat-total-correct">
            <div className="flex items-center justify-between mb-2">
              <div>
                <p className="text-xs text-slate-400 uppercase tracking-widest mb-2">TOPLAM DOĞRU</p>
                <p className="text-4xl font-bold text-green-400 font-mono">{stats.total_correct}</p>
              </div>
              <Target className="w-12 h-12 text-green-400 opacity-30" />
            </div>
          </Card>

          <Card className="glassmorphism p-6 card-hover stat-card" data-testid="stat-total-wrong">
            <div className="flex items-center justify-between mb-2">
              <div>
                <p className="text-xs text-slate-400 uppercase tracking-widest mb-2">TOPLAM YANLIŞ</p>
                <p className="text-4xl font-bold text-red-400 font-mono">{stats.total_wrong}</p>
              </div>
              <BookOpen className="w-12 h-12 text-red-400 opacity-30" />
            </div>
          </Card>

          <Card className="glassmorphism p-6 card-hover stat-card" data-testid="stat-total-questions">
            <div className="flex items-center justify-between mb-2">
              <div>
                <p className="text-xs text-slate-400 uppercase tracking-widest mb-2">TOPLAM SORU</p>
                <p className="text-4xl font-bold text-amber-400 font-mono">{stats.total_questions}</p>
              </div>
              <Award className="w-12 h-12 text-amber-400 opacity-30" />
            </div>
          </Card>
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Subject Performance Bar Chart */}
          <Card className="glassmorphism p-6">
            <h3 className="text-xl font-bold text-slate-50 mb-6 tracking-tight">Ders Bazlı Net Performansı</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={subjectData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="subject" stroke="#94a3b8" style={{ fontSize: '12px' }} />
                <YAxis stroke="#94a3b8" style={{ fontSize: '12px' }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    border: '1px solid #334155',
                    borderRadius: '8px',
                    color: '#f8fafc'
                  }}
                />
                <Bar dataKey="net" fill="#6366f1" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Card>

          {/* Correct/Wrong Distribution */}
          <Card className="glassmorphism p-6">
            <h3 className="text-xl font-bold text-slate-50 mb-6 tracking-tight">Doğru/Yanlış Dağılımı</h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={[
                    { name: 'Doğru', value: stats.total_correct },
                    { name: 'Yanlış', value: stats.total_wrong },
                    { name: 'Boş', value: stats.total_questions - stats.total_correct - stats.total_wrong }
                  ]}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  <Cell fill="#10b981" />
                  <Cell fill="#ef4444" />
                  <Cell fill="#64748b" />
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    border: '1px solid #334155',
                    borderRadius: '8px',
                    color: '#f8fafc'
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </Card>

          {/* Recent Performance Trend */}
          <Card className="glassmorphism p-6 lg:col-span-2">
            <h3 className="text-xl font-bold text-slate-50 mb-6 tracking-tight">Son Çözüm Trendi</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={recentEntriesData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="date" stroke="#94a3b8" style={{ fontSize: '12px' }} />
                <YAxis stroke="#94a3b8" style={{ fontSize: '12px' }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    border: '1px solid #334155',
                    borderRadius: '8px',
                    color: '#f8fafc'
                  }}
                />
                <Legend />
                <Line type="monotone" dataKey="net" stroke="#6366f1" strokeWidth={3} dot={{ fill: '#6366f1', r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </Card>
        </div>

        {/* Subject Details Table */}
        <Card className="glassmorphism p-6">
          <h3 className="text-xl font-bold text-slate-50 mb-6 tracking-tight">Ders Detayları</h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-800">
                  <th className="text-left py-3 px-4 text-slate-300 font-semibold">Ders</th>
                  <th className="text-center py-3 px-4 text-slate-300 font-semibold">Doğru</th>
                  <th className="text-center py-3 px-4 text-slate-300 font-semibold">Yanlış</th>
                  <th className="text-center py-3 px-4 text-slate-300 font-semibold">Net</th>
                  <th className="text-center py-3 px-4 text-slate-300 font-semibold">Çözüm Sayısı</th>
                  <th className="text-center py-3 px-4 text-slate-300 font-semibold">Ortalama Net</th>
                </tr>
              </thead>
              <tbody>
                {subjectData.map((subject, idx) => (
                  <tr key={idx} className="border-b border-slate-800/50 hover:bg-slate-900/30 transition-colors">
                    <td className="py-4 px-4 text-slate-100 font-medium">{subject.subject}</td>
                    <td className="py-4 px-4 text-center text-green-400 font-mono">{subject.correct}</td>
                    <td className="py-4 px-4 text-center text-red-400 font-mono">{subject.wrong}</td>
                    <td className="py-4 px-4 text-center text-indigo-400 font-mono font-bold">{subject.net}</td>
                    <td className="py-4 px-4 text-center text-slate-300 font-mono">{subject.count}</td>
                    <td className="py-4 px-4 text-center text-amber-400 font-mono">{(subject.net / subject.count).toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default StatisticsPage;
