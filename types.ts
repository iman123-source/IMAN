
export interface User {
  id: string;
  name: string;
  email: string;
  password?: string;
}

export interface Comment {
  id: string;
  text: string;
  timestamp: number;
}

export interface WeeklyEntry {
  id: string;
  weekLabel: string;
  count: number;
}

export enum WorkStatus {
  WIP = 'Works in Progress',
  DELAYED = 'Delayed',
  COMPLETED = 'Completed'
}

export type SystemStatus = 'complete' | 'incomplete' | 'na';

export interface MaterialPayment {
  id: string;
  amount: number;
  date: string;
  note: string;
}

export interface Operative {
  id: string;
  name: string;
  dayRate: number;
}

export interface LabourEntry {
  id: string;
  operativeId: string;
  operativeName: string;
  date: string;
  hours: number;
  hourlyRate: number;
  amount: number;
}

export interface Salary {
  id: string;
  name: string;
  role: string;
  monthlyAmount: number;
}

export interface Vehicle {
  id: string;
  name: string;
  insuranceMonthly: number;
  rentalWeekly: number;
  fuelMonthly: number;
}

export interface FixedCosts {
  salaries: Salary[];
  vehicles: Vehicle[];
}

export interface SyncState {
  lastSaved: number | null;
  status: 'idle' | 'saving' | 'saved' | 'error';
  lastEditedBy?: string;
}

export interface Job {
  id: string;
  name: string;
  total: number;
  material: number; 
  labour: number; 
  startDate?: string;
  endDate?: string;
  targetDate?: string;
  workProgress?: number; 
  comments?: Comment[];
  status?: WorkStatus;
  materialPayments?: MaterialPayment[];
  labourEntries?: LabourEntry[];
  windows?: SystemStatus;
  gas?: SystemStatus;
  electrics?: SystemStatus;
  asbestos?: SystemStatus;
}

export enum JobStatus {
  AMAZING = 'AMAZING',
  STABLE = 'STABLE',
  ATTENTION = 'NEEDS ATTENTION',
  CRITICAL = 'CRITICAL'
}

export interface StatusMetadata {
  label: string;
  className: string;
  color: string;
}

export interface AIAnalysis {
  summary: string;
  riskAssessment: string;
  recommendations: string[];
}
