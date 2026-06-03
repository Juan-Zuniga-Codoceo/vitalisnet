import React, { useState } from 'react';
import dayjs from 'dayjs';
import 'dayjs/locale/es';
import { 
  ChevronLeft, 
  ChevronRight, 
  Calendar as CalendarIcon, 
  Plus, 
  X, 
  User, 
  UserCheck, 
  DollarSign, 
  CheckCircle,
  Clock,
  Ban,
  FileText
} from 'lucide-react';

// Forzar locale en español para formateo de fechas
dayjs.locale('es');

export interface Appointment {
  id: number;
  professional: string;
  patient: string;
  rut: string;
  time: string; // e.g. "09:00 - 09:30"
  date: string; // e.g. "2026-06-03"
  price: number;
  status: 'pendiente' | 'confirmado' | 'pagada' | 'cancelada';
}

const INITIAL_APPOINTMENTS: Appointment[] = [
  { id: 1, professional: 'Dra. Eloísa Díaz', patient: 'Pedro Urdemales', rut: '15.222.333-5', time: '09:00 - 09:30', date: '2026-06-03', price: 60000, status: 'pagada' },
  { id: 2, professional: 'Dr. Alejandro del Río', patient: 'María Loreto', rut: '18.444.555-K', time: '09:45 - 10:15', date: '2026-06-03', price: 45000, status: 'pendiente' },
  { id: 3, professional: 'Dra. Eloísa Díaz', patient: 'Juan González', rut: '12.345.678-9', time: '10:30 - 11:00', date: '2026-06-03', price: 60000, status: 'pagada' },
  { id: 4, professional: 'Dr. Alejandro del Río', patient: 'Catalina Muñoz', rut: '17.890.123-4', time: '11:15 - 11:45', date: '2026-06-03', price: 45000, status: 'cancelada' },
  { id: 5, professional: 'Dra. Eloísa Díaz', patient: 'Andrés Bello', rut: '8.765.432-1', time: '12:00 - 12:30', date: '2026-06-03', price: 60000, status: 'confirmado' },
  { id: 6, professional: 'Dr. Alejandro del Río', patient: 'Francisca Ovalle', rut: '19.876.543-2', time: '15:00 - 15:30', date: '2026-06-04', price: 45000, status: 'confirmado' },
  { id: 7, professional: 'Dra. Eloísa Díaz', patient: 'José Miguel Carrera', rut: '7.654.321-0', time: '16:00 - 16:30', date: '2026-06-04', price: 60000, status: 'pendiente' },
];

