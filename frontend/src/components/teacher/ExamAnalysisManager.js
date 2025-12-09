import React, { useState, useEffect } from 'react';
import api from '../../utils/api';
import { Button } from '../ui/button';
import { Card } from '../ui/card';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Textarea } from '../ui/textarea';
import { Plus, Trash2, TrendingUp, Target, Award } from 'lucide-react';
import { toast } from 'sonner';

const ExamAnalysisManager = ({ studentId }) => {
  const [analyses, setAnalyses] = useState([]);
  const [summary, setSummary] = useState(null);
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  
  const [newExam, setNewExam] = useState({
    exam_name: '',
    exam_type: 'TYT',
    exam_date: new Date().toISOString().split('T')[0],
    subjects: [],
    notes: ''
  });

  // Max question counts per subject
  const maxQuestions = {
    'TYT': {
      'Türkçe': 40,
      'Matematik': 40,
      'Fen Bilimleri': 20,
      'Sosyal Bilimler': 20
    },
    'AYT': {
      'Matematik': 40,
      'Fizik': 14,
      'Kimya': 13,
      'Biyoloji': 13,
      'Edebiyat': 24,
      'Tarih-1': 10,
      'Coğrafya-1': 6,
      'Tarih-2': 11,
      'Coğrafya-2': 11,
      'Felsefe': 12,
      'Din Kültürü': 6
    }
  };

  useEffect(() => {
    if (studentId) {
      fetchData();
    }
  }, [studentId]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [analysisRes, subjectsRes] = await Promise.all([
        api.get(`/teacher/exam-analysis-summary/${studentId}`),
        api.get('/subjects')
      ]);
      
      setAnalyses(analysisRes.data.analyses || []);
      setSummary(analysisRes.data.summary || null);
      setSubjects(subjectsRes.data);
    } catch (error) {
      console.error('Fetch error:', error);
    } finally {
      setLoading(false);
    }
  };

  const addSubjectToExam = () => {
    setNewExam({
      ...newExam,
      subjects: [...newExam.subjects, {
        name: '',
        correct: 0,
        wrong: 0,
        empty: 0,
        net: 0
      }]
    });
  };

  const updateSubject = (index, field, value) => {
    const updated = [...newExam.subjects];
    const subjectName = updated[index].name;
    const maxQ = maxQuestions[newExam.exam_type]?.[subjectName] || 100;
    
    // Validate max questions
    if (field === 'correct' || field === 'wrong') {
      const numValue = parseInt(value) || 0;
      if (numValue > maxQ) {
        toast.error(`${subjectName} için maksimum ${maxQ} soru girilebilir`);
        return;
      }
    }
    
    updated[index][field] = value;
    
    if (field === 'correct' || field === 'wrong') {
      const correct = parseInt(updated[index].correct) || 0;
      const wrong = parseInt(updated[index].wrong) || 0;
      const total = correct + wrong;
      
      if (total > maxQ) {
        toast.error(`Toplam soru sayısı ${maxQ}'ı geçemez`);
        return;
      }
      
      updated[index].net = (correct - wrong / 3).toFixed(2);
    }
    
    setNewExam({ ...newExam, subjects: updated });
  };

  const removeSubject = (index) => {
    setNewExam({
      ...newExam,
      subjects: newExam.subjects.filter((_, i) => i !== index)
    });
  };

  const handleSaveExam = async () => {
    if (!newExam.exam_name || newExam.subjects.length === 0) {
      toast.error('Lütfen deneme adı girin ve en az bir ders ekleyin');
      return;
    }

    try {
      await api.post('/teacher/exam-analysis', {
        student_id: studentId,
        exam_type: newExam.exam_type,
        exam_name: newExam.exam_name,
        exam_date: new Date(newExam.exam_date).toISOString(),
        subjects: newExam.subjects.map(s => ({
          name: s.name,
          correct: parseInt(s.correct) || 0,
          wrong: parseInt(s.wrong) || 0,
          empty: parseInt(s.empty) || 0,
          net: parseFloat(s.net) || 0
        })),
        notes: newExam.notes
      });
      
      toast.success('Deneme analizi kaydedildi');
      setShowAddForm(false);
      setNewExam({
        exam_name: '',
        exam_type: 'TYT',
        exam_date: new Date().toISOString().split('T')[0],
        subjects: [],
        notes: ''
      });
      fetchData();
    } catch (error) {
      toast.error('Kaydetme başarısız');
    }
  };

  const filteredSubjects = subjects.filter(s => s.exam_type === newExam.exam_type);

  if (loading) {
    return (
      <Card className="glassmorphism p-6">
        <div className="text-center text-slate-400">Yükleniyor...</div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      {summary && summary.total_exams > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="glassmorphism p-6 card-hover">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-400 uppercase tracking-wider mb-2">TOPLAM DENEME</p>
                <p className="text-3xl font-bold text-indigo-400 font-mono">{summary.total_exams}</p>
              </div>
              <Target className="w-10 h-10 text-indigo-400 opacity-30" />
            </div>
          </Card>

          <Card className="glassmorphism p-6 card-hover">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-400 uppercase tracking-wider mb-2">ORTALAMA NET</p>
                <p className="text-3xl font-bold text-green-400 font-mono">{summary.average_net.toFixed(2)}</p>
              </div>
              <TrendingUp className="w-10 h-10 text-green-400 opacity-30" />
            </div>
          </Card>

          <Card className="glassmorphism p-6 card-hover">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-400 uppercase tracking-wider mb-2">EN İYİ NET</p>
                <p className="text-3xl font-bold text-amber-400 font-mono">{summary.best_exam?.total_net.toFixed(2)}</p>
              </div>
              <Award className="w-10 h-10 text-amber-400 opacity-30" />
            </div>
          </Card>
        </div>
      )}

      {/* Add Exam Form */}
      <Card className="glassmorphism p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-slate-50">Deneme Sınav Analizi</h3>
          <Button
            onClick={() => setShowAddForm(!showAddForm)}
            className="bg-green-600 hover:bg-green-500"
            data-testid="toggle-exam-form"
          >
            <Plus className="w-5 h-5 mr-2" />
            {showAddForm ? 'İptal' : 'Yeni Deneme Ekle'}
          </Button>
        </div>

        {showAddForm && (
          <div className="space-y-6 p-4 bg-slate-900/50 rounded-lg border border-slate-800">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label className="text-slate-300">Deneme Adı</Label>
                <Input
                  value={newExam.exam_name}
                  onChange={(e) => setNewExam({ ...newExam, exam_name: e.target.value })}
                  placeholder="Örn: 1. Deneme"
                  className="bg-slate-950 border-slate-700 text-slate-100"
                  data-testid="exam-name-input"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-slate-300">Sınav Türü</Label>
                <Select
                  value={newExam.exam_type}
                  onValueChange={(value) => setNewExam({ ...newExam, exam_type: value, subjects: [] })}
                >
                  <SelectTrigger className="bg-slate-950 border-slate-700 text-slate-100">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-900 border-slate-800">
                    <SelectItem value="TYT">TYT</SelectItem>
                    <SelectItem value="AYT">AYT</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-slate-300">Tarih</Label>
                <Input
                  type="date"
                  value={newExam.exam_date}
                  onChange={(e) => setNewExam({ ...newExam, exam_date: e.target.value })}
                  className="bg-slate-950 border-slate-700 text-slate-100"
                />
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label className="text-slate-300">Dersler</Label>
                <Button
                  onClick={addSubjectToExam}
                  size="sm"
                  className="bg-indigo-600 hover:bg-indigo-500"
                  data-testid="add-subject-to-exam"
                >
                  <Plus className="w-4 h-4 mr-1" />
                  Ders Ekle
                </Button>
              </div>

              {newExam.subjects.map((subject, index) => {
                const maxQ = maxQuestions[newExam.exam_type]?.[subject.name] || 0;
                const totalAnswered = (parseInt(subject.correct) || 0) + (parseInt(subject.wrong) || 0);
                
                return (
                  <div key={index} className="p-4 bg-slate-950 rounded border border-slate-800 space-y-3">
                    <div className="grid grid-cols-1 md:grid-cols-6 gap-3">
                      <div className="md:col-span-2">
                        <Label className="text-xs text-slate-400 mb-1">Ders</Label>
                        <Select
                          value={subject.name}
                          onValueChange={(value) => updateSubject(index, 'name', value)}
                        >
                          <SelectTrigger className="bg-slate-900 border-slate-700 text-slate-100 h-9">
                            <SelectValue placeholder="Ders seçin" />
                          </SelectTrigger>
                          <SelectContent className="bg-slate-900 border-slate-800">
                            {filteredSubjects.map((s) => (
                              <SelectItem key={s.id} value={s.name}>{s.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label className="text-xs text-green-400 mb-1">✓ Doğru</Label>
                        <Input
                          type="number"
                          placeholder="0"
                          value={subject.correct}
                          onChange={(e) => updateSubject(index, 'correct', e.target.value)}
                          className="bg-slate-900 border-slate-700 text-slate-100 h-9"
                          min="0"
                          max={maxQ}
                        />
                      </div>
                      <div>
                        <Label className="text-xs text-red-400 mb-1">✗ Yanlış</Label>
                        <Input
                          type="number"
                          placeholder="0"
                          value={subject.wrong}
                          onChange={(e) => updateSubject(index, 'wrong', e.target.value)}
                          className="bg-slate-900 border-slate-700 text-slate-100 h-9"
                          min="0"
                          max={maxQ}
                        />
                      </div>
                      <div className="flex flex-col justify-center">
                        <span className="text-xs text-slate-400 mb-1">Net</span>
                        <span className="text-indigo-400 font-mono font-bold text-lg">
                          {subject.net}
                        </span>
                      </div>
                      <div className="flex items-end justify-end">
                        <Button
                          onClick={() => removeSubject(index)}
                          size="sm"
                          variant="ghost"
                          className="text-red-400 hover:text-red-300"
                          data-testid={`remove-subject-${index}`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                    
                    {subject.name && maxQ > 0 && (
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-500">
                          Maksimum soru: <span className="text-slate-400 font-medium">{maxQ}</span>
                        </span>
                        <span className={`${totalAnswered > maxQ ? 'text-red-400' : 'text-slate-400'}`}>
                          Cevaplanan: <span className="font-medium">{totalAnswered}/{maxQ}</span>
                        </span>
                        <span className="text-slate-400">
                          Boş: <span className="font-medium">{maxQ - totalAnswered}</span>
                        </span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="space-y-2">
              <Label className="text-slate-300">Notlar</Label>
              <Textarea
                value={newExam.notes}
                onChange={(e) => setNewExam({ ...newExam, notes: e.target.value })}
                className="bg-slate-950 border-slate-700 text-slate-100"
                rows={2}
                placeholder="Ek notlar..."
              />
            </div>

            <Button
              onClick={handleSaveExam}
              className="w-full bg-indigo-600 hover:bg-indigo-500 glow-button"
              data-testid="save-exam-button"
            >
              Deneme Analizini Kaydet
            </Button>
          </div>
        )}
      </Card>

      {/* Exam List */}
      <div className="grid grid-cols-1 gap-4">
        {analyses.length === 0 ? (
          <Card className="glassmorphism p-8 text-center">
            <Target className="w-12 h-12 text-slate-600 mx-auto mb-3" />
            <p className="text-slate-400">Henüz deneme analizi eklenmedi</p>
          </Card>
        ) : (
          analyses.map((analysis, idx) => (
            <Card key={idx} className="glassmorphism p-6 card-hover" data-testid={`exam-${idx}`}>
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-slate-50">{analysis.exam_name}</h3>
                  <p className="text-sm text-slate-400">
                    {new Date(analysis.exam_date).toLocaleDateString('tr-TR')} • {analysis.exam_type}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-slate-400 uppercase tracking-wider mb-1">TOPLAM NET</p>
                  <p className="text-3xl font-bold text-indigo-400 font-mono">{analysis.total_net.toFixed(2)}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {analysis.subjects.map((subject, sidx) => (
                  <div key={sidx} className="p-3 bg-slate-900/50 rounded border border-slate-800">
                    <p className="text-xs text-slate-400 mb-1">{subject.name}</p>
                    <p className="text-xl font-bold text-indigo-400 font-mono">{subject.net.toFixed(2)}</p>
                    <div className="text-xs text-slate-500 mt-1">
                      <span className="text-green-400">{subject.correct}D</span> • {' '}
                      <span className="text-red-400">{subject.wrong}Y</span>
                    </div>
                  </div>
                ))}
              </div>

              {analysis.notes && (
                <div className="mt-4 p-3 bg-slate-900/30 rounded text-sm text-slate-300">
                  {analysis.notes}
                </div>
              )}
            </Card>
          ))
        )}
      </div>
    </div>
  );
};

export default ExamAnalysisManager;
