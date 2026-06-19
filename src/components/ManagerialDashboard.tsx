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
  Cell
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
  Check
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

  // Seed historical data if missing to make past comparative charts instantly beautiful and functional
  useEffect(() => {
    const saved = localStorage.getItem('jadlog_fortnightly_ledger');
    let loaded: Record<string, FortnightlyLedgerRecord> = saved ? JSON.parse(saved) : {};
    
    // Clean out previous months' data (Maio, Abril, Março, Fevereiro, Janeiro - months 0 to 4)
    let modified = false;
    Object.keys(loaded).forEach((key) => {
      const rec = loaded[key];
      if (rec && typeof rec.month === 'number' && rec.month < 5) {
        delete loaded[key];
        modified = true;
      }
    });

    // Seed only June (month index 5, representing June 2026)
    const monthsToSeed = [5]; 
    const fortnightsToSeed: Array<1 | 2> = [1, 2];

    const driverIds = allCouriers.map(d => d.id);

    monthsToSeed.forEach((mIndex) => {
      fortnightsToSeed.forEach((fortNum) => {
        driverIds.forEach((drvId) => {
          const key = `2026-${mIndex}-${fortNum}-${drvId}`;
          if (!loaded[key]) {
            const mapInfo = driverMappings[drvId] || DRIVER_ROUTE_MAPPING[drvId] || { routeAlias: 'FABIO', defaultName: 'Carlos Silva' };
            const pricing = TARIFS_FALLBACK[mapInfo.routeAlias] || { standard: 2.5, nonStandard: 4.0 };
            const isFiorino = mapInfo.routeAlias === 'COPAV - FIORINO';

            // Base quantities with organic wave oscillation per month
            const baseRates = HISTORICAL_WEIGHTS[mapInfo.routeAlias] || { standard: 40, nonStandard: 2, occurrences: 1, pending: 0 };
            const seasonalFactor = 0.85 + 0.2 * Math.sin(mIndex * 1.5 + fortNum);
            
            // Generate some random occurrences or debits occasionally
            const standardCount = Math.max(0, Math.round(baseRates.standard * seasonalFactor));
            const nonStandardCount = isFiorino 
              ? Math.max(0, Math.round(3500 * seasonalFactor)) // Real copav volume
              : Math.max(0, Math.round(baseRates.nonStandard * (0.9 + 0.3 * Math.cos(mIndex))));
              
            const occurrencesCount = Math.max(0, Math.round(baseRates.occurrences * (0.8 + 0.4 * Math.sin(mIndex))));
            const pendingCount = Math.max(0, Math.round(mIndex % 3 === 0 ? 1 : 0));

            // Calculate exact payout amount following standard system formula
            const basePayout = isFiorino
              ? (standardCount * pricing.standard) + nonStandardCount
              : (standardCount * pricing.standard) + (nonStandardCount * (pricing.nonStandard - pricing.standard));

            // Deduct simulated debits occasionally
            const debitAdvance = mIndex % 2 === 0 ? parseFloat((50 + (mIndex * 10)).toFixed(2)) : 0;
            const debitFuel = mIndex % 3 === 0 ? parseFloat((30 + (fortNum * 15)).toFixed(2)) : 0;
            const debitLoss = mIndex === 4 && drvId === 'drv-1' ? 75 : 0;
            const totalDebits = debitAdvance + debitFuel + debitLoss;

            const payoutAmount = Math.max(0, parseFloat((basePayout - totalDebits).toFixed(2)));

            loaded[key] = {
              id: key,
              year: 2026,
              month: mIndex,
              fortnight: fortNum,
              driverId: drvId,
              standardCount,
              nonStandardCount,
              occurrencesCount,
              pendingCount,
              isPaid: mIndex < 5, // past months are paid
              payoutAmount,
              debitAdvance,
              debitFuel,
              debitLoss
            };
            modified = true;
          }
        });
      });
    });

    if (modified) {
      localStorage.setItem('jadlog_fortnightly_ledger', JSON.stringify(loaded));
    }
    setLedger(loaded);
  }, [allCouriers, driverMappings]);

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
            const isFiorino = (driverMappings[rec.driverId]?.routeAlias || '') === 'COPAV - FIORINO';
            deliveriesCount += rec.standardCount + (isFiorino ? 0 : rec.nonStandardCount);
            payoutSum += rec.payoutAmount;
          }
        } else {
          // Both fortnights
          const key1 = `${selectedYear}-${mIndex}-1-${drv.id}`;
          const key2 = `${selectedYear}-${mIndex}-2-${drv.id}`;
          const rec1 = ledger[key1];
          const rec2 = ledger[key2];

          if (rec1) {
            const isFiorino = (driverMappings[rec1.driverId]?.routeAlias || '') === 'COPAV - FIORINO';
            deliveriesCount += rec1.standardCount + (isFiorino ? 0 : rec1.nonStandardCount);
            payoutSum += rec1.payoutAmount;
          }
          if (rec2) {
            const isFiorino = (driverMappings[rec2.driverId]?.routeAlias || '') === 'COPAV - FIORINO';
            deliveriesCount += rec2.standardCount + (isFiorino ? 0 : rec2.nonStandardCount);
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
      const totalDeliveries = rec.standardCount + (isCopav(route) ? 0 : rec.nonStandardCount);

      // Balanced performance Score (SLA): Calculated proportionally.
      // - Each manual Occurrence counts as -5% SLA
      // - Each Pending counts as -2% SLA
      // - Each R$ of Multa/Extravio (debitLoss) counts as -0.20% SLA (e.g. R$100 multa = -20% SLA)
      let efficiency = 100;
      if (rec.standardCount > 0 || rec.nonStandardCount > 0 || rec.occurrencesCount > 0 || rec.pendingCount > 0 || (rec.debitLoss || 0) > 0) {
        const occurrencesPenalty = rec.occurrencesCount * 5;
        const pendingPenalty = rec.pendingCount * 2;
        const finesPenalty = (rec.debitLoss || 0) * 0.20;
        efficiency = Math.max(0, Math.min(100, Math.round(100 - (occurrencesPenalty + pendingPenalty + finesPenalty))));
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
  }, [currentPeriodRecords, drivers]);

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

  return (
    <div className="space-y-6">
      {/* Premium Dashboard Header & Dynamic Periode Selectors */}
      <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-xs flex flex-col xl:flex-row xl:items-center justify-between gap-5 font-sans">
        <div>
          <div className="flex items-center gap-1.5 text-orange-600 font-extrabold text-xs uppercase tracking-wider">
            <Sparkles className="w-4 h-4 text-orange-500 shrink-0" />
            <span>Métricas Gerenciais Operacionais</span>
          </div>
          <h2 className="text-xl font-black text-slate-900 mt-1">
            Painel Executivo de Desempenho
          </h2>
          <p className="text-xs text-slate-500 mt-0.5 max-w-xl">
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
        <div className="xl:col-span-5 bg-white border border-slate-200 rounded-3xl p-5 shadow-xs flex flex-col">
          <div className="mb-4 flex justify-between items-start">
            <div>
              <span className="text-[9px] font-black text-emerald-500 uppercase tracking-widest block">Conformidade Operacional</span>
              <h4 className="text-sm font-bold text-slate-850 mt-0.5">
                Ranking de Melhores do Período
              </h4>
              <p className="text-[11px] text-slate-400">Classificados por SLA Proporcional (Penas: Ocorrência -5%, Pendência -2%, Multa -0,20% por R$)</p>
            </div>
            <Award className="w-6 h-6 text-orange-500 shrink-0" />
          </div>

          {/* Ranking List */}
          <div className="space-y-2 max-h-[310px] overflow-y-auto pr-1">
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