export const AgendaView: React.FC = () => {
  // Manejo de la semana visible (Lunes de la semana actual por defecto)
  const [currentWeekStart, setCurrentWeekStart] = useState<dayjs.Dayjs>(() => {
    const today = dayjs();
    const day = today.day();
    // Forzar inicio en el lunes de la semana actual
    return today.subtract(day === 0 ? 6 : day - 1, 'day').startOf('day');
  });

  const [appointments, setAppointments] = useState<Appointment[]>(INITIAL_APPOINTMENTS);
  
  // Modales
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  
  // Estados para nueva cita
  const [selectedSlot, setSelectedSlot] = useState<{ date: string; time: string } | null>(null);
  const [newPatientName, setNewPatientName] = useState('');
  const [newPatientRut, setNewPatientRut] = useState('');
  const [newProfessional, setNewProfessional] = useState('Dra. Eloísa Díaz');
  const [newPrice, setNewPrice] = useState('60000');

  // Estados para editar cita existente
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);

  // Navegación de Fechas
  const handlePrevWeek = () => {
    setCurrentWeekStart(prev => prev.subtract(1, 'week'));
  };

  const handleNextWeek = () => {
    setCurrentWeekStart(prev => prev.add(1, 'week'));
  };

  const handleGoToToday = () => {
    const today = dayjs();
    const day = today.day();
    setCurrentWeekStart(today.subtract(day === 0 ? 6 : day - 1, 'day').startOf('day'));
  };

  // Generar los 6 días laborables de la semana (Lunes a Sábado)
  const daysOfWeek = Array.from({ length: 6 }, (_, i) => currentWeekStart.add(i, 'day'));

  // Generar bloques horarios de 30 minutos (08:00 a 20:00)
  const timeSlots: string[] = [];
  for (let hour = 8; hour < 20; hour++) {
    timeSlots.push(`${hour.toString().padStart(2, '0')}:00`);
    timeSlots.push(`${hour.toString().padStart(2, '0')}:30`);
  }

  // Helper para capitalizar textos
  const capitalize = (str: string) => str.charAt(0).toUpperCase() + str.slice(1);

  // Helper para posicionamiento en CSS Grid
  const getColumnIndex = (appointmentDate: string) => {
    const date = dayjs(appointmentDate).startOf('day');
    const startOfWeek = currentWeekStart.startOf('day');
    const diff = date.diff(startOfWeek, 'day');
    if (diff >= 0 && diff < 6) {
      return diff + 2; // Column index (Monday = 2, Saturday = 7)
    }
    return -1;
  };

  const getRowIndices = (timeStr: string) => {
    const parts = timeStr.split(' - ');
    const start = parts[0];
    const end = parts[1] || start;

    const parseTimeToIndex = (t: string) => {
      const [h, m] = t.split(':').map(Number);
      const totalMinutes = h * 60 + m;
      const startMinutes = 8 * 60; // 08:00
      const index = Math.floor((totalMinutes - startMinutes) / 30);
      return index >= 0 ? index : -1;
    };

    const startIndex = parseTimeToIndex(start);
    // Si no tiene duración, asumimos 30 minutos (1 slot)
    const endIndex = parts[1] ? parseTimeToIndex(end) : startIndex + 1;

    if (startIndex === -1) return null;

    return {
      startRow: startIndex + 2, // +2 por la fila de headers
      endRow: endIndex !== -1 ? endIndex + 2 : startIndex + 3,
    };
  };

  // Guardar nueva cita
  const handleAddAppointment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSlot || !newPatientName || !newPatientRut) return;

    // Calcular hora de término (+30 mins)
    const [h, m] = selectedSlot.time.split(':').map(Number);
    const endMin = m === 30 ? 0 : 30;
    const endHour = m === 30 ? h + 1 : h;
    const endTime = `${endHour.toString().padStart(2, '0')}:${endMin.toString().padStart(2, '0')}`;

    const newApp: Appointment = {
      id: Date.now(),
      patient: newPatientName,
      rut: newPatientRut,
      professional: newProfessional,
      date: selectedSlot.date,
      time: `${selectedSlot.time} - ${endTime}`,
      price: Number(newPrice),
      status: 'pendiente',
    };

    setAppointments(prev => [...prev, newApp]);
    
    // Limpiar formulario y cerrar modal
    setNewPatientName('');
    setNewPatientRut('');
    setIsAddModalOpen(false);
  };

  // Modificar estado de cita existente
  const updateAppointmentStatus = (status: Appointment['status']) => {
    if (!selectedAppointment) return;
    setAppointments(prev => 
      prev.map(app => app.id === selectedAppointment.id ? { ...app, status } : app)
    );
    setIsEditModalOpen(false);
    setSelectedAppointment(null);
  };

  const handleCellClick = (dateStr: string, timeStr: string) => {
    setSelectedSlot({ date: dateStr, time: timeStr });
    setIsAddModalOpen(true);
  };

  const handleAppointmentClick = (app: Appointment, e: React.MouseEvent) => {
    e.stopPropagation(); // Evitar click en la celda de fondo
    setSelectedAppointment(app);
    setIsEditModalOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* HEADER DE CONTROL */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-center space-x-3">
          <div className="p-3 bg-[#1A5F7A]/10 text-[#1A5F7A] rounded-xl">
            <CalendarIcon className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold font-display text-[#1E293B]">
              {capitalize(currentWeekStart.format('MMMM YYYY'))}
            </h2>
            <p className="text-xs text-[#7F9C7A] font-semibold">Semana del Lunes {currentWeekStart.format('DD')} al Sábado {currentWeekStart.add(5, 'day').format('DD')}</p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <button 
            onClick={handlePrevWeek}
            className="flex items-center justify-center p-2.5 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors text-slate-600 focus:outline-none"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button 
            onClick={handleGoToToday}
            className="px-4 py-2.5 border border-slate-200 rounded-xl hover:bg-slate-50 font-semibold text-xs text-[#1E293B] focus:outline-none transition-colors"
          >
            Hoy
          </button>
          <button 
            onClick={handleNextWeek}
            className="flex items-center justify-center p-2.5 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors text-slate-600 focus:outline-none"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* GRILLA HORARIA DE AGENDA */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden flex flex-col">
        <div className="min-w-[850px] overflow-x-auto">
          
          {/* Contenedor de CSS Grid */}
          <div className="grid grid-cols-[80px_repeat(6,1fr)] bg-slate-100 gap-[1px] border-b border-slate-100 relative">
            
            {/* Headers de Columnas */}
            <div className="bg-slate-50/80 p-4 text-center font-bold text-[10px] text-slate-400 uppercase tracking-wider flex items-center justify-center">
              Hora
            </div>
            {daysOfWeek.map((day, idx) => {
              const isToday = day.isSame(dayjs(), 'day');
              return (
                <div 
                  key={idx} 
                  className={`p-4 text-center border-l border-slate-200/40 flex flex-col items-center justify-center transition-colors ${
                    isToday ? 'bg-[#1A5F7A]/5 text-[#1A5F7A]' : 'bg-slate-50/80 text-[#1E293B]'
                  }`}
                >
                  <span className="text-[10px] font-bold uppercase tracking-wider opacity-60">
                    {day.format('ddd')}
                  </span>
                  <span className="text-lg font-bold font-display mt-0.5">
                    {day.format('DD')}
                  </span>
                </div>
              );
            })}

            {/* Renderizado de Celdas Vacías Interactivas y Etiquetas Horarias */}
            {timeSlots.map((time, timeIdx) => {
              const rowIdx = timeIdx + 2; // Fila inicial en grid
              return (
                <React.Fragment key={timeIdx}>
                  {/* Etiqueta de la hora (Columna 1) */}
                  <div 
                    style={{ gridColumn: 1, gridRow: rowIdx }}
                    className="bg-slate-50 text-[11px] font-bold text-slate-400 flex items-center justify-center py-4 border-r border-slate-200/50"
                  >
                    {time}
                  </div>

                  {/* Celdas para cada día laborable (Columnas 2 a 7) */}
                  {daysOfWeek.map((day, dayIdx) => {
                    const colIdx = dayIdx + 2;
                    const dateStr = day.format('YYYY-MM-DD');
                    return (
                      <div
                        key={dayIdx}
                        style={{ gridColumn: colIdx, gridRow: rowIdx }}
                        onClick={() => handleCellClick(dateStr, time)}
                        className="bg-white min-h-[56px] border-t border-r border-slate-100 hover:bg-slate-50/60 transition-colors cursor-pointer relative group"
                      >
                        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <span className="p-1 bg-[#1A5F7A]/10 text-[#1A5F7A] rounded-lg">
                            <Plus className="h-4 w-4" />
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </React.Fragment>
              );
            })}

            {/* RENDERIZADO DE CITAS (POSICIONADAS DINÁMICAMENTE) */}
            {appointments.map((app) => {
              const colIdx = getColumnIndex(app.date);
              const rowIndices = getRowIndices(app.time);

              // Solo renderizar si la cita cae en la semana actual
              if (colIdx === -1 || !rowIndices) return null;

              const { startRow, endRow } = rowIndices;

              // Estilos de color oficiales del Brand Book según estado
              let stateStyles = '';
              if (app.status === 'pendiente') {
                stateStyles = 'bg-[#FFFBEB] text-amber-900 border-amber-300 border-l-4 hover:bg-[#FFFBEB]/90';
              } else if (app.status === 'confirmado') {
                stateStyles = 'bg-[#E8F5E9] text-[#1A5F7A] border-[#7F9C7A] border-l-4 hover:bg-[#E8F5E9]/90';
              } else if (app.status === 'pagada') {
                stateStyles = 'bg-[#F4F6F8] text-slate-400 border-slate-300 border border-dashed opacity-85 hover:opacity-100';
              } else if (app.status === 'cancelada') {
                stateStyles = 'bg-red-50 text-red-900 border-red-300 border-l-4 hover:bg-red-50/90';
              }

              return (
                <div
                  key={app.id}
                  style={{
                    gridColumn: colIdx,
                    gridRowStart: startRow,
                    gridRowEnd: endRow,
                    zIndex: 10
                  }}
                  onClick={(e) => handleAppointmentClick(app, e)}
                  className={`mx-1.5 my-1 p-2 rounded-xl text-left shadow-sm flex flex-col justify-between transition-all duration-150 cursor-pointer overflow-hidden group select-none ${stateStyles}`}
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <span className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded-full ${
                        app.status === 'pendiente' ? 'bg-amber-100 text-amber-800' :
                        app.status === 'confirmado' ? 'bg-[#7F9C7A]/25 text-[#1A5F7A]' :
                        app.status === 'pagada' ? 'bg-slate-200 text-slate-600 line-through' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {app.status === 'pagada' ? 'Pagada' : app.status}
                      </span>
                      <span className="text-[9px] font-semibold text-slate-400 group-hover:text-slate-500">
                        {app.time.split(' - ')[0]}
                      </span>
                    </div>
                    <h4 className={`text-xs font-bold mt-1.5 truncate ${app.status === 'pagada' ? 'line-through text-slate-400' : 'text-slate-800'}`}>
                      {app.patient}
                    </h4>
                  </div>
                  
                  <div className="mt-1 flex items-center justify-between text-[9px] text-slate-400 font-medium">
                    <span className="truncate max-w-[90px]">{app.professional.split(' ')[1]}</span>
                    <span className="font-semibold text-slate-600">${app.price.toLocaleString('es-CL')}</span>
                  </div>
                </div>
              );
            })}

          </div>
        </div>
      </div>

      {/* MODAL: AGENDAR CITA */}
      {isAddModalOpen && selectedSlot && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-slate-100 overflow-hidden">
            <div className="bg-[#1A5F7A] text-white px-6 py-4 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Plus className="h-5 w-5" />
                <h3 className="font-bold font-display text-base text-white">Agendar Nueva Cita</h3>
              </div>
              <button 
                onClick={() => setIsAddModalOpen(false)}
                className="text-white/80 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleAddAppointment} className="p-6 space-y-4">
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 text-xs text-slate-600 space-y-1">
                <p><span className="font-bold text-slate-700">Fecha:</span> {dayjs(selectedSlot.date).format('dddd, D [de] MMMM YYYY')}</p>
                <p><span className="font-bold text-slate-700">Bloque de inicio:</span> {selectedSlot.time} hrs</p>
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                  RUT Paciente
                </label>
                <input
                  type="text"
                  required
                  placeholder="12.345.678-9"
                  value={newPatientRut}
                  onChange={(e) => setNewPatientRut(e.target.value)}
                  className="block w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#1A5F7A] focus:border-[#1A5F7A] transition-all bg-slate-50/50 focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                  Nombre Completo Paciente
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej: Pedro Urdemales"
                  value={newPatientName}
                  onChange={(e) => setNewPatientName(e.target.value)}
                  className="block w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#1A5F7A] focus:border-[#1A5F7A] transition-all bg-slate-50/50 focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                  Médico Especialista
                </label>
                <select
                  value={newProfessional}
                  onChange={(e) => setNewProfessional(e.target.value)}
                  className="block w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#1A5F7A] focus:border-[#1A5F7A] transition-all bg-white"
                >
                  <option value="Dra. Eloísa Díaz">Dra. Eloísa Díaz (Pediatría)</option>
                  <option value="Dr. Alejandro del Río">Dr. Alejandro del Río (Medicina General)</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                  Valor Consulta ($)
                </label>
                <input
                  type="number"
                  required
                  value={newPrice}
                  onChange={(e) => setNewPrice(e.target.value)}
                  className="block w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#1A5F7A] focus:border-[#1A5F7A] transition-all bg-slate-50/50 focus:bg-white"
                />
              </div>

              <div className="pt-4 flex items-center space-x-3 justify-end border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2.5 border border-slate-200 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-all focus:outline-none"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2.5 bg-[#E88D4D] hover:bg-[#E88D4D]/95 text-white text-xs font-semibold rounded-xl transition-all focus:outline-none shadow-sm"
                >
                  Guardar Cita
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: ACCIONES CITA EXISTENTE */}
      {isEditModalOpen && selectedAppointment && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-slate-100 overflow-hidden">
            <div className="bg-[#1A5F7A] text-white px-6 py-4 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <FileText className="h-5 w-5" />
                <h3 className="font-bold font-display text-base text-white">Detalle de la Cita</h3>
              </div>
              <button 
                onClick={() => setIsEditModalOpen(false)}
                className="text-white/80 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              <div className="space-y-3">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-slate-50 rounded-lg text-[#7F9C7A]">
                    <User className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-800">{selectedAppointment.patient}</h4>
                    <p className="text-[10px] text-slate-400 font-medium">RUT: {selectedAppointment.rut}</p>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-slate-50 rounded-lg text-[#1A5F7A]">
                    <UserCheck className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-slate-700">{selectedAppointment.professional}</p>
                    <p className="text-[10px] text-slate-400 font-medium">Médico Tratante</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-100">
                  <div>
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Horario</span>
                    <span className="text-xs font-bold text-slate-700">{selectedAppointment.time}</span>
                  </div>
                  <div>
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Fecha</span>
                    <span className="text-xs font-bold text-slate-700">{dayjs(selectedAppointment.date).format('DD/MM/YYYY')}</span>
                  </div>
                  <div className="mt-2">
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Valor</span>
                    <span className="text-xs font-bold text-slate-700">${selectedAppointment.price.toLocaleString('es-CL')}</span>
                  </div>
                  <div className="mt-2">
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Estado Actual</span>
                    <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold uppercase mt-0.5 ${
                      selectedAppointment.status === 'pendiente' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                      selectedAppointment.status === 'confirmado' ? 'bg-emerald-50 text-[#1A5F7A] border border-[#7F9C7A]/40' :
                      selectedAppointment.status === 'pagada' ? 'bg-slate-100 text-slate-500 border border-slate-200' :
                      'bg-red-50 text-red-700 border border-red-200'
                    }`}>
                      {selectedAppointment.status}
                    </span>
                  </div>
                </div>
              </div>

              <div className="space-y-2.5 pt-4 border-t border-slate-100">
                <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Acciones Disponibles
                </span>
                
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => updateAppointmentStatus('confirmado')}
                    disabled={selectedAppointment.status === 'confirmado'}
                    className="flex items-center justify-center space-x-1.5 px-3 py-2.5 bg-emerald-50 border border-emerald-200 hover:bg-emerald-100 text-emerald-800 disabled:opacity-40 disabled:cursor-not-allowed font-semibold text-xs rounded-xl transition-all"
                  >
                    <CheckCircle className="h-4 w-4" />
                    <span>Confirmar Cita</span>
                  </button>

                  <button
                    onClick={() => updateAppointmentStatus('pagada')}
                    disabled={selectedAppointment.status === 'pagada'}
                    className="flex items-center justify-center space-x-1.5 px-3 py-2.5 bg-slate-50 border border-slate-200 hover:bg-slate-100 text-slate-700 disabled:opacity-40 disabled:cursor-not-allowed font-semibold text-xs rounded-xl transition-all"
                  >
                    <DollarSign className="h-4 w-4" />
                    <span>Registrar Pago</span>
                  </button>

                  <button
                    onClick={() => updateAppointmentStatus('pendiente')}
                    disabled={selectedAppointment.status === 'pendiente'}
                    className="flex items-center justify-center space-x-1.5 px-3 py-2.5 bg-amber-50 border border-amber-200 hover:bg-amber-100 text-amber-800 disabled:opacity-40 disabled:cursor-not-allowed font-semibold text-xs rounded-xl transition-all"
                  >
                    <Clock className="h-4 w-4" />
                    <span>Pendiente</span>
                  </button>

                  <button
                    onClick={() => updateAppointmentStatus('cancelada')}
                    disabled={selectedAppointment.status === 'cancelada'}
                    className="flex items-center justify-center space-x-1.5 px-3 py-2.5 bg-red-50 border border-red-200 hover:bg-red-100 text-red-800 disabled:opacity-40 disabled:cursor-not-allowed font-semibold text-xs rounded-xl transition-all"
                  >
                    <Ban className="h-4 w-4" />
                    <span>Cancelar Cita</span>
                  </button>
                </div>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-semibold text-slate-500 hover:bg-slate-50 transition-all focus:outline-none"
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
