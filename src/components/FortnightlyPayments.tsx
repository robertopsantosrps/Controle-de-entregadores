import React, { useState, useEffect, useMemo } from 'react';
import { toPng } from 'html-to-image';
import { Driver, FortnightlyLedgerRecord } from '../types';
import { 
  Calendar, 
  DollarSign, 
  CheckCircle2, 
  AlertCircle, 
  FileSpreadsheet, 
  RefreshCw, 
  Layers, 
  Search, 
  ChevronRight, 
  Printer, 
  Sparkles, 
  Sliders, 
  Info, 
  TrendingUp,
  UserCheck,
  Check,
  Truck,
  Settings,
  Plus,
  Trash2,
  X,
  Save,
  Copy,
  ExternalLink,
  Share2,
  FileText,
  Phone,
  CreditCard
} from 'lucide-react';

interface FortnightlyPaymentsProps {
  drivers: Driver[];
  deliveries: any[]; // Backwards compatibility if needed
  onUpdateDeliveriesPaymentStatus?: (deliveryIds: string[], status: 'Pendente' | 'Pago') => void;
  selectedYear?: number;
  setSelectedYear?: (y: number) => void;
  selectedMonth?: number;
  setSelectedMonth?: (m: number) => void;
  selectedFortnight?: 1 | 2;
  setSelectedFortnight?: (f: 1 | 2) => void;
}

// Pricing configuration per Route / City
export interface RoutePricing {
  routeAlias: string;
  cityName: string;
  standardRate: number;
  nonStandardRate: number;
}

export const ROUTE_PRICINGS: Record<string, RoutePricing> = {
  'JEZ - BTN': { routeAlias: 'JEZ - BTN', cityName: 'Jeremoabo - BA', standardRate: 5.00, nonStandardRate: 10.00 },
  'DELMIRO': { routeAlias: 'DELMIRO', cityName: 'Delmiro Gouveia - AL', standardRate: 3.50, nonStandardRate: 7.00 },
  'MTG': { routeAlias: 'MTG', cityName: 'Mata Grande - AL', standardRate: 3.50, nonStandardRate: 7.00 },
  'CANINDE': { routeAlias: 'CANINDE', cityName: 'Canindé de São Francisco - SE', standardRate: 5.00, nonStandardRate: 10.00 },
  'FABIO': { routeAlias: 'FABIO', cityName: 'Paulo Afonso - BA (Dentro da Cidade)', standardRate: 2.50, nonStandardRate: 4.00 },
  'OPERACIONAL': { routeAlias: 'OPERACIONAL', cityName: 'Paulo Afonso - BA (Dentro da Cidade)', standardRate: 2.50, nonStandardRate: 4.00 },
  'FELIPE - EXTRA': { routeAlias: 'FELIPE - EXTRA', cityName: 'Paulo Afonso - BA (Dentro da Cidade)', standardRate: 2.50, nonStandardRate: 4.00 },
  'JEREMOABO': { routeAlias: 'JEREMOABO', cityName: 'Jeremoabo - BA', standardRate: 5.00, nonStandardRate: 10.00 },
  'EXTRA 01': { routeAlias: 'EXTRA 01', cityName: 'Paulo Afonso - BA (Dentro da Cidade)', standardRate: 2.50, nonStandardRate: 4.00 },
  'PARICONHA': { routeAlias: 'PARICONHA', cityName: 'Pariconha - AL', standardRate: 5.00, nonStandardRate: 10.00 },
  'AGUA BRANCA': { routeAlias: 'AGUA BRANCA', cityName: 'Água Branca - AL', standardRate: 5.00, nonStandardRate: 10.00 },
  'GLORIA': { routeAlias: 'GLORIA', cityName: 'Glória - BA', standardRate: 5.00, nonStandardRate: 10.00 },
  'SANTA BRIGIDA': { routeAlias: 'SANTA BRIGIDA', cityName: 'Santa Brígida - BA', standardRate: 5.00, nonStandardRate: 10.00 },
  'JATOBA': { routeAlias: 'JATOBA', cityName: 'Jatobá - PE', standardRate: 5.00, nonStandardRate: 10.00 },
  'PETROLANDIA': { routeAlias: 'PETROLANDIA', cityName: 'Petrolândia - PE', standardRate: 5.00, nonStandardRate: 10.00 },
  'TACARATU': { routeAlias: 'TACARATU', cityName: 'Tacaratu - PE', standardRate: 5.00, nonStandardRate: 10.00 },
  'COPAV - FIORINO': { routeAlias: 'COPAV - FIORINO', cityName: 'Paulo Afonso - BA (Dentro da Cidade)', standardRate: 6.00, nonStandardRate: 6.00 },
};

// Special helper for COPAV - FIORINO custom logic
export const isCopav = (routeAlias: string): boolean => {
  return !!routeAlias?.toUpperCase().includes('COPAV');
};

// Map each of the 15 driver IDs to their route alias from the Jadlog dashboard (matching user request)
export const DRIVER_ROUTE_MAPPING: Record<string, { routeAlias: string; defaultName: string }> = {
  'drv-1': { routeAlias: 'FABIO', defaultName: 'Carlos "Vozinha" Silva' },
  'drv-2': { routeAlias: 'JEREMOABO', defaultName: 'Wander' },
  'drv-3': { routeAlias: 'JEZ - BTN', defaultName: 'Lucas "Zulú" de Souza' },
  'drv-4': { routeAlias: 'OPERACIONAL', defaultName: 'Marcos Henrique Santos' },
  'drv-5': { routeAlias: 'DELMIRO', defaultName: 'Juliana Ribeiro Costa' },
  'drv-6': { routeAlias: 'GLORIA', defaultName: 'Rodrigo Pereira Lima' },
  'drv-7': { routeAlias: 'FELIPE - EXTRA', defaultName: 'Felipe "Speed" Castelo' },
  'drv-8': { routeAlias: 'EXTRA 01', defaultName: 'Bruno "Seta" Gomes' },
  'drv-9': { routeAlias: 'PETROLANDIA', defaultName: 'Patricia "Pati" Rocha' },
  'drv-10': { routeAlias: 'TACARATU', defaultName: 'Gabriel "Gabi" Souza' },
  'drv-11': { routeAlias: 'SANTA BRIGIDA', defaultName: 'Camila "Mila" Cardoso' },
  'drv-12': { routeAlias: 'MTG', defaultName: 'Thiago "Tuba" Ramos' },
  'drv-13': { routeAlias: 'JATOBA', defaultName: 'Amanda Martins' },
  'drv-14': { routeAlias: 'PARICONHA', defaultName: 'Renan "Flash" Barbosa' },
  'drv-15': { routeAlias: 'CANINDE', defaultName: 'Leticia "Lê" Vasconcellos' },
  'drv-16': { routeAlias: 'AGUA BRANCA', defaultName: 'Clécio "Guerreiro" Silva' },
};

// Initial benchmark seed quantities for 1ª Quinzena de Junho 2026 to populate nice statistics immediately
export const DEFAULT_QUANTITIES: Record<string, { standard: number; nonStandard: number; occurrences: number; pending: number }> = {
  'JEZ - BTN': { standard: 450, nonStandard: 8, occurrences: 6, pending: 0 },
  'OPERACIONAL': { standard: 1, nonStandard: 0, occurrences: 0, pending: 0 },
  'FELIPE - EXTRA': { standard: 140, nonStandard: 6, occurrences: 2, pending: 0 },
  'DELMIRO': { standard: 145, nonStandard: 8, occurrences: 6, pending: 0 },
  'MTG': { standard: 84, nonStandard: 3, occurrences: 0, pending: 0 },
  'CANINDE': { standard: 52, nonStandard: 4, occurrences: 2, pending: 0 },
  'FABIO': { standard: 1350, nonStandard: 29, occurrences: 31, pending: 0 },
  'JEREMOABO': { standard: 42, nonStandard: 0, occurrences: 0, pending: 0 },
  'EXTRA 01': { standard: 68, nonStandard: 3, occurrences: 2, pending: 0 },
  'PARICONHA': { standard: 34, nonStandard: 2, occurrences: 1, pending: 0 },
  'AGUA BRANCA': { standard: 45, nonStandard: 5, occurrences: 0, pending: 0 },
  'GLORIA': { standard: 90, nonStandard: 7, occurrences: 1, pending: 0 },
  'SANTA BRIGIDA': { standard: 38, nonStandard: 4, occurrences: 0, pending: 0 },
  'JATOBA': { standard: 27, nonStandard: 2, occurrences: 2, pending: 0 },
  'PETROLANDIA': { standard: 64, nonStandard: 5, occurrences: 1, pending: 0 },
  'TACARATU': { standard: 14, nonStandard: 1, occurrences: 0, pending: 0 },
};

// Standard preset town tariffs to quickly toggle or assign billing
export const CITY_SAMPLES = [
  { cityName: 'Paulo Afonso - BA (Dentro da Cidade)', rate: 2.50 },
  { cityName: 'Delmiro Gouveia - AL', rate: 3.50 },
  { cityName: 'Mata Grande - AL', rate: 3.50 },
  { cityName: 'Jeremoabo - BA', rate: 5.00 },
  { cityName: 'Canindé de São Francisco - SE', rate: 5.00 },
  { cityName: 'Glória - BA', rate: 5.00 },
  { cityName: 'Pariconha - AL', rate: 5.00 },
  { cityName: 'Água Branca - AL', rate: 5.00 },
  { cityName: 'Santa Brígida - BA', rate: 5.00 },
  { cityName: 'Jatobá - PE', rate: 5.00 },
  { cityName: 'Petrolândia - PE', rate: 5.00 },
  { cityName: 'Tacaratu - PE', rate: 5.00 },
];

