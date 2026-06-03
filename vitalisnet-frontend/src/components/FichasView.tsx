import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  Search, 
  User, 
  Phone, 
  Mail, 
  PlusCircle, 
  Activity, 
  Heart, 
  Scale, 
  FileText, 
  ClipboardList, 
  Layers, 
  ShieldAlert,
  Sparkles,
  ArrowRight,
  TrendingUp
} from 'lucide-react';
import dayjs from 'dayjs';

export interface Patient {
  id: number;
  name: string;
  rut: string;
  age: number;
  phone: string;
  email: string;
}

export interface ClinicalConsultation {
  id: number;
  patientId: number;
  date: string;
  professional: string;
  clinicName: string;
  motivo: string;
  specialty: 'psicologia' | 'medicina_general';
  evolucion_dinamica: {
    // Psicología
    anamnesis?: string;
    notas_sesion?: string;
    // Medicina General
    presion_arterial?: string;
    frecuencia_cardiaca?: string;
    peso?: string;
    estatura?: string;
    cie10?: string;
  };
}

const INITIAL_PATIENTS: Patient[] = [
  { id: 1, name: 'Pedro Urdemales', rut: '15.222.333-5', age: 34, phone: '+56 9 8765 4321', email: 'pedro.urdemales@gmail.com' },
  { id: 2, name: 'María Loreto', rut: '18.444.555-K', age: 28, phone: '+56 9 7654 3210', email: 'maria.loreto@yahoo.com' },
  { id: 3, name: 'Juan González', rut: '12.345.678-9', age: 49, phone: '+56 9 6543 2109', email: 'juan.gonzalez@gmail.com' },
  { id: 4, name: 'Catalina Muñoz', rut: '17.890.123-4', age: 24, phone: '+56 9 5432 1098', email: 'cmuñoz@outlook.com' },
  { id: 5, name: 'Andrés Bello', rut: '8.765.432-1', age: 62, phone: '+56 9 4321 0987', email: 'abello@universidad.cl' },
];

const INITIAL_CONSULTATIONS: ClinicalConsultation[] = [
  {
    id: 101,
    patientId: 1,
    date: '2026-05-15T10:00:00Z',
    professional: 'Dra. Eloísa Díaz',
    clinicName: 'Clínica Vitalis Providencia',
    motivo: 'Control de hipertensión y fatiga crónica.',
    specialty: 'medicina_general',
    evolucion_dinamica: {
      presion_arterial: '135/85 mmHg',
      frecuencia_cardiaca: '78 lpm',
      peso: '82 kg',
      estatura: '1.78 m',
      cie10: 'I10 - Hipertensión esencial (primaria)'
    }
  },
  {
    id: 102,
    patientId: 1,
    date: '2026-05-28T16:00:00Z',
    professional: 'Ps. Claudio Naranjo',
    clinicName: 'Clínica Vitalis Providencia',
    motivo: 'Crisis de pánico recurrentes y estrés laboral.',
    specialty: 'psicologia',
    evolucion_dinamica: {
      anamnesis: 'Paciente refiere aumento de sintomatología ansiosa gatillada por reestructuración en su empresa. Reporta insomnio de conciliación de 3 semanas de evolución.',
      notas_sesion: 'Se realiza psicoeducación sobre la curva de la ansiedad y se entrenan técnicas de respiración diafragmática. Paciente responde de buena manera a la intervención.'
    }
  },
  {
    id: 103,
    patientId: 2,
    date: '2026-05-20T11:30:00Z',
    professional: 'Dr. Alejandro del Río',
    clinicName: 'Clínica Vitalis Las Condes',
    motivo: 'Cuadro gripal de 3 días de evolución.',
    specialty: 'medicina_general',
    evolucion_dinamica: {
      presion_arterial: '110/70 mmHg',
      frecuencia_cardiaca: '82 lpm',
      peso: '58 kg',
      estatura: '1.63 m',
      cie10: 'J06.9 - Infección aguda de las vías respiratorias superiores, no especificada'
    }
  }
];

interface FichasViewProps {
  preselectedPatientRut?: string;
  onClearPreselected?: () => void;
}

