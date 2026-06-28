import React, { useState, useEffect, useMemo } from 'react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  Legend, 
  ResponsiveContainer, 
  CartesianGrid,
  Cell,
  LabelList
} from 'recharts';
import { 
  TrendingUp, 
  Award, 
  ShoppingBag, 
  Users, 
  CheckCircle2, 
  AlertCircle, 
  Calendar, 
  SlidersHorizontal, 
  Sparkles, 
  Clock, 
  X, 
  FileText, 
  DollarSign, 
  ArrowUpRight,
  TrendingDown,
  Percent,
  Check,
  Printer
} from 'lucide-react';
import { Driver, FortnightlyLedgerRecord } from '../types';
import { DRIVER_ROUTE_MAPPING, isCopav } from './FortnightlyPayments';

// Default pricing structure fallback
const TARIFS_FALLBACK: Record<string, { standard: number; nonStandard: number }> = {
  'JEZ - BTN': { standard: 5.00, nonStandard: 10.00 },
  'DELMIRO': { standard: 3.50, nonStandard: 7.00 },
  'MTG': { standard: 3.50, nonStandard: 7.00 },
  'CANINDE': { standard: 5.00, nonStandard: 10.00 },
  'FABIO': { standard: 2.50, nonStandard: 4.00 },
  'OPERACIONAL': { standard: 2.50, nonStandard: 4.00 },
  'FELIPE - EXTRA': { standard: 2.50, nonStandard: 4.00 },
  'JEREMOABO': { standard: 5.00, nonStandard: 10.00 },
  'EXTRA 01': { standard: 2.50, nonStandard: 4.00 },
  'PARICONHA': { standard: 5.00, nonStandard: 10.00 },
  'AGUA BRANCA': { standard: 5.00, nonStandard: 10.00 },
  'GLORIA': { standard: 5.00, nonStandard: 10.00 },
  'SANTA BRIGIDA': { standard: 5.00, nonStandard: 10.00 },
  'JATOBA': { standard: 5.00, nonStandard: 10.00 },
  'PETROLANDIA': { standard: 5.00, nonStandard: 10.00 },
  'TACARATU': { standard: 5.00, nonStandard: 10.00 },
  'COPAV - FIORINO': { standard: 6.00, nonStandard: 6.00 }
};

// Driver metrics multiplier dictionary to simulate highly accurate history weights
const HISTORICAL_WEIGHTS: Record<string, { standard: number; nonStandard: number; occurrences: number; pending: number }> = {
  'JEZ - BTN': { standard: 450, nonStandard: 8, occurrences: 4, pending: 0 },
  'OPERACIONAL': { standard: 50, nonStandard: 2, occurrences: 1, pending: 0 },
  'FELIPE - EXTRA': { standard: 140, nonStandard: 6, occurrences: 2, pending: 0 },
  'DELMIRO': { standard: 145, nonStandard: 8, occurrences: 5, pending: 0 },
  'MTG': { standard: 84, nonStandard: 3, occurrences: 1, pending: 0 },
  'CANINDE': { standard: 52, nonStandard: 4, occurrences: 1, pending: 0 },
  'FABIO': { standard: 1350, nonStandard: 29, occurrences: 20, pending: 0 },
  'JEREMOABO': { standard: 42, nonStandard: 1, occurrences: 0, pending: 0 },
  'EXTRA 01': { standard: 68, nonStandard: 3, occurrences: 2, pending: 0 },
  'PARICONHA': { standard: 34, nonStandard: 2, occurrences: 1, pending: 0 },
  'AGUA BRANCA': { standard: 45, nonStandard: 5, occurrences: 1, pending: 0 },
  'GLORIA': { standard: 90, nonStandard: 7, occurrences: 2, pending: 0 },
  'SANTA BRIGIDA': { standard: 38, nonStandard: 4, occurrences: 0, pending: 0 },
  'JATOBA': { standard: 27, nonStandard: 2, occurrences: 1, pending: 0 },
  'PETROLANDIA': { standard: 64, nonStandard: 5, occurrences: 1, pending: 0 },
  'TACARATU': { standard: 14, nonStandard: 1, occurrences: 0, pending: 0 },
  'COPAV - FIORINO': { standard: 350, nonStandard: 4200, occurrences: 4, pending: 0 },
};

const MONTH_NAMES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

interface ManagerialDashboardProps {
  drivers: Driver[];
  deliveries: any[];
  selectedYear?: number;
  setSelectedYear?: (y: number) => void;
  selectedMonth?: number;
  setSelectedMonth?: (m: number) => void;
  selectedFortnight?: 1 | 2;
  setSelectedFortnight?: (f: 1 | 2) => void;
}

