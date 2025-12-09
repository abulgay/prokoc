import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { BookOpen, Mail, Lock, User, Shield, AlertCircle, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';

const RegisterPage = () => {
  const navigate = useNavigate();
  const { register } = useAuth();
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
    goal: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await register(formData);
      setSuccess(true);
      toast.success('Kayıt başarılı! Admin onayı bekleniyor.');
      setTimeout(() => navigate('/login'), 3000);
    } catch (err) {
      const errorMsg = err.response?.data?.detail || 'Kayıt başarısız';
      setError(errorMsg);
      toast.error(errorMsg);
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center p-8 bg-slate-950">
        <div className="w-full max-w-md glassmorphism rounded-2xl p-8 text-center space-y-6" data-testid="success-message">
          <div className="flex justify-center">
            <div className="p-4 bg-green-600 rounded-full">
              <CheckCircle className="w-12 h-12 text-white" />
            </div>
          </div>
          <h2 className="text-2xl font-bold text-slate-50">Kayıt Başarılı!</h2>
          <p className="text-slate-300">Hesabınız oluşturuldu. Admin onayından sonra giriş yapabilirsiniz.</p>
          <Button onClick={() => navigate('/login')} className="w-full bg-indigo-600 hover:bg-indigo-500" data-testid="goto-login-button">
            Giriş Sayfasına Dön
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex">
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
        <div className="absolute inset-0">
          <img 
            src="https://images.unsplash.com/photo-1732305422171-70176afa837c?crop=entropy&cs=srgb&fm=jpg&q=85" 
            alt="Teacher with laptop" 
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-br from-slate-900/90 to-indigo-900/80"></div>
        </div>
        <div className="relative z-10 p-12 flex flex-col justify-center">
          <h1 className="text-5xl font-bold text-white mb-6 tracking-tight">Aramıza Katılın</h1>
          <p className="text-xl text-slate-200 leading-relaxed">Öğrenci veya öğretmen olarak kaydolun ve başarı yolculuğunuza başlayın.</p>
        </div>
      </div>

      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-slate-950">
        <div className="w-full max-w-md space-y-8">
          <div className="text-center">
            <div className="flex justify-center mb-6">
              <div className="p-4 bg-indigo-600 rounded-2xl">
                <BookOpen className="w-10 h-10 text-white" />
              </div>
            </div>
            <h2 className="text-3xl font-bold text-slate-50 tracking-tight">Kayıt Ol</h2>
            <p className="mt-2 text-slate-400">Yeni hesap oluşturun</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6" data-testid="register-form">
            {error && (
              <div className="bg-red-500/10 border border-red-500/50 rounded-lg p-4 flex items-start gap-3" data-testid="register-error">
                <AlertCircle className="w-5 h-5 text-red-500 mt-0.5" />
                <p className="text-sm text-red-400">{error}</p>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="full_name" className="text-slate-300">Ad Soyad</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                <Input
                  id="full_name"
                  type="text"
                  placeholder="Adınız Soyadınız"
                  value={formData.full_name}
                  onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                  className="pl-11 bg-slate-900 border-slate-800 focus:border-indigo-500 text-slate-100"
                  required
                  data-testid="fullname-input"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="text-slate-300">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                <Input
                  id="email"
                  type="email"
                  placeholder="ornek@email.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="pl-11 bg-slate-900 border-slate-800 focus:border-indigo-500 text-slate-100"
                  required
                  data-testid="register-email-input"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-slate-300">Şifre</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="pl-11 bg-slate-900 border-slate-800 focus:border-indigo-500 text-slate-100"
                  required
                  data-testid="register-password-input"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="role" className="text-slate-300">Rol</Label>
              <Select value={formData.role} onValueChange={(value) => setFormData({ ...formData, role: value })}>
                <SelectTrigger className="bg-slate-900 border-slate-800 focus:border-indigo-500 text-slate-100" data-testid="role-select">
                  <Shield className="w-5 h-5 mr-2 text-slate-500" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-900 border-slate-800">
                  <SelectItem value="student" data-testid="role-student">Öğrenci</SelectItem>
                  <SelectItem value="teacher" data-testid="role-teacher">Öğretmen</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-indigo-600 hover:bg-indigo-500 text-white glow-button h-12 text-base"
              data-testid="register-submit-button"
            >
              {loading ? 'Kayıt yapılıyor...' : 'Kayıt Ol'}
            </Button>
          </form>

          <div className="text-center space-y-4">
            <p className="text-slate-400">
              Zaten hesabınız var mı?{' '}
              <Link to="/login" className="text-indigo-400 hover:text-indigo-300 font-medium" data-testid="login-link">
                Giriş Yap
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
