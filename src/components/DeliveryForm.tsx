import React, { useState, useEffect } from 'react';
import { Driver, Delivery, DeliveryStatus } from '../types';
import { CITIES_PRICING } from '../data';
import { PlusCircle, MapPin, DollarSign, UserCheck, AlertOctagon, Sparkles } from 'lucide-react';

interface DeliveryFormProps {
  drivers: Driver[];
  onAddDelivery: (deliveryData: Omit<Delivery, 'id' | 'createdAt' | 'updatedAt' | 'history' | 'paymentStatus'>) => void;
  onQuickAssign?: boolean;
}

export default function DeliveryForm({ drivers, onAddDelivery }: DeliveryFormProps) {
  const [address, setAddress] = useState('');
  const [clientName, setClientName] = useState('');
  const [destinationCity, setDestinationCity] = useState(CITIES_PRICING[0].name);
  const [isNonStandard, setIsNonStandard] = useState(false);
  const [extraSurchargeStr, setExtraSurchargeStr] = useState('0.00');
  const [calculatedValue, setCalculatedValue] = useState(2.50);
  const [driverId, setDriverId] = useState('');
  const [notes, setNotes] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Automatically update the calculated value when City or Fora do Padrão changes
  useEffect(() => {
    const selectedCity = CITIES_PRICING.find(c => c.name === destinationCity);
    if (!selectedCity) return;

    let base = selectedCity.baseRate;
    let extra = 0;

    if (isNonStandard) {
      if (selectedCity.isWithinCity) {
        // Paulo Afonso BA standard is 2.50, non-standard is 3.50 (surcharge is exactly 1.00)
        extra = 1.00;
      } else {
        // For other cities, set a default non-standard surcharge of 1.50 or use the input
        const customExtra = parseFloat(extraSurchargeStr.replace(',', '.'));
        extra = isNaN(customExtra) ? 1.50 : customExtra;
      }
    } else {
      extra = 0;
    }

    setCalculatedValue(base + extra);
  }, [destinationCity, isNonStandard, extraSurchargeStr]);

  // Handle City Change to reset/adjust surcharges
  const handleCityChange = (cityName: string) => {
    setDestinationCity(cityName);
    const selectedCity = CITIES_PRICING.find(c => c.name === cityName);
    if (selectedCity) {
      if (selectedCity.isWithinCity) {
        setExtraSurchargeStr('1.00'); // Paulo Afonso non-standard is +1.00 (paying 3.50 total)
      } else {
        setExtraSurchargeStr('1.50'); // Other towns defaults to +1.50 if extra is checked
      }
    }
  };

  const suggestions = [
    'Rua da Harmonia, 340 - Centro',
    'Av. Apolônio Sales, 102 - Cleriston Andrade',
    'Rua do Cemitério, 54 - Centro',
    'Rua D, Bloco 4 - Tancredo Neves BTN I',
    'Av. Delmiro Gouveia, 89 - General Dutra',
    'Rua Monsenhor Magalhães, 50 - Centro',
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!address.trim()) {
      setErrorMsg('Por favor, informe o endereço de destino.');
      return;
    }
    if (!clientName.trim()) {
      setErrorMsg('Por favor, informe o nome do cliente.');
      return;
    }

    const extraSurcharge = isNonStandard ? parseFloat(extraSurchargeStr.replace(',', '.')) : 0;
    const finalSurcharge = isNaN(extraSurcharge) ? 0 : extraSurcharge;

    // Generate coordinates on our map limits
    const randomX = Math.floor(Math.random() * 66) + 17;
    const randomY = Math.floor(Math.random() * 66) + 17;

    onAddDelivery({
      address: `${address.trim()}, ${destinationCity}`,
      clientName: clientName.trim(),
      destinationCity,
      isNonStandard,
      extraSurcharge: finalSurcharge,
      value: calculatedValue,
      driverId: driverId || null,
      status: driverId ? 'Em Trânsito' : 'Pendente',
      notes: notes.trim() || undefined,
      coords: { x: randomX, y: randomY }
    });

    // Reset Form
    setAddress('');
    setClientName('');
    setIsNonStandard(false);
    setDriverId('');
    setNotes('');
    setSuccessMsg('Entrega registrada e calculada com sucesso!');

    setTimeout(() => {
      setSuccessMsg('');
    }, 4000);
  };

  return (
    <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm">
      <h2 className="text-base font-bold text-slate-800 flex items-center gap-1.5 mb-3">
        <PlusCircle className="w-5 h-5 text-orange-500" />
        Lançar Nova Entrega
      </h2>
      <p className="text-xs text-slate-500 mb-4">
        Selecione o destino para calcular a taxa correta para o entregador.
      </p>

      {errorMsg && (
        <div className="mb-4 p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs flex items-center gap-2">
          <AlertOctagon className="w-4 h-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {successMsg && (
        <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-semibold">
          {successMsg}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-3">
        
        {/* City Destination selector with Rates indicators */}
        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1">
            Cidade / Localização de Destino
          </label>
          <select
            value={destinationCity}
            onChange={(e) => handleCityChange(e.target.value)}
            className="w-full text-xs bg-slate-50 border border-slate-200 focus:border-orange-500 focus:ring-1 focus:ring-orange-500 focus:bg-white rounded-xl py-2.5 px-3 outline-none transition-colors appearance-none cursor-pointer font-medium text-slate-850"
          >
            {CITIES_PRICING.map((city) => (
              <option key={city.name} value={city.name}>
                {city.name} — Base: R$ {city.baseRate.toFixed(2)}
              </option>
            ))}
          </select>
        </div>

        {/* Destination Address */}
        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1">
            Endereço Completo
          </label>
          <div className="relative">
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Rua, Número, Bairro ou referência"
              className="w-full text-xs bg-slate-50 border border-slate-200 focus:border-orange-500 focus:ring-1 focus:ring-orange-500 focus:bg-white rounded-xl py-2.5 pl-9 pr-3 outline-none transition-colors"
            />
            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          </div>
          
          {/* Quick Suggestions List */}
          <div className="flex flex-wrap gap-1.5 mt-1.5">
            {suggestions.map((sug, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setAddress(sug)}
                className="text-[9px] bg-slate-105 hover:bg-slate-200 text-slate-600 rounded px-1.5 py-0.5 transition-colors border border-slate-150"
              >
                + {sug.split('-')[0].trim()}
              </button>
            ))}
          </div>
        </div>

        {/* Client Destinatario */}
        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1">
            Nome do Cliente (Destinatário)
          </label>
          <input
            type="text"
            value={clientName}
            onChange={(e) => setClientName(e.target.value)}
            placeholder="Ex: Carlos de Souza"
            className="w-full text-xs bg-slate-50 border border-slate-200 focus:border-orange-500 focus:ring-1 focus:ring-orange-500 focus:bg-white rounded-xl py-2.5 px-3 outline-none transition-colors"
          />
        </div>

        {/* Non-Standard switch / Out of Pattern Toggle */}
        <div className="bg-slate-50/50 border border-slate-200/85 p-3 rounded-xl">
          <div className="flex items-center justify-between">
            <div className="flex flex-col">
              <span className="text-xs font-bold text-slate-700 flex items-center gap-1">
                ⭐ Entrega Fora do Padrão
              </span>
              <span className="text-[10px] text-slate-500">
                Lançar pacote excedente ou entrega com adicional
              </span>
            </div>
            
            <input
              type="checkbox"
              checked={isNonStandard}
              onChange={(e) => setIsNonStandard(e.target.checked)}
              className="w-4 h-4 text-orange-600 border-slate-300 rounded focus:ring-orange-500 cursor-pointer"
            />
          </div>

          {/* Surcharge input if isNonStandard is true */}
          {isNonStandard && (
            <div className="mt-3 pt-3 border-t border-dashed border-slate-200 flex items-center justify-between gap-4">
              <span className="text-[10px] font-bold text-orange-700">
                Valor Adicional do Acréscimo (R$):
              </span>
              <input
                type="text"
                value={extraSurchargeStr}
                onChange={(e) => setExtraSurchargeStr(e.target.value)}
                placeholder="Ex: 1,50"
                className="w-24 text-xs font-mono font-bold text-right bg-white border border-slate-200 rounded-lg py-1 px-2 focus:ring-1 focus:ring-orange-500 outline-none"
              />
            </div>
          )}
        </div>

        {/* Calculated Total Delivery Payout for Courier */}
        <div className="bg-slate-900 text-white p-3 rounded-2xl flex justify-between items-center shadow-inner">
          <div className="flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-amber-300 animate-pulse" />
            <span className="text-xs font-semibold">Valor Final Pago ao Entregador:</span>
          </div>
          <span className="font-mono text-base font-extrabold text-amber-300">
            R$ {calculatedValue.toFixed(2)}
          </span>
        </div>

        {/* Driver Selection Dropdown */}
        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1">
            Designar Entregador Imediatamente
          </label>
          <div className="relative">
            <select
              value={driverId}
              onChange={(e) => setDriverId(e.target.value)}
              className="w-full text-xs bg-slate-50 border border-slate-200 focus:border-orange-500 focus:ring-1 focus:ring-orange-500 focus:bg-white rounded-xl py-2.5 pl-9 pr-3 outline-none transition-colors appearance-none cursor-pointer"
            >
              <option value="">Aguardando Designação (Fila Pendente)</option>
              {drivers.map((drv) => (
                <option key={drv.id} value={drv.id} disabled={drv.status === 'Pausa'}>
                  {drv.name} ({drv.vehicle}) - {drv.status === 'Pausa' ? 'Em Intervalo' : drv.status === 'Em Trânsito' ? 'Ocupado' : 'Disponível'}
                </option>
              ))}
            </select>
            <UserCheck className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-slate-500">
              <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
              </svg>
            </div>
          </div>
        </div>

        {/* Observations Notes */}
        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1">
            Observações de Entrega (Opcional)
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Ex: Deixar na portaria, condomínio fechado, troco para R$ 50..."
            rows={1}
            className="w-full text-xs bg-slate-50 border border-slate-200 focus:border-orange-500 focus:ring-1 focus:ring-orange-500 focus:bg-white rounded-xl py-1.5 px-3 outline-none transition-colors silence-scrollbar resize-none"
          />
        </div>

        {/* Action button */}
        <button
          type="submit"
          className="w-full text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 hover:shadow py-2.5 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer"
        >
          {driverId ? 'Lançar e Iniciar Rota' : 'Registrar na Fila Pendente'}
        </button>
      </form>
    </div>
  );
}