export default function ManagerialDashboard({ 
  drivers, 
  deliveries,
  selectedYear: propYear,
  setSelectedYear: propSetYear,
  selectedMonth: propMonth,
  setSelectedMonth: propSetMonth,
  selectedFortnight: propFortnight,
  setSelectedFortnight: propSetFortnight
}: ManagerialDashboardProps) {
  // Calendar states fallbacks
  const [localYear, setLocalYear] = useState<number>(2026);
  const [localMonth, setLocalMonth] = useState<number>(5); // June (0-based)
  const [localFortnight, setLocalFortnight] = useState<1 | 2>(1);

  const selectedYear = propYear !== undefined ? propYear : localYear;
  const setSelectedYear = propSetYear !== undefined ? propSetYear : setLocalYear;
  const selectedMonth = propMonth !== undefined ? propMonth : localMonth;
  const setSelectedMonth = propSetMonth !== undefined ? propSetMonth : setLocalMonth;
  const selectedFortnight = propFortnight !== undefined ? propFortnight : localFortnight;
  const setSelectedFortnight = propSetFortnight !== undefined ? propSetFortnight : setLocalFortnight;

  const [periodType, setPeriodType] = useState<'15_days' | 'month'>('15_days');

  // Ledger state loaded from shared local storage key
  const [ledger, setLedger] = useState<Record<string, FortnightlyLedgerRecord>>({});

  // Dynamic Driver/Courier aliases and default name mappings editable on-the-fly
  const [driverMappings] = useState<Record<string, { routeAlias: string; defaultName: string; pix?: string; phone?: string }>>(() => {
    const saved = localStorage.getItem('jadlog_driver_route_mappings');
    return saved ? JSON.parse(saved) : DRIVER_ROUTE_MAPPING;
  });

  const [customCouriers] = useState<Array<{ id: string; name: string; phone?: string; pix?: string; vehicle?: string }>>(() => {
    const saved = localStorage.getItem('jadlog_custom_couriers');
    return saved ? JSON.parse(saved) : [];
  });

  // Track excluded/deleted card IDs across sessions to keep dashboard sync'd
  const [deletedCouriers] = useState<string[]>(() => {
    const saved = localStorage.getItem('jadlog_deleted_couriers');
    return saved ? JSON.parse(saved) : [];
  });

  // State to toggle between the Standard absolute penalty model or the Fair logistics rate model
  const [rankingModel, setRankingModel] = useState<'standard' | 'logistics_fair'>(() => {
    const saved = localStorage.getItem('jadlog_ranking_model');
    return saved === 'standard' ? 'standard' : 'logistics_fair'; // Default to fair logistics model
  });

  const handleToggleRankingModel = (model: 'standard' | 'logistics_fair') => {
    setRankingModel(model);
    localStorage.setItem('jadlog_ranking_model', model);
  };

  // State for active view (dashboard overview vs pdf_presentation landscape report)
  const [activeSubView, setActiveSubView] = useState<'dashboard' | 'pdf_presentation'>('dashboard');
  const [printLayout, setPrintLayout] = useState<'both' | 'separated' | 'chart1_only' | 'chart2_only'>('separated');
  const [isInIframe, setIsInIframe] = useState(false);
  useEffect(() => {
    try {
      setIsInIframe(window.self !== window.top);
    } catch (e) {
      setIsInIframe(true);
    }
  }, []);

  // Merged standard and dynamically added couriers matching FortnightlyPayments logic
  const allCouriers = useMemo(() => {
    const standard = drivers.map(d => {
      const mapping = driverMappings[d.id] || {};
      return {
        id: d.id,
        name: mapping.defaultName || d.name,
        phone: mapping.phone || d.phone || '',
        pix: mapping.pix || '',
        vehicle: d.vehicle,
        isCustom: false,
      };
    });
    const custom = customCouriers.map(c => {
      const mapping = driverMappings[c.id] || {};
      return {
        id: c.id,
        name: mapping.defaultName || c.name,
        phone: mapping.phone || c.phone || '(75) 99888-7777',
        pix: mapping.pix || c.pix || '',
        vehicle: c.vehicle || 'Moto',
        isCustom: true,
      };
    });
    return [...standard, ...custom].filter(c => !deletedCouriers.includes(c.id));
  }, [drivers, customCouriers, driverMappings, deletedCouriers]);

  // Clean up any stale/fake records from January to May (indices 0 to 4) on mount, matching user intent to keep them zeroed.
  useEffect(() => {
    const saved = localStorage.getItem('jadlog_fortnightly_ledger');
    if (saved) {
      const loaded: Record<string, FortnightlyLedgerRecord> = JSON.parse(saved);
      let modified = false;

      // Only perform the purge of pre-seeded/mock data once as a migration
      const hasPurgedMocks = localStorage.getItem('jadlog_ledger_mock_cleaned_v2');
      if (!hasPurgedMocks) {
        // Purge records from January to May (months 0 to 4)
        Object.keys(loaded).forEach((key) => {
          const rec = loaded[key];
          if (rec && typeof rec.month === 'number' && rec.month < 5) {
            delete loaded[key];
            modified = true;
          }
        });
        localStorage.setItem('jadlog_ledger_mock_cleaned_v2', 'true');
      }

      if (modified) {
        localStorage.setItem('jadlog_fortnightly_ledger', JSON.stringify(loaded));
        setLedger(loaded);
      }
    }
  }, []);

  // Handle syncing on focus/storage event to stay updated
  useEffect(() => {
    const handleStorageChange = () => {
      const saved = localStorage.getItem('jadlog_fortnightly_ledger');
      if (saved) {
        setLedger(JSON.parse(saved));
      }
    };
    handleStorageChange(); // Load immediately on mount
    window.addEventListener('storage', handleStorageChange);
    // Also sync on window focus to capture edits made in other tabs or parts of the app
    window.addEventListener('focus', handleStorageChange);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('focus', handleStorageChange);
    };
  }, []);

  // Filter records for the CURRENT active period selected by user
  const currentPeriodRecords = useMemo(() => {
    const records: FortnightlyLedgerRecord[] = [];
    allCouriers.forEach(drv => {
      if (periodType === '15_days') {
        const key = `${selectedYear}-${selectedMonth}-${selectedFortnight}-${drv.id}`;
        if (ledger[key]) {
          records.push(ledger[key]);
        }
      } else {
        // Full Month: sum Fortnite 1 and Fortnite 2 records
        const key1 = `${selectedYear}-${selectedMonth}-1-${drv.id}`;
        const key2 = `${selectedYear}-${selectedMonth}-2-${drv.id}`;
        const rec1 = ledger[key1];
        const rec2 = ledger[key2];

        if (rec1 || rec2) {
          records.push({
            id: `month-sum-${selectedYear}-${selectedMonth}-${drv.id}`,
            year: selectedYear,
            month: selectedMonth,
            fortnight: 1, // irrelevant for month
            driverId: drv.id,
            standardCount: (rec1?.standardCount || 0) + (rec2?.standardCount || 0),
            nonStandardCount: (rec1?.nonStandardCount || 0) + (rec2?.nonStandardCount || 0),
            occurrencesCount: (rec1?.occurrencesCount || 0) + (rec2?.occurrencesCount || 0),
            pendingCount: (rec1?.pendingCount || 0) + (rec2?.pendingCount || 0),
            isPaid: !!(rec1?.isPaid && rec2?.isPaid),
            payoutAmount: (rec1?.payoutAmount || 0) + (rec2?.payoutAmount || 0),
            debitAdvance: (rec1?.debitAdvance || 0) + (rec2?.debitAdvance || 0),
            debitFuel: (rec1?.debitFuel || 0) + (rec2?.debitFuel || 0),
            debitLoss: (rec1?.debitLoss || 0) + (rec2?.debitLoss || 0),
          });
        }
      }
    });
    return records;
  }, [ledger, allCouriers, selectedYear, selectedMonth, selectedFortnight, periodType]);

  // Calculate high-level managerial statistics totals
  const totals = useMemo(() => {
    let totalCompleted = 0;
    let standardCompleted = 0;
    let nonStandardCompleted = 0;
    let totalPaidValue = 0;
    let totalOccurrences = 0;
    let totalPendings = 0;
    let totalDebitsValue = 0;

    currentPeriodRecords.forEach(rec => {
      standardCompleted += rec.standardCount;
      const isFiorino = (driverMappings[rec.driverId]?.routeAlias || '') === 'COPAV - FIORINO';
      
      // In Copav, nonStandard is a monetary contribution, else it is standard deliveries count
      if (isFiorino) {
        // nonStandard value counted as add-on
      } else {
        nonStandardCompleted += rec.nonStandardCount;
      }
      
      totalCompleted += rec.standardCount + (isFiorino ? 0 : rec.nonStandardCount);
      totalPaidValue += rec.payoutAmount;
      totalOccurrences += rec.occurrencesCount;
      totalPendings += rec.pendingCount;
      totalDebitsValue += (rec.debitAdvance || 0) + (rec.debitFuel || 0) + (rec.debitLoss || 0);
    });

    const activeDriversCount = currentPeriodRecords.length || 1;
    const avgDeliveriesPerCourier = parseFloat((totalCompleted / activeDriversCount).toFixed(1));

    return {
      totalCompleted,
      standardCompleted,
      nonStandardCompleted,
      totalPaidValue,
      totalOccurrences,
      totalPendings,
      totalDebitsValue,
      activeDriversCount,
      avgDeliveriesPerCourier
    };
  }, [currentPeriodRecords, driverMappings]);

  // Prepare COMPARATIVE MONTHLY DATA comparing same period types across previous months (Jan - June 2026)
  const monthlyComparisonData = useMemo(() => {
    const list = [0, 1, 2, 3, 4, 5]; // past months
    return list.map(mIndex => {
      let deliveriesCount = 0;
      let payoutSum = 0;

      allCouriers.forEach(drv => {
        if (periodType === '15_days') {
          const key = `${selectedYear}-${mIndex}-${selectedFortnight}-${drv.id}`;
          const rec = ledger[key];
          if (rec) {
            deliveriesCount += rec.standardCount;
            payoutSum += rec.payoutAmount;
          }
        } else {
          // Both fortnights
          const key1 = `${selectedYear}-${mIndex}-1-${drv.id}`;
          const key2 = `${selectedYear}-${mIndex}-2-${drv.id}`;
          const rec1 = ledger[key1];
          const rec2 = ledger[key2];

          if (rec1) {
            deliveriesCount += rec1.standardCount;
            payoutSum += rec1.payoutAmount;
          }
          if (rec2) {
            deliveriesCount += rec2.standardCount;
            payoutSum += rec2.payoutAmount;
          }
        }
      });

      return {
        monthKey: mIndex,
        mName: MONTH_NAMES[mIndex].substring(0, 3) + '.', // e.g. "Jun."
        'Entregas Concluídas': deliveriesCount,
        'Valores a Pagar (R$)': parseFloat(payoutSum.toFixed(2)),
      };
    });
  }, [ledger, allCouriers, selectedYear, selectedFortnight, periodType, driverMappings]);

  // Courier performance statistics sorted for ranking + detail grid
  const courierPerformanceList = useMemo(() => {
    return currentPeriodRecords.map(rec => {
      const driver = allCouriers.find(d => d.id === rec.driverId) || {
        name: driverMappings[rec.driverId]?.defaultName || rec.driverId,
        avatar: rec.driverId.substring(0, 2).toUpperCase()
      };
      
      const route = driverMappings[rec.driverId]?.routeAlias || 'EXTRA';
      const debits = (rec.debitAdvance || 0) + (rec.debitFuel || 0) + (rec.debitLoss || 0);
      const totalDeliveries = rec.standardCount;

      let efficiency = 100;
      
      if (rankingModel === 'standard') {
        // Balanced performance Score (SLA): Calculated proportionally.
        // - Each manual Occurrence counts as -5% SLA
        // - Each Pending counts as -2% SLA
        // - Each R$ of Multa/Extravio (debitLoss) counts as -0.20% SLA (e.g. R$100 multa = -20% SLA)
        if (rec.standardCount > 0 || rec.nonStandardCount > 0 || rec.occurrencesCount > 0 || rec.pendingCount > 0 || (rec.debitLoss || 0) > 0) {
          const occurrencesPenalty = rec.occurrencesCount * 5;
          const pendingPenalty = rec.pendingCount * 2;
          const finesPenalty = (rec.debitLoss || 0) * 0.20;
          efficiency = Math.max(0, Math.min(100, Math.round(100 - (occurrencesPenalty + pendingPenalty + finesPenalty))));
        }
      } else {
        // 'logistics_fair' - Volume-Weighted Fair Model
        // Penalties are proportional to the actual work done (errors relative to total deliveries volume)
        if (totalDeliveries > 0 || rec.occurrencesCount > 0 || rec.pendingCount > 0 || (rec.debitLoss || 0) > 0) {
          const denomDeliveries = Math.max(1, totalDeliveries);
          const denomPayout = Math.max(1, rec.payoutAmount);

          // Proportional occurrence frequency (e.g. 1% error rate on deliveries)
          const occurrencesRate = (rec.occurrencesCount / denomDeliveries) * 100;
          // Proportional pending rate
          const pendingRate = (rec.pendingCount / denomDeliveries) * 100;
          // Proportional financial loss index (loss compared to gross revenues/payouts)
          const lossRate = ((rec.debitLoss || 0) / denomPayout) * 100;

          // Scaled penalty weights:
          // Occurrence Rate: 1% occurrences relative to volume = -10.0% SLA
          // Pending Rate: 1% pendings relative to volume = -3.0% SLA
          // Loss Index: 1% of total earnings lost due to fines = -1.5% SLA
          const occurrencesPenalty = occurrencesRate * 10;
          const pendingPenalty = pendingRate * 3;
          const finesPenalty = lossRate * 1.5;

          efficiency = Math.max(0, Math.min(100, Math.round(100 - (occurrencesPenalty + pendingPenalty + finesPenalty))));
        }
      }

      return {
        driverId: rec.driverId,
        driverName: driver.name,
        avatar: (driver as any).avatar || driver.name.substring(0,2).toUpperCase(),
        route,
        efficiency,
        standardCount: rec.standardCount,
        nonStandardCount: rec.nonStandardCount,
        totalDeliveries,
        occurrences: rec.occurrencesCount,
        pending: rec.pendingCount,
        debits,
        debitsFormattedInBrl: `R$ ${debits.toFixed(2)}`,
        payout: rec.payoutAmount,
        payoutFormatted: `R$ ${rec.payoutAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
      };
    });
  }, [currentPeriodRecords, allCouriers, driverMappings, rankingModel]);

  // Ranking of courier of selected period ordered by Efficiency rating & total deliveries
  const courierRanking = useMemo(() => {
    return [...courierPerformanceList].sort((a, b) => {
      if (b.efficiency !== a.efficiency) {
        return b.efficiency - a.efficiency;
      }
      return b.totalDeliveries - a.totalDeliveries;
    });
  }, [courierPerformanceList]);

  // Courier performance chart data mapping to abbreviated horizontal labels
  const courierChartData = useMemo(() => {
    return courierPerformanceList.map(item => {
      // Shorten long naming for crisp charts labeling
      const shortName = item.driverName.split(' ')[0] + 
        (item.driverName.split(' ')[1] ? ' ' + item.driverName.split(' ')[1][0] + '.' : '');
      return {
        name: shortName,
        'Ocorrências': item.occurrences,
        'Pendentes': item.pending,
        'Multas / Descontos (R$)': item.debits,
      };
    });
  }, [courierPerformanceList]);

  // A4 Chart 1 Data: Total deliveries per month across the year for comparative analysis
  const chart1Data = useMemo(() => {
    // Show months Jan-Jun (indices 0 to 5)
    const list = [0, 1, 2, 3, 4, 5];
    return list.map(mIndex => {
      let deliveriesCount = 0;

      allCouriers.forEach(drv => {
        if (periodType === '15_days') {
          // Compare active fortnight across all months
          const key = `${selectedYear}-${mIndex}-${selectedFortnight}-${drv.id}`;
          const rec = ledger[key];
          if (rec) {
            deliveriesCount += rec.standardCount;
          }
        } else {
          // Full Month comparisons: sum of first and second fortnights for all couriers
          const key1 = `${selectedYear}-${mIndex}-1-${drv.id}`;
          const key2 = `${selectedYear}-${mIndex}-2-${drv.id}`;
          const rec1 = ledger[key1];
          const rec2 = ledger[key2];

          if (rec1) {
            deliveriesCount += rec1.standardCount;
          }
          if (rec2) {
            deliveriesCount += rec2.standardCount;
          }
        }
      });

      return {
        name: MONTH_NAMES[mIndex].substring(0, 3) + '.', // short name for elegant axis labels, e.g., "Jan.", "Fev."
        'Pacotes': deliveriesCount
      };
    });
  }, [ledger, allCouriers, selectedYear, selectedFortnight, periodType, driverMappings]);

  // A4 Chart 2 Data: Top 5 best couriers/routes based on SLA efficiency
  const chart2Data = useMemo(() => {
    return [...courierPerformanceList]
      .sort((a, b) => b.efficiency - a.efficiency || b.totalDeliveries - a.totalDeliveries)
      .slice(0, 5)
      .map((item, idx) => ({
        name: item.route,
        'SLA %': item.efficiency,
        driver: item.driverName,
        entregas: item.totalDeliveries,
        rank: idx + 1
      }));
  }, [courierPerformanceList]);

  if (activeSubView === 'pdf_presentation') {
    const renderPageContent = (layoutMode: 'both' | 'chart1_only' | 'chart2_only') => {
      return (
        <>
          {/* Header section (strictly elegant) */}
          <div className="border-b-[3px] border-black pb-4 mb-4 flex justify-between items-end">
            <div className="flex items-center gap-3">
              <div className="bg-black text-white px-3 py-1.5 font-sans font-black text-base flex items-center tracking-tight leading-none">
                <span>JAD</span>
                <span className="text-[#e31a1a]">LOG</span>
              </div>
              <div>
                <h1 className="text-base font-black text-slate-900 tracking-tight uppercase leading-snug">
                  RELATÓRIO EXECUTIVO — DESEMPENHO OPERACIONAL
                </h1>
                <p className="text-[10px] text-slate-500 font-extrabold tracking-normal uppercase leading-none">
                  Análise e Auditoria Consolidada de Distribuição Secundária • Redes Parceiras
                </p>
              </div>
            </div>

            <div className="text-right">
              <span className="text-[9px] font-black text-slate-400 block uppercase tracking-wider">Período de Referência</span>
              <span className="text-sm font-black text-[#e31a1a] uppercase text-nowrap">
                {MONTH_NAMES[selectedMonth]} {selectedYear}
              </span>
              <span className="text-[10px] font-bold text-slate-700 block font-mono">
                {periodType === '15_days' ? `(Série Quinzenal: ${selectedFortnight}ª Quinzena)` : '(Série Mensal Integrada)'}
              </span>
            </div>
          </div>

          {/* Quick KPI Summary Bar inside the Report */}
          <div className="grid grid-cols-4 gap-3 bg-slate-50 border border-slate-200 rounded-2xl p-3 mb-6 print:bg-transparent print:border-2 print:border-black">
            <div className="text-center border-r border-slate-200 last:border-0 print:border-black">
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Volume Total Concluído</span>
              <span className="text-base font-black text-slate-900 font-mono">
                {totals.totalCompleted.toLocaleString('pt-BR')} <span className="text-[9px] font-sans font-extrabold text-slate-500">pacotes</span>
              </span>
            </div>
            
            <div className="text-center border-r border-slate-200 last:border-0 print:border-black">
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Repasse Líquido Programado</span>
              <span className="text-base font-black text-slate-900 font-mono">
                R$ {totals.totalPaidValue.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>

            <div className="text-center border-r border-slate-200 last:border-0 print:border-black">
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">SLA Médio do Período</span>
              <span className="text-base font-black text-emerald-700 font-mono">
                {Math.round(courierPerformanceList.reduce((acc, curr) => acc + curr.efficiency, 0) / (courierPerformanceList.length || 1))}% SLA
              </span>
            </div>

            <div className="text-center">
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Ocorrências / Pendências</span>
              <span className="text-base font-black text-slate-900 font-mono">
                {totals.totalOccurrences} <span className="text-[10px] text-slate-400 font-bold">/</span> {totals.totalPendings} <span className="text-[9px] font-sans font-extrabold text-[#e31a1a]">incid.</span>
              </span>
            </div>
          </div>

          {/* Charts Section: Designed to lay out perfectly side-by-side in landscape view */}
          <div className={`grid gap-6 items-stretch print-grid flex-1 ${layoutMode === 'both' ? 'grid-cols-1 md:grid-cols-2' : 'grid-cols-1'}`}>
            {/* Chart Column 1: Total volume completed per month */}
            {(layoutMode === 'both' || layoutMode === 'chart1_only') && (
              <div className="bg-white border border-slate-200 rounded-2xl p-4 flex flex-col justify-between print:border-2 print:border-black">
                <div className="mb-2">
                  <span className="text-[9px] font-black text-slate-450 uppercase tracking-wider block leading-none">Gráfico 1 • Comparação Mensal</span>
                  <h3 className="text-xs font-bold text-slate-800 tracking-tight mt-0.5">
                    Volume Total de Entregas por Mês
                  </h3>
                  <p className="text-[10px] text-slate-400">Total acumulado de pacotes entregues no mês (soma total de todos os cards)</p>
                </div>

                <div className="h-[260px] print-chart w-full my-auto">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chart1Data} margin={{ top: 25, right: 15, left: -15, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                      <XAxis 
                        dataKey="name" 
                        tick={{ fill: '#475569', fontSize: 9, fontWeight: 800 }} 
                        axisLine={false} 
                        tickLine={false} 
                      />
                      <YAxis 
                        domain={[0, (dataMax: number) => Math.ceil(dataMax * 1.15)]}
                        tickFormatter={(val: any) => val.toLocaleString('pt-BR')}
                        tick={{ fill: '#64748b', fontSize: 9 }} 
                        axisLine={false} 
                        tickLine={false} 
                      />
                      <Tooltip 
                        contentStyle={{ background: '#0f172a', border: 'none', borderRadius: '8px', color: '#fff', fontSize: '10px' }}
                        formatter={(value: any) => [`${value.toLocaleString('pt-BR')} pacotes`, 'Volume Total']}
                      />
                      <Bar 
                        dataKey="Pacotes" 
                        fill="#0f172a" 
                        radius={[4, 4, 0, 0]}
                        maxBarSize={layoutMode === 'chart1_only' ? 68 : 36}
                        isAnimationActive={false}
                      >
                        <LabelList 
                          dataKey="Pacotes" 
                          position="top" 
                          formatter={(v: any) => v.toLocaleString('pt-BR')}
                          fill="#000000"
                          style={{ fill: '#0a0a0c', fontSize: layoutMode === 'chart1_only' ? 11 : 9, fontWeight: 900 }} 
                        />
                        {chart1Data.map((entry, index) => (
                          <Cell 
                            key={`cell-${index}`} 
                            fill={index === selectedMonth ? '#e31a1a' : '#475569'} 
                          />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}

            {/* Chart Column 2: Top 5 Best Couriers Ranking */}
            {(layoutMode === 'both' || layoutMode === 'chart2_only') && (
              <div className="bg-white border border-slate-200 rounded-2xl p-4 flex flex-col justify-between print:border-2 print:border-black">
                <div className="mb-2">
                  <span className="text-[9px] font-black text-slate-450 uppercase tracking-wider block leading-none">Gráfico 2 • Ranqueamento</span>
                  <h3 className="text-xs font-bold text-slate-800 tracking-tight mt-0.5">
                    Top 5 Melhores Entregadores (Posições de Destaque SLA)
                  </h3>
                  <p className="text-[10px] text-slate-400">Ganhadores do pódio classificados pelo SLA % do período selecionado</p>
                </div>

                <div className="h-[260px] print-chart w-full my-auto">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chart2Data} margin={{ top: 20, right: 10, left: -25, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                      <XAxis 
                        dataKey="name" 
                        tick={{ fill: '#475569', fontSize: 9, fontWeight: 800 }} 
                        axisLine={false} 
                        tickLine={false} 
                      />
                      <YAxis domain={[0, 110]} tick={{ fill: '#64748b', fontSize: 9 }} axisLine={false} tickLine={false} />
                      <Tooltip 
                        contentStyle={{ background: '#0f172a', border: 'none', borderRadius: '8px', color: '#fff', fontSize: '10px' }}
                        formatter={(value: any, name: any, propsOnChart: any) => [`SLA: ${value}%`, `${propsOnChart.payload.driver} (${propsOnChart.payload.entregas} ent.)`]}
                      />
                      <Bar 
                        dataKey="SLA %" 
                        radius={[4, 4, 0, 0]}
                        maxBarSize={layoutMode === 'chart2_only' ? 68 : 38}
                        isAnimationActive={false}
                      >
                        <LabelList 
                          dataKey="SLA %" 
                          formatter={(val: any) => `${val}%`} 
                          position="top" 
                          fill="#000000"
                          style={{ fill: '#1e293b', fontSize: layoutMode === 'chart2_only' ? 11 : 10, fontWeight: 900 }} 
                        />
                        {chart2Data.map((entry, index) => {
                          // Podium Colors: Gold, Silver, Bronze, and elegant defaults
                          const colors = ['#d4af37', '#708090', '#b87333', '#1e293b', '#475569'];
                          return (
                            <Cell 
                              key={`cell-${index}`} 
                              fill={colors[index] || '#475569'} 
                            />
                          );
                        })}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}
          </div>

          {/* Print Signatures and Audit trail (for physical/PDF documents) */}
          <div className="grid grid-cols-2 gap-12 mt-6 pt-6 border-t border-dashed border-slate-350">
            <div className="text-center">
              <div className="h-px bg-slate-400 mx-auto w-48 mb-1" />
              <p className="text-[10px] font-black text-slate-700 uppercase">Conferido por (Auditoria e Controle)</p>
              <p className="text-[8px] text-slate-400">Data: ____/____/________</p>
            </div>

            <div className="text-center">
              <div className="h-px bg-slate-400 mx-auto w-48 mb-1" />
              <p className="text-[10px] font-black text-slate-700 uppercase">Aprovação (Diretoria Regional)</p>
              <p className="text-[8px] text-slate-400">Assinatura autorizada eletronicamente</p>
            </div>
          </div>

          {/* Document Footnote Metadata */}
          <div className="flex justify-between items-center mt-4 text-[8px] text-slate-400 border-t border-slate-100 pt-2 print:text-black">
            <span>Auditoria Jadlog • Emissão: {new Date().toLocaleDateString('pt-BR')} às {new Date().toLocaleTimeString('pt-BR')} (UTC-3)</span>
            <span>Jadlog S.A. © Todos os direitos reservados. Relatório Operacional Interno Conclaves de Ranqueamento.</span>
          </div>
        </>
      );
    };

    return (
      <div className="space-y-6 font-sans">
        {/* Custom landscape print CSS rule injected directly. Guaranteed encapsulation! */}
        <style dangerouslySetInnerHTML={{ __html: `
          @media print {
            /* Hide every element on the website */
            body * {
              visibility: hidden !important;
            }
            /* Show ONLY our printed presentation mock and its children */
            #a4-presentation-container, #a4-presentation-container *,
            .print-page, .print-page * {
              visibility: visible !important;
              color: #000000 !important;
            }
            #a4-presentation-container, .print-page {
              position: relative !important;
              width: 297mm !important;
              height: 200mm !important;
              max-width: 100% !important;
              max-height: 100% !important;
              margin: 0 !important;
              padding: 12mm 15mm !important;
              border: none !important;
              box-shadow: none !important;
              background: #ffffff !important;
              box-sizing: border-box !important;
              page-break-after: always !important;
              break-after: page !important;
              display: flex !important;
              flex-direction: column !important;
              justify-content: space-between !important;
            }
            .print-page:last-child {
              page-break-after: avoid !important;
              break-after: avoid !important;
            }
            .print\\:hidden {
              display: none !important;
              height: 0 !important;
              padding: 0 !important;
              margin: 0 !important;
            }
            @page {
              size: landscape;
              margin: 4mm;
            }
            /* Force side-by-side elements in print A4 or full page based on setup */
            .print-grid {
              display: grid !important;
              grid-template-columns: ${printLayout === 'both' ? 'repeat(2, minmax(0, 1fr))' : '1fr'} !important;
              gap: 2rem !important;
            }
            .print-chart {
              height: 380px !important;
            }
            .print-text-dark {
              color: #000000 !important;
            }
          }
        `}} />

        {/* Dynamic Controls Segment - Visible on Screen, Hidden on Print */}
        <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-5 print:hidden">
          <div className="space-y-1">
            <div className="flex items-center gap-1.5 text-[#e31a1a] font-extrabold text-xs uppercase tracking-wider">
              <Sparkles className="w-4 h-4 text-[#e31a1a]" />
              <span>Painel Executivo de Apresentação</span>
            </div>
            <h2 className="text-lg font-black text-slate-905 tracking-tight">
              Modo de Exportação e Apresentação A4 (PDF Paisagem)
            </h2>
            <p className="text-xs text-slate-500">
              Configure os filtros desejados. Esta tela simula perfeitamente uma folha A4 em formato Paisagem (Horizontal).
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 bg-slate-50 p-2.5 border border-slate-200 rounded-2xl shrink-0">
            {/* 15 Days vs Full Month Switcher */}
            <div className="flex bg-slate-200 p-0.5 rounded-xl gap-0.5">
              <button
                onClick={() => setPeriodType('15_days')}
                className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all cursor-pointer ${periodType === '15_days' ? 'bg-[#e31a1a] text-white shadow-xs' : 'text-slate-500 hover:text-slate-800'}`}
              >
                15 Dias
              </button>
              <button
                onClick={() => setPeriodType('month')}
                className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all cursor-pointer ${periodType === 'month' ? 'bg-[#e31a1a] text-white shadow-xs' : 'text-slate-500 hover:text-slate-800'}`}
              >
                Mensal
              </button>
            </div>

            {/* Calendars Selectors */}
            <div className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(Number(e.target.value))}
                className="text-xs font-bold text-slate-700 bg-white border border-slate-200 rounded-lg px-2 py-1 outline-orange-500 cursor-pointer"
              >
                {MONTH_NAMES.map((name, idx) => (
                  <option key={name} value={idx}>{name}</option>
                ))}
              </select>

              {periodType === '15_days' && (
                <select
                  value={selectedFortnight}
                  onChange={(e) => setSelectedFortnight(Number(e.target.value) as 1 | 2)}
                  className="text-xs font-bold text-orange-700 bg-white border border-slate-200 rounded-lg px-2 py-1 outline-orange-500 cursor-pointer"
                >
                  <option value={1}>1ª Qz. (1-15)</option>
                  <option value={2}>2ª Qz. (16-31)</option>
                </select>
              )}

              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(Number(e.target.value))}
                className="text-xs font-bold text-slate-700 bg-white border border-slate-200 rounded-lg px-2 py-1 outline-orange-500 cursor-pointer"
              >
                <option value={2026}>2026</option>
                <option value={2025}>2025</option>
              </select>
            </div>

            {/* Print Layout Selection Dropdown */}
            <div className="flex items-center gap-1">
              <select
                value={printLayout}
                onChange={(e) => setPrintLayout(e.target.value as 'both' | 'separated' | 'chart1_only' | 'chart2_only')}
                className="text-xs font-black text-slate-800 bg-amber-55 border border-amber-200 hover:bg-amber-100/80 rounded-lg px-2.5 py-1.5 outline-orange-500 cursor-pointer"
              >
                <option value="separated">Ambos (Um por Página)</option>
                <option value="both">Ambos (Lado a Lado)</option>
                <option value="chart1_only">Apenas Gráfico 1 (Histórico de Volumes)</option>
                <option value="chart2_only">Apenas Gráfico 2 (Top 5 SLA)</option>
              </select>
            </div>

            {/* Ranking Model Selection */}
            <select
              value={rankingModel}
              onChange={(e) => handleToggleRankingModel(e.target.value as 'standard' | 'logistics_fair')}
              className="text-xs font-black text-slate-700 bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 outline-orange-500 cursor-pointer"
            >
              <option value="logistics_fair">Taxa Diferencial Logístico (Justo)</option>
              <option value="standard">Dedução Estática Clássica</option>
            </select>

            <button
              onClick={() => window.print()}
              className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black rounded-xl shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              Imprimir / Salvar PDF
            </button>

            <button
              onClick={() => setActiveSubView('dashboard')}
              className="px-3 py-1.5 bg-slate-700 hover:bg-slate-800 text-white text-xs font-black rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
              Voltar
            </button>
          </div>
        </div>

        {isInIframe && (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-xs font-bold text-amber-900 flex items-center gap-3 print:hidden">
            <span className="bg-amber-100 text-amber-800 px-2 py-1 rounded-md text-[10px] uppercase font-black">Nota do Iframe</span>
            <p>Atalho Gerencial: Utilizando a visualização em Iframe do Editor. Para imprimir em tamanho original sem cortes, por favor clique no botão "Abrir em Nova Aba" localizado no painel superior direito.</p>
          </div>
        )}

        {/* Widescreen simulation of an A4 horizontal page (A4 layout matches 1.414 standard aspect ratio) */}
        <div className="flex justify-center bg-slate-100/50 p-1 md:p-4 rounded-3xl border border-slate-200/50 print:bg-white print:border-none print:p-0">
          {printLayout === 'separated' ? (
            <div className="flex flex-col gap-8 w-full max-w-[297mm] print:gap-0 print:block">
              {/* Page 1 (Chart 1 only) */}
              <div 
                id="a4-presentation-container"
                className="print-page bg-white border-2 border-black shadow-xl rounded-2xl p-6 md:p-8 min-h-[210mm] flex flex-col justify-between print:border-none print:shadow-none print:p-0 print:m-0"
              >
                {renderPageContent('chart1_only')}
              </div>
              {/* Page 2 (Chart 2 only) */}
              <div 
                className="print-page bg-white border-2 border-black shadow-xl rounded-2xl p-6 md:p-8 min-h-[210mm] flex flex-col justify-between print:border-none print:shadow-none print:p-0 print:m-0 print-page-break-before"
              >
                {renderPageContent('chart2_only')}
              </div>
            </div>
          ) : (
            <div 
              id="a4-presentation-container" 
              className="print-page bg-white border-2 border-black shadow-xl rounded-2xl p-6 md:p-8 w-full max-w-[297mm] min-h-[210mm] flex flex-col justify-between print:border-none print:shadow-none print:p-0 print:m-0"
            >
              {renderPageContent(printLayout as 'both' | 'chart1_only' | 'chart2_only')}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Premium Dashboard Header & Dynamic Periode Selectors */}
      <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-xs flex flex-col xl:flex-row xl:items-center justify-between gap-5 font-sans">
        <div>
          <div className="flex items-center gap-1.5 text-orange-600 font-extrabold text-xs uppercase tracking-wider">
            <Sparkles className="w-4 h-4 text-orange-500 shrink-0" />
            <span>Métricas Gerenciais Operacionais</span>
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 mt-1.5">
            <h2 className="text-xl font-black text-slate-900 leading-none">
              Painel Executivo de Desempenho
            </h2>
            <button
              id="btn-open-presentation-view"
              onClick={() => setActiveSubView('pdf_presentation')}
              className="text-white bg-slate-900 hover:bg-slate-800 font-sans font-black text-[10px] uppercase tracking-wider px-3.5 py-1.5 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 border border-slate-850 shadow-sm self-start"
              title="Visualizar gráficos formatados em folha paisagem A4 para geração de PDF de apresentação"
            >
              <Printer className="w-3.5 h-3.5 text-orange-500 shrink-0 animate-pulse" />
              <span>Gráficos e Apresentação A4</span>
            </button>
          </div>
          <p className="text-xs text-slate-500 mt-1 max-w-xl">
            Revise o acumulado de entregas, faturamento, custos com descontos, e ranqueamento de conformidade dos 15 entregadores.
          </p>
        </div>

        {/* Dynamic Controls Segment */}
        <div className="flex flex-wrap items-center gap-3 bg-slate-50 p-2 border border-slate-200 rounded-2xl shrink-0 self-start xl:self-auto">
          {/* 15 Days vs Full Month Switcher */}
          <div className="flex bg-slate-200/80 p-0.5 rounded-xl gap-0.5 shrink-0">
            <button
              onClick={() => setPeriodType('15_days')}
              className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all cursor-pointer ${periodType === '15_days' ? 'bg-white text-slate-850 shadow-xs' : 'text-slate-500 hover:text-slate-800'}`}
            >
              15 Dias
            </button>
            <button
              onClick={() => setPeriodType('month')}
              className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all cursor-pointer ${periodType === 'month' ? 'bg-white text-slate-850 shadow-xs' : 'text-slate-500 hover:text-slate-800'}`}
            >
              Mensal
            </button>
          </div>

          {/* Calendars Selectors */}
          <div className="flex items-center gap-1.5 shrink-0">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(Number(e.target.value))}
              className="text-xs font-bold text-slate-700 bg-white border border-slate-200 rounded-lg px-2 py-1 outline-orange-500"
            >
              {MONTH_NAMES.map((name, idx) => (
                <option key={name} value={idx}>{name}</option>
              ))}
            </select>

            {periodType === '15_days' && (
              <select
                value={selectedFortnight}
                onChange={(e) => setSelectedFortnight(Number(e.target.value) as 1 | 2)}
                className="text-xs font-bold text-orange-700 bg-white border border-slate-200 rounded-lg px-2 py-1 outline-orange-500"
              >
                <option value={1}>1ª Qz. (1 a 15)</option>
                <option value={2}>2ª Qz. (16 a 31)</option>
              </select>
            )}

            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              className="text-xs font-bold text-slate-700 bg-white border border-slate-200 rounded-lg px-2 py-1 outline-orange-500"
            >
              <option value={2026}>2026</option>
              <option value={2025}>2025</option>
            </select>
          </div>
        </div>
      </div>

      {/* KPI Metric Summary Grid Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1 */}
        <div className="bg-white border border-slate-200 rounded-3xl p-5 flex flex-col justify-between shadow-xs relative overflow-hidden group hover:shadow">
          <div className="flex justify-between items-start mb-3">
            <div>
              <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Total Entregas Concluídas</p>
              <h3 className="text-3xl font-black text-slate-850 mt-1.5 font-sans tracking-tight">
                {totals.totalCompleted.toLocaleString('pt-BR')}
              </h3>
            </div>
            <div className="bg-orange-50 text-orange-600 p-2.5 rounded-2xl border border-orange-100 flex items-center justify-center">
              <ShoppingBag className="w-5 h-5" />
            </div>
          </div>
          <div className="border-t border-dashed border-slate-100 pt-3 mt-1 flex justify-between items-center text-[11px] text-slate-500 font-medium">
            <span>Padrão: <b>{totals.standardCompleted}</b></span>
            <span>Estéreo/COPAV: <b>{totals.nonStandardCompleted}</b></span>
          </div>
        </div>

        {/* Metric 2 */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 flex flex-col justify-between shadow-sm relative overflow-hidden group">
          <div className="flex justify-between items-start mb-3">
            <div>
              <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Total em Repasses Líquidos</p>
              <h3 className="text-3xl font-black text-white mt-1.5 font-sans tracking-tight">
                R$ {totals.totalPaidValue.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </h3>
            </div>
            <div className="bg-emerald-500 text-white p-2.5 rounded-2xl flex items-center justify-center shadow-xs">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <div className="border-t border-dashed border-slate-850 pt-3 mt-1 flex justify-between items-center text-[11px] text-slate-400 font-medium">
            <span>Soma dos 15 Couriers</span>
            <span className="text-emerald-400 flex items-center font-bold">
              Líquido Fechamento
            </span>
          </div>
        </div>

        {/* Metric 3 */}
        <div className="bg-white border border-slate-200 rounded-3xl p-5 flex flex-col justify-between shadow-xs relative overflow-hidden group hover:shadow">
          <div className="flex justify-between items-start mb-3">
            <div>
              <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Média de Entregas / Courier</p>
              <h3 className="text-3xl font-black text-slate-850 mt-1.5 font-sans tracking-tight">
                {totals.avgDeliveriesPerCourier} <span className="text-xs font-semibold text-slate-400">unids</span>
              </h3>
            </div>
            <div className="bg-slate-100 text-slate-600 p-2.5 rounded-2xl border border-slate-200 flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div className="border-t border-dashed border-slate-100 pt-3 mt-1 flex justify-between items-center text-[11px] text-slate-500 font-medium">
            <span>Entregadores Ativos: <b>{totals.activeDriversCount}</b></span>
            <span className="text-slate-500 font-bold bg-slate-100 px-1.5 py-0.2 rounded text-[9px] uppercase">
              Consistência
            </span>
          </div>
        </div>

        {/* Metric 4 */}
        <div className="bg-white border border-slate-200 rounded-3xl p-5 flex flex-col justify-between shadow-xs relative overflow-hidden group hover:shadow">
          <div className="flex justify-between items-start mb-3">
            <div>
              <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Ocorrências / Multas Extravios</p>
              <h3 className="text-3xl font-black text-slate-850 mt-1.5 font-sans tracking-tight flex items-baseline">
                {totals.totalOccurrences}
                {totals.totalDebitsValue > 0 && (
                  <span className="text-xs font-extrabold text-rose-600 ml-2 font-mono">
                    -R$ {totals.totalDebitsValue.toFixed(0)}
                  </span>
                )}
              </h3>
            </div>
            <div className={`p-2.5 rounded-2xl flex items-center justify-center border ${totals.totalOccurrences > 0 ? 'bg-rose-50 text-rose-600 border-rose-100' : 'bg-emerald-50 text-emerald-600 border-emerald-100'}`}>
              {totals.totalOccurrences > 0 ? <AlertCircle className="w-5 h-5" /> : <CheckCircle2 className="w-5 h-5" />}
            </div>
          </div>
          <div className="border-t border-dashed border-slate-100 pt-3 mt-1 flex justify-between items-center text-[11px] text-slate-500 font-medium">
            <span>Pendências do Período: <b>{totals.totalPendings} un</b></span>
            <span className={`font-black ${totals.totalOccurrences > 15 ? 'text-rose-600' : 'text-emerald-600'}`}>
              SLA {Math.max(0, 100 - totals.totalOccurrences)}%
            </span>
          </div>
        </div>
      </div>

      {/* Main Comparative Charts Block */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Deliveries Monthly Comparison Chart */}
        <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-xs flex flex-col justify-between min-h-[350px]">
          <div className="mb-4">
            <span className="text-[9px] font-black text-orange-600 uppercase tracking-widest block">Comparativo com Períodos Anteriores</span>
            <h4 className="text-sm font-bold text-slate-850 mt-0.5">
              Acumulado de Entregas Concluídas ({periodType === '15_days' ? `${selectedFortnight}ª Quinzena` : 'Mensal Completo'})
            </h4>
            <p className="text-[11px] text-slate-400">Comparação sistemática com o mesmo período do histórico de meses anteriores de 2026</p>
          </div>

          <div className="h-[230px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyComparisonData} margin={{ top: 10, right: 10, left: -25, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="mName" tick={{ fill: '#64748b', fontSize: 11, fontWeight: 700 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip 
                  cursor={{ fill: '#f8fafc' }} 
                  contentStyle={{ background: '#0f172a', border: 'none', borderRadius: '12px', color: '#fff', fontSize: '11px', fontFamily: 'sans-serif' }} 
                />
                <Bar 
                  dataKey="Entregas Concluídas" 
                  fill="#475569" 
                  radius={[8, 8, 0, 0]} 
                  maxBarSize={38}
                >
                  {/* Color highlight for selected active month */}
                  {monthlyComparisonData.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={entry.monthKey === selectedMonth ? '#f97316' : '#475569'} 
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Payout Metric Monthly Comparison Chart */}
        <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-xs flex flex-col justify-between min-h-[350px]">
          <div className="mb-4">
            <span className="text-[9px] font-black text-emerald-600 uppercase tracking-widest block">Valores de Custo Comercial</span>
            <h4 className="text-sm font-bold text-slate-850 mt-0.5">
              Valores Totais a Serem Pagos (Repasses Consolidado R$)
            </h4>
            <p className="text-[11px] text-slate-400">Comparativo financeiro indexado do custo com os entregadores na quinzena vs histórico</p>
          </div>

          <div className="h-[230px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyComparisonData} margin={{ top: 10, right: 10, left: -10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="mName" tick={{ fill: '#64748b', fontSize: 11, fontWeight: 700 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip 
                  cursor={{ fill: '#f8fafc' }} 
                  formatter={(value: any) => [`R$ ${Number(value).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, 'Repasse Líquido']}
                  contentStyle={{ background: '#0f172a', border: 'none', borderRadius: '12px', color: '#fff', fontSize: '11px', fontFamily: 'sans-serif' }} 
                />
                <Bar 
                  dataKey="Valores a Pagar (R$)" 
                  fill="#1e3a8a" 
                  radius={[8, 8, 0, 0]} 
                  maxBarSize={38}
                >
                  {monthlyComparisonData.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={entry.monthKey === selectedMonth ? '#f97316' : '#1e3a8a'} 
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Courier Performance Stack & Ranking Block */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        {/* Grouped Bar Chart of incidents, penalties and pending items */}
        <div className="xl:col-span-7 bg-white border border-slate-200 rounded-3xl p-5 shadow-xs flex flex-col justify-between">
          <div className="mb-4">
            <span className="text-[9px] font-black text-rose-500 uppercase tracking-widest block">Sinalizadores de Erros e Multas</span>
            <h4 className="text-sm font-bold text-slate-850 mt-0.5">
              Desempenho por Entregador (Sinalizações Negativas)
            </h4>
            <p className="text-[11px] text-slate-400">
              Histograma comparando Ocorrências, Entregas Pendentes e Multas/Extravios descontados no período selecionado.
            </p>
          </div>

          {/* Grouped Column Chart */}
          <div className="h-[310px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={courierChartData} margin={{ top: 10, right: 10, left: -25, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" tick={{ fill: '#334155', fontSize: 9, fontWeight: 700 }} tickLine={false} />
                <YAxis tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickLine={false} />
                <Tooltip 
                  contentStyle={{ background: '#0f172a', border: 'none', borderRadius: '12px', color: '#fff', fontSize: '11px', fontFamily: 'sans-serif' }}
                />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '10px', paddingTop: '15px' }} />
                <Bar dataKey="Ocorrências" fill="#e11d48" radius={[4, 4, 0, 0]} maxBarSize={12} />
                <Bar dataKey="Pendentes" fill="#d97706" radius={[4, 4, 0, 0]} maxBarSize={12} />
                <Bar dataKey="Multas / Descontos (R$)" fill="#0284c7" radius={[4, 4, 0, 0]} maxBarSize={12} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Dynamic Leaderboard Ranking of couriers */}
        <div className="xl:col-span-12 lg:col-span-12 xl:order-last bg-white border border-slate-200 rounded-3xl p-5 shadow-xs flex flex-col">
          <div className="mb-4 flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-4">
            <div>
              <span className="text-[9px] font-black text-emerald-500 uppercase tracking-widest block">Metodologia de Desempenho e Premiação</span>
              <h4 className="text-sm font-bold text-slate-850 mt-0.5 flex items-center gap-1.5">
                <Award className="w-4 h-4 text-orange-500 shrink-0" /> Ranking de Melhores do Período
              </h4>
              <p className="text-[11px] text-slate-400 mt-1">
                {rankingModel === 'logistics_fair' 
                  ? "Ativo: Cálculo Proporcional (Trata ocorrências/multas em relação ao volume de entregas e payout)" 
                  : "Ativo: Cálculo Absoluto Clássico (Deduções fixas por ocorrência, independente do volume)"}
              </p>
            </div>
            
            {/* Interactive Model Switcher */}
            <div className="flex bg-slate-100 p-1 rounded-xl self-start md:self-auto shrink-0 border border-slate-200">
              <button
                onClick={() => handleToggleRankingModel('logistics_fair')}
                className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all cursor-pointer flex items-center gap-1 ${rankingModel === 'logistics_fair' ? 'bg-[#e31a1a] text-white shadow-md' : 'text-slate-500 hover:text-slate-800'}`}
              >
                <Sparkles className="w-3 h-3" />
                Diferencial Logístico (Justo)
              </button>
              <button
                onClick={() => handleToggleRankingModel('standard')}
                className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all cursor-pointer flex items-center gap-1 ${rankingModel === 'standard' ? 'bg-slate-700 text-white shadow-md' : 'text-slate-500 hover:text-slate-800'}`}
              >
                Padrão Absoluto
              </button>
            </div>
          </div>

          {/* Educational Callout explaining the difference */}
          {rankingModel === 'logistics_fair' ? (
            <div className="mb-4 bg-emerald-50 border border-emerald-150 rounded-2xl p-4 text-[11px] text-emerald-950 leading-relaxed shadow-2xs">
              <span className="font-extrabold flex items-center gap-1 text-emerald-800 mb-1">
                <Sparkles className="w-4 h-4" /> COMO FUNCIONA O CÁLCULO LOGÍSTICO JUSTO (VOLUME-WEIGHTED):
              </span>
              Este modelo calcula a sua pontuação com base em <strong>taxas de eficiência percentuais</strong> em relação ao total de trabalho executado, corrigindo o efeito de volume:
              <ul className="list-disc list-inside mt-1.5 space-y-1 font-medium text-emerald-900 ml-1">
                <li><strong>Ocorrências Proporcionais:</strong> Mede o erro como frequência. Ter 3 ocorrências em 1.500 entregas (taxa de 0,2%) penaliza o SLA em apenas <strong className="font-mono font-bold">-2%</strong>. Ter as mesmas 3 ocorrências em 50 entregas (taxa de 6%) penaliza pesadamente em <strong className="font-mono font-bold">-60%</strong>.</li>
                <li><strong>Pendências Corrigidas:</strong> O peso é medido sobre a taxa de pacotes pendentes em relação ao volume expedido.</li>
                <li><strong>Sinistralidade Financeira (Multas):</strong> Mede o impacto das multas ou perdas contra a própria receita bruta do entregador (taxa de perda sobre payout), protegendo as rotas de alta quilometragem e volume.</li>
              </ul>
            </div>
          ) : (
            <div className="mb-4 bg-slate-50 border border-slate-200 rounded-2xl p-4 text-[11px] text-slate-700 leading-relaxed">
              <span className="font-bold flex items-center gap-1 text-slate-800 mb-1">
                ⚠️ MODELO CLÁSSICO DE DEDUÇÃO FIXA:
              </span>
              Neste modelo legado, cada incidente reduz uma porcentagem fixa do SLA, punindo severamente quem trabalha mais e faz mais volumes:
              <ul className="list-disc list-inside mt-1.5 space-y-1 text-slate-600 ml-1">
                <li>Cada <strong className="text-slate-800">Ocorrência</strong> de caneta subtrai de forma estática <strong className="text-rose-600 font-bold">-5%</strong> do SLA.</li>
                <li>Cada <strong className="text-slate-800">Pendência</strong> subtrai <strong className="text-rose-600 font-bold">-2%</strong>.</li>
                <li>Cada <strong className="text-slate-800">R$ 1,00 de multa / desconto</strong> reduz <strong className="text-rose-600 font-bold">-0.2%</strong> do SLA.</li>
              </ul>
            </div>
          )}

          {/* Ranking List */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3 max-h-[480px] overflow-y-auto pr-1">
            {courierRanking.map((item, index) => {
              const standsOut = index < 3;
              // Badge style for top 3
              const medalStyles = [
                'bg-amber-100 text-amber-800 ring-2 ring-amber-500/20 border-amber-300', // Gold
                'bg-slate-100 text-slate-600 ring-2 ring-slate-400/20 border-slate-300', // Silver
                'bg-orange-100 text-orange-850 ring-2 ring-orange-500/20 border-orange-250' // Bronze
              ];

              return (
                <div 
                  key={item.driverId}
                  className={`flex items-center justify-between p-2.5 rounded-2xl border transition-all ${standsOut ? 'bg-orange-55/20 border-orange-100/70' : 'bg-slate-50/50 border-slate-250/50 hover:bg-slate-100'}`}
                >
                  <div className="flex items-center gap-2.5">
                    {/* Medal / Position Badge */}
                    <div className={`w-6 h-6 flex items-center justify-center rounded-lg text-xs font-black border ${standsOut ? medalStyles[index] : 'bg-slate-200 text-slate-500 border-slate-300'}`}>
                      {index + 1}
                    </div>

                    {/* Avatar with placeholder name */}
                    <div className="w-8 h-8 rounded-full bg-slate-200 font-extrabold text-xs text-slate-700 flex items-center justify-center shrink-0 border border-white uppercase shadow-xs">
                      {item.avatar}
                    </div>

                    {/* Driver details */}
                    <div>
                      <p className="text-[11px] font-black text-slate-800 line-clamp-1">{item.driverName}</p>
                      <span className="text-[9px] font-bold text-slate-400 block tracking-tight uppercase">
                        🔍 {item.route} — {item.totalDeliveries} ent.
                      </span>
                    </div>
                  </div>

                  {/* Operational conformity index */}
                  <div className="text-right">
                    <span className={`inline-block text-[10px] font-extrabold px-2 py-0.5 rounded-lg border leading-tight ${item.efficiency >= 95 ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : item.efficiency >= 85 ? 'bg-orange-50 text-orange-700 border-orange-105' : 'bg-rose-50 text-rose-700 border-rose-100'}`}>
                      {item.efficiency}% SLA
                    </span>
                    <span className="block text-[8px] text-slate-400 font-bold font-mono mt-0.5">
                      {item.occurrences} oco. / {item.pending} pend.
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