export default function FortnightlyPayments({
  drivers,
  deliveries = [],
  onUpdateDeliveriesPaymentStatus,
  selectedYear: propYear,
  setSelectedYear: propSetYear,
  selectedMonth: propMonth,
  setSelectedMonth: propSetMonth,
  selectedFortnight: propFortnight,
  setSelectedFortnight: propSetFortnight
}: FortnightlyPaymentsProps) {
  // Calendar scope definitions fallbacks
  const [localYear, setLocalYear] = useState<number>(2026);
  const [localMonth, setLocalMonth] = useState<number>(5); // June is 5 (0-indexed)
  const [localFortnight, setLocalFortnight] = useState<1 | 2>(1);

  const selectedYear = propYear !== undefined ? propYear : localYear;
  const setSelectedYear = propSetYear !== undefined ? propSetYear : setLocalYear;
  const selectedMonth = propMonth !== undefined ? propMonth : localMonth;
  const setSelectedMonth = propSetMonth !== undefined ? propSetMonth : setLocalMonth;
  const selectedFortnight = propFortnight !== undefined ? propFortnight : localFortnight;
  const setSelectedFortnight = propSetFortnight !== undefined ? propSetFortnight : setLocalFortnight;

  const [searchQuery, setSearchQuery] = useState('');
  
  // Custom tariff configuration - stored in LocalStorage so user can adjust billing rates dynamically
  const [tariffs, setTariffs] = useState<Record<string, RoutePricing>>(() => {
    const saved = localStorage.getItem('jadlog_route_tariffs');
    let loaded: Record<string, RoutePricing> = ROUTE_PRICINGS;
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        loaded = { ...ROUTE_PRICINGS, ...parsed };
      } catch (e) {
        console.error(e);
      }
    }

    // Force override standard and non-standard rates for exact correct requirements
    const forceRoutes5 = [
      'GLORIA', 
      'PETROLANDIA', 
      'TACARATU', 
      'SANTA BRIGIDA', 
      'JEREMOABO',
      'JATOBA', 
      'PARICONHA', 
      'CANINDE', 
      'AGUA BRANCA'
    ];
    let corrected = false;
    forceRoutes5.forEach(r => {
      if (!loaded[r] || loaded[r].standardRate !== 5.00 || loaded[r].nonStandardRate !== 10.00) {
        loaded[r] = {
          routeAlias: r,
          cityName: loaded[r]?.cityName || ROUTE_PRICINGS[r]?.cityName || '',
          standardRate: 5.00,
          nonStandardRate: 10.00,
        };
        corrected = true;
      }
    });

    const forceRoutes35 = ['DELMIRO', 'MTG'];
    forceRoutes35.forEach(r => {
      if (!loaded[r] || loaded[r].standardRate !== 3.50 || loaded[r].nonStandardRate !== 7.00) {
        loaded[r] = {
          routeAlias: r,
          cityName: loaded[r]?.cityName || ROUTE_PRICINGS[r]?.cityName || '',
          standardRate: 3.50,
          nonStandardRate: 7.00,
        };
        corrected = true;
      }
    });

    const forceRoutes6 = ['COPAV - FIORINO'];
    forceRoutes6.forEach(r => {
      if (!loaded[r] || loaded[r].standardRate !== 6.00) {
        loaded[r] = {
          routeAlias: r,
          cityName: loaded[r]?.cityName || ROUTE_PRICINGS[r]?.cityName || 'Paulo Afonso - BA (Dentro da Cidade)',
          standardRate: 6.00,
          nonStandardRate: 6.00,
        };
        corrected = true;
      }
    });

    if (corrected || !saved) {
      localStorage.setItem('jadlog_route_tariffs', JSON.stringify(loaded));
    }
    return loaded;
  });

  // Dynamic Driver/Courier aliases and default name mappings editable on-the-fly
  const [driverMappings, setDriverMappings] = useState<Record<string, { routeAlias: string; defaultName: string; pix?: string; phone?: string }>>(() => {
    const saved = localStorage.getItem('jadlog_driver_route_mappings');
    let loaded: Record<string, { routeAlias: string; defaultName: string; pix?: string; phone?: string }> = DRIVER_ROUTE_MAPPING;
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        loaded = { ...DRIVER_ROUTE_MAPPING, ...parsed };
      } catch (e) {
        console.error(e);
      }
    }
    // Force override drv-2 to JEREMOABO / Wander to update existing saved sessions
    if (loaded['drv-2'] && (loaded['drv-2'].routeAlias === 'BALCÃO' || loaded['drv-2'].defaultName === 'Ana Beatriz Oliveira')) {
      loaded = {
        ...loaded,
        'drv-2': { routeAlias: 'JEREMOABO', defaultName: 'Wander' }
      };
      localStorage.setItem('jadlog_driver_route_mappings', JSON.stringify(loaded));
    }
    return loaded;
  });

  // Custom new registered cards/couriers
  const [localFora, setLocalFora] = useState<Record<string, string>>({});
  const [shareModalReport, setShareModalReport] = useState<any | null>(null);
  const [copiedText, setCopiedText] = useState(false);
  const [customCouriers, setCustomCouriers] = useState<Array<{ id: string; name: string; phone?: string; pix?: string; vehicle?: string }>>(() => {
    const saved = localStorage.getItem('jadlog_custom_couriers');
    return saved ? JSON.parse(saved) : [];
  });

  // Track excluded/deleted card IDs across sessions
  const [deletedCouriers, setDeletedCouriers] = useState<string[]>(() => {
    const saved = localStorage.getItem('jadlog_deleted_couriers');
    return saved ? JSON.parse(saved) : [];
  });

  // Merged standard and dynamically added couriers
  const allCouriers = useMemo(() => {
    const standard = drivers.map(d => {
      const mapping = driverMappings[d.id] || {};
      return {
        id: d.id,
        name: d.name,
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
        name: c.name,
        phone: mapping.phone || c.phone || '(75) 99888-7777',
        pix: mapping.pix || c.pix || '',
        vehicle: c.vehicle || 'Moto',
        isCustom: true,
      };
    });
    return [...standard, ...custom].filter(c => !deletedCouriers.includes(c.id));
  }, [drivers, customCouriers, driverMappings, deletedCouriers]);

  // Modals / Overlays for editing and creating cards
  const [editingCourierId, setEditingCourierId] = useState<string | null>(null);
  const [editFormName, setEditFormName] = useState('');
  const [editFormRoute, setEditFormRoute] = useState('');
  const [editFormCity, setEditFormCity] = useState('');
  const [editFormRate, setEditFormRate] = useState(2.50);
  const [editFormPix, setEditFormPix] = useState('');
  const [editFormPhone, setEditFormPhone] = useState('');

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [createFormName, setCreateFormName] = useState('');
  const [createFormRoute, setCreateFormRoute] = useState('');
  const [createFormCity, setCreateFormCity] = useState('Paulo Afonso - BA (Dentro da Cidade)');
  const [createFormRate, setCreateFormRate] = useState(2.50);
  const [createFormPhone, setCreateFormPhone] = useState('');
  const [createFormPix, setCreateFormPix] = useState('');

  // activeView options: 'cards' (exact Jadlog look), 'spreadsheet' (reports table closure) or 'finance_report' (basic finance compilation)
  const [activeSubView, setActiveSubView] = useState<'cards' | 'spreadsheet' | 'finance_report'>('cards');

  // Print helper states
  const [showPrintInstructions, setShowPrintInstructions] = useState(false);
  const [isInIframe, setIsInIframe] = useState(false);

  // Delete confirmation states
  const [courierToDelete, setCourierToDelete] = useState<{ id: string; name: string } | null>(null);

  useEffect(() => {
    try {
      setIsInIframe(window.self !== window.top);
    } catch (e) {
      setIsInIframe(true);
    }
  }, []);

  // WhatsApp image sharing states
  const [cardImageSrc, setCardImageSrc] = useState<string | null>(null);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [imageError, setImageError] = useState<string | null>(null);
  const [activeShareMode, setActiveShareMode] = useState<'image' | 'text'>('image');
  const [copiedImage, setCopiedImage] = useState(false);
  const [showWaCopyAlert, setShowWaCopyAlert] = useState(false);

  const renderImageFromElement = async (el: HTMLElement, driverId: string, downloadOnCompletion: boolean) => {
    setIsGeneratingImage(true);
    setImageError(null);
    try {
      const dataUrl = await toPng(el, {
        backgroundColor: '#ffffff',
        style: {
          transform: 'scale(1)',
          transformOrigin: 'top left',
        }
      });
      setCardImageSrc(dataUrl);

      if (downloadOnCompletion) {
        const link = document.createElement('a');
        link.download = `Card_${driverId}_Quinzena_${selectedFortnight}.png`;
        link.href = dataUrl;
        link.click();
      }

      return dataUrl;
    } catch (err: any) {
      console.error("Error generating capture card image", err);
      setImageError("Erro ao processar imagem para envio.");
      return null;
    } finally {
      setIsGeneratingImage(false);
    }
  };

  const generateCardImage = async (driverId: string, downloadOnCompletion = false) => {
    const el = document.getElementById(`courier-card-capture-${driverId}`);
    if (!el) {
      console.error("Capture element not found in DOM yet");
      await new Promise(resolve => setTimeout(resolve, 200));
      const elRetry = document.getElementById(`courier-card-capture-${driverId}`);
      if (!elRetry) {
        setImageError("Elemento do card de captura não encontrado.");
        return null;
      }
      return renderImageFromElement(elRetry, driverId, downloadOnCompletion);
    }
    return renderImageFromElement(el, driverId, downloadOnCompletion);
  };

  const copyImageToClipboard = async (pngDataUrl: string) => {
    try {
      const response = await fetch(pngDataUrl);
      const blob = await response.blob();
      await navigator.clipboard.write([
        new ClipboardItem({
          [blob.type]: blob
        })
      ]);
      return true;
    } catch (err) {
      console.error("Failed to copy image to clipboard:", err);
      return false;
    }
  };

  useEffect(() => {
    if (shareModalReport) {
      setCardImageSrc(null);
      setImageError(null);
      const timer = setTimeout(() => {
        generateCardImage(shareModalReport.driverId);
      }, 350);
      return () => clearTimeout(timer);
    } else {
      setCardImageSrc(null);
    }
  }, [shareModalReport]);

  // Load and save the manual ledger
  const [ledgerRecords, setLedgerRecords] = useState<Record<string, FortnightlyLedgerRecord>>({});

  // Key generator helper for current period and driver
  const getRecordKey = (driverId: string, flagYear = selectedYear, flagMonth = selectedMonth, flagFort = selectedFortnight) => {
    return `${flagYear}-${flagMonth}-${flagFort}-${driverId}`;
  };

  // Populate/load database of fortnightly quantities
  useEffect(() => {
    const savedLedger = localStorage.getItem('jadlog_fortnightly_ledger');
    let loadedLedger: Record<string, FortnightlyLedgerRecord> = savedLedger ? JSON.parse(savedLedger) : {};

    // Check if we need to initialize records for this fortnight
    let modified = false;

    // Purge records from January to May (month indexes 0 to 4 in 0-indexed system) as requested by user
    Object.keys(loadedLedger).forEach((key) => {
      const rec = loadedLedger[key];
      if (rec && typeof rec.month === 'number' && rec.month < 5) {
        delete loadedLedger[key];
        modified = true;
      }
    });

    allCouriers.forEach((drv) => {
      const key = getRecordKey(drv.id);
      if (!loadedLedger[key]) {
        // Find route alias from our catalog
        const mapper = driverMappings[drv.id] || { routeAlias: drv.id, defaultName: drv.name };
        const pricing = tariffs[mapper.routeAlias] || { standardRate: 2.50, nonStandardRate: 4.00 };

        // Start fully at zero for clean testing
        let seed = { standard: 0, nonStandard: 0, occurrences: 0, pending: 0 };

        const isCopavRoute = isCopav(mapper.routeAlias);
        const payout = isCopavRoute
          ? (seed.standard * pricing.standardRate) + seed.nonStandard
          : (seed.standard * pricing.standardRate) + (seed.nonStandard * (pricing.nonStandardRate - pricing.standardRate));

        loadedLedger[key] = {
          id: key,
          year: selectedYear,
          month: selectedMonth,
          fortnight: selectedFortnight,
          driverId: drv.id,
          standardCount: seed.standard,
          nonStandardCount: seed.nonStandard,
          occurrencesCount: seed.occurrences,
          pendingCount: seed.pending,
          isPaid: false,
          payoutAmount: payout,
        };
        modified = true;
      } else {
        // Always recalculate payoutAmount to guarantee correctness (resolving any stale cached ledger records)
        const mapper = driverMappings[drv.id] || { routeAlias: drv.id, defaultName: drv.name };
        const pricing = tariffs[mapper.routeAlias] || { standardRate: 2.50, nonStandardRate: 4.00 };
        const isCopavRoute = isCopav(mapper.routeAlias);
        const record = loadedLedger[key];
        const basePayout = isCopavRoute
          ? (record.standardCount * pricing.standardRate) + record.nonStandardCount
          : (record.standardCount * pricing.standardRate) + 
            (record.nonStandardCount * (pricing.nonStandardRate - pricing.standardRate));
        const debits = (record.debitAdvance || 0) + (record.debitFuel || 0) + (record.debitLoss || 0);
        const computedPayout = basePayout - debits;

        if (Math.abs(loadedLedger[key].payoutAmount - computedPayout) > 0.01) {
          loadedLedger[key].payoutAmount = computedPayout;
          modified = true;
        }
      }
    });

    if (modified || !savedLedger) {
      localStorage.setItem('jadlog_fortnightly_ledger', JSON.stringify(loadedLedger));
    }
    setLedgerRecords(loadedLedger);
  }, [selectedYear, selectedMonth, selectedFortnight, allCouriers, tariffs, driverMappings]);

  // Save specific record helper
  const updateSingleRecord = (driverId: string, fields: Partial<FortnightlyLedgerRecord>) => {
    const key = getRecordKey(driverId);
    const existing = ledgerRecords[key];
    if (!existing) return;

    // Fetch tariff
    const mapper = driverMappings[driverId] || { routeAlias: driverId };
    const pricing = tariffs[mapper.routeAlias] || { standardRate: 2.5, nonStandardRate: 4.0 };

    // Compute updated counts
    const updatedRecord = {
      ...existing,
      ...fields,
    };

    // Calculate updated payout
    const isCopavRoute = isCopav(mapper.routeAlias);
    const basePayout = isCopavRoute
      ? (updatedRecord.standardCount * pricing.standardRate) + updatedRecord.nonStandardCount
      : (updatedRecord.standardCount * pricing.standardRate) + 
        (updatedRecord.nonStandardCount * (pricing.nonStandardRate - pricing.standardRate));
    const debits = (updatedRecord.debitAdvance || 0) + (updatedRecord.debitFuel || 0) + (updatedRecord.debitLoss || 0);
    updatedRecord.payoutAmount = basePayout - debits;

    const newLedger = {
      ...ledgerRecords,
      [key]: updatedRecord,
    };

    setLedgerRecords(newLedger);
    localStorage.setItem('jadlog_fortnightly_ledger', JSON.stringify(newLedger));
  };

  // Perform bulk actions (mark all paid or clear)
  const handleMarkAllPaid = () => {
    const confirmMsg = `Deseja marcar TODOS os repasses desta quinzena como pagos?`;
    if (!window.confirm(confirmMsg)) return;

    const newLedger = { ...ledgerRecords };
    allCouriers.forEach((drv) => {
      const key = getRecordKey(drv.id);
      if (newLedger[key]) {
        newLedger[key] = {
          ...newLedger[key],
          isPaid: true,
          paymentDate: new Date().toLocaleDateString('pt-BR'),
        };
      }
    });

    setLedgerRecords(newLedger);
    localStorage.setItem('jadlog_fortnightly_ledger', JSON.stringify(newLedger));
  };

  // Completely wipe all database inputs to start absolutely clean
  const handleWipeAllLedgerAndReset = () => {
    if (!window.confirm('Atenção: Esta ação irá apagar ABSOLUTAMENTE TODOS os dados salvos em todas as quinzenas e reiniciar o painel do zero. Deseja continuar?')) return;
    localStorage.removeItem('jadlog_fortnightly_ledger');
    localStorage.removeItem('jadlog_route_tariffs');
    localStorage.removeItem('jadlog_driver_route_mappings');
    localStorage.removeItem('jadlog_custom_couriers');
    window.location.reload();
  };

  // Reset current fortnight quantities to zero or defaults
  const handleClearQuantities = () => {
    if (!window.confirm('Atenção: Deseja zerar as quantidades manuais digitadas de TODOS os entregadores para este período?')) return;

    const newLedger = { ...ledgerRecords };
    allCouriers.forEach((drv) => {
      const key = getRecordKey(drv.id);
      if (newLedger[key]) {
        newLedger[key] = {
          ...newLedger[key],
          standardCount: 0,
          nonStandardCount: 0,
          occurrencesCount: 0,
          pendingCount: 0,
          payoutAmount: 0,
          isPaid: false,
          paymentDate: undefined,
        };
      }
    });

    setLedgerRecords(newLedger);
    localStorage.setItem('jadlog_fortnightly_ledger', JSON.stringify(newLedger));
  };

  // Modifying card properties & recalculating
  const handleSaveEdit = () => {
    if (!editingCourierId) return;
    if (!editFormName.trim() || !editFormRoute.trim()) {
      alert('Por favor, preencha o nome do entregador e a sigla da rota.');
      return;
    }

    const uppercaseRoute = editFormRoute.toUpperCase().trim();

    // 1. Update driver alias mapping
    const updatedMappings = {
      ...driverMappings,
      [editingCourierId]: {
        routeAlias: uppercaseRoute,
        defaultName: editFormName.trim(),
        pix: editFormPix.trim(),
        phone: editFormPhone.trim(),
      }
    };
    setDriverMappings(updatedMappings);
    localStorage.setItem('jadlog_driver_route_mappings', JSON.stringify(updatedMappings));

    // 2. Update tariffs
    const isPauloAfonso = editFormCity.toLowerCase().includes('paulo afonso');
    let computedNonStandardRate = isPauloAfonso ? editFormRate + 1.50 : editFormRate * 2;
    if (isCopav(uppercaseRoute)) {
      computedNonStandardRate = editFormRate;
    }

    const updatedTariffs = {
      ...tariffs,
      [uppercaseRoute]: {
        routeAlias: uppercaseRoute,
        cityName: editFormCity,
        standardRate: editFormRate,
        nonStandardRate: computedNonStandardRate,
      }
    };
    setTariffs(updatedTariffs);
    localStorage.setItem('jadlog_route_tariffs', JSON.stringify(updatedTariffs));

    // 3. For any ledger records of this driver, force payout recalculations under updated rates
    const newLedger = { ...ledgerRecords };
    Object.keys(newLedger).forEach((key) => {
      const record = newLedger[key];
      if (record.driverId === editingCourierId) {
        const isCopavRoute = isCopav(uppercaseRoute);
        const basePayout = isCopavRoute
          ? (record.standardCount * editFormRate) + record.nonStandardCount
          : (record.standardCount * editFormRate) + 
            (record.nonStandardCount * (computedNonStandardRate - editFormRate)); 
        const debits = (record.debitAdvance || 0) + (record.debitFuel || 0) + (record.debitLoss || 0);
        record.payoutAmount = basePayout - debits;
      }
    });
    setLedgerRecords(newLedger);
    localStorage.setItem('jadlog_fortnightly_ledger', JSON.stringify(newLedger));

    setEditingCourierId(null);
  };

  const confirmDeleteCourier = (driverId: string) => {
    // Add to deleted list to prevent showing up
    const updatedDeleted = [...deletedCouriers, driverId];
    setDeletedCouriers(updatedDeleted);
    localStorage.setItem('jadlog_deleted_couriers', JSON.stringify(updatedDeleted));

    // Remove from customCouriers list if they are in there
    const updatedCustom = customCouriers.filter(c => c.id !== driverId);
    setCustomCouriers(updatedCustom);
    localStorage.setItem('jadlog_custom_couriers', JSON.stringify(updatedCustom));

    // Delete mappings
    const updatedMappings = { ...driverMappings };
    delete updatedMappings[driverId];
    setDriverMappings(updatedMappings);
    localStorage.setItem('jadlog_driver_route_mappings', JSON.stringify(updatedMappings));

    // Clean active ledger records belonging to this driver
    const newLedger = { ...ledgerRecords };
    Object.keys(newLedger).forEach((key) => {
      if (key.endsWith(`-${driverId}`)) {
        delete newLedger[key];
      }
    });
    setLedgerRecords(newLedger);
    localStorage.setItem('jadlog_fortnightly_ledger', JSON.stringify(newLedger));

    setEditingCourierId(null);
    setCourierToDelete(null);
  };

  const handleDeleteCourier = (driverId: string) => {
    const courier = allCouriers.find(c => c.id === driverId);
    const name = courier ? courier.name : 'Entregador';
    setCourierToDelete({ id: driverId, name });
  };

  const handleCreateCourier = () => {
    if (!createFormName.trim() || !createFormRoute.trim()) {
      alert('Por favor, preencha o nome do entregador e a sigla da rota.');
      return;
    }

    const nextDriverId = `custom-drv-${Date.now()}`;
    const uppercaseRoute = createFormRoute.toUpperCase().trim();

    // 1. Save in custom couriers state
    const newCourier = {
      id: nextDriverId,
      name: createFormName.trim(),
      phone: createFormPhone.trim(),
      pix: createFormPix.trim(),
    };
    const updatedCustom = [...customCouriers, newCourier];
    setCustomCouriers(updatedCustom);
    localStorage.setItem('jadlog_custom_couriers', JSON.stringify(updatedCustom));

    // 2. Set mappings
    const updatedMappings = {
      ...driverMappings,
      [nextDriverId]: {
        routeAlias: uppercaseRoute,
        defaultName: createFormName.trim(),
        phone: createFormPhone.trim(),
        pix: createFormPix.trim(),
      }
    };
    setDriverMappings(updatedMappings);
    localStorage.setItem('jadlog_driver_route_mappings', JSON.stringify(updatedMappings));

    // 3. Set tariff
    const isPauloAfonso = createFormCity.toLowerCase().includes('paulo afonso');
    let computedNonStandardRate = isPauloAfonso ? createFormRate + 1.50 : createFormRate * 2;
    if (isCopav(uppercaseRoute)) {
      computedNonStandardRate = createFormRate;
    }

    const updatedTariffs = {
      ...tariffs,
      [uppercaseRoute]: {
        routeAlias: uppercaseRoute,
        cityName: createFormCity,
        standardRate: createFormRate,
        nonStandardRate: computedNonStandardRate,
      }
    };
    setTariffs(updatedTariffs);
    localStorage.setItem('jadlog_route_tariffs', JSON.stringify(updatedTariffs));

    // 4. Initialize ledger entry for the current period
    const key = getRecordKey(nextDriverId);
    const newLedger = {
      ...ledgerRecords,
      [key]: {
        id: key,
        year: selectedYear,
        month: selectedMonth,
        fortnight: selectedFortnight,
        driverId: nextDriverId,
        standardCount: 0,
        nonStandardCount: 0,
        occurrencesCount: 0,
        pendingCount: 0,
        payoutAmount: 0,
        isPaid: false,
      }
    };
    setLedgerRecords(newLedger);
    localStorage.setItem('jadlog_fortnightly_ledger', JSON.stringify(newLedger));

    setIsCreateModalOpen(false);
    setCreateFormName('');
    setCreateFormRoute('');
    setCreateFormCity('Paulo Afonso - BA (Dentro da Cidade)');
    setCreateFormRate(2.50);
    setCreateFormPhone('');
    setCreateFormPix('');
  };

  // Modify individual rates
  const handleUpdateTariff = (routeAlias: string, field: 'standardRate' | 'nonStandardRate', valueStr: string) => {
    const numeric = parseFloat(valueStr.replace(',', '.'));
    if (isNaN(numeric) || numeric < 0) return;

    const existingTariff = tariffs[routeAlias] || { standardRate: 2.50, nonStandardRate: 4.00, routeAlias, cityName: '' };
    
    let updatedPricing = {
      ...existingTariff,
      [field]: numeric,
    };

    // Auto-update nonStandardRate if standardRate changed, keeping standardRate + 1.50 only for Paulo Afonso
    if (field === 'standardRate') {
      const isPA = routeAlias === 'FABIO' || routeAlias === 'OPERACIONAL' || routeAlias === 'FELIPE - EXTRA' || routeAlias === 'EXTRA 01' || (existingTariff.cityName || '').toLowerCase().includes('paulo afonso');
      updatedPricing.nonStandardRate = isPA ? numeric + 1.50 : numeric * 2;
    }

    const updatedTariffs = {
      ...tariffs,
      [routeAlias]: updatedPricing,
    };

    setTariffs(updatedTariffs);
    localStorage.setItem('jadlog_route_tariffs', JSON.stringify(updatedTariffs));

    // Force recalculating all active ledger amounts based on new tariffs
    const newLedger = { ...ledgerRecords };
    Object.keys(newLedger).forEach((key) => {
      const record = newLedger[key];
      const mapper = driverMappings[record.driverId];
      if (mapper && mapper.routeAlias === routeAlias) {
        const pricing = updatedPricing;
        const isCopavRoute = isCopav(routeAlias);
        const basePayout = isCopavRoute
          ? (record.standardCount * pricing.standardRate) + record.nonStandardCount
          : (record.standardCount * pricing.standardRate) + 
            (record.nonStandardCount * (pricing.nonStandardRate - pricing.standardRate));
        const debits = (record.debitAdvance || 0) + (record.debitFuel || 0) + (record.debitLoss || 0);
        record.payoutAmount = basePayout - debits;
      }
    });
    setLedgerRecords(newLedger);
    localStorage.setItem('jadlog_fortnightly_ledger', JSON.stringify(newLedger));
  };

  // Months labels list mapping
  const months = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];

  // Helper to format WhatsApp statement message
  const generateWhatsappMessage = (report: any) => {
    if (!report) return "";
    const prefixStr = report.fortnight === 1 ? "1ª" : "2ª";
    const yearStr = report.year || "";
    // Uppercase month name in Portuguese matching the example (e.g. JUNHO/2026)
    const monthNameUpper = (months[report.month - 1] || "").toUpperCase();
    
    // Period details & preview prediction based on the quinzena rules
    const monthStr = String(report.month).padStart(2, '0');
    let startDateStr = "";
    let endDateStr = "";
    let paymentDateStr = "";

    if (report.fortnight === 1) {
      startDateStr = `01/${monthStr}`;
      endDateStr = `15/${monthStr}`;
      // Payment is 17 days after June 15th, so we add 17:
      const paymentDate = new Date(report.year, report.month - 1, 15 + 17);
      paymentDateStr = `${String(paymentDate.getDate()).padStart(2, '0')}/${String(paymentDate.getMonth() + 1).padStart(2, '0')}`;
    } else {
      const lastDay = new Date(report.year, report.month, 0).getDate();
      startDateStr = `16/${monthStr}`;
      endDateStr = `${lastDay}/${monthStr}`;
      // Payment is 17 days after last day
      const paymentDate = new Date(report.year, report.month - 1, lastDay + 17);
      paymentDateStr = `${String(paymentDate.getDate()).padStart(2, '0')}/${String(paymentDate.getMonth() + 1).padStart(2, '0')}`;
    }

    const isCopavRoute = isCopav(report.routeAlias);
    
    let calcDetails = "";
    if (isCopavRoute) {
      calcDetails = `📦 *Entregas Concluídas:* ${report.standardCount} x R$ ${report.tariffs.standardRate.toFixed(2)} = R$ ${(report.standardCount * report.tariffs.standardRate).toFixed(2)}\n➕ *COPAV do período:* R$ ${report.nonStandardCount.toFixed(2)}`;
    } else {
      const extraRate = report.tariffs.nonStandardRate - report.tariffs.standardRate;
      calcDetails = `📦 *Entregas Concluídas:* ${report.standardCount} x R$ ${report.tariffs.standardRate.toFixed(2)} = R$ ${(report.standardCount * report.tariffs.standardRate).toFixed(2)}`;
      if (report.nonStandardCount > 0) {
        calcDetails += `\n➕ *Fora do Padrão:* ${report.nonStandardCount} x R$ ${extraRate.toFixed(2)} = R$ ${(report.nonStandardCount * extraRate).toFixed(2)}`;
      } else {
        calcDetails += `\n➕ *Fora do Padrão:* R$ 0.00`;
      }
    }

    let occDetails = "⚠️ *Ocorrências/Pendências:* ";
    if (report.occurrencesCount === 0 && report.pendingCount === 0) {
      occDetails += "Nenhuma";
    } else {
      const parts = [];
      if (report.occurrencesCount > 0) {
        parts.push(`${report.occurrencesCount} ocorrência(s)`);
      }
      if (report.pendingCount > 0) {
        parts.push(`${report.pendingCount} pendente(s)`);
      }
      occDetails += parts.join(" | ");
    }

    let debitDetails = "";
    const totalDebits = (report.debitAdvance || 0) + (report.debitFuel || 0) + (report.debitLoss || 0);
    if (totalDebits > 0) {
      debitDetails = `\n🛑 *Débitos Descontados:*`;
      if (report.debitAdvance > 0) {
        debitDetails += `\n- Adiantamento: R$ ${report.debitAdvance.toFixed(2)}`;
      }
      if (report.debitFuel > 0) {
        debitDetails += `\n- Combustível: R$ ${report.debitFuel.toFixed(2)}`;
      }
      if (report.debitLoss > 0) {
        debitDetails += `\n- Multa/Extravio: R$ ${report.debitLoss.toFixed(2)}`;
      }
      debitDetails += `\n💸 *Total de descontos:* R$ ${totalDebits.toFixed(2)}\n`;
    }

    const monthPascal = months[report.month - 1]; // e.g. Junho
    const fStr = report.fortnight === 1 ? "1." : "2.";

    return `📝 *CONFERÊNCIA DE REPASSE - JADLOG PAULO AFONSO*

👤 *Entregador:* ${report.driverName}
📍 *Rota/Cidade:* ${report.routeAlias} - ${report.cityName}
📅 *Período:* ${prefixStr} Quinzena de ${monthNameUpper}/${yearStr}

---
${calcDetails}

${occDetails}
${debitDetails}
---
💰 *Total Líquido a Receber:* *R$ ${report.payoutAmount.toFixed(2)}*
💳 *Chave Pix:* ${report.pix || 'Não cadastrada'}

Entregas realizadas na ${fStr} quinzena de ${monthPascal} (${startDateStr} até ${endDateStr}).
Previsão de pagamento até dia ${paymentDateStr})
Por favor, confira os valores acima. Caso tenha alguma divergência nos dê um retorno para que possamos ajustar antes do fechamento financeiro.`;
  };

  const cleanPhoneForWhatsapp = (phoneStr?: string) => {
    if (!phoneStr) return "";
    const cleaned = phoneStr.replace(/\D/g, ""); // Strip non-digits
    if (cleaned.length === 11 || cleaned.length === 10) {
      return `55${cleaned}`; // Add Brazil code if has 11/10 digits
    }
    return cleaned;
  };

  // Map driver info merged with current fortnight entries
  const compiledReports = useMemo(() => {
    return allCouriers.map((drv) => {
      const mapper = driverMappings[drv.id] || { routeAlias: drv.id, defaultName: drv.name };
      const pricing = tariffs[mapper.routeAlias] || { standardRate: 2.5, nonStandardRate: 4.0, cityName: 'Paulo Afonso - BA (Dentro da Cidade)' };
      
      const recordKey = getRecordKey(drv.id);
      const record = ledgerRecords[recordKey] || {
        standardCount: 0,
        nonStandardCount: 0,
        occurrencesCount: 0,
        pendingCount: 0,
        isPaid: false,
        payoutAmount: 0,
        debitAdvance: 0,
        debitFuel: 0,
        debitLoss: 0,
      };

      const totalConcluidas = record.standardCount;

      return {
        driverId: drv.id,
        driverName: mapper.defaultName,
        phone: drv.phone,
        pix: drv.pix || '',
        vehicle: drv.vehicle,
        routeAlias: mapper.routeAlias,
        cityName: pricing.cityName,
        tariffs: pricing,
        // Quantities
        standardCount: record.standardCount,
        nonStandardCount: record.nonStandardCount,
        totalCompleted: totalConcluidas,
        occurrencesCount: record.occurrencesCount,
        pendingCount: record.pendingCount,
        payoutAmount: record.payoutAmount,
        debitAdvance: record.debitAdvance || 0,
        debitFuel: record.debitFuel || 0,
        debitLoss: record.debitLoss || 0,
        isPaid: record.isPaid,
        paymentDate: record.paymentDate,
        isCustom: drv.isCustom
      };
    }).filter(rep => {
      const term = searchQuery.toLowerCase();
      return rep.driverName.toLowerCase().includes(term) || rep.routeAlias.toLowerCase().includes(term);
    }).sort((a, b) => {
      const aIsPA = a.cityName.toLowerCase().includes('paulo afonso');
      const bIsPA = b.cityName.toLowerCase().includes('paulo afonso');
      
      if (aIsPA && !bIsPA) return -1;
      if (!aIsPA && bIsPA) return 1;
      
      const cityCompare = a.cityName.localeCompare(b.cityName);
      if (cityCompare !== 0) return cityCompare;
      
      return a.routeAlias.localeCompare(b.routeAlias);
    });
  }, [allCouriers, ledgerRecords, tariffs, driverMappings, searchQuery, selectedYear, selectedMonth, selectedFortnight]);

  // Aggregate summaries
  const totals = useMemo(() => {
    let totalCompleted = 0;
    let totalStandard = 0;
    let totalNonStandard = 0;
    let totalOccurrences = 0;
    let totalPending = 0;
    let totalPayout = 0;
    let totalPaid = 0;
    let totalOutstanding = 0;
    let totalAdvanceDebit = 0;
    let totalFuelDebit = 0;
    let totalLossDebit = 0;

    compiledReports.forEach(r => {
      totalStandard += r.standardCount;
      totalNonStandard += r.nonStandardCount;
      totalCompleted += r.totalCompleted;
      totalOccurrences += r.occurrencesCount;
      totalPending += r.pendingCount;
      totalPayout += r.payoutAmount;
      totalAdvanceDebit += r.debitAdvance || 0;
      totalFuelDebit += r.debitFuel || 0;
      totalLossDebit += r.debitLoss || 0;
      if (r.isPaid) {
        totalPaid += r.payoutAmount;
      } else {
        totalOutstanding += r.payoutAmount;
      }
    });

    return {
      totalCompleted,
      totalStandard,
      totalNonStandard,
      totalOccurrences,
      totalPending,
      totalPayout,
      totalPaid,
      totalOutstanding,
      totalAdvanceDebit,
      totalFuelDebit,
      totalLossDebit,
      totalDebitsAll: totalAdvanceDebit + totalFuelDebit + totalLossDebit,
    };
  }, [compiledReports]);

  // Print helper window
  const triggerPrintClose = () => {
    if (isInIframe) {
      setShowPrintInstructions(true);
    } else {
      window.print();
    }
  };

  return (
    <div className="space-y-6">
      {/* Jadlog Custom Header / Red Branded Navbar */}
      <div className="bg-[#e31a1a] text-white rounded-3xl p-5 shadow-md flex flex-col md:flex-row justify-between items-center gap-4 border border-[#c11515] print:hidden">
        <div className="flex items-center gap-4">
          <div className="bg-white px-4 py-2.5 rounded-2xl flex items-center justify-center border-b-4 border-slate-300">
            <span className="text-[#e31a1a] font-black text-2xl tracking-tighter select-none font-sans italic">
              jad<span className="text-[#333]">log</span>
            </span>
          </div>
          <div>
            <span className="bg-zinc-900/40 text-xs px-2.5 py-1 rounded-full font-bold uppercase tracking-wider text-amber-300 flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5" />
              Lógica de Lançamento Manual Ativa
            </span>
            <p className="text-sm font-semibold text-rose-100 mt-1">
              Painel para entrada quinzenal de quantidades e liquidação imediata da folha de pagamento.
            </p>
          </div>
        </div>

        {/* View Switches */}
        <div className="flex bg-slate-900/25 p-1 rounded-2xl gap-1">
          <button
            onClick={() => setActiveSubView('cards')}
            className={`text-xs font-bold px-4 py-2 rounded-xl transition-all cursor-pointer ${
              activeSubView === 'cards'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-rose-100 hover:bg-white/10'
            }`}
          >
            Visualizar Cards (Modo Anexo)
          </button>
          <button
            onClick={() => setActiveSubView('spreadsheet')}
            className={`text-xs font-bold px-4 py-2 rounded-xl transition-all cursor-pointer ${
              activeSubView === 'spreadsheet'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-rose-100 hover:bg-white/10'
            }`}
          >
            Relatório / Planilha Fechamento
          </button>
          <button
            onClick={() => setActiveSubView('finance_report')}
            className={`text-xs font-bold px-4 py-2 rounded-xl transition-all cursor-pointer ${
              activeSubView === 'finance_report'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-rose-100 hover:bg-white/10'
            }`}
          >
            Resumo Financeiro (PIX)
          </button>
        </div>
      </div>

      {/* Control Panel: Fortnight & Period details */}
      <div className="bg-white border border-slate-200/95 rounded-3xl p-5 shadow-xs space-y-4 print:hidden">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          <div>
            <div className="flex items-center gap-1.5 text-orange-600 font-extrabold text-xs uppercase tracking-wider mb-1">
              <Calendar className="w-4 h-4 text-orange-500" />
              <span>Controle de Fechamento por Período</span>
            </div>
            <h2 className="text-xl font-black text-slate-900">
              Quinzena de Apuração
            </h2>
            <p className="text-xs text-slate-500">
              Digite as quantidades de cada entregador. Elas ficarão salvas automaticamente para o período escolhido.
            </p>
          </div>

          {/* Quick period selectors */}
          <div className="flex flex-wrap items-center gap-2 bg-slate-50 p-2.5 rounded-2xl border border-slate-150">
            <div>
              <label className="block text-[9px] uppercase tracking-wider font-extrabold text-slate-500 mb-0.5">Ano</label>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(Number(e.target.value))}
                className="text-xs bg-white border border-slate-200 rounded-lg py-1 px-2 font-bold text-slate-700 outline-orange-500"
              >
                <option value={2026}>2026</option>
                <option value={2025}>2025</option>
              </select>
            </div>

            <div>
              <label className="block text-[9px] uppercase tracking-wider font-extrabold text-slate-500 mb-0.5">Mês</label>
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(Number(e.target.value))}
                className="text-xs bg-white border border-slate-200 rounded-lg py-1 px-3 font-bold text-slate-700 outline-orange-500"
              >
                {months.map((m, idx) => (
                  <option key={idx} value={idx}>{m}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[9px] uppercase tracking-wider font-extrabold text-slate-500 mb-0.5">Período Quinzenal</label>
              <select
                value={selectedFortnight}
                onChange={(e) => setSelectedFortnight(Number(e.target.value) as 1 | 2)}
                className="text-xs bg-slate-900 text-white border-none rounded-lg py-1 px-2.5 font-bold outline-orange-500 cursor-pointer hover:bg-slate-800 transition-colors"
              >
                <option value={1}>1ª Quinzena (Dia 01 ao 15)</option>
                <option value={2}>2ª Quinzena (Dia 16 ao Fim)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Dynamic Period summary and Bulk Controls */}
        <div className="flex flex-col sm:flex-row items-center justify-between p-3.5 bg-slate-50 border border-slate-200 rounded-2xl gap-3 text-xs">
          <div>
            <span className="font-semibold text-slate-700">Período Selecionado: </span>
            <span className="font-mono bg-orange-50 text-orange-700 border border-orange-100 px-2.5 py-0.5 rounded-lg font-black">
              {selectedFortnight === 1 ? '01' : '16'} a {selectedFortnight === 1 ? '15' : '30/31'} de {months[selectedMonth]} de {selectedYear}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="px-3 py-1.5 bg-orange-500 hover:bg-orange-600 text-white rounded-xl font-bold text-[11px] transition-colors flex items-center gap-1 cursor-pointer shadow-xs"
              title="Cadastrar um novo entregador ou rota de forma avulsa"
            >
              <Plus className="w-3.5 h-3.5" />
              Cadastrar Novo Card / Rota
            </button>
          </div>
        </div>
      </div>

      {/* Fortnightly accounting cards summary widgets */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 print:grid-cols-2">
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
          <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
            Total Entregas Realizadas
          </span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-black text-slate-800">{totals.totalCompleted}</span>
            <span className="text-[10px] bg-slate-100 text-slate-500 font-bold px-1.5 py-0.5 rounded">
              Pacotes
            </span>
          </div>
          <span className="text-[10px] text-slate-500 font-medium mt-1.5 block">
            {totals.totalStandard} padrão • {totals.totalNonStandard} fora do padrão
          </span>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
          <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
            Calculo Total de Repasse
          </span>
          <div className="flex items-baseline gap-1 mt-1 text-orange-600">
            <span className="text-xs font-bold">R$</span>
            <span className="text-2xl font-black">{totals.totalPayout.toFixed(2)}</span>
          </div>
          <span className="text-[10px] text-slate-500 mt-2 block">
            Contabilizado pelos preços de rota
          </span>
        </div>
      </div>

      {/* Search Input */}
      <div className="flex items-center gap-2.5 bg-white border border-slate-200 p-3 rounded-2xl w-full max-w-sm ml-auto print:hidden">
        <Search className="w-4 h-4 text-slate-400 shrink-0" />
        <input
          type="text"
          placeholder="Localizar entregador ou rota..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full text-xs outline-none bg-transparent"
        />
        {searchQuery && (
          <button 
            onClick={() => setSearchQuery('')}
            className="text-[10px] bg-slate-100 hover:bg-slate-200 text-slate-500 rounded-full w-4 h-4 flex items-center justify-center cursor-pointer"
          >
            ×
          </button>
        )}
      </div>

      {/* ACTIVE SUBVIEW 1: CARDS VIEW (Match Jadlog Attachment Image) */}
      {activeSubView === 'cards' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {compiledReports.map((report) => {
            const hasValues = report.totalCompleted > 0 || report.occurrencesCount > 0 || report.pendingCount > 0;
            return (
              <div 
                key={report.driverId} 
                className="bg-white rounded-3xl overflow-hidden shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between border border-slate-200 relative group"
              >
                {/* Visual Header inspired by Jadlog card */}
                <div className="bg-[#10b981] text-white p-3.5 text-center flex flex-col justify-center items-center relative">
                  <button
                    onClick={() => handleDeleteCourier(report.driverId)}
                    className="absolute top-2.5 right-9 p-1 text-emerald-100 hover:text-rose-200 hover:bg-rose-700/60 rounded-lg transition-colors cursor-pointer print:hidden"
                    title="Excluir este card permanentemente"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>

                  <button
                    onClick={() => {
                      setEditingCourierId(report.driverId);
                      setEditFormName(report.driverName);
                      setEditFormRoute(report.routeAlias);
                      setEditFormCity(report.cityName);
                      setEditFormRate(report.tariffs.standardRate);
                      setEditFormPix(report.pix || '');
                      setEditFormPhone(report.phone || '');
                    }}
                    className="absolute top-2.5 right-2.5 p-1 text-emerald-100 hover:text-white hover:bg-emerald-700/50 rounded-lg transition-colors cursor-pointer print:hidden"
                    title="Editar informações ou trocar cidade/tarifa do card"
                  >
                    <Settings className="w-3.5 h-3.5" />
                  </button>

                  <span className="text-[10px] uppercase font-semibold text-emerald-100 tracking-wider">
                    courier
                  </span>
                  <span className="text-base font-black tracking-tight mt-0.5 drop-shadow-xs">
                    {report.routeAlias}
                  </span>
                </div>

                {/* Main statistics columns exactly resembling attachment */}
                <div className="p-4 border-b border-slate-100 bg-white flex flex-col sm:flex-row gap-4 items-center justify-between">
                  <div className="text-center sm:text-left">
                    <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider block">
                      Entregas Concluídas
                    </span>
                    <div className="text-3xl font-black text-slate-850 font-mono mt-0.5">
                      {report.totalCompleted}
                    </div>
                  </div>

                  {/* Sub-inputs for standard and out-of-pattern */}
                  <div className="flex gap-2.5 bg-slate-50 border border-slate-200 p-2.5 rounded-2xl text-[11px] w-full sm:w-auto">
                    <div className="flex items-center gap-1.5 text-slate-600 font-bold justify-between sm:justify-start w-full sm:w-auto">
                      <span>Padrão:</span>
                      <input
                        type="number"
                        value={report.standardCount}
                        onChange={(e) => updateSingleRecord(report.driverId, { 
                          standardCount: Math.max(0, parseInt(e.target.value) || 0) 
                        })}
                        className="w-12 text-center text-xs font-black font-mono bg-white border border-slate-250 rounded-lg py-1 px-0.5 cursor-pointer focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 focus:outline-none text-slate-800"
                      />
                    </div>
                    <div className="w-px bg-slate-200 self-stretch hidden sm:block"></div>
                    <div className="flex items-center gap-1.5 text-amber-800 font-bold justify-between sm:justify-start w-full sm:w-auto">
                      <span title={isCopav(report.routeAlias) ? "Valor adicional em R$ somado ao total" : "Adicionais fora do padrão (ganham acréscimo)"}>
                        {isCopav(report.routeAlias) ? "Valor COPAV:" : "Fora Padrão: ⭐"}
                      </span>
                      <input
                        type={isCopav(report.routeAlias) ? "text" : "number"}
                        inputMode={isCopav(report.routeAlias) ? "decimal" : "numeric"}
                        placeholder={isCopav(report.routeAlias) ? "0,00" : "0"}
                        value={
                          localFora[report.driverId] !== undefined
                            ? localFora[report.driverId]
                            : (report.nonStandardCount === 0 ? "" : String(report.nonStandardCount))
                        }
                        onChange={(e) => {
                          const val = e.target.value.replace(',', '.'); // Allow both comma and dot decimals for Brazilian users
                          setLocalFora(prev => ({ ...prev, [report.driverId]: val }));

                          const parsed = isCopav(report.routeAlias) ? (parseFloat(val) || 0) : (parseInt(val) || 0);
                          updateSingleRecord(report.driverId, { 
                            nonStandardCount: Math.max(0, parsed) 
                          });
                        }}
                        onBlur={() => {
                          setLocalFora(prev => {
                            const copy = { ...prev };
                            delete copy[report.driverId];
                            return copy;
                          });
                        }}
                        className={`${isCopav(report.routeAlias) ? 'w-16 text-center' : 'w-12 text-center'} text-xs font-black font-mono bg-white border border-slate-250 rounded-lg py-1 px-0.5 cursor-pointer focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 focus:outline-none text-amber-700`}
                      />
                    </div>
                  </div>
                </div>

                {/* Débitos Section */}
                <div className="p-3.5 border-b border-rose-100 bg-rose-50/25 space-y-2">
                  <div className="flex items-center gap-1.5 text-[10px] uppercase font-black text-rose-700 tracking-wider">
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-600 inline-block animate-pulse shrink-0"></span>
                    <span>Lançar Débitos Descontados</span>
                  </div>
                  <div className="grid grid-cols-3 gap-1.5">
                    {/* Adiantamento */}
                    <div className="bg-white border border-rose-150 rounded-xl p-1.5 flex flex-col justify-between min-h-[58px]">
                      <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tight block text-center" title="Adiantamento concedido">Adiantam.</span>
                      <div className="mt-1 flex items-center bg-slate-50 rounded-lg border border-slate-200 px-1 py-0.5">
                        <span className="text-[9px] text-rose-600 mr-0.5 font-bold">R$</span>
                        <input
                          type="number"
                          step="any"
                          value={report.debitAdvance || ''}
                          placeholder="0"
                          onChange={(e) => {
                            const val = parseFloat(e.target.value) || 0;
                            updateSingleRecord(report.driverId, { debitAdvance: Math.max(0, val) });
                          }}
                          className="w-full text-[11px] font-black text-right font-mono bg-transparent focus:outline-none text-rose-700"
                        />
                      </div>
                    </div>
                    {/* Combustível */}
                    <div className="bg-white border border-rose-150 rounded-xl p-1.5 flex flex-col justify-between min-h-[58px]">
                      <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tight block text-center" title="Combustível fornecido">Combust.</span>
                      <div className="mt-1 flex items-center bg-slate-50 rounded-lg border border-slate-200 px-1 py-0.5">
                        <span className="text-[9px] text-rose-600 mr-0.5 font-bold">R$</span>
                        <input
                          type="number"
                          step="any"
                          value={report.debitFuel || ''}
                          placeholder="0"
                          onChange={(e) => {
                            const val = parseFloat(e.target.value) || 0;
                            updateSingleRecord(report.driverId, { debitFuel: Math.max(0, val) });
                          }}
                          className="w-full text-[11px] font-black text-right font-mono bg-transparent focus:outline-none text-rose-700"
                        />
                      </div>
                    </div>
                    {/* Multa/Extravio */}
                    <div className="bg-white border border-rose-150 rounded-xl p-1.5 flex flex-col justify-between min-h-[58px]">
                      <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tight block text-center" title="Multas de trânsito ou extravios de mercadoria">Multa/Extr</span>
                      <div className="mt-1 flex items-center bg-slate-50 rounded-lg border border-slate-200 px-1 py-0.5">
                        <span className="text-[9px] text-rose-600 mr-0.5 font-bold">R$</span>
                        <input
                          type="number"
                          step="any"
                          value={report.debitLoss || ''}
                          placeholder="0"
                          onChange={(e) => {
                            const val = parseFloat(e.target.value) || 0;
                            updateSingleRecord(report.driverId, { debitLoss: Math.max(0, val) });
                          }}
                          className="w-full text-[11px] font-black text-right font-mono bg-transparent focus:outline-none text-rose-700"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Performance & Occurrences Section (SLA) */}
                <div className="p-3.5 border-b border-sky-100 bg-sky-50/25 space-y-2">
                  <div className="flex items-center justify-between text-[10px] uppercase font-black text-sky-700 tracking-wider">
                    <div className="flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-sky-600 inline-block animate-pulse shrink-0"></span>
                      <span>Ocorrência, Pendência e SLA</span>
                    </div>
                    {/* Real-time SLA badge inside the card */}
                    <span className={`px-1.5 py-0.2 rounded font-mono font-black text-[9px] ${
                      Math.max(0, Math.min(100, Math.round(100 - ((report.occurrencesCount * 5) + (report.pendingCount * 2) + ((report.debitLoss || 0) * 0.2) * 1)))) >= 95
                        ? 'bg-emerald-100 text-emerald-800'
                        : Math.max(0, Math.min(100, Math.round(100 - ((report.occurrencesCount * 5) + (report.pendingCount * 2) + ((report.debitLoss || 0) * 0.2) * 1)))) >= 85
                          ? 'bg-orange-100 text-orange-850'
                          : 'bg-rose-100 text-rose-800'
                    }`}>
                      SLA: {Math.max(0, Math.min(100, Math.round(100 - ((report.occurrencesCount * 5) + (report.pendingCount * 2) + ((report.debitLoss || 0) * 0.2) * 1))))}%
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-1.5">
                    {/* Ocorrências */}
                    <div className="bg-white border border-sky-150 rounded-xl p-1.5 flex flex-col justify-between min-h-[58px]">
                      <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tight block text-center" title="Lançamento manual de ocorrências ocorridas no período">Ocorrências</span>
                      <div className="mt-1 flex items-center bg-slate-50 rounded-lg border border-slate-200 px-1 py-0.5">
                        <input
                          type="number"
                          min="0"
                          value={report.occurrencesCount}
                          onChange={(e) => {
                            const val = Math.max(0, parseInt(e.target.value) || 0);
                            updateSingleRecord(report.driverId, { occurrencesCount: val });
                          }}
                          className="w-full text-xs font-black text-center font-mono bg-transparent focus:outline-none text-sky-700"
                        />
                      </div>
                    </div>
                    {/* Pendências */}
                    <div className="bg-white border border-sky-150 rounded-xl p-1.5 flex flex-col justify-between min-h-[58px]">
                      <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tight block text-center" title="Lançamento manual de pendências ocorridas no período">Pendências</span>
                      <div className="mt-1 flex items-center bg-slate-50 rounded-lg border border-slate-200 px-1 py-0.5">
                        <input
                          type="number"
                          min="0"
                          value={report.pendingCount}
                          onChange={(e) => {
                            const val = Math.max(0, parseInt(e.target.value) || 0);
                            updateSingleRecord(report.driverId, { pendingCount: val });
                          }}
                          className="w-full text-xs font-black text-center font-mono bg-transparent focus:outline-none text-sky-700"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Sub-card detail band: pricing computation and markings */}
                <div className="p-3.5 bg-slate-55 border-b border-slate-100 flex flex-col gap-1.5 text-xs text-slate-600">
                  <div className="flex justify-between items-center text-[11px]">
                    <span className="font-bold text-slate-800">{report.driverName}</span>
                    <span className="text-[9px] bg-slate-100 px-1 py-0.5 rounded font-medium">{report.cityName}</span>
                  </div>

                  {/* Pricing and repasse results */}
                  <div className="flex items-center justify-between text-[11px] font-semibold bg-orange-50/70 p-2 rounded-xl text-orange-950 mt-1 border border-orange-100/50">
                    <span className="flex items-center">
                      <TrendingUp className="w-3.5 h-3.5 text-orange-600 mr-1" />
                      Repasse Calculado:
                    </span>
                    <span className="font-mono font-black text-orange-900">
                      R$ {report.payoutAmount.toFixed(2)}
                    </span>
                  </div>

                  {/* Pix & WhatsApp dynamic info */}
                  <div className="mt-1 bg-slate-50 border border-slate-150 rounded-xl p-2 text-[10px] space-y-1 text-slate-600">
                    <div className="flex justify-between items-center">
                      <span className="font-medium text-slate-400 flex items-center gap-1">
                        <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" /> WhatsApp:
                      </span>
                      {report.phone ? (
                        <a 
                          href={`https://wa.me/${cleanPhoneForWhatsapp(report.phone)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-bold text-orange-650 hover:underline flex items-center gap-0.5 print:text-slate-700"
                          title="Clique para abrir conversa no WhatsApp"
                        >
                          {report.phone}
                        </a>
                      ) : (
                        <span className="font-semibold text-slate-400 italic">Não Cadastrado</span>
                      )}
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="font-medium text-slate-400 flex items-center gap-1">
                        <CreditCard className="w-3.5 h-3.5 text-slate-400 shrink-0" /> Pix:
                      </span>
                      {report.pix ? (
                        <span 
                          title="Chave Pix do entregador"
                          className="font-mono font-bold text-slate-700 max-w-[150px] truncate select-all print:max-w-none"
                        >
                          {report.pix}
                        </span>
                      ) : (
                        <span className="font-semibold text-slate-400 italic">Não Cadastrado</span>
                      )}
                    </div>
                  </div>

                  {/* Little helper view of tariffs configured for this card */}
                  <div className="flex justify-between text-[9px] text-slate-400 px-1 font-medium italic mt-0.5">
                    <span>Taxa Padrão: R$ {report.tariffs.standardRate.toFixed(2)}</span>
                    {isCopav(report.routeAlias) ? (
                      <span>Adicional: Somado integralmente</span>
                    ) : (
                      <span>Fora do Padrão: R$ {report.tariffs.nonStandardRate.toFixed(2)}</span>
                    )}
                  </div>
                </div>

                {/* Bottom interactive block with orange bottom status border */}
                <div className="p-3 bg-slate-55 flex items-center justify-between z-10 rounded-b-3xl">
                  <button
                    onClick={() => setShareModalReport({ ...report, year: selectedYear, month: selectedMonth, fortnight: selectedFortnight })}
                    className="w-full text-center text-xs font-bold leading-none bg-slate-900 hover:bg-slate-800 text-white rounded-xl py-2.5 px-3 transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                  >
                    <FileText className="w-3.5 h-3.5" />
                    Resumo
                  </button>
                </div>

                {/* Orange bottom accent line inspired by Jadlog card bottom bar */}
                <div className="h-1 bg-orange-500 w-full" />
              </div>
            );
          })}
        </div>
      )}

      {/* ACTIVE SUBVIEW 2: SPREADSHEET / FECHAMENTO VIEW (Print friendly list) */}
      {activeSubView === 'spreadsheet' && (
        <div id="spreadsheet-print-container" className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm">
          {/* Custom landscape print CSS rule injected directly. Bulletproof for any container environment */}
          <style dangerouslySetInnerHTML={{ __html: `
            @media print {
              /* Hide every element on the website */
              body * {
                visibility: hidden !important;
              }
              /* Show ONLY our printed spreadsheet and its elements */
              #spreadsheet-print-container, #spreadsheet-print-container * {
                visibility: visible !important;
                color: #000000 !important;
              }
              #spreadsheet-print-container {
                position: absolute !important;
                left: 0 !important;
                top: 0 !important;
                width: 100% !important;
                margin: 0 !important;
                padding: 10px !important;
                border: none !important;
                box-shadow: none !important;
              }
              /* Hide buttons and help message when printing */
              .print\\:hidden {
                display: none !important;
                height: 0 !important;
                padding: 0 !important;
                margin: 0 !important;
              }
              /* Maximize page width to fit wide tables */
              @page {
                size: landscape;
                margin: 1cm;
              }
              /* Remove background graphics to make text crispy black */
              tr {
                background: none !important;
                page-break-inside: avoid;
              }
            }
          `}} />

          {/* Print instructions banner */}
          <div className="p-4 bg-yellow-50 border-b border-yellow-100 flex items-center justify-between text-xs text-yellow-850 font-medium print:hidden">
            <span className="flex items-center gap-1.5 flex-wrap">
              <Info className="w-4 h-4 text-amber-500 shrink-0" />
              <span>Esta visualização está formatada para relatórios. Use o botão ao lado para imprimir a folha de fecho da quinzena.</span>
              {isInIframe && (
                <span className="font-extrabold text-amber-900 ml-1 bg-amber-100/80 px-2 py-0.5 rounded border border-amber-200">
                  ⚠️ Editor Ativo: Clique ao lado e use a opção "Abrir em Nova Aba" para imprimir!
                </span>
              )}
            </span>
            <button
              onClick={triggerPrintClose}
              className="bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 py-1.5 px-3.5 rounded-xl font-bold transition-all flex items-center gap-1.5 shadow-xs cursor-pointer active:scale-97"
            >
              <Printer className="w-4 h-4 text-slate-500" />
              Imprimir Fechamento
            </button>
          </div>

          <div className="p-6 space-y-6">
            {/* Header for printer */}
            <div className="hidden print:flex items-center justify-between border-b pb-4 mb-4">
              <div>
                <h1 className="text-2xl font-black text-[#e31a1a]">JADLOG - POLO PAULO AFONSO BA</h1>
                <p className="text-xs text-slate-500 mt-1">Controle Quinzenal consolidado de repasses para entregadores contratados</p>
              </div>
              <div className="text-right text-xs bg-slate-100 p-2 rounded">
                <span className="font-bold">Período: </span>
                {selectedFortnight === 1 ? '01' : '16'} a {selectedFortnight === 1 ? '15' : '30/31'} de {months[selectedMonth]} {selectedYear}
              </div>
            </div>

            {/* Compiled Ledger Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-[10px] font-bold uppercase text-slate-500">
                    <th className="py-2.5 px-3">Rota / Courier</th>
                    <th className="py-2.5 px-3">Nome do Entregador</th>
                    <th className="py-2.5 px-3">Cidade / Rota Principal</th>
                    <th className="py-2.5 px-3 text-center">Total de Entregas</th>
                    <th className="py-2.5 px-3 text-center">Fora do Padrão (Adicional)</th>
                    <th className="py-2.5 px-3 text-center">Ocorrências</th>
                    <th className="py-2.5 px-3 text-center">Pendentes</th>
                    <th className="py-2.5 px-3 text-center">Débitos Descontados (R$)</th>
                    <th className="py-2.5 px-3 text-right">Repasse Total (R$)</th>
                    <th className="py-2.5 px-3 text-center">Situação</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-150">
                  {compiledReports.map((report) => (
                    <tr key={report.driverId} className="hover:bg-slate-50/50">
                      <td className="py-2.5 px-3 font-bold text-slate-800">{report.routeAlias}</td>
                      <td className="py-2.5 px-3 text-slate-650 font-medium">{report.driverName}</td>
                      <td className="py-2.5 px-3 text-[10px] text-slate-500 font-semibold">{report.cityName}</td>
                      
                      {/* Padrão count with inline editor */}
                      <td className="py-2.5 px-3 text-center print:font-mono font-bold">
                        <span className="hidden print:inline">{report.standardCount}</span>
                        <input
                          type="number"
                          value={report.standardCount}
                          onChange={(e) => updateSingleRecord(report.driverId, { 
                            standardCount: Math.max(0, parseInt(e.target.value) || 0) 
                          })}
                          className="w-12 text-center font-mono font-bold bg-slate-50 border border-slate-200 rounded px-1 py-0.5 print:hidden"
                        />
                      </td>

                      {/* Fora padrão count */}
                      <td className="py-2.5 px-3 text-center print:font-mono font-bold text-amber-700">
                        <span className="hidden print:inline">
                          {isCopav(report.routeAlias) ? `R$ ${report.nonStandardCount.toFixed(2)}` : report.nonStandardCount}
                        </span>
                        <input
                          type={isCopav(report.routeAlias) ? "text" : "number"}
                          inputMode={isCopav(report.routeAlias) ? "decimal" : "numeric"}
                          placeholder={isCopav(report.routeAlias) ? "0,00" : "0"}
                          value={
                            localFora[report.driverId] !== undefined
                              ? localFora[report.driverId]
                              : (report.nonStandardCount === 0 ? "" : String(report.nonStandardCount))
                          }
                          onChange={(e) => {
                            const val = e.target.value.replace(',', '.'); // Allow both comma and dot decimals for Brazilian users
                            setLocalFora(prev => ({ ...prev, [report.driverId]: val }));

                            const parsed = isCopav(report.routeAlias) ? (parseFloat(val) || 0) : (parseInt(val) || 0);
                            updateSingleRecord(report.driverId, { 
                              nonStandardCount: Math.max(0, parsed) 
                            });
                          }}
                          onBlur={() => {
                            setLocalFora(prev => {
                              const copy = { ...prev };
                              delete copy[report.driverId];
                              return copy;
                            });
                          }}
                          className={`${isCopav(report.routeAlias) ? 'w-20' : 'w-12'} text-center font-mono font-bold text-amber-700 bg-slate-55 border border-slate-200 rounded px-1 py-0.5 print:hidden hover:bg-white`}
                        />
                      </td>

                      <td className="py-2.5 px-3 text-center font-mono">
                        <span className="hidden print:inline">{report.occurrencesCount}</span>
                        <input
                          type="number"
                          value={report.occurrencesCount}
                          onChange={(e) => updateSingleRecord(report.driverId, { 
                            occurrencesCount: Math.max(0, parseInt(e.target.value) || 0) 
                          })}
                          className="w-10 text-center font-mono bg-slate-50 border border-slate-200 rounded px-1 py-0.5 print:hidden"
                        />
                      </td>

                      <td className="py-2.5 px-3 text-center font-mono">
                        <span className="hidden print:inline">{report.pendingCount}</span>
                        <input
                          type="number"
                          value={report.pendingCount}
                          onChange={(e) => updateSingleRecord(report.driverId, { 
                            pendingCount: Math.max(0, parseInt(e.target.value) || 0) 
                          })}
                          className="w-10 text-center font-mono bg-slate-50 border border-slate-200 rounded px-1 py-0.5 print:hidden"
                        />
                      </td>

                      {/* Debits column with inline inputs */}
                      <td className="py-2 px-1 text-center font-mono text-slate-700">
                        <div className="flex flex-col gap-1 items-stretch md:items-center max-w-[200px] mx-auto">
                          <div className="flex items-center justify-between text-[10px] text-slate-500 gap-1.5">
                            <span className="font-semibold">Adi:</span>
                            <span className="hidden print:inline font-bold">R$ {report.debitAdvance.toFixed(2)}</span>
                            <input 
                              type="number"
                              title="Adiantamento"
                              value={report.debitAdvance || ''}
                              onChange={(e) => {
                                const val = parseFloat(e.target.value) || 0;
                                updateSingleRecord(report.driverId, { debitAdvance: Math.max(0, val) });
                              }}
                              className="w-11 text-center text-[10px] font-bold bg-white border border-slate-200 rounded px-1 py-0.2 print:hidden text-rose-750"
                              placeholder="0"
                            />
                            <span className="font-semibold ml-1">Com:</span>
                            <span className="hidden print:inline font-bold">R$ {report.debitFuel.toFixed(2)}</span>
                            <input 
                              type="number"
                              title="Combustível"
                              value={report.debitFuel || ''}
                              onChange={(e) => {
                                const val = parseFloat(e.target.value) || 0;
                                updateSingleRecord(report.driverId, { debitFuel: Math.max(0, val) });
                              }}
                              className="w-11 text-center text-[10px] font-bold bg-white border border-slate-200 rounded px-1 py-0.2 print:hidden text-rose-750"
                              placeholder="0"
                            />
                            <span className="font-semibold ml-1">Mul:</span>
                            <span className="hidden print:inline font-bold">R$ {report.debitLoss.toFixed(2)}</span>
                            <input 
                              type="number"
                              title="Multa/Extravio"
                              value={report.debitLoss || ''}
                              onChange={(e) => {
                                const val = parseFloat(e.target.value) || 0;
                                updateSingleRecord(report.driverId, { debitLoss: Math.max(0, val) });
                              }}
                              className="w-11 text-center text-[10px] font-bold bg-white border border-slate-200 rounded px-1 py-0.2 print:hidden text-rose-750"
                              placeholder="0"
                            />
                          </div>
                          
                          {/* Consolidated printed visible text */}
                          <div className="hidden print:block text-[9px] text-slate-700 italic font-medium whitespace-nowrap">
                            R$ {report.debitAdvance.toFixed(2)} + R$ {report.debitFuel.toFixed(2)} + R$ {report.debitLoss.toFixed(2)}
                          </div>

                          <div className="text-[10px] font-extrabold text-rose-700">
                            Total: R$ {((report.debitAdvance || 0) + (report.debitFuel || 0) + (report.debitLoss || 0)).toFixed(2)}
                          </div>
                        </div>
                      </td>

                      <td className="py-2.5 px-3 text-right font-mono font-black text-slate-900">
                        R$ {report.payoutAmount.toFixed(2)}
                      </td>

                      <td className="py-2.5 px-3 text-center">
                        <div className="flex items-center justify-center">
                          <button
                            onClick={() => setShareModalReport({ ...report, year: selectedYear, month: selectedMonth, fortnight: selectedFortnight })}
                            className="bg-slate-900 hover:bg-slate-800 font-bold text-white px-2 py-1 rounded text-[9px] print:hidden cursor-pointer shadow-xs transition-colors whitespace-nowrap"
                          >
                            Resumo
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  
                  {/* Totals row */}
                  <tr className="bg-slate-100/90 font-bold text-slate-900">
                    <td colSpan={3} className="py-3 px-3 uppercase tracking-wider font-extrabold text-[#e31a1a]">TOTAL CONSOLIDADO</td>
                    <td className="py-3 px-3 text-center font-mono text-xs">{totals.totalCompleted}</td>
                    <td className="py-3 px-3 text-center font-mono text-xs text-amber-800">{totals.totalNonStandard}</td>
                    <td className="py-3 px-3 text-center font-mono text-xs text-red-600">{totals.totalOccurrences}</td>
                    <td className="py-3 px-3 text-center font-mono text-xs text-amber-605">{totals.totalPending}</td>
                    <td className="py-3 px-3 text-center font-mono text-xs text-rose-700">R$ {totals.totalDebitsAll.toFixed(2)}</td>
                    <td className="py-3 px-3 text-right font-mono text-xs text-[#e31a1a] font-extrabold">R$ {totals.totalPayout.toFixed(2)}</td>
                    <td className="py-3 px-3 text-center">
                      <span className="text-[9px] bg-slate-900 text-white rounded font-bold px-1.5 py-1">Quinzena #{selectedFortnight}</span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Signature fields for reports closing paper */}
            <div className="hidden print:grid grid-cols-2 gap-12 mt-12 pt-12 border-t border-dashed border-slate-300">
              <div className="text-center">
                <div className="h-0.5 bg-slate-400 mx-auto w-48 mb-1" />
                <p className="text-[10px] font-bold text-slate-600 uppercase">Assinatura do Responsável (Jadlog)</p>
                <p className="text-[9px] text-slate-400">{new Date().toLocaleDateString('pt-BR')}</p>
              </div>

              <div className="text-center">
                <div className="h-0.5 bg-slate-400 mx-auto w-48 mb-1" />
                <p className="text-[10px] font-bold text-slate-600 uppercase">Controle Financeiro / Auditoria</p>
                <p className="text-[9px] text-slate-400">Polo Paulo Afonso BA</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ACTIVE SUBVIEW 3: RESUMO PARA SETOR FINANCEIRO (PIX + ESPAÇO DE CANETA) */}
      {activeSubView === 'finance_report' && (
        <div id="finance-print-report" className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm">
          {/* Custom print CSS rule injected directly. Bulletproof for any container environment */}
          <style dangerouslySetInnerHTML={{ __html: `
            @media print {
              /* Hide every element on the website */
              body * {
                visibility: hidden !important;
              }
              /* Show ONLY our printed report and its elements */
              #finance-print-report, #finance-print-report * {
                visibility: visible !important;
                color: #000000 !important;
              }
              #finance-print-report {
                position: absolute !important;
                left: 0 !important;
                top: 0 !important;
                width: 100% !important;
                margin: 0 !important;
                padding: 10px !important;
                border: none !important;
                box-shadow: none !important;
              }
              /* Hide buttons and help message when printing */
              .print\\:hidden {
                display: none !important;
                height: 0 !important;
                padding: 0 !important;
                margin: 0 !important;
              }
              /* Maximize page width and prevent page margin cuts */
              @page {
                size: portrait;
                margin: 1.5cm;
              }
              /* Remove background graphics to make text crispy black */
              tr {
                background: none !important;
                page-break-inside: avoid;
              }
            }
          `}} />

          {/* Print guidance banner - only visible on screen */}
          <div className="p-4 bg-emerald-50 border-b border-emerald-100 flex items-center justify-between text-xs text-emerald-850 font-medium print:hidden flex-wrap gap-2">
            <span className="flex items-center gap-2 font-bold flex-wrap">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0 inline-block animate-pulse"></span>
              <span>Relatório Simplificado Exclusivo para o Financeiro. Clutter e informações desnecessárias (SLA, quantidades, etc) foram removidos.</span>
              {isInIframe && (
                <span className="font-extrabold text-emerald-900 bg-emerald-100/90 px-2 py-0.5 rounded border border-emerald-200">
                  ⚠️ Editor Ativo: Use o botão ao lado para abrir e imprimir sem erros!
                </span>
              )}
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={triggerPrintClose}
                className="bg-emerald-600 hover:bg-emerald-700 text-white py-1.5 px-4 rounded-xl font-bold text-xs transition-colors flex items-center gap-1.5 shadow-sm cursor-pointer active:scale-97"
              >
                <Printer className="w-3.5 h-3.5" />
                Imprimir Documento
              </button>
            </div>
          </div>

          <div className="p-6">
            <div className="overflow-x-auto max-w-4xl mx-auto">
              <table className="w-full text-left border-collapse border-2 border-black font-sans">
                <thead>
                  <tr className="border-[3px] border-black bg-white">
                    <th className="py-3 px-4 border border-black font-black text-xs tracking-wider text-[#e31a1a] uppercase">
                      {(months[selectedMonth] || "").toUpperCase()} {selectedFortnight}. QUINZENA
                    </th>
                    <th className="py-3 px-4 border border-black font-black text-xs tracking-wider text-[#e31a1a] text-center w-[25%]">
                      R$
                    </th>
                    <th className="py-3 px-4 border border-black font-black text-xs tracking-wider text-[#e31a1a] text-center w-[30%]">
                      DATA DE PAGAMENTO
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-black">
                  {compiledReports.map((report) => {
                    const formattedRoute = report.routeAlias || '';
                    const formattedDriver = report.driverName || '';
                    
                    // Format as ROTA NAME - DRIVER NAME if both exist and differ, otherwise just route
                    const joinName = formattedRoute && formattedDriver && formattedRoute !== formattedDriver
                      ? `${formattedRoute} - ${formattedDriver}`
                      : (formattedRoute || formattedDriver || '');
                    const displayName = joinName.toUpperCase();

                    return (
                      <tr key={report.driverId} className="hover:bg-slate-50/50 print:break-inside-avoid">
                        <td className="py-3 px-4 border border-black text-xs font-bold text-slate-900 tracking-tight leading-snug">
                          {displayName}
                        </td>
                        <td className="py-3 px-4 border border-black text-xs font-bold font-mono text-slate-900 text-right pr-6">
                          R$&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;{report.payoutAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                        <td className="py-3 px-4 border border-black bg-white w-[30%] h-10">
                          {/* Blank cell for payment date */}
                        </td>
                      </tr>
                    );
                  })}
                  
                  {/* Total row at the bottom of the table */}
                  <tr className="border-[3px] border-black bg-slate-50/60 font-black print:bg-transparent">
                    <td className="py-3 px-4 border border-black text-xs font-black text-[#e31a1a] tracking-tight uppercase">
                      TOTAL
                    </td>
                    <td className="py-3 px-4 border border-black text-xs font-black font-mono text-[#e31a1a] text-right pr-6">
                      R$&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;{totals.totalPayout.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                    <td className="py-3 px-4 border border-black bg-white w-[30%] h-10">
                      {/* Blank cell */}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* DYNAMIC SETTINGS BLOCK: Tariffs and cities configuration rates */}
      <div className="bg-white border border-slate-250 rounded-3xl p-5 shadow-xs print:hidden">
        <div className="flex items-center gap-1.5 text-slate-700 font-bold mb-3">
          <Sliders className="w-4 h-4 text-orange-500" />
          <h3 className="text-xs font-black uppercase text-slate-700 tracking-wider">
            Painel de Configuração de Tarifas e Cidades
          </h3>
        </div>
        <p className="text-[11px] text-slate-500 mb-4">
          Ajuste as taxas pagas aos entregadores em cada rota de transporte. As alterações efetuadas recalcularão em tempo real toda a folha da quinzena selecionada.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {(Object.values(tariffs) as RoutePricing[]).map((tariff) => (
            <div key={tariff.routeAlias} className="bg-slate-50 rounded-2xl p-3 border border-slate-200 flex flex-col justify-between">
              <div>
                <span className="text-[9px] font-bold bg-[#10b981] text-white px-2 py-0.5 rounded-full inline-block mb-1">
                  {tariff.routeAlias}
                </span>
                <p className="text-xs font-bold text-slate-700 tracking-tight leading-snug">{tariff.cityName}</p>
              </div>

              <div className="grid grid-cols-2 gap-2 mt-2 pt-2 border-t border-dashed border-slate-200">
                <div>
                  <label className="block text-[8px] uppercase tracking-wider font-extrabold text-slate-400 mb-0.5">Taxa Padrão (R$)</label>
                  <input
                    type="text"
                    value={tariff.standardRate.toFixed(2)}
                    onChange={(e) => handleUpdateTariff(tariff.routeAlias, 'standardRate', e.target.value)}
                    className="w-full text-xs font-mono font-bold bg-white border border-slate-200 rounded px-1.5 py-0.5 focus:border-emerald-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[8px] uppercase tracking-wider font-extrabold text-slate-400 mb-0.5">Fora Padrão (R$)</label>
                  <input
                    type="text"
                    value={tariff.nonStandardRate.toFixed(2)}
                    onChange={(e) => handleUpdateTariff(tariff.routeAlias, 'nonStandardRate', e.target.value)}
                    className="w-full text-xs font-mono font-bold bg-white border border-slate-200 rounded px-1.5 py-0.5 focus:border-emerald-500 outline-none"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* MODAL 1: EDIT / RENAME CARD */}
      {editingCourierId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/65 backdrop-blur-xs print:hidden">
          <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-slate-100 overflow-hidden animate-in fade-in zoom-in duration-150">
            {/* Header */}
            <div className="bg-slate-900 text-white p-5 flex justify-between items-center">
              <div>
                <h3 className="text-base font-black tracking-tight">Configurações do Card / Rota</h3>
                <p className="text-[10px] text-slate-400 mt-0.5">Altere o nome do entregador, a sigla da rota e a taxa padrão.</p>
              </div>
              <button 
                onClick={() => setEditingCourierId(null)}
                className="p-1 hover:bg-white/10 rounded-lg text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-[10px] uppercase tracking-wider font-extrabold text-slate-500 mb-1">
                  Nome do Entregador
                </label>
                <input
                  type="text"
                  value={editFormName}
                  onChange={(e) => setEditFormName(e.target.value)}
                  className="w-full text-sm bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 font-bold text-slate-850 outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 focus:bg-white transition-all"
                  placeholder="Ex: Carlos Vozinha Silva"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] uppercase tracking-wider font-extrabold text-slate-500 mb-1">
                    WhatsApp (Telefone)
                  </label>
                  <input
                    type="text"
                    value={editFormPhone}
                    onChange={(e) => setEditFormPhone(e.target.value)}
                    className="w-full text-sm bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 font-bold text-slate-850 outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 focus:bg-white transition-all"
                    placeholder="Ex: (75) 99999-9999"
                  />
                </div>

                <div>
                  <label className="block text-[10px] uppercase tracking-wider font-extrabold text-slate-500 mb-1">
                    Chave Pix
                  </label>
                  <input
                    type="text"
                    value={editFormPix}
                    onChange={(e) => setEditFormPix(e.target.value)}
                    className="w-full text-sm bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 font-bold text-slate-850 outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 focus:bg-white transition-all font-mono"
                    placeholder="Ex: CPF, Celular, Email"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] uppercase tracking-wider font-extrabold text-slate-500 mb-1" title="Sigla que aparece no topo da caixa (ex: FABIO, JEZ - BTN)">
                    Sigla do Card / Rota
                  </label>
                  <input
                    type="text"
                    value={editFormRoute}
                    onChange={(e) => setEditFormRoute(e.target.value)}
                    className="w-full text-sm bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 font-mono font-bold text-slate-850 outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 focus:bg-white transition-all"
                    placeholder="Ex: JEZ BTN"
                  />
                </div>

                <div>
                  <label className="block text-[10px] uppercase tracking-wider font-extrabold text-slate-500 mb-1">
                    Taxa Padrão (R$)
                  </label>
                  <input
                    type="number"
                    step="0.05"
                    value={editFormRate}
                    onChange={(e) => setEditFormRate(parseFloat(e.target.value) || 0)}
                    className="w-full text-sm bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 font-mono font-bold text-slate-850 outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 focus:bg-white transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] uppercase tracking-wider font-extrabold text-slate-500 mb-1">
                  Cidade / Destino Presets
                </label>
                <select
                  value={editFormCity}
                  onChange={(e) => {
                    setEditFormCity(e.target.value);
                    const preset = CITY_SAMPLES.find(c => c.cityName === e.target.value);
                    if (preset) {
                      setEditFormRate(preset.rate);
                    }
                  }}
                  className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 font-semibold text-slate-800 outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 focus:bg-white transition-all cursor-pointer"
                >
                  <option value="">Selecione para aplicar uma cidade padronizada...</option>
                  {CITY_SAMPLES.map((pres) => (
                    <option key={pres.cityName} value={pres.cityName}>
                      {pres.cityName} (R$ {pres.rate.toFixed(2)})
                    </option>
                  ))}
                </select>
              </div>

              <div className="bg-amber-50 rounded-2xl p-3 border border-amber-100 flex items-start gap-2 text-[10px] text-amber-850">
                <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <p>
                  A alteração recalculará automaticamente todos os repasses da quinzena atual.  
                  {editFormCity.toLowerCase().includes('paulo afonso') ? (
                    <span> A taxa fora do padrão receberá o acréscimo de <strong>R$ 1,50</strong> adicional, ficando configurada como R$ {(editFormRate + 1.50).toFixed(2)}.</span>
                  ) : (
                    <span> Para esta localidade, a taxa fora do padrão é igual à taxa padrão de <strong>R$ {editFormRate.toFixed(2)}</strong>.</span>
                  )}
                </p>
              </div>
            </div>

            {/* Footer */}
            <div className="bg-slate-50 p-5 border-t border-slate-100 flex justify-between items-center">
              <div>
                {editingCourierId && (
                  <button
                    onClick={() => handleDeleteCourier(editingCourierId)}
                    className="px-3 py-2 bg-rose-50 hover:bg-rose-100 text-rose-600 hover:text-rose-700 rounded-xl font-bold text-xs flex items-center gap-1 cursor-pointer transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Excluir Card
                  </button>
                )}
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => setEditingCourierId(null)}
                  className="px-4 py-2 border border-slate-250 bg-white hover:bg-slate-100 text-slate-700 rounded-xl font-bold text-xs cursor-pointer transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSaveEdit}
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold text-xs flex items-center gap-1 cursor-pointer transition-colors shadow-xs"
                >
                  <Save className="w-3.5 h-3.5" />
                  Salvar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: REGISTER NEW / CREATE CARD */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/65 backdrop-blur-xs print:hidden">
          <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-slate-100 overflow-hidden animate-in fade-in zoom-in duration-150">
            {/* Header */}
            <div className="bg-slate-900 text-white p-5 flex justify-between items-center">
              <div>
                <h3 className="text-base font-black tracking-tight flex items-center gap-1.5">
                  <Plus className="w-5 h-5 text-orange-500" />
                  <span>Registrar Novo Card / Rota</span>
                </h3>
                <p className="text-[10px] text-orange-300 mt-0.5 font-medium">Cadastre um novo entregador independente com regras de tarifas próprias.</p>
              </div>
              <button 
                onClick={() => setIsCreateModalOpen(false)}
                className="p-1 hover:bg-white/10 rounded-lg text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-[10px] uppercase tracking-wider font-extrabold text-slate-500 mb-1">
                  Nome do Novo Entregador
                </label>
                <input
                  type="text"
                  value={createFormName}
                  onChange={(e) => setCreateFormName(e.target.value)}
                  className="w-full text-sm bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 font-bold text-slate-850 outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 focus:bg-white transition-all"
                  placeholder="Ex: Fábio Paulo Afonso"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] uppercase tracking-wider font-extrabold text-slate-500 mb-1">
                    WhatsApp (Telefone)
                  </label>
                  <input
                    type="text"
                    value={createFormPhone}
                    onChange={(e) => setCreateFormPhone(e.target.value)}
                    className="w-full text-sm bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 font-bold text-slate-850 outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 focus:bg-white transition-all"
                    placeholder="Ex: (75) 99999-9999"
                  />
                </div>

                <div>
                  <label className="block text-[10px] uppercase tracking-wider font-extrabold text-slate-500 mb-1">
                    Chave Pix
                  </label>
                  <input
                    type="text"
                    value={createFormPix}
                    onChange={(e) => setCreateFormPix(e.target.value)}
                    className="w-full text-sm bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 font-bold text-slate-850 outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 focus:bg-white transition-all font-mono"
                    placeholder="Ex: CPF, Celular, Email"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] uppercase tracking-wider font-extrabold text-slate-500 mb-1" title="Esta sigla de card identificará o entregador na folha">
                    Sigla Rota (ex: JEZ-BTN)
                  </label>
                  <input
                    type="text"
                    value={createFormRoute}
                    onChange={(e) => setCreateFormRoute(e.target.value)}
                    className="w-full text-sm bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 font-mono font-bold text-slate-850 outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 focus:bg-white transition-all"
                    placeholder="Ex: FABIO-EXTRA"
                  />
                </div>

                <div>
                  <label className="block text-[10px] uppercase tracking-wider font-extrabold text-slate-500 mb-1">
                    Taxa Padrão (R$)
                  </label>
                  <input
                    type="number"
                    step="0.05"
                    value={createFormRate}
                    onChange={(e) => setCreateFormRate(parseFloat(e.target.value) || 0)}
                    className="w-full text-sm bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 font-mono font-bold text-slate-850 outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 focus:bg-white transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] uppercase tracking-wider font-extrabold text-slate-500 mb-1">
                  Localidade / Cidade Padrão
                </label>
                <select
                  value={createFormCity}
                  onChange={(e) => {
                    setCreateFormCity(e.target.value);
                    const preset = CITY_SAMPLES.find(c => c.cityName === e.target.value);
                    if (preset) {
                      setCreateFormRate(preset.rate);
                    }
                  }}
                  className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 font-semibold text-slate-850 outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 focus:bg-white transition-all cursor-pointer"
                >
                  <option value="">Selecione uma localidade preset...</option>
                  {CITY_SAMPLES.map((pres) => (
                    <option key={pres.cityName} value={pres.cityName}>
                      {pres.cityName} (R$ {pres.rate.toFixed(2)})
                    </option>
                  ))}
                </select>
              </div>

              <div className="bg-slate-50 rounded-2xl p-3 border border-slate-150 flex flex-col gap-1.5 text-[10px] text-slate-650">
                <div className="flex items-start gap-2">
                  <Info className="w-4 h-4 text-orange-500 shrink-0 mt-0.5" />
                  <p>
                    O card de entregador criado aparecerá imediatamente para preenchimento quinzenal na tela de cards e na planilha Excel para todas as quinzenas.
                  </p>
                </div>
                <div className="pl-6 border-l-2 border-orange-100 text-[10px] text-orange-950 font-medium">
                  {createFormCity.toLowerCase().includes('paulo afonso') ? (
                    <span>Paulo Afonso receberá o acréscimo de R$ 1,50 para entregas fora do padrão.</span>
                  ) : (
                    <span>Para {createFormCity || 'cidades externas'}, a taxa fora do padrão será igual à taxa padrão de R$ {createFormRate.toFixed(2)}.</span>
                  )}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="bg-slate-50 p-5 border-t border-slate-100 flex justify-end gap-2">
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="px-4 py-2 border border-slate-250 bg-white hover:bg-slate-100 text-slate-700 rounded-xl font-bold text-xs cursor-pointer transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleCreateCourier}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold text-xs flex items-center gap-1 cursor-pointer transition-colors shadow-xs"
              >
                <Plus className="w-3.5 h-3.5" />
                Criar Card
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: WHATSAPP STATEMENT PREVIEW & COURIER CHECK */}
      {shareModalReport && (() => {
        const msgText = generateWhatsappMessage(shareModalReport);
        const encodedMsg = encodeURIComponent(msgText);
        const cleanedPhone = cleanPhoneForWhatsapp(shareModalReport.phone);
        const waLink = cleanedPhone 
          ? `https://wa.me/${cleanedPhone}`
          : `https://wa.me`;
          
        return (
          <>
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs print:hidden animate-in fade-in duration-200">
            <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-slate-100 overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in duration-150">
              {/* Header */}
              <div className="bg-emerald-600 text-white p-5 flex justify-between items-center shrink-0">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-white/10 rounded-xl">
                    <Share2 className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="text-base font-black tracking-tight font-sans">Conferência de Repasse (WhatsApp)</h3>
                    <p className="text-[10px] text-emerald-100 mt-0.5 font-sans">Escolha se quer enviar o Card Visual como foto ou a mensagem clássica em texto.</p>
                  </div>
                </div>
                <button 
                  onClick={() => {
                    setShareModalReport(null);
                    setCopiedText(false);
                    setCopiedImage(false);
                  }}
                  className="p-1 hover:bg-white/10 rounded-lg text-emerald-100 hover:text-white transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Scrollable Content */}
              <div className="p-5 space-y-4 overflow-y-auto">
                
                {/* Visual share tab selectors */}
                <div className="flex bg-slate-100 p-1.5 rounded-2xl gap-2 mb-2 font-sans">
                  <button 
                    onClick={() => setActiveShareMode('image')}
                    type="button"
                    className={`flex-1 py-2 rounded-xl text-xs font-black transition-all text-center cursor-pointer ${activeShareMode === 'image' ? 'bg-white text-emerald-700 shadow-xs' : 'text-slate-500 hover:text-slate-800'}`}
                  >
                    🖼️ Card Imagem (Mais Limpo)
                  </button>
                  <button 
                    onClick={() => setActiveShareMode('text')}
                    type="button"
                    className={`flex-1 py-2 rounded-xl text-xs font-black transition-all text-center cursor-pointer ${activeShareMode === 'text' ? 'bg-white text-slate-850 shadow-xs' : 'text-slate-500 hover:text-slate-800'}`}
                  >
                    📝 Mensagem Completa (Texto)
                  </button>
                </div>

                {activeShareMode === 'image' ? (
                  <div className="space-y-4">
                    {/* Visual Card Image Preview */}
                    <div className="border border-slate-200 rounded-2xl p-3.5 bg-slate-55 flex flex-col items-center justify-center min-h-[280px] relative">
                      {isGeneratingImage ? (
                        <div className="flex flex-col items-center space-y-2.5 py-12 text-center">
                          <RefreshCw className="w-8 h-8 text-emerald-600 animate-spin" />
                          <p className="text-[11px] font-bold text-slate-500 font-sans">Gerando imagem profissional do card...</p>
                        </div>
                      ) : imageError ? (
                        <div className="text-center py-10 space-y-2 font-sans">
                          <AlertCircle className="w-8 h-8 text-red-500 mx-auto" />
                          <p className="text-xs font-bold text-slate-600">{imageError}</p>
                          <button 
                            onClick={() => generateCardImage(shareModalReport.driverId)}
                            className="bg-slate-900 hover:bg-slate-800 text-white rounded-lg px-3 py-1.5 text-xs font-bold cursor-pointer"
                          >
                            Tentar Novamente
                          </button>
                        </div>
                      ) : cardImageSrc ? (
                        <div className="space-y-3.5 w-full flex flex-col items-center">
                          <div className="text-[10px] text-slate-400 font-extrabold uppercase tracking-widest text-center font-sans">
                            Pré-visualização da imagem gerada:
                          </div>
                          
                          {/* Beautiful mockup of generated card */}
                          <div className="border-4 border-white rounded-2xl shadow-lg overflow-hidden bg-white max-w-[280px] scale-95 origin-center transition-transform hover:scale-100 duration-200">
                            <img src={cardImageSrc} alt="Preview do Card" className="w-full object-contain" referrerPolicy="no-referrer" />
                          </div>

                          {/* Instructions bubble */}
                          <div className="space-y-1.5 p-3.5 bg-emerald-50 border border-emerald-100 rounded-2xl text-[11px] text-emerald-950 w-full font-medium leading-relaxed font-sans">
                            <span className="font-extrabold text-emerald-900 block text-xs">💡 Como enviar ao Entregador:</span>
                            <ul className="list-decimal pl-4 space-y-1 text-slate-700">
                              <li>Clique em <strong className="text-emerald-800 font-extrabold">"Copiar Imagem e Abrir WhatsApp"</strong>.</li>
                              <li>A foto do card será copiada automaticamente para sua área de transferência.</li>
                              <li>Na conversa do WhatsApp que abrirá para você, basta apertar <strong className="font-extrabold text-emerald-900">Ctrl+V / Colar</strong> e pressionar Enviar!</li>
                            </ul>
                          </div>
                        </div>
                      ) : (
                        <div className="text-center py-12 space-y-1.5">
                          <p className="text-xs text-slate-500 font-medium font-sans">Fila de processamento...</p>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="bg-slate-50 border border-slate-100 rounded-2xl p-3.5 space-y-2 font-sans">
                      <div className="flex justify-between text-xs text-slate-500 font-medium pb-2 border-b border-slate-250">
                        <span>💳 Beneficiário: <strong className="text-slate-800">{shareModalReport.driverName}</strong></span>
                        <span>📍 Rota: <strong className="text-slate-800">{shareModalReport.routeAlias}</strong></span>
                      </div>
                      <div className="grid grid-cols-2 gap-3 pt-1">
                        <div className="bg-white p-2.5 rounded-xl border border-slate-200/60">
                          <p className="text-[8px] uppercase tracking-wider font-semibold text-slate-400">Total Concluídos</p>
                          <p className="text-sm font-bold text-slate-800 mt-0.5">{shareModalReport.standardCount} entregas</p>
                        </div>
                        {isCopav(shareModalReport.routeAlias) ? (
                          <div className="bg-white p-2.5 rounded-xl border border-slate-200/60">
                            <p className="text-[8px] uppercase tracking-wider font-semibold text-slate-400">Polo COPAV</p>
                            <p className="text-sm font-bold text-slate-800 mt-0.5">R$ {shareModalReport.nonStandardCount.toFixed(2)}</p>
                          </div>
                        ) : (
                          <div className="bg-white p-2.5 rounded-xl border border-slate-200/60">
                            <p className="text-[8px] uppercase tracking-wider font-semibold text-slate-400">Fora do Padrão</p>
                            <p className="text-sm font-bold text-slate-800 mt-0.5">{shareModalReport.nonStandardCount} entregas</p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Previsão do WhatsApp bubble */}
                    <div>
                      <h4 className="text-[10px] uppercase font-black text-slate-400 tracking-wider mb-1.5 flex items-center justify-between font-sans">
                        <span>Pré-visualização da Mensagem</span>
                        {shareModalReport.phone ? (
                          <span className="text-emerald-600 font-bold font-mono text-[9px] bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-100">
                            WhatsApp: {shareModalReport.phone}
                          </span>
                        ) : (
                          <span className="text-amber-600 font-bold font-mono text-[9px] bg-amber-50 px-1.5 py-0.5 rounded border border-amber-100">
                            Sem telefone registrado
                          </span>
                        )}
                      </h4>
                      <div className="bg-[#efeae2]/90 border border-slate-200 rounded-3xl p-4 max-h-[180px] overflow-y-auto relative flex flex-col font-sans">
                        {/* Tiny green WhatsApp layout */}
                        <div className="bg-[#d9fdd3] text-[#111b21] rounded-2xl rounded-tl-none p-3.5 text-xs whitespace-pre-wrap font-mono relative shadow-xs border border-[#b7e3b1] self-start max-w-[95%] text-left">
                          {msgText}
                          {/* Message tail */}
                          <div className="absolute top-0 -left-2 w-0 h-0 border-y-8 border-y-transparent border-r-8 border-r-[#d9fdd3]" />
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Action Buttons in footer */}
              <div className="bg-slate-50 p-4 border-t border-slate-100 flex flex-col sm:flex-row gap-2 shrink-0 font-sans">
                <button
                  onClick={() => {
                    setShareModalReport(null);
                    setCopiedText(false);
                    setCopiedImage(false);
                  }}
                  className="w-full sm:w-auto px-5 py-2.5 border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-sm"
                >
                  <X className="w-4 h-4 text-slate-400" />
                  Fechar
                </button>
                
                <div className="flex gap-2 w-full">
                  {activeShareMode === 'image' ? (
                    <>
                      {/* Button 1: Download Image */}
                      <button
                        onClick={() => {
                          if (cardImageSrc) {
                            const link = document.createElement('a');
                            link.download = `Card_${shareModalReport.driverId}_Quinzena_${selectedFortnight}.png`;
                            link.href = cardImageSrc;
                            link.click();
                          }
                        }}
                        disabled={!cardImageSrc}
                        className={`flex-1 px-3 py-2.5 border border-slate-250 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all outline-none cursor-pointer ${!cardImageSrc ? 'bg-slate-100 text-slate-400 cursor-not-allowed border-slate-200' : 'bg-white hover:bg-slate-50 text-slate-700 hover:text-slate-900'}`}
                      >
                        <Save className="w-4 h-4 text-slate-400" />
                        <span>Baixar Card File</span>
                      </button>

                      {/* Button 2: Copy image & open WhatsApp */}
                      <button
                        onClick={async () => {
                          if (!cardImageSrc) return;
                          const copied = await copyImageToClipboard(cardImageSrc);
                          if (copied) {
                            setCopiedImage(true);
                            setTimeout(() => setCopiedImage(false), 3000);
                          }
                          
                          // Download as backup automatically
                          const link = document.createElement('a');
                          link.download = `Card_${shareModalReport.driverId}_Quinzena_${selectedFortnight}.png`;
                          link.href = cardImageSrc;
                          link.click();

                          // Open instruction modal
                          setShowWaCopyAlert(true);
                        }}
                        disabled={!cardImageSrc}
                        className={`flex-2 px-4 py-2.5 text-white rounded-xl font-black text-xs flex items-center justify-center gap-1.5 transition-all text-center cursor-pointer shadow-sm ${!cardImageSrc ? 'bg-slate-300 pointer-events-none cursor-not-allowed' : 'bg-[#25D366] hover:bg-[#20ba5a] active:scale-98'}`}
                      >
                        {copiedImage ? (
                          <>
                            <Check className="w-4 h-4" />
                            <span>¡Card Copiado! Ver Instruções</span>
                          </>
                        ) : (
                          <>
                            <ExternalLink className="w-4 h-4" />
                            <span>Copiar Imagem e WhatsApp</span>
                          </>
                        )}
                      </button>
                    </>
                  ) : (
                    <>
                      {/* Button 1: Copy Text */}
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(msgText);
                          setCopiedText(true);
                          setTimeout(() => setCopiedText(false), 2000);
                        }}
                        className="flex-1 px-4 py-2.5 border border-slate-250 bg-white hover:bg-slate-50 text-slate-700 hover:text-slate-900 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all outline-none focus:ring-1 focus:ring-orange-500 cursor-pointer"
                      >
                        {copiedText ? (
                          <>
                            <Check className="w-4 h-4 text-emerald-600" />
                            <span className="text-emerald-700">Texto Copiado!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-4 h-4 text-slate-400" />
                            <span>Copiar Texto</span>
                          </>
                        )}
                      </button>

                      {/* Button 2: Send WhatsApp Link directly with text pre-filled */}
                      <a
                        href={cleanedPhone ? `https://wa.me/${cleanedPhone}?text=${encodedMsg}` : `https://wa.me?text=${encodedMsg}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 px-4 py-2.5 bg-[#25D366] hover:bg-[#20ba5a] text-white rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all text-center no-underline cursor-pointer shadow-sm hover:shadow active:scale-98"
                      >
                        <ExternalLink className="w-4 h-4" />
                        <span>Enviar WhatsApp</span>
                      </a>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>

            {/* ELEGANT OVERLAY FOR WHATSAPP INSTRUCTIONS */}
            {showWaCopyAlert && (
              <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-md animate-in fade-in duration-200 font-sans">
                <div className="bg-white rounded-3xl shadow-2xl border border-slate-150 p-6 max-w-md w-full space-y-4 animate-in zoom-in-95 duration-200">
                  <div className="flex items-center gap-3 text-[#25D366]">
                    <div className="p-3 bg-emerald-50 rounded-full">
                      <Share2 className="w-8 h-8" />
                    </div>
                    <div>
                      <h3 className="text-base font-black text-slate-900 tracking-tight">Instruções de Envio do Card</h3>
                      <p className="text-xs font-bold text-slate-500">Como enviar a imagem pelo WhatsApp</p>
                    </div>
                  </div>

                  <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-2xl space-y-3 text-xs text-emerald-950 leading-relaxed font-medium">
                    <p className="font-extrabold text-emerald-900 text-sm">
                      💡 Importante: O WhatsApp não permite carregar imagens automaticamente via link externo.
                    </p>
                    
                    <div className="space-y-2 text-slate-700">
                      <div className="flex gap-2 items-start">
                        <span className="bg-[#25D366] text-white rounded-full w-5 h-5 flex items-center justify-center font-extrabold text-[10px] shrink-0 mt-0.5">1</span>
                        <p>A imagem do card já foi <strong className="text-emerald-900 font-extrabold">COPIADA para sua Área de Transferência</strong>.</p>
                      </div>
                      <div className="flex gap-2 items-start">
                        <span className="bg-[#25D366] text-white rounded-full w-5 h-5 flex items-center justify-center font-extrabold text-[10px] shrink-0 mt-0.5">2</span>
                        <p>Também realizamos o <strong className="text-emerald-900 font-extrabold">download da imagem do card</strong> automaticamente para o seu dispositivo como backup.</p>
                      </div>
                      <div className="flex gap-2 items-start">
                        <span className="bg-orange-500 text-white rounded-full w-5 h-5 flex items-center justify-center font-extrabold text-[10px] shrink-0 mt-0.5">3</span>
                        <p className="font-semibold text-slate-800">
                          Na janela do WhatsApp que irá abrir, basta clicar no campo de mensagem e usar o comando <strong className="text-orange-600 font-black">CTRL+V</strong> (computador) ou <strong className="text-orange-600 font-black">manter pressionado e tocar em Colar</strong> (celular) para colar a imagem e enviar!
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2.5 pt-2">
                    <button
                      onClick={() => setShowWaCopyAlert(false)}
                      className="flex-1 py-3 border border-slate-250 hover:bg-slate-50 text-slate-700 font-bold text-xs rounded-xl cursor-pointer transition-colors"
                    >
                      Fechar
                    </button>
                    <a
                      href={waLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={() => setShowWaCopyAlert(false)}
                      className="flex-2 py-3 bg-[#25D366] hover:bg-[#20ba5a] text-white font-black text-xs rounded-xl text-center no-underline cursor-pointer transition-all shadow-md active:scale-98 flex items-center justify-center gap-1.5"
                    >
                      <ExternalLink className="w-4 h-4 text-white" />
                      <span>Ir para o WhatsApp</span>
                    </a>
                  </div>
                </div>
              </div>
            )}
          </>
        );
      })()}

      {/* OFF-SCREEN CAPTURE CARD TEMPLATE RENDERER */}
      {shareModalReport && (
        <div 
          style={{ position: 'absolute', left: '-9999px', top: '-9999px', zIndex: -100, pointerEvents: 'none' }}
          aria-hidden="true"
        >
          <div 
            id={`courier-card-capture-${shareModalReport.driverId}`}
            className="w-[380px] bg-slate-55 p-4"
          >
            <div className="bg-white rounded-3xl overflow-hidden shadow-md border-2 border-slate-200 flex flex-col justify-between relative font-sans">
              
              {/* Visual Header inspired by Jadlog card */}
              <div className="bg-[#10b981] text-white p-4 text-center flex flex-col justify-center items-center relative">
                <span className="text-[10px] uppercase font-black text-emerald-100 tracking-wider">
                  COURIER
                </span>
                <span className="text-xl font-black tracking-tight mt-0.5 drop-shadow-xs">
                  {shareModalReport.routeAlias}
                </span>
              </div>

              {/* Main statistics columns */}
              <div className="p-4 border-b border-slate-100 bg-white flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider block">
                    Entregas Concluídas
                  </span>
                  <div className="text-3xl font-black text-slate-850 font-mono mt-0.5">
                    {shareModalReport.totalCompleted}
                  </div>
                </div>
                
                <div className="flex gap-3 bg-slate-50 border border-slate-200 p-2.5 rounded-2xl text-[11px]">
                  <div className="flex items-center gap-1.5 text-slate-600 font-bold">
                    <span>Padrão:</span>
                    <span className="font-mono text-xs font-black text-slate-800 bg-white border border-slate-200 px-1.5 py-0.5 rounded-lg">{shareModalReport.standardCount}</span>
                  </div>
                  <div className="w-px bg-slate-200 self-stretch"></div>
                  <div className="flex items-center gap-1.5 text-amber-805 font-bold">
                    <span>{isCopav(shareModalReport.routeAlias) ? "Valor COPAV:" : "Fora Padrão: ⭐"}</span>
                    <span className="font-mono text-xs font-black text-amber-700 bg-white border border-slate-200 px-1.5 py-0.5 rounded-lg">
                      {isCopav(shareModalReport.routeAlias) ? `R$ ${shareModalReport.nonStandardCount.toFixed(2)}` : shareModalReport.nonStandardCount}
                    </span>
                  </div>
                </div>
              </div>

              {/* Débitos Section */}
              <div className="p-3.5 border-b border-rose-100 bg-rose-50/25 space-y-2">
                <div className="flex items-center gap-1.5 text-[10px] uppercase font-black text-rose-700 tracking-wider">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-600 inline-block shrink-0"></span>
                  <span>Débitos Descontados</span>
                </div>
                <div className="grid grid-cols-3 gap-1.5">
                  {/* Adiantamento */}
                  <div className="bg-white border border-rose-150 rounded-xl p-1.5 flex flex-col justify-between min-h-[48px] text-center">
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tight block">Adiantam.</span>
                    <span className="text-[11px] font-mono font-black text-rose-700 mt-1 block">
                      R$ {shareModalReport.debitAdvance ? shareModalReport.debitAdvance.toFixed(2) : '0,00'}
                    </span>
                  </div>
                  {/* Combustivel */}
                  <div className="bg-white border border-rose-150 rounded-xl p-1.5 flex flex-col justify-between min-h-[48px] text-center">
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tight block">Combust.</span>
                    <span className="text-[11px] font-mono font-black text-rose-700 mt-1 block">
                      R$ {shareModalReport.debitFuel ? shareModalReport.debitFuel.toFixed(2) : '0,00'}
                    </span>
                  </div>
                  {/* Multa/Extravio */}
                  <div className="bg-white border border-rose-150 rounded-xl p-1.5 flex flex-col justify-between min-h-[48px] text-center">
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tight block text-ellipsis overflow-hidden whitespace-nowrap">Multa/Extr.</span>
                    <span className="text-[11px] font-mono font-black text-rose-700 mt-1 block">
                      R$ {shareModalReport.debitLoss ? shareModalReport.debitLoss.toFixed(2) : '0,00'}
                    </span>
                  </div>
                </div>
                {((shareModalReport.debitAdvance || 0) + (shareModalReport.debitFuel || 0) + (shareModalReport.debitLoss || 0)) > 0 ? (
                  <div className="text-right text-[10px] font-extrabold text-rose-750">
                    Total de Descontos: R$ {((shareModalReport.debitAdvance || 0) + (shareModalReport.debitFuel || 0) + (shareModalReport.debitLoss || 0)).toFixed(2)}
                  </div>
                ) : (
                  <div className="text-center text-[9px] text-emerald-700 font-semibold italic">
                    Nenhum desconto lançado nesta quinzena 🎉
                  </div>
                )}
              </div>

              {/* Performance & Occurrences Section (SLA) */}
              <div className="p-3.5 border-b border-sky-100 bg-sky-50/25 space-y-2">
                <div className="flex items-center justify-between text-[10px] uppercase font-black text-sky-700 tracking-wider">
                  <div className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-sky-600 inline-block shrink-0"></span>
                    <span>Ocorrência, Pendência e SLA</span>
                  </div>
                  <span className={`px-1.5 py-0.2 rounded font-mono font-black text-[9px] ${
                    Math.max(0, Math.min(100, Math.round(100 - ((shareModalReport.occurrencesCount * 5) + (shareModalReport.pendingCount * 2) + ((shareModalReport.debitLoss || 0) * 0.2))))) >= 95
                      ? 'bg-emerald-100 text-emerald-800'
                      : Math.max(0, Math.min(100, Math.round(100 - ((shareModalReport.occurrencesCount * 5) + (shareModalReport.pendingCount * 2) + ((shareModalReport.debitLoss || 0) * 0.2))))) >= 85
                        ? 'bg-orange-100 text-orange-800'
                        : 'bg-rose-100 text-rose-800'
                  }`}>
                    SLA: {Math.max(0, Math.min(100, Math.round(100 - ((shareModalReport.occurrencesCount * 5) + (shareModalReport.pendingCount * 2) + ((shareModalReport.debitLoss || 0) * 0.2)))))}%
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-1.5 text-center">
                  {/* Ocorrências */}
                  <div className="bg-white border border-sky-150 rounded-xl p-1.5 flex flex-col justify-between min-h-[48px]">
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tight block">Ocorrências</span>
                    <span className="text-[11px] font-mono font-extrabold text-sky-700 mt-1 block">
                      {shareModalReport.occurrencesCount}
                    </span>
                  </div>
                  {/* Pendências */}
                  <div className="bg-white border border-sky-150 rounded-xl p-1.5 flex flex-col justify-between min-h-[48px]">
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tight block">Pendências</span>
                    <span className="text-[11px] font-mono font-extrabold text-sky-700 mt-1 block">
                      {shareModalReport.pendingCount}
                    </span>
                  </div>
                </div>
              </div>

              {/* Sub-card detail band */}
              <div className="p-3.5 bg-slate-50 border-b border-slate-100 flex flex-col gap-1.5 text-xs text-slate-600">
                <div className="flex justify-between items-center text-[11px]">
                  <span className="font-bold text-slate-850">{shareModalReport.driverName}</span>
                  <span className="text-[9px] bg-slate-100 px-1.5 py-0.5 rounded font-bold text-slate-700">{shareModalReport.cityName}</span>
                </div>

                {/* Repasse Results */}
                <div className="flex items-center justify-between text-[11px] font-bold bg-orange-50/70 p-2.5 rounded-xl text-orange-950 mt-1 border border-orange-100">
                  <span className="flex items-center text-orange-900 font-extrabold">
                    <TrendingUp className="w-3.5 h-3.5 text-orange-600 mr-1 shrink-0" />
                    Valor Líquido a Receber:
                  </span>
                  <span className="font-mono text-sm font-black text-orange-950 block">
                    R$ {shareModalReport.payoutAmount.toFixed(2)}
                  </span>
                </div>

                {/* Contact details */}
                <div className="mt-1 bg-slate-50 border border-slate-150 rounded-xl p-2.5 text-[10px] space-y-1.5 text-slate-600">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-slate-400">WhatsApp:</span>
                    <span className="font-extrabold text-slate-800">{shareModalReport.phone || 'Não Cadastrado'}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-slate-400">Chave Pix:</span>
                    <span className="font-mono font-extrabold text-slate-800 bg-slate-100 px-1 py-0.2 rounded">{shareModalReport.pix || 'Não Cadastrada'}</span>
                  </div>
                </div>

                {/* Tariff settings */}
                <div className="flex justify-between text-[8px] text-slate-400 px-1 font-bold italic mt-1">
                  <span>Taxa Padrão: R$ {shareModalReport.tariffs.standardRate.toFixed(2)}</span>
                  {isCopav(shareModalReport.routeAlias) ? (
                    <span>Adicional: Valor somado integralmente</span>
                  ) : (
                    <span>Fora do Padrão: R$ {shareModalReport.tariffs.nonStandardRate.toFixed(2)}</span>
                  )}
                </div>
              </div>

              {/* Bottom brand logo / footer */}
              <div className="bg-[#10b981]/5 px-4 py-2.5 border-t border-[#10b981]/10 flex justify-between items-center text-[9px] font-bold text-[#10b981]">
                <span> Quinzenal #{shareModalReport.fortnight} — {months[shareModalReport.month - 1]}/{selectedYear}</span>
                <span className="uppercase tracking-widest font-black text-[8px]">JADLOG CONTROLE</span>
              </div>

              {/* Red bottom accent line */}
              <div className="h-1.5 bg-[#e31a1a] w-full" />
            </div>
          </div>
        </div>
      )}

      {/* MODAL 4: INSTRUÇÕES DE IMPRESSÃO IMPORTANTES (PARA AMBIENTE IFRAME) */}
      {showPrintInstructions && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-xs print:hidden animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col animate-in zoom-in-95 duration-150">
            {/* Header */}
            <div className="bg-[#e31a1a] text-white p-5 flex justify-between items-center shrink-0">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-white/10 rounded-xl">
                  <Printer className="w-5 h-5 text-white animate-pulse" />
                </div>
                <div>
                  <h3 className="text-base font-black tracking-tight font-sans">Como Imprimir no AI Studio</h3>
                  <p className="text-[10px] text-rose-100 mt-0.5 font-sans font-medium">Instruções para salvar em PDF ou imprimir sem erros</p>
                </div>
              </div>
              <button 
                onClick={() => setShowPrintInstructions(false)}
                className="text-white/80 hover:text-white hover:bg-white/15 p-1 rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content body */}
            <div className="p-6 space-y-4 font-sans text-slate-700 text-xs">
              <p className="font-semibold leading-relaxed">
                Navegadores de internet modernos bloqueiam ou desconfiguram a impressão de páginas que estão sendo mostradas dentro de outros sites (como o visualizador do AI Studio).
              </p>
              
              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 space-y-2 text-amber-950">
                <span className="font-black text-xs block">💡 Passo Único Resolutivo:</span>
                <p className="leading-relaxed font-medium">
                  Clique no botão verde <strong className="text-emerald-800">"Abrir em Nova Aba"</strong> abaixo. Na nova página limpa aberta, basta clicar em Imprimir normalmente que funcionará perfeitamente!
                </p>
              </div>

              <div className="space-y-2.5 pt-2">
                <div className="flex gap-2.5 items-start">
                  <span className="w-5 h-5 rounded-full bg-slate-100 flex items-center justify-center text-[10px] font-black shrink-0 border border-slate-250 text-slate-500">1</span>
                  <p className="mt-0.5 leading-relaxed">Clique no botão <strong className="text-emerald-600">"Abrir em Nova Aba"</strong>.</p>
                </div>
                <div className="flex gap-2.5 items-start">
                  <span className="w-5 h-5 rounded-full bg-slate-100 flex items-center justify-center text-[10px] font-black shrink-0 border border-slate-250 text-slate-500">2</span>
                  <p className="mt-0.5 leading-relaxed">Na nova aba, clique no botão de impressão ou pressione o atalho do teclado: <kbd className="px-1.5 py-0.5 bg-slate-100 border rounded font-mono text-[10px] font-bold text-slate-800">Ctrl + P</kbd> / <kbd className="px-1.5 py-0.5 bg-slate-100 border rounded font-mono text-[10px] font-bold text-slate-800">Cmd + P</kbd>.</p>
                </div>
              </div>
            </div>

            {/* Footer with action */}
            <div className="p-4 bg-slate-50 border-t border-slate-100 flex gap-2 shrink-0 justify-end">
              <button
                onClick={() => setShowPrintInstructions(false)}
                className="px-4 py-2 border border-slate-250 bg-white hover:bg-slate-50 text-slate-700 rounded-xl font-bold text-xs cursor-pointer shadow-xs"
              >
                Cancelar
              </button>
              <button
                onClick={() => {
                  setShowPrintInstructions(false);
                  window.open(window.location.href, '_blank');
                }}
                className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-black text-xs cursor-pointer flex items-center gap-1.5 shadow-md active:scale-97 transition-all"
              >
                <Sparkles className="w-3.5 h-3.5" />
                Abrir em Nova Aba
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CUSTOM CONFIRMATION DIALOG FOR CARD EXCLUSION */}
      {courierToDelete && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-xs print:hidden animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-sm w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col animate-in zoom-in-95 duration-150">
            {/* Header */}
            <div className="bg-[#e31a1a] text-white p-5 flex items-center gap-3 shrink-0">
              <div className="p-2 bg-white/10 rounded-xl">
                <Trash2 className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="text-sm font-black tracking-tight font-sans">Excluir Card do Entregador?</h3>
                <p className="text-[10px] text-rose-100 mt-0.5 font-sans font-medium">Esta ação não pode ser desfeita</p>
              </div>
            </div>

            {/* Content body */}
            <div className="p-6 space-y-3 font-sans text-slate-700 text-xs">
              <p className="font-semibold text-slate-800 leading-relaxed text-[13px]">
                Você tem certeza que deseja excluir o card de <strong className="text-slate-900 font-extrabold font-mono bg-slate-100 px-1.5 py-0.5 rounded">{courierToDelete.name}</strong>?
              </p>
              
              <div className="bg-rose-50 border border-rose-150 rounded-2xl p-3 text-rose-950 text-[11px] leading-relaxed">
                <span className="font-bold block mb-0.5">⚠️ O que acontecerá:</span>
                Todos os dados e lançamentos deste entregador na quinzena atual e quinzenas passadas serão ocultados e removidos permanentemente das visualizações.
              </div>
            </div>

            {/* Footer with action */}
            <div className="p-4 bg-slate-50 border-t border-slate-100 flex gap-2 shrink-0 justify-end">
              <button
                onClick={() => setCourierToDelete(null)}
                className="px-4 py-2 border border-slate-250 bg-white hover:bg-slate-50 text-slate-700 rounded-xl font-bold text-xs cursor-pointer shadow-xs transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={() => confirmDeleteCourier(courierToDelete.id)}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-black text-xs cursor-pointer flex items-center gap-1 shadow-md active:scale-97 transition-all"
              >
                Sim, Excluir Card
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
