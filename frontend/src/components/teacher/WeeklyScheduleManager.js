import React, { useState, useEffect } from 'react';
import api from '../../utils/api';
import { Button } from '../ui/button';
import { Card } from '../ui/card';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Plus, Trash2, Lightbulb, Save, Calendar as CalendarIcon, ArrowLeft, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';

const WeeklyScheduleManager = ({ studentId }) => {
  const [weekStart, setWeekStart] = useState(getMonday(new Date()));
  const [schedules, setSchedules] = useState([]);
  const [currentSchedule, setCurrentSchedule] = useState(null);
  const [scheduleItems, setScheduleItems] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [topics, setTopics] = useState({});
  const [suggestedSchedule, setSuggestedSchedule] = useState(null);
  const [loading, setLoading] = useState(true);

  const daysOfWeek = [
    { value: 1, label: 'Pazartesi' },
    { value: 2, label: 'Salı' },
    { value: 3, label: 'Çarşamba' },
    { value: 4, label: 'Perşembe' },
    { value: 5, label: 'Cuma' },
    { value: 6, label: 'Cumartesi' },
    { value: 0, label: 'Pazar' }
  ];

  const activityTypes = [
    { value: 'study', label: 'Konu Çalışma' },
    { value: 'practice', label: 'Soru Çözme' },
    { value: 'test', label: 'Deneme Sınavı' },
    { value: 'review', label: 'Tekrar' },
    { value: 'break', label: 'Dinlenme' },
    { value: 'free', label: 'Boş Zaman' }
  ];

  function getMonday(d) {
    d = new Date(d);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    return new Date(d.setDate(diff));
  }

  useEffect(() => {
    if (studentId) {
      fetchData();
    }
  }, [studentId, weekStart]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [schedulesRes, subjectsRes, suggestedRes] = await Promise.all([
        api.get(`/teacher/weekly-schedules/${studentId}`),
        api.get('/subjects'),
        api.get(`/teacher/suggested-schedule/${studentId}`)
      ]);

      setSchedules(schedulesRes.data);
      setSubjects(subjectsRes.data);
      setSuggestedSchedule(suggestedRes.data);

      // Load topics for each subject
      const topicsData = {};
      for (const subject of subjectsRes.data) {
        const topicsRes = await api.get(`/topics/${subject.id}`);
        topicsData[subject.id] = topicsRes.data;
      }
      setTopics(topicsData);

      // Find schedule for current week
      const weekSchedule = schedulesRes.data.find(s => {
        const scheduleStart = new Date(s.week_start_date);
        return scheduleStart.toDateString() === weekStart.toDateString();
      });

      if (weekSchedule) {
        setCurrentSchedule(weekSchedule);
        setScheduleItems(weekSchedule.schedule_items || []);
      } else {
        setCurrentSchedule(null);
        setScheduleItems([]);
      }
    } catch (error) {
      toast.error('Veri yüklenirken hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const addScheduleItem = () => {
    setScheduleItems([...scheduleItems, {
      day: 1,
      start_time: '09:00',
      end_time: '10:00',
      subject: '',
      topic: '',
      resource: '',
      activity_type: 'study',
      notes: ''
    }]);
  };

  const removeScheduleItem = (index) => {
    setScheduleItems(scheduleItems.filter((_, i) => i !== index));
  };

  const updateScheduleItem = (index, field, value) => {
    const updated = [...scheduleItems];
    updated[index][field] = value;
    setScheduleItems(updated);
  };

  const saveSchedule = async () => {
    if (scheduleItems.length === 0) {
      toast.error('Lütfen en az bir program öğesi ekleyin');
      return;
    }

    try {
      await api.post('/teacher/weekly-schedule', {
        student_id: studentId,
        week_start_date: weekStart.toISOString(),
        schedule_items: scheduleItems
      });
      toast.success('Program kaydedildi');
      fetchData();
    } catch (error) {
      toast.error('Program kaydedilemedi');
    }
  };

  const applySuggestedSchedule = () => {
    if (suggestedSchedule && suggestedSchedule.suggested_items) {
      setScheduleItems(suggestedSchedule.suggested_items);
      toast.success('Önerilen program uygulandı');
    }
  };

  const changeWeek = (direction) => {
    const newDate = new Date(weekStart);
    newDate.setDate(newDate.getDate() + (direction * 7));
    setWeekStart(getMonday(newDate));
  };

  const formatDate = (date) => {
    return date.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' });
  };

  const getWeekEnd = (start) => {
    const end = new Date(start);
    end.setDate(end.getDate() + 6);
    return end;
  };

  if (loading) {
    return (
      <Card className="glassmorphism p-6">
        <div className="text-center text-slate-400">Yükleniyor...</div>
      </Card>
    );
  }

  // Group items by day for table view
  const itemsByDay = {};
  daysOfWeek.forEach(day => {
    itemsByDay[day.value] = scheduleItems.filter(item => item.day === day.value)
      .sort((a, b) => a.start_time.localeCompare(b.start_time));
  });

  return (
    <div className="space-y-6">
      {/* Week Navigation */}
      <Card className="glassmorphism p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Button
              onClick={() => changeWeek(-1)}
              variant="ghost"
              size="sm"
              className="text-slate-300"
              data-testid="prev-week"
            >
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <div className="text-center">
              <p className="text-sm text-slate-400 uppercase tracking-wider mb-1">HAFTA</p>
              <p className="text-lg font-semibold text-slate-50">
                {formatDate(weekStart)} - {formatDate(getWeekEnd(weekStart))}
              </p>
            </div>
            <Button
              onClick={() => changeWeek(1)}
              variant="ghost"
              size="sm"
              className="text-slate-300"
              data-testid="next-week"
            >
              <ArrowRight className="w-4 h-4" />
            </Button>
          </div>

          <div className="flex gap-3">
            {suggestedSchedule && (
              <Button
                onClick={applySuggestedSchedule}
                variant="outline"
                className="border-amber-600 text-amber-400 hover:bg-amber-600/10"
                data-testid="apply-suggested"
              >
                <Lightbulb className="w-5 h-5 mr-2" />
                Önerilen Programı Uygula
              </Button>
            )}
            <Button
              onClick={saveSchedule}
              className="bg-indigo-600 hover:bg-indigo-500 glow-button"
              data-testid="save-schedule"
            >
              <Save className="w-5 h-5 mr-2" />
              Programı Kaydet
            </Button>
          </div>
        </div>

        {/* Historical Schedules */}
        {schedules.length > 0 && (
          <div className="mb-6 p-4 bg-slate-900/50 rounded-lg border border-slate-800">
            <p className="text-sm text-slate-400 mb-2">Geçmiş Programlar:</p>
            <div className="flex flex-wrap gap-2">
              {schedules.slice(0, 5).map((schedule, idx) => (
                <Button
                  key={idx}
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setWeekStart(new Date(schedule.week_start_date));
                  }}
                  className="text-xs text-slate-300 hover:text-slate-100"
                >
                  <CalendarIcon className="w-3 h-3 mr-1" />
                  {new Date(schedule.week_start_date).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' })}
                </Button>
              ))}
            </div>
          </div>
        )}
      </Card>

      {/* Table View */}
      <Card className="glassmorphism p-6">
        <h3 className="text-xl font-bold text-slate-50 mb-6">Haftalık Program Tablosu</h3>
        
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b-2 border-slate-700">
                <th className="text-left py-3 px-4 text-slate-300 font-semibold w-32">Gün</th>
                <th className="text-left py-3 px-4 text-slate-300 font-semibold w-32">Saat</th>
                <th className="text-left py-3 px-4 text-slate-300 font-semibold">Ders</th>
                <th className="text-left py-3 px-4 text-slate-300 font-semibold">Konu</th>
                <th className="text-left py-3 px-4 text-slate-300 font-semibold">Kaynak</th>
                <th className="text-left py-3 px-4 text-slate-300 font-semibold">Aktivite</th>
                <th className="text-center py-3 px-4 text-slate-300 font-semibold w-24">İşlem</th>
              </tr>
            </thead>
            <tbody>
              {daysOfWeek.map(day => (
                <React.Fragment key={day.value}>
                  {itemsByDay[day.value].length > 0 ? (
                    itemsByDay[day.value].map((item, idx) => (
                      <tr key={`${day.value}-${idx}`} className="border-b border-slate-800/50 hover:bg-slate-900/30">
                        {idx === 0 && (
                          <td rowSpan={itemsByDay[day.value].length} className="py-4 px-4 font-medium text-slate-100 border-r border-slate-800">
                            {day.label}
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
                            'bg-indigo-500/20 text-indigo-400'
                          }`}>
                            {activityTypes.find(t => t.value === item.activity_type)?.label}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => removeScheduleItem(scheduleItems.indexOf(item))}
                            className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr className="border-b border-slate-800/50">
                      <td className="py-4 px-4 font-medium text-slate-100 border-r border-slate-800">{day.label}</td>
                      <td colSpan={6} className="py-4 px-4 text-center text-slate-500 italic">Boş gün</td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Add New Items */}
      <Card className="glassmorphism p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-slate-50">Program Öğesi Ekle</h3>
          <Button
            onClick={addScheduleItem}
            className="bg-green-600 hover:bg-green-500"
            data-testid="add-schedule-item"
          >
            <Plus className="w-5 h-5 mr-2" />
            Yeni Öğe Ekle
          </Button>
        </div>

        {scheduleItems.length === 0 ? (
          <div className="text-center py-8 text-slate-400">
            <p>Henüz program öğesi eklenmedi</p>
            <p className="text-sm mt-2">Yukarıdaki butona tıklayarak yeni öğe ekleyin</p>
          </div>
        ) : (
          <div className="space-y-4">
            {scheduleItems.map((item, index) => (
              <div key={index} className="p-4 bg-slate-900/50 rounded-lg border border-slate-800">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="space-y-2">
                    <Label className="text-slate-300 text-sm">Gün</Label>
                    <Select
                      value={item.day.toString()}
                      onValueChange={(value) => updateScheduleItem(index, 'day', parseInt(value))}
                    >
                      <SelectTrigger className="bg-slate-950 border-slate-700 text-slate-100">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-900 border-slate-800">
                        {daysOfWeek.map((day) => (
                          <SelectItem key={day.value} value={day.value.toString()}>
                            {day.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-slate-300 text-sm">Başlangıç</Label>
                    <Input
                      type="time"
                      value={item.start_time}
                      onChange={(e) => updateScheduleItem(index, 'start_time', e.target.value)}
                      className="bg-slate-950 border-slate-700 text-slate-100"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-slate-300 text-sm">Bitiş</Label>
                    <Input
                      type="time"
                      value={item.end_time}
                      onChange={(e) => updateScheduleItem(index, 'end_time', e.target.value)}
                      className="bg-slate-950 border-slate-700 text-slate-100"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-slate-300 text-sm">Aktivite Tipi</Label>
                    <Select
                      value={item.activity_type}
                      onValueChange={(value) => updateScheduleItem(index, 'activity_type', value)}
                    >
                      <SelectTrigger className="bg-slate-950 border-slate-700 text-slate-100">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-900 border-slate-800">
                        {activityTypes.map((type) => (
                          <SelectItem key={type.value} value={type.value}>
                            {type.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {item.activity_type !== 'break' && item.activity_type !== 'free' && (
                    <>
                      <div className="space-y-2">
                        <Label className="text-slate-300 text-sm">Ders</Label>
                        <Select
                          value={item.subject}
                          onValueChange={(value) => updateScheduleItem(index, 'subject', value)}
                        >
                          <SelectTrigger className="bg-slate-950 border-slate-700 text-slate-100">
                            <SelectValue placeholder="Ders seçin" />
                          </SelectTrigger>
                          <SelectContent className="bg-slate-900 border-slate-800">
                            {subjects.map((subject) => (
                              <SelectItem key={subject.id} value={subject.name}>
                                {subject.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label className="text-slate-300 text-sm">Konu</Label>
                        <Input
                          value={item.topic}
                          onChange={(e) => updateScheduleItem(index, 'topic', e.target.value)}
                          className="bg-slate-950 border-slate-700 text-slate-100"
                          placeholder="Konu yazın"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label className="text-slate-300 text-sm">Kaynak</Label>
                        <Input
                          value={item.resource}
                          onChange={(e) => updateScheduleItem(index, 'resource', e.target.value)}
                          className="bg-slate-950 border-slate-700 text-slate-100"
                          placeholder="Kaynak adı"
                        />
                      </div>
                    </>
                  )}

                  <div className="space-y-2 lg:col-span-2">
                    <Label className="text-slate-300 text-sm">Notlar (Opsiyonel)</Label>
                    <Input
                      value={item.notes}
                      onChange={(e) => updateScheduleItem(index, 'notes', e.target.value)}
                      className="bg-slate-950 border-slate-700 text-slate-100"
                      placeholder="Ek notlar..."
                    />
                  </div>

                  <div className="flex items-end">
                    <Button
                      onClick={() => removeScheduleItem(index)}
                      variant="destructive"
                      size="sm"
                      className="w-full"
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Sil
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
};

export default WeeklyScheduleManager;
