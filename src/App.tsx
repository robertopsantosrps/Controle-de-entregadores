import React, { useState, useEffect } from 'react';
import { Driver, Delivery, DriverStatus, DeliveryStatus } from './types';
import { INITIAL_DRIVERS, INITIAL_DELIVERIES } from './data';
import DashboardStats from './components/DashboardStats';
import ManagerialDashboard from './components/ManagerialDashboard';
import RadarMap from './components/RadarMap';
import DriverList from './components/DriverList';
import DeliveryForm from './components/DeliveryForm';
import DeliveryList from './components/DeliveryList';
import FortnightlyPayments from './components/FortnightlyPayments';
import { MapPin, Navigation, Clock, RefreshCw, Sparkles, SlidersHorizontal, Settings2, Info, Landmark, Layers, Presentation, BarChart3, Map, Download, Upload } from 'lucide-react';
import { motion } from 'motion/react';

export default function App() {
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [selectedDriverId, setSelectedDriverId] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [activeTab, setActiveTab] = useState<'operational' | 'payouts'>('operational');
  const [operationalViewMode, setOperationalViewMode] = useState<'gerencial' | 'logistica'>('gerencial');

  // Shared Calendar/Period State for unified navigation across tabs
  const [selectedYear, setSelectedYear] = useState<number>(2026);
  const [selectedMonth, setSelectedMonth] = useState<number>(5); // June is 5 (0-based)
  const [selectedFortnight, setSelectedFortnight] = useState<1 | 2>(1);

  // Load from LocalStorage or Fallback to pre-populated mock dataset
  useEffect(() => {
    const storedDrivers = localStorage.getItem('logistic_drivers');
    const storedDeliveries = localStorage.getItem('logistic_deliveries');

    if (storedDrivers) {
      const parsed = JSON.parse(storedDrivers);
      const missing = INITIAL_DRIVERS.filter((d: any) => !parsed.some((p: any) => p.id === d.id));
      if (missing.length > 0) {
        const merged = [...parsed, ...missing];
        setDrivers(merged);
        localStorage.setItem('logistic_drivers', JSON.stringify(merged));
      } else {
        setDrivers(parsed);
      }
    } else {
      setDrivers(INITIAL_DRIVERS);
      localStorage.setItem('logistic_drivers', JSON.stringify(INITIAL_DRIVERS));
    }

    if (storedDeliveries) {
      setDeliveries(JSON.parse(storedDeliveries));
    } else {
      setDeliveries(INITIAL_DELIVERIES);
      localStorage.setItem('logistic_deliveries', JSON.stringify(INITIAL_DELIVERIES));
    }
  }, []);

  // Update localStorage helper
  const updateStoredState = (newDrivers: Driver[], newDeliveries: Delivery[]) => {
    setDrivers(newDrivers);
    setDeliveries(newDeliveries);
    localStorage.setItem('logistic_drivers', JSON.stringify(newDrivers));
    localStorage.setItem('logistic_deliveries', JSON.stringify(newDeliveries));
  };

  // Clock ticks
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Reset to original mock state to allow playability
  const handleResetData = () => {
    if (window.confirm('Tem certeza que deseja resetar os dados de hoje para o padrão de demonstração? Isso limpará suas alterações recentes.')) {
      updateStoredState(INITIAL_DRIVERS, INITIAL_DELIVERIES);
      setSelectedDriverId(null);
    }
  };

  // Export all localStorage keys related to this app as a JSON file backup
  const handleExportBackup = () => {
    try {
      const backupData: Record<string, string | null> = {
        logistic_drivers: localStorage.getItem('logistic_drivers'),
        logistic_deliveries: localStorage.getItem('logistic_deliveries'),
        jadlog_route_tariffs: localStorage.getItem('jadlog_route_tariffs'),
        jadlog_driver_route_mappings: localStorage.getItem('jadlog_driver_route_mappings'),
        jadlog_custom_couriers: localStorage.getItem('jadlog_custom_couriers'),
        jadlog_fortnightly_ledger: localStorage.getItem('jadlog_fortnightly_ledger'),
      };

      const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(
        JSON.stringify(backupData, null, 2)
      )}`;
      
      const downloadAnchor = document.createElement('a');
      const dateStr = new Date().toISOString().split('T')[0];
      downloadAnchor.setAttribute('href', jsonString);
      downloadAnchor.setAttribute('download', `jadlog_backup_${dateStr}.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
    } catch (error) {
      console.error('Erro ao exportar backup:', error);
      alert('Ocorreu um erro ao gerar o arquivo de backup.');
    }
  };

  // Import JSON backup and write everything back to localStorage, then reload settings
  const handleImportBackup = (event: React.ChangeEvent<HTMLInputElement>) => {
    const fileReader = new FileReader();
    const file = event.target.files?.[0];
    if (!file) return;

    fileReader.onload = (e) => {
      try {
        const content = e.target?.result;
        if (typeof content !== 'string') return;

        const backupData = JSON.parse(content);
        
        // Validate if it is a JSON with our keys
        const expectedKeys = [
          'logistic_drivers',
          'logistic_deliveries',
          'jadlog_route_tariffs',
          'jadlog_driver_route_mappings',
          'jadlog_custom_couriers',
          'jadlog_fortnightly_ledger'
        ];

        let valid = false;
        expectedKeys.forEach((key) => {
          if (key in backupData) {
            valid = true;
          }
        });

        if (!valid) {
          alert('Este arquivo não parece ser um backup válido do aplicativo Jadlog.');
          return;
        }

        if (window.confirm('Atenção: Ao restaurar este backup, os dados atuais da sua tela serão totalmente substituídos pelo arquivo de backup. Deseja prosseguir?')) {
          expectedKeys.forEach((key) => {
            if (backupData[key]) {
              localStorage.setItem(key, backupData[key]);
            } else {
              localStorage.removeItem(key);
            }
          });

          // Reload page to re-initialize everything cleanly of all sub-components
          window.location.reload();
        }
      } catch (err) {
        console.error('Erro ao ler arquivo de backup:', err);
        alert('Este arquivo está corrompido ou é inválido. Por favor, tente outro.');
      }
    };
    fileReader.readAsText(file);
    // Reset file input so same file can be uploaded again if needed
    event.target.value = '';
  };

  // Add Delivery action
  const handleAddDelivery = (deliveryData: Omit<Delivery, 'id' | 'createdAt' | 'updatedAt' | 'history' | 'paymentStatus'>) => {
    const nextIdNum = deliveries.reduce((max, d) => {
      const num = parseInt(d.id.replace('ent-', ''));
      return isNaN(num) ? max : Math.max(max, num);
    }, 100) + 1;

    const newDelivery: Delivery = {
      ...deliveryData,
      id: `ent-${nextIdNum}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      history: [
        { status: 'Pendente', timestamp: new Date().toISOString() }
      ],
      paymentStatus: 'Pendente'
    };

    let updatedDrivers = [...drivers];
    
    // If a driver was assigned and it's already "Em Trânsito", update driver status
    if (newDelivery.driverId && newDelivery.status === 'Em Trânsito') {
      newDelivery.history.push({ status: 'Em Trânsito', timestamp: new Date().toISOString() });
      updatedDrivers = drivers.map(d => 
        d.id === newDelivery.driverId 
          ? { ...d, status: 'Em Trânsito' as DriverStatus }
          : d
      );
    }

    const updatedDeliveries = [newDelivery, ...deliveries];
    updateStoredState(updatedDrivers, updatedDeliveries);
  };

  // Bulk update payments status
  const handleUpdateDeliveriesPaymentStatus = (deliveryIds: string[], status: 'Pendente' | 'Pago') => {
    const updatedDeliveries = deliveries.map(d => {
      if (deliveryIds.includes(d.id)) {
        return {
          ...d,
          paymentStatus: status,
          paymentDate: status === 'Pago' ? new Date().toISOString() : undefined,
          updatedAt: new Date().toISOString()
        };
      }
      return d;
    });
    updateStoredState(drivers, updatedDeliveries);
  };

  // Update Delivery Status (Pendente -> Em Trânsito -> Entregue)
  const handleUpdateDeliveryStatus = (deliveryId: string, newStatus: DeliveryStatus) => {
    const targetDelivery = deliveries.find(d => d.id === deliveryId);
    if (!targetDelivery) return;

    let updatedDrivers = [...drivers];
    const updatedDeliveries = deliveries.map(d => {
      if (d.id === deliveryId) {
        const history = [...(d.history || [])];
        // Only append history if status changed
        if (d.status !== newStatus) {
          history.push({ status: newStatus, timestamp: new Date().toISOString() });
        }

        return {
          ...d,
          status: newStatus,
          updatedAt: new Date().toISOString(),
          history
        };
      }
      return d;
    });

    // Update drivers profiles based on statuses
    const driverId = targetDelivery.driverId;
    if (driverId) {
      if (newStatus === 'Entregue') {
        updatedDrivers = drivers.map(drv => {
          if (drv.id === driverId) {
            return {
              ...drv,
              status: 'Disponível' as DriverStatus,
              completedCount: drv.completedCount + 1
            };
          }
          return drv;
        });
      } else if (newStatus === 'Cancelado') {
        updatedDrivers = drivers.map(drv => {
          if (drv.id === driverId) {
            return {
              ...drv,
              status: 'Disponível' as DriverStatus
            };
          }
          return drv;
        });
      } else if (newStatus === 'Em Trânsito') {
        updatedDrivers = drivers.map(drv => {
          if (drv.id === driverId) {
            return {
              ...drv,
              status: 'Em Trânsito' as DriverStatus
            };
          }
          return drv;
        });
      }
    }

    updateStoredState(updatedDrivers, updatedDeliveries);
  };

  // Assign or Reassign driver to a delivery
  const handleAssignDriver = (deliveryId: string, driverId: string | null) => {
    const targetDelivery = deliveries.find(d => d.id === deliveryId);
    if (!targetDelivery) return;

    const oldDriverId = targetDelivery.driverId;
    let updatedDrivers = [...drivers];

    // 1. If there was a previous driver, change them back to "Disponível"
    if (oldDriverId) {
      updatedDrivers = updatedDrivers.map(d => 
        d.id === oldDriverId ? { ...d, status: 'Disponível' as DriverStatus } : d
      );
    }

    // 2. Assign new driver and set their status to "Em Trânsito" ONLY if delivery is already in transit
    if (driverId) {
      const isTransit = targetDelivery.status === 'Em Trânsito';
      updatedDrivers = updatedDrivers.map(d => 
        d.id === driverId 
          ? { ...d, status: isTransit ? ('Em Trânsito' as DriverStatus) : d.status }
          : d
      );
    }

    const updatedDeliveries = deliveries.map(d => {
      if (d.id === deliveryId) {
        return {
          ...d,
          driverId: driverId,
          updatedAt: new Date().toISOString()
        };
      }
      return d;
    });

    updateStoredState(updatedDrivers, updatedDeliveries);
  };

  // Update Driver manually (Status change from Available to Rest Break)
  const handleUpdateDriverStatus = (driverId: string, newStatus: DriverStatus) => {
    const updatedDrivers = drivers.map(d => 
      d.id === driverId ? { ...d, status: newStatus } : d
    );
    updateStoredState(updatedDrivers, deliveries);
  };

  // Delete Delivery Register from dashboard
  const handleDeleteDelivery = (deliveryId: string) => {
    const target = deliveries.find(d => d.id === deliveryId);
    let updatedDrivers = [...drivers];

    // If the delivery being deleted was active, liberate the associated courier
    if (target && target.driverId && (target.status === 'Em Trânsito' || target.status === 'Pendente')) {
      updatedDrivers = drivers.map(d => 
        d.id === target.driverId ? { ...d, status: 'Disponível' as DriverStatus } : d
      );
    }

    const updatedDeliveries = deliveries.filter(d => d.id !== deliveryId);
    updateStoredState(updatedDrivers, updatedDeliveries);
  };

  // Highlight on map via selection
  const handleSelectDeliveryFromMap = (delivery: Delivery) => {
    // Expand this delivery in the list by scrolling or focusing, or we can toggle highlights
    const element = document.getElementById(delivery.id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      // Add visual border flash effect
      element.classList.add('ring-2', 'ring-orange-500');
      setTimeout(() => {
        element.classList.remove('ring-2', 'ring-orange-500');
      }, 2000);
    }
  };

  const handleSelectDriverFromMap = (driver: Driver) => {
    setSelectedDriverId(driver.id);
    // Smooth scroll to driver element in sidebar
    const element = document.getElementById(`map-driver-${driver.id}`);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  return (
    <div className="min-h-screen bg-slate-50/50 p-4 sm:p-6 lg:p-8 font-sans antialiased text-slate-800 selection:bg-orange-500 selection:text-white">
      {/* Top Banner Status Bar */}
      <div className="max-w-7xl mx-auto mb-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          {/* Branded Jadlog Corporate Header Logo */}
          <div className="flex items-center gap-3">
            <div className="bg-slate-900 text-white px-4 py-2 rounded-2xl font-black tracking-tighter text-xl flex items-center gap-0.5 hover:shadow-md transition-shadow border border-slate-800">
              <span className="text-white font-black tracking-tight">JAD</span>
              <span className="text-orange-500 font-black">LOG</span>
              <span className="w-1.5 h-1.5 rounded-full bg-orange-500 inline-block ml-1 animate-pulse"></span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-wider text-orange-600 bg-orange-50 border border-orange-100 px-2 py-0.5 rounded-md leading-none inline-block">
                  Sistema de Fechamento Integrado
                </span>
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Gestão Quinzenal
                </span>
              </div>
              <h1 className="text-lg sm:text-xl font-black tracking-tight text-slate-900 mt-1">
                Controle de Entregas e Repasses
              </h1>
            </div>
          </div>
        </div>

        {/* Live Clock & Actions */}
        <div className="flex flex-wrap items-center gap-2.5 self-stretch md:self-auto justify-between md:justify-start bg-white p-2.5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center gap-2 px-1">
            <Clock className="w-4 h-4 text-orange-500 animate-pulse" />
            <span className="text-xs font-mono font-bold text-slate-700">
              {currentTime.toLocaleDateString('pt-BR')} — {currentTime.toLocaleTimeString('pt-BR')}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2 border-l border-slate-100 pl-2.5">
            <button
              onClick={handleExportBackup}
              className="text-xs font-semibold text-slate-600 hover:text-emerald-700 hover:bg-emerald-50/50 border border-slate-200 hover:border-emerald-200 py-1 px-2.5 rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
              title="Salvar um backup do sistema no seu computador"
            >
              <Download className="w-3.5 h-3.5" />
              Exportar Backup
            </button>

            <label
              htmlFor="backup_import_input"
              className="text-xs font-semibold text-slate-600 hover:text-orange-700 hover:bg-orange-50/50 border border-slate-200 hover:border-orange-200 py-1 px-2.5 rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
              title="Restaurar um backup salvo anteriormente"
            >
              <Upload className="w-3.5 h-3.5" />
              Restaurar Backup
            </label>
            <input
              type="file"
              id="backup_import_input"
              accept=".json"
              onChange={handleImportBackup}
              className="hidden"
            />

            <button
              onClick={handleResetData}
              className="text-xs font-semibold text-slate-500 hover:text-rose-600 border border-slate-200 hover:border-rose-150 py-1 px-2.5 rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
              title="Resetar dados para demonstração padrão de 15 entregadores"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Resetar Painel
            </button>
          </div>
        </div>
      </div>

      {/* Tab Switcher & Dynamic Layout */}
      <div className="max-w-7xl mx-auto mb-6">
        <div className="flex border-b border-slate-200 bg-white p-1 rounded-2xl shadow-xs inline-flex gap-1">
          <button
            onClick={() => setActiveTab('operational')}
            className={`flex items-center gap-2 text-xs font-extrabold px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
              activeTab === 'operational'
                ? 'bg-slate-900 text-white shadow-sm border border-slate-800'
                : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            <Layers className="w-4 h-4 text-orange-500" />
            Painel Operacional (Análises e Gráficos)
          </button>
          
          <button
            onClick={() => setActiveTab('payouts')}
            className={`flex items-center gap-2 text-xs font-extrabold px-3 py-1.5 rounded-xl transition-all relative cursor-pointer ${
              activeTab === 'payouts'
                ? 'bg-slate-900 text-white shadow-sm border border-slate-800'
                : 'text-slate-650 hover:bg-slate-50'
            }`}
          >
            <Landmark className="w-4 h-4 text-orange-500" />
            Controle Quinzenal e Pagamentos
          </button>
        </div>
      </div>

      {activeTab === 'operational' ? (
        <div className="max-w-7xl mx-auto">
          <ManagerialDashboard 
            drivers={drivers} 
            deliveries={deliveries} 
            selectedYear={selectedYear}
            setSelectedYear={setSelectedYear}
            selectedMonth={selectedMonth}
            setSelectedMonth={setSelectedMonth}
            selectedFortnight={selectedFortnight}
            setSelectedFortnight={setSelectedFortnight}
          />
        </div>
      ) : (
        <div className="max-w-7xl mx-auto">
          <FortnightlyPayments 
            drivers={drivers}
            deliveries={deliveries}
            onUpdateDeliveriesPaymentStatus={handleUpdateDeliveriesPaymentStatus}
            selectedYear={selectedYear}
            setSelectedYear={setSelectedYear}
            selectedMonth={selectedMonth}
            setSelectedMonth={setSelectedMonth}
            selectedFortnight={selectedFortnight}
            setSelectedFortnight={setSelectedFortnight}
          />
        </div>
      )}
    </div>
  );
}
