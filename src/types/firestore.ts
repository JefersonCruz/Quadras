
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

// Updated Circuito for FichaTecnica
export interface CircuitoFicha {
  nome: string; // Nome/Tipo do circuito (e.g., Iluminação, Tomadas Cozinha)
  disjuntor: string; // Especificação do disjuntor (e.g., "25A Curva C")
  caboMM: string; // Bitola do cabo (e.g., "2.5mm²")
  observacoes?: string; // Observações específicas do circuito
}

// Updated FichaTecnica
export interface FichaTecnica {
  id?: string;
  owner: string; // UID
  clienteId: string;
  projetoId: string;

  // Seção 1: Cabeçalho e Identificação
  logotipoEmpresaUrl?: string;
  nomeEmpresa?: string; // Preenchido a partir dos dados da empresa do usuário
  tituloFicha: string; // Ex: "FICHA TÉCNICA – QUADRO DE DISTRIBUIÇÃO"
  identificacaoLocal: string; // Ex: "Bloco A - Ap 204"
  dataInstalacao: Timestamp;
  responsavelTecnico: string; // Ex: "Eng. Eletricista João Marques" (Padrão: user.displayName)
  versaoFicha: string; // Ex: "v1.0" (Gerado automaticamente)

  // Seção 2: Tabela de Distribuição dos Circuitos
  circuitos: CircuitoFicha[];

  // Seção 3: Observações Técnicas
  observacaoNBR?: string; // Texto fixo: "Conforme NBR 5410"
  observacaoDR?: boolean;
  descricaoDROpcional?: string;

  // Seção 4: QR Code e Acesso (Placeholders for now)
  qrCodeUrl?: string; // URL do QR Code gerado
  textoAcessoOnline?: string; // Texto fixo: "Acesso aos projetos online"
  linkFichaPublica?: string; // URL pública da ficha

  // Seção 5: Assinatura e Contato
  nomeEletricista: string; // Padrão: user.displayName
  assinaturaEletricistaUrl?: string; // URL da imagem da assinatura
  contatoEletricista: string; // WhatsApp/Telefone
  ramalPortaria?: string;

  dataCriacao: Timestamp; // Data de criação do documento no Firestore
  pdfUrl?: string; // URL do PDF gerado (futuro)
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
  tipoPlano?: "gratuito" | "premium"; // Added tipoPlano
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
