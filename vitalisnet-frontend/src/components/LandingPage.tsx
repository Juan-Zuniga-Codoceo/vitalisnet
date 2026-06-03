import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Activity, Calendar, FileText, DollarSign, ArrowRight, ShieldCheck, HeartPulse, RefreshCw } from 'lucide-react';
import axios from 'axios';

interface LandingPageProps {
  onGoToLogin: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onGoToLogin }) => {
  const { login } = useAuth();
  const [loadingDemo, setLoadingDemo] = useState<string | null>(null);
  const [loadingSubscription, setLoadingSubscription] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Determinar la URL del backend según el entorno
  const API_BASE_URL = window.location.hostname === 'localhost'
    ? 'http://localhost:8000/api/v1'
    : 'https://api.vitalisnet.synapsedev.cl/api/v1';

  const handleDemoAccess = async (email: string, roleName: string) => {
    setLoadingDemo(roleName);
    setErrorMsg(null);
    try {
      // Iniciar sesión con credenciales por defecto del seed
      await login(email, 'password123');
    } catch (err: any) {
      console.error(err);
      setErrorMsg('No se pudo acceder a la demo. Asegúrate de que la base de datos esté inicializada.');
    } finally {
      setLoadingDemo(null);
    }
  };

  const handleSubscribe = async () => {
    setLoadingSubscription(true);
    setErrorMsg(null);
    try {
      const response = await axios.post(`${API_BASE_URL}/payments/subscribe`);
      const { init_point } = response.data;
      if (init_point) {
        // Redirigir al checkout de Mercado Pago
        window.location.href = init_point;
      } else {
        throw new Error('No se recibió la URL de redirección.');
      }
    } catch (err: any) {
      console.error(err);
      setErrorMsg('Ocurrió un error al generar la suscripción en Mercado Pago. Intenta nuevamente.');
    } finally {
      setLoadingSubscription(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F4F6F8] text-[#1E293B] font-sans antialiased overflow-x-hidden">
      {/* Header / Navbar */}
      <header className="sticky top-0 bg-white/80 backdrop-blur-md border-b border-slate-100 z-50 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center space-x-2 text-[#1A5F7A]">
          <Activity className="h-6 w-6 stroke-[2.5]" />
          <span className="font-display font-bold text-xl tracking-tight">VitalisNet</span>
        </div>
        <nav className="hidden md:flex space-x-8 text-sm font-semibold">
          <a href="#caracteristicas" className="text-slate-500 hover:text-[#1A5F7A] transition-colors">Características</a>
          <a href="#precios" className="text-slate-500 hover:text-[#1A5F7A] transition-colors">Precios</a>
          <a href="#demo" className="text-slate-500 hover:text-[#1A5F7A] transition-colors">Acceso Demo</a>
        </nav>
        <div className="flex items-center space-x-4">
          <button 
            onClick={onGoToLogin} 
            className="text-sm font-bold text-[#1A5F7A] hover:text-[#1A5F7A]/80 transition-colors"
          >
            Iniciar Sesión
          </button>
          <button 
            onClick={handleSubscribe}
            className="hidden sm:inline-flex items-center justify-center bg-[#E88D4D] hover:bg-[#E88D4D]/90 text-white font-semibold text-xs py-2 px-4 rounded-xl shadow-md transition-all duration-200"
          >
            Probar Gratis
          </button>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-20 pb-24 px-6 max-w-7xl mx-auto flex flex-col items-center text-center">
        <div className="absolute top-[-10%] left-[-10%] w-[35rem] h-[35rem] rounded-full bg-[#1A5F7A]/5 blur-3xl -z-10" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[35rem] h-[35rem] rounded-full bg-[#7F9C7A]/5 blur-3xl -z-10" />

        <div className="inline-flex items-center space-x-2 bg-[#1A5F7A]/10 text-[#1A5F7A] font-semibold text-xs px-3 py-1.5 rounded-full mb-6">
          <HeartPulse className="h-3.5 w-3.5" />
          <span>Fase Comercial MVP Activa</span>
        </div>

        <h1 className="font-display font-black text-4xl sm:text-5xl lg:text-6xl tracking-tight text-[#1E293B] max-w-4xl leading-[1.15]">
          Conecta tu práctica. <br />
          <span className="text-[#1A5F7A] bg-clip-text">La red viva que centraliza tu consulta médica.</span>
        </h1>
        
        <p className="mt-6 text-base sm:text-lg text-slate-500 max-w-2xl font-medium">
          Agenda médica avanzada, fichas clínicas electrónicas adaptativas y gestión de finanzas de última generación con liquidación automatizada 70/30. Todo en un solo lugar.
        </p>

        {errorMsg && (
          <div className="mt-6 p-4 bg-red-50 border-l-4 border-red-500 rounded-r-xl max-w-lg text-left flex items-start space-x-2 text-xs font-semibold text-red-700">
            <span>⚠️</span>
            <span>{errorMsg}</span>
          </div>
        )}

        <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4 w-full sm:w-auto">
          <button 
            onClick={handleSubscribe}
            disabled={loadingSubscription}
            className="w-full sm:w-auto flex items-center justify-center bg-[#1A5F7A] hover:bg-[#1A5F7A]/95 text-white font-bold text-sm px-8 py-4 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50"
          >
            {loadingSubscription ? 'Generando Suscripción...' : 'Probar VitalisNet 14 días gratis'}
            <ArrowRight className="ml-2 h-4 w-4" />
          </button>
          <a 
            href="#demo"
            className="w-full sm:w-auto flex items-center justify-center bg-white border border-slate-200 hover:bg-slate-50 text-[#1E293B] font-bold text-sm px-8 py-4 rounded-xl shadow-sm transition-all duration-200"
          >
            Explorar Demo Gratis
          </a>
        </div>
      </section>

      {/* Características Clave */}
      <section id="caracteristicas" className="py-20 bg-white border-y border-slate-100 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="font-display font-black text-3xl text-[#1E293B]">Diseñado para médicos del futuro</h2>
            <p className="mt-4 text-sm text-slate-400 font-semibold">Todas las herramientas clínicas y administrativas necesarias para optimizar tu consulta médica.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="bg-[#F4F6F8] rounded-2xl p-6 border border-slate-100 hover:shadow-md transition-shadow">
              <div className="p-3 bg-[#1A5F7A]/10 text-[#1A5F7A] rounded-xl inline-flex mb-4">
                <Calendar className="h-6 w-6" />
              </div>
              <h3 className="font-display font-bold text-base text-[#1E293B] mb-2">Agenda Anti-Double-Booking</h3>
              <p className="text-slate-500 text-xs leading-relaxed font-medium">
                Grilla médica interactiva sincronizada con una restricción a nivel base de datos (PostgreSQL range exclusion) que garantiza 0 citas empalmadas.
              </p>
            </div>

            <div className="bg-[#F4F6F8] rounded-2xl p-6 border border-slate-100 hover:shadow-md transition-shadow">
              <div className="p-3 bg-[#7F9C7A]/15 text-[#7F9C7A] rounded-xl inline-flex mb-4">
                <FileText className="h-6 w-6" />
              </div>
              <h3 className="font-display font-bold text-base text-[#1E293B] mb-2">Fichas Médicas Dinámicas</h3>
              <p className="text-slate-500 text-xs leading-relaxed font-medium">
                Evoluciones adaptativas para psicología y medicina general, guardando los datos estructurados en Postgres JSONB de forma limpia y escalable.
              </p>
            </div>

            <div className="bg-[#F4F6F8] rounded-2xl p-6 border border-slate-100 hover:shadow-md transition-shadow">
              <div className="p-3 bg-[#E88D4D]/10 text-[#E88D4D] rounded-xl inline-flex mb-4">
                <DollarSign className="h-6 w-6" />
              </div>
              <h3 className="font-display font-bold text-base text-[#1E293B] mb-2">Caja y Reparto de Comisiones</h3>
              <p className="text-slate-500 text-xs leading-relaxed font-medium">
                Dashboard financiero con reparto de honorarios profesional/centro (70% - 30%), registro de cobros rápido y reportes exportables.
              </p>
            </div>

            <div className="bg-[#F4F6F8] rounded-2xl p-6 border border-slate-100 hover:shadow-md transition-shadow">
              <div className="p-3 bg-indigo-50 text-indigo-500 rounded-xl inline-flex mb-4">
                <ShieldCheck className="h-6 w-6" />
              </div>
              <h3 className="font-display font-bold text-base text-[#1E293B] mb-2">Recordatorios WhatsApp & SII</h3>
              <p className="text-slate-500 text-xs leading-relaxed font-medium">
                Disminuye ausencias con avisos automáticos de confirmación por WhatsApp y prepara boletas electrónicas mediante integraciones automáticas.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Precios */}
      <section id="precios" className="py-20 px-6 max-w-7xl mx-auto">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <h2 className="font-display font-black text-3xl text-[#1E293B]">Planes transparentes, sin sorpresas</h2>
          <p className="mt-4 text-sm text-slate-400 font-semibold">Regístrate hoy y utiliza la plataforma completa sin costo por un mes entero.</p>
        </div>

        <div className="max-w-md mx-auto bg-white border border-[#7F9C7A]/30 rounded-3xl shadow-xl overflow-hidden relative transition-all duration-300 hover:shadow-2xl">
          <div className="absolute top-0 right-0 bg-[#7F9C7A] text-white text-[10px] font-bold uppercase tracking-wider px-4 py-1.5 rounded-bl-2xl">
            1 Mes Gratis
          </div>
          
          <div className="p-8">
            <h3 className="font-display font-bold text-xl text-[#1E293B]">Plan Único Profesional</h3>
            <p className="text-slate-400 text-xs mt-2 font-semibold">Perfecto para médicos independientes y consultas particulares.</p>
            
            <div className="mt-6 flex items-baseline">
              <span className="font-display font-black text-4xl text-[#1E293B]">$29.990</span>
              <span className="text-slate-400 text-sm font-semibold ml-2">CLP / mes</span>
            </div>

            <ul className="mt-8 space-y-4 text-xs font-semibold text-slate-600">
              <li className="flex items-center space-x-3">
                <span className="text-[#7F9C7A] text-lg">✓</span>
                <span>Agenda médica y sobrecupos ilimitados</span>
              </li>
              <li className="flex items-center space-x-3">
                <span className="text-[#7F9C7A] text-lg">✓</span>
                <span>Fichas clínicas ilimitadas con campos dinámicos</span>
              </li>
              <li className="flex items-center space-x-3">
                <span className="text-[#7F9C7A] text-lg">✓</span>
                <span>Módulo de finanzas, caja y reportes de comisiones</span>
              </li>
              <li className="flex items-center space-x-3">
                <span className="text-[#7F9C7A] text-lg">✓</span>
                <span>Periodo de prueba de 30 días incluido</span>
              </li>
            </ul>

            <button 
              onClick={handleSubscribe}
              disabled={loadingSubscription}
              className="mt-8 w-full py-3 px-4 bg-[#1A5F7A] hover:bg-[#1A5F7A]/95 text-white font-bold rounded-xl shadow-md transition-all duration-200 disabled:opacity-50"
            >
              {loadingSubscription ? 'Redirigiendo...' : 'Suscribirse con Mercado Pago'}
            </button>
          </div>
        </div>
      </section>

      {/* Demo Access Area */}
      <section id="demo" className="py-20 bg-slate-950 text-white border-t border-slate-900 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="font-display font-black text-3xl">Acceso Rápido Demo</h2>
          <p className="mt-4 text-slate-400 text-sm font-medium max-w-xl mx-auto">
            Ingresa de inmediato al dashboard administrativo y clínico utilizando las credenciales configuradas de fábrica. ¡Prueba sin demoras!
          </p>

          <div className="mt-12 grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-2xl mx-auto">
            <div className="bg-white/5 border border-white/10 rounded-2xl p-6 text-left flex flex-col justify-between">
              <div>
                <span className="text-xs font-semibold text-[#7F9C7A] uppercase tracking-wider">Módulo Clínico</span>
                <h4 className="font-display font-bold text-lg mt-1 text-white">Dra. Eloísa Díaz</h4>
                <p className="text-slate-400 text-xs mt-2 font-medium">
                  Agenda consultas, evoluciona fichas con signos clínicos y revisa tus comisiones personales (70%).
                </p>
                <div className="mt-4 bg-white/5 p-3 rounded-lg font-mono text-[11px] text-slate-300">
                  <p>Email: doctor@vitalisnet.cl</p>
                  <p>Contraseña: password123</p>
                </div>
              </div>
              <button 
                onClick={() => handleDemoAccess('doctor@vitalisnet.cl', 'doctor')}
                disabled={loadingDemo !== null}
                className="mt-6 w-full flex items-center justify-center py-2.5 px-4 bg-[#1A5F7A] hover:bg-[#1A5F7A]/90 text-white font-bold text-xs rounded-xl shadow-md transition-colors disabled:opacity-50"
              >
                {loadingDemo === 'doctor' ? (
                  <RefreshCw className="animate-spin h-4 w-4 mr-2" />
                ) : null}
                {loadingDemo === 'doctor' ? 'Ingresando...' : 'Entrar como Doctor'}
              </button>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-2xl p-6 text-left flex flex-col justify-between">
              <div>
                <span className="text-xs font-semibold text-[#E88D4D] uppercase tracking-wider">Módulo Administrativo</span>
                <h4 className="font-display font-bold text-lg mt-1 text-white">Administrador Centro</h4>
                <p className="text-slate-400 text-xs mt-2 font-medium">
                  Visualiza el flujo de caja global, aprueba pagos pendientes y revisa los ingresos del centro médico (30%).
                </p>
                <div className="mt-4 bg-white/5 p-3 rounded-lg font-mono text-[11px] text-slate-300">
                  <p>Email: admin@vitalisnet.cl</p>
                  <p>Contraseña: password123</p>
                </div>
              </div>
              <button 
                onClick={() => handleDemoAccess('admin@vitalisnet.cl', 'admin')}
                disabled={loadingDemo !== null}
                className="mt-6 w-full flex items-center justify-center py-2.5 px-4 bg-[#E88D4D] hover:bg-[#E88D4D]/90 text-white font-bold text-xs rounded-xl shadow-md transition-colors disabled:opacity-50"
              >
                {loadingDemo === 'admin' ? (
                  <RefreshCw className="animate-spin h-4 w-4 mr-2" />
                ) : null}
                {loadingDemo === 'admin' ? 'Ingresando...' : 'Entrar como Admin'}
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-950 text-slate-500 text-center py-8 border-t border-slate-900 px-6">
        <p className="text-xs font-semibold">
          VitalisNet &copy; {new Date().getFullYear()} — Plataforma de Gestión Clínica Integral. Todos los derechos reservados. Desarrollado por SynapseDev.
        </p>
      </footer>
    </div>
  );
};
