import React, { useState } from 'react';
import { Map, Navigation, User, Bike, Truck, Sparkles, MapPin, CheckCircle2 } from 'lucide-react';
import { Driver, Delivery } from '../types';
import { motion } from 'motion/react';

interface RadarMapProps {
  drivers: Driver[];
  deliveries: Delivery[];
  onSelectDelivery: (delivery: Delivery) => void;
  onSelectDriver: (driver: Driver) => void;
}

export default function RadarMap({ drivers, deliveries, onSelectDelivery, onSelectDriver }: RadarMapProps) {
  const [hoveredItem, setHoveredItem] = useState<{ id: string; type: 'driver' | 'delivery'; name: string; info: string } | null>(null);

  // Filter deliveries with coordinates
  const activeDeliveries = deliveries.filter(d => d.status === 'Pendente' || d.status === 'Em Trânsito');

  // Let's create semi-random stable positions for drivers who are NOT in transit/delivering
  // so we can visualize them.
  const getDriverCoords = (driver: Driver, index: number) => {
    // If delivering, match the active delivery coordinate with a slight offset
    const activeDelivery = deliveries.find(d => d.driverId === driver.id && d.status === 'Em Trânsito');
    if (activeDelivery) {
      return { x: activeDelivery.coords.x - 2, y: activeDelivery.coords.y - 3, active: true };
    }
    // Static mapped coordinates based on index to distribute nicely
    const staticPositions = [
      { x: 15, y: 30 }, { x: 80, y: 20 }, { x: 50, y: 75 },
      { x: 70, y: 60 }, { x: 30, y: 80 }, { x: 85, y: 55 },
      { x: 25, y: 15 }, { x: 60, y: 85 }, { x: 10, y: 60 },
      { x: 45, y: 45 }, { x: 90, y: 80 }, { x: 65, y: 15 },
      { x: 55, y: 40 }, { x: 20, y: 90 }, { x: 75, y: 40 }
    ];
    return { ...staticPositions[index % staticPositions.length], active: false };
  };

  const getVehicleIcon = (vehicle: string) => {
    switch (vehicle) {
      case 'Bike': return <Bike className="w-3.5 h-3.5" />;
      case 'Carro': return <Truck className="w-3.5 h-3.5" />;
      case 'Van': return <Truck className="w-3.5 h-3.5" />;
      default: return <User className="w-3.5 h-3.5" />; // Moto / Default
    }
  };

  return (
    <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm mb-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
        <div>
          <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-orange-50 text-orange-600">
              <Map className="w-5 h-5 animate-pulse" />
            </span>
            Painel de Monitoramento Dinâmico
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Representação visual das entregas ativas e posicionamento dos 15 entregadores na região.
          </p>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap gap-3 text-xs">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-amber-500 animate-pulse inline-block" />
            <span className="text-slate-600 font-medium">Entrega Pendente</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-blue-500 inline-block" />
            <span className="text-slate-600 font-medium">Entrega Em Trânsito</span>
          </div>
          <div className="flex items-center gap-1.5 flex-nowrap">
            <div className="w-5 h-5 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold text-[9px] shadow-sm">
              🏍️
            </div>
            <span className="text-slate-600 font-medium">Entregador Ativo</span>
          </div>
        </div>
      </div>

      {/* Map Board */}
      <div className="relative w-full aspect-[2/1] min-h-[300px] border border-slate-100 bg-slate-50 rounded-2xl overflow-hidden shadow-inner">
        
        {/* Dynamic Scanning Grid Concept (SVG Streets Overlay) */}
        <svg className="absolute inset-0 w-full h-full text-slate-200/90 pointer-events-none" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#e2e8f0" strokeWidth="0.8" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
          
          {/* Mock Main Avenues (Streets Layout) */}
          <line x1="0%" y1="40%" x2="100%" y2="40%" stroke="#e2e8f0" strokeWidth="6" strokeLinecap="round" />
          <line x1="40%" y1="0%" x2="40%" y2="100%" stroke="#e2e8f0" strokeWidth="6" strokeLinecap="round" />
          <line x1="0%" y1="15%" x2="100%" y2="75%" stroke="#e2e8f0" strokeWidth="3" strokeDasharray="5,5" />
          <line x1="10%" y1="0%" x2="10%" y2="100%" stroke="#cbd5e1" strokeWidth="2" />
          <line x1="85%" y1="0%" x2="85%" y2="100%" stroke="#cbd5e1" strokeWidth="2" />
          <line x1="0%" y1="85%" x2="100%" y2="85%" stroke="#cbd5e1" strokeWidth="2" />
          
          {/* River / Green Zone representation */}
          <path d="M 0,20 Q 200,80 400,120 T 1000,100" fill="none" stroke="#bfdbfe" strokeWidth="12" opacity="0.6" strokeLinecap="round"/>
          <circle cx="75%" cy="30%" r="50" fill="#f0fdf4" opacity="0.75" />
          <text x="73%" y="31%" className="fill-emerald-600/60 text-[10px] font-sans font-bold italic">Zona Verde</text>
          
          <text x="42%" y="8%" className="fill-slate-400 text-[10px] font-mono tracking-widest uppercase">Av. Paulista</text>
          <text x="5%" y="38%" className="fill-slate-400 text-[10px] font-mono tracking-widest uppercase">Rua Augusta</text>
        </svg>

        {/* 1. Plot Deliveries */}
        {activeDeliveries.map((delivery) => {
          const isTransit = delivery.status === 'Em Trânsito';
          return (
            <motion.button
              key={delivery.id}
              onClick={() => onSelectDelivery(delivery)}
              className="absolute z-10 p-1 -translate-x-1/2 -translate-y-1/2 focus:outline-none group"
              style={{ left: `${delivery.coords.x}%`, top: `${delivery.coords.y}%` }}
              onMouseEnter={() => setHoveredItem({
                id: delivery.id,
                type: 'delivery',
                name: `Pedido: ${delivery.id}`,
                info: `Destino: ${delivery.address.split('-')[0]} | R$ ${delivery.value.toFixed(2)}`
              })}
              onMouseLeave={() => setHoveredItem(null)}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 100 }}
            >
              <div className="relative">
                {/* Sonar Pulse Indicator */}
                <span className={`absolute -inset-2.5 rounded-full opacity-60 ${
                  isTransit ? 'bg-blue-400 animate-ping' : 'bg-amber-400 animate-ping'
                }`} />
                
                {/* Core pin marker */}
                <div className={`w-5 h-5 rounded-full flex items-center justify-center text-white shadow-md border border-white transition-all duration-200 group-hover:scale-125 ${
                  isTransit ? 'bg-blue-600' : 'bg-amber-500'
                }`}>
                  <MapPin className="w-3 h-3" />
                </div>

                {/* Micro badge of ID */}
                <div className="absolute top-5 left-1/2 -translate-x-1/2 bg-slate-800 text-white font-mono text-[8px] px-1 py-0.5 rounded shadow whitespace-nowrap opacity-80 group-hover:opacity-100 group-hover:scale-110 transition-all">
                  {delivery.id.replace('ent-', '#')}
                </div>
              </div>
            </motion.button>
          );
        })}

        {/* 2. Plot the 15 Drivers */}
        {drivers.map((driver, index) => {
          const coords = getDriverCoords(driver, index);
          const isDelivering = driver.status === 'Em Trânsito';
          const isPausa = driver.status === 'Pausa';
          
          let emoji = '🏍️';
          if (driver.vehicle === 'Bike') emoji = '🚲';
          if (driver.vehicle === 'Carro') emoji = '🚗';
          if (driver.vehicle === 'Van') emoji = '🚐';

          return (
            <motion.button
              key={driver.id}
              id={`map-driver-${driver.id}`}
              onClick={() => onSelectDriver(driver)}
              className="absolute z-20 -translate-x-1/2 -translate-y-1/2 focus:outline-none group"
              style={{ left: `${coords.x}%`, top: `${coords.y}%` }}
              onMouseEnter={() => setHoveredItem({
                id: driver.id,
                type: 'driver',
                name: driver.name,
                info: `Status: ${driver.status} | ${driver.vehicle} (${driver.phone})`
              })}
              onMouseLeave={() => setHoveredItem(null)}
              animate={{
                x: isDelivering ? [0, 2, -1, 0] : 0,
                y: isDelivering ? [0, -3, 1, 0] : 0,
              }}
              transition={{
                repeat: Infinity,
                duration: isDelivering ? 4 : 0,
                ease: "easeInOut"
              }}
            >
              <div className="relative">
                {/* Border ring based on driver status */}
                <div className={`w-7 h-7 rounded-full flex items-center justify-center font-sans text-sm shadow-md border-2 bg-white transition-all duration-200 group-hover:scale-125 select-none ${
                  isPausa 
                    ? 'border-slate-300 bg-slate-100' 
                    : isDelivering 
                      ? 'border-blue-500 ring-2 ring-blue-100 animate-pulse' 
                      : 'border-emerald-500 bg-emerald-50'
                }`}>
                  <span className="text-sm">{emoji}</span>
                </div>

                {/* Status Indicator Dot */}
                <span className={`absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border border-white ${
                  isPausa ? 'bg-slate-400' : isDelivering ? 'bg-blue-500' : 'bg-emerald-500'
                }`} />

                {/* Micro Name tag */}
                <div className="absolute -bottom-5 left-1/2 -translate-x-1/2 bg-white border border-slate-200 text-[#0f172a] font-medium text-[8px] px-1 py-0.5 rounded shadow-sm whitespace-nowrap group-hover:bg-orange-600 group-hover:text-white transition-colors">
                  {driver.name.split(' ')[0]}
                </div>
              </div>
            </motion.button>
          );
        })}

        {/* Route Connection lines if a driver is actively moving to a delivery */}
        {deliveries.filter(d => d.status === 'Em Trânsito' && d.driverId).map((delivery) => {
          const assignedDriverIndex = drivers.findIndex(dr => dr.id === delivery.driverId);
          if (assignedDriverIndex === -1) return null;
          
          const driver = drivers[assignedDriverIndex];
          const driverCoords = getDriverCoords(driver, assignedDriverIndex);
          
          // Draw dashed path line
          return (
            <svg key={`route-${delivery.id}`} className="absolute inset-0 w-full h-full pointer-events-none z-0">
              <path
                d={`M ${driverCoords.x}%,${driverCoords.y}% L ${delivery.coords.x}%,${delivery.coords.y}%`}
                className="stroke-blue-400/80 stroke-[2] stroke-dasharray-[4,4] fill-none animate-[dash_10s_linear_infinite]"
                style={{
                  strokeDasharray: "4",
                  animation: "dash 1.5s linear infinite"
                }}
              />
            </svg>
          );
        })}

        {/* Map Tooltip Banner */}
        {hoveredItem && (
          <div className="absolute bottom-3 left-3 right-3 sm:left-auto sm:right-3 bg-slate-900 text-white p-3 rounded-xl shadow-lg z-30 flex items-center gap-3 border border-slate-800 backdrop-blur-md max-w-sm">
            <div className={`p-2 rounded-lg ${hoveredItem.type === 'driver' ? 'bg-orange-500/20 text-orange-400' : 'bg-amber-500/20 text-amber-400'}`}>
              {hoveredItem.type === 'driver' ? <Navigation className="w-4 h-4 animate-spin" style={{ animationDuration: '3s' }} /> : <MapPin className="w-4 h-4" />}
            </div>
            <div>
              <p className="text-xs font-bold font-sans tracking-wide">{hoveredItem.name}</p>
              <p className="text-[10px] text-slate-300 mt-0.5">{hoveredItem.info}</p>
            </div>
          </div>
        )}
      </div>

      <style>{`
        @keyframes dash {
          to {
            stroke-dashoffset: -20;
          }
        }
      `}</style>
    </div>
  );
}
