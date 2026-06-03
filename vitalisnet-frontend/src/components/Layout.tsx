import React from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  Calendar, 
  Users, 
  FileText, 
  DollarSign, 
  LogOut, 
  Activity, 
  User as UserIcon,
  Building
} from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export const Layout: React.FC<LayoutProps> = ({ children, activeTab, setActiveTab }) => {
  const { user, logout } = useAuth();

  // Mapeo estático del nombre de la clínica a partir del clinic_id
  const getClinicName = (id: number | null | undefined) => {
    if (!id) return 'Clínica VitalisNet';
    switch (id) {
      case 1:
        return 'Clínica Vitalis Providencia';
      case 2:
        return 'Clínica Vitalis Las Condes';
      default:
        return `Centro Médico Vitalis #${id}`;
    }
  };

  const formatRole = (role: string | undefined) => {
    if (!role) return '';
    if (role === 'admin_centro') return 'Administrador';
    if (role === 'profesional') return 'Profesional Médico';
    return role.charAt(0).toUpperCase() + role.slice(1);
  };

  const navItems = [
    { id: 'agenda', label: 'Agenda', icon: Calendar },
    { id: 'pacientes', label: 'Pacientes', icon: Users },
    { id: 'fichas', label: 'Fichas Clínicas', icon: FileText },
    { id: 'finanzas', label: 'Finanzas', icon: DollarSign },
  ];

  return (
    <div className="flex h-screen bg-[#F4F6F8] overflow-hidden">
      {/* Sidebar Lateral */}
      <aside className="w-64 bg-[#1A5F7A] text-white flex flex-col justify-between shadow-xl flex-shrink-0 z-20">
        <div>
          {/* Logo y Encabezado Sidebar */}
          <div className="p-6 border-b border-white/10 flex items-center space-x-3">
            <div className="p-2 bg-white/10 rounded-xl text-white">
              <Activity className="h-6 w-6 stroke-[2]" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-wide font-display text-white">VitalisNet</h1>
              <p className="text-[10px] text-white/60 font-semibold uppercase tracking-widest">Plataforma</p>
            </div>
          </div>

          {/* Menú de Navegación */}
          <nav className="mt-6 px-4 space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-150 ${
                    isActive 
                      ? 'bg-white/15 text-white shadow-inner font-semibold border-l-4 border-[#E88D4D]' 
                      : 'text-white/80 hover:bg-white/5 hover:text-white'
                  }`}
                >
                  <Icon className={`h-5 w-5 ${isActive ? 'text-[#E88D4D]' : 'text-white/60'}`} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Footer Sidebar - Usuario Activo Info */}
        <div className="p-4 border-t border-white/10 bg-black/10">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-white/15 rounded-lg">
              <UserIcon className="h-4 w-4 text-white" />
            </div>
            <div className="overflow-hidden">
              <p className="text-xs font-semibold truncate text-white">
                {user?.email?.split('@')[0] || 'Usuario'}
              </p>
              <p className="text-[10px] text-white/50 truncate">
                {formatRole(user?.rol)}
              </p>
            </div>
          </div>
        </div>
      </aside>

      {/* Contenedor Principal */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header Superior */}
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-8 z-10 shadow-sm">
          {/* Nombre de Clínica */}
          <div className="flex items-center space-x-2 text-slate-800">
            <Building className="h-5 w-5 text-[#7F9C7A]" />
            <span className="font-semibold text-base font-display">
              {getClinicName(user?.clinic_id)}
            </span>
          </div>

          {/* Acciones del Header */}
          <div className="flex items-center space-x-4">
            <div className="hidden sm:flex flex-col text-right">
              <span className="text-xs text-slate-400 font-medium">Sesión iniciada como:</span>
              <span className="text-sm text-[#1E293B] font-semibold">{user?.email}</span>
            </div>
            <button
              onClick={logout}
              title="Cerrar Sesión"
              className="flex items-center justify-center p-2 rounded-xl text-slate-500 hover:text-red-600 hover:bg-red-50 focus:outline-none transition-all duration-200 border border-slate-200 hover:border-red-200"
            >
              <LogOut className="h-5 w-5" />
            </button>
          </div>
        </header>

        {/* Contenido de la Vista */}
        <main className="flex-1 overflow-y-auto p-8 bg-[#F4F6F8] focus:outline-none">
          {children}
        </main>
      </div>
    </div>
  );
};
