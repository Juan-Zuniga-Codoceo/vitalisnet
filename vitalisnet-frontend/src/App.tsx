import React, { useState } from 'react';
import { useAuth } from './context/AuthContext';
import { Login } from './components/Login';
import { Layout } from './components/Layout';
import { Search } from 'lucide-react';
import { AgendaView } from './components/AgendaView';
import { FichasView } from './components/FichasView';
import { FinanzasView } from './components/FinanzasView';

const INITIAL_PATIENTS = [
  { id: 1, name: 'Pedro Urdemales', rut: '15.222.333-5', email: 'pedro.urdemales@gmail.com', phone: '+56 9 8765 4321', lastVisit: '2026-05-15' },
  { id: 2, name: 'María Loreto', rut: '18.444.555-K', email: 'maria.loreto@yahoo.com', phone: '+56 9 7654 3210', lastVisit: '2026-05-20' },
  { id: 3, name: 'Juan González', rut: '12.345.678-9', email: 'juan.gonzalez@gmail.com', phone: '+56 9 6543 2109', lastVisit: '2026-05-28' },
  { id: 4, name: 'Catalina Muñoz', rut: '17.890.123-4', email: 'cmuñoz@outlook.com', phone: '+56 9 5432 1098', lastVisit: '2026-05-10' },
  { id: 5, name: 'Andrés Bello', rut: '8.765.432-1', email: 'abello@universidad.cl', phone: '+56 9 4321 0987', lastVisit: '2026-06-01' },
];

// --- SECCIÓN: PACIENTES ---
const PacientesView: React.FC = () => {
  const [patients] = useState(INITIAL_PATIENTS);
  const [search, setSearch] = useState('');

  const filteredPatients = patients.filter(p => 
    p.name.toLowerCase().includes(search.toLowerCase()) || 
    p.rut.includes(search)
  );

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-[#1E293B] font-display">Pacientes</h2>
          <p className="text-xs text-slate-400 font-medium">Búsqueda y gestión de datos de pacientes registrados</p>
        </div>
        <div className="relative w-full sm:w-72">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
            <Search className="h-4 w-4" />
          </div>
          <input
            type="text"
            placeholder="Buscar por Nombre o RUT..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="block w-full pl-9 pr-3 py-2 border border-slate-200 rounded-xl bg-slate-50 placeholder-slate-400 text-slate-900 text-xs focus:outline-none focus:ring-2 focus:ring-[#1A5F7A] focus:bg-white transition-all"
          />
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-400 text-[10px] font-bold uppercase tracking-wider border-b border-slate-100">
                <th className="px-6 py-4">Paciente</th>
                <th className="px-6 py-4">RUT</th>
                <th className="px-6 py-4">Contacto</th>
                <th className="px-6 py-4">Última Consulta</th>
                <th className="px-6 py-4 text-right">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {filteredPatients.map((patient) => (
                <tr key={patient.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-3">
                      <div className="h-9 w-9 bg-[#7F9C7A]/15 text-[#7F9C7A] rounded-full flex items-center justify-center font-bold text-sm">
                        {patient.name.charAt(0)}
                      </div>
                      <span className="font-semibold text-slate-700">{patient.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 font-mono text-slate-500 text-xs">{patient.rut}</td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                      <span className="text-slate-600 font-medium">{patient.email}</span>
                      <span className="text-slate-400 text-xs">{patient.phone}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-slate-500">{patient.lastVisit}</td>
                  <td className="px-6 py-4 text-right">
                    <button className="text-xs text-[#1A5F7A] hover:text-[#1A5F7A]/80 font-bold">Ver Ficha</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};





// --- COMPONENTE APP PRINCIPAL ---
function App() {
  const { isAuthenticated } = useAuth();
  const [activeTab, setActiveTab] = useState('agenda');

  // Enrutamiento condicional
  if (!isAuthenticated) {
    return <Login />;
  }

  return (
    <Layout activeTab={activeTab} setActiveTab={setActiveTab}>
      {activeTab === 'agenda' && <AgendaView />}
      {activeTab === 'pacientes' && <PacientesView />}
      {activeTab === 'fichas' && <FichasView />}
      {activeTab === 'finanzas' && <FinanzasView />}
    </Layout>
  );
}

export default App;
