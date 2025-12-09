import React, { useState, useEffect } from 'react';
import api from '../../utils/api';
import { Button } from '../ui/button';
import { Card } from '../ui/card';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Plus, Trash2, Lightbulb, Save, Calendar as CalendarIcon, ArrowLeft, ArrowRight, Edit2, PlusCircle } from 'lucide-react';
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
  const [editingIndex, setEditingIndex] = useState(null);
  const [newResourceName, setNewResourceName] = useState('');
  const [showResourceInput, setShowResourceInput] = useState({});

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

  function isPastTime(dayValue, time) {
    const now = new Date();
    const today = now.getDay();
    const currentTime = now.getHours() * 60 + now.getMinutes();
    const [hours, minutes] = time.split(':').map(Number);
    const scheduleTime = hours * 60 + minutes;
    
    if (dayValue < today) return true;
    if (dayValue === today && scheduleTime < currentTime) return true;
    return false;
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

      const activeSchedule = schedulesRes.data.find(s => {
        const start = new Date(s.week_start_date);
        return start.getTime() === weekStart.getTime();
      });

      if (activeSchedule) {
        setCurrentSchedule(activeSchedule);
        setScheduleItems(activeSchedule.schedule_items || []);
      } else {
        setCurrentSchedule(null);
        setScheduleItems([]);
      }

      // Fetch topics for each subject
      const topicsMap = {};
      for (const subject of subjectsRes.data) {
        const topicsRes = await api.get(`/topics/${subject.id}`);
        topicsMap[subject.name] = topicsRes.data;
      }
      setTopics(topicsMap);
    } catch (error) {
      toast.error('Veri yüklenirken hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const [formItem, setFormItem] = useState({
    day: 1,
    start_time: '09:00',
    end_time: '10:00',
    subject: '',
    topic: '',
    resource: '',
    activity_type: 'study',
    notes: ''
  });

  const addScheduleItem = () => {
    if (!formItem.subject && formItem.activity_type !== 'break' && formItem.activity_type !== 'free') {
      toast.error('Lütfen ders seçin');
      return;
    }
    
    setScheduleItems([...scheduleItems, { ...formItem }]);
    // Reset form
    setFormItem({
      day: 1,
      start_time: '09:00',
      end_time: '10:00',
      subject: '',
      topic: '',
      resource: '',
      activity_type: 'study',
      notes: ''
    });
    toast.success('Program öğesi tabloya eklendi');
  };

  const removeScheduleItem = (index) => {
    setScheduleItems(scheduleItems.filter((_, i) => i !== index));
    if (editingIndex === index) setEditingIndex(null);
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
      setScheduleItems([]);
      setEditingIndex(null);
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

  const addNewResource = (index) => {
    if (newResourceName.trim()) {
      updateScheduleItem(index, 'resource', newResourceName.trim());
      setNewResourceName('');
      setShowResourceInput({ ...showResourceInput, [index]: false });
      toast.success('Kaynak eklendi');
    }
  };

  if (loading) {
    return (
      <Card className="glassmorphism p-6">
        <div className="text-center text-slate-400">Yükleniyor...</div>
      </Card>
    );
  }

  const itemsByDay = {};
  daysOfWeek.forEach(day => {
    itemsByDay[day.value] = scheduleItems.filter(item => item.day === day.value)
      .sort((a, b) => a.start_time.localeCompare(b.start_time));
  });

  return (
    <div className="space-y-6">
      <Card className="glassmorphism p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4">
            <Button
              onClick={() => changeWeek(-1)}
              variant="outline"
              size="sm"
              className="border-slate-700 text-slate-300"
            >
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <div className="text-center">
              <h3 className="text-lg font-bold text-slate-50">
                {formatDate(weekStart)} - {formatDate(getWeekEnd(weekStart))}
              </h3>
              <p className="text-xs text-slate-400">Haftalık Program</p>
            </div>
            <Button
              onClick={() => changeWeek(1)}
              variant="outline"
              size="sm"
              className="border-slate-700 text-slate-300"
            >
              <ArrowRight className="w-4 h-4" />
            </Button>
          </div>

          {suggestedSchedule && suggestedSchedule.suggested_items && (
            <Button
              onClick={applySuggestedSchedule}
              variant="outline"
              className="border-amber-600 text-amber-400 hover:bg-amber-600/10"
            >
              <Lightbulb className="w-4 h-4 mr-2" />
              Önerilen Programı Uygula
            </Button>
          )}
        </div>

        {schedules.length > 0 && (
          <div className="mt-4">
            <p className="text-sm text-slate-400 mb-2">Önceki programlar:</p>
            <div className="flex flex-wrap gap-2">
              {schedules.slice(0, 5).map((schedule, idx) => (
                <Button
                  key={idx}
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setScheduleItems(schedule.schedule_items);
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
                <th className="text-center py-3 px-4 text-slate-300 font-semibold w-32">İşlem</th>
              </tr>
            </thead>
            <tbody>
              {daysOfWeek.map(day => (
                <React.Fragment key={day.value}>
                  {itemsByDay[day.value].length > 0 ? (
                    itemsByDay[day.value].map((item, idx) => {
                      const itemIndex = scheduleItems.indexOf(item);
                      const isPast = isPastTime(day.value, item.start_time);
                      return (
                        <tr key={`${day.value}-${idx}`} className={`border-b border-slate-800/50 hover:bg-slate-900/30 ${isPast ? 'opacity-50' : ''}`}>
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
                          <td className="py-3 px-4">
                            <div className="flex items-center justify-center gap-2">
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => setEditingIndex(editingIndex === itemIndex ? null : itemIndex)}
                                className="text-blue-400 hover:text-blue-300 hover:bg-blue-500/10"
                              >
                                <Edit2 className="w-4 h-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => removeScheduleItem(itemIndex)}
                                className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr className="border-b border-slate-800/50">
                      <td className="py-4 px-4 font-medium text-slate-100 border-r border-slate-800">{day.label}</td>
                      <td colSpan={6} className="py-4 px-4 text-center text-slate-500 italic">Boş</td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Add/Edit Items */}
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
              <div key={index} className={`p-4 rounded-lg border ${editingIndex === index ? 'bg-indigo-900/20 border-indigo-700' : 'bg-slate-900/50 border-slate-800'}`}>
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
                          onValueChange={(value) => {
                            updateScheduleItem(index, 'subject', value);
                            updateScheduleItem(index, 'topic', '');
                          }}
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
                        <Select
                          value={item.topic}
                          onValueChange={(value) => updateScheduleItem(index, 'topic', value)}
                          disabled={!item.subject}
                        >
                          <SelectTrigger className="bg-slate-950 border-slate-700 text-slate-100">
                            <SelectValue placeholder="Konu seçin" />
                          </SelectTrigger>
                          <SelectContent className="bg-slate-900 border-slate-800">
                            {(topics[item.subject] || []).map((topic) => (
                              <SelectItem key={topic.id} value={topic.name}>
                                {topic.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label className="text-slate-300 text-sm">Kaynak</Label>
                        {showResourceInput[index] ? (
                          <div className="flex gap-2">
                            <Input
                              value={newResourceName}
                              onChange={(e) => setNewResourceName(e.target.value)}
                              className="bg-slate-950 border-slate-700 text-slate-100"
                              placeholder="Yeni kaynak adı"
                              onKeyPress={(e) => e.key === 'Enter' && addNewResource(index)}
                            />
                            <Button
                              size="sm"
                              onClick={() => addNewResource(index)}
                              className="bg-green-600 hover:bg-green-500"
                            >
                              Ekle
                            </Button>
                          </div>
                        ) : (
                          <div className="flex gap-2">
                            <Input
                              value={item.resource}
                              onChange={(e) => updateScheduleItem(index, 'resource', e.target.value)}
                              className="bg-slate-950 border-slate-700 text-slate-100"
                              placeholder="Kaynak adı"
                            />
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setShowResourceInput({ ...showResourceInput, [index]: true })}
                              className="border-slate-700 text-slate-300 whitespace-nowrap"
                            >
                              <PlusCircle className="w-4 h-4" />
                            </Button>
                          </div>
                        )}
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

        {scheduleItems.length > 0 && (
          <div className="mt-6 flex justify-end">
            <Button
              onClick={saveSchedule}
              className="bg-indigo-600 hover:bg-indigo-500"
            >
              <Save className="w-5 h-5 mr-2" />
              Programı Kaydet
            </Button>
          </div>
        )}
      </Card>
    </div>
  );
};

export default WeeklyScheduleManager;
