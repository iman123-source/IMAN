
import React from 'react';
import { WeeklyEntry } from '../types';
import { ArrowLeft, Plus, Trash2, Calendar, Hash, Save } from 'lucide-react';

interface WeeklyTrackerSheetProps {
  entries: WeeklyEntry[];
  onUpdate: (entries: WeeklyEntry[]) => void;
  onBack: () => void;
}

const WeeklyTrackerSheet: React.FC<WeeklyTrackerSheetProps> = ({ entries, onUpdate, onBack }) => {
  const addEntry = () => {
    const newEntry: WeeklyEntry = {
      id: Math.random().toString(36).substring(7),
      weekLabel: `Week ${entries.length + 1}`,
      count: 0
    };
    onUpdate([...entries, newEntry]);
  };

  const updateEntry = (id: string, updates: Partial<WeeklyEntry>) => {
    onUpdate(entries.map(e => e.id === id ? { ...e, ...updates } : e));
  };

  const removeEntry = (id: string) => {
    onUpdate(entries.filter(e => e.id !== id));
  };

  return (
    <div className="animate-in slide-in-from-right duration-500 max-w-4xl mx-auto pb-24">
      <div className="flex items-center justify-between mb-10 border-b border-white/5 pb-8">
        <div>
          <h2 className="text-3xl font-black tracking-tighter mb-2 text-white italic uppercase">Velocity Engine</h2>
          <div className="flex items-center gap-3">
             <span className="text-[9px] text-[#7CFF00] font-black uppercase tracking-[0.3em]">Weekly Active Job Tracker</span>
             <span className="text-white/10 text-xs">|</span>
             <span className="text-white/30 text-[9px] font-black uppercase tracking-[0.3em]">Manual Throughput Configuration</span>
          </div>
        </div>
        <button 
          onClick={onBack}
          className="flex items-center gap-2 text-white/40 hover:text-white transition-all text-[9px] font-black uppercase tracking-[0.2em] bg-[#1a1f26] px-5 py-3 rounded-xl border border-white/5 shadow-2xl"
        >
          <ArrowLeft size={14} strokeWidth={3} />
          Return to HQ
        </button>
      </div>

      <div className="space-y-4">
        {entries.map((entry) => (
          <div key={entry.id} className="group flex items-center gap-4 bg-[#121a12]/50 border border-white/5 p-4 rounded-2xl hover:border-[#7CFF00]/30 transition-all duration-300">
            <div className="flex-[2] relative">
              <label className="text-[8px] font-black text-white/20 uppercase tracking-widest absolute -top-2 left-3 bg-[#0c0e12] px-2">Timeline Identifier</label>
              <div className="flex items-center bg-black/40 rounded-xl px-4 py-3 border border-white/5 focus-within:border-[#7CFF00]/30 transition-all">
                <Calendar size={14} className="text-white/20 mr-3" />
                <input 
                  type="text" 
                  value={entry.weekLabel}
                  onChange={(e) => updateEntry(entry.id, { weekLabel: e.target.value })}
                  className="bg-transparent border-none text-white text-sm font-bold focus:ring-0 outline-none w-full"
                  placeholder="e.g. Week 24"
                />
              </div>
            </div>

            <div className="flex-1 relative">
              <label className="text-[8px] font-black text-white/20 uppercase tracking-widest absolute -top-2 left-3 bg-[#0c0e12] px-2">Active Units</label>
              <div className="flex items-center bg-black/40 rounded-xl px-4 py-3 border border-white/5 focus-within:border-[#7CFF00]/30 transition-all">
                <Hash size={14} className="text-white/20 mr-3" />
                <input 
                  type="number" 
                  step="any"
                  value={entry.count}
                  onChange={(e) => updateEntry(entry.id, { count: parseFloat(e.target.value) || 0 })}
                  className="bg-transparent border-none text-[#7CFF00] text-sm font-mono font-black focus:ring-0 outline-none w-full"
                  placeholder="0"
                />
              </div>
            </div>

            <button 
              onClick={() => removeEntry(entry.id)}
              className="p-3.5 rounded-xl bg-red-500/10 text-red-500/40 hover:text-red-500 hover:bg-red-500/20 transition-all border border-red-500/10"
            >
              <Trash2 size={18} />
            </button>
          </div>
        ))}

        <button 
          onClick={addEntry}
          className="w-full py-6 rounded-3xl border-2 border-dashed border-white/5 hover:border-[#7CFF00]/30 hover:bg-[#7CFF00]/5 text-white/20 hover:text-[#7CFF00] transition-all duration-500 flex flex-col items-center justify-center gap-3 group"
        >
          <div className="p-3 bg-white/5 rounded-full group-hover:scale-110 transition-transform duration-500">
            <Plus size={20} />
          </div>
          <span className="text-[10px] font-black uppercase tracking-[0.4em]">Append Operational Week</span>
        </button>
      </div>

      <div className="mt-12 p-8 rounded-[40px] bg-[#1a1f26]/30 border border-white/5 text-center">
        <p className="text-white/20 text-[10px] font-black uppercase tracking-[0.2em] leading-relaxed max-w-lg mx-auto">
          Operational velocity tracking enables long-term resource allocation forecasting. Changes made here will reflect immediately in the Manager HQ analytics suite.
        </p>
      </div>
    </div>
  );
};

export default WeeklyTrackerSheet;
