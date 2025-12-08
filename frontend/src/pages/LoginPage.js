import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { BookOpen, Mail, Lock, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

const LoginPage = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const user = await login(formData.email, formData.password);
      toast.success('Giriş başarılı!');
      
      if (user.role === 'admin') {
        navigate('/admin');
      } else if (user.role === 'teacher') {
        navigate('/teacher');
      } else {
        navigate('/student');
      }
    } catch (err) {
      const errorMsg = err.response?.data?.detail || 'Giriş başarısız';
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
        <div className="absolute inset-0">
          <img 
            src="https://images.unsplash.com/photo-1688829388910-8c43a88d85a2?crop=entropy&cs=srgb&fm=jpg&q=85" 
            alt="Student studying" 
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-br from-slate-900/90 to-indigo-900/80"></div>
        </div>
        <div className="relative z-10 p-12 flex flex-col justify-center">
          <h1 className="text-5xl font-bold text-white mb-6 tracking-tight">Öğrenci Koçluk Platformu</h1>
          <p className="text-xl text-slate-200 leading-relaxed">YKS, LGS ve KPSS hazırlık sürecinizi profesyonel bir şekilde yönetin.</p>
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
            <h2 className="text-3xl font-bold text-slate-50 tracking-tight">Giriş Yap</h2>
            <p className="mt-2 text-slate-400">Hesabınıza erişin</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6" data-testid="login-form">
            {error && (
              <div className="bg-red-500/10 border border-red-500/50 rounded-lg p-4 flex items-start gap-3" data-testid="login-error">
                <AlertCircle className="w-5 h-5 text-red-500 mt-0.5" />
                <p className="text-sm text-red-400">{error}</p>
              </div>
            )}

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
                  data-testid="email-input"
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
                  data-testid="password-input"
                />
              </div>
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-indigo-600 hover:bg-indigo-500 text-white glow-button h-12 text-base"
              data-testid="login-button"
            >
              {loading ? 'Giriş yapılıyor...' : 'Giriş Yap'}
            </Button>
          </form>

          <div className="text-center space-y-4">
            <p className="text-slate-400">
              Hesabınız yok mu?{' '}
              <Link to="/register" className="text-indigo-400 hover:text-indigo-300 font-medium" data-testid="register-link">
                Kayıt Ol
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
