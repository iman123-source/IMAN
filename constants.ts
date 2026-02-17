
import { JobStatus, StatusMetadata, WeeklyEntry, WorkStatus, Operative, FixedCosts } from './types';

export const OPERATIVES: Operative[] = [
  { id: 'op1', name: 'Amr', dayRate: 130 },
  { id: 'op2', name: 'Salem', dayRate: 150 },
  { id: 'op3', name: 'Michael F', dayRate: 170 },
  { id: 'op4', name: 'Pawel', dayRate: 270 },
  { id: 'op5', name: 'Bart', dayRate: 270 },
  { id: 'op6', name: 'Samat', dayRate: 230 },
  { id: 'op7', name: 'Abdel karim', dayRate: 220 },
  { id: 'op8', name: 'Mohammed', dayRate: 220 },
  { id: 'op9', name: 'Ivan', dayRate: 160 },
  { id: 'op10', name: 'Sofyan', dayRate: 120 },
  { id: 'op11', name: 'Billal', dayRate: 140 },
  { id: 'op12', name: 'Michael G', dayRate: 160 },
  { id: 'op13', name: 'Ata', dayRate: 150 },
  { id: 'op14', name: 'Arya', dayRate: 120 },
  { id: 'op15', name: 'Michael B', dayRate: 100 },
  { id: 'op16', name: 'Conna', dayRate: 100 },
];

export const STATUS_MAP: Record<JobStatus, StatusMetadata> = {
  [JobStatus.AMAZING]: {
    label: 'AMAZING',
    className: 'bg-[#7CFF00] text-black',
    color: '#7CFF00'
  },
  [JobStatus.STABLE]: {
    label: 'STABLE',
    className: 'bg-[#4da3ff] text-white',
    color: '#4da3ff'
  },
  [JobStatus.ATTENTION]: {
    label: 'NEEDS ATTENTION',
    className: 'bg-[#ffb300] text-black',
    color: '#ffb300'
  },
  [JobStatus.CRITICAL]: {
    label: 'CRITICAL',
    className: 'bg-[#ff3b3b] text-white',
    color: '#ff3b3b'
  }
};

export const INITIAL_FIXED_COSTS: FixedCosts = {
  salaries: [
    { id: 's1', name: 'Staff Member 1', role: 'Operations Manager', monthlyAmount: 3500 },
    { id: 's2', name: 'Staff Member 2', role: 'Senior Admin', monthlyAmount: 2800 },
    { id: 's3', name: 'Staff Member 3', role: 'Finance Coordinator', monthlyAmount: 2500 },
    { id: 's4', name: 'Staff Member 4', role: 'Support Staff 1', monthlyAmount: 1800 },
    { id: 's5', name: 'Staff Member 5', role: 'Support Staff 2', monthlyAmount: 1800 },
  ],
  vehicles: [
    { id: 'v1', name: 'Van 01 (Ford Transit)', insuranceMonthly: 120, rentalWeekly: 180, fuelMonthly: 400 },
    { id: 'v2', name: 'Van 02 (Ford Transit)', insuranceMonthly: 120, rentalWeekly: 180, fuelMonthly: 400 },
    { id: 'v3', name: 'Van 03 (VW Crafter)', insuranceMonthly: 140, rentalWeekly: 210, fuelMonthly: 450 },
    { id: 'v4', name: 'Van 04 (Peugeot Expert)', insuranceMonthly: 110, rentalWeekly: 165, fuelMonthly: 350 },
    { id: 'v5', name: 'Van 05 (Mercedes Sprinter)', insuranceMonthly: 160, rentalWeekly: 240, fuelMonthly: 500 },
    { id: 'v6', name: 'Support Car (Toyota)', insuranceMonthly: 80, rentalWeekly: 120, fuelMonthly: 200 },
  ]
};

export const INITIAL_JOBS = [
  { 
    id: '1', 
    name: 'Westminster Renovation', 
    total: 15000, 
    material: 0, 
    labour: 0, 
    startDate: '2024-01-15', 
    targetDate: '2024-04-20', 
    endDate: '2024-05-01', 
    workProgress: 85, 
    status: WorkStatus.WIP, 
    windows: 'complete', 
    gas: 'complete', 
    electrics: 'incomplete',
    materialPayments: [],
    labourEntries: []
  },
  { 
    id: '2', 
    name: 'Soho Loft Fit-out', 
    total: 8000, 
    material: 0, 
    labour: 0, 
    startDate: '2024-02-01', 
    targetDate: '2024-03-15', 
    endDate: '2024-04-01', 
    workProgress: 10, 
    status: WorkStatus.DELAYED, 
    asbestos: 'complete',
    gas: 'na',
    materialPayments: [],
    labourEntries: []
  }
];

export const INITIAL_WEEKLY_DATA: WeeklyEntry[] = [
  { id: 'w1', weekLabel: 'Week 12', count: 4 },
  { id: 'w2', weekLabel: 'Week 13', count: 6 },
  { id: 'w3', weekLabel: 'Week 14', count: 5 }
];
