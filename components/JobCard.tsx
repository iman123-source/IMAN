
import React, { useMemo, useState } from 'react';
import { Job, JobStatus, WorkStatus, SystemStatus, MaterialPayment, LabourEntry, Operative } from '../types';
import { STATUS_MAP, OPERATIVES } from '../constants';
import { Trash2, Activity, Wallet, Calendar, ArrowRight, MessageSquare, ChevronDown, Zap, Wind, Flame, Biohazard, Clock, AlertTriangle, Timer, PoundSterling, Package, HardHat, Plus, History, X, ChevronUp, CalendarDays, UserPlus, Users, Watch } from 'lucide-react';

interface JobCardProps {
  job: Job;
  onChange: (updates: Partial<Job>) => void;
  onRemove: () => void;
}

const formatCurrency = (val: number) => {
  return new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: 'GBP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(val);
};

const getJobStatus = (margin: number): JobStatus => {
  if (margin >= 80) return JobStatus.AMAZING;
  if (margin >= 50) return JobStatus.STABLE;
  if (margin >= 30) return JobStatus.ATTENTION;
  return JobStatus.CRITICAL;
};

const WORK_STATUS_THEMES: Record<WorkStatus, string> = {
  [WorkStatus.WIP]: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
  [WorkStatus.DELAYED]: 'bg-red-500/20 text-red-500 border-red-500/30',
  [WorkStatus.COMPLETED]: 'bg-[#7CFF00]/20 text-[#7CFF00] border-[#7CFF00]/30',
};

const SYSTEM_FIELDS_CONFIG: { field: keyof Job; label: string }[] = [
  { field: 'windows', label: 'window' },
  { field: 'gas', label: 'gas' },
  { field: 'electrics', label: 'electricity' },
  { field: 'asbestos', label: 'asbestos' }
];

