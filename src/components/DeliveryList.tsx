import React, { useState } from 'react';
import { Delivery, Driver } from '../types';
import { Search, MapPin, User, DollarSign, Clock, CheckCircle, XCircle, ChevronDown, ChevronUp, RefreshCw, Send, Trash2 } from 'lucide-react';

interface DeliveryListProps {
  deliveries: Delivery[];
  drivers: Driver[];
  selectedDriverId: string | null;
  onUpdateDeliveryStatus: (deliveryId: string, status: Delivery['status']) => void;
  onAssignDriver: (deliveryId: string, driverId: string | null) => void;
  onDeleteDelivery: (deliveryId: string) => void;
}

export default function DeliveryList({
  deliveries,
  drivers,
  selectedDriverId,
  onUpdateDeliveryStatus,
  onAssignDriver,
  onDeleteDelivery
}: DeliveryListProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('Todas');
  const [expandedDeliveryId, setExpandedDeliveryId] = useState<string | null>(null);

  // Filter logic
  const filteredDeliveries = deliveries.filter((del) => {
    // Search filter
    const matchesSearch =
      del.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      del.address.toLowerCase().includes(searchTerm.toLowerCase()) ||
      del.id.toLowerCase().includes(searchTerm.toLowerCase());

    // Status filter
    const matchesStatus = statusFilter === 'Todas' || del.status === statusFilter;

    // Driver filter
    const matchesDriver = selectedDriverId === null || del.driverId === selectedDriverId;

    return matchesSearch && matchesStatus && matchesDriver;
  });

  const getStatusStyle = (status: Delivery['status']) => {
    switch (status) {
      case 'Pendente':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'Em Trânsito':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'Entregue':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'Cancelado':
        return 'bg-rose-50 text-rose-700 border-rose-200';
    }
  };

  const getDriverName = (driverId: string | null) => {
    if (!driverId) return 'Sem Entregador';
    const driver = drivers.find((d) => d.id === driverId);
    return driver ? driver.name : 'Desconhecido';
  };

  const formatTime = (isoString: string) => {
    try {
      const date = new Date(isoString);
      return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    } catch {
      return '';
    }
  };

  return (
    <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm">
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4 mb-5">
        <div>
          <h2 className="text-base font-bold text-slate-800">Histórico e Controle de Encomendas</h2>
          <p className="text-xs text-slate-500 mt-0.5">Gerencie o fluxo e designações das entregas</p>
        </div>

        {/* Filter Badges & Search Inputs block */}
        <div className="flex flex-col sm:flex-row gap-2.5 w-full xl:w-auto">
          {/* Search */}
          <div className="relative flex-1 sm:w-64">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por cliente, endereço ou código..."
              className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl py-2 pl-8 pr-3 outline-none focus:border-orange-500 focus:bg-white transition-colors"
            />
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          </div>

          {/* Status filters */}
          <div className="flex bg-slate-100 p-0.5 rounded-xl text-xs font-semibold overflow-x-auto whitespace-nowrap self-start sm:self-auto scrollbar-none">
            {['Todas', 'Pendente', 'Em Trânsito', 'Entregue', 'Cancelado'].map((status) => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`px-3 py-1.5 rounded-lg transition-all text-[11px] sm:text-xs cursor-pointer ${
                  statusFilter === status
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                {status}
              </button>
            ))}
          </div>
        </div>
      </div>

      {selectedDriverId && (
        <div className="mb-4 p-2.5 bg-orange-50/50 border border-orange-100 rounded-2xl flex justify-between items-center text-xs text-orange-800 font-medium">
          <span>Filtrando entregas do entregador: <b>{getDriverName(selectedDriverId)}</b></span>
          <button
            onClick={() => onUpdateDeliveryStatus('dummy', 'Pendente')} // Trigger a refresh indirectly
            className="flex items-center gap-1 text-[11px] text-orange-650 font-bold hover:underline"
          >
            Filtro Ativador Ativo
          </button>
        </div>
      )}

      {/* Deliveries list container */}
      <div className="space-y-3 overflow-y-auto max-h-[600px] pr-1">
        {filteredDeliveries.length === 0 ? (
          <div className="text-center py-12 border border-dashed border-slate-200 rounded-2xl">
            <div className="text-3xl">📦</div>
            <p className="text-xs text-slate-500 font-semibold mt-3">Nenhuma entrega encontrada.</p>
            <p className="text-[10px] text-slate-400 mt-1">Experimente alterar os filtros ou cadastrar uma nova entrega!</p>
          </div>
        ) : (
          filteredDeliveries.map((delivery) => {
            const isExpanded = expandedDeliveryId === delivery.id;
            const assignedDriver = drivers.find((d) => d.id === delivery.driverId);

            return (
              <div
                key={delivery.id}
                className={`border rounded-2xl p-4 transition-all duration-200 bg-white hover:shadow-sm ${
                  isExpanded ? 'border-slate-300' : 'border-slate-100'
                }`}
              >
                {/* Header Information row */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                  <div className="flex items-start gap-3">
                    {/* Visual check indicator based on status */}
                    <div className={`p-2 rounded-xl border shrink-0 ${
                      delivery.status === 'Entregue' 
                        ? 'bg-emerald-50 text-emerald-600 border-emerald-100' 
                        : delivery.status === 'Cancelado' 
                          ? 'bg-rose-50 text-rose-500 border-rose-100' 
                          : delivery.status === 'Em Trânsito'
                            ? 'bg-blue-50 text-blue-600 border-blue-100 animate-pulse'
                            : 'bg-amber-50 text-amber-500 border-amber-100'
                    }`}>
                      {delivery.status === 'Entregue' ? (
                        <CheckCircle className="w-5 h-5" />
                      ) : delivery.status === 'Cancelado' ? (
                        <XCircle className="w-5 h-5" />
                      ) : (
                        <Clock className="w-5 h-5" />
                      )}
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-mono font-bold bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md">
                          {delivery.id.toUpperCase()}
                        </span>
                        <span className={`px-2 py-0.5 text-[9px] font-bold rounded-md border ${getStatusStyle(delivery.status)}`}>
                          {delivery.status}
                        </span>
                        <span className="text-[10px] text-slate-400 font-medium">
                          Faturamento: R$ {delivery.value.toFixed(2)}
                        </span>
                      </div>
                      
                      <h3 className="text-sm font-semibold text-slate-800 mt-1">
                        Destinatário: {delivery.clientName}
                      </h3>
                      
                      <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                        <MapPin className="w-3.5 h-3.5 text-slate-400" />
                        {delivery.address}
                      </p>
                    </div>
                  </div>

                  {/* Right hand side action widgets */}
                  <div className="flex flex-col sm:items-end w-full sm:w-auto mt-2 sm:mt-0 gap-2">
                    {/* Driver Association Tag */}
                    <div className="text-xs">
                      {delivery.driverId ? (
                        <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-lg p-1 px-2.5">
                          <span className="text-slate-400">Entregador:</span>
                          <span className="font-bold text-slate-700 flex items-center gap-1">
                            🏍️ {getDriverName(delivery.driverId)}
                          </span>
                        </div>
                      ) : (
                        <div className="flex flex-col gap-1 w-full sm:w-48">
                          <span className="text-[10px] text-rose-500 font-bold block">🚨 Sem entregador designado</span>
                          <select
                            onChange={(e) => {
                              if (e.target.value) {
                                onAssignDriver(delivery.id, e.target.value);
                              }
                            }}
                            className="text-[10px] w-full text-slate-700 bg-amber-50 border border-amber-200 rounded-lg py-1 px-1.5 outline-none font-semibold"
                            defaultValue=""
                          >
                            <option value="" disabled>Selecione um dos 15...</option>
                            {drivers
                              .filter(d => d.status === 'Disponível')
                              .map(d => (
                                <option key={d.id} value={d.id}>{d.name} ({d.vehicle})</option>
                              ))
                            }
                          </select>
                        </div>
                      )}
                    </div>

                    {/* Fast Dispatch buttons */}
                    <div className="flex items-center gap-1.5">
                      {delivery.status === 'Pendente' && delivery.driverId && (
                        <button
                          onClick={() => onUpdateDeliveryStatus(delivery.id, 'Em Trânsito')}
                          className="bg-slate-900 hover:bg-slate-800 text-white font-semibold text-[10px] px-2.5 py-1.5 rounded-lg flex items-center gap-1 cursor-pointer"
                        >
                          <Send className="w-3 h-3" /> Iniciar Rota
                        </button>
                      )}

                      {delivery.status === 'Em Trânsito' && (
                        <>
                          <button
                            onClick={() => onUpdateDeliveryStatus(delivery.id, 'Entregue')}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[10px] px-2.5 py-1.5 rounded-lg cursor-pointer"
                          >
                            Concluído ✓
                          </button>
                          <button
                            onClick={() => onUpdateDeliveryStatus(delivery.id, 'Cancelado')}
                            className="bg-slate-100 hover:bg-slate-200 text-slate-600 font-semibold text-[10px] px-2.5 py-1.5 rounded-lg cursor-pointer"
                          >
                            Cancelar
                          </button>
                        </>
                      )}

                      {/* Expand / Collapse notes toggle */}
                      <button
                        onClick={() => setExpandedDeliveryId(isExpanded ? null : delivery.id)}
                        className="text-slate-400 hover:text-slate-700 p-1 rounded-lg"
                      >
                        {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Expanded content of details */}
                {isExpanded && (
                  <div className="mt-3 pt-3 border-t border-dashed border-slate-100 text-xs text-slate-600">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <p className="font-bold text-slate-700 mb-1 flex items-center gap-1">
                          🗒️ Informações Extra / Observação
                        </p>
                        <p className="text-slate-500 italic bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                          {delivery.notes || 'Sem observações cadastradas para este pedido.'}
                        </p>
                        
                        {/* Delivery modification logs */}
                        <div className="mt-2.5 flex items-center gap-2">
                          <p className="text-[10px] text-slate-400">
                            <b>Iniciado:</b> {formatTime(delivery.createdAt)}
                          </p>
                          <p className="text-[10px] text-slate-400">
                            <b>Última atualização:</b> {formatTime(delivery.updatedAt)}
                          </p>
                        </div>
                      </div>

                      {/* Timeline status list */}
                      <div>
                        <p className="font-bold text-slate-700 mb-1">📍 Histórico de Atividades</p>
                        <div className="space-y-1.5 pl-3 border-l-2 border-slate-200 py-1">
                          {delivery.history?.map((step, idx) => (
                            <div key={idx} className="relative">
                              <div className="absolute -left-[16px] top-1.5 w-1.5 h-1.5 rounded-full bg-slate-400 border border-white" />
                              <p className="text-[10px] font-semibold text-slate-700">
                                {step.status} <span className="font-normal text-slate-400">({formatTime(step.timestamp)})</span>
                              </p>
                            </div>
                          ))}
                        </div>

                        {/* Quick action: Reassign or clear coupler if not completed */}
                        {delivery.status !== 'Entregue' && delivery.status !== 'Cancelado' && (
                          <div className="mt-3 flex justify-between items-center bg-slate-50 p-2 rounded-xl border border-slate-100">
                            <span className="text-[10px] text-slate-500 font-semibold">Liberar / Trocar entregador:</span>
                            <button
                              onClick={() => onAssignDriver(delivery.id, null)}
                              className="text-[10px] text-rose-600 hover:text-rose-700 hover:underline cursor-pointer"
                            >
                              Remover Designação
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="mt-3 pt-3 border-t border-slate-100 flex justify-end">
                      <button
                        onClick={() => {
                          if (confirm('Deseja excluir permanentemente este registro de entrega?')) {
                            onDeleteDelivery(delivery.id);
                          }
                        }}
                        className="text-slate-400 hover:text-rose-600 flex items-center gap-1 text-[10px] cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" /> Excluir Registro do Painel
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
