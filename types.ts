
export enum CarSize {
  SMALL = 'Pequeno',
  MEDIUM = 'Médio',
  LARGE = 'Grande'
}

export enum PaymentMethod {
  DINHEIRO = 'Dinheiro',
  CARTAO = 'Cartão',
  PIX = 'Pix'
}

export type UserRole = 'admin' | 'client' | null;

export interface User {
  id: string;
  name: string;
  phone: string; // Usado como Login
  password?: string;
  role: UserRole;
  points: number; // Fidelidade
}

export interface Vehicle {
  id: string;
  userId: string;
  brand: string; // Marca (ex: Honda)
  model: string; // Modelo (ex: Civic)
  year: string;
  color: string;
  plate?: string;
  size: CarSize;
}

export type AgendamentoStatus = 'pendente' | 'confirmado' | 'concluido' | 'cancelado';

export interface Agendamento {
  id: string;
  userId?: string; 
  clienteNome: string;
  clienteTelefone: string;
  servico: string;
  valor: number;
  dataAgendamento: string;
  status: AgendamentoStatus;
  criadoEm: string;
  veiculoSnapshot?: string; // Ex: "Honda Civic Branco (ABC-1234)"
}

export interface Faturamento {
  id: string;
  tipoLavagem: string;
  porte: CarSize;
  valor: number;
  pagamento: PaymentMethod;
  data: string; // ISO string contendo data e hora
}

export interface Despesa {
  id: string;
  valor: number;
  observacao: string;
  data: string;
}

export interface ServiceItem {
  id: string;
  label: string;
  description: string;
  price: number;
}

export interface FinancialSummary {
  totalFaturamento: number;
  totalDespesas: number;
  lucro: number;
}