export const FichasView: React.FC<FichasViewProps> = ({ preselectedPatientRut, onClearPreselected }) => {
  const { user } = useAuth();
  const [patients] = useState<Patient[]>(INITIAL_PATIENTS);
  const [consultations, setConsultations] = useState<ClinicalConsultation[]>(INITIAL_CONSULTATIONS);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [activeTab, setActiveTab] = useState<'historial' | 'nueva'>('historial');

  // Formulario Nueva Evolución
  const [motivo, setMotivo] = useState('');
  const [specialty, setSpecialty] = useState<'medicina_general' | 'psicologia'>(() => {
    // Si el profesional tiene el rol médico, autoseleccionar medicina
    return user?.rol === 'profesional' ? 'medicina_general' : 'psicologia';
  });

  // Campos Dinámicos Psicología
  const [anamnesis, setAnamnesis] = useState('');
  const [notasSesion, setNotasSesion] = useState('');

  // Campos Dinámicos Medicina General
  const [presionArterial, setPresionArterial] = useState('');
  const [frecuenciaCardiaca, setFrecuenciaCardiaca] = useState('');
  const [peso, setPeso] = useState('');
  const [estatura, setEstatura] = useState('');
  const [cie10, setCie10] = useState('');

  // Filtrado de pacientes
  const filteredPatients = patients.filter(p => 
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    p.rut.includes(searchQuery)
  );

  const handleSelectPatient = (patient: Patient) => {
    setSelectedPatient(patient);
    setActiveTab('historial');
    setMotivo('');
    setAnamnesis('');
    setNotasSesion('');
    setPresionArterial('');
    setFrecuenciaCardiaca('');
    setPeso('');
    setEstatura('');
    setCie10('');
  };

  useEffect(() => {
    if (preselectedPatientRut) {
      setSearchQuery(preselectedPatientRut);
      const found = patients.find(p => p.rut === preselectedPatientRut);
      if (found) {
        handleSelectPatient(found);
      }
      if (onClearPreselected) {
        onClearPreselected();
      }
    }
  }, [preselectedPatientRut, patients]);

  const handleSaveEvolution = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPatient || !motivo) return;

    // Empaquetado del JSONB evolucion_dinamica según la especialidad
    const evolucionDinamica: ClinicalConsultation['evolucion_dinamica'] = {};
    if (specialty === 'psicologia') {
      evolucionDinamica.anamnesis = anamnesis;
      evolucionDinamica.notas_sesion = notasSesion;
    } else {
      evolucionDinamica.presion_arterial = presionArterial ? `${presionArterial} mmHg` : undefined;
      evolucionDinamica.frecuencia_cardiaca = frecuenciaCardiaca ? `${frecuenciaCardiaca} lpm` : undefined;
      evolucionDinamica.peso = peso ? `${peso} kg` : undefined;
      evolucionDinamica.estatura = estatura ? `${estatura} m` : undefined;
      evolucionDinamica.cie10 = cie10;
    }

    const newConsultation: ClinicalConsultation = {
      id: Date.now(),
      patientId: selectedPatient.id,
      date: new Date().toISOString(),
      professional: user?.email ? `Dr/Ps. ${user.email.split('@')[0]}` : 'Profesional Médico',
      clinicName: user?.clinic_id === 2 ? 'Clínica Vitalis Las Condes' : 'Clínica Vitalis Providencia',
      motivo,
      specialty,
      evolucion_dinamica: evolucionDinamica
    };

    setConsultations(prev => [newConsultation, ...prev]);
    
    // Limpiar formulario y volver al historial
    setMotivo('');
    setAnamnesis('');
    setNotasSesion('');
    setPresionArterial('');
    setFrecuenciaCardiaca('');
    setPeso('');
    setEstatura('');
    setCie10('');
    setActiveTab('historial');
  };

  // Filtrar consultas del paciente seleccionado
  const patientConsultations = consultations.filter(c => c.patientId === selectedPatient?.id);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      
      {/* COLUMNA 1: BUSCADOR DE PACIENTES */}
      <div className="lg:col-span-1 bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden flex flex-col h-[calc(100vh-120px)]">
        <div className="p-4 border-b border-slate-100 bg-slate-50/50">
          <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
            Buscador Clínico
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
              <Search className="h-4 w-4" />
            </div>
            <input
              type="text"
              placeholder="Buscar por Nombre o RUT..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="block w-full pl-9 pr-3 py-2.5 border border-slate-200 rounded-xl bg-white placeholder-slate-400 text-slate-900 text-xs focus:outline-none focus:ring-2 focus:ring-[#1A5F7A] transition-all"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
          {filteredPatients.length > 0 ? (
            filteredPatients.map(p => {
              const isSelected = selectedPatient?.id === p.id;
              return (
                <button
                  key={p.id}
                  onClick={() => handleSelectPatient(p)}
                  className={`w-full text-left p-4 hover:bg-slate-50 transition-all flex items-center justify-between group ${
                    isSelected ? 'bg-[#1A5F7A]/5 border-l-4 border-[#1A5F7A]' : ''
                  }`}
                >
                  <div className="flex items-center space-x-3 overflow-hidden">
                    <div className={`h-9 w-9 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0 ${
                      isSelected ? 'bg-[#1A5F7A] text-white' : 'bg-slate-100 text-slate-600'
                    }`}>
                      {p.name.charAt(0)}
                    </div>
                    <div className="overflow-hidden">
                      <p className={`text-sm font-semibold truncate ${isSelected ? 'text-[#1A5F7A]' : 'text-slate-700'}`}>
                        {p.name}
                      </p>
                      <p className="text-[10px] font-mono text-slate-400 mt-0.5">{p.rut}</p>
                    </div>
                  </div>
                  <ArrowRight className={`h-4 w-4 text-slate-300 transition-transform group-hover:translate-x-1 ${
                    isSelected ? 'text-[#1A5F7A]' : ''
                  }`} />
                </button>
              );
            })
          ) : (
            <div className="p-8 text-center text-slate-400">
              <ShieldAlert className="h-8 w-8 mx-auto mb-2 text-slate-300" />
              <p className="text-xs font-semibold">No se encontraron pacientes</p>
            </div>
          )}
        </div>
      </div>

      {/* COLUMNA 2-3: DETALLES DE FICHA CLÍNICA Y EVOLUCIONES */}
      <div className="lg:col-span-2 space-y-6 flex flex-col h-[calc(100vh-120px)] overflow-y-auto pr-2">
        {selectedPatient ? (
          <>
            {/* TARGETA DE INFORMACIÓN GENERAL DEL PACIENTE */}
            <div className="bg-[#F4F6F8] p-6 rounded-2xl border border-slate-200/60 shadow-sm flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div className="flex items-center space-x-4">
                <div className="h-14 w-14 bg-[#1A5F7A] text-white rounded-2xl flex items-center justify-center shadow-md">
                  <User className="h-7 w-7" />
                </div>
                <div>
                  <h3 className="text-lg font-bold font-display text-[#1E293B]">{selectedPatient.name}</h3>
                  <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1 text-xs text-slate-500 font-medium">
                    <span className="font-mono">RUT: {selectedPatient.rut}</span>
                    <span>&bull;</span>
                    <span>Edad: {selectedPatient.age} años</span>
                  </div>
                </div>
              </div>

              <div className="flex flex-col md:items-end text-xs text-slate-500 font-medium space-y-1 border-t md:border-t-0 pt-3 md:pt-0 border-slate-200">
                <div className="flex items-center space-x-2">
                  <Phone className="h-3.5 w-3.5 text-[#7F9C7A]" />
                  <span>{selectedPatient.phone}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Mail className="h-3.5 w-3.5 text-[#7F9C7A]" />
                  <span>{selectedPatient.email}</span>
                </div>
              </div>
            </div>

            {/* CONTROL DE TABS */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden flex flex-col flex-1">
              <div className="border-b border-slate-100 bg-slate-50/50 p-2 flex justify-between items-center">
                <div className="flex space-x-1">
                  <button
                    onClick={() => setActiveTab('historial')}
                    className={`px-4 py-2 text-xs font-semibold rounded-xl transition-all ${
                      activeTab === 'historial'
                        ? 'bg-[#1A5F7A] text-white shadow-sm'
                        : 'text-slate-500 hover:bg-slate-100'
                    }`}
                  >
                    <ClipboardList className="h-4 w-4 inline mr-1.5" />
                    Historial Clínico
                  </button>
                  <button
                    onClick={() => setActiveTab('nueva')}
                    className={`px-4 py-2 text-xs font-semibold rounded-xl transition-all ${
                      activeTab === 'nueva'
                        ? 'bg-[#1A5F7A] text-white shadow-sm'
                        : 'text-slate-500 hover:bg-slate-100'
                    }`}
                  >
                    <PlusCircle className="h-4 w-4 inline mr-1.5" />
                    Nueva Evolución
                  </button>
                </div>

                <div className="text-[10px] bg-slate-200/60 px-2.5 py-1 rounded-full text-slate-500 font-bold uppercase tracking-wider">
                  {patientConsultations.length} {patientConsultations.length === 1 ? 'consulta' : 'consultas'}
                </div>
              </div>

              {/* RENDERIZADO DE TAB: HISTORIAL */}
              {activeTab === 'historial' && (
                <div className="p-6 flex-1 overflow-y-auto max-h-[500px]">
                  {patientConsultations.length > 0 ? (
                    <div className="relative border-l-2 border-[#7F9C7A]/30 ml-4 pl-6 space-y-8 py-2">
                      {patientConsultations.map(cons => {
                        const isPsy = cons.specialty === 'psicologia';
                        return (
                          <div key={cons.id} className="relative group">
                            
                            {/* Punto del Timeline */}
                            <div className="absolute -left-[31px] top-1.5 bg-white border-2 border-[#7F9C7A] h-4 w-4 rounded-full flex items-center justify-center z-10 transition-colors group-hover:bg-[#7F9C7A]" />
                            
                            {/* Tarjeta de evolución */}
                            <div className="bg-white p-5 rounded-2xl border border-slate-150 shadow-sm space-y-3 transition-shadow hover:shadow-md">
                              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 border-b border-slate-100 pb-2">
                                <div>
                                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide block">
                                    {dayjs(cons.date).format('DD [de] MMMM, YYYY — HH:mm')} hrs
                                  </span>
                                  <h4 className="text-sm font-bold text-[#1A5F7A]">{cons.professional}</h4>
                                </div>
                                <span className={`self-start sm:self-center inline-flex px-2 py-0.5 rounded-full text-[9px] font-bold uppercase ${
                                  isPsy ? 'bg-indigo-50 text-indigo-700 border border-indigo-200' : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                }`}>
                                  {isPsy ? 'Psicología' : 'Medicina General'}
                                </span>
                              </div>

                              <div>
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                                  Motivo de Consulta
                                </span>
                                <p className="text-xs text-slate-700 font-medium mt-0.5">{cons.motivo}</p>
                              </div>

                              {/* Desglose Dinámico de evolucion_dinamica (JSONB) */}
                              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100 mt-2 space-y-2">
                                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider flex items-center space-x-1">
                                  <Layers className="h-3 w-3 text-slate-400" />
                                  <span>Evolución Clínica (Datos JSONB)</span>
                                </span>

                                {isPsy ? (
                                  <div className="space-y-2 text-xs">
                                    {cons.evolucion_dinamica.anamnesis && (
                                      <div>
                                        <span className="font-bold text-slate-700 block">Anamnesis / Antecedentes:</span>
                                        <p className="text-slate-600 mt-0.5 leading-relaxed bg-white p-2 rounded-lg border border-slate-100">{cons.evolucion_dinamica.anamnesis}</p>
                                      </div>
                                    )}
                                    {cons.evolucion_dinamica.notas_sesion && (
                                      <div>
                                        <span className="font-bold text-slate-700 block">Notas de la Sesión:</span>
                                        <p className="text-slate-600 mt-0.5 leading-relaxed bg-white p-2 rounded-lg border border-slate-100">{cons.evolucion_dinamica.notas_sesion}</p>
                                      </div>
                                    )}
                                  </div>
                                ) : (
                                  <div className="space-y-3">
                                    {/* Signos Vitales */}
                                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                                      {cons.evolucion_dinamica.presion_arterial && (
                                        <div className="bg-white p-2 rounded-lg border border-slate-100 flex items-center space-x-2">
                                          <Heart className="h-3.5 w-3.5 text-red-500 flex-shrink-0" />
                                          <div className="overflow-hidden">
                                            <span className="text-[8px] text-slate-400 font-bold block uppercase leading-none">P. Arterial</span>
                                            <span className="text-xs font-semibold text-slate-700">{cons.evolucion_dinamica.presion_arterial}</span>
                                          </div>
                                        </div>
                                      )}
                                      {cons.evolucion_dinamica.frecuencia_cardiaca && (
                                        <div className="bg-white p-2 rounded-lg border border-slate-100 flex items-center space-x-2">
                                          <Activity className="h-3.5 w-3.5 text-emerald-500 flex-shrink-0" />
                                          <div>
                                            <span className="text-[8px] text-slate-400 font-bold block uppercase leading-none">Pulso</span>
                                            <span className="text-xs font-semibold text-slate-700">{cons.evolucion_dinamica.frecuencia_cardiaca}</span>
                                          </div>
                                        </div>
                                      )}
                                      {cons.evolucion_dinamica.peso && (
                                        <div className="bg-white p-2 rounded-lg border border-slate-100 flex items-center space-x-2">
                                          <Scale className="h-3.5 w-3.5 text-amber-500 flex-shrink-0" />
                                          <div>
                                            <span className="text-[8px] text-slate-400 font-bold block uppercase leading-none">Peso</span>
                                            <span className="text-xs font-semibold text-slate-700">{cons.evolucion_dinamica.peso}</span>
                                          </div>
                                        </div>
                                      )}
                                      {cons.evolucion_dinamica.estatura && (
                                        <div className="bg-white p-2 rounded-lg border border-slate-100 flex items-center space-x-2">
                                          <TrendingUp className="h-3.5 w-3.5 text-indigo-500 flex-shrink-0" />
                                          <div>
                                            <span className="text-[8px] text-slate-400 font-bold block uppercase leading-none">Estatura</span>
                                            <span className="text-xs font-semibold text-slate-700">{cons.evolucion_dinamica.estatura}</span>
                                          </div>
                                        </div>
                                      )}
                                    </div>

                                    {cons.evolucion_dinamica.cie10 && (
                                      <div className="bg-white p-2.5 rounded-lg border border-slate-100 text-xs">
                                        <span className="font-bold text-slate-700 block">Diagnóstico CIE-10:</span>
                                        <span className="font-medium text-[#1A5F7A] mt-0.5 inline-block bg-[#1A5F7A]/5 px-2 py-0.5 rounded border border-[#1A5F7A]/10">
                                          {cons.evolucion_dinamica.cie10}
                                        </span>
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="py-12 text-center text-slate-400">
                      <FileText className="h-10 w-10 mx-auto mb-2 text-slate-300" />
                      <p className="text-xs font-semibold">El paciente no registra consultas previas.</p>
                      <button 
                        onClick={() => setActiveTab('nueva')}
                        className="mt-3 text-xs text-[#1A5F7A] font-bold hover:underline"
                      >
                        Registrar primera evolución &rarr;
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* RENDERIZADO DE TAB: NUEVA EVOLUCIÓN */}
              {activeTab === 'nueva' && (
                <form onSubmit={handleSaveEvolution} className="p-6 flex-1 overflow-y-auto space-y-4 max-h-[500px]">
                  
                  {/* Selector de Especialidad */}
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-150 flex items-center justify-between">
                    <div>
                      <span className="text-xs font-bold text-slate-700 block">Formulario Dinámico</span>
                      <span className="text-[10px] text-slate-400 font-medium">Campos adaptativos según especialidad médica</span>
                    </div>
                    <select
                      value={specialty}
                      onChange={(e) => setSpecialty(e.target.value as any)}
                      className="px-3 py-1.5 border border-slate-200 rounded-lg text-xs bg-white focus:outline-none focus:ring-1 focus:ring-[#1A5F7A]"
                    >
                      <option value="psicologia">Psicología</option>
                      <option value="medicina_general">Medicina General</option>
                    </select>
                  </div>

                  {/* Cita vinculada y profesional (autocompletado) */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                        Profesional (Activo)
                      </label>
                      <input
                        type="text"
                        disabled
                        value={user?.email ? `${user.email.split('@')[0]} (Yo)` : 'Profesional Activo'}
                        className="block w-full px-3 py-2 border border-slate-200 rounded-xl text-xs bg-slate-50 text-slate-500 font-medium"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                        Cita Médica Vinculada
                      </label>
                      <select
                        required
                        className="block w-full px-3 py-2 border border-slate-200 rounded-xl text-xs bg-white focus:outline-none focus:ring-2 focus:ring-[#1A5F7A]"
                      >
                        <option value="today">Consulta Presencial — Hoy ({dayjs().format('DD/MM/YYYY')})</option>
                        <option value="none">Sin cita previa vinculada (Evolución espontánea)</option>
                      </select>
                    </div>
                  </div>

                  {/* Motivo de Consulta */}
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                      Motivo de Consulta (Fijo)
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Ej: Control rutinario de presión / Síntomas ansiosos..."
                      value={motivo}
                      onChange={(e) => setMotivo(e.target.value)}
                      className="block w-full px-3 py-2.5 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-[#1A5F7A] transition-all bg-slate-50/30 focus:bg-white"
                    />
                  </div>

                  {/* CAMPOS DINÁMICOS FORMULARIO */}
                  <div className="border-t border-slate-100 pt-4 space-y-4">
                    <span className="text-[10px] font-bold text-[#7F9C7A] uppercase tracking-wider block flex items-center space-x-1">
                      <Sparkles className="h-3.5 w-3.5" />
                      <span>Campos Dinámicos Clínicos (Guardados en JSONB)</span>
                    </span>

                    {specialty === 'psicologia' ? (
                      <div className="space-y-4">
                        <div>
                          <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                            Anamnesis / Antecedentes
                          </label>
                          <textarea
                            rows={3}
                            placeholder="Antecedentes del paciente y motivo profundo de consulta..."
                            value={anamnesis}
                            onChange={(e) => setAnamnesis(e.target.value)}
                            className="block w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-[#1A5F7A] transition-all bg-slate-50/30 focus:bg-white"
                          />
                        </div>

                        <div>
                          <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                            Notas de la Sesión / Intervención
                          </label>
                          <textarea
                            rows={3}
                            placeholder="Registros internos de la evolución del paciente durante la sesión..."
                            value={notasSesion}
                            onChange={(e) => setNotasSesion(e.target.value)}
                            className="block w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-[#1A5F7A] transition-all bg-slate-50/30 focus:bg-white"
                          />
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                          <div>
                            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                              P. Arterial (mmHg)
                            </label>
                            <input
                              type="text"
                              placeholder="Ej: 120/80"
                              value={presionArterial}
                              onChange={(e) => setPresionArterial(e.target.value)}
                              className="block w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-[#1A5F7A] transition-all bg-slate-50/30 focus:bg-white"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                              Frec. Cardíaca (lpm)
                            </label>
                            <input
                              type="number"
                              placeholder="Ej: 72"
                              value={frecuenciaCardiaca}
                              onChange={(e) => setFrecuenciaCardiaca(e.target.value)}
                              className="block w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-[#1A5F7A] transition-all bg-slate-50/30 focus:bg-white"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                              Peso (kg)
                            </label>
                            <input
                              type="number"
                              placeholder="Ej: 75"
                              value={peso}
                              onChange={(e) => setPeso(e.target.value)}
                              className="block w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-[#1A5F7A] transition-all bg-slate-50/30 focus:bg-white"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                              Estatura (m)
                            </label>
                            <input
                              type="text"
                              placeholder="Ej: 1.75"
                              value={estatura}
                              onChange={(e) => setEstatura(e.target.value)}
                              className="block w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-[#1A5F7A] transition-all bg-slate-50/30 focus:bg-white"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                            Diagnóstico CIE-10
                          </label>
                          <input
                            type="text"
                            placeholder="Ej: J00 - Nasofaringitis aguda"
                            value={cie10}
                            onChange={(e) => setCie10(e.target.value)}
                            className="block w-full px-3 py-2.5 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-[#1A5F7A] transition-all bg-slate-50/30 focus:bg-white"
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Acciones */}
                  <div className="pt-4 flex items-center space-x-3 justify-end border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => setActiveTab('historial')}
                      className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-all focus:outline-none"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 bg-[#E88D4D] hover:bg-[#E88D4D]/95 text-white text-xs font-semibold rounded-xl transition-all focus:outline-none shadow-sm"
                    >
                      Guardar Evolución
                    </button>
                  </div>

                </form>
              )}

            </div>
          </>
        ) : (
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-center items-center text-center py-20 flex-1">
            <div className="p-4 bg-slate-50 text-slate-400 rounded-full mb-4">
              <ClipboardList className="h-10 w-10 text-[#7F9C7A]" />
            </div>
            <h3 className="font-bold text-slate-700">Ningún paciente seleccionado</h3>
            <p className="text-xs text-slate-400 max-w-sm mt-2">
              Selecciona un paciente del buscador lateral izquierdo para visualizar su historial clínico de fichas o ingresar una nueva evolución médica.
            </p>
          </div>
        )}
      </div>

    </div>
  );
};
