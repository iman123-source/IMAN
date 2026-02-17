
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Job, JobStatus, WeeklyEntry, WorkStatus, FixedCosts, SyncState } from './types';
import { INITIAL_JOBS, STATUS_MAP, INITIAL_WEEKLY_DATA, INITIAL_FIXED_COSTS } from './constants';
import JobCard from './components/JobCard';
import Dashboard from './components/Dashboard';
import FixedCostsView from './components/FixedCostsView';
import WeeklyTrackerSheet from './components/WeeklyTrackerSheet';
import { Plus, Search, Save, CheckCircle, RefreshCcw, Cloud, LayoutDashboard, Building2, Wallet, CloudDownload, Activity, Layers, Zap } from 'lucide-react';

const SaharaLogo = ({ className = "" }: { className?: string }) => (
  <svg viewBox="0 0 100 100" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    <text x="43" y="46" fill="currentColor" fontSize="20" fontWeight="400" fontFamily="serif" textAnchor="middle">S</text>
    <text x="56" y="65" fill="currentColor" fontSize="20" fontWeight="400" fontFamily="serif" textAnchor="middle">P</text>
    <line x1="38" y1="62" x2="62" y2="38" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    <path d="M 25 50 A 25 25 0 0 1 75 50" stroke="currentColor" strokeWidth="1.5" fill="none" strokeDasharray="60 40" strokeDashoffset="30" />
    <path d="M 25 50 A 25 25 0 0 0 75 50" stroke="currentColor" strokeWidth="1.5" fill="none" strokeDasharray="60 40" strokeDashoffset="-10" />
    <text fontSize="6" fontWeight="900" fill="currentColor" letterSpacing="2">
      <textPath href="#topPath" startOffset="50%" textAnchor="middle">SAHARA</textPath>
    </text>
    <text fontSize="5" fontWeight="900" fill="currentColor" letterSpacing="1.5">
      <textPath href="#bottomPath" startOffset="50%" textAnchor="middle">PROPERTY</textPath>
    </text>
    <defs>
      <path id="topPath" d="M 30 45 A 20 20 0 0 1 70 45" />
      <path id="bottomPath" d="M 30 55 A 20 20 0 0 0 70 55" />
    </defs>
  </svg>
);

const formatCurrency = (val: number) => {
  return new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: 'GBP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
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
  return { profit, margin, mCost, lCost };
};

// Global Broadcast Channel for Real-Time Sync across tabs/instances
const syncChannel = new BroadcastChannel('sahara_live_link_v1');

