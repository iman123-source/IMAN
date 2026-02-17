
import React, { useMemo } from 'react';
import { FixedCosts, Salary, Vehicle } from '../types';
import { Wallet, Truck, CreditCard, ArrowLeft, PoundSterling, Users, Activity, Fuel, Download, Upload, Database, ShieldCheck, Plus, Trash2, UserCircle } from 'lucide-react';

interface FixedCostsViewProps {
  fixedCosts: FixedCosts;
  onUpdateFixedCosts: (updates: FixedCosts) => void;
  onBack: () => void;
  onExport: () => void;
  onImport: () => void;
}

const formatCurrency = (val: number) => {
  return new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: 'GBP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(val);
};

const FixedCostsView: React.FC<FixedCostsViewProps> = ({ fixedCosts, onUpdateFixedCosts, onBack, onExport, onImport }) => {
  
  const burnRate = useMemo(() => {
    const salaryTotal = fixedCosts.salaries.reduce((sum, s) => sum + s.monthlyAmount, 0);
    const vehicleTotal = fixedCosts.vehicles.reduce((sum, v) => {
      return sum + v.insuranceMonthly + (v.rentalWeekly * 4.33) + v.fuelMonthly;
    }, 0);
    return { salaryTotal, vehicleTotal, total: salaryTotal + vehicleTotal };
  }, [fixedCosts]);

  const handleUpdateSalary = (id: string, field: keyof Salary, value: string | number) => {
    const updated = fixedCosts.salaries.map(s => s.id === id ? { ...s, [field]: value } : s);
    onUpdateFixedCosts({ ...fixedCosts, salaries: updated });
  };

  const addSalary = () => {
    const newSalary: Salary = {
      id: Math.random().toString(36).substring(7),
      name: 'New Employee',
      role: 'Staff Role',
      monthlyAmount: 0
    };
    onUpdateFixedCosts({ ...fixedCosts, salaries: [...fixedCosts.salaries, newSalary] });
  };

  const removeSalary = (id: string) => {
    onUpdateFixedCosts({ ...fixedCosts, salaries: fixedCosts.salaries.filter(s => s.id !== id) });
  };

  const handleUpdateVehicle = (id: string, field: keyof Vehicle, value: string | number) => {
    const updated = fixedCosts.vehicles.map(v => v.id === id ? { ...v, [field]: value } : v);
    onUpdateFixedCosts({ ...fixedCosts, vehicles: updated });
  };

  const addVehicle = () => {
    const newVehicle: Vehicle = {
      id: Math.random().toString(36).substring(7),
      name: 'New Asset',
      insuranceMonthly: 0,
      rentalWeekly: 0,
      fuelMonthly: 0
    };
    onUpdateFixedCosts({ ...fixedCosts, vehicles: [...fixedCosts.vehicles, newVehicle] });
  };

  const removeVehicle = (id: string) => {
    onUpdateFixedCosts({ ...fixedCosts, vehicles: fixedCosts.vehicles.filter(v => v.id !== id) });
  };

  return (
    <div className="animate-in slide-in-from-right duration-500 pb-32 max-w-[1300px] mx-auto px-1 md:px-0">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
        <div>
          <h2 className="text-3xl font-black tracking-tighter mb-2 text-white uppercase italic">Fixed Costs & Overheads</h2>
          <div className="flex items-center gap-3">
             <span className="text-[10px] text-blue-400 font-black uppercase tracking-[0.3em]">Operational Burn Ledger</span>
             <span className="text-white/10 text-xs">|</span>
             <span className="text-white/30 text-[10px] font-black uppercase tracking-[0.3em]">Overhead Configuration Matrix</span>
          </div>
        </div>
        <div className="flex gap-4">
          <div className="bg-[#1a1f26]/60 border border-white/10 p-2 rounded-xl flex gap-2 backdrop-blur-3xl">
            <button 
              onClick={onExport}
              title="Export Database"
              className="bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg p-2 transition-all active:scale-95"
            >
              <Download size={16} className="text-[#7CFF00]" />
            </button>
            <button 
              onClick={onImport}
              title="Import Database"
              className="bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg p-2 transition-all active:scale-95"
            >
              <Upload size={16} className="text-blue-400" />
            </button>
          </div>
          <button 
            onClick={onBack}
            className="flex items-center gap-2 text-white/40 hover:text-white transition-all text-[9px] font-black uppercase tracking-[0.2em] bg-[#1a1f26] px-5 py-3 rounded-xl border border-white/5 shadow-2xl"
          >
            <ArrowLeft size={14} strokeWidth={3} />
            Return to HQ
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1 space-y-8">
           {/* Summary Block */}
           <div className="bg-[#7CFF00] p-10 rounded-[40px] shadow-[0_30px_60px_rgba(124,255,0,0.15)] text-black relative overflow-hidden">
              <div className="absolute top-0 right-0 w-48 h-48 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl opacity-50"></div>
              <h3 className="text-[11px] font-black uppercase tracking-[0.4em] text-black/40 mb-3">Total Monthly Burn</h3>
              <div className="text-5xl font-black tracking-tighter font-mono mb-10 leading-none">{formatCurrency(burnRate.total)}</div>
              
              <div className="space-y-4">
                <div className="flex justify-between items-center text-[11px] font-black uppercase border-b border-black/10 pb-3">
                  <span className="flex items-center gap-2"><Users size={14} /> Admin Payroll</span>
                  <span className="font-mono">{formatCurrency(burnRate.salaryTotal)}</span>
                </div>
                <div className="flex justify-between items-center text-[11px] font-black uppercase border-b border-black/10 pb-3">
                  <span className="flex items-center gap-2"><Truck size={14} /> Fleet & Fuel</span>
                  <span className="font-mono">{formatCurrency(burnRate.vehicleTotal)}</span>
                </div>
              </div>

              <div className="mt-10 p-5 bg-black/5 rounded-2xl border border-black/5">
                <p className="text-[9px] font-bold uppercase tracking-wider opacity-60 leading-relaxed italic">
                  Burn rate is calculated as: Monthly Salaries + (Weekly Rent × 4.33) + Monthly Insurance + Monthly Fuel.
                </p>
              </div>
           </div>

           {/* Vehicle Summary Panel */}
           <div className="bg-[#1a1f26]/20 border border-white/5 rounded-[40px] p-8">
              <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-white/20 mb-8 flex items-center gap-3">
                <Activity size={16} className="text-blue-400" /> Fleet Distribution
              </h3>
              <div className="space-y-4">
                {fixedCosts.vehicles.map(v => (
                  <div key={v.id} className="flex items-center justify-between group">
                    <span className="text-[9px] font-black uppercase text-white/40 group-hover:text-white transition-colors truncate max-w-[120px]">{v.name}</span>
                    <div className="h-1 flex-1 mx-4 bg-white/5 rounded-full overflow-hidden">
                       <div className="h-full bg-blue-500" style={{ width: `${Math.min(100, (v.fuelMonthly / 600) * 100)}%` }}></div>
                    </div>
                    <span className="text-[9px] font-mono text-blue-400">{formatCurrency(v.fuelMonthly + (v.rentalWeekly * 4.33))}</span>
                  </div>
                ))}
                {fixedCosts.vehicles.length === 0 && (
                   <div className="text-center py-4 border border-dashed border-white/10 rounded-2xl text-[10px] font-black uppercase text-white/10">No vehicles listed</div>
                )}
              </div>
           </div>
        </div>

        <div className="lg:col-span-2 space-y-8">
          {/* Admin Salaries Management */}
          <div className="bg-[#1a1f26]/40 border border-white/5 rounded-[40px] p-10 backdrop-blur-md shadow-2xl">
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-[#7CFF00] flex items-center gap-3">
                <Users size={18} /> Administrative Payroll Audit
              </h3>
              <button onClick={addSalary} className="flex items-center gap-2 bg-[#7CFF00]/10 text-[#7CFF00] border border-[#7CFF00]/20 px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest hover:bg-[#7CFF00]/20 transition-all"><Plus size={12}/> New Entry</button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {fixedCosts.salaries.map(s => (
                <div key={s.id} className="bg-black/40 border border-white/5 p-6 rounded-3xl space-y-4 group hover:border-[#7CFF00]/40 transition-all duration-300 relative">
                  <button onClick={() => removeSalary(s.id)} className="absolute top-4 right-4 p-2 text-white/10 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"><Trash2 size={14}/></button>
                  <div className="flex flex-col gap-3">
                    <div className="space-y-1">
                      <span className="text-[7px] font-black text-white/20 uppercase tracking-widest">Employee Name</span>
                      <div className="relative">
                        <UserCircle size={10} className="absolute left-2 top-1/2 -translate-y-1/2 text-white/20" />
                        <input 
                          type="text"
                          className="w-full bg-white/5 border border-white/10 rounded-xl pl-7 pr-3 py-2 text-[10px] text-white font-bold outline-none focus:border-[#7CFF00] transition-colors"
                          value={s.name}
                          placeholder="Name..."
                          onChange={(e) => handleUpdateSalary(s.id, 'name', e.target.value)}
                        />
                      </div>
                    </div>
                    <div className="space-y-1">
                      <span className="text-[7px] font-black text-white/20 uppercase tracking-widest">Role / Description</span>
                      <input 
                        type="text"
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-[10px] text-white/60 font-medium outline-none focus:border-[#7CFF00] transition-colors uppercase tracking-widest"
                        value={s.role}
                        placeholder="Role..."
                        onChange={(e) => handleUpdateSalary(s.id, 'role', e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="pt-2 border-t border-white/5">
                    <span className="text-[7px] font-black text-white/20 uppercase tracking-widest mb-1 block">Monthly Compensation</span>
                    <div className="relative">
                      <PoundSterling size={10} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-white/20" />
                      <input 
                        type="number" 
                        step="any"
                        className="w-full bg-white/5 border border-white/10 rounded-xl pl-7 pr-3 py-2 text-xs text-[#7CFF00] font-mono outline-none focus:border-[#7CFF00] focus:ring-1 focus:ring-[#7CFF00]/20"
                        value={s.monthlyAmount}
                        onChange={(e) => handleUpdateSalary(s.id, 'monthlyAmount', parseFloat(e.target.value) || 0)}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
            {fixedCosts.salaries.length === 0 && (
               <button onClick={addSalary} className="w-full py-12 border-2 border-dashed border-white/5 rounded-[32px] flex flex-col items-center justify-center gap-3 group hover:border-[#7CFF00]/30 transition-all">
                  <div className="p-3 bg-white/5 rounded-full group-hover:scale-110 transition-transform"><Plus size={20} className="text-white/20 group-hover:text-[#7CFF00]" /></div>
                  <span className="text-[10px] font-black uppercase tracking-[0.3em] text-white/10 group-hover:text-white">Initialize Payroll Ledger</span>
               </button>
            )}
          </div>

          {/* Fleet Logistics Matrix */}
          <div className="bg-[#1a1f26]/40 border border-white/5 rounded-[40px] p-10 backdrop-blur-md shadow-2xl">
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-blue-400 flex items-center gap-3">
                <Truck size={18} /> Logistics & Fleet Matrix
              </h3>
              <button onClick={addVehicle} className="flex items-center gap-2 bg-blue-400/10 text-blue-400 border border-blue-400/20 px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest hover:bg-blue-400/20 transition-all"><Plus size={12}/> Add Vehicle</button>
            </div>
            <div className="space-y-4">
              {fixedCosts.vehicles.map(v => (
                <div key={v.id} className="bg-black/40 border border-white/5 p-6 rounded-3xl space-y-6 group hover:border-blue-500/40 transition-all duration-300 relative">
                  <button onClick={() => removeVehicle(v.id)} className="absolute top-4 right-4 p-2 text-white/10 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"><Trash2 size={14}/></button>
                  <div className="flex items-center justify-between border-b border-white/5 pb-4">
                    <div className="flex items-center gap-3 flex-1">
                      <div className="p-2 rounded-xl bg-blue-500/10 text-blue-500">
                        <Truck size={16} />
                      </div>
                      <div className="flex-1">
                         <span className="text-[7px] font-black text-white/20 uppercase tracking-widest mb-1 block">Vehicle Asset Identifier</span>
                         <input 
                           type="text"
                           className="bg-transparent border-none text-[10px] font-black text-white uppercase tracking-[0.3em] outline-none focus:text-blue-400 w-full transition-colors"
                           value={v.name}
                           placeholder="Vehicle name / Plate..."
                           onChange={(e) => handleUpdateVehicle(v.id, 'name', e.target.value)}
                         />
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <span className="text-[8px] font-black text-white/20 uppercase tracking-widest flex items-center gap-1.5"><CreditCard size={10} /> Weekly Rental</span>
                      <div className="relative">
                        <PoundSterling size={10} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-white/20" />
                        <input 
                          type="number"
                          step="any"
                          className="bg-white/5 border border-white/10 rounded-xl pl-7 pr-3 py-2 text-xs text-white font-mono outline-none focus:border-blue-400 w-full"
                          value={v.rentalWeekly}
                          onChange={(e) => handleUpdateVehicle(v.id, 'rentalWeekly', parseFloat(e.target.value) || 0)}
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <span className="text-[8px] font-black text-white/20 uppercase tracking-widest flex items-center gap-1.5"><Activity size={10} /> Insurance</span>
                      <div className="relative">
                        <PoundSterling size={10} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-white/20" />
                        <input 
                          type="number"
                          step="any"
                          className="bg-white/5 border border-white/10 rounded-xl pl-7 pr-3 py-2 text-xs text-white font-mono outline-none focus:border-blue-400 w-full"
                          value={v.insuranceMonthly}
                          onChange={(e) => handleUpdateVehicle(v.id, 'insuranceMonthly', parseFloat(e.target.value) || 0)}
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <span className="text-[8px] font-black text-white/20 uppercase tracking-widest flex items-center gap-1.5"><Fuel size={10} /> Monthly Fuel</span>
                      <div className="relative">
                        < PoundSterling size={10} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-white/20" />
                        <input 
                          type="number"
                          step="any"
                          className="bg-white/5 border border-white/10 rounded-xl pl-7 pr-3 py-2 text-xs text-white font-mono outline-none focus:border-blue-400 w-full"
                          value={v.fuelMonthly}
                          onChange={(e) => handleUpdateVehicle(v.id, 'fuelMonthly', parseFloat(e.target.value) || 0)}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              {fixedCosts.vehicles.length === 0 && (
                <button onClick={addVehicle} className="w-full py-12 border-2 border-dashed border-white/5 rounded-[32px] flex flex-col items-center justify-center gap-3 group hover:border-blue-500/30 transition-all">
                  <div className="p-3 bg-white/5 rounded-full group-hover:scale-110 transition-transform"><Plus size={20} className="text-white/20 group-hover:text-blue-500" /></div>
                  <span className="text-[10px] font-black uppercase tracking-[0.3em] text-white/10 group-hover:text-white">Initialize Fleet Ledger</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FixedCostsView;
