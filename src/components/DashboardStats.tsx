import React from 'react';
import { ShoppingBag, TrendingUp, Clock, CheckCircle2 } from 'lucide-react';
import { Delivery } from '../types';

interface DashboardStatsProps {
  deliveries: Delivery[];
}

export default function DashboardStats({ deliveries }: DashboardStatsProps) {
  const total = deliveries.length;
  const pending = deliveries.filter(d => d.status === 'Pendente').length;
  const transit = deliveries.filter(d => d.status === 'Em Trânsito').length;
  const delivered = deliveries.filter(d => d.status === 'Entregue').length;
  const canceled = deliveries.filter(d => d.status === 'Cancelado').length;

  const totalValue = deliveries
    .filter(d => d.status === 'Entregue')
    .reduce((sum, d) => sum + d.value, 0);

  const pendingValue = deliveries
    .filter(d => d.status !== 'Entregue' && d.status !== 'Cancelado')
    .reduce((sum, d) => sum + d.value, 0);

  const stats = [
    {
      id: 'stat-total',
      title: 'Total de Entregas',
      value: total,
      icon: ShoppingBag,
      color: 'bg-orange-50 text-orange-600 border-orange-100',
      description: 'Acumulado do dia',
    },
    {
      id: 'stat-pending',
      title: 'Pendentes / Aguardando',
      value: pending,
      icon: Clock,
      color: 'bg-amber-50 text-amber-600 border-amber-100',
      description: 'Aguardando entregador',
    },
    {
      id: 'stat-transit',
      title: 'Em Trânsito',
      value: transit,
      icon: TrendingUp,
      color: 'bg-blue-50 text-blue-600 border-blue-100',
      description: 'Entregadores na rua',
    },
    {
      id: 'stat-delivered',
      title: 'Entregas Concluídas',
      value: delivered,
      icon: CheckCircle2,
      color: 'bg-emerald-50 text-emerald-600 border-emerald-100',
      description: `${canceled} canceladas hoje`,
    },
    {
      id: 'stat-revenue',
      title: 'Faturamento Concluído',
      value: `R$ ${totalValue.toFixed(2)}`,
      icon: () => <span className="text-xl font-bold font-sans">R$</span>,
      color: 'bg-slate-900 text-white border-slate-800',
      description: `R$ ${pendingValue.toFixed(2)} em aberto`,
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
      {stats.map((stat) => {
        const IconComponent = stat.icon;
        return (
          <div
            key={stat.id}
            id={stat.id}
            className={`border rounded-2xl p-5 flex flex-col justify-between transition-all duration-300 hover:shadow-md ${
              stat.id === 'stat-revenue' 
                ? 'bg-slate-900 border-slate-800 shadow-sm' 
                : 'bg-white border-slate-200'
            }`}
          >
            <div className="flex justify-between items-start mb-4">
              <div>
                <p className={`text-xs font-semibold uppercase tracking-wider ${
                  stat.id === 'stat-revenue' ? 'text-slate-400' : 'text-slate-500'
                }`}>
                  {stat.title}
                </p>
                <h3 className={`text-2xl font-bold font-sans tracking-tight mt-1 ${
                  stat.id === 'stat-revenue' ? 'text-white' : 'text-slate-900'
                }`}>
                  {stat.value}
                </h3>
              </div>
              <div className={`p-2.5 rounded-xl border flex items-center justify-center ${stat.color}`}>
                <IconComponent className="w-5 h-5" />
              </div>
            </div>
            <div className="flex items-center text-xs mt-1 border-t pt-2 border-dashed border-slate-100 opacity-90">
              <span className={stat.id === 'stat-revenue' ? 'text-slate-400' : 'text-slate-500'}>
                {stat.description}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
