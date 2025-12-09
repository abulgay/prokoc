import React, { useState, useEffect } from 'react';
import api from '../../utils/api';
import { Button } from '../ui/button';
import { Card } from '../ui/card';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../ui/table';
import { UserPlus, Edit, Trash2, Users } from 'lucide-react';
import { toast } from 'sonner';

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [parents, setParents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    full_name: '',
    role: 'student',
    school: '',
    grade: '',
    birth_date: '',
    phone: '',
    address: '',
    goal: '',
    parent_id: '',
    student_id: ''
  });

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const [teachersRes, studentsRes, parentsRes] = await Promise.all([
        api.get('/admin/teachers'),
        api.get('/admin/students'),
        api.get('/admin/parents')
      ]);
      
      const allUsers = [
        ...teachersRes.data,
        ...studentsRes.data,
        ...parentsRes.data
      ];
      
      setUsers(allUsers);
      setParents(parentsRes.data);
    } catch (error) {
      toast.error('Kullanıcılar yüklenirken hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const handleAddUser = async (e) => {
    e.preventDefault();
    
    if (!formData.email || !formData.password || !formData.full_name) {
      toast.error('Lütfen zorunlu alanları doldurun');
      return;
    }

    try {
      const params = new URLSearchParams();
      if (formData.parent_id) params.append('parent_id', formData.parent_id);
      if (formData.student_id) params.append('student_id', formData.student_id);
      
      const url = `/admin/users${params.toString() ? '?' + params.toString() : ''}`;
      await api.post(url, formData);
      
      toast.success('Kullanıcı başarıyla eklendi');
      setShowAddDialog(false);
      setFormData({
        email: '',
        password: '',
        full_name: '',
        role: 'student',
        school: '',
        grade: '',
        birth_date: '',
        phone: '',
        address: '',
        goal: '',
        parent_id: '',
        student_id: ''
      });
      fetchUsers();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Kullanıcı eklenemedi');
    }
  };

  const handleEditUser = async (e) => {
    e.preventDefault();
    
    try {
      const updateData = {
        full_name: formData.full_name,
        school: formData.school,
        grade: formData.grade,
        birth_date: formData.birth_date,
        phone: formData.phone,
        address: formData.address,
        goal: formData.goal
      };
      
      await api.put(`/admin/users/${editingUser.id}`, updateData);
      toast.success('Kullanıcı başarıyla güncellendi');
      setShowEditDialog(false);
      setEditingUser(null);
      fetchUsers();
    } catch (error) {
      toast.error('Kullanıcı güncellenemedi');
    }
  };

  const handleDeleteUser = async (userId, userName) => {
    if (!window.confirm(`${userName} kullanıcısını silmek istediğinize emin misiniz?`)) {
      return;
    }

    try {
      await api.delete(`/admin/users/${userId}`);
      toast.success('Kullanıcı başarıyla silindi');
      fetchUsers();
    } catch (error) {
      toast.error('Kullanıcı silinemedi');
    }
  };

  const openEditDialog = (user) => {
    setEditingUser(user);
    setFormData({
      email: user.email,
      password: '',
      full_name: user.full_name,
      role: user.role,
      school: user.school || '',
      grade: user.grade || '',
      birth_date: user.birth_date || '',
      phone: user.phone || '',
      address: user.address || '',
      goal: user.goal || '',
      parent_id: '',
      student_id: ''
    });
    setShowEditDialog(true);
  };

  const getRoleBadge = (role) => {
    const badges = {
      admin: 'bg-red-500/20 text-red-400',
      teacher: 'bg-blue-500/20 text-blue-400',
      student: 'bg-green-500/20 text-green-400',
      parent: 'bg-purple-500/20 text-purple-400'
    };
    const labels = {
      admin: 'Admin',
      teacher: 'Öğretmen',
      student: 'Öğrenci',
      parent: 'Veli'
    };
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${badges[role]}`}>
        {labels[role]}
      </span>
    );
  };

  if (loading) {
    return (
      <Card className="glassmorphism p-6">
        <div className="text-center text-slate-400">Yükleniyor...</div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="glassmorphism p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Users className="w-6 h-6 text-indigo-400" />
            <h2 className="text-xl font-bold text-slate-50">Kullanıcı Yönetimi</h2>
          </div>
          <Button
            onClick={() => setShowAddDialog(true)}
            className="bg-indigo-600 hover:bg-indigo-500"
          >
            <UserPlus className="w-5 h-5 mr-2" />
            Yeni Kullanıcı Ekle
          </Button>
        </div>

        <div className="mb-4 grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="glassmorphism p-4">
            <div className="text-sm text-slate-400">Toplam Kullanıcı</div>
            <div className="text-2xl font-bold text-slate-50 mt-1">{users.length}</div>
          </Card>
          <Card className="glassmorphism p-4">
            <div className="text-sm text-slate-400">Öğretmen</div>
            <div className="text-2xl font-bold text-blue-400 mt-1">
              {users.filter(u => u.role === 'teacher').length}
            </div>
          </Card>
          <Card className="glassmorphism p-4">
            <div className="text-sm text-slate-400">Öğrenci</div>
            <div className="text-2xl font-bold text-green-400 mt-1">
              {users.filter(u => u.role === 'student').length}
            </div>
          </Card>
          <Card className="glassmorphism p-4">
            <div className="text-sm text-slate-400">Veli</div>
            <div className="text-2xl font-bold text-purple-400 mt-1">
              {users.filter(u => u.role === 'parent').length}
            </div>
          </Card>
        </div>

        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-slate-800">
                <TableHead className="text-slate-300">Ad Soyad</TableHead>
                <TableHead className="text-slate-300">Email</TableHead>
                <TableHead className="text-slate-300">Rol</TableHead>
                <TableHead className="text-slate-300">Okul</TableHead>
                <TableHead className="text-slate-300">Sınıf</TableHead>
                <TableHead className="text-slate-300">Telefon</TableHead>
                <TableHead className="text-slate-300 text-right">İşlemler</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user) => (
                <TableRow key={user.id} className="border-slate-800/50">
                  <TableCell className="text-slate-100 font-medium">{user.full_name}</TableCell>
                  <TableCell className="text-slate-300">{user.email}</TableCell>
                  <TableCell>{getRoleBadge(user.role)}</TableCell>
                  <TableCell className="text-slate-400 text-sm">{user.school || '-'}</TableCell>
                  <TableCell className="text-slate-400 text-sm">{user.grade || '-'}</TableCell>
                  <TableCell className="text-slate-400 text-sm">{user.phone || '-'}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        onClick={() => openEditDialog(user)}
                        variant="ghost"
                        size="sm"
                        className="text-blue-400 hover:text-blue-300"
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      {user.role !== 'admin' && (
                        <Button
                          onClick={() => handleDeleteUser(user.id, user.full_name)}
                          variant="ghost"
                          size="sm"
                          className="text-red-400 hover:text-red-300"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </Card>

      {/* Add User Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="bg-slate-900 border-slate-800 text-slate-50 max-w-2xl">
          <DialogHeader>
            <DialogTitle>Yeni Kullanıcı Ekle</DialogTitle>
            <DialogDescription className="text-slate-400">
              Yeni bir kullanıcı oluşturun. Tüm bilgileri doldurabilirsiniz.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleAddUser}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
              <div className="space-y-2">
                <Label className="text-slate-300">Email *</Label>
                <Input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="bg-slate-950 border-slate-700 text-slate-100"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label className="text-slate-300">Şifre *</Label>
                <Input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="bg-slate-950 border-slate-700 text-slate-100"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label className="text-slate-300">Ad Soyad *</Label>
                <Input
                  value={formData.full_name}
                  onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                  className="bg-slate-950 border-slate-700 text-slate-100"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label className="text-slate-300">Rol *</Label>
                <Select
                  value={formData.role}
                  onValueChange={(value) => setFormData({ ...formData, role: value })}
                >
                  <SelectTrigger className="bg-slate-950 border-slate-700 text-slate-100">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-900 border-slate-800">
                    <SelectItem value="teacher">Öğretmen</SelectItem>
                    <SelectItem value="student">Öğrenci</SelectItem>
                    <SelectItem value="parent">Veli</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-slate-300">Okul</Label>
                <Input
                  value={formData.school}
                  onChange={(e) => setFormData({ ...formData, school: e.target.value })}
                  className="bg-slate-950 border-slate-700 text-slate-100"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-slate-300">Sınıf</Label>
                <Input
                  value={formData.grade}
                  onChange={(e) => setFormData({ ...formData, grade: e.target.value })}
                  className="bg-slate-950 border-slate-700 text-slate-100"
                  placeholder="Örn: 12. Sınıf"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-slate-300">Doğum Tarihi</Label>
                <Input
                  type="date"
                  value={formData.birth_date}
                  onChange={(e) => setFormData({ ...formData, birth_date: e.target.value })}
                  className="bg-slate-950 border-slate-700 text-slate-100"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-slate-300">Telefon</Label>
                <Input
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="bg-slate-950 border-slate-700 text-slate-100"
                  placeholder="0555 123 4567"
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label className="text-slate-300">Adres</Label>
                <Input
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="bg-slate-950 border-slate-700 text-slate-100"
                />
              </div>
              
              {/* Student specific fields */}
              {formData.role === 'student' && (
                <>
                  <div className="space-y-2 md:col-span-2">
                    <Label className="text-slate-300">Hedef (Örn: TYT 350 net)</Label>
                    <Input
                      value={formData.goal}
                      onChange={(e) => setFormData({ ...formData, goal: e.target.value })}
                      className="bg-slate-950 border-slate-700 text-slate-100"
                      placeholder="TYT 350 net, AYT 280 net"
                    />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label className="text-slate-300">Veli Seçimi</Label>
                    <Select
                      value={formData.parent_id}
                      onValueChange={(value) => setFormData({ ...formData, parent_id: value })}
                    >
                      <SelectTrigger className="bg-slate-950 border-slate-700 text-slate-100">
                        <SelectValue placeholder="Veli seçin (opsiyonel)" />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-900 border-slate-800">
                        <SelectItem value="none">Seçim yok</SelectItem>
                        {parents.map((parent) => (
                          <SelectItem key={parent.id} value={parent.id}>
                            {parent.full_name} ({parent.email})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </>
              )}
              
              {/* Parent specific fields */}
              {formData.role === 'parent' && (
                <div className="space-y-2 md:col-span-2">
                  <Label className="text-slate-300">Öğrenci Seçimi</Label>
                  <Select
                    value={formData.student_id}
                    onValueChange={(value) => setFormData({ ...formData, student_id: value })}
                  >
                    <SelectTrigger className="bg-slate-950 border-slate-700 text-slate-100">
                      <SelectValue placeholder="Öğrenci seçin (opsiyonel)" />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-900 border-slate-800">
                      <SelectItem value="none">Seçim yok</SelectItem>
                      {users.filter(u => u.role === 'student').map((student) => (
                        <SelectItem key={student.id} value={student.id}>
                          {student.full_name} ({student.email})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowAddDialog(false)}
                className="border-slate-700 text-slate-300"
              >
                İptal
              </Button>
              <Button type="submit" className="bg-indigo-600 hover:bg-indigo-500">
                Kullanıcı Ekle
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit User Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="bg-slate-900 border-slate-800 text-slate-50 max-w-2xl">
          <DialogHeader>
            <DialogTitle>Kullanıcı Düzenle</DialogTitle>
            <DialogDescription className="text-slate-400">
              Kullanıcı bilgilerini güncelleyin.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleEditUser}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
              <div className="space-y-2">
                <Label className="text-slate-300">Email</Label>
                <Input
                  value={formData.email}
                  disabled
                  className="bg-slate-950 border-slate-700 text-slate-500"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-slate-300">Rol</Label>
                <Input
                  value={formData.role === 'teacher' ? 'Öğretmen' : formData.role === 'student' ? 'Öğrenci' : formData.role === 'parent' ? 'Veli' : 'Admin'}
                  disabled
                  className="bg-slate-950 border-slate-700 text-slate-500"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-slate-300">Ad Soyad</Label>
                <Input
                  value={formData.full_name}
                  onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                  className="bg-slate-950 border-slate-700 text-slate-100"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-slate-300">Okul</Label>
                <Input
                  value={formData.school}
                  onChange={(e) => setFormData({ ...formData, school: e.target.value })}
                  className="bg-slate-950 border-slate-700 text-slate-100"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-slate-300">Sınıf</Label>
                <Input
                  value={formData.grade}
                  onChange={(e) => setFormData({ ...formData, grade: e.target.value })}
                  className="bg-slate-950 border-slate-700 text-slate-100"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-slate-300">Doğum Tarihi</Label>
                <Input
                  type="date"
                  value={formData.birth_date}
                  onChange={(e) => setFormData({ ...formData, birth_date: e.target.value })}
                  className="bg-slate-950 border-slate-700 text-slate-100"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-slate-300">Telefon</Label>
                <Input
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="bg-slate-950 border-slate-700 text-slate-100"
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label className="text-slate-300">Adres</Label>
                <Input
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="bg-slate-950 border-slate-700 text-slate-100"
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowEditDialog(false)}
                className="border-slate-700 text-slate-300"
              >
                İptal
              </Button>
              <Button type="submit" className="bg-indigo-600 hover:bg-indigo-500">
                Güncelle
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default UserManagement;
