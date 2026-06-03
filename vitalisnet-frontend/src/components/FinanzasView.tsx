import React, { useState } from 'react';
import { 
  TrendingUp, 
  DollarSign, 
  CreditCard, 
  Filter, 
  Clock, 
  CheckCircle, 
  X, 
  User, 
  ArrowUpRight, 
  Receipt
} from 'lucide-react';
import dayjs from 'dayjs';
import isBetween from 'dayjs/plugin/isBetween';

// Cargar plugin de dayjs para comparar rangos
dayjs.extend(isBetween);

export interface Transaction {
  id: number;
  date: string; // ISO string o formato YYYY-MM-DD
  patient: string;
  professional: string;
  price: number;
  method: 'Efectivo' | 'Transferencia' | 'Transbank' | '—';
  status: 'pagada' | 'pendiente';
}

const INITIAL_TRANSACTIONS: Transaction[] = [
  { id: 1, date: dayjs().format('YYYY-MM-DD'), patient: 'Pedro Urdemales', professional: 'Dra. Eloísa Díaz', price: 60000, method: 'Efectivo', status: 'pagada' },
  { id: 2, date: dayjs().format('YYYY-MM-DD'), patient: 'María Loreto', professional: 'Dr. Alejandro del Río', price: 45000, method: '—', status: 'pendiente' },
  { id: 3, date: dayjs().subtract(1, 'day').format('YYYY-MM-DD'), patient: 'Juan González', professional: 'Dra. Eloísa Díaz', price: 60000, method: 'Transferencia', status: 'pagada' },
  { id: 4, date: dayjs().subtract(2, 'day').format('YYYY-MM-DD'), patient: 'Catalina Muñoz', professional: 'Dr. Alejandro del Río', price: 45000, method: '—', status: 'pendiente' },
  { id: 5, date: dayjs().subtract(3, 'day').format('YYYY-MM-DD'), patient: 'Andrés Bello', professional: 'Dra. Eloísa Díaz', price: 60000, method: 'Transbank', status: 'pagada' },
  { id: 6, date: dayjs().subtract(4, 'day').format('YYYY-MM-DD'), patient: 'Francisca Ovalle', professional: 'Dr. Alejandro del Río', price: 45000, method: 'Transferencia', status: 'pagada' },
  { id: 7, date: dayjs().subtract(5, 'day').format('YYYY-MM-DD'), patient: 'José Miguel Carrera', professional: 'Dra. Eloísa Díaz', price: 60000, method: '—', status: 'pendiente' },
  { id: 8, date: dayjs().subtract(10, 'day').format('YYYY-MM-DD'), patient: 'Gabriela Mistral', professional: 'Dr. Alejandro del Río', price: 45000, method: 'Transbank', status: 'pagada' },
  { id: 9, date: dayjs().subtract(15, 'day').format('YYYY-MM-DD'), patient: 'Bernardo O\'Higgins', professional: 'Dra. Eloísa Díaz', price: 60000, method: 'Efectivo', status: 'pagada' },
];

