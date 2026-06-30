export type VehicleType = 'Moto' | 'Bike' | 'Carro' | 'Van';
export type DriverStatus = 'Disponível' | 'Em Trânsito' | 'Pausa';
export type DeliveryStatus = 'Pendente' | 'Em Trânsito' | 'Entregue' | 'Cancelado';
export type PaymentStatus = 'Pendente' | 'Pago';

export interface Driver {
  id: string;
  name: string;
  avatar: string;
  vehicle: VehicleType;
  status: DriverStatus;
  phone: string;
  rating: number;
  completedCount: number;
}

export interface DeliveryHistoryItem {
  status: DeliveryStatus;
  timestamp: string;
}

export interface Delivery {
  id: string;
  address: string;
  clientName: string;
  destinationCity: string; // E.g., 'Paulo Afonso - BA', 'Delmiro Gouveia - AL', etc.
  isNonStandard: boolean; // Fora do padrão (adds surcharge)
  extraSurcharge: number; // Value added to the base rate
  driverId: string | null;
  status: DeliveryStatus;
  value: number; // Total value = baseCityRate + extraSurcharge
  createdAt: string;
  updatedAt: string;
  notes?: string;
  coords: { x: number; y: number }; // Relative coordinates on our neat interactive custom maps panel
  history: DeliveryHistoryItem[];
  paymentStatus: PaymentStatus;
  paymentDate?: string;
}

export interface FortnightlyLedgerRecord {
  id: string; // `${year}-${month}-${fortnight}-${driverId}`
  year: number;
  month: number; // 0-indexed (0 = Jan, 11 = Dec)
  fortnight: 1 | 2;
  driverId: string;
  standardCount: number;      // Concluídas padrão
  nonStandardCount: number;   // Concluídas fora do padrão
  occurrencesCount: number;   // Ocorrências
  pendingCount: number;       // Pendentes
  isPaid: boolean;
  paymentDate?: string;
  payoutAmount: number;       // Calculated total pay
  debitAdvance?: number;      // Adiantamento
  debitFuel?: number;         // Combustível
  debitLoss?: number;         // Multa/Extravio
  extra?: number;             // Valor Extra manual
}



