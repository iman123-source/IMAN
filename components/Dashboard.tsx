
import React, { useState, useMemo } from 'react';
import { Job, JobStatus, AIAnalysis, WeeklyEntry, WorkStatus, FixedCosts } from '../types';
import { STATUS_MAP } from '../constants';
import { analyzeJobsWithAI } from '../services/geminiService';
import { Sparkles, ArrowLeft, Loader2, ShieldAlert, Zap, Activity, Target, HardHat, Clock, MapPin, User, ChevronRight, TrendingUp, Layers, CheckCircle2, Hammer, Truck, Wallet, PoundSterling, CreditCard, Download, Upload, Database, ShieldCheck } from 'lucide-react';

interface DashboardProps {
  jobs: Job[];
  weeklyData: WeeklyEntry[];
  fixedCosts: FixedCosts;
  onBack: () => void;
  onOpenVelocityTracker: () => void;
  onNavigateToJob: (jobId: string) => void;
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

const calculateJobMargin = (job: Job) => {
  const mCost = (job.materialPayments && job.materialPayments.length > 0) 
    ? job.materialPayments.reduce((s, p) => s + p.amount, 0) 
    : (job.material || 0);
  const lCost = (job.labourEntries && job.labourEntries.length > 0) 
    ? job.labourEntries.reduce((s, e) => s + e.amount, 0) 
    : (job.labour || 0);
  const profit = (job.total || 0) - mCost - lCost;
  const margin = job.total > 0 ? (profit / job.total) * 100 : 0;
  return { profit, margin };
};

const Dashboard: React.FC<DashboardProps> = ({ jobs, fixedCosts, onBack, onNavigateToJob }) => {
  const [activeFilter, setActiveFilter] = useState<JobStatus | null>(null);
  const [activeWorkFilter, setActiveWorkFilter] = useState<WorkStatus | null>(null);
  const [aiReport, setAiReport] = useState<AIAnalysis | null>(null);
  const [loadingAI, setLoadingAI] = useState(false);

  const operationalStats = useMemo(() => {
    return jobs.reduce((acc, job) => {
      const status = job.status || WorkStatus.WIP;
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    }, {
      [WorkStatus.WIP]: 0,
      [WorkStatus.DELAYED]: 0,
      [WorkStatus.COMPLETED]: 0,
    } as Record<WorkStatus, number>);
  }, [jobs]);

  const hqTheme: Record<JobStatus, { bg: string; activeBg: string; border: string; glow: string; text: string; icon: React.ReactNode }> = {
    [JobStatus.AMAZING]: { 
      bg: 'bg-[#7CFF00]/5 hover:bg-[#7CFF00]/10', 
      activeBg: 'bg-[#7CFF00] text-black shadow-[0_0_40px_rgba(124,255,0,0.25)]', 
      border: 'border-[#7CFF00]/20 hover:border-[#7CFF00]/40', 
      glow: 'shadow-[#7CFF00]/5',
      text: 'text-[#7CFF00]',
      icon: <Zap size={18} />
    },
    [JobStatus.STABLE]: { 
      bg: 'bg-blue-500/5 hover:bg-blue-500/10', 
      activeBg: 'bg-blue-500 text-white shadow-[0_0_40px_rgba(59,130,246,0.25)]', 
      border: 'border-blue-500/20 hover:border-blue-500/40', 
      glow: 'shadow-blue-500/5',
      text: 'text-blue-400',
      icon: <Target size={18} />
    },
    [JobStatus.ATTENTION]: { 
      bg: 'bg-orange-500/5 hover:bg-orange-500/10', 
      activeBg: 'bg-orange-500 text-white shadow-[0_0_40px_rgba(249,115,22,0.25)]', 
      border: 'border-orange-500/20 hover:border-orange-500/40', 
      glow: 'shadow-orange-500/5',
      text: 'text-orange-400',
      icon: <Activity size={18} />
    },
    [JobStatus.CRITICAL]: { 
      bg: 'bg-red-500/5 hover:bg-red-500/10', 
      activeBg: 'bg-red-600 text-white shadow-[0_0_40px_rgba(239,68,68,0.3)]', 
      border: 'border-red-500/20 hover:border-red-500/40', 
      glow: 'shadow-red-500/5',
      text: 'text-red-500',
      icon: <ShieldAlert size={18} />
    }
  };

  const statusData = useMemo(() => {
    const counts = jobs.reduce((acc, job) => {
      const { margin } = calculateJobMargin(job);
      const status = getJobStatus(margin);
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    }, {} as Record<JobStatus, number>);

    return Object.entries(STATUS_MAP).map(([key, meta]) => ({
      status: key as JobStatus,
      label: meta.label,
      count: counts[key as JobStatus] || 0,
      color: meta.color,
      ...hqTheme[key as JobStatus]
    }));
  }, [jobs]);

  const filteredJobs = useMemo(() => {
    if (activeWorkFilter) {
      return jobs.filter(job => (job.status || WorkStatus.WIP) === activeWorkFilter);
    }
    if (activeFilter) {
      return jobs.filter(job => {
        const { margin } = calculateJobMargin(job);
        return getJobStatus(margin) === activeFilter;
      });
    }
    return [];
  }, [jobs, activeFilter, activeWorkFilter]);

  const handleGenerateAI = async () => {
    setLoadingAI(true);
    try {
      const analysis = await analyzeJobsWithAI(jobs);
      setAiReport(analysis);
    } catch (error) {
      console.error(error);
    } finally {
      setLoadingAI(false);
    }
  };

  const clearFilters = () => {
    setActiveFilter(null);
    setActiveWorkFilter(null);
  };

  const toggleWorkFilter = (status: WorkStatus) => {
    if (activeWorkFilter === status) {
      setActiveWorkFilter(null);
    } else {
      setActiveWorkFilter(status);
      setActiveFilter(null); // Ensure mutual exclusivity
    }
  };

  const toggleFinancialFilter = (status: JobStatus) => {
    if (activeFilter === status) {
      setActiveFilter(null);
    } else {
      setActiveFilter(status);
      setActiveWorkFilter(null); // Ensure mutual exclusivity
    }
  };

  return (
    <div className="animate-in fade-in duration-500 pb-32 max-w-[1300px] mx-auto px-1 md:px-0">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 md:gap-6 mb-8 md:mb-10">
        <div>
          <h2 className="text-2xl md:text-3xl font-black tracking-tighter mb-2 text-white uppercase italic">Manager HQ</h2>
          <button 
            onClick={(activeFilter || activeWorkFilter) ? clearFilters : onBack}
            className="flex items-center gap-2 text-white/40 hover:text-white transition-colors duration-200 text-[8px] md:text-[9px] font-black uppercase tracking-[0.2em] bg-[#1a1f26] px-3 md:px-4 py-2 rounded-lg border border-white/5 shadow-lg"
          >
            <ArrowLeft size={12} strokeWidth={3} />
            {(activeFilter || activeWorkFilter) ? 'Clear Filter' : 'Back'}
          </button>
        </div>
        
        <button 
          onClick={handleGenerateAI}
          disabled={loadingAI || jobs.length === 0}
          className="relative group flex items-center justify-center gap-3 bg-[#7CFF00] text-black px-4 md:px-6 py-2.5 md:py-3 rounded-xl font-black text-[9px] md:text-[10px] uppercase tracking-widest hover:bg-[#8dff21] transition-colors shadow-[0_0_30px_rgba(124,255,0,0.15)] disabled:opacity-50 overflow-hidden active:scale-95"
        >
          <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-500" />
          <span className="relative flex items-center gap-2">
            {loadingAI ? <Loader2 className="animate-spin" size={12} /> : <Sparkles size={12} />}
            AI Audit
          </span>
        </button>
      </div>

      {/* Operational Pipeline Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-12">
        <button 
          onClick={() => toggleWorkFilter(WorkStatus.WIP)}
          className={`group bg-[#1a1f26]/40 border rounded-2xl p-6 flex items-center justify-between transition-all duration-300 ${activeWorkFilter === WorkStatus.WIP ? 'border-orange-500 ring-1 ring-orange-500/50 bg-orange-500/5 scale-[1.02]' : 'border-white/5 hover:border-orange-500/30'}`}
        >
          <div className="flex items-center gap-4">
             <div className={`p-3 rounded-xl border transition-colors ${activeWorkFilter === WorkStatus.WIP ? 'bg-orange-500 text-black border-transparent' : 'bg-orange-500/10 text-orange-500 border-orange-500/20'}`}>
               <Hammer size={20} />
             </div>
             <div className="text-left">
               <span className="text-[9px] font-black uppercase tracking-widest text-white/30 block">In Progress</span>
               <span className="text-2xl font-black text-white font-mono">{operationalStats[WorkStatus.WIP]}</span>
             </div>
          </div>
        </button>

        <button 
          onClick={() => toggleWorkFilter(WorkStatus.DELAYED)}
          className={`group bg-[#1a1f26]/40 border rounded-2xl p-6 flex items-center justify-between transition-all duration-300 ${activeWorkFilter === WorkStatus.DELAYED ? 'border-red-500 ring-1 ring-red-500/50 bg-red-500/5 scale-[1.02]' : 'border-white/5 hover:border-red-500/30'}`}
        >
          <div className="flex items-center gap-4">
             <div className={`p-3 rounded-xl border transition-colors ${activeWorkFilter === WorkStatus.DELAYED ? 'bg-red-500 text-white border-transparent' : 'bg-red-500/10 text-red-500 border-red-500/20'}`}>
               <Clock size={20} />
             </div>
             <div className="text-left">
               <span className="text-[9px] font-black uppercase tracking-widest text-white/30 block">Delayed</span>
               <span className="text-2xl font-black text-white font-mono">{operationalStats[WorkStatus.DELAYED] || 0}</span>
             </div>
          </div>
        </button>

        <button 
          onClick={() => toggleWorkFilter(WorkStatus.COMPLETED)}
          className={`group bg-[#1a1f26]/40 border rounded-2xl p-6 flex items-center justify-between transition-all duration-300 ${activeWorkFilter === WorkStatus.COMPLETED ? 'border-[#7CFF00] ring-1 ring-[#7CFF00]/50 bg-[#7CFF00]/5 scale-[1.02]' : 'border-white/5 hover:border-[#7CFF00]/30'}`}
        >
          <div className="flex items-center gap-4">
             <div className={`p-3 rounded-xl border transition-colors ${activeWorkFilter === WorkStatus.COMPLETED ? 'bg-[#7CFF00] text-black border-transparent' : 'bg-[#7CFF00]/10 text-[#7CFF00] rounded-xl border border-[#7CFF00]/20'}`}>
               <CheckCircle2 size={20} />
             </div>
             <div className="text-left">
               <span className="text-[9px] font-black uppercase tracking-widest text-white/30 block">Completed</span>
               <span className="text-2xl font-black text-white font-mono">{operationalStats[WorkStatus.COMPLETED]}</span>
             </div>
          </div>
        </button>
      </div>

      {/* Financial Health Selectors */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-12">
        {statusData.map((item) => {
          const isActive = activeFilter === item.status;
          return (
            <button
              key={item.status}
              onClick={() => toggleFinancialFilter(item.status)}
              className={`group relative p-5 rounded-2xl border transition-colors duration-300 text-left overflow-hidden ${
                isActive ? `${item.activeBg} scale-[1.02] border-transparent` : `${item.bg} ${item.border} backdrop-blur-sm`
              }`}
            >
              <div className="relative z-10 flex flex-col">
                <div className="flex items-center justify-between mb-4">
                  <div className={`p-2 rounded-xl ${isActive ? 'bg-black/20' : 'bg-white/5'}`}>{item.icon}</div>
                </div>
                <span className={`text-[9px] font-black uppercase tracking-[0.2em] mb-1 ${isActive ? 'text-black/60' : 'text-white/30'}`}>{item.label}</span>
                <span className={`text-3xl font-black font-mono tracking-tighter ${isActive ? 'text-black' : 'text-white'}`}>{item.count}</span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Filtered Drilldown List */}
      {(activeFilter || activeWorkFilter) && (
        <div className="animate-in slide-in-from-right-10 duration-700 space-y-3 mb-12">
          <div className={`p-8 rounded-[40px] border flex items-center justify-between gap-4 shadow-xl ${
            activeWorkFilter 
              ? (activeWorkFilter === WorkStatus.WIP ? 'bg-orange-500/5 border-orange-500/20' : activeWorkFilter === WorkStatus.DELAYED ? 'bg-red-500/5 border-red-500/20' : 'bg-[#7CFF00]/5 border-[#7CFF00]/20')
              : hqTheme[activeFilter!].bg + ' ' + hqTheme[activeFilter!].border
          }`}>
             <div className="flex items-center gap-5">
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg ${
                  activeWorkFilter
                    ? (activeWorkFilter === WorkStatus.WIP ? 'bg-orange-500 text-black' : activeWorkFilter === WorkStatus.DELAYED ? 'bg-red-500 text-white' : 'bg-[#7CFF00] text-black')
                    : hqTheme[activeFilter!].activeBg.split(' ')[0]
                }`}>
                  {activeWorkFilter ? (activeWorkFilter === WorkStatus.WIP ? <Hammer size={24} /> : activeWorkFilter === WorkStatus.DELAYED ? <Clock size={24} /> : <CheckCircle2 size={24} />) : hqTheme[activeFilter!].icon}
                </div>
                <div>
                  <h3 className="text-3xl font-black uppercase tracking-tighter text-white">
                    {activeWorkFilter ? activeWorkFilter : STATUS_MAP[activeFilter!].label}
                  </h3>
                  <span className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em]">{filteredJobs.length} Properties localized</span>
                </div>
             </div>
          </div>
          <div className="grid grid-cols-1 gap-2">
            {filteredJobs.map(job => (
              <button 
                key={job.id} 
                onClick={() => onNavigateToJob(job.id)}
                className="w-full bg-[#1a1f26]/50 border border-white/5 p-6 rounded-3xl flex items-center justify-between group hover:border-[#7CFF00]/40 transition-all text-left"
              >
                <div className="flex items-center gap-6">
                   <div className="w-14 h-14 bg-black/40 rounded-2xl flex items-center justify-center font-black text-xl text-white/10 shrink-0">
                      {job.name.charAt(0) || '?'}
                    </div>
                    <div>
                      <h4 className="font-black text-white text-xl tracking-tight">{job.name || 'Unnamed Asset'}</h4>
                      <div className="flex items-center gap-3 text-[9px] text-white/30 font-bold uppercase tracking-widest mt-1">
                        <span className="flex items-center gap-1"><MapPin size={10} className="text-orange-400" /> Deployment Active</span>
                        <span>|</span>
                        <span className="text-[#7CFF00]">{formatCurrency(job.total)} Contract</span>
                      </div>
                    </div>
                </div>
                <div className="flex items-center gap-2 text-[9px] font-black uppercase tracking-widest text-[#7CFF00] opacity-0 group-hover:opacity-100 transition-all">
                  Edit Property <ChevronRight size={14} />
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Operation-Level Time Audit */}
      <div className="bg-[#1a1f26]/20 border border-white/5 rounded-[40px] p-10 shadow-xl mb-12">
        <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-white/20 mb-8 flex items-center gap-3">
           <HardHat size={16} className="text-orange-500" /> Operational Efficiency Analytics
        </h3>
        <div className="space-y-6">
          {jobs.map(job => {
            const entries = job.labourEntries || [];
            if (entries.length === 0) return null;
            const totalHours = entries.reduce((s, e) => s + e.hours, 0);
            const totalCost = entries.reduce((s, e) => s + e.amount, 0);

            return (
              <div key={job.id} className="bg-black/20 border border-white/[0.03] rounded-3xl p-6 flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="flex items-center gap-4 w-full md:w-auto">
                  <div className="p-3 bg-orange-500/10 text-orange-500 rounded-xl border border-orange-500/20"><MapPin size={20} /></div>
                  <div>
                    <h4 className="text-xl font-black text-white uppercase italic tracking-tighter">{job.name}</h4>
                    <span className="text-[8px] font-black text-white/20 uppercase tracking-widest">Property Deployment</span>
                  </div>
                </div>
                <div className="flex items-center gap-8 w-full md:w-auto justify-between md:justify-end">
                  <div className="text-right">
                    <span className="text-[8px] font-black text-white/20 uppercase block">Man-Hours</span>
                    <span className="text-2xl font-black font-mono text-orange-500">{totalHours}h</span>
                  </div>
                  <div className="text-right border-l border-white/10 pl-8">
                    <span className="text-[8px] font-black text-white/20 uppercase block">Labor Spend</span>
                    <span className="text-2xl font-black font-mono text-white">{formatCurrency(totalCost)}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* AI Intelligence Audit */}
      {aiReport ? (
        <div className="bg-black border border-[#7CFF00]/20 rounded-[48px] overflow-hidden shadow-2xl relative">
           <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(124,255,0,0.08),transparent)] pointer-events-none"></div>
           <div className="bg-white/5 p-8 flex items-center gap-6 border-b border-white/5">
              <Sparkles className="text-[#7CFF00]" size={32} />
              <h3 className="text-2xl font-black text-white uppercase tracking-tighter italic">Strategic Synthesis Engine</h3>
           </div>
           <div className="p-12 space-y-12">
              <p className="text-2xl font-bold text-white leading-tight">{aiReport.summary}</p>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="space-y-4">
                  <h4 className="text-[10px] font-black uppercase tracking-[0.4em] text-red-500">Risk Vectors</h4>
                  <div className="bg-red-500/5 p-8 rounded-[32px] border border-red-500/10 text-white/70 font-semibold leading-relaxed">{aiReport.riskAssessment}</div>
                </div>
                <div className="space-y-4">
                  <h4 className="text-[10px] font-black uppercase tracking-[0.4em] text-[#7CFF00]">Optimization Directives</h4>
                  <div className="bg-[#7CFF00]/5 p-8 rounded-[32px] border border-[#7CFF00]/10 space-y-4">
                    {aiReport.recommendations.map((rec, i) => (
                      <div key={i} className="flex gap-4 items-start">
                        <span className="text-[#7CFF00] font-mono font-black text-sm p-1 leading-none">0{i+1}</span>
                        <span className="text-white/70 font-bold leading-snug">{rec}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
           </div>
        </div>
      ) : (
        <button onClick={handleGenerateAI} disabled={loadingAI} className="w-full py-24 rounded-[48px] border-2 border-dashed border-white/5 hover:border-[#7CFF00]/30 transition-all flex flex-col items-center justify-center group gap-4">
          {loadingAI ? <Loader2 className="animate-spin text-[#7CFF00]" size={48} /> : <Sparkles className="text-white/10 group-hover:text-[#7CFF00] transition-colors" size={48} />}
          <span className="text-[10px] font-black uppercase tracking-[0.5em] text-white/10 group-hover:text-white transition-colors">Invoke AI Audit Engine</span>
        </button>
      )}
    </div>
  );
};

export default Dashboard;
