import React from 'react';
import { Driver, VehicleType, DriverStatus } from '../types';
import { Bike, Truck, Star, Phone, CheckCircle, Clock } from 'lucide-react';

interface DriverListProps {
  drivers: Driver[];
  selectedDriverId: string | null;
  onSelectDriver: (driver: Driver | null) => void;
  onUpdateDriverStatus: (driverId: string, newStatus: DriverStatus) => void;
}

export default function DriverList({
  drivers,
  selectedDriverId,
  onSelectDriver,
  onUpdateDriverStatus,
}: DriverListProps) {
  
  const getVehicleIcon = (vehicle: VehicleType) => {
    switch (vehicle) {
      case 'Bike':
        return <Bike className="w-4 h-4 text-emerald-600" />;
      case 'Carro':
        return <Truck className="w-4 h-4 text-orange-600" />;
      case 'Van':
        return <Truck className="w-4 h-4 text-purple-600" />;
      default: // Moto
        return <span className="text-base">🏍️</span>;
    }
  };

  const getStatusBadge = (status: DriverStatus) => {
    switch (status) {
      case 'Disponível':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Disponível
          </span>
        );
      case 'Em Trânsito':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
            Em Rota
          </span>
        );
      case 'Pausa':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-600 border border-slate-200">
            <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
            Descanso
          </span>
        );
    }
  };

  return (
    <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm h-full flex flex-col">
      <div className="flex justify-between items-center mb-4">
        <div>
          <h2 className="text-base font-bold text-slate-800">
            Entregadores Cadastrados ({drivers.length})
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">Clique para filtrar entregas de um entregador</p>
        </div>
        {selectedDriverId && (
          <button
            onClick={() => onSelectDriver(null)}
            className="text-xs font-semibold text-orange-600 hover:text-orange-700 underline"
          >
            Limpar Filtro
          </button>
        )}
      </div>

      <div className="space-y-2.5 overflow-y-auto max-h-[580px] pr-1 scrollbar-thin">
        {drivers.map((driver) => {
          const isSelected = selectedDriverId === driver.id;
          return (
            <div
              key={driver.id}
              className={`group flex items-center justify-between p-3.5 rounded-2xl border transition-all duration-200 ${
                isSelected
                  ? 'border-slate-800 bg-slate-50/90 shadow-xs'
                  : 'border-slate-100 bg-white hover:border-slate-300 hover:bg-slate-50/50'
              }`}
            >
              {/* Driver Details */}
              <div
                onClick={() => onSelectDriver(isSelected ? null : driver)}
                className="flex items-center gap-3 cursor-pointer flex-1 mr-2"
              >
                {/* Avatar */}
                <div className="relative">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-xs text-slate-600 border ${
                    isSelected ? 'bg-orange-50 border-orange-200' : 'bg-slate-100 border-slate-200'
                  }`}>
                    {driver.avatar}
                  </div>
                  <span className="absolute -bottom-1 -right-1 p-0.5 bg-white rounded-full shadow-sm">
                    {getVehicleIcon(driver.vehicle)}
                  </span>
                </div>

                <div className="min-w-0">
                  <h4 className="text-xs sm:text-sm font-semibold text-slate-800 truncate group-hover:text-orange-600 transition-colors">
                    {driver.name}
                  </h4>
                  <div className="flex items-center gap-3 mt-1 text-[10px] sm:text-xs text-slate-500">
                    <span className="flex items-center gap-0.5 font-semibold text-amber-500">
                      <Star className="w-3.5 h-3.5 fill-current" />
                      {driver.rating.toFixed(1)}
                    </span>
                    <span className="flex items-center gap-0.5 font-medium">
                      <CheckCircle className="w-3.5 h-3.5 text-slate-400" />
                      {driver.completedCount} entregas
                    </span>
                  </div>
                </div>
              </div>

              {/* Status and Action Controls */}
              <div className="flex flex-col items-end gap-2 shrink-0">
                {getStatusBadge(driver.status)}

                {/* State toggle action for operators */}
                {driver.status !== 'Em Trânsito' && (
                  <button
                    onClick={() => {
                      const nextStatus = driver.status === 'Disponível' ? 'Pausa' : 'Disponível';
                      onUpdateDriverStatus(driver.id, nextStatus);
                    }}
                    className="text-[10px] font-semibold text-slate-500 hover:text-orange-600 border border-slate-200 hover:border-orange-100 p-1 px-2 rounded-lg transition-colors cursor-pointer"
                    title={driver.status === 'Disponível' ? 'Colocar em descanso' : 'Colocar disponível'}
                  >
                    {driver.status === 'Disponível' ? 'Pausar' : 'Ativar'}
                  </button>
                )}
                {driver.status === 'Em Trânsito' && (
                  <span className="text-[9px] font-mono font-medium text-slate-400 px-1 select-none">
                    Ocupado
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