const App: React.FC = () => {
  const [view, setView] = useState<'site' | 'manager' | 'fixed-costs' | 'weekly-tracker'>('site');
  const [syncState, setSyncState] = useState<SyncState>({
    lastSaved: null,
    status: 'idle'
  });

  const [jobs, setJobs] = useState<Job[]>([]);
  const [weeklyEntries, setWeeklyEntries] = useState<WeeklyEntry[]>([]);
  const [fixedCosts, setFixedCosts] = useState<FixedCosts>(INITIAL_FIXED_COSTS);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<JobStatus | 'ALL'>('ALL');
  const [sortBy, setSortBy] = useState<'newest' | 'name-asc' | 'name-desc' | 'margin-high' | 'margin-low'>('newest');

  const isInitialLoad = useRef(true);
  const storageKey = 'sahara-global-shared-state';

  // 1. Initial Data Load
  useEffect(() => {
    const savedData = localStorage.getItem(storageKey);
    if (savedData) {
      const parsed = JSON.parse(savedData);
      setJobs(parsed.jobs || INITIAL_JOBS);
      setWeeklyEntries(parsed.weeklyEntries || INITIAL_WEEKLY_DATA);
      setFixedCosts(parsed.fixedCosts || INITIAL_FIXED_COSTS);
      setSyncState(prev => ({ ...prev, lastSaved: parsed.lastSaved }));
    } else {
      setJobs(INITIAL_JOBS);
      setWeeklyEntries(INITIAL_WEEKLY_DATA);
      setFixedCosts(INITIAL_FIXED_COSTS);
    }
    isInitialLoad.current = false;
  }, []);

  // 2. Continuous Sync Listener
  useEffect(() => {
    const pullLatest = () => {
      const savedData = localStorage.getItem(storageKey);
      if (savedData) {
        const parsed = JSON.parse(savedData);
        if (parsed.lastSaved > (syncState.lastSaved || 0)) {
          setJobs(parsed.jobs);
          setWeeklyEntries(parsed.weeklyEntries);
          setFixedCosts(parsed.fixedCosts);
          setSyncState({ lastSaved: parsed.lastSaved, status: 'saved' });
          setTimeout(() => setSyncState(prev => ({ ...prev, status: 'idle' })), 2000);
        }
      }
    };

    syncChannel.onmessage = (event) => {
      if (event.data.type === 'STATE_UPDATED') pullLatest();
    };

    const onStorageChange = (e: StorageEvent) => {
      if (e.key === storageKey) pullLatest();
    };

    window.addEventListener('storage', onStorageChange);
    return () => window.removeEventListener('storage', onStorageChange);
  }, [syncState.lastSaved]);

  // 3. Reactive Auto-Sync (Every change is pushed automatically)
  useEffect(() => {
    if (isInitialLoad.current) return;

    const timer = setTimeout(() => {
      const pushState = async () => {
        setSyncState(prev => ({ ...prev, status: 'saving' }));
        const timestamp = Date.now();
        const payload = { jobs, weeklyEntries, fixedCosts, lastSaved: timestamp };
        
        localStorage.setItem(storageKey, JSON.stringify(payload));
        syncChannel.postMessage({ type: 'STATE_UPDATED' });
        
        setSyncState({ lastSaved: timestamp, status: 'saved' });
        setTimeout(() => setSyncState(prev => ({ ...prev, status: 'idle' })), 2000);
      };
      pushState();
    }, 800); // 800ms debounce for high responsiveness

    return () => clearTimeout(timer);
  }, [jobs, weeklyEntries, fixedCosts]);

  const addJob = () => {
    const today = new Date().toISOString().split('T')[0];
    const newJob: Job = {
      id: Math.random().toString(36).substring(7),
      name: 'NEW PROPERTY', total: 0, material: 0, labour: 0,
      startDate: today, targetDate: today,
      status: WorkStatus.WIP, materialPayments: [], labourEntries: []
    };
    setJobs([newJob, ...jobs]);
  };

  const updateJob = (id: string, updates: Partial<Job>) => {
    setJobs(jobs.map(j => j.id === id ? { ...j, ...updates } : j));
  };

  const removeJob = (id: string) => {
    if(window.confirm("Delete property from live ledger?")) {
      setJobs(jobs.filter(j => j.id !== id));
    }
  };

  const navigateToJob = (jobId: string) => {
    const job = jobs.find(j => j.id === jobId);
    if (job) {
      setSearchQuery(job.name);
      setView('site');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const filteredAndSortedJobs = useMemo(() => {
    let result = [...jobs];
    if (searchQuery) result = result.filter(j => j.name.toLowerCase().includes(searchQuery.toLowerCase()));
    if (statusFilter !== 'ALL') {
      result = result.filter(j => {
        const { margin } = calculateJobMargin(j);
        return getJobStatus(margin) === statusFilter;
      });
    }
    result.sort((a, b) => {
      const { margin: marginA } = calculateJobMargin(a);
      const { margin: marginB } = calculateJobMargin(b);
      switch (sortBy) {
        case 'name-asc': return a.name.localeCompare(b.name);
        case 'name-desc': return b.name.localeCompare(a.name);
        case 'margin-high': return marginB - marginA;
        case 'margin-low': return marginA - marginB;
        default: return 0;
      }
    });
    return result;
  }, [jobs, searchQuery, statusFilter, sortBy]);

  const totalPortfolioVolume = jobs.reduce((a, b) => a + (b.total || 0), 0);
  const avgMargin = jobs.length > 0 ? Math.round(jobs.reduce((a, b) => a + calculateJobMargin(b).margin, 0) / jobs.length) : 0;

  return (
    <div className="min-h-screen bg-[#0c0e12] text-white selection:bg-[#7CFF00] selection:text-black pb-32 relative overflow-hidden">
      <header className="border-b border-white/[0.04] bg-[#0c0e12]/80 backdrop-blur-2xl sticky top-0 z-50">
        <div className="max-w-[1500px] mx-auto px-4 md:px-8 h-24 flex items-center justify-between">
          <div className="flex items-center gap-4 cursor-pointer group" onClick={() => setView('site')}>
            <SaharaLogo className="w-10 h-10 md:w-12 md:h-12 text-white group-hover:text-[#7CFF00] transition-all" />
            <div className="flex flex-col">
              <span className="text-xl md:text-2xl font-black tracking-tighter leading-none uppercase italic">SAHARA</span>
              <span className="text-[7px] text-[#7CFF00]/60 font-black uppercase tracking-[0.3em] mt-1 hidden sm:block">LIVE SYNC v4.1</span>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-4">
            <nav className="flex items-center bg-[#121a12] p-1.5 rounded-2xl border border-[#7CFF00]/10">
              <button onClick={() => setView('site')} className={`px-4 sm:px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${view === 'site' ? 'bg-[#7CFF00] text-black shadow-lg shadow-[#7CFF00]/20' : 'text-white/40 hover:text-white/80'}`}>
                <LayoutDashboard size={14} />
                <span className="hidden md:inline">Site View</span>
              </button>
              <button onClick={() => setView('manager')} className={`px-4 sm:px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${view === 'manager' || view === 'weekly-tracker' ? 'bg-[#7CFF00] text-black shadow-lg shadow-[#7CFF00]/20' : 'text-white/40 hover:text-white/80'}`}>
                <Building2 size={14} />
                <span className="hidden md:inline">HQ Hub</span>
              </button>
              <button onClick={() => setView('fixed-costs')} className={`px-4 sm:px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${view === 'fixed-costs' ? 'bg-[#7CFF00] text-black shadow-lg shadow-[#7CFF00]/20' : 'text-white/40 hover:text-white/80'}`}>
                <Wallet size={14} />
                <span className="hidden md:inline">Operational Costs</span>
              </button>
            </nav>
            <button onClick={addJob} className="bg-[#1a241a] text-[#7CFF00] h-12 px-5 rounded-2xl text-[10px] font-black uppercase tracking-widest border border-[#7CFF00]/20 hover:border-[#7CFF00]/50 transition-all flex items-center gap-2">
              <Plus size={16} strokeWidth={3} />
              <span className="hidden sm:inline">Deploy Asset</span>
            </button>
          </div>

          <div className="hidden lg:flex items-center gap-3 px-4 py-2 bg-white/5 border border-white/5 rounded-2xl">
             <div className="flex flex-col items-end">
                <span className="text-[10px] font-black text-white uppercase italic">Continuous Link</span>
                <span className="text-[7px] font-black text-[#7CFF00]/50 uppercase tracking-[0.2em]">All Sessions Unified</span>
             </div>
             <div className="h-6 w-px bg-white/10" />
             <Activity size={16} className="text-[#7CFF00] animate-pulse" />
          </div>
        </div>
      </header>

      <main className="max-w-[1500px] mx-auto px-4 sm:px-8 py-8 sm:py-14">
        {view === 'site' ? (
          <div className="space-y-12 max-w-6xl mx-auto">
            <div className="flex flex-col md:flex-row md:items-end justify-between border-b border-white/5 pb-10 gap-8">
              <div>
                <h2 className="text-3xl sm:text-4xl font-black tracking-tighter mb-3 text-white italic uppercase">Operational Ledger</h2>
                <div className="flex items-center gap-3 bg-[#121a12] px-4 py-1.5 rounded-xl border border-[#7CFF00]/10 w-fit">
                  <span className={`w-2 h-2 rounded-full ${syncState.status === 'saving' ? 'bg-blue-500 animate-ping' : 'bg-[#7CFF00] animate-pulse'}`} />
                  <span className="text-[9px] sm:text-[11px] text-white/50 font-black uppercase tracking-widest">{filteredAndSortedJobs.length} Live Properties Connected</span>
                </div>
              </div>
              <div className="flex items-center gap-3 bg-[#121a12]/50 p-1.5 rounded-3xl border border-white/5 backdrop-blur-md w-full sm:w-auto">
                <div className="relative flex items-center flex-1 sm:w-64">
                  <Search size={16} className="absolute left-4 text-white/20" />
                  <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search Ledger..." className="bg-black/40 border border-white/5 rounded-2xl pl-12 pr-4 py-3 text-[11px] text-white placeholder:text-white/10 outline-none w-full focus:border-[#7CFF00]/20 transition-all" />
                </div>
                <select value={sortBy} onChange={(e) => setSortBy(e.target.value as any)} className="bg-black/40 border border-white/5 rounded-2xl px-4 py-3 text-[9px] sm:text-[11px] font-black uppercase tracking-widest text-white outline-none cursor-pointer">
                  <option value="newest">Newest</option>
                  <option value="margin-high">Yield ↑</option>
                  <option value="margin-low">Yield ↓</option>
                </select>
              </div>
            </div>
            <div className="grid grid-cols-1 gap-8">
              {filteredAndSortedJobs.length > 0 ? filteredAndSortedJobs.map(job => (
                <JobCard key={job.id} job={job} onChange={(updates) => updateJob(job.id, updates)} onRemove={() => removeJob(job.id)} />
              )) : (
                <div className="text-center py-32 bg-[#121a12]/30 rounded-[64px] border border-dashed border-white/5">
                  <Cloud className="mx-auto text-white/5 mb-6" size={64} />
                  <p className="text-white/20 font-black uppercase tracking-[0.5em] text-xs">Awaiting Unified Property Data...</p>
                </div>
              )}
            </div>
          </div>
        ) : view === 'manager' ? (
          <Dashboard jobs={jobs} weeklyData={weeklyEntries} fixedCosts={fixedCosts} onBack={() => setView('site')} onOpenVelocityTracker={() => setView('weekly-tracker')} onNavigateToJob={navigateToJob} />
        ) : view === 'fixed-costs' ? (
          <FixedCostsView fixedCosts={fixedCosts} onUpdateFixedCosts={setFixedCosts} onBack={() => setView('manager')} onExport={() => {}} onImport={() => {}} />
        ) : (
          <WeeklyTrackerSheet entries={weeklyEntries} onUpdate={setWeeklyEntries} onBack={() => setView('manager')} />
        )}
      </main>

      <footer className="fixed bottom-0 left-0 right-0 bg-[#0c0e12]/95 backdrop-blur-3xl border-t border-white/[0.04] py-5 sm:py-6 px-6 sm:px-12 z-40 overflow-x-auto no-scrollbar">
        <div className="max-w-[1500px] mx-auto flex items-center justify-between gap-10">
            <div className="flex items-center gap-10 sm:gap-20 shrink-0">
              <div className="flex flex-col">
                <span className="text-[9px] text-white/20 font-black uppercase tracking-[0.2em] mb-1">Portfolio Size</span>
                <span className="text-lg sm:text-2xl font-black text-white italic">{jobs.length} Assets</span>
              </div>
              <div className="flex flex-col">
                <span className="text-[9px] text-white/20 font-black uppercase tracking-[0.2em] mb-1">Contract Volume</span>
                <span className="text-lg sm:text-2xl font-black text-white font-mono">{formatCurrency(totalPortfolioVolume)}</span>
              </div>
              <div className="flex flex-col">
                <span className="text-[9px] text-white/20 font-black uppercase tracking-[0.2em] mb-1">Global Efficiency</span>
                <div className="flex items-center gap-4">
                  <span className="text-lg sm:text-2xl font-black text-[#7CFF00] font-mono">{avgMargin}%</span>
                  <div className="w-24 h-2 bg-white/5 rounded-full overflow-hidden hidden lg:block border border-white/5">
                    <div className="h-full bg-[#7CFF00] shadow-[0_0_20px_rgba(124,255,0,0.6)]" style={{ width: `${avgMargin}%` }} />
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-8 shrink-0">
              <div className="flex items-center gap-6 bg-white/5 px-6 py-3 rounded-[24px] border border-white/5">
                 <div className="flex flex-col items-end">
                    <div className="flex items-center gap-2">
                       <div className={`w-2 h-2 rounded-full ${syncState.status === 'saving' ? 'bg-blue-400 animate-pulse' : 'bg-[#7CFF00]'}`} />
                       <span className="text-[10px] font-black text-[#7CFF00] uppercase tracking-[0.3em]">Reactive Sync Online</span>
                    </div>
                    <div className="flex items-center gap-3 mt-1.5">
                       <span className="text-[9px] font-black text-white/30 uppercase tracking-widest flex items-center gap-1.5"><Activity size={10} /> Live State:</span>
                       <span className="text-[10px] font-black text-white italic">{syncState.status === 'saving' ? 'Committing...' : 'Synced'}</span>
                    </div>
                 </div>
                 <div className="h-10 w-px bg-white/10" />
                 <div className="flex flex-col items-end">
                   <span className="text-[8px] font-black text-white/20 uppercase tracking-widest mb-0.5">Last Sync Time</span>
                   <span className="text-[11px] font-mono text-white/60">{syncState.lastSaved ? new Date(syncState.lastSaved).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : 'Establishing...'}</span>
                 </div>
              </div>
            </div>
        </div>
      </footer>
    </div>
  );
};

export default App;
