import React, { useState, useEffect } from 'react';
import api from '../../utils/api';
import { Button } from '../ui/button';
import { Card } from '../ui/card';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Textarea } from '../ui/textarea';
import { BookOpen, TrendingUp } from 'lucide-react';
import { toast } from 'sonner';

const QuestionEntryForm = ({ studentId }) => {
  const [subjects, setSubjects] = useState([]);
  const [recentEntries, setRecentEntries] = useState([]);
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    exam_type: 'TYT',
    subject: '',
    total_questions: '',
    correct_answers: '',
    wrong_answers: '',
    empty_answers: '',
    notes: ''
  });

  useEffect(() => {
    if (studentId) {
      fetchData();
    }
  }, [studentId]);

  const fetchData = async () => {
    try {
      const [subjectsRes, entriesRes] = await Promise.all([
        api.get('/subjects'),
        api.get(`/teacher/question-entries/${studentId}`)
      ]);
      
      setSubjects(subjectsRes.data);
      setRecentEntries(entriesRes.data.slice(-5).reverse());
    } catch (error) {
      console.error('Fetch error:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.subject) {
      toast.error('Lütfen ders seçin');
      return;
    }

    setLoading(true);
    try {
      const response = await api.post('/teacher/question-entry', {
        student_id: studentId,
        exam_type: formData.exam_type,
        subject: formData.subject,
        total_questions: parseInt(formData.total_questions),
        correct_answers: parseInt(formData.correct_answers),
        wrong_answers: parseInt(formData.wrong_answers),
        empty_answers: parseInt(formData.empty_answers || 0),
        notes: formData.notes
      });
      
      toast.success(`Kayıt başarılı! Net: ${response.data.net_score.toFixed(2)}`);
      setFormData({
        exam_type: formData.exam_type,
        subject: '',
        total_questions: '',
        correct_answers: '',
        wrong_answers: '',
        empty_answers: '',
        notes: ''
      });
      fetchData();
    } catch (error) {
      toast.error('Kayıt başarısız');
    } finally {
      setLoading(false);
    }
  };

  const calculateNet = () => {
    const correct = parseInt(formData.correct_answers) || 0;
    const wrong = parseInt(formData.wrong_answers) || 0;
    return (correct - wrong / 3).toFixed(2);
  };

  const filteredSubjects = subjects.filter(s => s.exam_type === formData.exam_type);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Form */}
      <div className="lg:col-span-2">
        <Card className="glassmorphism p-6">
          <h2 className="text-xl font-bold text-slate-50 mb-6">Soru Çözüm Takibi</h2>
          
          <form onSubmit={handleSubmit} className="space-y-6" data-testid="question-form">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label className="text-slate-300">Sınav Türü</Label>
                <Select
                  value={formData.exam_type}
                  onValueChange={(value) => setFormData({ ...formData, exam_type: value, subject: '' })}
                >
                  <SelectTrigger className="bg-slate-900 border-slate-800 text-slate-100">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-900 border-slate-800">
                    <SelectItem value="TYT">TYT</SelectItem>
                    <SelectItem value="AYT">AYT</SelectItem>
                    <SelectItem value="LGS">LGS</SelectItem>
                    <SelectItem value="KPSS">KPSS</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-slate-300">Ders</Label>
                <Select
                  value={formData.subject}
                  onValueChange={(value) => setFormData({ ...formData, subject: value })}
                >
                  <SelectTrigger className="bg-slate-900 border-slate-800 text-slate-100" data-testid="subject-select">
                    <SelectValue placeholder="Ders seçin" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-900 border-slate-800">
                    {filteredSubjects.map((subject) => (
                      <SelectItem key={subject.id} value={subject.name}>
                        {subject.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-slate-300">Toplam Soru</Label>
                <Input
                  type="number"
                  value={formData.total_questions}
                  onChange={(e) => setFormData({ ...formData, total_questions: e.target.value })}
                  className="bg-slate-900 border-slate-800 text-slate-100"
                  required
                  min="0"
                  data-testid="total-input"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-slate-300">Doğru</Label>
                <Input
                  type="number"
                  value={formData.correct_answers}
                  onChange={(e) => setFormData({ ...formData, correct_answers: e.target.value })}
                  className="bg-slate-900 border-slate-800 text-slate-100"
                  required
                  min="0"
                  data-testid="correct-input"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-slate-300">Yanlış</Label>
                <Input
                  type="number"
                  value={formData.wrong_answers}
                  onChange={(e) => setFormData({ ...formData, wrong_answers: e.target.value })}
                  className="bg-slate-900 border-slate-800 text-slate-100"
                  required
                  min="0"
                  data-testid="wrong-input"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-slate-300">Boş</Label>
                <Input
                  type="number"
                  value={formData.empty_answers}
                  onChange={(e) => setFormData({ ...formData, empty_answers: e.target.value })}
                  className="bg-slate-900 border-slate-800 text-slate-100"
                  min="0"
                />
              </div>
            </div>

            {/* Net Preview */}
            {formData.correct_answers && formData.wrong_answers && (
              <div className="p-4 bg-indigo-600/10 border border-indigo-600/30 rounded-lg">
                <div className="flex items-center justify-between">
                  <span className="text-slate-300">Hesaplanan Net:</span>
                  <span className="text-3xl font-bold text-indigo-400 font-mono">{calculateNet()}</span>
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label className="text-slate-300">Notlar (Opsiyonel)</Label>
              <Textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                className="bg-slate-900 border-slate-800 text-slate-100"
                rows={3}
                placeholder="Ekstra notlar..."
              />
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-indigo-600 hover:bg-indigo-500 glow-button h-12"
              data-testid="submit-button"
            >
              <BookOpen className="w-5 h-5 mr-2" />
              {loading ? 'Kaydediliyor...' : 'Kaydet ve Net Hesapla'}
            </Button>
          </form>
        </Card>
      </div>

      {/* Recent Entries */}
      <div>
        <Card className="glassmorphism p-6">
          <h3 className="text-lg font-bold text-slate-50 mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Son Kayıtlar
          </h3>
          
          {recentEntries.length === 0 ? (
            <p className="text-slate-400 text-sm text-center py-8">Henüz kayıt yok</p>
          ) : (
            <div className="space-y-3">
              {recentEntries.map((entry, idx) => (
                <div
                  key={idx}
                  className="p-3 bg-slate-900/50 rounded-lg border border-slate-800"
                  data-testid={`recent-entry-${idx}`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-slate-200">{entry.subject}</span>
                    <span className="text-lg font-bold text-indigo-400 font-mono">
                      {entry.net_score.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex gap-3 text-xs">
                    <span className="text-green-400">✓ {entry.correct_answers}</span>
                    <span className="text-red-400">✗ {entry.wrong_answers}</span>
                    <span className="text-slate-500">○ {entry.empty_answers}</span>
                  </div>
                  <div className="text-xs text-slate-500 mt-2">
                    {new Date(entry.date).toLocaleDateString('tr-TR')}
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};

export default QuestionEntryForm;
