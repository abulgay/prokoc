import React, { useState, useEffect } from 'react';
import api from '../../utils/api';
import { Button } from '../ui/button';
import { Card } from '../ui/card';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Checkbox } from '../ui/checkbox';
import { Plus, Trash2, BookOpen, CheckCircle, Circle, XCircle } from 'lucide-react';
import { toast } from 'sonner';

const ResourceManager = ({ studentId }) => {
  const [resources, setResources] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [topics, setTopics] = useState({});
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  
  const [newResource, setNewResource] = useState({
    resource_name: '',
    subject: '',
    topics: []
  });
  
  const [newTopicName, setNewTopicName] = useState('');
  const [selectedResource, setSelectedResource] = useState(null);

  useEffect(() => {
    if (studentId) {
      fetchData();
    }
  }, [studentId]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [resourcesRes, subjectsRes] = await Promise.all([
        api.get(`/teacher/resources-with-topics/${studentId}`),
        api.get('/subjects')
      ]);

      setResources(resourcesRes.data);
      setSubjects(subjectsRes.data);

      // Load topics for each subject
      const topicsData = {};
      for (const subject of subjectsRes.data) {
        const topicsRes = await api.get(`/topics/${subject.id}`);
        topicsData[subject.id] = topicsRes.data;
      }
      setTopics(topicsData);
    } catch (error) {
      toast.error('Veri yüklenirken hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const addTopicToResource = () => {
    if (!newTopicName.trim()) {
      toast.error('Lütfen konu adı girin');
      return;
    }

    setNewResource({
      ...newResource,
      topics: [...newResource.topics, {
        name: newTopicName.trim(),
        status: 'not_started'
      }]
    });
    setNewTopicName('');
  };

  const removeTopicFromResource = (index) => {
    setNewResource({
      ...newResource,
      topics: newResource.topics.filter((_, i) => i !== index)
    });
  };

  const addTopicFromList = (topicName) => {
    if (newResource.topics.find(t => t.name === topicName)) {
      toast.error('Bu konu zaten eklendi');
      return;
    }

    setNewResource({
      ...newResource,
      topics: [...newResource.topics, {
        name: topicName,
        status: 'not_started'
      }]
    });
    toast.success('Konu eklendi');
  };

  const saveResource = async () => {
    if (!newResource.resource_name || !newResource.subject || newResource.topics.length === 0) {
      toast.error('Lütfen tüm alanları doldurun ve en az bir konu ekleyin');
      return;
    }

    try {
      await api.post('/teacher/resource-with-topics', {
        student_id: studentId,
        resource_name: newResource.resource_name,
        subject: newResource.subject,
        topics: newResource.topics
      });
      
      toast.success('Kaynak eklendi');
      setNewResource({ resource_name: '', subject: '', topics: [] });
      setShowAddForm(false);
      fetchData();
    } catch (error) {
      toast.error('Kaynak eklenemedi');
    }
  };

  const updateTopicStatus = async (resourceId, topicName, status) => {
    try {
      await api.put(`/teacher/resource-topic-status/${resourceId}`, null, {
        params: { topic_name: topicName, status }
      });
      toast.success('Durum güncellendi');
      fetchData();
    } catch (error) {
      toast.error('Durum güncellenemedi');
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-5 h-5 text-green-400" />;
      case 'in_progress':
        return <Circle className="w-5 h-5 text-amber-400" />;
      case 'skipped':
        return <XCircle className="w-5 h-5 text-slate-500" />;
      default:
        return <Circle className="w-5 h-5 text-slate-600" />;
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'completed':
        return 'Bitti';
      case 'in_progress':
        return 'Devam Ediyor';
      case 'skipped':
        return 'Pas';
      default:
        return 'Başlanmadı';
    }
  };

  if (loading) {
    return (
      <Card className="glassmorphism p-6">
        <div className="text-center text-slate-400">Yükleniyor...</div>
      </Card>
    );
  }

  // Get topics for selected subject
  const selectedSubject = subjects.find(s => s.name === newResource.subject);
  const availableTopics = selectedSubject ? topics[selectedSubject.id] || [] : [];

  return (
    <div className="space-y-6">
      {/* Add New Resource */}
      <Card className="glassmorphism p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-slate-50">Kaynak Yönetimi</h3>
          <Button
            onClick={() => setShowAddForm(!showAddForm)}
            className="bg-green-600 hover:bg-green-500"
            data-testid="toggle-add-resource"
          >
            <Plus className="w-5 h-5 mr-2" />
            {showAddForm ? 'İptal' : 'Yeni Kaynak Ekle'}
          </Button>
        </div>

        {showAddForm && (
          <div className="space-y-6 p-4 bg-slate-900/50 rounded-lg border border-slate-800">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-slate-300">Kaynak Adı</Label>
                <Input
                  value={newResource.resource_name}
                  onChange={(e) => setNewResource({ ...newResource, resource_name: e.target.value })}
                  placeholder="Örn: Palme Matematik"
                  className="bg-slate-950 border-slate-700 text-slate-100"
                  data-testid="resource-name-input"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-slate-300">Ders</Label>
                <Select
                  value={newResource.subject}
                  onValueChange={(value) => setNewResource({ ...newResource, subject: value, topics: [] })}
                >
                  <SelectTrigger className="bg-slate-950 border-slate-700 text-slate-100" data-testid="subject-select">
                    <SelectValue placeholder="Ders seçin" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-900 border-slate-800">
                    {subjects.map((subject) => (
                      <SelectItem key={subject.id} value={subject.name}>
                        {subject.name} ({subject.exam_type})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {newResource.subject && (
              <>
                {/* Admin Defined Topics */}
                {availableTopics.length > 0 && (
                  <div className="space-y-3">
                    <Label className="text-slate-300">Sistem Konuları (Tıklayarak ekleyin)</Label>
                    <div className="flex flex-wrap gap-2">
                      {availableTopics.map((topic) => (
                        <Button
                          key={topic.id}
                          onClick={() => addTopicFromList(topic.name)}
                          variant="outline"
                          size="sm"
                          className="border-slate-700 text-slate-300 hover:bg-indigo-600 hover:text-white"
                        >
                          <Plus className="w-3 h-3 mr-1" />
                          {topic.name}
                        </Button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Custom Topic Input */}
                <div className="space-y-2">
                  <Label className="text-slate-300">Özel Konu Ekle</Label>
                  <div className="flex gap-2">
                    <Input
                      value={newTopicName}
                      onChange={(e) => setNewTopicName(e.target.value)}
                      placeholder="Konu adı yazın..."
                      className="bg-slate-950 border-slate-700 text-slate-100"
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          addTopicToResource();
                        }
                      }}
                      data-testid="custom-topic-input"
                    />
                    <Button
                      onClick={addTopicToResource}
                      className="bg-indigo-600 hover:bg-indigo-500"
                      data-testid="add-custom-topic"
                    >
                      <Plus className="w-5 h-5" />
                    </Button>
                  </div>
                </div>

                {/* Added Topics List */}
                {newResource.topics.length > 0 && (
                  <div className="space-y-2">
                    <Label className="text-slate-300">Eklenen Konular ({newResource.topics.length})</Label>
                    <div className="space-y-2">
                      {newResource.topics.map((topic, index) => (
                        <div key={index} className="flex items-center justify-between p-3 bg-slate-950 rounded border border-slate-800">
                          <span className="text-slate-200">{topic.name}</span>
                          <Button
                            onClick={() => removeTopicFromResource(index)}
                            variant="ghost"
                            size="sm"
                            className="text-red-400 hover:text-red-300"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <Button
                  onClick={saveResource}
                  className="w-full bg-indigo-600 hover:bg-indigo-500 glow-button"
                  data-testid="save-resource"
                >
                  <BookOpen className="w-5 h-5 mr-2" />
                  Kaynağı Kaydet
                </Button>
              </>
            )}
          </div>
        )}
      </Card>

      {/* Resources List */}
      <div className="grid grid-cols-1 gap-6">
        {resources.length === 0 ? (
          <Card className="glassmorphism p-8 text-center">
            <BookOpen className="w-12 h-12 text-slate-600 mx-auto mb-3" />
            <p className="text-slate-400">Henüz kaynak eklenmedi</p>
          </Card>
        ) : (
          resources.map((resource) => (
            <Card
              key={resource.id}
              className="glassmorphism p-6 card-hover cursor-pointer"
              onClick={() => setSelectedResource(selectedResource === resource.id ? null : resource.id)}
              data-testid={`resource-${resource.id}`}
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-indigo-600 rounded-lg">
                    <BookOpen className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-slate-50">{resource.resource_name}</h3>
                    <p className="text-sm text-slate-400">{resource.subject}</p>
                  </div>
                </div>
                <div className="text-sm text-slate-400">
                  {resource.topics.filter(t => t.status === 'completed').length} / {resource.topics.length} Tamamlandı
                </div>
              </div>

              {selectedResource === resource.id && (
                <div className="space-y-2 pt-4 border-t border-slate-800">
                  <p className="text-sm text-slate-400 mb-3 uppercase tracking-wider">KONULAR</p>
                  {resource.topics.map((topic, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-3 bg-slate-900/50 rounded-lg hover:bg-slate-900 transition-colors"
                      data-testid={`topic-${idx}`}
                    >
                      <div className="flex items-center gap-3">
                        {getStatusIcon(topic.status)}
                        <span className="text-slate-200">{topic.name}</span>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          onClick={(e) => {
                            e.stopPropagation();
                            updateTopicStatus(resource.id, topic.name, 'not_started');
                          }}
                          variant={topic.status === 'not_started' ? 'default' : 'ghost'}
                          size="sm"
                          className={topic.status === 'not_started' ? 'bg-slate-600' : 'text-slate-500'}
                        >
                          Başlanmadı
                        </Button>
                        <Button
                          onClick={(e) => {
                            e.stopPropagation();
                            updateTopicStatus(resource.id, topic.name, 'in_progress');
                          }}
                          variant={topic.status === 'in_progress' ? 'default' : 'ghost'}
                          size="sm"
                          className={topic.status === 'in_progress' ? 'bg-amber-600' : 'text-slate-500'}
                        >
                          Devam Ediyor
                        </Button>
                        <Button
                          onClick={(e) => {
                            e.stopPropagation();
                            updateTopicStatus(resource.id, topic.name, 'completed');
                          }}
                          variant={topic.status === 'completed' ? 'default' : 'ghost'}
                          size="sm"
                          className={topic.status === 'completed' ? 'bg-green-600' : 'text-slate-500'}
                          data-testid={`complete-topic-${idx}`}
                        >
                          Bitti
                        </Button>
                        <Button
                          onClick={(e) => {
                            e.stopPropagation();
                            updateTopicStatus(resource.id, topic.name, 'skipped');
                          }}
                          variant={topic.status === 'skipped' ? 'default' : 'ghost'}
                          size="sm"
                          className={topic.status === 'skipped' ? 'bg-slate-700' : 'text-slate-500'}
                        >
                          Pas
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          ))
        )}
      </div>
    </div>
  );
};

export default ResourceManager;
