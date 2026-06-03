import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Mail, Lock, Eye, EyeOff, Activity, Loader2, AlertCircle } from 'lucide-react';

interface LoginProps {
  onGoBack?: () => void;
}

export const Login: React.FC<LoginProps> = ({ onGoBack }) => {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Por favor, completa todos los campos.');
      return;
    }

    setError(null);
    setLoading(true);

    try {
      await login(email, password);
    } catch (err: any) {
      console.error(err);
      if (err.response && err.response.data && err.response.data.detail) {
        setError(err.response.data.detail);
      } else {
        setError('Ocurrió un error al intentar iniciar sesión. Verifica tu conexión.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F4F6F8] px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Decorative background shapes */}
      <div className="absolute top-[-10%] left-[-10%] w-[40rem] h-[40rem] rounded-full bg-[#1A5F7A]/5 blur-3xl" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[35rem] h-[35rem] rounded-full bg-[#7F9C7A]/10 blur-3xl" />

      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-2xl shadow-xl shadow-vitalis-dark/5 border border-slate-100 z-10 transition-all duration-300 hover:shadow-2xl hover:shadow-vitalis-dark/10">
        <div className="text-center">
          <div className="flex justify-center">
            <div className="p-3 bg-[#1A5F7A]/10 rounded-2xl text-[#1A5F7A] inline-flex items-center justify-center animate-pulse">
              <Activity className="h-10 w-10 stroke-[2]" />
            </div>
          </div>
          <h2 className="mt-6 text-3xl font-bold tracking-tight text-[#1E293B] font-display">
            VitalisNet
          </h2>
          <p className="mt-2 text-sm text-[#7F9C7A] font-medium">
            Gestión Clínica Inteligente
          </p>
        </div>

        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-md flex items-start space-x-2 animate-shake">
            <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-700 font-medium">{error}</p>
          </div>
        )}

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label htmlFor="email-address" className="block text-xs font-semibold uppercase tracking-wider text-[#1E293B] mb-1">
                Correo Electrónico
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Mail className="h-5 w-5" />
                </div>
                <input
                  id="email-address"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full pl-10 pr-3 py-3 border border-slate-200 rounded-xl bg-slate-50 placeholder-slate-400 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-[#1A5F7A] focus:border-[#1A5F7A] focus:bg-white transition-all"
                  placeholder="ejemplo@clinicavitalis.cl"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-xs font-semibold uppercase tracking-wider text-[#1E293B] mb-1">
                Contraseña
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Lock className="h-5 w-5" />
                </div>
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full pl-10 pr-10 py-3 border border-slate-200 rounded-xl bg-slate-50 placeholder-slate-400 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-[#1A5F7A] focus:border-[#1A5F7A] focus:bg-white transition-all"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 focus:outline-none"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-semibold rounded-xl text-white bg-[#1A5F7A] hover:bg-[#1A5F7A]/95 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#1A5F7A] disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg transition-all duration-200"
            >
              {loading ? (
                <Loader2 className="animate-spin h-5 w-5 mr-2" />
              ) : null}
              {loading ? 'Iniciando Sesión...' : 'Iniciar Sesión'}
            </button>
          </div>
        </form>

        {onGoBack && (
          <div className="text-center pt-2">
            <button
              onClick={onGoBack}
              className="text-xs font-bold text-[#1A5F7A] hover:text-[#1A5F7A]/80 transition-colors"
            >
              ← Volver al Inicio
            </button>
          </div>
        )}

        <div className="text-center pt-4 border-t border-slate-100 mt-4">
          <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">
            Soporte VitalisNet &copy; {new Date().getFullYear()} — SynapseDev
          </p>
        </div>
      </div>
    </div>
  );
};