export const FinanzasView: React.FC = () => {
  const [transactions, setTransactions] = useState<Transaction[]>(INITIAL_TRANSACTIONS);
  const [selectedProfessional, setSelectedProfessional] = useState<string>('Todos');
  const [selectedRange, setSelectedRange] = useState<'Hoy' | 'Semana' | 'Mes'>('Mes');
  
  // Modal de cobro
  const [isCobrarModalOpen, setIsCobrarModalOpen] = useState(false);
  const [transactionToCobrar, setTransactionToCobrar] = useState<Transaction | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<'Efectivo' | 'Transferencia' | 'Transbank'>('Transbank');

  // Filtrado de Transacciones
  const filteredTransactions = transactions.filter(t => {
    // 1. Filtro por Profesional
    if (selectedProfessional !== 'Todos' && t.professional !== selectedProfessional) {
      return false;
    }

    // 2. Filtro por Rango Temporal
    const transactionDate = dayjs(t.date);
    const today = dayjs();
    
    if (selectedRange === 'Hoy') {
      return transactionDate.isSame(today, 'day');
    } else if (selectedRange === 'Semana') {
      const startOfWeek = today.startOf('week');
      const endOfWeek = today.endOf('week');
      return transactionDate.isBetween(startOfWeek, endOfWeek, 'day', '[]');
    } else if (selectedRange === 'Mes') {
      return transactionDate.isSame(today, 'month') && transactionDate.isSame(today, 'year');
    }

    return true;
  });

  // Cálculos de KPI (Solo se suman las transacciones cobradas / "pagada")
  const totalIngresos = filteredTransactions
    .filter(t => t.status === 'pagada')
    .reduce((sum, t) => sum + t.price, 0);

  const comisionProfesional = Math.round(totalIngresos * 0.70);
  const ingresosCentro = Math.round(totalIngresos * 0.30);

  const handleOpenCobrarModal = (t: Transaction) => {
    setTransactionToCobrar(t);
    setIsCobrarModalOpen(true);
  };

  const handleProcessPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!transactionToCobrar) return;

    setTransactions(prev => 
      prev.map(t => 
        t.id === transactionToCobrar.id 
          ? { ...t, status: 'pagada', method: paymentMethod } 
          : t
      )
    );

    setIsCobrarModalOpen(false);
    setTransactionToCobrar(null);
  };

  return (
    <div className="space-y-6">
      
      {/* 1. INDICADORES DE RENDIMIENTO (KPI CARDS) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* CARD 1: INGRESOS TOTALES */}
        <div className="bg-[#1A5F7A] text-white p-6 rounded-2xl shadow-md border border-[#1A5F7A]/80 flex flex-col justify-between relative overflow-hidden group">
          <div className="absolute right-4 top-4 text-white/10 group-hover:scale-110 transition-transform">
            <DollarSign className="h-16 w-16" />
          </div>
          <div>
            <span className="text-[10px] text-white/70 font-bold uppercase tracking-wider block">
              Ingresos Totales Recaudados
            </span>
            <h3 className="text-3xl font-bold font-display text-white mt-1.5">
              ${totalIngresos.toLocaleString('es-CL')}
            </h3>
          </div>
          <div className="mt-6 flex items-center text-xs text-emerald-200 font-semibold space-x-1">
            <TrendingUp className="h-4 w-4" />
            <span>Flujo de Caja Realizado</span>
          </div>
        </div>

        {/* CARD 2: COMISIÓN PROFESIONAL (70%) */}
        <div className="bg-[#F4F6F8] p-6 rounded-2xl border border-slate-200 flex flex-col justify-between relative overflow-hidden group">
          <div className="absolute right-4 top-4 text-[#1A5F7A]/5 group-hover:scale-110 transition-transform">
            <User className="h-16 w-16" />
          </div>
          <div>
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
              Comisión Profesional (70%)
            </span>
            <h3 className="text-3xl font-bold font-display text-[#1A5F7A] mt-1.5">
              ${comisionProfesional.toLocaleString('es-CL')}
            </h3>
          </div>
          <div className="mt-6 flex items-center text-xs text-slate-500 font-medium">
            <span>Monto total acumulado para médicos</span>
          </div>
        </div>

        {/* CARD 3: INGRESOS CENTRO (30%) */}
        <div className="bg-[#F4F6F8] p-6 rounded-2xl border border-[#7F9C7A]/40 flex flex-col justify-between relative overflow-hidden group">
          <div className="absolute right-4 top-4 text-[#7F9C7A]/10 group-hover:scale-110 transition-transform">
            <ArrowUpRight className="h-16 w-16" />
          </div>
          <div>
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
              Ingresos del Centro Médico (30%)
            </span>
            <h3 className="text-3xl font-bold font-display text-[#1E293B] mt-1.5">
              ${ingresosCentro.toLocaleString('es-CL')}
            </h3>
          </div>
          <div className="mt-6 flex items-center text-xs text-[#7F9C7A] font-semibold">
            <span>Retención administrativa VitalisNet</span>
          </div>
        </div>

      </div>

      {/* 2. FILTROS DE REPORTE */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center space-x-2 text-slate-500 text-xs font-bold uppercase tracking-wider">
          <Filter className="h-4 w-4 text-[#7F9C7A]" />
          <span>Filtros de Reporte</span>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
          {/* Filtro Profesional */}
          <div className="w-full sm:w-auto">
            <select
              value={selectedProfessional}
              onChange={(e) => setSelectedProfessional(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs bg-white text-slate-700 font-semibold focus:outline-none focus:ring-2 focus:ring-[#1A5F7A] transition-all"
            >
              <option value="Todos">Todos los Profesionales</option>
              <option value="Dra. Eloísa Díaz">Dra. Eloísa Díaz</option>
              <option value="Dr. Alejandro del Río">Dr. Alejandro del Río</option>
            </select>
          </div>

          {/* Filtro Rango de Fechas */}
          <div className="flex border border-slate-200 rounded-xl overflow-hidden p-0.5 bg-slate-50 w-full sm:w-auto justify-between">
            {(['Hoy', 'Semana', 'Mes'] as const).map(range => (
              <button
                key={range}
                onClick={() => setSelectedRange(range)}
                className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  selectedRange === range
                    ? 'bg-[#1A5F7A] text-white shadow-sm'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                {range === 'Semana' ? 'Esta Semana' : range === 'Mes' ? 'Este Mes' : 'Hoy'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 3. CONTROL DE CAJA Y TRANSACCIONES */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden flex flex-col">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-[#1E293B] font-display">Control de Caja y Flujo diario</h2>
            <p className="text-xs text-slate-400 font-medium">Historial consolidado de cobros y estados de pago</p>
          </div>
          <div className="text-xs bg-[#1A5F7A]/5 text-[#1A5F7A] font-bold px-3 py-1 rounded-full border border-[#1A5F7A]/10">
            {filteredTransactions.length} transacciones registradas
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-400 text-[10px] font-bold uppercase tracking-wider border-b border-slate-100">
                <th className="py-4 px-6">Fecha</th>
                <th className="py-4 px-6">Paciente</th>
                <th className="py-4 px-6">Profesional</th>
                <th className="py-4 px-6">Medio de Pago</th>
                <th className="py-4 px-6 text-right">Valor</th>
                <th className="py-4 px-6 text-center">Estado</th>
                <th className="py-4 px-6 text-right">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-600 font-medium">
              {filteredTransactions.length > 0 ? (
                filteredTransactions.map(trans => (
                  <tr key={trans.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-4 px-6 text-xs text-slate-500 font-mono">
                      {dayjs(trans.date).format('DD/MM/YYYY')}
                    </td>
                    <td className="py-4 px-6 text-[#1E293B] font-semibold">
                      {trans.patient}
                    </td>
                    <td className="py-4 px-6 text-slate-500">
                      {trans.professional}
                    </td>
                    <td className="py-4 px-6">
                      {trans.status === 'pagada' ? (
                        <span className="inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-lg bg-slate-100 text-slate-600 text-xs font-semibold border border-slate-200">
                          <CreditCard className="h-3.5 w-3.5" />
                          <span>{trans.method}</span>
                        </span>
                      ) : (
                        <span className="text-slate-450 italic text-xs font-normal">Sin registrar</span>
                      )}
                    </td>
                    <td className="py-4 px-6 text-right font-bold text-[#1E293B]">
                      ${trans.price.toLocaleString('es-CL')}
                    </td>
                    <td className="py-4 px-6 text-center">
                      <span className={`inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                        trans.status === 'pagada' 
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                          : 'bg-amber-50 text-amber-700 border border-amber-200 animate-pulse'
                      }`}>
                        {trans.status === 'pagada' ? (
                          <>
                            <CheckCircle className="h-3 w-3 mr-0.5" />
                            <span>Cobrada</span>
                          </>
                        ) : (
                          <>
                            <Clock className="h-3 w-3 mr-0.5" />
                            <span>Pendiente</span>
                          </>
                        )}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-right">
                      {trans.status === 'pendiente' ? (
                        <button
                          onClick={() => handleOpenCobrarModal(trans)}
                          className="px-3.5 py-1.5 bg-[#E88D4D] hover:bg-[#E88D4D]/95 text-white font-semibold text-xs rounded-lg transition-all shadow-sm focus:outline-none"
                        >
                          Cobrar
                        </button>
                      ) : (
                        <span className="text-xs text-slate-400 font-semibold flex items-center justify-end">
                          Listo
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <Receipt className="h-10 w-10 mx-auto mb-2 text-slate-300" />
                    <p className="text-xs font-semibold">No se encontraron transacciones en este periodo</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL: PROCESAR COBRO */}
      {isCobrarModalOpen && transactionToCobrar && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-slate-100 overflow-hidden">
            <div className="bg-[#1A5F7A] text-white px-6 py-4 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Receipt className="h-5 w-5" />
                <h3 className="font-bold font-display text-base text-white">Procesar Cobro de Consulta</h3>
              </div>
              <button 
                onClick={() => setIsCobrarModalOpen(false)}
                className="text-white/80 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleProcessPayment} className="p-6 space-y-5">
              
              {/* Resumen de cobro */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-400 font-semibold">Paciente:</span>
                  <span className="text-slate-800 font-bold">{transactionToCobrar.patient}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-slate-400 font-semibold">Profesional:</span>
                  <span className="text-slate-800 font-semibold">{transactionToCobrar.professional}</span>
                </div>
                <div className="border-t border-slate-200/60 pt-2 flex justify-between items-center">
                  <span className="text-xs text-slate-500 font-bold uppercase">Monto a Cobrar:</span>
                  <span className="text-lg font-bold text-[#1A5F7A]">${transactionToCobrar.price.toLocaleString('es-CL')}</span>
                </div>
              </div>

              {/* Selector de Medio de Pago */}
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-2">
                  Selecciona Medio de Pago
                </label>

                <div className="grid grid-cols-3 gap-2">
                  {([
                    { value: 'Transbank', label: 'Transbank' },
                    { value: 'Transferencia', label: 'Transferencia' },
                    { value: 'Efectivo', label: 'Efectivo' }
                  ] as const).map(option => {
                    const isSelected = paymentMethod === option.value;
                    return (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => setPaymentMethod(option.value)}
                        className={`p-3 border rounded-xl flex flex-col items-center justify-center space-y-1.5 transition-all text-center focus:outline-none ${
                          isSelected 
                            ? 'border-[#1A5F7A] bg-[#1A5F7A]/5 text-[#1A5F7A] font-bold shadow-sm' 
                            : 'border-slate-200 hover:bg-slate-50 text-slate-600 font-medium'
                        }`}
                      >
                        <CreditCard className="h-4 w-4" />
                        <span className="text-[10px]">{option.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Acciones */}
              <div className="pt-4 flex items-center space-x-3 justify-end border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsCobrarModalOpen(false)}
                  className="px-4 py-2.5 border border-slate-200 rounded-xl text-xs font-semibold text-slate-650 hover:bg-slate-50 transition-all focus:outline-none"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-[#E88D4D] hover:bg-[#E88D4D]/95 text-white text-xs font-bold rounded-xl transition-all focus:outline-none shadow-sm shadow-[#E88D4D]/25"
                >
                  Registrar Pago
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
};
