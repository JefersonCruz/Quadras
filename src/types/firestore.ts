
import type { Timestamp } from "firebase/firestore";

export interface Empresa {
  id?: string;
  nome: string;
  cnpj: string;
  email: string;
  telefone: string;
  endereco: string;
  site?: string;
  instagram?: string;
  facebook?: string;
  whatsapp?: string;
  logotipo?: string; // URL
  owner: string; // UID
}

export interface Cliente {
  id?: string;
  nome: string;
  email?: string;
  telefone?: string;
  endereco?: string;
  owner: string; // UID
}

export interface Circuito {
  nome: string;
  descricao: string;
  // Add other circuit properties as needed
}

export interface FichaTecnica {
  id?: string;
  owner: string; // UID
  clienteId: string;
  projetoId: string;
  descricao: string;
  circuitos: Circuito[];
  dataCriacao: Timestamp;
  pdfUrl?: string;
}

export interface Etiqueta {
  id?: string;
  createdBy: string; // UID
  clienteId: string;
  projetoId: string;
  tipo: string; // e.g., 'Quadro', 'Tomada', 'Interruptor'
  qrCode?: string; // URL
  circuito: string; // Reference to a circuito name/id
  posicao: string; // e.g., 'QDC-01', 'Sala-T01'
}

export interface Projeto {
  id?: string;
  nome: string;
  descricao?: string;
  clienteId: string;
  owner: string; // UID
  status: 'Planejamento' | 'Em Andamento' | 'Concluído' | 'Cancelado';
  dataCriacao: Timestamp;
}

export interface Usuario {
  id?: string; // UID
  email: string;
  nome?: string;
  role?: 'user' | 'admin';
  // empresaId?: string; // If user is directly linked to one empresa
}

// For fichasPublicas and relatorios, if they have specific structures:
export interface FichaPublica extends FichaTecnica {
  // FichasPublicas might be a subset or denormalized version of FichaTecnica
  // Ensure it has clientID if the collection is fichasPublicas/{clienteId}
}

export interface Relatorio {
  id?: string;
  owner: string; // UID
  projetoId?: string;
  clienteId?: string;
  tipo: string; // e.g., 'Progresso Projeto', 'Consumo Material'
  dataGeracao: Timestamp;
  conteudo: any; // Could be structured data or URL to a generated file
  pdfUrl?: string;
}