const JobCard: React.FC<JobCardProps> = ({ job, onChange, onRemove }) => {
  const [isLedgerOpen, setIsLedgerOpen] = useState(false);
  const [isLabourLedgerOpen, setIsLabourLedgerOpen] = useState(false);
  
  // Material ledger state
  const [newAmount, setNewAmount] = useState('');
  const [newNote, setNewNote] = useState('');
  const [newPaymentDate, setNewPaymentDate] = useState(new Date().toISOString().split('T')[0]);

  // Labour ledger state
  const [selectedOpId, setSelectedOpId] = useState('');
  const [labourDate, setLabourDate] = useState(new Date().toISOString().split('T')[0]);
  const [labourHours, setLabourHours] = useState('8');

  const totalValue = job.total || 0;
  
  // Financial consistency logic: prioritize ledger data, ensuring it starts at 0
  const materialCost = useMemo(() => {
    const hasLedger = job.materialPayments && job.materialPayments.length > 0;
    return hasLedger 
      ? job.materialPayments!.reduce((sum, p) => sum + p.amount, 0)
      : (job.material || 0);
  }, [job.materialPayments, job.material]);

  const labourCost = useMemo(() => {
    const hasLedger = job.labourEntries && job.labourEntries.length > 0;
    return hasLedger
      ? job.labourEntries!.reduce((sum, e) => sum + e.amount, 0)
      : (job.labour || 0);
  }, [job.labourEntries, job.labour]);

  const totalCosts = materialCost + labourCost;
  const profit = totalValue - totalCosts;
  const margin = totalValue > 0 ? (profit / totalValue) * 100 : 0;
  const absorption = totalValue > 0 ? (totalCosts / totalValue) * 100 : 0;
  
  const status = getJobStatus(margin);
  const theme = STATUS_MAP[status];

  const scheduleMetrics = useMemo(() => {
    if (!job.startDate || !job.targetDate) return { expected: 0, daysIn: 0, daysLeft: 0, isOverdue: false };
    const start = new Date(job.startDate);
    const target = new Date(job.targetDate);
    const now = new Date();
    now.setHours(0,0,0,0);
    const oneDay = 24 * 60 * 60 * 1000;
    const totalDuration = target.getTime() - start.getTime();
    const daysIn = Math.max(0, Math.floor((now.getTime() - start.getTime()) / oneDay));
    const daysLeft = Math.max(0, Math.ceil((target.getTime() - now.getTime()) / oneDay));
    let expected = 0;
    if (totalDuration > 0) expected = Math.min(100, Math.max(0, ((now.getTime() - start.getTime()) / totalDuration) * 100));
    return { expected: Math.round(expected), daysIn, daysLeft, isOverdue: now.getTime() > target.getTime() };
  }, [job.startDate, job.targetDate]);

  const isOverdue = scheduleMetrics.isOverdue && job.status !== WorkStatus.COMPLETED;

  const handleNumericChange = (field: keyof Job, value: string) => {
    const cleanValue = value.replace(/[^0-9.]/g, '');
    const parts = cleanValue.split('.');
    const finalValue = parts.length > 2 ? `${parts[0]}.${parts.slice(1).join('')}` : cleanValue;
    onChange({ [field]: finalValue === '' ? 0 : Number(finalValue) });
  };

  const addMaterialPayment = () => {
    const amountNum = parseFloat(newAmount.replace(/[^0-9.]/g, '')) || 0;
    if (amountNum <= 0) return;
    const newPayment: MaterialPayment = {
      id: Math.random().toString(36).substring(7),
      amount: amountNum,
      date: newPaymentDate,
      note: newNote || 'Materials'
    };
    const currentPayments = job.materialPayments || [];
    const updated = [...currentPayments, newPayment];
    onChange({ materialPayments: updated, material: updated.reduce((s, p) => s + p.amount, 0) });
    setNewAmount(''); setNewNote('');
  };

  const removeMaterialPayment = (paymentId: string) => {
    const currentPayments = job.materialPayments || [];
    const updated = currentPayments.filter(p => p.id !== paymentId);
    onChange({ 
      materialPayments: updated,
      material: updated.length > 0 ? updated.reduce((s, p) => s + p.amount, 0) : 0
    });
  };

  const addLabourEntry = () => {
    if (!selectedOpId) return;
    const op = OPERATIVES.find(o => o.id === selectedOpId);
    if (!op) return;
    
    const hours = parseFloat(labourHours) || 0;
    if (hours <= 0) return;

    const hourlyRate = op.dayRate / 8;
    const calculatedAmount = Math.round(hourlyRate * hours * 100) / 100;

    const newEntry: LabourEntry = {
      id: Math.random().toString(36).substring(7),
      operativeId: op.id,
      operativeName: op.name,
      date: labourDate,
      hours: hours,
      hourlyRate: hourlyRate,
      amount: calculatedAmount
    };
    
    const currentEntries = job.labourEntries || [];
    const updated = [...currentEntries, newEntry];
    onChange({ labourEntries: updated, labour: updated.reduce((s, e) => s + e.amount, 0) });
  };

  const removeLabourEntry = (id: string) => {
    const currentEntries = job.labourEntries || [];
    const updated = currentEntries.filter(e => e.id !== id);
    onChange({ 
      labourEntries: updated, 
      labour: updated.length > 0 ? updated.reduce((s, e) => s + e.amount, 0) : 0 
    });
  };

  const cycleSystemStatus = (field: keyof Job) => {
    const current = (job[field] as SystemStatus) || 'incomplete';
    const next: SystemStatus = current === 'incomplete' ? 'complete' : current === 'complete' ? 'na' : 'incomplete';
    onChange({ [field]: next });
  };

  const getSystemStyle = (status: SystemStatus = 'incomplete') => {
    switch (status) {
      case 'complete': return 'bg-[#7CFF00] text-black border-[#7CFF00]/20 font-black';
      case 'na': return 'bg-[#FF1493] text-white border-[#FF1493]/20 font-black';
      default: return 'bg-red-500/5 text-red-500/60 border-red-500/20';
    }
  };

  return (
    <div className={`group relative bg-[#0b0e12] border border-white/[0.04] hover:border-[#7CFF00]/30 rounded-[24px] md:rounded-[32px] p-4 md:p-6 lg:p-10 transition-all duration-700 shadow-2xl hover:shadow-[#7CFF00]/5 overflow-hidden ${isOverdue ? 'ring-1 ring-red-500/20' : ''}`}>
      {isOverdue && <div className="absolute top-0 left-0 w-full h-1 bg-red-600 animate-pulse z-20"></div>}

      <div className="flex flex-col xl:flex-row gap-4 md:gap-8 relative z-10">
        <div className="flex-1 space-y-3 md:space-y-4">
          <div className="flex items-center gap-3 md:gap-4">
            <div className={`w-10 h-10 md:w-12 md:h-12 rounded-xl md:rounded-2xl flex items-center justify-center border ${isOverdue ? 'bg-red-500/10 border-red-500/40 text-red-500' : 'bg-[#7CFF00]/10 border-[#7CFF00]/20 text-[#7CFF00]'}`}>
              {isOverdue ? <AlertTriangle size={20} className="animate-pulse" /> : <Zap size={20} />}
            </div>
            <div className="flex-1">
              <input className="bg-transparent border-none text-xl lg:text-3xl font-black text-white outline-none w-full uppercase italic tracking-tighter" value={job.name} onChange={(e) => onChange({ name: e.target.value })} placeholder="PROPERTY..." />
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 md:gap-3">
            <div className="relative">
              <select value={job.status || WorkStatus.WIP} onChange={(e) => onChange({ status: e.target.value as WorkStatus })} className={`appearance-none cursor-pointer pl-3 md:pl-4 pr-8 md:pr-10 py-1.5 rounded-xl border text-[8px] md:text-[10px] font-black uppercase tracking-widest outline-none transition-all ${WORK_STATUS_THEMES[job.status || WorkStatus.WIP]}`}>
                {Object.values(WorkStatus).map(s => <option key={s} value={s} className="bg-black text-white">{s}</option>)}
              </select>
              <ChevronDown size={12} className="absolute right-2.5 top-1/2 -translate-y-1/2 opacity-40 pointer-events-none" />
            </div>
            
            <div className="bg-white/5 border border-white/10 px-3 py-1 rounded-xl flex items-center gap-2 md:gap-3">
              <div className="flex items-center gap-1.5 md:gap-2">
                <Calendar size={11} className="text-white/30" />
                <input type="date" className="bg-transparent text-[8px] font-bold text-white/50 outline-none [color-scheme:dark]" value={job.startDate} onChange={(e) => onChange({ startDate: e.target.value })} />
              </div>
              <ArrowRight size={8} className="text-white/20" />
              <div className="flex items-center gap-1.5 md:gap-2">
                <input type="date" className={`bg-transparent text-[8px] font-bold outline-none [color-scheme:dark] ${isOverdue ? 'text-red-500' : 'text-[#7CFF00]'}`} value={job.targetDate} onChange={(e) => onChange({ targetDate: e.target.value })} />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-1.5 md:gap-2 mt-2 md:mt-4">
             <div className="bg-white/5 p-2 md:p-2.5 rounded-xl md:rounded-2xl border border-white/5">
                <label className="text-[6px] md:text-[7px] font-black text-white/20 uppercase tracking-widest flex items-center gap-1.5 mb-0.5 md:mb-1"><PoundSterling size={8} className="text-[#7CFF00]" /> Contract</label>
                <input 
                  type="number" 
                  step="any"
                  value={job.total || ''} 
                  onChange={(e) => onChange({ total: parseFloat(e.target.value) || 0 })} 
                  placeholder="0" 
                  className="bg-transparent border-none text-xs md:text-sm font-black text-white font-mono focus:ring-0 outline-none w-full p-0" 
                />
             </div>
             
             <button onClick={() => { setIsLedgerOpen(!isLedgerOpen); setIsLabourLedgerOpen(false); }} className={`bg-white/5 p-2 md:p-2.5 rounded-xl md:rounded-2xl border transition-all text-left ${isLedgerOpen ? 'border-blue-500/50 bg-blue-500/5' : 'border-white/5 hover:border-blue-500/30'}`}>
                <label className="text-[6px] md:text-[7px] font-black text-white/20 uppercase tracking-widest flex items-center justify-between mb-0.5 md:mb-1"><span className="flex items-center gap-1"><Package size={8} className="text-blue-400" /> Materials</span></label>
                <div className="text-xs md:text-sm font-black text-white font-mono flex items-center justify-between"><span>{formatCurrency(materialCost)}</span><ChevronDown size={10} className={isLedgerOpen ? 'rotate-180' : ''} /></div>
             </button>

             <button onClick={() => { setIsLabourLedgerOpen(!isLabourLedgerOpen); setIsLedgerOpen(false); }} className={`bg-white/5 p-2 md:p-2.5 rounded-xl md:rounded-2xl border transition-all text-left ${isLabourLedgerOpen ? 'border-orange-500/50 bg-orange-500/5' : 'border-white/5 hover:border-orange-500/30'}`}>
                <label className="text-[6px] md:text-[7px] font-black text-white/20 uppercase tracking-widest flex items-center justify-between mb-0.5 md:mb-1"><span className="flex items-center gap-1"><Users size={8} className="text-orange-400" /> Labour</span></label>
                <div className="text-xs md:text-sm font-black text-white font-mono flex items-center justify-between"><span>{formatCurrency(labourCost)}</span><ChevronDown size={10} className={isLabourLedgerOpen ? 'rotate-180' : ''} /></div>
             </button>
          </div>
        </div>

        <div className="flex-[2.2] space-y-4 md:space-y-5">
          {/* Material Ledger */}
          {isLedgerOpen && (
            <div className="bg-blue-500/[0.03] border border-blue-500/10 rounded-[20px] p-3 md:p-5 space-y-3 animate-in slide-in-from-top-2">
               <div className="flex items-center justify-between px-1"><h4 className="text-[8px] font-black text-blue-400 uppercase tracking-[0.2em] flex items-center gap-2"><Package size={12} /> Material Ledger</h4></div>
               <div className="flex flex-col gap-1.5 bg-black/40 p-1.5 rounded-xl border border-white/5">
                  <div className="flex gap-1.5">
                    <input type="text" placeholder="Amount" value={newAmount} onChange={(e) => setNewAmount(e.target.value.replace(/[^0-9.]/g, ''))} className="bg-transparent border-none flex-1 text-[10px] font-mono font-bold text-white outline-none" />
                    <input type="date" value={newPaymentDate} onChange={(e) => setNewPaymentDate(e.target.value)} className="bg-transparent border-none flex-1 text-[8px] font-bold text-white/60 [color-scheme:dark]" />
                  </div>
                  <div className="flex gap-1.5">
                    <input type="text" placeholder="Note" value={newNote} onChange={(e) => setNewNote(e.target.value)} className="bg-transparent border-none flex-1 text-[8px] font-bold text-white/60" />
                    <button onClick={addMaterialPayment} className="bg-blue-500 text-black p-1 rounded-lg"><Plus size={14} strokeWidth={3} /></button>
                  </div>
               </div>
               <div className="max-h-24 overflow-y-auto space-y-1 custom-scrollbar">
                  {(job.materialPayments || []).map(p => (
                    <div key={p.id} className="group/item flex items-center justify-between bg-white/[0.02] p-2 rounded-lg border border-white/5 transition-all">
                      <div className="flex items-center gap-2">
                        <span className="text-blue-400 font-mono font-bold text-[8px]">{formatCurrency(p.amount)}</span>
                        <span className="text-white/40 text-[8px] max-w-[80px] truncate">{p.note}</span>
                      </div>
                      <button onClick={() => removeMaterialPayment(p.id)} className="p-0.5 rounded bg-red-500/5 text-red-500/20 hover:text-red-500 opacity-100 md:opacity-0 group-hover/item:opacity-100 transition-all">
                        <X size={10} />
                      </button>
                    </div>
                  ))}
                  {(job.materialPayments || []).length === 0 && <p className="text-[7px] text-white/10 italic text-center py-2 uppercase tracking-widest">No entries recorded</p>}
               </div>
            </div>
          )}

          {/* Labour Ledger */}
          {isLabourLedgerOpen && (
            <div className="bg-orange-500/[0.03] border border-orange-500/10 rounded-[20px] p-3 md:p-5 space-y-3 animate-in slide-in-from-top-2">
               <div className="flex items-center justify-between px-1"><h4 className="text-[8px] font-black text-orange-400 uppercase tracking-[0.2em] flex items-center gap-2"><Users size={12} /> Labour</h4></div>
               <div className="flex flex-col gap-1.5 bg-black/40 p-1.5 rounded-xl border border-white/5">
                  <select value={selectedOpId} onChange={(e) => setSelectedOpId(e.target.value)} className="bg-transparent border-none flex-1 text-[9px] font-bold text-white outline-none appearance-none">
                    <option value="" className="bg-black">Select Op</option>
                    {OPERATIVES.map(op => <option key={op.id} value={op.id} className="bg-black">{op.name}</option>)}
                  </select>
                  <div className="flex gap-1.5">
                    <div className="flex items-center bg-white/5 rounded-lg px-2 border border-white/5 flex-1">
                      <Watch size={10} className="text-white/20 mr-1" />
                      <input type="number" step="any" value={labourHours} onChange={(e) => setLabourHours(e.target.value)} className="bg-transparent border-none w-8 text-[9px] font-bold text-white outline-none" />
                    </div>
                    <input type="date" value={labourDate} onChange={(e) => setLabourDate(e.target.value)} className="bg-transparent border-none flex-1 text-[8px] font-bold text-white/60 [color-scheme:dark]" />
                    <button onClick={addLabourEntry} className="bg-orange-500 text-black p-1 rounded-lg"><UserPlus size={12} /></button>
                  </div>
               </div>
               <div className="max-h-24 overflow-y-auto space-y-1 custom-scrollbar">
                  {(job.labourEntries || []).map(e => (
                    <div key={e.id} className="group/item flex items-center justify-between bg-white/[0.02] p-2 rounded-lg border border-white/5 transition-all">
                      <div className="flex items-center gap-2">
                        <span className="text-orange-400 font-black text-[8px] w-14 truncate">{e.operativeName}</span>
                        <span className="text-white/20 text-[7px] font-mono">{e.hours}h</span>
                        <span className="text-white/40 text-[8px] font-black ml-1">{formatCurrency(e.amount)}</span>
                      </div>
                      <button onClick={() => removeLabourEntry(e.id)} className="p-0.5 rounded bg-red-500/5 text-red-500/20 hover:text-red-500 opacity-100 md:opacity-0 group-hover/item:opacity-100 transition-all"><X size={10} /></button>
                    </div>
                  ))}
                  {(job.labourEntries || []).length === 0 && <p className="text-[7px] text-white/10 italic text-center py-2 uppercase tracking-widest">No entries recorded</p>}
               </div>
            </div>
          )}

          <div className="space-y-1.5 md:space-y-2.5 px-1">
            <div className="flex items-center justify-between">
              <label className="text-[7px] md:text-[9px] font-black text-white/20 uppercase tracking-[0.2em] flex items-center gap-1.5"><Timer size={12} className="text-[#7CFF00]" /> Velocity</label>
              <span className="text-[9px] md:text-xs font-black font-mono">{scheduleMetrics.daysIn}d / {scheduleMetrics.daysLeft}d</span>
            </div>
            <div className="h-1.5 md:h-2.5 bg-white/5 rounded-full overflow-hidden border border-white/5 relative">
              <div className={`h-full transition-all duration-700 ${isOverdue ? 'bg-red-500' : 'bg-[#7CFF00]'}`} style={{ width: `${scheduleMetrics.expected}%` }} />
            </div>
          </div>

          <div className="grid grid-cols-4 gap-1.5 md:gap-3">
             {SYSTEM_FIELDS_CONFIG.map(({ field, label }) => (
               <button key={field} onClick={() => cycleSystemStatus(field)} className={`py-1 rounded-lg text-[6px] md:text-[7px] font-black uppercase transition-all border ${getSystemStyle(job[field] as any)}`}>
                 {label}
               </button>
             ))}
          </div>
        </div>
      </div>

      <div className="mt-4 md:mt-8 pt-4 md:pt-6 border-t border-white/[0.04] flex flex-col md:flex-row items-end justify-between gap-4 md:gap-6">
        <div className="flex gap-6 md:gap-10 w-full md:w-auto">
          <div><span className="text-[6px] md:text-[8px] font-black text-white/20 uppercase block mb-0.5">Profit</span><span className="text-lg md:text-2xl font-black text-[#7CFF00] font-mono leading-none">{formatCurrency(profit)}</span></div>
          <div><span className="text-[6px] md:text-[8px] font-black text-white/20 uppercase block mb-0.5">Margin</span><span className="text-lg md:text-2xl font-black text-white font-mono leading-none">{margin.toFixed(1)}%</span></div>
        </div>
        
        <div className="flex-1 w-full md:max-w-md space-y-1.5">
          <div className="flex items-center justify-between text-[6px] md:text-[8px] font-black uppercase tracking-[0.2em] text-white/30 px-1">
             <span>Efficiency Pulse</span>
             <span className="flex items-center gap-1.5">
               Abs: <span className="text-white/70 font-mono">{absorption.toFixed(1)}%</span>
             </span>
          </div>
          <div className="relative h-1.5 w-full bg-red-600/30 rounded-full overflow-hidden border border-white/5 shadow-inner">
             <div 
               className={`h-full transition-all duration-1000 shadow-[0_0_15px_rgba(124,255,0,0.25)] ${margin < 30 ? 'bg-orange-500' : 'bg-[#7CFF00]'}`} 
               style={{ width: `${Math.max(0, margin)}%` }} 
             />
          </div>
        </div>

        <div className="flex items-center justify-between w-full md:w-auto gap-4">
          <div className={`px-3 py-1 rounded-full text-[7px] md:text-[9px] font-black uppercase border border-white/10 ${theme.className}`}>{theme.label}</div>
          <div className="flex gap-1.5">
            <button className="p-2 md:p-3 rounded-lg md:rounded-xl bg-white/5 text-white/40 hover:text-white"><MessageSquare size={14} /></button>
            <button onClick={onRemove} className="p-2 md:p-3 rounded-lg md:rounded-xl bg-red-500/5 text-red-500/30 hover:text-red-500"><Trash2 size={14} /></button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default JobCard;
